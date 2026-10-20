// Rutas internas que respetan `base` (astro.config.mjs): con base "/" no cambian
// nada y con "/palantir" les añaden el prefijo. BASE_URL puede llevar o no la
// barra final; aquí se normaliza para no producir "//".

const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** "/cv.pdf" → "/cv.pdf" (base "/") o "/palantir/cv.pdf" (base "/palantir"). */
export function withBase(path) {
	return `${base}/${path.replace(/^\/+/, '')}`;
}

/** URL absoluta de una ruta interna a partir de `site` (la de Astro.site / contexto). */
export function absoluteUrl(path, site) {
	return new URL(withBase(path), site);
}
