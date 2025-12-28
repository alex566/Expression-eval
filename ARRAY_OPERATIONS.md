# Array Operations in Expression-eval

This document demonstrates the array operation capabilities of the Expression-eval dataflow system.

## Overview

The dataflow system supports **array operations** through dedicated nodes:

1. **Map node** - Transform each element of an array using a function
2. **Filter node** - Filter array elements using a predicate function
3. **Reduce node** - Reduce an array to a single value using an accumulator function

## Single Operation Nodes

All single operation nodes (Math and Control nodes) work with **single values only**:

- **Math nodes** (Add, Subtract, Multiply, Divide, Modulo) - Perform operations on single numbers
- **Control nodes** (Compare, If) - Work with single values and conditions

**For array operations, you must use Map/Filter/Reduce nodes.**

## How Array Operations Work

### Map Node

The Map node applies a transformation function to each element of an array.

**Example: Multiply each element by 2**

```json
{
  "functions": [
    {
      "name": "multiplyByTwo",
      "graph": {
        "nodes": [
          { "id": "input", "type": "FunctionInput", "data": {} },
          { "id": "two", "type": "Value", "data": { "value": 2 } },
          { "id": "multiply", "type": "Multiply", "data": {} }
        ],
        "edges": [
          { "from": { "node": "input", "port": "element" }, "to": { "node": "multiply", "port": "in0" } },
          { "from": { "node": "two", "port": "out" }, "to": { "node": "multiply", "port": "in1" } }
        ]
      }
    }
  ],
  "nodes": [
    { "id": "array", "type": "Value", "data": { "value": [1, 2, 3, 4, 5] } },
    { "id": "func", "type": "FunctionValue", "data": { "functionName": "multiplyByTwo" } },
    { "id": "map", "type": "Map", "data": {} }
  ],
  "edges": [
    { "from": { "node": "array", "port": "out" }, "to": { "node": "map", "port": "array" } },
    { "from": { "node": "func", "port": "out" }, "to": { "node": "map", "port": "function" } }
  ]
}
```

**Result:** `[2, 4, 6, 8, 10]`

### Filter Node

The Filter node filters array elements using a predicate function.

**Example: Filter values greater than 10**

```json
{
  "functions": [
    {
      "name": "greaterThan10",
      "graph": {
        "nodes": [
          { "id": "input", "type": "FunctionInput", "data": {} },
          { "id": "threshold", "type": "Value", "data": { "value": 10 } },
          { "id": "compare", "type": "Compare", "data": { "operator": ">" } }
        ],
        "edges": [
          { "from": { "node": "input", "port": "element" }, "to": { "node": "compare", "port": "a" } },
          { "from": { "node": "threshold", "port": "out" }, "to": { "node": "compare", "port": "b" } }
        ]
      }
    }
  ],
  "nodes": [
    { "id": "data", "type": "Value", "data": { "value": [5, 15, 8, 20, 12, 3] } },
    { "id": "func", "type": "FunctionValue", "data": { "functionName": "greaterThan10" } },
    { "id": "filter", "type": "Filter", "data": {} }
  ],
  "edges": [
    { "from": { "node": "data", "port": "out" }, "to": { "node": "filter", "port": "array" } },
    { "from": { "node": "func", "port": "out" }, "to": { "node": "filter", "port": "function" } }
  ]
}
```

**Result:** `[15, 20, 12]`

### Reduce Node

The Reduce node reduces an array to a single value using an accumulator function.

**Example: Sum all elements**

```json
{
  "functions": [
    {
      "name": "sum",
      "graph": {
        "nodes": [
          { "id": "input", "type": "FunctionInput", "data": {} },
          { "id": "add", "type": "Add", "data": {} }
        ],
        "edges": [
          { "from": { "node": "input", "port": "accumulator" }, "to": { "node": "add", "port": "in0" } },
          { "from": { "node": "input", "port": "element" }, "to": { "node": "add", "port": "in1" } }
        ]
      }
    }
  ],
  "nodes": [
    { "id": "array", "type": "Value", "data": { "value": [1, 2, 3, 4, 5] } },
    { "id": "initial", "type": "Value", "data": { "value": 0 } },
    { "id": "func", "type": "FunctionValue", "data": { "functionName": "sum" } },
    { "id": "reduce", "type": "Reduce", "data": {} }
  ],
  "edges": [
    { "from": { "node": "array", "port": "out" }, "to": { "node": "reduce", "port": "array" } },
    { "from": { "node": "initial", "port": "out" }, "to": { "node": "reduce", "port": "initial" } },
    { "from": { "node": "func", "port": "out" }, "to": { "node": "reduce", "port": "function" } }
  ]
}
```

**Result:** `15`

## Node Reference

### Array Operation Nodes

#### Map
- **Inputs:** array (array), function (string - function name)
- **Output:** array
- **Behavior:** Applies the function to each element, passing `{ element: value }` to the function

#### Filter
- **Inputs:** array (array), function (string - function name)
- **Output:** array
- **Behavior:** Includes elements where the function returns truthy, passing `{ element: value }` to the function

#### Reduce
- **Inputs:** array (array), initial (any), function (string - function name)
- **Output:** any
- **Behavior:** Reduces the array using an accumulator, passing `{ accumulator, element }` to the function

### Math Nodes (Single Values Only)

#### Add
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single number
- **Behavior:** Adds all input numbers together

#### Subtract
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single number
- **Behavior:** Subtracts all subsequent inputs from the first input

#### Multiply
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single number
- **Behavior:** Multiplies all input numbers together

#### Divide
- **Inputs:** Dynamic (in0, in1, in2, ...)
- **Output:** Single number
- **Behavior:** Divides the first input by all subsequent inputs

### Control Nodes (Single Values Only)

#### Compare
- **Inputs:** a, b
- **Output:** Boolean
- **Operators:** ==, ===, !=, !==, >, >=, <, <=
- **Behavior:** Compares two single values

#### If
- **Inputs:** condition (boolean), true (any), false (any)
- **Outputs:** out
- **Behavior:** Outputs either true or false value based on the condition

#### Switch
- **Inputs:** value (any)
- **Outputs:** Dynamic based on cases configuration + default
- **Configuration:** `cases` object mapping values to output port names
- **Behavior:** Routes input to matching case output, or default if no match

## Complete Example: Array Pipeline

To create a complete array processing pipeline:

1. **Map**: Transform each element
2. **Filter**: Keep only elements matching a condition  
3. **Reduce**: Combine all elements into a final result

Example: Sum of squares of even numbers

```
[1,2,3,4,5] 
  → Map(x => x * x) 
  → [1,4,9,16,25]
  → Filter(x => x % 2 == 0)
  → [4,16]
  → Reduce((acc, x) => acc + x, 0)
  → 20
```

## Benefits

1. **Clear separation** - Single operations vs. array operations
2. **Functional approach** - Map/Filter/Reduce pattern is well-understood
3. **Composability** - Easy to chain array operations
4. **Flexibility** - Functions can contain complex logic
5. **Type safety** - Clear distinction between single values and arrays
