import { nodeRegistry } from '../dataflow/registry';
import { AddNode, SubtractNode, MultiplyNode, DivideNode } from './math';
import { IfNode, CompareNode, SwitchNode } from './control';
import { ValueNode, OutputNode } from './special';
import { CreateDateNode, AddDateNode, FormatDateNode } from './datetime';

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
	nodeRegistry.register(OutputNode);
	
	// DateTime nodes
	nodeRegistry.register(CreateDateNode);
	nodeRegistry.register(AddDateNode);
	nodeRegistry.register(FormatDateNode);
}

// Export all node definitions
export * from './math';
export * from './control';
export * from './special';
export * from './datetime';
