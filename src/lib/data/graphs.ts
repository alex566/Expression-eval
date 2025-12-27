import type { Graph } from '$lib/dataflow/types';

export const SAMPLE_GRAPH: Graph = {
	nodes: [
		{
			id: "value1",
			type: "Value",
			data: {
				value: 10
			}
		},
		{
			id: "value2",
			type: "Value",
			data: {
				value: 5
			}
		},
		{
			id: "add",
			type: "Add",
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
			from: {
				node: "value1",
				port: "out"
			},
			to: {
				node: "add",
				port: "in0"
			}
		},
		{
			from: {
				node: "value2",
				port: "out"
			},
			to: {
				node: "add",
				port: "in1"
			}
		},
		{
			from: {
				node: "add",
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
			type: "Value",
			data: {
				value: 5
			}
		},
		{
			id: "value_2",
			type: "Value",
			data: {
				value: 2
			}
		},
		{
			id: "value_y",
			type: "Value",
			data: {
				value: 10
			}
		},
		{
			id: "value_3",
			type: "Value",
			data: {
				value: 3
			}
		},
		{
			id: "value_z",
			type: "Value",
			data: {
				value: 3
			}
		},
		{
			id: "value_5",
			type: "Value",
			data: {
				value: 5
			}
		},
		{
			id: "add1",
			type: "Add",
			data: {}
		},
		{
			id: "multiply",
			type: "Multiply",
			data: {}
		},
		{
			id: "subtract",
			type: "Subtract",
			data: {}
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
				node: "add1",
				port: "in0"
			}
		},
		{
			from: {
				node: "value_2",
				port: "out"
			},
			to: {
				node: "add1",
				port: "in1"
			}
		},
		{
			from: {
				node: "add1",
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
				node: "multiply",
				port: "in0"
			}
		},
		{
			from: {
				node: "value_3",
				port: "out"
			},
			to: {
				node: "multiply",
				port: "in1"
			}
		},
		{
			from: {
				node: "multiply",
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
				node: "subtract",
				port: "in0"
			}
		},
		{
			from: {
				node: "value_5",
				port: "out"
			},
			to: {
				node: "subtract",
				port: "in1"
			}
		},
		{
			from: {
				node: "subtract",
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
			type: "Value",
			data: {
				value: "2025-01-01T00:00:00.000Z"
			}
		},
		{
			id: "createDate",
			type: "CreateDate",
			data: {}
		},
		{
			id: "daysToAdd",
			type: "Value",
			data: {
				value: 7
			}
		},
		{
			id: "hoursToAdd",
			type: "Value",
			data: {
				value: 12
			}
		},
		{
			id: "addDate",
			type: "AddDate",
			data: {}
		},
		{
			id: "formatType",
			type: "Value",
			data: {
				value: "iso"
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

export const ARRAY_OPERATIONS_GRAPH: Graph = {
	nodes: [
		{
			id: "array1",
			type: "Value",
			data: {
				value: [1, 2, 3, 4, 5]
			}
		},
		{
			id: "array2",
			type: "Value",
			data: {
				value: [10, 20, 30, 40, 50]
			}
		},
		{
			id: "scalar",
			type: "Value",
			data: {
				value: 5
			}
		},
		{
			id: "add_arrays",
			type: "Add",
			data: {}
		},
		{
			id: "multiply_scalar",
			type: "Multiply",
			data: {}
		},
		{
			id: "threshold",
			type: "Value",
			data: {
				value: 150
			}
		},
		{
			id: "compare_threshold",
			type: "Compare",
			data: {
				operator: ">"
			}
		},
		{
			id: "filter_if",
			type: "If",
			data: {}
		},
		{
			id: "switch_test_value",
			type: "Value",
			data: {
				value: "option2"
			}
		},
		{
			id: "switch_node",
			type: "Switch",
			data: {
				cases: {
					"option1": "case1",
					"option2": "case2",
					"option3": "case3"
				}
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["added", "multiplied", "comparison", "filtered_true", "filtered_false", "switch_out"]
			}
		}
	],
	edges: [
		{
			from: {
				node: "array1",
				port: "out"
			},
			to: {
				node: "add_arrays",
				port: "in0"
			}
		},
		{
			from: {
				node: "array2",
				port: "out"
			},
			to: {
				node: "add_arrays",
				port: "in1"
			}
		},
		{
			from: {
				node: "add_arrays",
				port: "out"
			},
			to: {
				node: "output",
				port: "added"
			}
		},
		{
			from: {
				node: "add_arrays",
				port: "out"
			},
			to: {
				node: "multiply_scalar",
				port: "in0"
			}
		},
		{
			from: {
				node: "scalar",
				port: "out"
			},
			to: {
				node: "multiply_scalar",
				port: "in1"
			}
		},
		{
			from: {
				node: "multiply_scalar",
				port: "out"
			},
			to: {
				node: "output",
				port: "multiplied"
			}
		},
		{
			from: {
				node: "multiply_scalar",
				port: "out"
			},
			to: {
				node: "compare_threshold",
				port: "a"
			}
		},
		{
			from: {
				node: "threshold",
				port: "out"
			},
			to: {
				node: "compare_threshold",
				port: "b"
			}
		},
		{
			from: {
				node: "compare_threshold",
				port: "out"
			},
			to: {
				node: "output",
				port: "comparison"
			}
		},
		{
			from: {
				node: "compare_threshold",
				port: "out"
			},
			to: {
				node: "filter_if",
				port: "condition"
			}
		},
		{
			from: {
				node: "multiply_scalar",
				port: "out"
			},
			to: {
				node: "filter_if",
				port: "true"
			}
		},
		{
			from: {
				node: "multiply_scalar",
				port: "out"
			},
			to: {
				node: "filter_if",
				port: "false"
			}
		},
		{
			from: {
				node: "filter_if",
				port: "trueOut"
			},
			to: {
				node: "output",
				port: "filtered_true"
			}
		},
		{
			from: {
				node: "filter_if",
				port: "falseOut"
			},
			to: {
				node: "output",
				port: "filtered_false"
			}
		},
		{
			from: {
				node: "switch_test_value",
				port: "out"
			},
			to: {
				node: "switch_node",
				port: "value"
			}
		},
		{
			from: {
				node: "switch_node",
				port: "case2"
			},
			to: {
				node: "output",
				port: "switch_out"
			}
		}
	]
};

export const MAP_FILTER_REDUCE_GRAPH: Graph = {
	nodes: [
		{
			id: "numbers",
			type: "Value",
			data: {
				value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			}
		},
		{
			id: "map_double",
			type: "Map",
			data: {},
			subgraph: {
				nodes: [
					{
						id: "element",
						type: "Input",
						data: {}
					},
					{
						id: "two",
						type: "Value",
						data: {
							value: 2
						}
					},
					{
						id: "multiply",
						type: "Multiply",
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
						from: { node: "element", port: "out" },
						to: { node: "multiply", port: "in0" }
					},
					{
						from: { node: "two", port: "out" },
						to: { node: "multiply", port: "in1" }
					},
					{
						from: { node: "multiply", port: "out" },
						to: { node: "output", port: "result" }
					}
				]
			}
		},
		{
			id: "filter_gt5",
			type: "Filter",
			data: {},
			subgraph: {
				nodes: [
					{
						id: "element",
						type: "Input",
						data: {}
					},
					{
						id: "threshold",
						type: "Value",
						data: {
							value: 10
						}
					},
					{
						id: "compare",
						type: "Compare",
						data: {
							operator: ">"
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
						from: { node: "element", port: "out" },
						to: { node: "compare", port: "a" }
					},
					{
						from: { node: "threshold", port: "out" },
						to: { node: "compare", port: "b" }
					},
					{
						from: { node: "compare", port: "out" },
						to: { node: "output", port: "result" }
					}
				]
			}
		},
		{
			id: "reduce_sum",
			type: "Reduce",
			data: {},
			subgraph: {
				nodes: [
					{
						id: "accumulator",
						type: "Input",
						data: {}
					},
					{
						id: "element",
						type: "Input",
						data: {}
					},
					{
						id: "add",
						type: "Add",
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
						from: { node: "accumulator", port: "out" },
						to: { node: "add", port: "in0" }
					},
					{
						from: { node: "element", port: "out" },
						to: { node: "add", port: "in1" }
					},
					{
						from: { node: "add", port: "out" },
						to: { node: "output", port: "result" }
					}
				]
			}
		},
		{
			id: "initial_value",
			type: "Value",
			data: {
				value: 0
			}
		},
		{
			id: "output",
			type: "Output",
			data: {
				outputs: ["mapped", "filtered", "sum"]
			}
		}
	],
	edges: [
		{
			from: { node: "numbers", port: "out" },
			to: { node: "map_double", port: "array" }
		},
		{
			from: { node: "map_double", port: "out" },
			to: { node: "output", port: "mapped" }
		},
		{
			from: { node: "map_double", port: "out" },
			to: { node: "filter_gt5", port: "array" }
		},
		{
			from: { node: "filter_gt5", port: "out" },
			to: { node: "output", port: "filtered" }
		},
		{
			from: { node: "filter_gt5", port: "out" },
			to: { node: "reduce_sum", port: "array" }
		},
		{
			from: { node: "initial_value", port: "out" },
			to: { node: "reduce_sum", port: "initial" }
		},
		{
			from: { node: "reduce_sum", port: "out" },
			to: { node: "output", port: "sum" }
		}
	]
};

export const GRAPHS: Record<string, Graph> = {
	'sample': SAMPLE_GRAPH,
	'complex': COMPLEX_GRAPH,
	'dates': DATE_SAMPLE_GRAPH,
	'arrays': ARRAY_OPERATIONS_GRAPH,
	'mapfilterreduce': MAP_FILTER_REDUCE_GRAPH
};
