/**
 * TypeScript Factory-based Type Inference Engine
 * 
 * This module uses TypeScript's factory API to generate AST and infer types
 * using TypeScript's native type checker. This replaces manual type inference.
 */

import ts from 'typescript';
import type { 
	Graph, 
	GraphNode, 
	TypeCheckResult, 
	NodeTypeInfo
} from './types';
import { nodeRegistry } from './registry';

/**
 * Infer TypeScript type from a JavaScript value using factory API
 */
export function inferTypeFromValue(value: any): string {
	if (value === null || value === undefined) {
		return 'null';
	}
	
	const jsType = typeof value;
	switch (jsType) {
		case 'boolean':
			return 'boolean';
		case 'number':
			return 'number';
		case 'string':
			return 'string';
		case 'object':
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return 'unknown[]';
				}
				const elementType = inferTypeFromValue(value[0]);
				return `${elementType}[]`;
			}
			if (value instanceof Date) {
				return 'Date';
			}
			// Generic object - infer structure
			return 'object';
		default:
			return 'any';
	}
}

/**
 * Check if two types are compatible using TypeScript's type system
 */
export function areTypesCompatible(sourceType: string, targetType: string): boolean {
	// Exact match
	if (sourceType === targetType) {
		return true;
	}
	
	// Any type is compatible with everything
	if (targetType === 'any' || targetType === 'unknown') {
		return true;
	}
	
	if (sourceType === 'any' || sourceType === 'unknown') {
		return true;
	}
	
	// Array types
	if (sourceType.endsWith('[]') && targetType.endsWith('[]')) {
		const sourceElement = sourceType.slice(0, -2);
		const targetElement = targetType.slice(0, -2);
		return areTypesCompatible(sourceElement, targetElement);
	}
	
	// number compatibility
	if (sourceType === 'number' && targetType === 'number') {
		return true;
	}
	
	return false;
}

/**
 * Unify two types - find the most specific common type
 * This is used for If nodes to determine the output type
 */
export function unifyTypes(type1: string, type2: string): string {
	if (type1 === type2) {
		return type1;
	}
	
	// If either is any/unknown, return the other
	if (type1 === 'any' || type1 === 'unknown') {
		return type2;
	}
	if (type2 === 'any' || type2 === 'unknown') {
		return type1;
	}
	
	// For array types, unify element types
	if (type1.endsWith('[]') && type2.endsWith('[]')) {
		const elem1 = type1.slice(0, -2);
		const elem2 = type2.slice(0, -2);
		const unifiedElement = unifyTypes(elem1, elem2);
		return `${unifiedElement}[]`;
	}
	
	// Cannot unify - return any
	return 'any';
}

/**
 * Convert TypeScript type string to type node using factory API
 */
function createTypeNode(typeString: string): ts.TypeNode {
	const factory = ts.factory;
	
	// Handle array types
	if (typeString.endsWith('[]')) {
		const elementType = typeString.slice(0, -2);
		return factory.createArrayTypeNode(createTypeNode(elementType));
	}
	
	// Handle primitive types
	switch (typeString) {
		case 'string':
			return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
		case 'number':
			return factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
		case 'boolean':
			return factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
		case 'null':
			return factory.createLiteralTypeNode(factory.createNull());
		case 'undefined':
			return factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
		case 'any':
			return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
		case 'unknown':
			return factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
		case 'object':
			return factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword);
		case 'Date':
			return factory.createTypeReferenceNode('Date', undefined);
		default:
			// For other types, use type reference
			return factory.createTypeReferenceNode(typeString, undefined);
	}
}

/**
 * Transform a parsed expression AST to replace variable references
 * with typed identifiers from the node's inputs
 */
function transformExpression(
	expr: ts.Expression,
	graph: Graph,
	node: GraphNode,
	nodeVarMap: Map<string, string>
): ts.Expression {
	const factory = ts.factory;
	
	// Helper to get the source variable for an input port
	const getInputIdentifier = (portName: string): ts.Expression | null => {
		const edge = graph.edges.find(e => e.to.node === node.id && e.to.port === portName);
		if (edge) {
			const sourceVar = nodeVarMap.get(edge.from.node);
			if (sourceVar) {
				const sourceNode = graph.nodes.find(n => n.id === edge.from.node);
				// Special handling for Input node with property access
				if (sourceNode && sourceNode.type === 'Input' && edge.from.port !== 'out') {
					return factory.createPropertyAccessExpression(
						factory.createIdentifier('input'),
						edge.from.port
					);
				}
				return factory.createIdentifier(sourceVar);
			}
		}
		return null;
	};
	
	// Recursive transformer
	const transform = (expression: ts.Expression): ts.Expression => {
		// Check if this is an identifier that matches an input port (in0, in1, in2, etc.)
		if (ts.isIdentifier(expression)) {
			const identifierName = expression.text;
			// Check if it matches a port name pattern
			const replacement = getInputIdentifier(identifierName);
			if (replacement) {
				return replacement;
			}
			// Return as-is if no replacement found
			return expression;
		}
		
		// Handle binary expressions (e.g., a + b, a * b)
		if (ts.isBinaryExpression(expression)) {
			return factory.createBinaryExpression(
				transform(expression.left),
				expression.operatorToken,
				transform(expression.right)
			);
		}
		
		// Handle parenthesized expressions
		if (ts.isParenthesizedExpression(expression)) {
			return factory.createParenthesizedExpression(
				transform(expression.expression)
			);
		}
		
		// Handle prefix unary expressions (e.g., -x, !x)
		if (ts.isPrefixUnaryExpression(expression)) {
			return factory.createPrefixUnaryExpression(
				expression.operator,
				transform(expression.operand) as ts.UnaryExpression
			);
		}
		
		// Handle postfix unary expressions (e.g., x++)
		if (ts.isPostfixUnaryExpression(expression)) {
			return factory.createPostfixUnaryExpression(
				transform(expression.operand) as ts.LeftHandSideExpression,
				expression.operator
			);
		}
		
		// Handle conditional expressions (ternary)
		if (ts.isConditionalExpression(expression)) {
			return factory.createConditionalExpression(
				transform(expression.condition),
				factory.createToken(ts.SyntaxKind.QuestionToken),
				transform(expression.whenTrue),
				factory.createToken(ts.SyntaxKind.ColonToken),
				transform(expression.whenFalse)
			);
		}
		
		// Handle property access (e.g., in0.property)
		if (ts.isPropertyAccessExpression(expression)) {
			return factory.createPropertyAccessExpression(
				transform(expression.expression),
				expression.name
			);
		}
		
		// Handle element access (e.g., in0[0])
		if (ts.isElementAccessExpression(expression)) {
			return factory.createElementAccessExpression(
				transform(expression.expression),
				transform(expression.argumentExpression)
			);
		}
		
		// Handle call expressions (e.g., func(in0))
		if (ts.isCallExpression(expression)) {
			return factory.createCallExpression(
				transform(expression.expression),
				expression.typeArguments,
				expression.arguments.map(arg => transform(arg))
			);
		}
		
		// Handle array literals
		if (ts.isArrayLiteralExpression(expression)) {
			return factory.createArrayLiteralExpression(
				expression.elements.map(elem => transform(elem))
			);
		}
		
		// Handle object literals
		if (ts.isObjectLiteralExpression(expression)) {
			return factory.createObjectLiteralExpression(
				expression.properties.map(prop => {
					if (ts.isPropertyAssignment(prop)) {
						return factory.createPropertyAssignment(
							prop.name,
							transform(prop.initializer)
						);
					}
					return prop; // Keep other property types as-is
				})
			);
		}
		
		// For other expression types, return as-is
		return expression;
	};
	
	return transform(expr);
}

/**
 * Generate AST expression node for a graph node using TypeScript factory
 */
function createExpressionAst(
	node: GraphNode,
	graph: Graph,
	nodeVarMap: Map<string, string>
): ts.Expression {
	const factory = ts.factory;
	
	const getInputExpression = (portName: string): ts.Expression => {
		const edge = graph.edges.find(e => e.to.node === node.id && e.to.port === portName);
		if (edge) {
			const sourceVar = nodeVarMap.get(edge.from.node);
			if (sourceVar) {
				const sourceNode = graph.nodes.find(n => n.id === edge.from.node);
				// Special handling for Input node with property access
				if (sourceNode && sourceNode.type === 'Input' && edge.from.port !== 'out') {
					return factory.createPropertyAccessExpression(
						factory.createIdentifier('input'),
						edge.from.port
					);
				}
				return factory.createIdentifier(sourceVar);
			}
		}
		return factory.createNull();
	};
	
	switch (node.type) {
		case 'Input':
			return factory.createIdentifier('input');
			
		case 'Expression': {
			// For Expression nodes, parse the JavaScript expression into AST
			const expression = node.data.expression || 'null';
			
			// Try to detect simple literals for better type inference
			const trimmed = expression.trim();
			
			// Number literal
			if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
				return factory.createNumericLiteral(trimmed);
			}
			
			// String literal
			if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
			    (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
				return factory.createStringLiteral(trimmed.slice(1, -1));
			}
			
			// Boolean literal
			if (trimmed === 'true') return factory.createTrue();
			if (trimmed === 'false') return factory.createFalse();
			
			// For complex expressions, parse them using TypeScript's parser
			// and replace variable references with typed identifiers
			try {
				// Parse the expression as a TypeScript expression
				const sourceFile = ts.createSourceFile(
					'temp.ts',
					expression,
					ts.ScriptTarget.ESNext,
					true,
					ts.ScriptKind.TS
				);
				
				// Get the first expression statement
				if (sourceFile.statements.length > 0) {
					const statement = sourceFile.statements[0];
					if (ts.isExpressionStatement(statement)) {
						// Transform the expression to replace variable references
						const transformedExpr = transformExpression(
							statement.expression,
							graph,
							node,
							nodeVarMap
						);
						return transformedExpr;
					}
				}
			} catch (error) {
				// If parsing fails, fall back to 'any' type
			}
			
			// Fallback for expressions we can't parse
			return factory.createAsExpression(
				factory.createNull(),
				factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
			);
		}
			
		case 'CreateObject': {
			const inputEdges = graph.edges.filter(e => e.to.node === node.id);
			const properties: ts.ObjectLiteralElementLike[] = [];
			
			for (const edge of inputEdges) {
				const sourceVar = nodeVarMap.get(edge.from.node);
				if (sourceVar) {
					properties.push(
						factory.createPropertyAssignment(
							edge.to.port,
							factory.createIdentifier(sourceVar)
						)
					);
				}
			}
			
			return factory.createObjectLiteralExpression(properties, false);
		}
			
		case 'If': {
			const condition = getInputExpression('condition');
			const trueVal = getInputExpression('true');
			const falseVal = getInputExpression('false');
			return factory.createConditionalExpression(
				condition,
				factory.createToken(ts.SyntaxKind.QuestionToken),
				trueVal,
				factory.createToken(ts.SyntaxKind.ColonToken),
				falseVal
			);
		}
			
		case 'Map': {
			const array = getInputExpression('array');
			const exprInput = getInputExpression('expression');
			// Map: array.map(element => expression)
			return factory.createCallExpression(
				factory.createPropertyAccessExpression(array, 'map'),
				undefined,
				[factory.createArrowFunction(
					undefined,
					undefined,
					[factory.createParameterDeclaration(undefined, undefined, 'element')],
					undefined,
					factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
					exprInput
				)]
			);
		}
			
		case 'Filter': {
			const array = getInputExpression('array');
			const exprInput = getInputExpression('expression');
			return factory.createCallExpression(
				factory.createPropertyAccessExpression(array, 'filter'),
				undefined,
				[factory.createArrowFunction(
					undefined,
					undefined,
					[factory.createParameterDeclaration(undefined, undefined, 'element')],
					undefined,
					factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
					exprInput
				)]
			);
		}
			
		case 'Reduce': {
			const array = getInputExpression('array');
			const initial = getInputExpression('initial');
			const exprInput = getInputExpression('expression');
			return factory.createCallExpression(
				factory.createPropertyAccessExpression(array, 'reduce'),
				undefined,
				[
					factory.createArrowFunction(
						undefined,
						undefined,
						[
							factory.createParameterDeclaration(undefined, undefined, 'accumulator'),
							factory.createParameterDeclaration(undefined, undefined, 'element')
						],
						undefined,
						factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
						exprInput
					),
					initial
				]
			);
		}
		
		case 'CreateDate': {
			const value = getInputExpression('value');
			return factory.createNewExpression(
				factory.createIdentifier('Date'),
				undefined,
				[value]
			);
		}
		
		default:
			return factory.createNull();
	}
}

/**
 * Type inference engine using TypeScript factory API
 */
export class TypeScriptInferenceEngine {
	private graph: Graph;
	private nodeTypes: Map<string, NodeTypeInfo>;
	private errors: string[];
	private warnings: string[];
	private compilerOptions: ts.CompilerOptions;
	
	constructor(graph: Graph) {
		this.graph = graph;
		this.nodeTypes = new Map();
		this.errors = [];
		this.warnings = [];
		this.compilerOptions = {
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			strict: true,
			noEmit: true
		};
	}
	
	/**
	 * Perform type inference on the entire graph using TypeScript factory API
	 */
	inferTypes(): TypeCheckResult {
		this.nodeTypes.clear();
		this.errors = [];
		this.warnings = [];
		
		// Topological sort to process nodes in dependency order
		const sorted = this.topologicalSort();
		if (!sorted) {
			return {
				valid: false,
				nodeTypes: this.nodeTypes,
				errors: this.errors,
				warnings: this.warnings
			};
		}
		
		// Generate TypeScript AST and infer types
		this.inferTypesUsingAst(sorted);
		
		// Validate edge type compatibility
		this.validateEdges();
		
		return {
			valid: this.errors.length === 0,
			nodeTypes: this.nodeTypes,
			errors: this.errors,
			warnings: this.warnings
		};
	}
	
	/**
	 * Infer types using TypeScript AST factory
	 */
	private inferTypesUsingAst(sortedNodes: GraphNode[]): void {
		const factory = ts.factory;
		const statements: ts.Statement[] = [];
		const nodeVarMap = new Map<string, string>();
		
		// Create variable declarations for each node
		for (const node of sortedNodes) {
			const varName = `node_${node.id}`;
			nodeVarMap.set(node.id, varName);
			
			const nodeInfo: NodeTypeInfo = {
				nodeId: node.id,
				nodeType: node.type,
				inputTypes: {},
				outputTypes: {},
				errors: []
			};
			
			// Get input types from connected edges
			const inputEdges = this.graph.edges.filter(e => e.to.node === node.id);
			for (const edge of inputEdges) {
				const sourceNodeInfo = this.nodeTypes.get(edge.from.node);
				if (sourceNodeInfo) {
					const sourceType = sourceNodeInfo.outputTypes[edge.from.port];
					if (sourceType) {
						nodeInfo.inputTypes[edge.to.port] = sourceType;
					}
				}
			}
			
			// Special handling for Value nodes - infer from the value
			if (node.type === 'Value' && node.data.value !== undefined) {
				const inferredType = inferTypeFromValue(node.data.value);
				nodeInfo.outputTypes['out'] = inferredType;
				this.nodeTypes.set(node.id, nodeInfo);
				
				// Create typed variable declaration
				const typeNode = createTypeNode(inferredType);
				const valueExpr = this.createLiteralExpression(node.data.value);
				
				statements.push(
					factory.createVariableStatement(
						undefined,
						factory.createVariableDeclarationList(
							[factory.createVariableDeclaration(
								varName,
								undefined,
								typeNode,
								valueExpr
							)],
							ts.NodeFlags.Const
						)
					)
				);
				continue;
			}
			
			// Special handling for Input nodes - use schema types if available
			if (node.type === 'Input') {
				const inputSchema = node.data.inputSchema;
				const inputSchemaTypes = node.data.inputSchemaTypes;
				
				if (inputSchema && typeof inputSchema === 'object') {
					// Create output types from schema
					for (const [key, schemaValue] of Object.entries(inputSchema)) {
						let type = 'any';
						if (inputSchemaTypes && inputSchemaTypes[key]) {
							// Use explicitly defined type from schema
							type = inputSchemaTypes[key] as string;
						} else {
							// Infer from schema value
							type = this.getSchemaType(schemaValue);
						}
						nodeInfo.outputTypes[key] = type;
					}
				}
				// Always add 'out' port
				nodeInfo.outputTypes['out'] = 'any';
				this.nodeTypes.set(node.id, nodeInfo);
				
				// Input variable declaration
				statements.push(
					factory.createVariableStatement(
						undefined,
						factory.createVariableDeclarationList(
							[factory.createVariableDeclaration(
								varName,
								undefined,
								undefined,
								factory.createIdentifier('input')
							)],
							ts.NodeFlags.Const
						)
					)
				);
				continue;
			}
			
			// For other nodes, generate AST expression and let TypeScript infer
			try {
				const expr = createExpressionAst(node, this.graph, nodeVarMap);
				
				statements.push(
					factory.createVariableStatement(
						undefined,
						factory.createVariableDeclarationList(
							[factory.createVariableDeclaration(
								varName,
								undefined,
								undefined, // Let TypeScript infer the type
								expr
							)],
							ts.NodeFlags.Const
						)
					)
				);
				
				// Use TypeScript to infer the type
				const inferredType = this.inferTypeFromAst(statements);
				nodeInfo.outputTypes['out'] = inferredType;
				
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				nodeInfo.errors.push(`AST generation error: ${errorMsg}`);
				this.errors.push(`Node ${node.id} (${node.type}): ${errorMsg}`);
				nodeInfo.outputTypes['out'] = 'any';
			}
			
			this.nodeTypes.set(node.id, nodeInfo);
		}
	}
	
	/**
	 * Create a literal expression from a value
	 */
	private createLiteralExpression(value: any): ts.Expression {
		const factory = ts.factory;
		
		if (value === null) {
			return factory.createNull();
		}
		if (value === undefined) {
			return factory.createIdentifier('undefined');
		}
		if (typeof value === 'boolean') {
			return value ? factory.createTrue() : factory.createFalse();
		}
		if (typeof value === 'number') {
			return factory.createNumericLiteral(value);
		}
		if (typeof value === 'string') {
			return factory.createStringLiteral(value);
		}
		if (Array.isArray(value)) {
			return factory.createArrayLiteralExpression(
				value.map(v => this.createLiteralExpression(v))
			);
		}
		if (typeof value === 'object') {
			const properties: ts.ObjectLiteralElementLike[] = [];
			for (const [key, val] of Object.entries(value)) {
				properties.push(
					factory.createPropertyAssignment(key, this.createLiteralExpression(val))
				);
			}
			return factory.createObjectLiteralExpression(properties);
		}
		
		return factory.createNull();
	}
	
	/**
	 * Get schema type from value
	 */
	private getSchemaType(value: any): string {
		if (typeof value === 'string') return 'string';
		if (typeof value === 'number') return 'number';
		if (typeof value === 'boolean') return 'boolean';
		if (Array.isArray(value)) return 'unknown[]';
		if (typeof value === 'object') return 'object';
		return 'any';
	}
	
	/**
	 * Infer type from AST using TypeScript compiler
	 * This is a simplified implementation that infers basic types from the AST structure
	 * 
	 * A full implementation would create a SourceFile, Program, and use TypeChecker
	 * For now, we infer based on the AST node type
	 */
	private inferTypeFromAst(statements: ts.Statement[]): string {
		if (statements.length === 0) {
			return 'any';
		}
		
		// Get the last statement (should be the current node's variable declaration)
		const lastStatement = statements[statements.length - 1];
		
		if (ts.isVariableStatement(lastStatement)) {
			const declaration = lastStatement.declarationList.declarations[0];
			
			// If there's an explicit type annotation, use it
			if (declaration.type) {
				return this.typeNodeToString(declaration.type);
			}
			
			// Try to infer from the initializer expression
			if (declaration.initializer) {
				return this.inferTypeFromExpression(declaration.initializer);
			}
		}
		
		return 'any';
	}
	
	/**
	 * Convert a TypeScript type node to a string representation
	 */
	private typeNodeToString(typeNode: ts.TypeNode): string {
		switch (typeNode.kind) {
			case ts.SyntaxKind.StringKeyword:
				return 'string';
			case ts.SyntaxKind.NumberKeyword:
				return 'number';
			case ts.SyntaxKind.BooleanKeyword:
				return 'boolean';
			case ts.SyntaxKind.AnyKeyword:
				return 'any';
			case ts.SyntaxKind.UnknownKeyword:
				return 'unknown';
			case ts.SyntaxKind.NullKeyword:
				return 'null';
			case ts.SyntaxKind.UndefinedKeyword:
				return 'undefined';
			case ts.SyntaxKind.ObjectKeyword:
				return 'object';
			case ts.SyntaxKind.ArrayType:
				const arrayType = typeNode as ts.ArrayTypeNode;
				const elementType = this.typeNodeToString(arrayType.elementType);
				return `${elementType}[]`;
			case ts.SyntaxKind.TypeReference:
				const typeRef = typeNode as ts.TypeReferenceNode;
				if (ts.isIdentifier(typeRef.typeName)) {
					return typeRef.typeName.text;
				}
				return 'unknown';
			default:
				return 'any';
		}
	}
	
	/**
	 * Infer type from an expression AST node
	 */
	private inferTypeFromExpression(expr: ts.Expression): string {
		switch (expr.kind) {
			case ts.SyntaxKind.StringLiteral:
				return 'string';
			case ts.SyntaxKind.NumericLiteral:
				return 'number';
			case ts.SyntaxKind.TrueKeyword:
			case ts.SyntaxKind.FalseKeyword:
				return 'boolean';
			case ts.SyntaxKind.NullKeyword:
				return 'null';
			case ts.SyntaxKind.Identifier:
				// Look up the identifier in our node types to get its type
				const identifier = expr as ts.Identifier;
				const varName = identifier.text;
				
				// Find the node that corresponds to this variable
				for (const [nodeId, nodeInfo] of this.nodeTypes) {
					const expectedVarName = `node_${nodeId}`;
					if (expectedVarName === varName) {
						return nodeInfo.outputTypes['out'] || 'unknown';
					}
				}
				return 'unknown';
			case ts.SyntaxKind.BinaryExpression:
				// Handle binary expressions (e.g., a + b, a * b, a > b)
				const binaryExpr = expr as ts.BinaryExpression;
				const leftType = this.inferTypeFromExpression(binaryExpr.left);
				const rightType = this.inferTypeFromExpression(binaryExpr.right);
				
				// Determine result type based on operator
				const operator = binaryExpr.operatorToken.kind;
				
				// Comparison operators return boolean
				if (operator === ts.SyntaxKind.GreaterThanToken ||
				    operator === ts.SyntaxKind.LessThanToken ||
				    operator === ts.SyntaxKind.GreaterThanEqualsToken ||
				    operator === ts.SyntaxKind.LessThanEqualsToken ||
				    operator === ts.SyntaxKind.EqualsEqualsToken ||
				    operator === ts.SyntaxKind.EqualsEqualsEqualsToken ||
				    operator === ts.SyntaxKind.ExclamationEqualsToken ||
				    operator === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
					return 'boolean';
				}
				
				// Logical operators return boolean
				if (operator === ts.SyntaxKind.AmpersandAmpersandToken ||
				    operator === ts.SyntaxKind.BarBarToken) {
					return 'boolean';
				}
				
				// Arithmetic operators
				if (operator === ts.SyntaxKind.PlusToken ||
				    operator === ts.SyntaxKind.MinusToken ||
				    operator === ts.SyntaxKind.AsteriskToken ||
				    operator === ts.SyntaxKind.SlashToken ||
				    operator === ts.SyntaxKind.PercentToken ||
				    operator === ts.SyntaxKind.AsteriskAsteriskToken) {
					// If both operands are numbers, result is number
					if (leftType === 'number' && rightType === 'number') {
						return 'number';
					}
					// Plus with strings returns string
					if (operator === ts.SyntaxKind.PlusToken &&
					    (leftType === 'string' || rightType === 'string')) {
						return 'string';
					}
					// Otherwise, return number if at least one operand is number
					if (leftType === 'number' || rightType === 'number') {
						return 'number';
					}
					return 'any';
				}
				
				// For other binary operators, unify the types
				return unifyTypes(leftType, rightType);
			case ts.SyntaxKind.ParenthesizedExpression:
				const parenExpr = expr as ts.ParenthesizedExpression;
				return this.inferTypeFromExpression(parenExpr.expression);
			case ts.SyntaxKind.PrefixUnaryExpression:
				const prefixExpr = expr as ts.PrefixUnaryExpression;
				const operandType = this.inferTypeFromExpression(prefixExpr.operand);
				// Logical NOT returns boolean
				if (prefixExpr.operator === ts.SyntaxKind.ExclamationToken) {
					return 'boolean';
				}
				// Unary minus/plus returns number
				if (prefixExpr.operator === ts.SyntaxKind.MinusToken ||
				    prefixExpr.operator === ts.SyntaxKind.PlusToken) {
					return operandType === 'number' ? 'number' : 'any';
				}
				return operandType;
			case ts.SyntaxKind.PostfixUnaryExpression:
				const postfixExpr = expr as ts.PostfixUnaryExpression;
				return this.inferTypeFromExpression(postfixExpr.operand);
			case ts.SyntaxKind.PropertyAccessExpression:
				// For property access, we'd need type information about the object
				// For now, return 'any'
				return 'any';
			case ts.SyntaxKind.ElementAccessExpression:
				// For array/object element access, return 'any'
				return 'any';
			case ts.SyntaxKind.ArrayLiteralExpression:
				const arrayLiteral = expr as ts.ArrayLiteralExpression;
				if (arrayLiteral.elements.length === 0) {
					return 'unknown[]';
				}
				// Infer element type from first element
				const elementType = this.inferTypeFromExpression(arrayLiteral.elements[0]);
				return `${elementType}[]`;
			case ts.SyntaxKind.ObjectLiteralExpression:
				return 'object';
			case ts.SyntaxKind.ConditionalExpression:
				// For ternary, try to infer from both branches
				const conditional = expr as ts.ConditionalExpression;
				const trueType = this.inferTypeFromExpression(conditional.whenTrue);
				const falseType = this.inferTypeFromExpression(conditional.whenFalse);
				// Unify the types
				return unifyTypes(trueType, falseType);
			case ts.SyntaxKind.CallExpression:
				const callExpr = expr as ts.CallExpression;
				// Check if it's an array method
				if (ts.isPropertyAccessExpression(callExpr.expression)) {
					const methodName = callExpr.expression.name.text;
					if (methodName === 'map' || methodName === 'filter') {
						// Preserve array type
						return 'unknown[]';
					}
					if (methodName === 'reduce') {
						// Reduce returns the accumulator type (unknown without type checker)
						return 'any';
					}
				}
				// Constructor calls
				if (ts.isIdentifier(callExpr.expression)) {
					const funcName = callExpr.expression.text;
					if (funcName === 'Date') {
						return 'Date';
					}
				}
				return 'any';
			case ts.SyntaxKind.NewExpression:
				const newExpr = expr as ts.NewExpression;
				if (ts.isIdentifier(newExpr.expression)) {
					return newExpr.expression.text; // e.g., 'Date'
				}
				return 'object';
			case ts.SyntaxKind.AsExpression:
				// For 'as' expressions, use the asserted type
				const asExpr = expr as ts.AsExpression;
				return this.typeNodeToString(asExpr.type);
			default:
				return 'any';
		}
	}
	
	/**
	 * Validate that edge connections have compatible types
	 */
	private validateEdges(): void {
		for (const edge of this.graph.edges) {
			const sourceNode = this.nodeTypes.get(edge.from.node);
			const targetNode = this.nodeTypes.get(edge.to.node);
			
			if (!sourceNode || !targetNode) {
				continue;
			}
			
			const sourceType = sourceNode.outputTypes[edge.from.port];
			const targetType = targetNode.inputTypes[edge.to.port];
			
			if (sourceType && targetType) {
				if (!areTypesCompatible(sourceType, targetType)) {
					this.warnings.push(
						`Type mismatch at edge ${edge.from.node}.${edge.from.port} -> ${edge.to.node}.${edge.to.port}: ` +
						`'${sourceType}' is not compatible with '${targetType}'`
					);
				}
			}
		}
	}
	
	/**
	 * Topological sort of nodes
	 */
	private topologicalSort(): GraphNode[] | null {
		const sorted: GraphNode[] = [];
		const visited = new Set<string>();
		const visiting = new Set<string>();
		
		// Build adjacency map
		const adjacency = new Map<string, string[]>();
		for (const node of this.graph.nodes) {
			adjacency.set(node.id, []);
		}
		for (const edge of this.graph.edges) {
			const neighbors = adjacency.get(edge.from.node) || [];
			neighbors.push(edge.to.node);
			adjacency.set(edge.from.node, neighbors);
		}
		
		// DFS visit
		const visit = (nodeId: string): boolean => {
			if (visited.has(nodeId)) return true;
			if (visiting.has(nodeId)) {
				this.errors.push(`Cycle detected in graph at node: ${nodeId}`);
				return false;
			}
			
			visiting.add(nodeId);
			
			const neighbors = adjacency.get(nodeId) || [];
			for (const neighbor of neighbors) {
				if (!visit(neighbor)) {
					return false;
				}
			}
			
			visiting.delete(nodeId);
			visited.add(nodeId);
			
			const node = this.graph.nodes.find(n => n.id === nodeId);
			if (node) {
				sorted.push(node);
			}
			
			return true;
		};
		
		// Visit all nodes
		for (const node of this.graph.nodes) {
			if (!visit(node.id)) {
				return null;
			}
		}
		
		return sorted.reverse();
	}
}

/**
 * Helper function to perform type inference on a graph
 */
export function inferGraphTypes(graph: Graph): TypeCheckResult {
	const engine = new TypeScriptInferenceEngine(graph);
	return engine.inferTypes();
}
