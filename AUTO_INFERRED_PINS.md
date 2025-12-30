# Automatic Input Pin Name Inference for Output Nodes

## Overview

As of this update, the Output node now automatically infers input pin names from connected edges, unifying it with the existing dynamic input inference system used by Expression nodes.

## What Changed

### Before
Output nodes required manual configuration of input pin names:

```javascript
{
  id: "output",
  type: "Output",
  data: {
    outputs: ["result", "status", "value"]  // Had to manually specify these
  }
}
```

### After
Output nodes automatically infer input pin names from edges:

```javascript
{
  id: "output",
  type: "Output",
  data: {}  // No configuration needed!
}

// When you connect edges like:
edges: [
  { from: {...}, to: { node: "output", port: "result" } },   // Creates 'result' input pin
  { from: {...}, to: { node: "output", port: "status" } },   // Creates 'status' input pin
  { from: {...}, to: { node: "output", port: "value" } }     // Creates 'value' input pin
]
```

## Benefits

1. **Consistency**: Output nodes now work like Expression nodes - both infer input pin names from connections
2. **Less Configuration**: No need to pre-configure the `outputs` array
3. **Automatic**: Pin names are automatically determined when you connect edges
4. **Backward Compatible**: Existing graphs with pre-configured `outputs` arrays still work perfectly
5. **Type Safe**: The type inference system works with automatically inferred pins

## How It Works

When the graph is processed:

1. The system looks at all edges targeting the Output node
2. For each edge, it extracts the target port name (`edge.to.port`)
3. It creates an input port with that name
4. If no edges are present, it falls back to the configured `outputs` array (backward compatibility)
5. An extra port is always added for dynamic connection

## Example

See the new `auto-inferred-output` sample graph which demonstrates this feature:

```javascript
// Three separate value nodes
{ id: "temperature", type: "Expression", data: { expression: "25" } }
{ id: "humidity", type: "Expression", data: { expression: "60" } }
{ id: "status", type: "Expression", data: { expression: '"optimal"' } }

// Output node with no pre-configuration
{ id: "output", type: "Output", data: {} }

// Edges that define the input pin names
edges: [
  { from: { node: "temperature", port: "out" }, to: { node: "output", port: "temperature" } },
  { from: { node: "humidity", port: "out" }, to: { node: "output", port: "humidity" } },
  { from: { node: "status", port: "out" }, to: { node: "output", port: "status" } }
]
```

In this example:
- The Output node automatically creates three input pins: `temperature`, `humidity`, and `status`
- No manual configuration of the `outputs` array was needed
- The pin names match what you're connecting to them

## Migration Guide

### Existing Graphs
No changes needed! Graphs with pre-configured `outputs` arrays continue to work as before.

### New Graphs
You can now omit the `outputs` array entirely and let the system infer pin names from your connections.

### Best Practices

1. **For new graphs**: Omit the `outputs` configuration and let the system infer names
2. **For existing graphs**: Keep the configuration for stability, or migrate gradually
3. **For dynamic scenarios**: You can still use the `outputs` configuration if you need pins before connecting edges

## Technical Details

The implementation is in:
- `src/lib/utils/graph-converter.ts` - `getNodePorts` function
- `src/lib/nodes/special/index.ts` - `OutputNode` definition

The logic prioritizes edge-based inference over configuration, ensuring the most accurate and up-to-date pin structure.
