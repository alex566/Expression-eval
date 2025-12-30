# Type Inference System for CEL Expressions

## Overview

The Expression-eval project now includes a comprehensive type inference system for CEL (Common Expression Language) expressions in dataflow graphs. This system analyzes the graph structure and automatically infers types for all nodes, propagating type information from inputs to outputs through the graph hierarchy.

## Key Features

### 1. Automatic Type Inference
- Types are automatically inferred as the graph is built
- Type information propagates from leaves (input nodes) to trunk (output nodes)
- No manual type annotations required for most cases

### 2. CEL Type System Integration
- Maps JavaScript types to CEL types (primitives, lists, maps, timestamps)
- Supports complex types with generic parameters (e.g., `list(int)`, `map(string, dyn)`)
- Type compatibility checking based on CEL semantics

### 3. Node-Level Type Inference
- Each node can define custom type inference logic via `inferOutputTypes`
- Nodes can infer output types based on input types and configuration
- Static types are supported for nodes with fixed output types

### 4. Graph-Level Type Checking
- Topological sort ensures types are inferred in dependency order
- Validates type compatibility at all edge connections
- Provides detailed error messages for type mismatches

## Architecture

### Core Components

#### TypeInferenceEngine (`src/lib/dataflow/type-inference.ts`)

The main type checking engine with these capabilities:

- **Type Inference**: Infers types for all nodes in the graph
- **Type Compatibility**: Checks if types are compatible for connections
- **Type Unification**: Finds the most specific common type for branches (e.g., If node)
- **Topological Sort**: Processes nodes in correct dependency order
- **Error Reporting**: Provides detailed type error messages

#### CEL Type System

Maps JavaScript runtime types to CEL types:

```typescript
const CELTypes = {
  // Primitive types
  NULL: 'null',
  BOOL: 'bool',
  INT: 'int',
  UINT: 'uint',
  DOUBLE: 'double',
  STRING: 'string',
  BYTES: 'bytes',
  
  // Complex types
  LIST: 'list',        // Generic list type
  MAP: 'map',          // Generic map type
  TIMESTAMP: 'google.protobuf.Timestamp',
  DURATION: 'google.protobuf.Duration',
  
  // Special
  ANY: 'any',          // Any type (permissive)
  DYN: 'dyn',          // Dynamic type (runtime checked)
}
```

#### Type Inference Context

Nodes use `TypeInferenceContext` to access input types during inference:

```typescript
interface TypeInferenceContext {
  getInputType(port: string): string | undefined;
  getNodeData(): Record<string, any>;
}
```

#### Node Definition Extension

Nodes can optionally define type inference logic:

```typescript
interface NodeDefinition {
  type: string;
  category: string;
  inputs?: PortSpec[];
  outputs?: PortSpec[];
  execute(context: NodeContext): void | Promise<void>;
  
  // Optional: Custom type inference
  inferOutputTypes?(context: TypeInferenceContext): Record<string, string>;
}
```

## Node Type Inference Examples

### If Node

The If node infers its output type by unifying the types of the true and false branches:

```typescript
inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
  const trueType = context.getInputType('true');
  const falseType = context.getInputType('false');
  
  if (!trueType && !falseType) {
    return { out: 'any' };
  }
  
  if (!trueType) return { out: falseType || 'any' };
  if (!falseType) return { out: trueType };
  
  // Both branches have types - unify them
  const unifiedType = unifyTypes(trueType, falseType);
  return { out: unifiedType };
}
```

**Example:**
- True branch: `int`
- False branch: `int`
- Output: `int` (unified)

### Map Node

The Map node preserves the array structure:

```typescript
inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
  const arrayType = context.getInputType('array');
  
  if (!arrayType) {
    return { out: 'list(dyn)' };
  }
  
  // Preserve array type structure
  const parsed = parseTypeString(arrayType);
  if (parsed.base === 'list' || parsed.base === 'array') {
    return { out: arrayType };
  }
  
  return { out: 'list(dyn)' };
}
```

**Example:**
- Input: `list(int)`
- Output: `list(int)` (preserved)

### Filter Node

The Filter node preserves the exact array type:

```typescript
inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
  const arrayType = context.getInputType('array');
  return { out: arrayType || 'list(dyn)' };
}
```

**Example:**
- Input: `list(string)`
- Output: `list(string)` (unchanged)

### Expression Node

The Expression node uses heuristics to infer types from CEL expressions:

```typescript
inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
  const expression = context.getNodeData().expression || '';
  
  // Boolean expressions
  if (expression.includes('>') || expression.includes('==') || 
      expression.includes('&&') || expression.includes('||')) {
    return { out: 'bool' };
  }
  
  // Numeric expressions
  if (expression.includes('+') || expression.includes('*')) {
    const in0Type = context.getInputType('in0');
    if (in0Type === 'int' || in0Type === 'double') {
      return { out: in0Type };
    }
  }
  
  // Default to dynamic
  return { out: 'dyn' };
}
```

**Example:**
- Expression: `in0 > 10`
- Output: `bool`

### CreateObject Node

The CreateObject node infers a map type:

```typescript
inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
  const data = context.getNodeData();
  const pinNames = data.pinNames || [];
  
  if (pinNames.length === 0) {
    return { out: 'map(string, dyn)' };
  }
  
  // Build structured map type
  return { out: 'map(string, dyn)' };
}
```

**Example:**
- Inputs: `name: string`, `age: int`
- Output: `map(string, dyn)` (generic map)

## Type Compatibility Rules

### Exact Matching
Types are compatible if they match exactly:
```
int == int         ✓
string == string   ✓
int == string      ✗
```

### Any/Dyn Types
`any` and `dyn` are compatible with all types:
```
int → any          ✓
any → string       ✓
dyn → bool         ✓
```

### Numeric Coercion
Numeric types can be coerced in specific directions:
```
int → double       ✓
uint → int         ✓
uint → double      ✓
double → int       ✗
```

### Generic Types
Generic type parameters must match:
```
list(int) → list(int)       ✓
list(int) → list(dyn)       ✓
list(int) → list(string)    ✗
```

## Type Unification

Type unification finds the most specific common type for branches (used in If nodes):

### Same Type
```
unify(int, int) = int
unify(string, string) = string
```

### Numeric Types
```
unify(int, uint) = int
unify(int, double) = double
unify(uint, double) = double
```

### With Any/Dyn
```
unify(int, any) = int
unify(string, dyn) = string
```

### Lists
```
unify(list(int), list(int)) = list(int)
unify(list(int), list(double)) = list(double)
unify(list(int), list(string)) = list(dyn)
```

### Incompatible Types
```
unify(int, string) = dyn
unify(bool, list(int)) = dyn
```

## Usage

### Running Type Inference

```typescript
import { CELGraphEvaluator } from './dataflow/cel-evaluator';
import type { Graph } from './dataflow/types';

const graph: Graph = {
  nodes: [ /* ... */ ],
  edges: [ /* ... */ ]
};

const evaluator = new CELGraphEvaluator(graph);

// Run type checking
const typeCheckResult = evaluator.typeCheck();

console.log('Valid:', typeCheckResult.valid);
console.log('Errors:', typeCheckResult.errors);
console.log('Warnings:', typeCheckResult.warnings);

// Get type information for specific nodes
typeCheckResult.nodeTypes.forEach((info, nodeId) => {
  console.log(`${nodeId}: ${info.nodeType}`);
  console.log('  Inputs:', info.inputTypes);
  console.log('  Outputs:', info.outputTypes);
});
```

### Type Check Result Structure

```typescript
interface TypeCheckResult {
  valid: boolean;                      // True if no errors
  nodeTypes: Map<string, NodeTypeInfo>; // Type info for each node
  errors: string[];                     // Type errors
  warnings: string[];                   // Type warnings
}

interface NodeTypeInfo {
  nodeId: string;                       // Node identifier
  nodeType: string;                     // Node type name
  inputTypes: Record<string, string>;   // Inferred input types
  outputTypes: Record<string, string>;  // Inferred output types
  errors: string[];                     // Node-specific errors
}
```

## Examples

See `src/lib/examples/type-inference-examples.ts` for complete examples:

1. **If Node Example**: Demonstrates type unification
2. **Map Node Example**: Shows array type preservation
3. **CreateObject Example**: Illustrates object type inference

Run examples:
```typescript
import { runTypeInferenceExamples } from './examples/type-inference-examples';
runTypeInferenceExamples();
```

## Error Messages

The type inference system provides detailed error messages:

### Type Mismatch
```
Node if1 (If): Input 'true' expects type 'int' but got 'string'
```

### Connection Incompatibility
```
Type mismatch at edge value1.out -> add.in0: 'string' is not compatible with 'int'
```

### Cycle Detection
```
Cycle detected in graph at node: node3
```

### Unknown Node Type
```
Unknown node type: CustomNode (node node5)
```

## Benefits

### 1. Early Error Detection
Type errors are caught before evaluation, preventing runtime failures.

### 2. Better Developer Experience
- Clear type information for all nodes
- Detailed error messages with context
- Automatic type propagation reduces boilerplate

### 3. Safer Graphs
Type checking ensures connections are valid before CEL compilation.

### 4. Documentation
Type information serves as inline documentation for graph behavior.

### 5. CEL Integration
Types align with CEL's type system for accurate validation.

## Future Enhancements

1. **Advanced Type Inference**
   - Parse CEL expressions to extract precise types
   - Use CEL's built-in type checker
   - Support generic type parameters in expressions

2. **UI Integration**
   - Display type information on node ports
   - Visual indicators for type errors
   - Type-aware connection validation

3. **Type Annotations**
   - Allow users to specify expected types
   - Type hints for ambiguous cases
   - Type constraints for validation

4. **Performance Optimizations**
   - Cache type inference results
   - Incremental type checking on graph changes
   - Parallel type checking for independent branches

5. **Advanced CEL Types**
   - Support for protocol buffer types
   - Custom type definitions
   - Type aliases and unions

## Conclusion

The type inference system brings powerful, automatic type checking to CEL expressions in dataflow graphs. It provides early error detection, better developer experience, and safer graph construction while maintaining simplicity and flexibility.

For questions or issues, please refer to the main documentation or create an issue in the repository.
