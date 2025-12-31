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

/**
 * Demonstrates output-to-input name propagation
 * When connecting outputs to dynamic input nodes (Expression, CreateObject),
 * the output port name becomes the input port name
 */
export const NAME_PROPAGATION_GRAPH: Graph = {
	nodes: [
		{
			id: "price",
			type: "Expression",
			data: {
				expression: "100.0"
			}
		},
		{
			id: "quantity",
			type: "Expression",
			data: {
				expression: "5.0"
			}
		},
		{
			id: "taxRate",
			type: "Expression",
			data: {
				expression: "0.08"
			}
		},
		{
			id: "calculate",
			type: "Expression",
			data: {
				// Using named inputs instead of in0, in1, in2
				expression: "(price * quantity) * (1.0 + taxRate)"
			}
		},
		{
			id: "output",
			type: "Output",
			data: {}
		}
	],
	edges: [
		{
			from: { node: "price", port: "out" },
			to: { node: "calculate", port: "price" }  // 'out' becomes 'price' input
		},
		{
			from: { node: "quantity", port: "out" },
			to: { node: "calculate", port: "quantity" }  // 'out' becomes 'quantity' input
		},
		{
			from: { node: "taxRate", port: "out" },
			to: { node: "calculate", port: "taxRate" }  // 'out' becomes 'taxRate' input
		},
		{
			from: { node: "calculate", port: "out" },
			to: { node: "output", port: "total" }  // 'out' becomes 'total' input
		}
	]
};

/**
 * Grasshopper-inspired stress test graph
 * Demonstrates complex operations mimicking common Grasshopper (Rhino 3D) workflows:
 * - Range generation (series of numbers)
 * - Multiple mathematical transformations (scaling, powers, trigonometry)
 * - Array filtering and mapping operations
 * - Data merging and reduction
 * - Nested operations and complex data flows
 * 
 * This serves as a comprehensive stress test for the expression evaluation engine.
 */
export const GRASSHOPPER_STRESS_TEST: Graph = {
	nodes: [
		// Range generation: Create a series from 0 to 9
		{
			id: "rangeStart",
			type: "Expression",
			data: {
				expression: "0"
			}
		},
		{
			id: "rangeEnd",
			type: "Expression",
			data: {
				expression: "9"
			}
		},
		{
			id: "rangeStep",
			type: "Expression",
			data: {
				expression: "1"
			}
		},
		// Create array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
		{
			id: "generateRange",
			type: "Expression",
			data: {
				expression: "Array.from({length: Math.floor((end - start) / step) + 1}, (_, i) => start + i * step)"
			}
		},
		
		// Path 1: Scale and apply power transformation
		{
			id: "scaleFactor1",
			type: "Expression",
			data: {
				expression: "2.5"
			}
		},
		{
			id: "scaleExpr",
			type: "Expression",
			data: {
				expression: "element * scale"
			}
		},
		{
			id: "scaleMap",
			type: "Map",
			data: {}
		},
		{
			id: "powerExpr",
			type: "Expression",
			data: {
				expression: "Math.pow(element, 2)"
			}
		},
		{
			id: "powerMap",
			type: "Map",
			data: {}
		},
		
		// Path 2: Trigonometric transformation
		{
			id: "angleScale",
			type: "Expression",
			data: {
				expression: "Math.PI / 18" // Convert to radians (10 degrees per unit)
			}
		},
		{
			id: "sinExpr",
			type: "Expression",
			data: {
				expression: "Math.sin(element * angleScale)"
			}
		},
		{
			id: "sinMap",
			type: "Map",
			data: {}
		},
		{
			id: "amplify",
			type: "Expression",
			data: {
				expression: "100"
			}
		},
		{
			id: "amplifyExpr",
			type: "Expression",
			data: {
				expression: "element * amp"
			}
		},
		{
			id: "amplifyMap",
			type: "Map",
			data: {}
		},
		
		// Path 3: Filter and modulo operation (cull pattern)
		{
			id: "filterThreshold",
			type: "Expression",
			data: {
				expression: "30"
			}
		},
		{
			id: "filterExpr",
			type: "Expression",
			data: {
				expression: "element > threshold"
			}
		},
		{
			id: "filterOp",
			type: "Filter",
			data: {}
		},
		{
			id: "moduloExpr",
			type: "Expression",
			data: {
				expression: "element % 3"
			}
		},
		{
			id: "moduloMap",
			type: "Map",
			data: {}
		},
		
		// Merge and combine operations
		{
			id: "mergeArrays",
			type: "Expression",
			data: {
				expression: "path1.map((v, i) => ({scaled: v, trig: path2[i] || 0, modulo: path3[i] || 0}))"
			}
		},
		
		// Statistics and reduction
		{
			id: "sumInitial",
			type: "Expression",
			data: {
				expression: "0"
			}
		},
		{
			id: "sumExpr",
			type: "Expression",
			data: {
				expression: "accumulator + element.scaled"
			}
		},
		{
			id: "sumReduce",
			type: "Reduce",
			data: {}
		},
		
		{
			id: "avgDivisor",
			type: "Expression",
			data: {
				expression: "10"
			}
		},
		{
			id: "calculateAvg",
			type: "Expression",
			data: {
				expression: "sum / count"
			}
		},
		
		// Extract specific values (list item access)
		{
			id: "extractIndex",
			type: "Expression",
			data: {
				expression: "5"
			}
		},
		{
			id: "extractItem",
			type: "Expression",
			data: {
				expression: "array[index]"
			}
		},
		
		// Count and statistics
		{
			id: "countFiltered",
			type: "Expression",
			data: {
				expression: "array.length"
			}
		},
		
		// Complex nested calculation
		{
			id: "complexCalc",
			type: "Expression",
			data: {
				expression: "(avg * 0.5) + (itemValue.trig * 0.3) + (count * 0.2)"
			}
		},
		
		// Create summary object
		{
			id: "createSummary",
			type: "CreateObject",
			data: {
				pinNames: ["originalRange", "scaledPower", "trigValues", "moduloFiltered", "mergedData", "sum", "average", "extractedItem", "filteredCount", "complexResult"]
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
		// Range generation
		{
			from: { node: "rangeStart", port: "out" },
			to: { node: "generateRange", port: "start" }
		},
		{
			from: { node: "rangeEnd", port: "out" },
			to: { node: "generateRange", port: "end" }
		},
		{
			from: { node: "rangeStep", port: "out" },
			to: { node: "generateRange", port: "step" }
		},
		
		// Path 1: Scale and power
		{
			from: { node: "generateRange", port: "out" },
			to: { node: "scaleMap", port: "array" }
		},
		{
			from: { node: "scaleFactor1", port: "out" },
			to: { node: "scaleExpr", port: "scale" }
		},
		{
			from: { node: "scaleExpr", port: "out" },
			to: { node: "scaleMap", port: "expression" }
		},
		{
			from: { node: "scaleMap", port: "out" },
			to: { node: "powerMap", port: "array" }
		},
		{
			from: { node: "powerExpr", port: "out" },
			to: { node: "powerMap", port: "expression" }
		},
		
		// Path 2: Trigonometric
		{
			from: { node: "generateRange", port: "out" },
			to: { node: "sinMap", port: "array" }
		},
		{
			from: { node: "angleScale", port: "out" },
			to: { node: "sinExpr", port: "angleScale" }
		},
		{
			from: { node: "sinExpr", port: "out" },
			to: { node: "sinMap", port: "expression" }
		},
		{
			from: { node: "sinMap", port: "out" },
			to: { node: "amplifyMap", port: "array" }
		},
		{
			from: { node: "amplify", port: "out" },
			to: { node: "amplifyExpr", port: "amp" }
		},
		{
			from: { node: "amplifyExpr", port: "out" },
			to: { node: "amplifyMap", port: "expression" }
		},
		
		// Path 3: Filter and modulo
		{
			from: { node: "powerMap", port: "out" },
			to: { node: "filterOp", port: "array" }
		},
		{
			from: { node: "filterThreshold", port: "out" },
			to: { node: "filterExpr", port: "threshold" }
		},
		{
			from: { node: "filterExpr", port: "out" },
			to: { node: "filterOp", port: "expression" }
		},
		{
			from: { node: "filterOp", port: "out" },
			to: { node: "moduloMap", port: "array" }
		},
		{
			from: { node: "moduloExpr", port: "out" },
			to: { node: "moduloMap", port: "expression" }
		},
		
		// Merge operations
		{
			from: { node: "powerMap", port: "out" },
			to: { node: "mergeArrays", port: "path1" }
		},
		{
			from: { node: "amplifyMap", port: "out" },
			to: { node: "mergeArrays", port: "path2" }
		},
		{
			from: { node: "moduloMap", port: "out" },
			to: { node: "mergeArrays", port: "path3" }
		},
		
		// Reduction (sum)
		{
			from: { node: "mergeArrays", port: "out" },
			to: { node: "sumReduce", port: "array" }
		},
		{
			from: { node: "sumInitial", port: "out" },
			to: { node: "sumReduce", port: "initial" }
		},
		{
			from: { node: "sumExpr", port: "out" },
			to: { node: "sumReduce", port: "expression" }
		},
		
		// Average calculation
		{
			from: { node: "sumReduce", port: "out" },
			to: { node: "calculateAvg", port: "sum" }
		},
		{
			from: { node: "avgDivisor", port: "out" },
			to: { node: "calculateAvg", port: "count" }
		},
		
		// Extract item
		{
			from: { node: "mergeArrays", port: "out" },
			to: { node: "extractItem", port: "array" }
		},
		{
			from: { node: "extractIndex", port: "out" },
			to: { node: "extractItem", port: "index" }
		},
		
		// Count filtered
		{
			from: { node: "moduloMap", port: "out" },
			to: { node: "countFiltered", port: "array" }
		},
		
		// Complex calculation
		{
			from: { node: "calculateAvg", port: "out" },
			to: { node: "complexCalc", port: "avg" }
		},
		{
			from: { node: "extractItem", port: "out" },
			to: { node: "complexCalc", port: "itemValue" }
		},
		{
			from: { node: "countFiltered", port: "out" },
			to: { node: "complexCalc", port: "count" }
		},
		
		// Create summary object
		{
			from: { node: "generateRange", port: "out" },
			to: { node: "createSummary", port: "originalRange" }
		},
		{
			from: { node: "powerMap", port: "out" },
			to: { node: "createSummary", port: "scaledPower" }
		},
		{
			from: { node: "amplifyMap", port: "out" },
			to: { node: "createSummary", port: "trigValues" }
		},
		{
			from: { node: "moduloMap", port: "out" },
			to: { node: "createSummary", port: "moduloFiltered" }
		},
		{
			from: { node: "mergeArrays", port: "out" },
			to: { node: "createSummary", port: "mergedData" }
		},
		{
			from: { node: "sumReduce", port: "out" },
			to: { node: "createSummary", port: "sum" }
		},
		{
			from: { node: "calculateAvg", port: "out" },
			to: { node: "createSummary", port: "average" }
		},
		{
			from: { node: "extractItem", port: "out" },
			to: { node: "createSummary", port: "extractedItem" }
		},
		{
			from: { node: "countFiltered", port: "out" },
			to: { node: "createSummary", port: "filteredCount" }
		},
		{
			from: { node: "complexCalc", port: "out" },
			to: { node: "createSummary", port: "complexResult" }
		},
		
		// Output
		{
			from: { node: "createSummary", port: "out" },
			to: { node: "output", port: "result" }
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
	'auto-inferred-output': AUTO_INFERRED_OUTPUT_GRAPH,
	'name-propagation': NAME_PROPAGATION_GRAPH,
	'grasshopper-stress-test': GRASSHOPPER_STRESS_TEST
};
