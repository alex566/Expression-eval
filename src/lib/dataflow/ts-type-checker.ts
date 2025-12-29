import ts from 'typescript';
import type { Graph, GraphNode, GraphEdge, NodeRegistry, NodeDefinition, FunctionDefinition } from './types';

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
	 * Enhanced to handle function definitions and infer generic types
	 */
	private buildASTFromGraph(graph: Graph): ts.Statement[] {
		const statements: ts.Statement[] = [];
		const factory = ts.factory;

		// Create a module declaration to encapsulate the graph
		const moduleStatements: ts.Statement[] = [];

		// 0. Generate function type declarations if functions are defined
		if (graph.functions && graph.functions.length > 0) {
			for (const func of graph.functions) {
				// Infer function signature from the function's graph
				const funcSignature = this.inferFunctionSignature(func);
				
				// Create a type alias for the function: type FuncName = (input: InputType) => OutputType
				const funcTypeAlias = factory.createTypeAliasDeclaration(
					undefined,
					factory.createIdentifier(`${this.sanitizeIdentifier(func.name)}_Type`),
					undefined,
					funcSignature
				);
				
				moduleStatements.push(funcTypeAlias);
			}
		}

		// 1. Generate variable declarations for node outputs with enhanced type inference
		for (const node of graph.nodes) {
			const definition = this.registry.get(node.type);
			if (!definition) continue;

			// For Value nodes, create initialized variable with inferred type
			// This must come BEFORE generating output declarations to allow proper inference
			if (node.type === 'Value' && node.data.value !== undefined) {
				const varName = this.getIdentifierForPort(node.id, 'out');
				const inferredType = this.inferTSTypeFromValue(node.data.value);
				const valueExpression = this.valueToExpression(node.data.value);
				const typeNode = this.parseTypeString(inferredType);

				// Create: let varName = value as type; (with explicit type for clarity)
				const declaration = factory.createVariableDeclaration(
					factory.createIdentifier(varName),
					undefined,
					typeNode,  // Explicit type annotation for better inference
					factory.createAsExpression(valueExpression, typeNode)
				);

				const varStatement = factory.createVariableStatement(
					undefined,
					factory.createVariableDeclarationList(
						[declaration],
						ts.NodeFlags.Let
					)
				);

				moduleStatements.push(varStatement);
				continue; // Skip the general output handling for Value nodes
			}

			// Generate variable declarations for node outputs
			if (definition.outputs && definition.outputs.length > 0) {
				for (const output of definition.outputs) {
					const varName = this.getIdentifierForPort(node.id, output.name);
					let tsType: ts.TypeNode;
					
					// Special handling for array operation nodes to infer proper generic types
					if (node.type === 'Map' && output.name === 'out') {
						// Map output type should be inferred from input array and function
						tsType = this.inferMapOutputType(node, graph) || this.parseTypeString(output.type);
					} else if (node.type === 'Filter' && output.name === 'out') {
						// Filter output type is same as input array type
						tsType = this.inferFilterOutputType(node, graph) || this.parseTypeString(output.type);
					} else if (node.type === 'Reduce' && output.name === 'out') {
						// Reduce output type should be inferred from initial value or function return type
						tsType = this.inferReduceOutputType(node, graph) || this.parseTypeString(output.type);
					} else {
						tsType = this.parseTypeString(output.type);
					}
					
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
	 * Infer function signature from a function's graph structure
	 * TODO: Currently returns generic (input: any) => any signature.
	 * Future enhancement: Analyze FunctionInput and Output nodes to infer precise types.
	 */
	private inferFunctionSignature(func: FunctionDefinition): ts.TypeNode {
		const factory = ts.factory;
		
		// Find FunctionInput node to determine input type
		const inputNode = func.graph.nodes.find(n => n.type === 'FunctionInput');
		
		// Find Output node to determine return type
		const outputNode = func.graph.nodes.find(n => n.type === 'Output');
		
		// TODO: Extract actual input type from FunctionInput node's data or connected edges
		// This would require analyzing the function's graph structure
		let inputType: ts.TypeNode = factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
		
		// TODO: Extract actual return type from Output node's inputs
		// This would require tracing back through the graph to find the output value type
		let returnType: ts.TypeNode = factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
		
		// Create a function type: (input: InputType) => ReturnType
		return factory.createFunctionTypeNode(
			undefined,
			[factory.createParameterDeclaration(
				undefined,
				undefined,
				factory.createIdentifier('input'),
				undefined,
				inputType,
				undefined
			)],
			returnType
		);
	}

	/**
	 * Infer output type for Map operation based on input array and transform function
	 */
	private inferMapOutputType(node: GraphNode, graph: Graph): ts.TypeNode | null {
		const factory = ts.factory;
		
		// Find the input array edge
		const arrayEdge = graph.edges.find(e => e.to.node === node.id && e.to.port === 'array');
		if (!arrayEdge) return null;
		
		// Get the source node
		const sourceNode = graph.nodes.find(n => n.id === arrayEdge.from.node);
		if (!sourceNode) return null;
		
		// If source is a Value node with an array, infer element type
		if (sourceNode.type === 'Value' && Array.isArray(sourceNode.data.value)) {
			const arrayValue = sourceNode.data.value;
			if (arrayValue.length === 0) {
				return factory.createArrayTypeNode(
					factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
				);
			}
			
			// The output type after map is still an array
			// For now, we return the same element type (transform function type inference would be complex)
			const inferredType = this.inferTSTypeFromValue(arrayValue);
			return this.parseTypeString(inferredType);
		}
		
		return null;
	}

	/**
	 * Infer output type for Filter operation - same as input array type
	 */
	private inferFilterOutputType(node: GraphNode, graph: Graph): ts.TypeNode | null {
		const factory = ts.factory;
		
		// Find the input array edge
		const arrayEdge = graph.edges.find(e => e.to.node === node.id && e.to.port === 'array');
		if (!arrayEdge) return null;
		
		// Get the source node
		const sourceNode = graph.nodes.find(n => n.id === arrayEdge.from.node);
		if (!sourceNode) return null;
		
		// If source is a Value node with an array, infer the same type
		if (sourceNode.type === 'Value' && Array.isArray(sourceNode.data.value)) {
			const inferredType = this.inferTSTypeFromValue(sourceNode.data.value);
			return this.parseTypeString(inferredType);
		}
		
		return null;
	}

	/**
	 * Infer output type for Reduce operation from initial value
	 */
	private inferReduceOutputType(node: GraphNode, graph: Graph): ts.TypeNode | null {
		const factory = ts.factory;
		
		// Find the initial value edge
		const initialEdge = graph.edges.find(e => e.to.node === node.id && e.to.port === 'initial');
		if (!initialEdge) return null;
		
		// Get the source node
		const sourceNode = graph.nodes.find(n => n.id === initialEdge.from.node);
		if (!sourceNode) return null;
		
		// If source is a Value node, infer type from the value
		if (sourceNode.type === 'Value' && sourceNode.data.value !== undefined) {
			const inferredType = this.inferTSTypeFromValue(sourceNode.data.value);
			return this.parseTypeString(inferredType);
		}
		
		return null;
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
				let typeString = checker.typeToString(type);
				
				// TypeScript sometimes returns "{}" for array types in certain contexts
				// If we see "{}" but the node has an array type annotation, use that instead
				if (typeString === '{}' && node.type) {
					// Try to extract the type from the type annotation
					const typeNode = node.type;
					if (ts.isArrayTypeNode(typeNode) || ts.isTypeReferenceNode(typeNode)) {
						typeString = node.type.getText();
					}
				}
				
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
	 * Enhanced to handle union types, object types, and complex generics
	 */
	private parseTypeString(typeStr: string): ts.TypeNode {
		const factory = ts.factory;
		const trimmed = typeStr.trim();

		// Handle basic types
		switch (trimmed) {
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
			case 'object':
				return factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword);
			case 'Date':
				return factory.createTypeReferenceNode(
					factory.createIdentifier('Date'),
					undefined
				);
		}

		// Handle union types (e.g., "number | string" or "(number | string)[]")
		if (trimmed.includes(' | ')) {
			// Check if the union is wrapped in parentheses followed by []
			const arrayMatch = trimmed.match(/^\((.+)\)\[\]$/);
			if (arrayMatch) {
				// Handle "(type1 | type2)[]"
				const unionTypes = arrayMatch[1].split('|').map(t => this.parseTypeString(t.trim()));
				return factory.createArrayTypeNode(
					factory.createUnionTypeNode(unionTypes)
				);
			}
			
			// Handle regular union types "type1 | type2"
			const unionTypes = trimmed.split('|').map(t => this.parseTypeString(t.trim()));
			return factory.createUnionTypeNode(unionTypes);
		}

		// Handle array types with [] syntax
		if (trimmed.endsWith('[]')) {
			const elementType = trimmed.slice(0, -2).trim();
			// Handle nested arrays
			return factory.createArrayTypeNode(
				this.parseTypeString(elementType)
			);
		}

		// Handle Array<T> generic syntax
		const genericArrayMatch = trimmed.match(/^Array<(.+)>$/);
		if (genericArrayMatch) {
			const elementType = genericArrayMatch[1].trim();
			return factory.createTypeReferenceNode(
				factory.createIdentifier('Array'),
				[this.parseTypeString(elementType)]
			);
		}

		// Handle object types like "{ x: number; y: string }"
		if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
			const propsStr = trimmed.slice(1, -1).trim();
			if (propsStr.length === 0) {
				// Empty object type {}
				return factory.createTypeLiteralNode([]);
			}
			
			// Parse property signatures
			const properties: ts.TypeElement[] = [];
			// Split by semicolon or comma, handling nested types
			const propParts = this.splitObjectProperties(propsStr);
			
			for (const propPart of propParts) {
				const colonIndex = propPart.indexOf(':');
				if (colonIndex > 0) {
					const propName = propPart.slice(0, colonIndex).trim();
					const propType = propPart.slice(colonIndex + 1).trim();
					
					properties.push(
						factory.createPropertySignature(
							undefined,
							factory.createIdentifier(propName),
							undefined,
							this.parseTypeString(propType)
						)
					);
				}
			}
			
			return factory.createTypeLiteralNode(properties);
		}

		// Handle Record<K, V> generic syntax
		const recordMatch = trimmed.match(/^Record<(.+),\s*(.+)>$/);
		if (recordMatch) {
			const keyType = recordMatch[1].trim();
			const valueType = recordMatch[2].trim();
			return factory.createTypeReferenceNode(
				factory.createIdentifier('Record'),
				[this.parseTypeString(keyType), this.parseTypeString(valueType)]
			);
		}

		// Handle function types like "(element: T) => U"
		// TODO: Implement full function type parsing for better type safety
		// This would require parsing parameter types and return types separately
		if (trimmed.includes('=>')) {
			// For now, treat function types as 'any' to avoid complexity
			// Full implementation would parse: (param: Type) => ReturnType
			return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
		}

		// Handle type parameters (T, U, etc.) as identifiers
		if (/^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
			return factory.createTypeReferenceNode(
				factory.createIdentifier(trimmed),
				undefined
			);
		}

		// For other complex types, fallback to any
		return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
	}

	/**
	 * Split object property signatures, handling nested types
	 */
	private splitObjectProperties(propsStr: string): string[] {
		const properties: string[] = [];
		let current = '';
		let depth = 0;
		
		for (let i = 0; i < propsStr.length; i++) {
			const char = propsStr[i];
			
			if (char === '{' || char === '(' || char === '<') {
				depth++;
				current += char;
			} else if (char === '}' || char === ')' || char === '>') {
				depth--;
				current += char;
			} else if ((char === ';' || char === ',') && depth === 0) {
				if (current.trim().length > 0) {
					properties.push(current.trim());
				}
				current = '';
			} else {
				current += char;
			}
		}
		
		if (current.trim().length > 0) {
			properties.push(current.trim());
		}
		
		return properties;
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
			// Infer array element type from ALL elements, not just the first
			// This provides more accurate type inference for heterogeneous arrays
			const elementTypes = new Set<string>();
			for (const element of value) {
				elementTypes.add(this.inferTSTypeFromValue(element));
			}
			
			// If all elements have the same type, use that type
			if (elementTypes.size === 1) {
				const elementType = Array.from(elementTypes)[0];
				return `${elementType}[]`;
			}
			
			// If elements have different types, create a union type
			const unionType = Array.from(elementTypes).join(' | ');
			return `(${unionType})[]`;
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
	 * Enhanced to handle union types, array types, and object types
	 */
	areTypesCompatible(sourceType: string, targetType: string): boolean {
		// Clean up types
		const cleanSource = sourceType.trim();
		const cleanTarget = targetType.trim();

		// 'any' is compatible with everything
		if (cleanTarget === 'any' || cleanSource === 'any') {
			return true;
		}

		// Direct match
		if (cleanSource === cleanTarget) {
			return true;
		}

		// Handle union types in target - source must be compatible with at least one target type
		if (cleanTarget.includes(' | ')) {
			const targetTypes = this.parseUnionTypes(cleanTarget);
			return targetTypes.some(t => this.areTypesCompatible(cleanSource, t));
		}

		// Handle union types in source - all source types must be compatible with target
		if (cleanSource.includes(' | ')) {
			const sourceTypes = this.parseUnionTypes(cleanSource);
			return sourceTypes.every(t => this.areTypesCompatible(t, cleanTarget));
		}

		// Handle array types - check element type compatibility
		const sourceArrayMatch = cleanSource.match(/^(.+)\[\]$|^Array<(.+)>$/);
		const targetArrayMatch = cleanTarget.match(/^(.+)\[\]$|^Array<(.+)>$/);
		
		if (sourceArrayMatch && targetArrayMatch) {
			const sourceElementType = (sourceArrayMatch[1] || sourceArrayMatch[2]).trim();
			const targetElementType = (targetArrayMatch[1] || targetArrayMatch[2]).trim();
			return this.areTypesCompatible(sourceElementType, targetElementType);
		}

		// If target is array but source is not, they're incompatible
		if (targetArrayMatch && !sourceArrayMatch) {
			return false;
		}

		// Handle 'array' as generic array type (backwards compatibility)
		if (cleanTarget === 'array' && sourceArrayMatch) {
			return true;
		}
		if (cleanSource === 'array' && targetArrayMatch) {
			return true;
		}

		// Handle object types - check structural compatibility
		// TODO: Implement proper structural type checking for object literal types
		// This is a simplification - should parse and compare property signatures
		if (cleanSource.startsWith('{') && cleanTarget.startsWith('{')) {
			// Accept if both are object types (permissive for now)
			// Full implementation would compare property names and types
			return true;
		}

		// Handle 'object' keyword type
		if (cleanTarget === 'object' && (cleanSource.startsWith('{') || cleanSource.startsWith('Record<'))) {
			return true;
		}

		// Handle Record types
		// TODO: Parse and validate key/value type compatibility
		// Currently: Record<string, number> and Record<number, string> would both pass
		if (cleanSource.startsWith('Record<') && cleanTarget.startsWith('Record<')) {
			// Accept matching Record types (permissive for now)
			// Full implementation would extract and compare K and V types
			return true;
		}

		// No match
		return false;
	}

	/**
	 * Parse union types, handling parentheses
	 */
	private parseUnionTypes(unionType: string): string[] {
		const trimmed = unionType.trim();
		
		// Handle parenthesized union types like "(number | string)[]"
		if (trimmed.startsWith('(') && trimmed.includes(')')) {
			const parenEnd = trimmed.indexOf(')');
			const innerUnion = trimmed.slice(1, parenEnd);
			return innerUnion.split('|').map(t => t.trim());
		}
		
		// Handle regular union types
		const types: string[] = [];
		let current = '';
		let depth = 0;
		
		for (let i = 0; i < trimmed.length; i++) {
			const char = trimmed[i];
			
			if (char === '<' || char === '(' || char === '{') {
				depth++;
				current += char;
			} else if (char === '>' || char === ')' || char === '}') {
				depth--;
				current += char;
			} else if (char === '|' && depth === 0) {
				if (current.trim().length > 0) {
					types.push(current.trim());
				}
				current = '';
			} else {
				current += char;
			}
		}
		
		if (current.trim().length > 0) {
			types.push(current.trim());
		}
		
		return types;
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
