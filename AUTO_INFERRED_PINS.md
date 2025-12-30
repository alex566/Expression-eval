# Automatic Input Pin Name and Type Inference

## Overview

The graph system automatically infers input pin names and types from connected output ports for dynamic input nodes. This feature makes the graph more intuitive and allows expressions to use semantic names instead of generic placeholders.

## Dynamic vs Static Nodes

### Dynamic Input Nodes
Nodes with **empty `inputs` array** in their definition have dynamic inputs:
- **Expression** - CEL expressions with custom input names
- **CreateObject** - Creates objects with custom property names
- **Output** - Marks final outputs with custom names

For these nodes, **both the name and type** of the source output port propagate to the input port.

### Static Input Nodes
Nodes with **predefined `inputs` array** have static inputs:
- **If** - Has fixed inputs: `condition`, `true`, `false`
- **Compare** - Has fixed inputs: `a`, `b`
- **Map/Filter/Reduce** - Have fixed inputs like `array`, `expression`

For these nodes, input names remain as defined and only types are inferred.

## Output-to-Input Name Propagation

### How It Works

When connecting an output port to a dynamic input node:

1. **User makes connection** in the UI from source output (e.g., "result") to target node
2. **System detects** if target node has dynamic inputs (empty `inputs` array)
3. **For dynamic nodes**: Uses source output port name as target input port name
4. **For static nodes**: Uses predefined input port name
5. **Type inference**: Propagates type from source output to target input
6. **UI updates**: Shows input with both name and type from source

### Example: Expression Node with Named Inputs

**Before (generic names):**
```javascript
{
  id: "calculate",
  type: "Expression",
  data: { expression: "in0 + in1" }  // Using generic names
}

edges: [
  { from: { node: "value1", port: "out" }, to: { node: "calculate", port: "in0" } },
  { from: { node: "value2", port: "out" }, to: { node: "calculate", port: "in1" } }
]
```

**After (semantic names):**
```javascript
{
  id: "calculate",
  type: "Expression",
  data: { expression: "(price * quantity) * (1.0 + taxRate)" }  // Semantic names!
}

edges: [
  { from: { node: "price", port: "out" }, to: { node: "calculate", port: "price" } },
  { from: { node: "quantity", port: "out" }, to: { node: "calculate", port: "quantity" } },
  { from: { node: "taxRate", port: "out" }, to: { node: "calculate", port: "taxRate" } }
]
```

The Expression node now has inputs named "price", "quantity", "taxRate" instead of "in0", "in1", "in2", making the expression more readable!

## Output Node Auto-Inference

Output nodes automatically infer input pin names from connected edges:

### Before
Output nodes required manual configuration:
```javascript
{
  id: "output",
  type: "Output",
  data: {
    outputs: ["result", "status", "value"]  // Manual specification
  }
}
```

### After
Output nodes use source port names:
```javascript
{
  id: "output",
  type: "Output",
  data: {}  // No configuration needed!
}

edges: [
  { from: { node: "calc", port: "out" }, to: { node: "output", port: "total" } }
]
// Creates input named "total" with type from calc.out
```

## Benefits

1. **Semantic Names**: Use meaningful names instead of "in0", "in1", "in2"
2. **Type Propagation**: Both names AND types flow from outputs to inputs
3. **Self-Documenting**: Graph structure is clearer and easier to understand
4. **Expression Clarity**: CEL expressions use readable variable names
5. **Less Configuration**: No need to pre-configure output arrays
6. **Backward Compatible**: Existing graphs with manual configuration still work

## Sample Graph

See the `name-propagation` sample graph for a complete example demonstrating:
- Expression nodes with semantic input names (price, quantity, taxRate)
- Output node with auto-inferred input name (total)
- Type propagation showing correct types on all connections
- CEL expression using readable variable names

## Implementation Details

### Connection Handler (`src/routes/+page.svelte`)
```typescript
function handleConnect(connection: Connection) {
  const targetNode = graph.nodes.find(n => n.id === connection.target);
  const nodeDefinition = nodeRegistry.get(targetNode.type);
  const hasDynamicInputs = nodeDefinition?.inputs?.length === 0;
  
  const targetPort = hasDynamicInputs 
    ? connection.sourceHandle  // Use source name for dynamic nodes
    : connection.targetHandle; // Use target name for static nodes
  
  // Create edge with appropriate port name...
}
```

### Port Generation (`src/lib/utils/graph-converter.ts`)
The `getNodePorts` function:
1. Detects dynamic nodes (empty `inputs` array)
2. Extracts input port names from edges: `edge.to.port`
3. Adds extra connector for new connections
4. Applies inferred types from type inference engine

### Type Inference (`src/lib/dataflow/type-inference.ts`)
The type inference engine:
1. Processes nodes in topological order
2. Maps `edge.to.port` → type from source node's output
3. Stores type information in `NodeTypeInfo.inputTypes`
4. Port display shows both name and type

## Migration Guide

### For New Connections
When creating connections in the UI, the system automatically uses source output names for dynamic nodes.

### For Existing Graphs  
Existing graphs with explicit port names continue to work - the names are read from the edges and used as-is.

### Best Practices
1. **Use semantic node IDs**: Name nodes descriptively (e.g., "price" not "value1")
2. **Leverage name propagation**: Let output names flow to dynamic inputs
3. **Write readable expressions**: Use propagated names in CEL expressions
4. **Static nodes unchanged**: If/Compare/etc. still use predefined names
