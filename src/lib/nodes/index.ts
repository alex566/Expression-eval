import { nodeRegistry } from '../dataflow/registry';
import { AddNode, SubtractNode, MultiplyNode, DivideNode } from './math';
import { IfNode, CompareNode, ForEachNode, MapNode } from './control';
import { ValueNode, OutputNode } from './special';

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
	nodeRegistry.register(ForEachNode);
	nodeRegistry.register(MapNode);

	// Special nodes
	nodeRegistry.register(ValueNode);
	nodeRegistry.register(OutputNode);
}

// Export all node definitions
export * from './math';
export * from './control';
export * from './special';
