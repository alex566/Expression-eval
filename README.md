# Expression-eval

A Svelte-based dataflow graph visualization and evaluation tool. This application allows you to create, visualize, and evaluate expression graphs with various node types including math operations, control flow, and value nodes.

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
