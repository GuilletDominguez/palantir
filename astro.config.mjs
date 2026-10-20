// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vue from '@astrojs/vue';

import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import { CANONICAL_SITE, GITHUB_BASE, GITHUB_SITE } from './src/lib/site.js';

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
    name: 'portfolio:isolate-vue-from-react-refresh',
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

// GitHub Actions define GITHUB_ACTIONS=true; Cloudflare Pages no.
const isGitHub = process.env.GITHUB_ACTIONS === 'true';

// https://astro.build/config
export default defineConfig({
  // URL pública: la usan la canónica, el sitemap y la imagen para redes sociales.
  // Cloudflare Pages en la raíz; GitHub Pages bajo /palantir/.
  site: isGitHub ? GITHUB_SITE : CANONICAL_SITE,
  base: isGitHub ? GITHUB_BASE : '/',

  // Sin Markdown en el proyecto: se desactiva Shiki, que pinta con estilos en línea
  // incompatibles con la CSP.
  markdown: { syntaxHighlight: false },

  // Content-Security-Policy de las páginas, como <meta>. Astro calcula los hashes
  // de sus scripts y estilos en línea, así que no hace falta 'unsafe-inline' para
  // scripts. El worker de Python tiene su propia CSP en public/_headers.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'"
      ],
      scriptDirective: {
        resources: ["'self'"],
        hashes: [
          // Script en línea que React 19 añade tras un <form action={función}>
          // (el de "Publicar misión") para repetir los envíos hechos antes de
          // hidratarse. Es código fijo de React; si cambiara al actualizarlo,
          // scripts/check-csp.mjs hace fallar el build y avisa del hash nuevo.
          'sha256-CwHpiObGc0Kj6qtRFzUVGqk0apwmCrylJaQU+RajuJ0='
        ]
      },
      styleDirective: {
        resources: [
          "'self'",
          // Vue y Svelte escriben atributos style="" en el HTML del servidor, y a un
          // atributo no se le puede poner hash. Es inyección de CSS, no de scripts.
          { resource: "'unsafe-inline'", kind: 'attribute' }
        ]
      }
    }
  },

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
