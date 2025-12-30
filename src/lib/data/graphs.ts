import type { Graph } from '$lib/dataflow/types';

export const SAMPLE_GRAPH: Graph = {
	nodes: [
		{
			id: "value1",
			type: "Expression",
			data: {
				expression: "10"
			}
		},
		{
			id: "value2",
			type: "Expression",
			data: {
				expression: "5"
			}
		},
		{
			id: "expr",
			type: "Expression",
			data: {
				expression: "in0 + in1"
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["result"]
			}
		}
	],
	edges: [
		{
			from: {
				node: "value1",
				port: "out"
			},
			to: {
				node: "expr",
				port: "in0"
			}
		},
		{
			from: {
				node: "value2",
				port: "out"
			},
			to: {
				node: "expr",
				port: "in1"
			}
		},
		{
			from: {
				node: "expr",
				port: "out"
			},
			to: {
				node: "output",
				port: "result"
			}
		}
	]
};

export const COMPLEX_GRAPH: Graph = {
	nodes: [
		{
			id: "value_x",
			type: "Expression",
			data: {
				expression: "5"
			}
		},
		{
			id: "value_2",
			type: "Expression",
			data: {
				expression: "2"
			}
		},
		{
			id: "value_y",
			type: "Expression",
			data: {
				expression: "10"
			}
		},
		{
			id: "value_3",
			type: "Expression",
			data: {
				expression: "3"
			}
		},
		{
			id: "value_z",
			type: "Expression",
			data: {
				expression: "3"
			}
		},
		{
			id: "value_5",
			type: "Expression",
			data: {
				expression: "5"
			}
		},
		{
			id: "expr1",
			type: "Expression",
			data: {
				expression: "in0 + in1"
			}
		},
		{
			id: "expr2",
			type: "Expression",
			data: {
				expression: "in0 * in1"
			}
		},
		{
			id: "expr3",
			type: "Expression",
			data: {
				expression: "in0 - in1"
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["result1", "result2", "result3"]
			}
		}
	],
	edges: [
		{
			from: {
				node: "value_x",
				port: "out"
			},
			to: {
				node: "expr1",
				port: "in0"
			}
		},
		{
			from: {
				node: "value_2",
				port: "out"
			},
			to: {
				node: "expr1",
				port: "in1"
			}
		},
		{
			from: {
				node: "expr1",
				port: "out"
			},
			to: {
				node: "output",
				port: "result1"
			}
		},
		{
			from: {
				node: "value_y",
				port: "out"
			},
			to: {
				node: "expr2",
				port: "in0"
			}
		},
		{
			from: {
				node: "value_3",
				port: "out"
			},
			to: {
				node: "expr2",
				port: "in1"
			}
		},
		{
			from: {
				node: "expr2",
				port: "out"
			},
			to: {
				node: "output",
				port: "result2"
			}
		},
		{
			from: {
				node: "value_z",
				port: "out"
			},
			to: {
				node: "expr3",
				port: "in0"
			}
		},
		{
			from: {
				node: "value_5",
				port: "out"
			},
			to: {
				node: "expr3",
				port: "in1"
			}
		},
		{
			from: {
				node: "expr3",
				port: "out"
			},
			to: {
				node: "output",
				port: "result3"
			}
		}
	]
};

export const DATE_SAMPLE_GRAPH: Graph = {
	nodes: [
		{
			id: "dateString",
			type: "Expression",
			data: {
				expression: '"2025-01-01T00:00:00.000Z"'
			}
		},
		{
			id: "createDate",
			type: "CreateDate",
			data: {}
		},
		{
			id: "daysToAdd",
			type: "Expression",
			data: {
				expression: "7"
			}
		},
		{
			id: "hoursToAdd",
			type: "Expression",
			data: {
				expression: "12"
			}
		},
		{
			id: "addDate",
			type: "AddDate",
			data: {}
		},
		{
			id: "formatType",
			type: "Expression",
			data: {
				expression: '"iso"'
			}
		},
		{
			id: "formatDate",
			type: "FormatDate",
			data: {}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["originalDate", "modifiedDate", "formattedDate"]
			}
		}
	],
	edges: [
		{
			from: {
				node: "dateString",
				port: "out"
			},
			to: {
				node: "createDate",
				port: "value"
			}
		},
		{
			from: {
				node: "createDate",
				port: "out"
			},
			to: {
				node: "output",
				port: "originalDate"
			}
		},
		{
			from: {
				node: "createDate",
				port: "out"
			},
			to: {
				node: "addDate",
				port: "date"
			}
		},
		{
			from: {
				node: "daysToAdd",
				port: "out"
			},
			to: {
				node: "addDate",
				port: "days"
			}
		},
		{
			from: {
				node: "hoursToAdd",
				port: "out"
			},
			to: {
				node: "addDate",
				port: "hours"
			}
		},
		{
			from: {
				node: "addDate",
				port: "out"
			},
			to: {
				node: "output",
				port: "modifiedDate"
			}
		},
		{
			from: {
				node: "addDate",
				port: "out"
			},
			to: {
				node: "formatDate",
				port: "date"
			}
		},
		{
			from: {
				node: "formatType",
				port: "out"
			},
			to: {
				node: "formatDate",
				port: "format"
			}
		},
		{
			from: {
				node: "formatDate",
				port: "out"
			},
			to: {
				node: "output",
				port: "formattedDate"
			}
		}
	]
};

export const INPUT_SAMPLE_GRAPH: Graph = {
	nodes: [
		{
			id: "input",
			type: "Input",
			data: {
				// Define the expected input schema for dynamic pin generation
				inputSchema: {
					name: "string",
					age: "number",
					scores: "array",
					address: "object",
					active: "boolean",
					tags: "array"
				}
			}
		},
		{
			id: "threshold",
			type: "Expression",
			data: {
				expression: "18"
			}
		},
		{
			id: "compare",
			type: "Expression",
			data: {
				expression: "in0 > in1"
			}
		},
		{
			id: "adultLabel",
			type: "Expression",
			data: {
				expression: '"Adult"'
			}
		},
		{
			id: "minorLabel",
			type: "Expression",
			data: {
				expression: '"Minor"'
			}
		},
		{
			id: "if",
			type: "If",
			data: {}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["ageCategory"]
			}
		}
	],
	edges: [
		{
			from: { node: "input", port: "age" },
			to: { node: "compare", port: "in0" }
		},
		{
			from: { node: "threshold", port: "out" },
			to: { node: "compare", port: "in1" }
		},
		{
			from: { node: "compare", port: "out" },
			to: { node: "if", port: "condition" }
		},
		{
			from: { node: "adultLabel", port: "out" },
			to: { node: "if", port: "true" }
		},
		{
			from: { node: "minorLabel", port: "out" },
			to: { node: "if", port: "false" }
		},
		{
			from: { node: "if", port: "out" },
			to: { node: "output", port: "ageCategory" }
		}
	]
};

export const CEL_SAMPLE_GRAPH: Graph = {
	nodes: [
		{
			id: "input",
			type: "Input",
			data: {
				inputSchema: {
					age: "number"
				}
			}
		},
		{
			id: "compare",
			type: "Expression",
			data: {
				expression: "in0 > 18"
			}
		},
		{
			id: "value1",
			type: "Expression",
			data: {
				expression: '"Adult"'
			}
		},
		{
			id: "value2",
			type: "Expression",
			data: {
				expression: '"Minor"'
			}
		},
		{
			id: "if",
			type: "If",
			data: {}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["result"]
			}
		}
	],
	edges: [
		{
			from: { node: "input", port: "age" },
			to: { node: "compare", port: "in0" }
		},
		{
			from: { node: "compare", port: "out" },
			to: { node: "if", port: "condition" }
		},
		{
			from: { node: "value1", port: "out" },
			to: { node: "if", port: "true" }
		},
		{
			from: { node: "value2", port: "out" },
			to: { node: "if", port: "false" }
		},
		{
			from: { node: "if", port: "out" },
			to: { node: "output", port: "result" }
		}
	]
};

/**
 * Expression-based math operations sample
 * Demonstrates using Expression node for inline calculations like "(in0 + 1) * 2"
 */
export const EXPRESSION_MATH_GRAPH: Graph = {
	nodes: [
		{
			id: "value1",
			type: "Expression",
			data: {
				expression: "5"
			}
		},
		{
			id: "expr1",
			type: "Expression",
			data: {
				expression: "(in0 + 1) * 2"
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["result"]
			}
		}
	],
	edges: [
		{
			from: { node: "value1", port: "out" },
			to: { node: "expr1", port: "in0" }
		},
		{
			from: { node: "expr1", port: "out" },
			to: { node: "output", port: "result" }
		}
	]
};

/**
 * CreateObject node sample
 * Demonstrates creating objects from input pins
 */
export const CREATE_OBJECT_GRAPH: Graph = {
	nodes: [
		{
			id: "value_name",
			type: "Expression",
			data: {
				expression: '"John Doe"'
			}
		},
		{
			id: "value_age",
			type: "Expression",
			data: {
				expression: "30"
			}
		},
		{
			id: "createObj",
			type: "CreateObject",
			data: {
				pinNames: ["name", "age"]
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["person"]
			}
		}
	],
	edges: [
		{
			from: { node: "value_name", port: "out" },
			to: { node: "createObj", port: "name" }
		},
		{
			from: { node: "value_age", port: "out" },
			to: { node: "createObj", port: "age" }
		},
		{
			from: { node: "createObj", port: "out" },
			to: { node: "output", port: "person" }
		}
	]
};

/**
 * Property access with CEL syntax sample
 * Demonstrates accessing object properties like "in0.date"
 */
export const PROPERTY_ACCESS_GRAPH: Graph = {
	nodes: [
		{
			id: "input",
			type: "Input",
			data: {
				inputSchema: {
					user: { name: "string", age: "number" },
					timestamp: "string"
				}
			}
		},
		{
			id: "expr1",
			type: "Expression",
			data: {
				expression: "in0.name + ' is ' + string(in0.age) + ' years old'"
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["message"]
			}
		}
	],
	edges: [
		{
			from: { node: "input", port: "user" },
			to: { node: "expr1", port: "in0" }
		},
		{
			from: { node: "expr1", port: "out" },
			to: { node: "output", port: "message" }
		}
	]
};

/**
 * Array operations with Expression bodies sample
 * Demonstrates Map, Filter with expression bodies shown in preview
 */
export const ARRAY_OPERATIONS_GRAPH: Graph = {
	nodes: [
		{
			id: "input",
			type: "Input",
			data: {
				inputSchema: {
					numbers: "array"
				}
			}
		},
		{
			id: "filterExpr",
			type: "Expression",
			data: {
				expression: "element > 5"
			}
		},
		{
			id: "filter",
			type: "Filter",
			data: {}
		},
		{
			id: "mapExpr",
			type: "Expression",
			data: {
				expression: "element * 2"
			}
		},
		{
			id: "map",
			type: "Map",
			data: {}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["result"]
			}
		}
	],
	edges: [
		{
			from: { node: "input", port: "numbers" },
			to: { node: "filter", port: "array" }
		},
		{
			from: { node: "filterExpr", port: "out" },
			to: { node: "filter", port: "expression" }
		},
		{
			from: { node: "filter", port: "out" },
			to: { node: "map", port: "array" }
		},
		{
			from: { node: "mapExpr", port: "out" },
			to: { node: "map", port: "expression" }
		},
		{
			from: { node: "map", port: "out" },
			to: { node: "output", port: "result" }
		}
	]
};

/**
 * Demonstrates automatic input pin name inference for Output node
 * The Output node automatically infers input pin names from connected edges
 * No need to pre-configure the 'outputs' array
 */
export const AUTO_INFERRED_OUTPUT_GRAPH: Graph = {
	nodes: [
		{
			id: "temperature",
			type: "Expression",
			data: {
				expression: "25"
			}
		},
		{
			id: "humidity",
			type: "Expression",
			data: {
				expression: "60"
			}
		},
		{
			id: "status",
			type: "Expression",
			data: {
				expression: '"optimal"'
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				// No 'outputs' array needed - pins are automatically inferred from edges
			}
		}
	],
	edges: [
		{
			from: { node: "temperature", port: "out" },
			to: { node: "output", port: "temperature" }  // Creates 'temperature' input pin
		},
		{
			from: { node: "humidity", port: "out" },
			to: { node: "output", port: "humidity" }  // Creates 'humidity' input pin
		},
		{
			from: { node: "status", port: "out" },
			to: { node: "output", port: "status" }  // Creates 'status' input pin
		}
	]
};

export const GRAPHS: Record<string, Graph> = {
	'sample': SAMPLE_GRAPH,
	'complex': COMPLEX_GRAPH,
	'dates': DATE_SAMPLE_GRAPH,
	'input-example': INPUT_SAMPLE_GRAPH,
	'cel': CEL_SAMPLE_GRAPH,
	'expression-math': EXPRESSION_MATH_GRAPH,
	'create-object': CREATE_OBJECT_GRAPH,
	'property-access': PROPERTY_ACCESS_GRAPH,
	'array-operations': ARRAY_OPERATIONS_GRAPH,
	'auto-inferred-output': AUTO_INFERRED_OUTPUT_GRAPH
};
