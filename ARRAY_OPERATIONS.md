# Array Operations in Expression-eval

This document demonstrates the new array-aware capabilities of the Expression-eval dataflow system.

## Overview

The dataflow system now supports **native array operations** with the following features:

1. **Element-wise math operations** - All math nodes (Add, Subtract, Multiply, Divide) automatically handle arrays
2. **Array comparisons** - Compare node produces boolean arrays when comparing arrays
3. **Array filtering** - If node can filter arrays based on boolean array conditions
4. **Switch node** - Multi-case routing for control flow
5. **Removed Map/ForEach** - Replaced by native array support in all nodes

## How Array Operations Work

### Automatic Array Detection

When any input to a math or comparison node is an array, the operation automatically becomes element-wise:

```javascript
// Single values (traditional)
5 + 3 = 8

// Arrays (element-wise)
[1, 2, 3] + [10, 20, 30] = [11, 22, 33]

// Mixed (scalar broadcast)
[1, 2, 3] + 5 = [6, 7, 8]
```

### Array Alignment

When arrays of different lengths are combined, the shorter array's last element is repeated:

```javascript
[1, 2, 3, 4, 5] + [10, 20] = [11, 22, 23, 24, 25]
//                              10  20  20  20  20  (broadcast)
```

## Examples

### 1. Element-wise Addition

```json
{
  "nodes": [
    { "id": "array1", "type": "Value", "data": { "value": [1, 2, 3] } },
    { "id": "array2", "type": "Value", "data": { "value": [10, 20, 30] } },
    { "id": "add", "type": "Add", "data": {} }
  ],
  "edges": [
    { "from": { "node": "array1", "port": "out" }, "to": { "node": "add", "port": "in0" } },
    { "from": { "node": "array2", "port": "out" }, "to": { "node": "add", "port": "in1" } }
  ]
}
```

**Result:** `[11, 22, 33]`

### 2. Scalar Multiplication

```json
{
  "nodes": [
    { "id": "array", "type": "Value", "data": { "value": [2, 4, 6] } },
    { "id": "scalar", "type": "Value", "data": { "value": 5 } },
    { "id": "multiply", "type": "Multiply", "data": {} }
  ],
  "edges": [
    { "from": { "node": "array", "port": "out" }, "to": { "node": "multiply", "port": "in0" } },
    { "from": { "node": "scalar", "port": "out" }, "to": { "node": "multiply", "port": "in1" } }
  ]
}
```

**Result:** `[10, 20, 30]`

### 3. Array Comparison

```json
{
  "nodes": [
    { "id": "values", "type": "Value", "data": { "value": [1, 5, 10, 15, 20] } },
    { "id": "threshold", "type": "Value", "data": { "value": 10 } },
    { "id": "compare", "type": "Compare", "data": { "operator": ">" } }
  ],
  "edges": [
    { "from": { "node": "values", "port": "out" }, "to": { "node": "compare", "port": "a" } },
    { "from": { "node": "threshold", "port": "out" }, "to": { "node": "compare", "port": "b" } }
  ]
}
```

**Result:** `[false, false, false, true, true]`

### 4. Array Filtering with If Node

The If node can filter arrays based on a boolean array condition:

```json
{
  "nodes": [
    { "id": "data", "type": "Value", "data": { "value": [10, 20, 30, 40, 50] } },
    { "id": "condition", "type": "Value", "data": { "value": [true, false, true, false, true] } },
    { "id": "filter", "type": "If", "data": {} }
  ],
  "edges": [
    { "from": { "node": "condition", "port": "out" }, "to": { "node": "filter", "port": "condition" } },
    { "from": { "node": "data", "port": "out" }, "to": { "node": "filter", "port": "true" } },
    { "from": { "node": "data", "port": "out" }, "to": { "node": "filter", "port": "false" } }
  ]
}
```

**Results:**
- `trueOut`: `[10, 30, 50]` (elements where condition is true)
- `falseOut`: `[20, 40]` (elements where condition is false)

### 5. Complete Array Pipeline

Combining multiple array operations:

```
[1,2,3,4,5] + [10,20,30,40,50]
    ↓
[11,22,33,44,55] * 5
    ↓
[55,110,165,220,275] > 150
    ↓
[false,false,true,true,true] → filter
    ↓
trueOut: [165,220,275]
falseOut: [55,110]
```

### 6. Switch Node

Route values to different outputs based on case matching:

```json
{
  "nodes": [
    { "id": "value", "type": "Value", "data": { "value": "option2" } },
    {
      "id": "switch",
      "type": "Switch",
      "data": {
        "cases": {
          "option1": "case1",
          "option2": "case2",
          "option3": "case3"
        }
      }
    }
  ],
  "edges": [
    { "from": { "node": "value", "port": "out" }, "to": { "node": "switch", "port": "value" } }
  ]
}
```

The value "option2" is routed to the "case2" output port.

## Node Reference

### Math Nodes (Array-Aware)

#### Add
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single value or array
- **Behavior:** Element-wise addition when any input is an array

#### Subtract
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single value or array
- **Behavior:** Element-wise subtraction when any input is an array

#### Multiply
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single value or array
- **Behavior:** Element-wise multiplication when any input is an array

#### Divide
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single value or array
- **Behavior:** Element-wise division when any input is an array

### Control Nodes

#### Compare (Array-Aware)
- **Inputs:** a, b
- **Output:** Boolean or boolean array
- **Operators:** ==, ===, !=, !==, >, >=, <, <=
- **Behavior:** Element-wise comparison when any input is an array

#### If (Array-Aware)
- **Inputs:** condition (boolean/array), true (any), false (any)
- **Outputs:** out, trueOut, falseOut
- **Behavior:**
  - Single condition: outputs either true or false value
  - Array condition: filters inputs and outputs to trueOut/falseOut

#### Switch
- **Inputs:** value (any)
- **Outputs:** Dynamic based on cases configuration + default
- **Configuration:** `cases` object mapping values to output port names
- **Behavior:** Routes input to matching case output, or default if no match

## Complete Example

See `static/array-operations.json` for a complete example that demonstrates:
1. Element-wise array addition
2. Array-scalar multiplication
3. Element-wise comparison producing boolean array
4. Array filtering with If node
5. Switch node for value routing

## Migration Guide

### From ForEach/Map to Array Operations

**Old approach (removed):**
```json
{
  "nodes": [
    { "id": "data", "type": "Value", "data": { "value": [1,2,3] } },
    { "id": "forEach", "type": "ForEach", "data": {} }
  ]
}
```

**New approach (recommended):**
```json
{
  "nodes": [
    { "id": "data", "type": "Value", "data": { "value": [1,2,3] } },
    { "id": "transform", "type": "Multiply", "data": {} },
    { "id": "scalar", "type": "Value", "data": { "value": 2 } }
  ],
  "edges": [
    { "from": { "node": "data", "port": "out" }, "to": { "node": "transform", "port": "in0" } },
    { "from": { "node": "scalar", "port": "out" }, "to": { "node": "transform", "port": "in1" } }
  ]
}
```

Result: `[2, 4, 6]` (each element multiplied by 2)

## Benefits

1. **Simpler graphs** - No need for special loop/map nodes
2. **More intuitive** - Operations work the same for single values and arrays
3. **Better performance** - Native array operations are faster than iteration
4. **Composability** - Easy to chain array operations
5. **Flexibility** - Mix arrays and scalars naturally
