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
			id: "double_func",
			type: "FunctionValue",
			data: {
				functionName: "double"
			}
		},
		{
			id: "gt10_func",
			type: "FunctionValue",
			data: {
				functionName: "greaterThan10"
			}
		},
		{
			id: "sum_func",
			type: "FunctionValue",
			data: {
				functionName: "sum"
			}
		},
		{
			id: "map_double",
			type: "Map",
			data: {}
		},
		{
			id: "filter_gt5",
			type: "Filter",
			data: {}
		},
		{
			id: "reduce_sum",
			type: "Reduce",
			data: {}
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
			from: { node: "double_func", port: "out" },
			to: { node: "map_double", port: "function" }
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
			from: { node: "gt10_func", port: "out" },
			to: { node: "filter_gt5", port: "function" }
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
			from: { node: "sum_func", port: "out" },
			to: { node: "reduce_sum", port: "function" }
		},
		{
			from: { node: "reduce_sum", port: "out" },
			to: { node: "output", port: "sum" }
		}
	],
	functions: [
		{
			name: "double",
			description: "Doubles the element value",
			graph: {
				nodes: [
					{
						id: "input",
						type: "FunctionInput",
						data: {}
					},
					{
						id: "getElement",
						type: "GetProperty",
						data: {
							property: "element"
						}
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
						from: { node: "input", port: "out" },
						to: { node: "getElement", port: "object" }
					},
					{
						from: { node: "getElement", port: "out" },
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
			name: "greaterThan10",
			description: "Checks if element is greater than 10",
			graph: {
				nodes: [
					{
						id: "input",
						type: "FunctionInput",
						data: {}
					},
					{
						id: "getElement",
						type: "GetProperty",
						data: {
							property: "element"
						}
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
						from: { node: "input", port: "out" },
						to: { node: "getElement", port: "object" }
					},
					{
						from: { node: "getElement", port: "out" },
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
			name: "sum",
			description: "Adds accumulator and element",
			graph: {
				nodes: [
					{
						id: "input",
						type: "FunctionInput",
						data: {}
					},
					{
						id: "getAccumulator",
						type: "GetProperty",
						data: {
							property: "accumulator"
						}
					},
					{
						id: "getElement",
						type: "GetProperty",
						data: {
							property: "element"
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
						from: { node: "input", port: "out" },
						to: { node: "getAccumulator", port: "object" }
					},
					{
						from: { node: "input", port: "out" },
						to: { node: "getElement", port: "object" }
					},
					{
						from: { node: "getAccumulator", port: "out" },
						to: { node: "add", port: "in0" }
					},
					{
						from: { node: "getElement", port: "out" },
						to: { node: "add", port: "in1" }
					},
					{
						from: { node: "add", port: "out" },
						to: { node: "output", port: "result" }
					}
				]
			}
		}
	]
};

export const FUNCTION_BASED_GRAPH: Graph = {
	nodes: [
		{
			id: "numbers",
			type: "Value",
			data: {
				value: [1, 2, 3, 4, 5]
			}
		},
		{
			id: "double_func",
			type: "FunctionValue",
			data: {
				functionName: "double"
			}
		},
		{
			id: "isEven_func",
			type: "FunctionValue",
			data: {
				functionName: "isEven"
			}
		},
		{
			id: "map_double",
			type: "Map",
			data: {}
		},
		{
			id: "filter_even",
			type: "Filter",
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
			from: { node: "numbers", port: "out" },
			to: { node: "map_double", port: "array" }
		},
		{
			from: { node: "double_func", port: "out" },
			to: { node: "map_double", port: "function" }
		},
		{
			from: { node: "map_double", port: "out" },
			to: { node: "filter_even", port: "array" }
		},
		{
			from: { node: "isEven_func", port: "out" },
			to: { node: "filter_even", port: "function" }
		},
		{
			from: { node: "filter_even", port: "out" },
			to: { node: "output", port: "result" }
		}
	],
	functions: [
		{
			name: "double",
			description: "Doubles the element value",
			graph: {
				nodes: [
					{
						id: "input",
						type: "FunctionInput",
						data: {}
					},
					{
						id: "getElement",
						type: "GetProperty",
						data: {
							property: "element"
						}
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
						from: { node: "input", port: "out" },
						to: { node: "getElement", port: "object" }
					},
					{
						from: { node: "getElement", port: "out" },
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
			name: "isEven",
			description: "Checks if element is even",
			graph: {
				nodes: [
					{
						id: "input",
						type: "FunctionInput",
						data: {}
					},
					{
						id: "getElement",
						type: "GetProperty",
						data: {
							property: "element"
						}
					},
					{
						id: "two",
						type: "Value",
						data: {
							value: 2
						}
					},
					{
						id: "modulo",
						type: "Modulo",
						data: {}
					},
					{
						id: "zero",
						type: "Value",
						data: {
							value: 0
						}
					},
					{
						id: "compare",
						type: "Compare",
						data: {
							operator: "=="
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
						from: { node: "input", port: "out" },
						to: { node: "getElement", port: "object" }
					},
					{
						from: { node: "getElement", port: "out" },
						to: { node: "modulo", port: "in0" }
					},
					{
						from: { node: "two", port: "out" },
						to: { node: "modulo", port: "in1" }
					},
					{
						from: { node: "modulo", port: "out" },
						to: { node: "compare", port: "a" }
					},
					{
						from: { node: "zero", port: "out" },
						to: { node: "compare", port: "b" }
					},
					{
						from: { node: "compare", port: "out" },
						to: { node: "output", port: "result" }
					}
				]
			}
		}
	]
};

export const GRAPHS: Record<string, Graph> = {
	'sample': SAMPLE_GRAPH,
	'complex': COMPLEX_GRAPH,
	'dates': DATE_SAMPLE_GRAPH,
	'mapfilterreduce': MAP_FILTER_REDUCE_GRAPH,
	'functions': FUNCTION_BASED_GRAPH
};
