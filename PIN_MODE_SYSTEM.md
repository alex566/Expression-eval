# Pin Mode System: Static vs Inferred

## Overview

This document describes the pin mode system that distinguishes between static (user-defined or schema-based) and dynamically inferred pin types and names.

## Pin Mode Types

### Static Mode (📌)
- **Definition**: Pin name or type is explicitly defined and fixed
- **Sources**: 
  - Schema definitions (Input node)
  - User customization via modal dialogs
  - Node definition (e.g., If node's "condition" pin)
- **Indicator**: Green pushpin emoji 📌

### Inferred Mode (🔄)
- **Definition**: Pin name or type is dynamically determined from graph connections
- **Sources**:
  - Type inference from connected nodes
  - Name propagation from output to input pins
  - Expression analysis (Expression node)
- **Indicator**: Blue circular arrows emoji 🔄

## Node-Specific Behavior

### Input Node
```typescript
{
  type: 'Input',
  data: {
    inputSchema: { name: 'string', age: 'number' },  // Static names
    inputSchemaTypes: { age: 'int' }  // User override → static type
  }
}
```
- **Output Pins**: 
  - Names: Static (from schema)
  - Types: Inferred from schema by default, can be overridden
- **Editing**: Double-click to open modal, add/edit field types
- **Use Case**: Define the structure of input data with type safety

### Expression Node
```typescript
{
  type: 'Expression',
  data: {
    expression: 'in0 + in1',
    outputName: 'sum',  // User override → static
    outputNameMode: 'static'
  }
}
```
- **Input Pins**:
  - Names: Inferred from connected output port names
  - Types: Inferred from connected nodes
- **Output Pin**:
  - Name: Defaults to "out", can be customized
  - Type: Inferred from expression analysis
- **Editing**: Double-click to customize output name
- **Use Case**: Create meaningful output names for complex calculations

### If Node
```typescript
{
  type: 'If',
  data: {
    outputName: 'result'  // User override → static
  }
}
```
- **Input Pins**:
  - `condition`: Static name & type (boolean)
  - `true`: Static name, inferred type
  - `false`: Static name, inferred type
- **Output Pin**:
  - Name: Defaults to "out", can be customized
  - Type: Unified type from true/false branches
- **Editing**: Double-click to customize output name
- **Use Case**: Make conditional outputs more readable

### Output Node
```typescript
{
  type: 'Output',
  data: {
    outputNames: {
      'ageCategory': 'userCategory',  // Rename in output JSON
      'result': 'finalValue'
    }
  }
}
```
- **Input Pins**:
  - Names: Inferred from connected output port names
  - Types: Inferred from connected nodes
  - Can be customized to rename fields in output JSON
- **Editing**: Double-click to customize output field names
- **Use Case**: Control the structure of the final output JSON

## UI Interactions

### Visual Indicators

**Node Borders:**
- **Green border**: Editable nodes (Input, Expression, If, Output)
- **Purple border**: Subgraph nodes (FunctionValue)
- **Default border**: Non-editable nodes

**Pin Labels:**
```
name: type 📌   ← Static pin
name: type 🔄   ← Inferred pin
```

### Editing Flow

1. **Identify editable node** - Look for green border
2. **Double-click node** - Opens edit modal
3. **Make changes** - Edit names, types, or add fields
4. **Save** - Changes applied immediately
5. **Visual update** - Pin indicators change to 📌 for customized values

## Implementation Details

### Type System Extensions

```typescript
export enum PinMode {
  Static = 'static',
  Inferred = 'inferred'
}

export interface PortSpec {
  name: string;
  type: string;
  displayName?: string;
  nameMode?: PinMode;  // New
  typeMode?: PinMode;  // New
}
```

### Mode Determination Logic

**In `graph-converter.ts`:**

```typescript
// Input node - schema-based static
if (nodeType === 'Input') {
  outputs = schemaKeys.map(key => ({
    name: key,
    type: userTypes[key] || inferredType,
    nameMode: PinMode.Static,
    typeMode: userTypes[key] ? PinMode.Static : PinMode.Inferred
  }));
}

// Expression node - inferred inputs
if (nodeType === 'Expression') {
  inputs = connectedPorts.map(name => ({
    name,
    type: inferredType,
    nameMode: PinMode.Inferred,
    typeMode: PinMode.Inferred
  }));
}

// Custom output name
if (nodeData.outputName) {
  output.name = nodeData.outputName;
  output.nameMode = PinMode.Static;
}
```

### Modal Components

**NodeEditModal.svelte** provides editing interfaces for:
- Input node: Add/edit field types
- Expression node: Customize output name
- If node: Customize output name
- Output node: Customize output field names

## Best Practices

### When to Use Static Pins

1. **Input Validation**: Define exact types expected in input data
2. **API Contracts**: Match output structure to API requirements
3. **Code Readability**: Use meaningful names instead of generic "out"
4. **Type Safety**: Override inferred types when you need stricter validation

### When to Rely on Inferred Pins

1. **Rapid Prototyping**: Let the system infer types automatically
2. **Simple Graphs**: Default behavior works for straightforward cases
3. **Flexible Data**: When input structure varies
4. **Connected Workflows**: Name propagation keeps names consistent

## Examples

### Example 1: Type-Safe Input Processing

```json
{
  "nodes": [
    {
      "id": "input",
      "type": "Input",
      "data": {
        "inputSchema": { "age": "number", "name": "string" },
        "inputSchemaTypes": { "age": "int" }  // Force integer, not double
      }
    }
  ]
}
```

### Example 2: Readable Expression Output

```json
{
  "nodes": [
    {
      "id": "calc",
      "type": "Expression",
      "data": {
        "expression": "price * quantity * (1 + taxRate)",
        "outputName": "totalWithTax"  // Better than "out"
      }
    }
  ]
}
```

### Example 3: Custom Output Structure

```json
{
  "nodes": [
    {
      "id": "output",
      "type": "Output",
      "data": {
        "outputNames": {
          "ageCategory": "userAgeGroup",
          "result": "finalCalculation"
        }
      }
    }
  ]
}
```
Output becomes:
```json
{
  "userAgeGroup": "Adult",
  "finalCalculation": 42
}
```

## Migration Guide

### Existing Graphs

All existing graphs continue to work without changes:
- Pins without mode specification default to previous behavior
- Type inference works the same as before
- No breaking changes to graph structure

### Upgrading Graphs

To take advantage of the new system:

1. **Add type overrides to Input nodes**: Specify exact types for validation
2. **Customize Expression outputs**: Give meaningful names to calculations
3. **Rename Output fields**: Match your API or data model requirements

## Technical Architecture

### Data Flow

```
User Action (Double-click)
  ↓
NodeEditModal Opens
  ↓
User Makes Changes
  ↓
Save Handler
  ↓
Update Node Data (outputName, inputSchemaTypes, etc.)
  ↓
Graph Converter
  ↓
Apply Mode Markers (Static/Inferred)
  ↓
CustomNode Rendering
  ↓
Display Indicators (📌/🔄)
```

### Type Inference Integration

The pin mode system integrates with the existing type inference engine:

1. **Static pins** bypass inference - use defined types
2. **Inferred pins** use inference results
3. **Mixed mode** is supported (static name, inferred type)
4. **User overrides** take precedence over inference

## Future Enhancements

Potential improvements:

1. **Validation**: Warn when static types conflict with inferred types
2. **Bulk Editing**: Edit multiple pins at once
3. **Templates**: Save common pin configurations
4. **Type Hints**: Suggest types based on usage patterns
5. **Import/Export**: Share pin configurations between graphs

## Conclusion

The pin mode system provides fine-grained control over pin behavior while maintaining the flexibility of automatic type inference. It enables both rapid prototyping with inferred types and production-ready graphs with explicit type definitions.
