import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
  console.warn('Mount element "#app" not found — mounting to document.body instead.');
}
const app = new App({
  target: (target ?? document.body) as HTMLElement,
  props: { name: 'world' }
});

export default app;
