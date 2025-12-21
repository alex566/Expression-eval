# Expression-eval — Test TypeScript + Jest
# Expression-eval — Svelte + TypeScript (Hello World)

This repository was converted from a simple TypeScript test project to a minimal Svelte + Vite app with a Hello World page.

Files of interest:
- `package.json` — scripts and dependencies for Vite + Svelte and test scripts
- `tsconfig.json` — TypeScript config (includes `svelte` types)
- `vite.config.ts` — Vite configuration with the Svelte plugin
- `index.html` — Vite HTML entry
- `src/App.svelte` — Hello World Svelte component
- `src/main.ts` — Svelte entrypoint
- `src/shims.d.ts` — TypeScript typings for `.svelte` imports
- `test/hello.test.ts` — original Jest test (still present)

Quick start

Install dependencies:
```bash
npm install
```

Run the Svelte dev server:
```bash
npm run dev
```

Build and preview production build:
```bash
npm run build
npm run preview
```

Run the original TypeScript test suite:
```bash
npm test
```

Notes
- The project uses Vite and the official `@sveltejs/vite-plugin-svelte` plugin.
- TypeScript support is enabled; `.svelte` types are declared in `src/shims.d.ts`.
