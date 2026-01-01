import { nodeRegistry } from '../dataflow/registry';
import { IfNode, MatchNode, SwitchNode } from './control';
import { InputNode, OutputNode, CreateObjectNode } from './special';
import { CreateDateNode, AddDateNode, FormatDateNode } from './datetime';
import { MapNode, FilterNode, ReduceNode, RangeNode, LengthNode, GetItemNode, ConcatNode } from './array';
import { ExpressionNode } from './expression';

/**
 * Register all predefined nodes
 */
export function registerAllNodes() {
	// Control nodes
	nodeRegistry.register(IfNode);
	nodeRegistry.register(MatchNode);
	nodeRegistry.register(SwitchNode); // Deprecated, kept for backward compatibility

	// Special nodes
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
	nodeRegistry.register(RangeNode);
	nodeRegistry.register(LengthNode);
	nodeRegistry.register(GetItemNode);
	nodeRegistry.register(ConcatNode);

	// Expression nodes
	nodeRegistry.register(ExpressionNode);
}

// Export all node definitions
export * from './control';
export * from './special';
export * from './datetime';
export * from './array';
export * from './expression';
