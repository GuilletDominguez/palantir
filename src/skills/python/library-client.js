// Controlador de la biblioteca: conecta el editor con el worker de Python.
// Se carga con import() cuando la biblioteca entra en pantalla (Library.astro).

import { HEAD_DOWN, BODY_FRONT, LEGS_FRONT } from '../../game/sprites';
import { h } from '../../lib/dom';
import { allQuests } from '../../state/actions';
import { ITEMS_BY_ID, LEVEL_THRESHOLDS, QUESTS, levelFor } from '../../state/catalog';
import { $player } from '../../state/economy';
import { EXAMPLES } from './examples';
import { MAX_CODE, MAX_OUTPUT, parseWorkerMessage, RUN_TIMEOUT_MS } from './protocol';

/** Copia de la partida para Python, con nombres legibles. Solo datos: no hay forma de modificar el store. */
function buildContext() {
	const p = $player.get();
	const quests = allQuests(p);
	return JSON.stringify({
		partida: {
			oro: p.gold,
			xp: p.xp,
			nivel: levelFor(p.xp),
			inventario: Object.entries(p.inventory).map(([id, cantidad]) => {
				const item = ITEMS_BY_ID.get(id);
				return {
					id,
					nombre: item?.name ?? id,
					tipo: item?.kind === 'potion' ? 'poción' : 'ingrediente',
					precio: item?.price ?? 0,
					cantidad,
				};
			}),
			misiones_completadas: p.completedQuests.map((id) => quests.find((q) => q.id === id)?.title ?? id),
			misiones_totales: QUESTS.length + p.customQuests.length,
		},
		umbrales_nivel: LEVEL_THRESHOLDS,
		sprite_heroe: [...HEAD_DOWN, ...BODY_FRONT, ...LEGS_FRONT[0]],
	});
}

export function startLibrary(root) {
	const code = root.querySelector('[data-code]');
	const output = root.querySelector('[data-output]');
	const status = root.querySelector('[data-status]');
	const runBtn = root.querySelector('[data-run]');
	const stopBtn = root.querySelector('[data-stop]');
	const clearBtn = root.querySelector('[data-clear]');
	const description = root.querySelector('[data-description]');

	let worker = null;
	let state = 'loading';
	let runId = 0;
	let timer = 0;
	let printed = 0;

	function setState(next, message) {
		state = next;
		status.textContent = message;
		status.dataset.state = next;
		runBtn.disabled = next !== 'ready';
		stopBtn.disabled = next !== 'running';
		root.toggleAttribute('data-running', next === 'running');
	}

	/** Toda la salida entra como texto: aunque Python imprima HTML, se ve tal cual. */
	function print(text, kind = 'out') {
		if (printed >= MAX_OUTPUT) return;
		const room = MAX_OUTPUT - printed;
		const chunk = text.length > room ? text.slice(0, room) : text;
		printed += chunk.length;
		output.append(kind === 'out' ? chunk : h('span', { class: kind }, chunk));
		if (printed >= MAX_OUTPUT) {
			output.append(h('span', { class: 'info' }, `\n… salida recortada a ${MAX_OUTPUT} caracteres.\n`));
			stop('Detenido: demasiada salida.');
		}
		output.scrollTop = output.scrollHeight;
	}

	function spawn() {
		setState('loading', 'Descargando Python (unos 6 MB, solo la primera vez)…');
		worker = new Worker(new URL('./python.worker.js', import.meta.url), { type: 'module', name: 'python' });
		worker.addEventListener('message', (event) => {
			const message = parseWorkerMessage(event.data);
			if (message) handle(message);
		});
		worker.addEventListener('error', () =>
			setState('failed', 'No se pudo cargar Python. ¿Hay conexión con cdn.jsdelivr.net?'),
		);
	}

	function handle(message) {
		switch (message.type) {
			case 'ready':
				setState('ready', `Python ${message.python} listo · sandbox: ${message.blocked.length} APIs bloqueadas`);
				return;
			case 'fatal':
				worker?.terminate();
				worker = null;
				setState('failed', `Python no se ejecutará: ${message.message}`);
				return;
		}
		// Mensajes de una ejecución anterior (o falsificados): se ignoran
		if (message.id !== runId || state !== 'running') return;
		switch (message.type) {
			case 'stdout':
				print(message.text);
				break;
			case 'stderr':
				print(message.text, 'err');
				break;
			case 'error':
				print(`${message.message}\n`, 'err');
				finish('Error de Python');
				break;
			case 'done':
				finish(`Terminado en ${message.ms} ms`);
				break;
		}
	}

	function finish(message) {
		clearTimeout(timer);
		setState('ready', message);
	}

	function run() {
		if (state !== 'ready' || !worker) return;
		runId++;
		printed = 0;
		output.replaceChildren();
		setState('running', 'Ejecutando…');
		worker.postMessage({ type: 'run', id: runId, code: code.value.slice(0, MAX_CODE), context: buildContext() });
		timer = window.setTimeout(() => stop(`Detenido: más de ${RUN_TIMEOUT_MS / 1000} s.`), RUN_TIMEOUT_MS);
	}

	/** Python no se puede interrumpir desde fuera: se termina el worker y se crea otro. */
	function stop(message = 'Detenido.') {
		if (state !== 'running') return;
		clearTimeout(timer);
		worker?.terminate();
		print(`\n${message}\n`, 'info');
		spawn();
	}

	runBtn.addEventListener('click', run);
	stopBtn.addEventListener('click', () => stop());
	clearBtn.addEventListener('click', () => {
		output.replaceChildren();
		printed = 0;
	});

	root.querySelectorAll('[data-example]').forEach((button) => {
		button.addEventListener('click', () => {
			const example = EXAMPLES.find((e) => e.id === button.dataset.example);
			if (!example) return;
			code.value = example.code;
			description.textContent = example.description;
			root.querySelectorAll('[data-example]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
		});
	});

	// Editor: Tab inserta cuatro espacios (Python usa sangría). Para no atrapar el
	// foco del teclado, Esc seguido de Tab sale del editor como siempre.
	let releaseTab = false;
	code.addEventListener('keydown', (event) => {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			run();
			return;
		}
		if (event.key === 'Escape') {
			releaseTab = true;
			return;
		}
		if (event.key === 'Tab' && !event.shiftKey && !releaseTab) {
			event.preventDefault();
			code.setRangeText('    ', code.selectionStart, code.selectionEnd, 'end');
		}
		releaseTab = false;
	});

	// Al cerrar el panel se para lo que esté en marcha
	root.closest('dialog')?.addEventListener('close', () => stop('Detenido al cerrar el panel.'));

	spawn();
}
