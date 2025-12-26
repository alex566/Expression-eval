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

export const GRAPHS: Record<string, Graph> = {
	'sample': SAMPLE_GRAPH,
	'complex': COMPLEX_GRAPH,
	'dates': DATE_SAMPLE_GRAPH
};
