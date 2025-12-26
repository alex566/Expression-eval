// Core dataflow types and interfaces

/**
 * Supported data types in the dataflow system
 */
export type DataType = 
	| 'number' 
	| 'string' 
	| 'boolean' 
	| 'array' 
	| 'object' 
	| 'any'
	| 'number | string'
	| 'string | number'
	| 'number | boolean'
	| 'boolean | number';

/**
 * Port specification with name and type
 */
export interface PortSpec {
	name: string;
	type: DataType;
}

/**
 * Represents a port on a node (input or output)
 */
export interface Port {
	node: string;
	port: string;
}

/**
 * Represents a connection between two node ports
 */
export interface GraphEdge {
	from: Port;
	to: Port;
}

/**
 * Represents a node in the dataflow graph
 */
export interface GraphNode {
	id: string;
	type: string;
	data: Record<string, any>;
}

/**
 * Represents the complete dataflow graph
 */
export interface Graph {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

/**
 * Node execution context - maintains state during evaluation
 */
export interface NodeContext {
	getInputValue(port: string): any;
	setOutputValue(port: string, value: any): void;
	getNodeData(): Record<string, any>;
}

/**
 * Node definition interface - defines how a node type behaves
 */
export interface NodeDefinition {
	type: string;
	category: string;
	description?: string;
	inputs?: PortSpec[];
	outputs?: PortSpec[];
	execute(context: NodeContext): void | Promise<void>;
}

/**
 * Registry for node definitions
 */
export interface NodeRegistry {
	register(definition: NodeDefinition): void;
	get(type: string): NodeDefinition | undefined;
	getAll(): NodeDefinition[];
	getByCategory(category: string): NodeDefinition[];
}

/**
 * Inferred type information for a port
 */
export interface InferredTypeInfo {
	/** The actual inferred type based on runtime value */
	inferredType: DataType;
	/** The declared type constraint (if any) */
	declaredType?: DataType;
	/** Whether the inferred type is compatible with declared type */
	isCompatible: boolean;
}

/**
 * Evaluation result
 */
export interface EvaluationResult {
	success: boolean;
	outputs: Record<string, any>;
	/** Inferred types for each port (node.port -> type info) */
	inferredTypes?: Record<string, InferredTypeInfo>;
	error?: string;
}

/**
 * Get the actual runtime type of a value
 */
export function getValueType(value: any): DataType {
	if (value === null || value === undefined) {
		return 'any';
	}
	if (Array.isArray(value)) {
		return 'array';
	}
	if (typeof value === 'object') {
		return 'object';
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
 * Check if a value matches an expected type (supports union types)
 */
export function isTypeCompatible(value: any, expectedType: DataType): boolean {
	if (expectedType === 'any') {
		return true;
	}

	const actualType = getValueType(value);

	// Handle union types (assumes ' | ' separator format as defined in DataType)
	// Union types must be defined with exact spacing: "type1 | type2"
	if (expectedType.includes(' | ')) {
		const types = expectedType.split(' | ').map(t => t.trim() as DataType);
		return types.some(type => actualType === type || type === 'any');
	}

	return actualType === expectedType;
}

/**
 * Format type for display (e.g., "number | string" -> "number | string")
 * Currently returns the type as-is. This function exists for future extensibility
 * to support custom type formatting or pretty-printing if needed.
 */
export function formatType(type: DataType): string {
	return type;
}
