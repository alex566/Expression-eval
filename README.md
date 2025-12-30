# Expression-eval

A Svelte-based dataflow graph visualization and evaluation tool with **CEL (Common Expression Language)** integration. This application allows you to create, visualize, and evaluate expression graphs that compile to CEL expressions and are evaluated using a CEL interpreter.

## Key Features

- ✅ **CEL Expression Language** - Graphs compile to CEL expressions for evaluation
- ✅ **Expression Nodes** - Add CEL expressions as nodes that can be connected to other nodes
- ✅ **JSON Input/Output** - Provide JSON data as input and get JSON results
- ✅ **Real-Time Compilation** - See the compiled CEL expression as you build your graph
- ✅ **Interactive Console** - Test your graphs with different input data
- ✅ **Visual Graph Builder** - Drag-and-drop interface for building expression graphs

## CEL Integration

Expression-eval uses the **@bufbuild/cel** package to provide CEL (Common Expression Language) support:

**Key capabilities:**
- Compile dataflow graphs to CEL expressions
- Evaluate expressions with JSON input data
- Support for arithmetic, comparison, and conditional operations
- Expression nodes for custom CEL expressions
- Map, Filter, and Reduce operations with expression support

## Architecture Overview

Expression-eval uses a **CEL-based architecture** where:

- **Graphs** are compiled to CEL expressions
- **Nodes** represent operations or values that compile to CEL
- **Expression Nodes** - Can contain custom CEL expressions as strings
- **Input Data** - Provided as JSON for evaluation
- **Output** - Results returned as JSON

### Node Types

- **Value** - Static values (numbers, strings, arrays, objects)
- **Input** - Access to the input data
- **Expression** - Custom CEL expression strings
- **Math Nodes** - Add, Subtract, Multiply, Divide, Modulo
- **Control Nodes** - If (ternary), Compare
- **Array Nodes** - Map, Filter, Reduce (with expression support)
- **Output** - Final output node

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
