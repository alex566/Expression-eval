import ts from 'typescript';
import type { Graph, GraphNode, GraphEdge, NodeRegistry, NodeDefinition } from './types';

/**
 * TypeScript-based type information
 */
export interface TSTypeInfo {
	/** TypeScript type as string (e.g., "number", "string[]", "{ x: number; y: string }") */
	type: string;
	/** Whether this type was explicitly declared or inferred */
	isInferred: boolean;
	/** Source of the type (node output, constant value, etc.) */
	source: string;
}

/**
 * Type checking result from TypeScript compiler
 */
export interface TSTypeCheckResult {
	success: boolean;
	/** Inferred types for each port (node.port -> type info) */
	inferredTypes: Record<string, TSTypeInfo>;
	/** Type errors from TypeScript compiler */
	errors: string[];
	/** Type warnings */
	warnings: string[];
}

/**
 * TypeScript-based type checker service
 * Converts graph structure to TypeScript AST and uses TS compiler for type inference
 */
export class TSTypeChecker {
	private compilerHost: ts.CompilerHost;
	private compilerOptions: ts.CompilerOptions;

	constructor(private registry: NodeRegistry) {
		// Configure TypeScript compiler options for type inference
		this.compilerOptions = {
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			strict: true,
			noEmit: true,
			skipLibCheck: true,
			skipDefaultLibCheck: true,
			types: [],
		};

		// Create a simple in-memory compiler host
		this.compilerHost = {
			getSourceFile: (fileName: string, languageVersion: ts.ScriptTarget) => {
				// We'll provide source files dynamically
				return undefined;
			},
			getDefaultLibFileName: () => 'lib.d.ts',
			writeFile: () => {},
			getCurrentDirectory: () => '',
			getCanonicalFileName: (fileName) => fileName,
			useCaseSensitiveFileNames: () => true,
			getNewLine: () => '\n',
			fileExists: () => true,
			readFile: () => '',
		};
	}

	/**
	 * Type check a graph and infer types using TypeScript compiler
	 */
	async checkGraph(graph: Graph): Promise<TSTypeCheckResult> {
		const errors: string[] = [];
		const warnings: string[] = [];
		const inferredTypes: Record<string, TSTypeInfo> = {};

		try {
			// 1. Build TypeScript code from graph
			const tsCode = this.graphToTypeScript(graph);

			// 2. Create a source file from the generated code
			const sourceFile = ts.createSourceFile(
				'graph.ts',
				tsCode,
				ts.ScriptTarget.ESNext,
				true,
				ts.ScriptKind.TS
			);

			// 3. Create a program for type checking
			const program = ts.createProgram({
				rootNames: ['graph.ts'],
				options: this.compilerOptions,
				host: {
					...this.compilerHost,
					getSourceFile: (fileName: string) => {
						if (fileName === 'graph.ts') {
							return sourceFile;
						}
						return undefined;
					},
				},
			});

			// 4. Get type checker
			const checker = program.getTypeChecker();

			// 5. Collect diagnostics (errors/warnings)
			const diagnostics = ts.getPreEmitDiagnostics(program);
			for (const diagnostic of diagnostics) {
				if (diagnostic.file && diagnostic.start !== undefined) {
					const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
					const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
					
					if (diagnostic.category === ts.DiagnosticCategory.Error) {
						errors.push(`Line ${line + 1}: ${message}`);
					} else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
						warnings.push(`Line ${line + 1}: ${message}`);
					}
				} else {
					const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
					if (diagnostic.category === ts.DiagnosticCategory.Error) {
						errors.push(message);
					} else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
						warnings.push(message);
					}
				}
			}

			// 6. Extract inferred types from the generated code
			this.extractInferredTypes(sourceFile, checker, graph, inferredTypes);

			return {
				success: errors.length === 0,
				inferredTypes,
				errors,
				warnings,
			};
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
			return {
				success: false,
				inferredTypes,
				errors,
				warnings,
			};
		}
	}

	/**
	 * Convert graph structure to TypeScript code for type checking
	 */
	private graphToTypeScript(graph: Graph): string {
		const lines: string[] = [];
		
		// Generate TypeScript code that represents the graph structure
		lines.push('// Generated TypeScript code from dataflow graph');
		lines.push('');

		// Create a namespace to encapsulate the graph
		lines.push('namespace DataflowGraph {');

		// 1. Generate type definitions for node outputs
		for (const node of graph.nodes) {
			const definition = this.registry.get(node.type);
			if (!definition) continue;

			// Generate variable declarations for node outputs
			if (definition.outputs && definition.outputs.length > 0) {
				for (const output of definition.outputs) {
					const varName = `${this.sanitizeIdentifier(node.id)}_${output.name}`;
					const tsType = this.mapDataTypeToTS(output.type);
					lines.push(`  let ${varName}: ${tsType};`);
				}
			}

			// For Value nodes, infer type from the actual value
			if (node.type === 'Value' && node.data.value !== undefined) {
				const varName = `${this.sanitizeIdentifier(node.id)}_out`;
				const inferredType = this.inferTSTypeFromValue(node.data.value);
				lines.push(`  // Value node with inferred type`);
				lines.push(`  ${varName} = ${JSON.stringify(node.data.value)} as ${inferredType};`);
			}
		}

		lines.push('');

		// 2. Generate assignments based on edges (data flow)
		for (const edge of graph.edges) {
			const fromVar = `${this.sanitizeIdentifier(edge.from.node)}_${edge.from.port}`;
			const toVar = `${this.sanitizeIdentifier(edge.to.node)}_input_${edge.to.port}`;
			
			lines.push(`  let ${toVar} = ${fromVar};`);
		}

		lines.push('}');
		lines.push('');

		return lines.join('\n');
	}

	/**
	 * Extract inferred types from TypeScript AST
	 */
	private extractInferredTypes(
		sourceFile: ts.SourceFile,
		checker: ts.TypeChecker,
		graph: Graph,
		inferredTypes: Record<string, TSTypeInfo>
	): void {
		// Visit all variable declarations and extract their types
		const visit = (node: ts.Node) => {
			if (ts.isVariableDeclaration(node) && node.name) {
				const symbol = checker.getSymbolAtLocation(node.name);
				if (symbol) {
					const type = checker.getTypeOfSymbolAtLocation(symbol, node);
					const typeString = checker.typeToString(type);
					const identifierText = node.name.getText(sourceFile);
					
					// Map back to graph node.port format
					const match = identifierText.match(/^(.+?)_(out|input_.+)$/);
					if (match) {
						const nodeId = this.unsanitizeIdentifier(match[1]);
						const portPart = match[2];
						const portName = portPart.startsWith('input_') 
							? portPart.substring(6) 
							: portPart;
						
						const key = `${nodeId}.${portName}`;
						inferredTypes[key] = {
							type: typeString,
							isInferred: !node.type, // If no explicit type annotation, it's inferred
							source: `node:${nodeId}`,
						};
					}
				}
			}
			
			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
	}

	/**
	 * Map our DataType to TypeScript type string
	 */
	private mapDataTypeToTS(dataType: string): string {
		// Handle union types
		if (dataType.includes(' | ')) {
			return dataType; // Already in TS union format
		}

		// Map simple types
		switch (dataType) {
			case 'number':
				return 'number';
			case 'string':
				return 'string';
			case 'boolean':
				return 'boolean';
			case 'array':
				return 'any[]';
			case 'object':
				return 'Record<string, any>';
			case 'Date':
				return 'Date';
			case 'any':
			default:
				return 'any';
		}
	}

	/**
	 * Infer TypeScript type from a runtime value
	 */
	private inferTSTypeFromValue(value: any): string {
		if (value === null || value === undefined) {
			return 'any';
		}
		if (value instanceof Date) {
			return 'Date';
		}
		if (Array.isArray(value)) {
			if (value.length === 0) {
				return 'any[]';
			}
			// Infer array element type from first element
			const elementType = this.inferTSTypeFromValue(value[0]);
			return `${elementType}[]`;
		}
		if (typeof value === 'object') {
			// Infer object shape
			const props: string[] = [];
			for (const [key, val] of Object.entries(value)) {
				const valueType = this.inferTSTypeFromValue(val);
				props.push(`${key}: ${valueType}`);
			}
			return props.length > 0 ? `{ ${props.join('; ')} }` : 'Record<string, any>';
		}
		if (typeof value === 'number') {
			return 'number';
		}
		if (typeof value === 'string') {
			return 'string';
		}
		if (typeof value === 'boolean') {
			return 'boolean';
		}
		return 'any';
	}

	/**
	 * Sanitize node ID to valid TypeScript identifier
	 */
	private sanitizeIdentifier(id: string): string {
		// Replace invalid characters with underscores
		return id.replace(/[^a-zA-Z0-9_]/g, '_');
	}

	/**
	 * Reverse sanitization to get original node ID
	 */
	private unsanitizeIdentifier(sanitized: string): string {
		// This is a simple implementation - in production, you'd need a proper mapping
		return sanitized;
	}

	/**
	 * Check if two TypeScript types are compatible
	 */
	areTypesCompatible(sourceType: string, targetType: string): boolean {
		// Use TypeScript's type checker for compatibility
		// For now, implement basic rules
		if (targetType === 'any' || sourceType === 'any') {
			return true;
		}

		// Handle union types in target
		if (targetType.includes(' | ')) {
			const targetTypes = targetType.split(' | ').map(t => t.trim());
			return targetTypes.some(t => this.areTypesCompatible(sourceType, t));
		}

		// Handle union types in source
		if (sourceType.includes(' | ')) {
			const sourceTypes = sourceType.split(' | ').map(t => t.trim());
			// All source types must be compatible with target
			return sourceTypes.every(t => this.areTypesCompatible(t, targetType));
		}

		// Direct match
		return sourceType === targetType;
	}

	/**
	 * Get a human-readable type signature for a node
	 */
	getNodeTypeSignature(node: GraphNode, definition?: NodeDefinition): string {
		if (!definition) {
			definition = this.registry.get(node.type);
		}
		if (!definition) {
			return 'unknown';
		}

		const inputs = definition.inputs?.map(i => `${i.name}: ${i.type}`).join(', ') || '';
		const outputs = definition.outputs?.map(o => `${o.name}: ${o.type}`).join(', ') || '';
		
		return `(${inputs}) => { ${outputs} }`;
	}
}
