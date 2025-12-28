# Dataflow Logic Implementation

This implementation provides a modular and clean dataflow graph system for Expression-eval with a function-based architecture.

## Architecture

### Core Concepts

The architecture is built around **Functions** as the main execution unit:

1. **Function** - The primary composition element
   - Has a **name** (as ID)
   - Contains a **graph** (nodes and edges)
   - Can reference **nested functions** (other functions in the same graph)
   - Accepts a single **JSON object** as input
   - Produces **output** at the end of execution

2. **FunctionInput Node** - Generic object properties accessor
   - Entry point for function graphs
   - Automatically creates **output pins for every property** of the input object
   - Can be used anywhere to access object properties
   - Example: Input object `{ element: 5, index: 0 }` creates output pins:
     - `out`: The full object `{ element: 5, index: 0 }`
     - `element`: The value `5`
     - `index`: The value `0`

3. **Function-Based Array Operations**
   - Map, Filter, and Reduce use **FunctionValue** nodes
   - Functions receive structured input objects:
     - Map/Filter: `{ element: value }`
     - Reduce: `{ accumulator: current, element: value }`

### Core Components

1. **Types & Interfaces** (`src/lib/dataflow/types.ts`)
   - `Graph`: Represents the complete dataflow graph with functions
   - `GraphNode`: Individual node in the graph
   - `GraphEdge`: Connections between nodes
   - `FunctionDefinition`: Defines reusable functions
   - `NodeDefinition`: Interface for defining node behavior
   - `NodeContext`: Execution context for nodes

2. **Node Registry** (`src/lib/dataflow/registry.ts`)
   - Manages available node types
   - Allows registration and lookup of node definitions
   - Supports categorization of nodes

3. **Graph Evaluator** (`src/lib/dataflow/evaluator.ts`)
   - Executes the dataflow graph
   - Manages node execution order (topological)
   - Maintains state during evaluation
   - Propagates values between nodes

## Function-Based Architecture

The system uses a **function-based architecture** where graphs define reusable functions that can be called with different inputs.

### Key Features

#### 1. Functions as Main Execution Units
Each function:
- Has a unique **name** serving as its ID
- Contains its own **graph** (nodes and edges)
- Accepts a single **JSON object** as input
- Returns a single **output** value
- Can call other **nested functions** defined in the same graph

#### 2. Main Function
Every function-based graph typically has a "main" function that serves as the entry point. Other functions can be defined and called from the main function or from each other.

#### 3. FunctionInput Node - Generic Object Properties Accessor

The **FunctionInput** node is a powerful generic node that:
- Serves as the entry point for function graphs
- Receives a JSON object as input
- Automatically creates **output pins for each property** of the object
- Provides both the full object (`out` port) and individual properties

**Example:**
```javascript
// Input object
{ element: 5, index: 0, name: "test" }

// Available output ports on FunctionInput node:
- out: { element: 5, index: 0, name: "test" }  // Full object
- element: 5                                     // Individual property
- index: 0                                       // Individual property  
- name: "test"                                   // Individual property
```

This eliminates the need for GetProperty nodes in most cases, making graphs cleaner and more intuitive.

### Example: Function-Based Graph

```json
{
  "functions": [
    {
      "name": "double",
      "description": "Doubles the element value",
      "graph": {
        "nodes": [
          {
            "id": "input",
            "type": "FunctionInput",
            "data": {}
          },
          {
            "id": "two",
            "type": "Value",
            "data": { "value": 2 }
          },
          {
            "id": "multiply",
            "type": "Multiply",
            "data": {}
          },
          {
            "id": "output",
            "type": "Output",
            "data": { "outputs": ["result"] }
          }
        ],
        "edges": [
          {
            "from": { "node": "input", "port": "element" },
            "to": { "node": "multiply", "port": "in0" }
          },
          {
            "from": { "node": "two", "port": "out" },
            "to": { "node": "multiply", "port": "in1" }
          },
          {
            "from": { "node": "multiply", "port": "out" },
            "to": { "node": "output", "port": "result" }
          }
        ]
      }
    }
  ]
}
```

Note how the FunctionInput node's `element` property is accessed directly without needing a GetProperty node.

### Using Functions with Array Operations

The Map, Filter, and Reduce nodes are now **fully function-based** and require FunctionValue nodes connected to their function input pins:

```json
{
  "nodes": [
    {
      "id": "double_func",
      "type": "FunctionValue",
      "data": {
        "functionName": "double"
      }
    },
    {
      "id": "map_double",
      "type": "Map",
      "data": {}
    }
  ],
  "edges": [
    {
      "from": { "node": "double_func", "port": "out" },
      "to": { "node": "map_double", "port": "function" }
    }
  ]
}
```

When Map processes each array element:
1. It wraps the element in a JSON object: `{ element: value }`
2. Passes this object to the function
3. The function's FunctionInput node automatically exposes the `element` property as an output pin
4. The function processes it and returns the result

This approach provides:
- **Reusability**: Define a function once, use it multiple times
- **Composition**: Functions can call other nested functions
- **Clarity**: Function names describe what they do
- **Modularity**: Functions are self-contained units with clear input/output
- **Navigation**: Double-click FunctionValue nodes to view/edit function definitions
- **Simplicity**: Direct property access eliminates extra nodes

## Node Categories

Nodes are organized in separate folders by category:

#### Function Nodes (`src/lib/nodes/function/`)
- **FunctionInput**: Generic object properties accessor (entry point for functions)
  - Automatically creates output pins for each property of the input object
  - Provides `out` port for full object and individual ports for each property
  - Example: Input `{ element: 5, index: 0 }` exposes ports: `out`, `element`, `index`
  - Eliminates need for GetProperty nodes in most cases
- **GetProperty**: Extracts a property from a JSON object (optional, for advanced use)
  - Example: Extract "element" from `{ element: 5, index: 0 }` → returns `5`
  - Useful for dynamic property access or nested objects
- **FunctionValue**: Provides a function name as a value that can be connected to function pins
  - Used to reference functions in Map/Filter/Reduce operations
  - Double-click to view/edit the function definition in the UI
- **FunctionRef**: Calls a function by name with a JSON object input (internal use by array nodes)

#### Math Operations (`src/lib/nodes/math/`)
All math nodes now support **array-aware operations**. When any input is an array, the operation is performed element-wise:
- **Add**: Adds all connected input values together (dynamic inputs: in0, in1, in2, ...)
  - Arrays: `[1,2,3] + [10,20,30] = [11,22,33]`
  - Mixed: `[1,2,3] + 5 = [6,7,8]`
- **Subtract**: Subtracts all subsequent inputs from the first input (in0 - in1 - in2 - ...)
  - Arrays: `[10,20,30] - [1,2,3] = [9,18,27]`
- **Multiply**: Multiplies all connected input values together (dynamic inputs: in0, in1, in2, ...)
  - Arrays: `[1,2,3] * [10,20,30] = [10,40,90]`
- **Divide**: Divides the first input by all subsequent inputs (in0 / in1 / in2 / ...)
  - Arrays: `[10,20,30] / [2,4,5] = [5,5,6]`
- **Modulo**: Computes the remainder of division (in0 % in1)
  - Arrays: `[10,15,20] % 3 = [1,0,2]`

#### Control Flow (`src/lib/nodes/control/`)
- **If**: Conditional branching (supports both single values and array filtering)
  - Single: outputs either `true` or `false` value based on condition
  - Array: when condition is an array of booleans, filters input arrays into `trueOut` and `falseOut`
- **Compare**: Compares two values (supports element-wise array comparison)
  - Single: `5 > 3 = true`
  - Arrays: `[1,5,10] > 3 = [false, true, true]`
- **Switch**: Multi-case branching based on a value matching a case

#### Array Operations (`src/lib/nodes/array/`)
All array operation nodes are **function-based** and require a FunctionValue node connected to their function input:
- **Map**: Transforms each element of an array through a function
  - Inputs: `array` (array to transform), `function` (function name from FunctionValue node)
  - The function receives `{ element: value }` for each array element
  - Returns: transformed array
- **Filter**: Filters array elements using a predicate function
  - Inputs: `array` (array to filter), `function` (predicate function name)
  - The function receives `{ element: value }` and should return boolean
  - Returns: filtered array containing only elements where predicate returned true
- **Reduce**: Reduces an array to a single value using an accumulator function
  - Inputs: `array` (array to reduce), `initial` (initial accumulator value), `function` (reducer function name)
  - The function receives `{ accumulator: current, element: value }` for each element
  - Returns: final accumulated value

#### Special Nodes (`src/lib/nodes/special/`)
- **Value**: Provides a constant/hardcoded value to the graph (supports arrays)
- **Output**: Marks final output values

## Graph JSON Format

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "NodeType",
      "data": {
        "param1": "value1"
      }
    }
  ],
  "edges": [
    {
      "from": {
        "node": "source-node-id",
        "port": "output-port-name"
      },
      "to": {
        "node": "target-node-id",
        "port": "input-port-name"
      }
    }
  ]
}
```

## Example Usage

### Simple Example
```json
{
  "nodes": [
    {
      "id": "value1",
      "type": "Value",
      "data": {
        "value": 10
      }
    },
    {
      "id": "value2",
      "type": "Value",
      "data": {
        "value": 5
      }
    },
    {
      "id": "add",
      "type": "Add",
      "data": {}
    },
    {
      "id": "output",
      "type": "Output",
      "data": {
        "outputs": ["result"]
      }
    }
  ],
  "edges": [
    {
      "from": { "node": "value1", "port": "out" },
      "to": { "node": "add", "port": "in0" }
    },
    {
      "from": { "node": "value2", "port": "out" },
      "to": { "node": "add", "port": "in1" }
    },
    {
      "from": { "node": "add", "port": "out" },
      "to": { "node": "output", "port": "result" }
    }
  ]
}
```

This example:
1. Creates two Value nodes with values 10 and 5
2. Connects both values to an Add node (inputs in0 and in1)
3. The Add node sums all inputs: 10 + 5 = 15
4. The result is sent to the Output node

### Complex Example

See `static/complex-graph.json` for a more complex example with multiple operations running in parallel.

### Array Operations Example

See `static/array-operations.json` for a comprehensive example demonstrating:
- **Element-wise array addition**: `[1,2,3,4,5] + [10,20,30,40,50] = [11,22,33,44,55]`
- **Array-scalar multiplication**: `[11,22,33,44,55] * 5 = [55,110,165,220,275]`
- **Element-wise comparison**: `[55,110,165,220,275] > 150 = [false,false,true,true,true]`
- **Array filtering with If node**: Separate values into two arrays based on boolean array
- **Switch node**: Route values to different outputs based on case matching

## Visualization

The implementation uses SvelteFlow for graph visualization. The graph is automatically converted from the JSON format to SvelteFlow's format.

## Array-Aware Operations

All math and comparison operations now support **array-aware execution**:

### How It Works
- When any input to a node is an array, the operation becomes element-wise
- Scalar values are broadcast to match array length
- All inputs are aligned to the longest array

### Examples
```javascript
// Math operations
[1, 2, 3] + [10, 20, 30] = [11, 22, 33]  // element-wise addition
[1, 2, 3] * 5 = [5, 10, 15]              // scalar broadcast
[10, 20, 30] - [1, 2, 3] = [9, 18, 27]   // element-wise subtraction

// Comparison operations
[1, 5, 10, 15, 20] > 10 = [false, false, false, true, true]
[1, 2, 3] == [1, 5, 3] = [true, false, true]

// Array filtering with If node
condition: [true, false, true, false, true]
true input: [10, 20, 30, 40, 50]
false input: [10, 20, 30, 40, 50]
→ trueOut: [10, 30, 50]
→ falseOut: [20, 40]
```

### Control Flow with Arrays
- **Compare**: Produces boolean arrays when comparing arrays
- **If**: Filters arrays based on boolean array conditions
  - `trueOut`: Elements where condition is true
  - `falseOut`: Elements where condition is false
- **Switch**: Routes values to different outputs based on case values

## Dynamic Inputs for Math Operations

Math operations now support dynamic inputs based on the number of connections:

- Connect any number of Value nodes to a math operation node
- Use port names `in0`, `in1`, `in2`, etc. for multiple inputs
- Example: To add three numbers, connect them to `in0`, `in1`, and `in2` ports of an Add node

## Adding New Nodes

To add a new node type:

1. Create a new file in the appropriate category folder
2. Implement the `NodeDefinition` interface
3. Register the node in `src/lib/nodes/index.ts`

Example:
```typescript
import type { NodeDefinition } from '../../dataflow/types';

export const MyNode: NodeDefinition = {
  type: 'MyNode',
  category: 'math',
  description: 'Does something cool',
  execute(context) {
    const input = context.getInputValue('in');
    const result = /* process input */;
    context.setOutputValue('out', result);
  }
};
```

## Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features

- ✅ Modular architecture
- ✅ Type-safe implementation
- ✅ Graph visualization with SvelteFlow
- ✅ Multiple node categories
- ✅ JSON-based graph configuration
- ✅ Real-time evaluation
- ✅ Extensible node system
- ✅ Dynamic inputs for math operations
- ✅ Value nodes for constant values (supports arrays)
- ✅ **Array-aware operations** - element-wise math and comparisons
- ✅ **Array filtering** - conditional node filters arrays with boolean arrays
- ✅ **Switch node** - multi-case branching
- ✅ Removed Map/ForEach in favor of native array support
- ✅ **Function-based architecture** - functions as main execution units with name, graph, and nested functions
- ✅ **FunctionInput node** - generic object properties accessor with automatic output pins
- ✅ **GetProperty node** - optional property extraction for advanced cases
- ✅ **FunctionValue node** - reference functions as values that can be connected to pins
- ✅ **Interactive function navigation** - double-click FunctionValue nodes to view/edit functions
- ✅ **Clean architecture** - Map/Filter/Reduce fully function-based, no subgraphs

## Architecture Highlights

### Functions as Main Execution Units
- **Name**: Each function has a unique name serving as its ID
- **Graph**: Contains nodes and edges defining the function logic
- **Nested Functions**: Functions can reference and call other functions in the same graph
- **Input**: Single JSON object with properties
- **Output**: Produced at the end of execution

### Direct Property Access
The FunctionInput node automatically creates output pins for object properties, eliminating the need for GetProperty nodes in most scenarios. This makes function graphs cleaner and more intuitive.

**Note:** The system now uses a **pure function-based architecture**. Subgraphs are no longer supported.

## Migration Guide

### Old Approach (Subgraphs - No Longer Supported)
```json
{
  "id": "map_double",
  "type": "Map",
  "data": {},
  "subgraph": {
    "nodes": [
      {
        "id": "element",
        "type": "Input",
        "data": {}
      },
      ...
    ],
    "edges": [...]
  }
}
```

### New Approach (Function-Based - Current)
```json
{
  "nodes": [
    {
      "id": "double_func",
      "type": "FunctionValue",
      "data": {
        "functionName": "double"
      }
    },
    {
      "id": "map_double",
      "type": "Map",
      "data": {}
    }
  ],
  "edges": [
    {
      "from": { "node": "double_func", "port": "out" },
      "to": { "node": "map_double", "port": "function" }
    }
  ],
  "functions": [
    {
      "name": "double",
      "description": "Doubles the element value",
      "graph": {
        "nodes": [
          {
            "id": "input",
            "type": "FunctionInput",
            "data": {}
          },
          {
            "id": "two",
            "type": "Value",
            "data": { "value": 2 }
          },
          {
            "id": "multiply",
            "type": "Multiply",
            "data": {}
          },
          {
            "id": "output",
            "type": "Output",
            "data": { "outputs": ["result"] }
          }
        ],
        "edges": [
          {
            "from": { "node": "input", "port": "element" },
            "to": { "node": "multiply", "port": "in0" }
          },
          {
            "from": { "node": "two", "port": "out" },
            "to": { "node": "multiply", "port": "in1" }
          },
          {
            "from": { "node": "multiply", "port": "out" },
            "to": { "node": "output", "port": "result" }
          }
        ]
      }
    }
  ]
}
```

Note: The FunctionInput node now provides direct access to properties via output pins (`element`, `index`, etc.), eliminating the need for GetProperty nodes.

### Benefits of Function-Based Architecture

1. **Reusability**: Define once, use multiple times across different operations
2. **Naming**: Clear function names (IDs) describe purpose
3. **Organization**: Functions are the main execution units, listed separately from node instances
4. **Composition**: Functions can reference and call other nested functions
5. **Navigation**: Double-click FunctionValue nodes to view/edit function definitions
6. **Clean Architecture**: Consistent pattern throughout - no mixed approaches
7. **Direct Property Access**: FunctionInput automatically exposes object properties as output pins

See `static/function-based.json` and `static/map-filter-reduce.json` for complete examples.
