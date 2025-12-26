# Dataflow Logic Implementation

This implementation provides a modular and clean dataflow graph system for Expression-eval.

## Architecture

### Core Components

1. **Types & Interfaces** (`src/lib/dataflow/types.ts`)
   - `Graph`: Represents the complete dataflow graph
   - `GraphNode`: Individual node in the graph
   - `GraphEdge`: Connections between nodes
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

### Node Categories

Nodes are organized in separate folders by category:

#### Math Operations (`src/lib/nodes/math/`)
- **Add**: Adds all connected input values together (dynamic inputs: in0, in1, in2, ...)
- **Subtract**: Subtracts all subsequent inputs from the first input (in0 - in1 - in2 - ...)
- **Multiply**: Multiplies all connected input values together (dynamic inputs: in0, in1, in2, ...)
- **Divide**: Divides the first input by all subsequent inputs (in0 / in1 / in2 / ...)

#### Control Flow (`src/lib/nodes/control/`)
- **If**: Conditional branching
- **Compare**: Compares two values
- **ForEach**: Iterates over an array
- **Map**: Transforms an array

#### Special Nodes (`src/lib/nodes/special/`)
- **Value**: Provides a constant/hardcoded value to the graph
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

## Visualization

The implementation uses SvelteFlow for graph visualization. The graph is automatically converted from the JSON format to SvelteFlow's format.

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
- ✅ Value nodes for constant values
