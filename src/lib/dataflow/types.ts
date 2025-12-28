// Core dataflow types and interfaces

/**
 * Port specification with name and TypeScript type
 */
export interface PortSpec {
	name: string;
	/** TypeScript type signature (e.g., 'number', 'string[]', '{ x: number }') */
	type: string;
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
 * Represents a function definition in the graph
 * Functions are the main execution unit with:
 * - Name (as ID)
 * - Graph containing nodes and edges
 * - Nested functions (can reference other functions)
 * - Input: a single JSON object
 * - Output: produced at the end of execution
 */
export interface FunctionDefinition {
	/** Unique name/ID of the function */
	name: string;
	/** The function graph with nodes and edges */
	graph: Graph;
	/** Optional description of what the function does */
	description?: string;
}

/**
 * Represents the complete dataflow graph
 * In function-based architecture, graphs define functions where:
 * - Each function has a name (as ID), graph, and can contain nested functions
 * - The main execution unit is a function which has an input object and produces output
 * - Functions can reference and call other functions defined in the same graph
 */
export interface Graph {
	nodes: GraphNode[];
	edges: GraphEdge[];
	/** List of function definitions. Each function is the main execution unit. */
	functions?: FunctionDefinition[];
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
	/** Optional full TypeScript function signature for documentation */
	signature?: string;
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
	/** The TypeScript type string (e.g., 'number', 'string[]', '{ x: number }') */
	type: string;
	/** The declared type constraint (if any) */
	declaredType?: string;
	/** Whether the inferred type is compatible with declared type */
	isCompatible: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
	success: boolean;
	/** Inferred types for each port (node.port -> type info) */
	inferredTypes: Record<string, InferredTypeInfo>;
	/** List of validation errors */
	errors: string[];
	/** List of validation warnings */
	warnings: string[];
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
