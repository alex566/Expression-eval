# Dataflow Logic Implementation

This implementation provides a modular and clean dataflow graph system for Expression-eval with support for both traditional node-based graphs and modern function-based architecture.

## Architecture

### Core Components

1. **Types & Interfaces** (`src/lib/dataflow/types.ts`)
   - `Graph`: Represents the complete dataflow graph
   - `GraphNode`: Individual node in the graph
   - `GraphEdge`: Connections between nodes
   - `FunctionDefinition`: Defines reusable functions within the graph
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

The system now supports a **function-based architecture** where graphs can define reusable functions that can be called multiple times with different inputs.

### Key Concepts

#### 1. Functions
Functions are the main composition element in the new architecture. Each function:
- Has a unique name
- Contains its own graph (nodes and edges)
- Accepts a single JSON object as input
- Returns a single output value

#### 2. Main Function
Every function-based graph has a "main" function that serves as the entry point. Other functions can be defined and called from the main function or from each other.

#### 3. Function Nodes

##### FunctionInput Node
- Represents the input to a function (JSON object)
- Entry point for function graphs
- Gets replaced with actual input values during execution

##### GetProperty Node
- Extracts a property from a JSON object
- Takes a JSON object input and outputs a single property value
- Essential for decomposing function inputs

##### FunctionRef Node
- Calls a function by name
- Accepts a JSON object as input
- Returns the function's output
- Currently used internally by Map/Filter/Reduce nodes

### Example: Function-Based Graph

```json
{
  "nodes": [...],  // Main graph nodes
  "edges": [...],  // Main graph edges
  "functions": [   // Function definitions
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
            "id": "getElement",
            "type": "GetProperty",
            "data": { "property": "element" }
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
        "edges": [...]
      }
    }
  ]
}
```

### Using Functions with Array Operations

The Map, Filter, and Reduce nodes now support function references:

```json
{
  "id": "map_double",
  "type": "Map",
  "data": {
    "functionName": "double"
  }
}
```

When Map processes each array element:
1. It wraps the element in a JSON object: `{ element: value }`
2. Passes this object to the function
3. The function uses GetProperty to extract the element
4. Processes it and returns the result

This approach provides:
- **Reusability**: Define a function once, use it multiple times
- **Composition**: Functions can call other functions
- **Clarity**: Function names describe what they do
- **Modularity**: Functions are self-contained units

## Node Categories

Nodes are organized in separate folders by category:

#### Function Nodes (`src/lib/nodes/function/`)
- **FunctionInput**: Represents the input JSON object to a function (entry point)
- **GetProperty**: Extracts a property from a JSON object
  - Example: Extract "element" from `{ element: 5, index: 0 }` → returns `5`
- **FunctionRef**: Calls a function by name with a JSON object input (internal use)

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
- ✅ **Function-based architecture** - reusable functions with JSON object inputs
- ✅ **GetProperty node** - extract properties from JSON objects
- ✅ **FunctionInput node** - define function entry points
- ✅ **Backward compatibility** - supports both function-based and legacy subgraph approaches

## Migration from Subgraphs to Functions

The system maintains backward compatibility with the old subgraph approach while supporting the new function-based architecture.

### Old Approach (Subgraphs)
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

### New Approach (Functions)
```json
{
  "nodes": [
    {
      "id": "map_double",
      "type": "Map",
      "data": {
        "functionName": "double"
      }
    }
  ],
  "functions": [
    {
      "name": "double",
      "graph": {
        "nodes": [
          {
            "id": "input",
            "type": "FunctionInput",
            "data": {}
          },
          {
            "id": "getElement",
            "type": "GetProperty",
            "data": { "property": "element" }
          },
          ...
        ],
        "edges": [...]
      }
    }
  ]
}
```

### Benefits of Function-Based Architecture

1. **Reusability**: Define once, use multiple times
2. **Naming**: Clear function names describe purpose
3. **Organization**: Functions are listed separately from main graph
4. **Composition**: Functions can call other functions (future enhancement)
5. **Testing**: Functions can be tested independently (future enhancement)

See `static/function-based.json` for a complete example.
