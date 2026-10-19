// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vue from '@astrojs/vue';

import react from '@astrojs/react';
import svelte from '@astrojs/svelte';

/**
 * Solo en desarrollo: @vitejs/plugin-vue reutiliza la configuración `oxc` del
 * servidor al compilar el TypeScript de los .vue, y con el plugin de React esa
 * configuración activa Fast Refresh. El SSR de Vue acaba llamando a
 * `$RefreshSig$`, que no existe en el servidor. Este plugin le pasa a Vue una
 * vista de la configuración sin Fast Refresh; React no se ve afectado.
 * @returns {import('vite').Plugin}
 */
function isolateVueFromReactRefresh() {
  return {
    name: 'palantir:isolate-vue-from-react-refresh',
    apply: 'serve',
    configureServer(server) {
      const vuePlugin = server.config.plugins.find((p) => p.name === 'vite:vue');
      if (!vuePlugin?.api) return;

      const config = new Proxy(server.config, {
        get(target, key) {
          const oxc = target.oxc;
          if (key === 'oxc' && oxc && typeof oxc.jsx === 'object') {
            return { ...oxc, jsx: { ...oxc.jsx, refresh: false } };
          }
          return Reflect.get(target, key);
        },
      });
      const devServer = new Proxy(server, {
        get: (target, key) => (key === 'config' ? config : Reflect.get(target, key)),
      });

      // Hook "post": se ejecuta después de que plugin-vue guarde el servidor
      return () => {
        vuePlugin.api.options = { ...vuePlugin.api.options, devServer };
      };
    },
  };
}

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), isolateVueFromReactRefresh()],
    // El worker de Python es un módulo ES: carga Pyodide con import() dinámico
    worker: { format: 'es' }
  },

  integrations: [
    vue({ appEntrypoint: '/src/skills/vue/app' }),
    // Solo los .jsx de su carpeta: si no, el plugin de React procesaría
    // también archivos de Vue y los CSS Modules.
    react({ include: ['**/skills/react/**/*.jsx'] }),
    svelte()
  ]
});
