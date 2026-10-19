// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { inspectHtml, isDangerousUrl, sanitizeHtml } from './html';

/** HTML resultante del saneado, como texto. */
function clean(html) {
	const { fragment } = sanitizeHtml(html);
	const box = document.createElement('div');
	box.append(fragment);
	return box.innerHTML;
}

describe('sanitizeHtml', () => {
	it('conserva el formato permitido', () => {
		expect(clean('Hola <b>mundo</b> y <em>tú</em>')).toBe('Hola <b>mundo</b> y <em>tú</em>');
	});

	it('neutraliza los vectores de XSS clásicos', () => {
		const attacks = [
			'<img src=x onerror="alert(1)">',
			'<script>alert(1)</script>',
			'<svg onload=alert(1)><circle /></svg>',
			'<a href="javascript:alert(1)">clic</a>',
			'<a href="  JaVa\tScRiPt:alert(1)">clic</a>',
			'<a href="data:text/html,<script>alert(1)</script>">clic</a>',
			'<iframe src="https://evil.example"></iframe>',
			'<b onclick="alert(1)" style="background:url(x)">x</b>',
			'<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
			'<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
			'<form action="https://evil.example"><button>enviar</button></form>',
		];
		for (const attack of attacks) {
			const out = clean(attack);
			expect(out, attack).not.toMatch(/<(script|img|svg|iframe|form|style|math)|on\w+=|javascript:|data:/i);
		}
	});

	it('mantiene los enlaces seguros y los abre aparte con rel', () => {
		expect(clean('<a href="https://ejemplo.com">web</a>')).toBe(
			'<a target="_blank" rel="noopener noreferrer nofollow" href="https://ejemplo.com">web</a>',
		);
	});

	it('quita las etiquetas desconocidas pero conserva su texto', () => {
		expect(clean('<div><span>texto</span></div>')).toBe('texto');
	});

	it('informa de lo que ha quitado', () => {
		const { removed } = sanitizeHtml('<img src=x onerror=alert(1)><b onclick=x>a</b>');
		expect(removed).toEqual(['<img>', 'onclick="…" en <b>']);
	});

	it('corta el anidamiento excesivo', () => {
		const { removed } = sanitizeHtml('<b>'.repeat(50) + 'x');
		expect(removed).toContain('anidamiento excesivo');
	});
});

describe('inspectHtml', () => {
	it('marca las etiquetas y atributos peligrosos sin ejecutarlos', () => {
		let fired = false;
		globalThis.fired = () => (fired = true);
		const nodes = inspectHtml('<img src=x onerror="fired()"><script>fired()</script><a href="javascript:x">a</a>');
		expect(fired).toBe(false);
		expect(nodes.find((n) => n.tag === 'img')?.attrs.find((a) => a.name === 'onerror')?.danger).toBeTruthy();
		expect(nodes.find((n) => n.tag === 'script')?.danger).toBeTruthy();
		expect(nodes.find((n) => n.tag === 'a')?.attrs[0].danger).toBeTruthy();
	});
});

describe('isDangerousUrl', () => {
	it('reconoce los protocolos ejecutables aunque estén camuflados', () => {
		expect(isDangerousUrl('javascript:alert(1)')).toBe(true);
		expect(isDangerousUrl(' java\nscript:alert(1)')).toBe(true);
		expect(isDangerousUrl('DATA:text/html,x')).toBe(true);
		expect(isDangerousUrl('https://ejemplo.com')).toBe(false);
	});
});
