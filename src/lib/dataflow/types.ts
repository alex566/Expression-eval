// Core dataflow types and interfaces

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
 * Evaluation result
 */
export interface EvaluationResult {
	success: boolean;
	outputs: Record<string, any>;
	error?: string;
}
