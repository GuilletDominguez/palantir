import type { App } from 'vue';
import { createPinia } from 'pinia';

// Punto de entrada que @astrojs/vue ejecuta para cada isla de Vue:
// cada isla tiene su propia instancia de Pinia, tanto en SSR como en cliente.
export default (app: App) => {
	app.use(createPinia());
};
