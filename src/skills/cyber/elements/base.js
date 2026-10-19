// Base de los Web Components del cuartel.
//
// - Shadow DOM: los estilos de cada componente no salen ni entran (salvo las
//   variables CSS, que sí heredan, y así llega la paleta del juego).
// - adoptedStyleSheets: la hoja común se crea UNA vez y la comparten todas las
//   instancias, sin repetir un <style> en cada sombra.
// - h() (src/lib/dom.js): la única forma de crear DOM aquí. Los textos se
//   insertan como nodos de texto y nunca se usa innerHTML, así que lo que
//   escribe el usuario no puede convertirse en HTML.

export { h } from '../../../lib/dom';

const BASE_CSS = `
:host {
	display: block;
	color: var(--color-px-w);
	font-family: var(--font-body);
	font-size: 1.15rem;
	line-height: 1.15;
}
* { box-sizing: border-box; }
p { margin: 0; }
.label {
	display: block;
	margin-bottom: 0.35rem;
	font-family: var(--font-pixel);
	font-size: 0.55rem;
	color: var(--color-px-q);
}
input, textarea {
	width: 100%;
	font: inherit;
	font-size: 1.2rem;
	padding: 0.4rem 0.6rem;
	color: var(--color-px-w);
	background: var(--color-px-o);
	border: 2px solid var(--color-px-Q);
	outline: none;
}
input:focus-visible, textarea:focus-visible { border-color: var(--color-px-y); }
button {
	cursor: pointer;
	font-family: var(--font-pixel);
	font-size: 0.5rem;
	padding: 0.4rem 0.55rem;
	color: var(--color-px-o);
	background: var(--color-px-y);
	border: 2px solid var(--color-px-o);
}
button:hover { background: var(--color-px-w); }
button:focus-visible { outline: 2px solid var(--color-px-w); outline-offset: 2px; }
.box {
	padding: 0.7rem;
	background: var(--color-px-o);
	border: 2px solid var(--color-px-Q);
}
.muted { color: var(--color-px-q); }
.ok { color: var(--color-px-l); }
.warn { color: var(--color-px-y); }
.danger { color: var(--color-px-O); }
code, .mono { font-family: var(--font-body); color: var(--color-px-c); word-break: break-all; }
`;

let baseSheet = null;

export function sheet(css) {
	const s = new CSSStyleSheet();
	s.replaceSync(css);
	return s;
}

export class PixelElement extends HTMLElement {
	root;

	constructor(css = '') {
		super();
		this.root = this.attachShadow({ mode: 'open' });
		baseSheet ??= sheet(BASE_CSS);
		this.root.adoptedStyleSheets = css ? [baseSheet, sheet(css)] : [baseSheet];
	}
}

/** Registra un elemento una sola vez (la recarga en caliente lo importaría dos veces). */
export function define(name, ctor) {
	if (!customElements.get(name)) customElements.define(name, ctor);
}
