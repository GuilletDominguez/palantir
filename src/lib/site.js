// Dónde vive la web. Cloudflare Pages la sirve en la raíz; GitHub Pages, bajo
// /palantir/ (el nombre del repositorio). astro.config.mjs elige entre las dos.

/** URL pública principal (Cloudflare Pages). */
export const CANONICAL_SITE = 'https://guillermo-dominguez-portfolio.pages.dev';

/** Origen y carpeta en GitHub Pages. */
export const GITHUB_SITE = 'https://guilletdominguez.github.io';
export const GITHUB_BASE = '/palantir';
