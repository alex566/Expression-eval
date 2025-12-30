# CEL (Common Expression Language) Integration

## Overview

Expression-eval now uses CEL (Common Expression Language) as its core evaluation engine. Graphs are compiled to CEL expressions and evaluated using the @bufbuild/cel package.

## How It Works

### 1. Graph to CEL Compilation

When you build a graph, it's automatically compiled to a CEL expression:

**Example Graph:**
- Value(10) → Add.in0
- Value(5) → Add.in1
- Add.out → Output

**Compiled CEL:**
```cel
(10 + 5)
```

### 2. Evaluation with Input Data

You can provide JSON input data that's accessible via the `input` variable in CEL:

**Input Data:**
```json
{
  "age": 25,
  "name": "John"
}
```

**CEL Expression:**
```cel
input.age > 18 ? "Adult" : "Minor"
```

**Result:**
```json
"Adult"
```

## Node Types and CEL Compilation

### Value Nodes
Compile to literal values:
```cel
10
"hello"
[1, 2, 3]
{"key": "value"}
```

### Math Nodes
Compile to arithmetic operators:
```cel
(a + b)    // Add
(a - b)    // Subtract
(a * b)    // Multiply
(a / b)    // Divide
(a % b)    // Modulo
```

### Compare Node
Compiles to comparison operators:
```cel
(a == b)
(a > b)
(a < b)
(a >= b)
(a <= b)
(a != b)
```

### If Node
Compiles to ternary operator:
```cel
(condition ? trueValue : falseValue)
```

### Expression Node
Custom CEL expressions:
```cel
element > 10
element * 2
input.scores.size() > 0
```

### Array Operations

**Map:**
```cel
[1, 2, 3].map(element, element * 2)
// Result: [2, 4, 6]
```

**Filter:**
```cel
[1, 2, 3, 4, 5].filter(element, element > 2)
// Result: [3, 4, 5]
```

**Reduce:**
Custom reduce implementation (simplified in current version)

## Using Expression Nodes

Expression nodes are powerful - they let you write CEL expressions directly:

1. Add an Expression node
2. Set the expression in the node data: `element > 18`
3. Connect it to other nodes (e.g., If.condition)

**Example:**
```
Input → Expression("input.age >= 18") → If.condition
Value("Adult") → If.true
Value("Minor") → If.false
If.out → Output
```

## CEL Console

The CEL Console shows:
- **Compiled Expression**: The CEL expression generated from your graph
- **Input Data**: JSON input for evaluation
- **Result**: The evaluated result as JSON

## Limitations

Current implementation has some limitations:
- Reduce operation is simplified
- Expression nodes need proper context handling
- Input node should provide access to input properties

## Future Enhancements

- Full reduce implementation with fold
- Better expression node context
- More CEL built-in functions
- Custom function definitions
- Type validation using CEL types

## References

- [CEL Specification](https://github.com/google/cel-spec)
- [@bufbuild/cel Documentation](https://github.com/bufbuild/cel-es)
