# Expression-eval

A Svelte-based dataflow graph visualization and evaluation tool with **QuickJS WASM** integration. This application allows you to create, visualize, and evaluate expression graphs that compile to JavaScript code and are evaluated in a fully sandboxed QuickJS environment.

## Key Features

- ✅ **QuickJS Sandboxed Evaluation** - Graphs compile to JavaScript and execute in isolated QuickJS WASM runtime
- ✅ **TypeScript Type Inference System** - Automatic type checking and inference for all nodes using TypeScript
- ✅ **Expression Nodes** - Add JavaScript expressions as nodes with dynamic inputs for inline processing
- ✅ **JSON Input/Output** - Provide JSON data as input and get JSON results
- ✅ **Real-Time Compilation** - See the compiled JavaScript code as you build your graph
- ✅ **Interactive Console** - Test your graphs with different input data
- ✅ **Visual Graph Builder** - Drag-and-drop interface for building expression graphs
- ✅ **Dynamic Pins** - Nodes support dynamic input/output pins with custom naming
- ✅ **Expression Preview** - See expression bodies directly in node UI
- ✅ **Intermediate Value Storage** - Each node result stored as `const node_<id>` for reuse

## QuickJS Integration

Expression-eval uses **quickjs-emscripten** to provide sandboxed JavaScript execution:

**Key capabilities:**
- Compile dataflow graphs to JavaScript code
- Evaluate code in fully isolated QuickJS WASM environment
- Support for arithmetic, comparison, and conditional operations
- Expression nodes for custom JavaScript expressions with dynamic inputs
- Map, Filter, and Reduce operations with expression support
- Property access using JavaScript syntax (e.g., `in0.date`, `user.name`)
- **Automatic type inference and validation** using TypeScript
- **Memory and execution limits** for security
- **No access to global state or functions** except registered custom functions

## Architecture Overview

Expression-eval uses a **QuickJS-based architecture** where:

- **Graphs** are compiled to JavaScript code
- **Nodes** represent operations or values that compile to JavaScript
- **Intermediate Values** - Each node stores its result in `const node_<id>` for reuse
- **Expression Nodes** - Primary node for inline processing with JavaScript expressions
- **Input Data** - Provided as JSON for evaluation
- **Output** - Results returned as JSON
- **Type Inference** - TypeScript-based type checking validates graph correctness
- **Sandbox** - QuickJS provides isolated execution environment

## Type Inference System

Expression-eval includes a powerful **TypeScript-based type inference system** that automatically validates your graphs:

### Features
- ✅ **Automatic type inference** - Types propagate from inputs to outputs
- ✅ **Type compatibility checking** - Validates connections between nodes
- ✅ **Per-node type information** - Each node reports inferred input/output types
- ✅ **Detailed error messages** - Clear explanations of type mismatches
- ✅ **TypeScript type system** - Uses standard JavaScript/TypeScript types

### How It Works

The type inference engine:
1. Processes nodes in **topological order** (leaves to trunk)
2. Infers types based on node logic and input types
3. Validates type compatibility at all connections
4. Reports errors and warnings with detailed messages

### Example: If Node Type Inference

```typescript
// If node unifies types from true and false branches
const graph = {
  nodes: [
    { id: 'true_val', type: 'Expression', data: { expression: '100' } },  // number
    { id: 'false_val', type: 'Expression', data: { expression: '0' } },   // number
    { id: 'if1', type: 'If', data: {} }
  ],
  edges: [
    { from: { node: 'true_val', port: 'out' }, to: { node: 'if1', port: 'true' } },
    { from: { node: 'false_val', port: 'out' }, to: { node: 'if1', port: 'false' } }
  ]
};

// Type inference result:
// if1.out = unify(number, number) = number
```

### Usage

```typescript
import { QuickJSGraphEvaluator } from './dataflow/quickjs-evaluator';

const evaluator = new QuickJSGraphEvaluator(graph);

// Run type checking
const typeCheck = evaluator.typeCheck();

if (!typeCheck.valid) {
  console.error('Type errors:', typeCheck.errors);
  console.warn('Type warnings:', typeCheck.warnings);
}

// Get type information for nodes
typeCheck.nodeTypes.forEach((info, nodeId) => {
  console.log(`${nodeId}: inputs=${JSON.stringify(info.inputTypes)}, outputs=${JSON.stringify(info.outputTypes)}`);
});
```

**For complete documentation**, see [TYPE_INFERENCE.md](TYPE_INFERENCE.md).

## Node Types

### Core Nodes

- **Value** - Static values (numbers, strings, arrays, objects)
- **Input** - Access to input data with schema-based dynamic pins
- **Output** - Final output node with dynamic pins
- **Expression** - Custom JavaScript codes with dynamic inputs
  - Use for inline processing: `"(in0 + 1) * 2"`
  - Supports arithmetic: `"in0 + in1"`, `"in0 * in1"`, `"in0 - in1"`
  - Supports property access: `"in0.name"`, `"in0.date"`
  - Shows expression preview in node
  
### Object/Data Nodes

- **CreateObject** - Creates objects from dynamic input pins with custom property names

### Array Operations

- **Map** - Transform array elements using expression body
- **Filter** - Filter array elements using expression predicate
- **Reduce** - Reduce array to single value using expression accumulator

### Control Flow

- **If** - Conditional branching (ternary operator)
- **Compare** - Comparison operations
- **Switch** - Multi-case branching

### Date/Time Operations

- **CreateDate** - Create Date objects from strings or timestamps
- **AddDate** - Add time intervals to dates
- **FormatDate** - Format dates to strings

## Usage Patterns

### Simple Math Operations

**Example:**
```
Value(5) → Expression("(in0 + 1) * 2") → Output
```

Multiple operations:
```
Value(5) → Expression("in0 + in1") → Output
Value(3) ↗
```

### Property Access

Access object properties using JavaScript syntax:
```
Input(user) → Expression("in0.name + ' is ' + string(in0.age)") → Output
```

### Array Operations

Use Map/Filter with Expression nodes:
```
Input(numbers) → Filter(expression: "element > 5") → Map(expression: "element * 2") → Output
                           ↑                                      ↑
                    Expression("element > 5")           Expression("element * 2")
```

The expression body is shown directly in the Map/Filter/Reduce node preview!

### Creating Objects

Use CreateObject with custom property names:
```
Value("John") → CreateObject(name) → Output
Value(30) ────→            (age)
```

## Data Processing Patterns

### Patterns Well-Suited for Expression Nodes

✅ **Arithmetic Operations** - `"(price * quantity) * (1 + taxRate)"`  
✅ **String Manipulation** - `"firstName + ' ' + lastName"`  
✅ **Boolean Logic** - `"age >= 18 && hasLicense"`  
✅ **Property Access** - `"user.address.city"`  
✅ **Ternary Conditions** - `"score > 90 ? 'A' : 'B'"`  
✅ **Array Filtering** - `"element.status == 'active'"`  
✅ **Array Mapping** - `"element * 2"`  

### Patterns Requiring Dedicated Nodes

⚠️ **Date/Time Operations** - Use CreateDate, AddDate, FormatDate nodes  
⚠️ **Complex Multi-Step Logic** - Break into multiple nodes for clarity  
⚠️ **Stateful Operations** - May need custom node implementation  
⚠️ **External API Calls** - Requires custom node with async execution  

### Handling Complex Scenarios

For data processing patterns not easily expressible with Expression nodes:

1. **Multi-Step Transformations** - Chain multiple Expression nodes
2. **Conditional Routing** - Use If/Switch nodes
3. **Custom Operations** - Create dedicated node types (like DateTime nodes)
4. **Reusable Logic** - Extract to separate Expression nodes that can be reused
5. **Complex State** - Consider using Value nodes to store intermediate results

## Sample Graphs

The application includes several sample graphs demonstrating different patterns:

- **sample** - Basic addition example
- **complex** - Multiple operations
- **dates** - Date/time operations
- **input-example** - Input node with schema
- **cel** - JavaScript codes with conditionals
- **expression-math** - Expression node for math (recommended pattern)
- **create-object** - Creating objects from pins
- **property-access** - Property access with JavaScript syntax
- **array-operations** - Map/Filter with expression previews

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Deployment

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the `main` branch.

### GitHub Pages Setup

The repository is configured with:
- **@sveltejs/adapter-static** for static site generation
- **GitHub Actions workflow** (`.github/workflows/deploy.yml`) that:
  - Triggers on push to `main` branch
  - Builds the application with `npm run build`
  - Deploys the built files to GitHub Pages

### Accessing the Deployed Site

Once deployed, the site will be available at: `https://alex566.github.io/Expression-eval/`

### Manual Deployment

You can also trigger the deployment manually from the GitHub Actions tab in the repository.

### Local Testing

To test the production build locally before deploying:

```sh
NODE_ENV=production npm run build
npm run preview
```
