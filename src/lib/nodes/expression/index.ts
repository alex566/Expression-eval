import type { NodeDefinition } from '../../dataflow/types';

/**
 * Expression node - contains a CEL expression string
 * This node can be connected as an argument to other nodes
 */
export const ExpressionNode: NodeDefinition = {
	type: 'Expression',
	category: 'expression',
	description: 'A CEL expression that can be used as input to other nodes',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		// Expression nodes are compiled at graph compilation time
		// They don't execute in the traditional sense
		const expression = context.getNodeData().expression || '';
		context.setOutputValue('out', expression);
	}
};
