// Core dataflow types and interfaces

/**
 * Port specification with name and type
 */
export interface PortSpec {
	name: string;
	/** Type signature (e.g., 'number', 'string[]', '{ x: number }') */
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
 * Represents the complete dataflow graph
 * Graphs compile to CEL expressions for evaluation
 */
export interface Graph {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

/**
 * Node execution context - maintains state during evaluation
 * Note: In CEL mode, nodes don't execute directly - they compile to CEL
 */
export interface NodeContext {
	getInputValue(port: string): any;
	setOutputValue(port: string, value: any): void;
	getNodeData(): Record<string, any>;
}

/**
 * Type inference context - provides input types for inference
 */
export interface TypeInferenceContext {
	getInputType(port: string): string | undefined;
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
	/**
	 * Optional function to infer output types based on input types
	 * Used for dynamic type checking in the graph
	 */
	inferOutputTypes?(context: TypeInferenceContext): Record<string, string>;
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
 * Evaluation result from CEL execution
 */
export interface EvaluationResult {
	success: boolean;
	outputs: Record<string, any>;
	error?: string;
}

/**
 * Type inference result for a node
 */
export interface NodeTypeInfo {
	nodeId: string;
	nodeType: string;
	inputTypes: Record<string, string>;
	outputTypes: Record<string, string>;
	errors: string[];
}

/**
 * Type check result for the entire graph
 */
export interface TypeCheckResult {
	valid: boolean;
	nodeTypes: Map<string, NodeTypeInfo>;
	errors: string[];
	warnings: string[];
}
