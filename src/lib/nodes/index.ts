import { nodeRegistry } from '../dataflow/registry';
import { AddNode, SubtractNode, MultiplyNode, DivideNode } from './math';
import { IfNode, CompareNode, SwitchNode } from './control';
import { ValueNode, InputNode, OutputNode } from './special';
import { CreateDateNode, AddDateNode, FormatDateNode } from './datetime';
import { MapNode, FilterNode, ReduceNode } from './array';

/**
 * Register all predefined nodes
 */
export function registerAllNodes() {
	// Math nodes
	nodeRegistry.register(AddNode);
	nodeRegistry.register(SubtractNode);
	nodeRegistry.register(MultiplyNode);
	nodeRegistry.register(DivideNode);

	// Control nodes
	nodeRegistry.register(IfNode);
	nodeRegistry.register(CompareNode);
	nodeRegistry.register(SwitchNode);

	// Special nodes
	nodeRegistry.register(ValueNode);
	nodeRegistry.register(InputNode);
	nodeRegistry.register(OutputNode);
	
	// DateTime nodes
	nodeRegistry.register(CreateDateNode);
	nodeRegistry.register(AddDateNode);
	nodeRegistry.register(FormatDateNode);

	// Array nodes
	nodeRegistry.register(MapNode);
	nodeRegistry.register(FilterNode);
	nodeRegistry.register(ReduceNode);
}

// Export all node definitions
export * from './math';
export * from './control';
export * from './special';
export * from './datetime';
export * from './array';
