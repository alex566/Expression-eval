# Expression-eval

A Svelte-based dataflow graph visualization and evaluation tool with a **function-based architecture** and **TypeScript-powered type inference**. This application allows you to create, visualize, and evaluate expression graphs using functions as the main execution units, with automatic real-time type checking.

## Key Features

- ✅ **TypeScript-Based Type Inference** - Automatic type checking using the TypeScript compiler API
- ✅ **Real-Time Type Validation** - Types are inferred and validated as you build the graph
- ✅ **Function-Based Architecture** - Reusable functions with proper type signatures
- ✅ **Visual Type Information** - See inferred types directly on node ports
- ✅ **Powerful Type System** - Supports complex types, generics, and union types
- ✅ **Future-Proof** - Built on industry-standard TypeScript compiler

## TypeScript Type System

Expression-eval features a sophisticated type inference system powered by the TypeScript compiler API. This system automatically infers types as you build your graph and provides real-time type checking with the same power as TypeScript itself.

**Key capabilities:**
- Automatic type inference from values and node signatures
- Real-time type checking on graph changes
- Support for complex TypeScript types (generics, unions, mapped types)
- Visual type information with hover tooltips
- Detailed type error messages from TypeScript compiler

For detailed information, see [TYPESCRIPT_TYPE_SYSTEM.md](TYPESCRIPT_TYPE_SYSTEM.md).

## Architecture Overview

Expression-eval uses a **function-based architecture** where:

- **Functions** are the main execution units with:
  - **Name** (as ID) - Unique identifier for each function
  - **Graph** - Contains nodes and edges defining the function logic
  - **Nested Functions** - Functions can reference and call other functions
  - **Input** - Single JSON object with properties
  - **Output** - Produced at the end of execution

- **FunctionInput Node** - Generic object properties accessor:
  - Automatically creates output pins for each property of the input object
  - Provides both full object (`out` port) and individual property ports
  - Example: Input `{ element: 5, index: 0 }` exposes ports: `out`, `element`, `index`

- **Array Operations** (Map/Filter/Reduce) use FunctionValue nodes to reference functions

For detailed architecture documentation, see [DATAFLOW.md](DATAFLOW.md).

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
