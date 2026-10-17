export type Dir = 'up' | 'down' | 'left' | 'right';

const KEYS: Record<string, Dir | 'action'> = {
	ArrowUp: 'up',
	KeyW: 'up',
	ArrowDown: 'down',
	KeyS: 'down',
	ArrowLeft: 'left',
	KeyA: 'left',
	ArrowRight: 'right',
	KeyD: 'right',
	Enter: 'action',
	Space: 'action',
	KeyE: 'action',
};

/** Estado de entrada unificado para teclado y controles táctiles. */
export class Input {
	/** Orden de pulsación: la última dirección pulsada manda. */
	private held: Dir[] = [];
	private actionQueued = false;
	enabled = true;

	constructor(touchRoot?: HTMLElement | null) {
		window.addEventListener('keydown', (e) => {
			const k = KEYS[e.code];
			if (!k || !this.enabled) return;
			e.preventDefault();
			if (k === 'action') {
				if (!e.repeat) this.actionQueued = true;
			} else this.press(k);
		});
		window.addEventListener('keyup', (e) => {
			const k = KEYS[e.code];
			if (k && k !== 'action') this.release(k);
		});
		window.addEventListener('blur', () => this.reset());

		touchRoot?.querySelectorAll<HTMLElement>('[data-dir]').forEach((btn) => {
			const dir = btn.dataset.dir as Dir;
			btn.addEventListener('pointerdown', (e) => {
				e.preventDefault();
				btn.setPointerCapture(e.pointerId);
				if (this.enabled) this.press(dir);
			});
			const up = () => this.release(dir);
			btn.addEventListener('pointerup', up);
			btn.addEventListener('pointercancel', up);
		});
		touchRoot?.querySelector<HTMLElement>('[data-action]')?.addEventListener('pointerdown', (e) => {
			e.preventDefault();
			if (this.enabled) this.actionQueued = true;
		});
	}

	private press(d: Dir) {
		this.release(d);
		this.held.push(d);
	}

	private release(d: Dir) {
		this.held = this.held.filter((h) => h !== d);
	}

	reset() {
		this.held = [];
		this.actionQueued = false;
	}

	get direction(): Dir | null {
		return this.held.at(-1) ?? null;
	}

	consumeAction() {
		const a = this.actionQueued;
		this.actionQueued = false;
		return a;
	}
}
