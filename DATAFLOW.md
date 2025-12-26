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
- **Add**: Adds a value to the input
- **Subtract**: Subtracts a value from the input
- **Multiply**: Multiplies the input by a factor
- **Divide**: Divides the input by a divisor

#### Control Flow (`src/lib/nodes/control/`)
- **If**: Conditional branching
- **Compare**: Compares two values
- **ForEach**: Iterates over an array
- **Map**: Transforms an array

#### Special Nodes (`src/lib/nodes/special/`)
- **Start**: Provides initial input values
- **Collect**: Collects multiple inputs into a single output
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
      "id": "start",
      "type": "Start",
      "data": {
        "value": { "A": 10, "B": 20 }
      }
    },
    {
      "id": "add",
      "type": "Add",
      "data": { "amount": 5 }
    },
    {
      "id": "collect",
      "type": "Collect",
      "data": { "inputs": ["result"] }
    }
  ],
  "edges": [
    {
      "from": { "node": "start", "port": "A" },
      "to": { "node": "add", "port": "in" }
    },
    {
      "from": { "node": "add", "port": "out" },
      "to": { "node": "collect", "port": "result" }
    }
  ]
}
```

This example:
1. Starts with A=10
2. Adds 5 to get 15
3. Collects the result

### Complex Example

See `static/complex-graph.json` for a more complex example with multiple operations running in parallel.

## Visualization

The implementation uses SvelteFlow for graph visualization. The graph is automatically converted from the JSON format to SvelteFlow's format.

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
