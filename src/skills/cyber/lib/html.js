// Análisis y saneado de HTML para la demo de XSS. Reglas de seguridad:
// 1. El HTML del usuario se analiza con DOMParser: crea un documento INERTE
//    (sin contexto de navegación), donde ni se ejecutan scripts ni se cargan
//    imágenes, así que un `onerror` nunca llega a dispararse.
// 2. Ningún nodo de ese documento entra en la página. El saneado construye
//    nodos nuevos desde cero, copiando solo lo que está en la lista blanca.
// En un proyecto real se usaría DOMPurify o la Sanitizer API del navegador.

export const MAX_INPUT = 400;
const MAX_DEPTH = 20;

const DANGEROUS_TAGS = {
	script: 'ejecuta JavaScript',
	iframe: 'incrusta otra página',
	object: 'carga plugins o documentos',
	embed: 'carga plugins o documentos',
	base: 'cambia la URL base de todos los enlaces',
	meta: 'puede redirigir la página',
	link: 'puede cargar recursos externos',
	style: 'permite inyectar CSS',
	form: 'puede enviar datos a otro sitio',
};

const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'data']);
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/** ¿La URL usa un protocolo ejecutable (javascript:, data:, vbscript:)? */
export function isDangerousUrl(value) {
	// El navegador ignora espacios y caracteres de control: "java\tscript:" sigue siendo javascript:
	const compact = value.replace(/[\u0000- ]/g, '').toLowerCase();
	return /^(javascript|vbscript|data):/.test(compact);
}

function attrDanger(name, value) {
	if (name.startsWith('on')) return 'se ejecutaría como JavaScript';
	if (URL_ATTRS.has(name) && isDangerousUrl(value)) return 'la URL ejecutaría código';
	if (name === 'style' && /expression|url\s*\(/i.test(value)) return 'CSS que carga recursos';
	return undefined;
}

export function parseInert(html) {
	return new DOMParser().parseFromString(html.slice(0, MAX_INPUT), 'text/html');
}

/** Árbol de elementos que crearía `innerHTML`, marcando lo peligroso. */
export function inspectHtml(html) {
	const nodes = [];
	const walk = (el, depth) => {
		if (depth > MAX_DEPTH) return;
		for (const child of el.children) {
			const tag = child.tagName.toLowerCase();
			nodes.push({
				depth,
				tag,
				danger: DANGEROUS_TAGS[tag],
				attrs: [...child.attributes].map((a) => ({
					name: a.name,
					value: a.value,
					danger: attrDanger(a.name, a.value),
				})),
			});
			walk(child, depth + 1);
		}
	};
	const doc = parseInert(html);
	walk(doc.head, 0);
	walk(doc.body, 0);
	return nodes;
}

/** Etiquetas permitidas y los atributos que se copian de cada una. */
const ALLOWED = {
	b: [],
	strong: [],
	i: [],
	em: [],
	u: [],
	s: [],
	br: [],
	p: [],
	ul: [],
	ol: [],
	li: [],
	code: [],
	a: ['href'],
};
/** Estas se eliminan con todo su contenido (no basta con quitar la etiqueta). */
const DROP_WITH_CONTENT = new Set([
	'script',
	'style',
	'template',
	'iframe',
	'object',
	'embed',
	'noscript',
	'textarea',
	'title',
	'svg',
	'math',
]);

/** Saneado por lista blanca: devuelve nodos NUEVOS creados en `target`. */
export function sanitizeHtml(html, target = document) {
	const removed = [];
	const fragment = target.createDocumentFragment();

	const copy = (from, to, depth) => {
		if (depth > MAX_DEPTH) {
			removed.push('anidamiento excesivo');
			return;
		}
		for (const child of from.childNodes) {
			if (child.nodeType === Node.TEXT_NODE) {
				to.appendChild(target.createTextNode(child.textContent ?? ''));
				continue;
			}
			if (child.nodeType !== Node.ELEMENT_NODE) continue; // comentarios, etc.
			const el = child;
			const tag = el.tagName.toLowerCase();

			if (DROP_WITH_CONTENT.has(tag)) {
				removed.push(`<${tag}> con su contenido`);
				continue;
			}
			const allowedAttrs = ALLOWED[tag];
			if (!allowedAttrs) {
				// Etiqueta desconocida: se quita, pero su texto se conserva
				removed.push(`<${tag}>`);
				copy(el, to, depth + 1);
				continue;
			}

			const clean = target.createElement(tag);
			for (const attr of el.attributes) {
				if (!allowedAttrs.includes(attr.name)) {
					removed.push(`${attr.name}="…" en <${tag}>`);
					continue;
				}
				if (attr.name === 'href') {
					let protocol = '';
					try {
						protocol = new URL(attr.value, 'https://example.invalid').protocol;
					} catch {}
					if (!SAFE_PROTOCOLS.has(protocol) || isDangerousUrl(attr.value)) {
						removed.push(`href="${attr.value.slice(0, 30)}"`);
						continue;
					}
					// Pestaña nueva sin acceso a window.opener ni a la URL de origen
					clean.setAttribute('target', '_blank');
					clean.setAttribute('rel', 'noopener noreferrer nofollow');
				}
				clean.setAttribute(attr.name, attr.value);
			}
			to.appendChild(clean);
			copy(el, clean, depth + 1);
		}
	};

	copy(parseInert(html).body, fragment, 0);
	return { fragment, removed };
}
