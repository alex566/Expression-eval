# TypeScript-Based Type Inference System

## Overview

The Expression-eval application now features a powerful TypeScript-based type inference system that provides automatic, real-time type checking and inference for dataflow graphs. This system uses the TypeScript compiler API to analyze graph structure and infer types with the same sophistication as TypeScript itself.

## Key Features

### 1. **Automatic Type Inference**
- Types are automatically inferred as you build the graph
- No manual type annotations required for most cases
- Works directly while editing the graph in real-time

### 2. **TypeScript Compiler Integration**
- Uses the official TypeScript compiler API (`typescript` npm package)
- Converts graph structure to TypeScript AST for analysis
- Leverages TypeScript's powerful type checker for accurate inference

### 3. **Real-Time Type Checking**
- Automatic validation when connections are made
- Type checking triggers when nodes are added
- Immediate feedback on type mismatches
- Configurable via `autoTypeCheck` flag (enabled by default)

### 4. **Visual Type Information**
- Type information displayed on node ports
- Hover tooltips show full TypeScript type signatures
- Color-coded type indicators in the UI
- Detailed type information in evaluation reports

## Architecture

### Core Components

#### 1. **TSTypeChecker** (`src/lib/dataflow/ts-type-checker.ts`)
The main TypeScript type checking service with the following capabilities:

- **Graph to TypeScript Conversion**: Transforms dataflow graphs into TypeScript code
- **AST Generation**: Creates TypeScript AST from generated code
- **Type Inference**: Uses TS compiler's type checker to infer types
- **Type Compatibility**: Checks type compatibility using TypeScript semantics
- **Error Reporting**: Provides detailed type error messages from TS compiler

#### 2. **Enhanced Type System** (`src/lib/dataflow/types.ts`)
Extended type definitions to support TypeScript types:

```typescript
// Port specification with optional TypeScript type
interface PortSpec {
  name: string;
  type: DataType;  // Simple type (backward compatible)
  tsType?: string; // TypeScript type signature
}

// Node definition with optional TS signature
interface NodeDefinition {
  type: string;
  category: string;
  inputs?: PortSpec[];
  outputs?: PortSpec[];
  execute(context: NodeContext): void | Promise<void>;
  tsSignature?: string; // Full TS function signature
}

// Inferred type information with TS support
interface InferredTypeInfo {
  inferredType: DataType;     // Simple type
  declaredType?: DataType;    // Declared constraint
  isCompatible: boolean;       // Compatibility check result
  tsType?: string;             // TypeScript type string
}
```

#### 3. **GraphEvaluator Integration**
The GraphEvaluator now:
- Creates a TSTypeChecker instance
- Runs TypeScript-based validation during `validate()`
- Merges TS errors/warnings with validation results
- Stores TypeScript type information in inferred types
- Uses TS type checker for more accurate type compatibility

### How It Works

#### Step 1: Graph to TypeScript Code Generation

When a graph is validated, the system converts it to TypeScript code:

```typescript
// Example graph with two Value nodes connected to an Add node
namespace DataflowGraph {
  let node_123_out: number;
  node_123_out = 5 as number;
  
  let node_456_out: number;
  node_456_out = 3 as number;
  
  let add_789_out: number;
  
  let add_789_input_in0 = node_123_out;
  let add_789_input_in1 = node_456_out;
}
```

#### Step 2: TypeScript Compilation

The generated code is passed to TypeScript's compiler:

```typescript
const sourceFile = ts.createSourceFile('graph.ts', tsCode, ...);
const program = ts.createProgram({ rootNames: ['graph.ts'], ... });
const checker = program.getTypeChecker();
```

#### Step 3: Type Extraction

TypeScript infers types for all variables:

```typescript
// TS infers: node_123_out: number (from literal 5)
// TS infers: add_789_input_in0: number (from node_123_out)
// Type compatibility is checked automatically by TS
```

#### Step 4: Error Detection

TypeScript detects type mismatches:

```typescript
// Example: Connecting string to number input
let value_out: string;
value_out = "hello" as string;

let add_input_in0 = value_out; // ERROR: Type 'string' is not assignable to type 'number'
```

## Usage Examples

### Example 1: Defining Node with TypeScript Signatures

```typescript
export const AddNode: NodeDefinition = {
  type: 'Add',
  category: 'math',
  description: 'Adds all connected input values together',
  inputs: [], // Dynamic
  outputs: [
    { 
      name: 'out', 
      type: 'number',
      tsType: 'number' // TypeScript type
    }
  ],
  tsSignature: '(...inputs: number[]) => number', // Full signature
  execute(context) {
    // Implementation
  }
};
```

### Example 2: Complex Types

For nodes with complex input/output types:

```typescript
export const MapNode: NodeDefinition = {
  type: 'Map',
  category: 'array',
  inputs: [
    { 
      name: 'array', 
      type: 'array',
      tsType: 'T[]' // Generic array
    },
    {
      name: 'function',
      type: 'any',
      tsType: '(element: T) => U' // Generic function
    }
  ],
  outputs: [
    { 
      name: 'out', 
      type: 'array',
      tsType: 'U[]' // Mapped array
    }
  ],
  tsSignature: '<T, U>(array: T[], fn: (element: T) => U) => U[]',
  execute(context) {
    // Implementation
  }
};
```

### Example 3: Real-Time Type Checking

Type checking happens automatically:

```typescript
// In UI component
let autoTypeCheck = $state(true); // Enable auto-checking

function handleConnect(connection: Connection) {
  // ... add edge to graph ...
  
  // Automatically run type checking
  if (autoTypeCheck) {
    setTimeout(() => validateGraph(), 100);
  }
}
```

### Example 4: Displaying TypeScript Types

UI components show TypeScript types:

```svelte
<!-- CustomNode.svelte -->
<span class="type-label" title={input.tsType ? `TS: ${input.tsType}` : ''}>
  {input.tsType || input.type}
</span>
```

## Benefits Over Simple Type System

### 1. **Powerful Type Inference**
- **Before**: Manual type annotations only
- **After**: Automatic inference from values, propagation through connections

### 2. **Complex Type Support**
- **Before**: Limited to simple types (`number`, `string`, `boolean`, etc.)
- **After**: Full TypeScript types (generics, unions, intersections, mapped types)

### 3. **Better Error Messages**
- **Before**: Generic "type mismatch" errors
- **After**: Detailed TypeScript error messages with line numbers and suggestions

### 4. **Future-Proof**
- Built on TypeScript compiler API
- Benefits from TypeScript improvements automatically
- Industry-standard type checking

### 5. **Gradual Adoption**
- Old simple types still work (backward compatible)
- TypeScript types are optional enhancements
- Fallback to simple type checking when TS types unavailable

## Migration from Old Type System

### What Was Removed
- Nothing! The old system is kept as a fallback

### What Was Added
1. **TypeScript compiler as runtime dependency**
2. **TSTypeChecker class** for TS-based type checking
3. **tsType field** in PortSpec (optional)
4. **tsSignature field** in NodeDefinition (optional)
5. **Automatic type checking** on graph changes

### Backward Compatibility

The system maintains full backward compatibility:

```typescript
// Old style (still works)
{ name: 'out', type: 'number' }

// New style (enhanced)
{ name: 'out', type: 'number', tsType: 'number' }

// System uses tsType if available, falls back to type
const displayType = output.tsType || output.type;
```

## Configuration

### Enable/Disable Auto Type Checking

In your UI component:

```typescript
let autoTypeCheck = $state(true); // Enable
// or
let autoTypeCheck = $state(false); // Disable
```

### Customize Type Checker Options

In `TSTypeChecker` constructor:

```typescript
this.compilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  strict: true, // Enable strict type checking
  noEmit: true,
  // ... other options
};
```

## Performance Considerations

### Optimization Strategies

1. **Debounced Type Checking**
   - Type checking is delayed by 100ms after graph changes
   - Prevents excessive checking during rapid edits

2. **Incremental Compilation**
   - TypeScript compiler supports incremental mode
   - Can be enabled for better performance on large graphs

3. **Caching**
   - Type check results can be cached
   - Invalidated only when graph structure changes

### When to Use

**Recommended for:**
- Complex graphs with many nodes
- Graphs requiring precise type safety
- Development and debugging
- Educational purposes

**Consider disabling for:**
- Very large graphs (>1000 nodes) if performance is a concern
- Simple graphs with well-known types
- Production runtime if type safety already validated

## Testing

### Manual Testing

1. **Create a graph** with nodes and connections
2. **Observe type checking** happens automatically
3. **Try connecting incompatible types** (e.g., string to number)
4. **Check error messages** in validation results
5. **Hover over ports** to see TypeScript types

### Example Test Cases

```typescript
// Test 1: Simple type inference
Value(5) -> Add.in0  // Should infer: number
Value(3) -> Add.in1  // Should infer: number
// Expected: Add.out is number

// Test 2: Type mismatch
Value("hello") -> Add.in0  // Should error: string not assignable to number

// Test 3: Array type inference
Value([1,2,3]) -> Map.array  // Should infer: number[]
// Expected: Map.out is number[] (after mapping)

// Test 4: Complex object types
Value({x: 5, y: "test"}) -> FunctionInput
// Should infer: { x: number; y: string }
```

## Troubleshooting

### Common Issues

1. **Type checking not working**
   - Check `autoTypeCheck` is enabled
   - Verify TypeScript package is installed
   - Check browser console for errors

2. **Incorrect type inference**
   - Ensure node definitions have correct tsType
   - Verify graph structure is valid
   - Check for circular dependencies

3. **Performance issues**
   - Disable auto type checking
   - Reduce graph size
   - Use manual validation instead

### Debug Mode

Enable debug logging:

```typescript
// In TSTypeChecker
console.log('Generated TS code:', tsCode);
console.log('Diagnostics:', diagnostics);
console.log('Inferred types:', inferredTypes);
```

## Future Enhancements

### Planned Features

1. **Generic Type Parameters**
   - Support for `<T, U>` in node definitions
   - Type variable inference across connections

2. **Advanced Type Inference**
   - Control flow analysis
   - Narrowing based on conditions
   - Discriminated unions

3. **Type Suggestions**
   - Auto-complete for type annotations
   - Quick fixes for type errors
   - Refactoring support

4. **Performance Optimizations**
   - Incremental type checking
   - Parallel type checking for independent branches
   - Type check caching

5. **IDE Integration**
   - Monaco editor with TypeScript language service
   - Real-time type hints as you type
   - Jump to definition

## Conclusion

The TypeScript-based type inference system brings the power of TypeScript's type checker to dataflow graphs. It provides automatic, accurate, and future-proof type checking while maintaining backward compatibility with the existing simple type system.

For questions or issues, please refer to the main documentation or create an issue in the repository.
