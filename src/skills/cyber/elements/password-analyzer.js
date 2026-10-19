import { analyzePassword, SCORE_LABELS } from '../lib/password';
import { sha1 } from '../lib/sha1';
import { define, h, PixelElement } from './base';

const MAX_LENGTH = 128;
const SCORE_COLORS = [
	'var(--color-px-r)',
	'var(--color-px-O)',
	'var(--color-px-y)',
	'var(--color-px-l)',
	'var(--color-px-g)',
];

const CSS = `
.grid { display: grid; gap: 0.7rem; }
.field { display: flex; gap: 0.4rem; }
.meter { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; height: 12px; }
.meter span { background: var(--color-px-B); border: 2px solid var(--color-px-o); }
.meter span[data-on] { background: var(--score-color); }
.verdict { font-family: var(--font-pixel); font-size: 0.6rem; color: var(--score-color, var(--color-px-q)); }
.stats { display: grid; grid-template-columns: auto 1fr; gap: 0.15rem 0.8rem; }
.stats dt { color: var(--color-px-q); }
.stats dd { margin: 0; }
ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.2rem; }
.hash { font-size: 1.05rem; }
.prefix { color: var(--color-px-y); background: var(--color-px-B); }
.rest { color: var(--color-px-Q); }
.note { font-size: 1rem; }
`;

/**
 * <password-analyzer>: estima la fortaleza de una contraseña y explica la
 * k-anonymity de Have I Been Pwned. Nada sale del navegador ni se guarda.
 */
class PasswordAnalyzer extends PixelElement {
	#input = h('input', {
		type: 'password',
		maxlength: MAX_LENGTH,
		// Sin autocompletar ni corrector: el corrector mejorado de Chrome envía el texto a un servidor
		autocomplete: 'off',
		spellcheck: 'false',
		autocapitalize: 'off',
		'aria-describedby': 'pw-privacy',
		id: 'pw-input',
	});
	#toggle = h('button', { type: 'button', 'aria-pressed': 'false', 'aria-controls': 'pw-input' }, 'Mostrar');
	#meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, ...Array.from({ length: 5 }, () => h('span')));
	#verdict = h('p', { class: 'verdict', 'aria-live': 'polite' });
	#stats = h('dl', { class: 'stats' });
	#findings = h('ul');
	#hash = h('p', { class: 'hash mono' });
	#hashNote = h('p', { class: 'note muted' });
	/** Para descartar resultados de hash que llegan tarde (se calcula de forma asíncrona). */
	#seq = 0;
	#dialog = null;

	constructor() {
		super(CSS);
		this.root.append(
			h(
				'div',
				{ class: 'grid' },
				h(
					'div',
					{},
					h('label', { class: 'label', for: 'pw-input' }, 'Escribe una contraseña de prueba'),
					h('div', { class: 'field' }, this.#input, this.#toggle),
				),
				h(
					'p',
					{ id: 'pw-privacy', class: 'note ok' },
					'Se analiza en tu navegador: no se envía, no se guarda y se borra al cerrar el panel. Aun así, no escribas una contraseña real.',
				),
				this.#meter,
				this.#verdict,
				this.#stats,
				this.#findings,
				h(
					'div',
					{ class: 'box' },
					h('span', { class: 'label' }, 'Have I Been Pwned: k-anonymity'),
					this.#hash,
					this.#hashNote,
				),
			),
		);
		this.#input.addEventListener('input', () => this.#update());
		this.#toggle.addEventListener('click', () => {
			const show = this.#input.type === 'password';
			this.#input.type = show ? 'text' : 'password';
			this.#toggle.textContent = show ? 'Ocultar' : 'Mostrar';
			this.#toggle.setAttribute('aria-pressed', String(show));
		});
	}

	connectedCallback() {
		// Aquí y no en el constructor: la spec no deja tocar los atributos del
		// propio elemento (como `style`) mientras se construye.
		this.#update();
		this.#dialog = this.closest('dialog');
		this.#dialog?.addEventListener('close', this.#clear);
	}

	disconnectedCallback() {
		this.#dialog?.removeEventListener('close', this.#clear);
	}

	#clear = () => {
		this.#input.value = '';
		this.#input.type = 'password';
		this.#toggle.textContent = 'Mostrar';
		this.#toggle.setAttribute('aria-pressed', 'false');
		this.#update();
	};

	async #update() {
		const value = this.#input.value.slice(0, MAX_LENGTH);
		const seq = ++this.#seq;

		if (!value) {
			this.style.removeProperty('--score-color');
			this.#meter.querySelectorAll('span').forEach((s) => s.removeAttribute('data-on'));
			this.#verdict.textContent = 'Esperando una contraseña…';
			this.#stats.replaceChildren();
			this.#findings.replaceChildren();
			this.#hash.replaceChildren(h('span', { class: 'muted' }, '—'));
			this.#hashNote.textContent =
				'HIBP guarda el SHA-1 de las contraseñas filtradas. Para consultar si la tuya está, basta con enviar los 5 primeros caracteres del hash: el servidor devuelve todos los que empiezan igual y la comparación se hace en tu equipo.';
			return;
		}

		const a = analyzePassword(value);
		this.style.setProperty('--score-color', SCORE_COLORS[a.score]);
		this.#meter.querySelectorAll('span').forEach((s, i) => s.toggleAttribute('data-on', i <= a.score));
		this.#verdict.textContent = `${SCORE_LABELS[a.score]} · ~${a.bits} bits de entropía`;
		this.#stats.replaceChildren(
			...[
				['Longitud', `${a.length} caracteres`],
				['Alfabeto', `${a.charsetSize} símbolos posibles`],
				['Ataque offline', `${a.crackTime.offline} (10 000 millones de intentos/s contra un hash filtrado)`],
				['Ataque online', `${a.crackTime.online} (10 intentos/s contra un login con límite)`],
			].flatMap(([dt, dd]) => [h('dt', {}, dt), h('dd', {}, dd)]),
		);
		this.#findings.replaceChildren(
			...(a.findings.length
				? a.findings.map((f) => h('li', { class: f.kind === 'short' ? 'warn' : 'danger' }, f.text))
				: [h('li', { class: 'ok' }, 'No se ven patrones conocidos.')]),
		);

		const { hex, source } = await sha1(value);
		if (seq !== this.#seq) return; // el usuario siguió escribiendo
		const upper = hex.toUpperCase();
		this.#hash.replaceChildren(
			h('span', { class: 'prefix' }, upper.slice(0, 5)),
			h('span', { class: 'rest' }, upper.slice(5)),
		);
		this.#hashNote.textContent = `Solo se enviarían los 5 primeros caracteres (resaltados); en esta demo no se envía nada. SHA-1 calculado con ${
			source === 'web-crypto'
				? 'Web Crypto'
				: 'una implementación propia, porque Web Crypto solo existe en HTTPS o localhost'
		}. Ojo: para guardar contraseñas no se usa SHA, sino Argon2id o bcrypt.`;
	}
}

define('password-analyzer', PasswordAnalyzer);
