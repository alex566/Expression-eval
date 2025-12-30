import { nodeRegistry } from '../dataflow/registry';
import { IfNode, CompareNode, SwitchNode } from './control';
import { ValueNode, InputNode, OutputNode, CreateObjectNode } from './special';
import { CreateDateNode, AddDateNode, FormatDateNode } from './datetime';
import { MapNode, FilterNode, ReduceNode } from './array';
import { ExpressionNode } from './expression';

/**
 * Register all predefined nodes
 */
export function registerAllNodes() {
	// Control nodes
	nodeRegistry.register(IfNode);
	nodeRegistry.register(CompareNode);
	nodeRegistry.register(SwitchNode);

	// Special nodes
	nodeRegistry.register(ValueNode);
	nodeRegistry.register(InputNode);
	nodeRegistry.register(OutputNode);
	nodeRegistry.register(CreateObjectNode);
	
	// DateTime nodes
	nodeRegistry.register(CreateDateNode);
	nodeRegistry.register(AddDateNode);
	nodeRegistry.register(FormatDateNode);

	// Array nodes
	nodeRegistry.register(MapNode);
	nodeRegistry.register(FilterNode);
	nodeRegistry.register(ReduceNode);

	// Expression nodes
	nodeRegistry.register(ExpressionNode);
}

// Export all node definitions
export * from './control';
export * from './special';
export * from './datetime';
export * from './array';
export * from './expression';
