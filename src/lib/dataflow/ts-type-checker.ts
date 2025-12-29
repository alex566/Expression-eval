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
 * Uses TypeScript AST factory API directly for type inference
 */
export class TSTypeChecker {
	private compilerOptions: ts.CompilerOptions;
	private nodeIdToIdentifier: Map<string, string> = new Map();
	private identifierToNodeId: Map<string, string> = new Map();

	constructor(private registry: NodeRegistry) {
		// Configure TypeScript compiler options for type inference
		this.compilerOptions = {
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			strict: false,  // Relax strict mode for simpler type checking
			noEmit: true,
			skipLibCheck: true,
			skipDefaultLibCheck: true,
			noLib: true,  // Don't require lib.d.ts
			types: [],
		};
	}

	/**
	 * Type check a graph and infer types using TypeScript AST API directly
	 */
	async checkGraph(graph: Graph): Promise<TSTypeCheckResult> {
		const errors: string[] = [];
		const warnings: string[] = [];
		const inferredTypes: Record<string, TSTypeInfo> = {};

		try {
			// Clear the mappings for this graph
			this.nodeIdToIdentifier.clear();
			this.identifierToNodeId.clear();

			// 1. Build TypeScript AST directly from graph using factory API
			const statements = this.buildASTFromGraph(graph);

			// 2. Convert AST to source file using printer
			// This is more reliable than factory.createSourceFile
			const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
			const resultFile = ts.createSourceFile(
				'temp.ts',
				'',
				ts.ScriptTarget.ESNext,
				false,
				ts.ScriptKind.TS
			);
			
			// Print each statement and collect the source code
			const sourceCode = statements.map(stmt => 
				printer.printNode(ts.EmitHint.Unspecified, stmt, resultFile)
			).join('\n');

			// 3. Create the actual source file from the generated code
			const sourceFile = ts.createSourceFile(
				'graph.ts',
				sourceCode,
				ts.ScriptTarget.ESNext,
				true,
				ts.ScriptKind.TS
			);

			// 4. Create a minimal program for type checking
			const host: ts.CompilerHost = {
				getSourceFile: (fileName: string) => {
					if (fileName === 'graph.ts') {
						return sourceFile;
					}
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

			const program = ts.createProgram({
				rootNames: ['graph.ts'],
				options: this.compilerOptions,
				host,
			});

			// 5. Get type checker
			const checker = program.getTypeChecker();

			// 6. Collect diagnostics (errors/warnings)
			const diagnostics = ts.getPreEmitDiagnostics(program);
			for (const diagnostic of diagnostics) {
				const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
				
				// Filter out global type errors from missing lib.d.ts
				if (message.startsWith('Cannot find global type') || message.includes('lib.d.ts')) {
					continue;
				}
				
				if (diagnostic.category === ts.DiagnosticCategory.Error) {
					errors.push(message);
				} else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
					warnings.push(message);
				}
			}

			// 7. Extract inferred types from the AST
			this.extractInferredTypesFromAST(sourceFile, checker, graph, inferredTypes);

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
	 * Build TypeScript AST directly from graph structure using factory API
	 */
	private buildASTFromGraph(graph: Graph): ts.Statement[] {
		const statements: ts.Statement[] = [];
		const factory = ts.factory;

		// Create a module declaration to encapsulate the graph
		const moduleStatements: ts.Statement[] = [];

		// 1. Generate variable declarations for node outputs
		for (const node of graph.nodes) {
			const definition = this.registry.get(node.type);
			if (!definition) continue;

			// Generate variable declarations for node outputs
			if (definition.outputs && definition.outputs.length > 0) {
				for (const output of definition.outputs) {
					const varName = this.getIdentifierForPort(node.id, output.name);
					const tsType = this.parseTypeString(output.type);
					
					// Create: let varName: type;
					const declaration = factory.createVariableDeclaration(
						factory.createIdentifier(varName),
						undefined,
						tsType,
						undefined
					);

					const varStatement = factory.createVariableStatement(
						undefined,
						factory.createVariableDeclarationList(
							[declaration],
							ts.NodeFlags.Let
						)
					);

					moduleStatements.push(varStatement);
				}
			}

			// For Value nodes, create initialized variable with inferred type
			if (node.type === 'Value' && node.data.value !== undefined) {
				const varName = this.getIdentifierForPort(node.id, 'out');
				const inferredType = this.inferTSTypeFromValue(node.data.value);
				const valueExpression = this.valueToExpression(node.data.value);
				const typeNode = this.parseTypeString(inferredType);

				// Create: varName = value as type;
				const asExpression = factory.createAsExpression(
					valueExpression,
					typeNode
				);

				const assignment = factory.createExpressionStatement(
					factory.createBinaryExpression(
						factory.createIdentifier(varName),
						factory.createToken(ts.SyntaxKind.EqualsToken),
						asExpression
					)
				);

				moduleStatements.push(assignment);
			}
		}

		// 2. Generate assignments based on edges (data flow)
		for (const edge of graph.edges) {
			const fromVar = this.getIdentifierForPort(edge.from.node, edge.from.port);
			const toVar = this.getIdentifierForPort(edge.to.node, `input_${edge.to.port}`);

			// Create: let toVar = fromVar;
			const declaration = factory.createVariableDeclaration(
				factory.createIdentifier(toVar),
				undefined,
				undefined,
				factory.createIdentifier(fromVar)
			);

			const varStatement = factory.createVariableStatement(
				undefined,
				factory.createVariableDeclarationList(
					[declaration],
					ts.NodeFlags.Let
				)
			);

			moduleStatements.push(varStatement);
		}

		// Create a module declaration to wrap all statements
		const moduleDecl = factory.createModuleDeclaration(
			undefined,
			factory.createIdentifier('DataflowGraph'),
			factory.createModuleBlock(moduleStatements),
			ts.NodeFlags.Namespace
		);

		statements.push(moduleDecl);

		return statements;
	}

	/**
	 * Extract inferred types from TypeScript AST
	 */
	private extractInferredTypesFromAST(
		sourceFile: ts.SourceFile,
		checker: ts.TypeChecker,
		graph: Graph,
		inferredTypes: Record<string, TSTypeInfo>
	): void {
		// Visit all variable declarations and extract their types
		const visit = (node: ts.Node) => {
			if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
				const identifierText = node.name.text;
				
				// Get the type from the type checker
				const type = checker.getTypeAtLocation(node);
				const typeString = checker.typeToString(type);
				
				// Map back to graph node.port format
				const portInfo = this.getPortFromIdentifier(identifierText);
				if (portInfo) {
					const key = `${portInfo.nodeId}.${portInfo.portName}`;
					inferredTypes[key] = {
						type: typeString,
						isInferred: !node.type, // If no explicit type annotation, it's inferred
						source: `node:${portInfo.nodeId}`,
					};
				}
			}
			
			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
	}

	/**
	 * Get a unique identifier for a node's port
	 */
	private getIdentifierForPort(nodeId: string, portName: string): string {
		const identifier = `${this.sanitizeIdentifier(nodeId)}_${portName}`;
		this.identifierToNodeId.set(identifier, nodeId);
		this.nodeIdToIdentifier.set(`${nodeId}.${portName}`, identifier);
		return identifier;
	}

	/**
	 * Get port information from an identifier
	 */
	private getPortFromIdentifier(identifier: string): { nodeId: string; portName: string } | null {
		const match = identifier.match(/^(.+?)_(.+)$/);
		if (match) {
			const sanitizedNodeId = match[1];
			const portPart = match[2];
			const nodeId = this.unsanitizeIdentifier(sanitizedNodeId);
			const portName = portPart.startsWith('input_') 
				? portPart.substring(6) 
				: portPart;
			
			return { nodeId, portName };
		}
		return null;
	}

	/**
	 * Parse a type string into a TypeScript type node
	 */
	private parseTypeString(typeStr: string): ts.TypeNode {
		const factory = ts.factory;

		// Handle basic types
		switch (typeStr) {
			case 'number':
				return factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
			case 'string':
				return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
			case 'boolean':
				return factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
			case 'any':
				return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
			case 'void':
				return factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
			case 'Date':
				return factory.createTypeReferenceNode(
					factory.createIdentifier('Date'),
					undefined
				);
			default:
				// For complex types, we need to parse them
				// For now, handle array types
				if (typeStr.endsWith('[]')) {
					const elementType = typeStr.slice(0, -2);
					return factory.createArrayTypeNode(
						this.parseTypeString(elementType)
					);
				}
				// For object types and other complex types, fallback to any
				return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
		}
	}

	/**
	 * Convert a runtime value to a TypeScript expression
	 */
	private valueToExpression(value: any): ts.Expression {
		const factory = ts.factory;

		if (value === null) {
			return factory.createNull();
		}
		if (value === undefined) {
			return factory.createIdentifier('undefined');
		}
		if (typeof value === 'number') {
			return factory.createNumericLiteral(value.toString());
		}
		if (typeof value === 'string') {
			return factory.createStringLiteral(value);
		}
		if (typeof value === 'boolean') {
			return value ? factory.createTrue() : factory.createFalse();
		}
		if (Array.isArray(value)) {
			return factory.createArrayLiteralExpression(
				value.map(v => this.valueToExpression(v))
			);
		}
		if (typeof value === 'object') {
			const properties = Object.entries(value).map(([key, val]) => {
				// Use string literal for keys that aren't valid identifiers
				const propertyName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
					? factory.createIdentifier(key)
					: factory.createStringLiteral(key);
				return factory.createPropertyAssignment(
					propertyName,
					this.valueToExpression(val)
				);
			});
			return factory.createObjectLiteralExpression(properties);
		}

		// Fallback to null for unsupported types
		return factory.createNull();
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
		const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
		// Store mapping for reverse lookup
		this.identifierToNodeId.set(sanitized, id);
		this.nodeIdToIdentifier.set(id, sanitized);
		return sanitized;
	}

	/**
	 * Reverse sanitization to get original node ID
	 */
	private unsanitizeIdentifier(sanitized: string): string {
		// Use stored mapping to get original ID
		return this.identifierToNodeId.get(sanitized) || sanitized;
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
