// Worker de Python: carga Pyodide (CPython compilado a WebAssembly), lo aísla
// y ejecuta el código del visitante. Al ser un Web Worker no tiene DOM, ni
// cookies, ni localStorage, y un bucle infinito no congela la página.

import { parsePageMessage, PYODIDE_URL, trimTraceback } from './protocol';

const post = (message) => globalThis.postMessage(message);

// ---------------------------------------------------------------- sandbox

/** APIs de red y almacenamiento que se eliminan del worker. */
const NETWORK_APIS = [
	'fetch',
	'XMLHttpRequest',
	'WebSocket',
	'WebTransport',
	'EventSource',
	'indexedDB',
	'caches',
	'BroadcastChannel',
	'Worker',
	'SharedWorker',
	'importScripts',
];

function deny() {
	throw new Error('Desactivado en este sandbox');
}

/**
 * Aísla el worker DESPUÉS de cargar Pyodide (que sí necesita la red para
 * descargarse). Devuelve la lista de lo bloqueado, o lanza si algo falla:
 * es preferible no ejecutar nada a ejecutar sin aislamiento.
 */
function lockDown() {
	const g = globalThis;

	for (const name of NETWORK_APIS) {
		Object.defineProperty(globalThis, name, { value: undefined, writable: false, configurable: false });
	}

	// eval y los constructores de funciones permiten ejecutar JS a partir de un
	// texto, y con él un import() dinámico a cualquier URL: también fuera.
	Object.defineProperty(globalThis, 'eval', { value: deny, writable: false, configurable: false });
	const RealFunction = Function;
	const fakeConstructor = (name) => {
		const fake = function () {
			deny();
		};
		Object.defineProperty(fake, 'name', { value: name });
		Object.defineProperty(fake, 'prototype', { value: undefined });
		return fake;
	};
	const FakeFunction = fakeConstructor('Function');
	// Se conserva el prototype real para que `x instanceof Function` siga funcionando
	Object.defineProperty(FakeFunction, 'prototype', { value: RealFunction.prototype });
	Object.defineProperty(globalThis, 'Function', { value: FakeFunction, writable: false, configurable: false });
	const protos = [
		[RealFunction.prototype, 'Function'],
		[Object.getPrototypeOf(async function () {}), 'AsyncFunction'],
		[Object.getPrototypeOf(function* () {}), 'GeneratorFunction'],
		[Object.getPrototypeOf(async function* () {}), 'AsyncGeneratorFunction'],
	];
	for (const [proto, name] of protos) {
		Object.defineProperty(proto, 'constructor', { value: fakeConstructor(name), writable: false, configurable: false });
	}

	// setTimeout("código") también evalúa texto: solo se admiten funciones
	for (const name of ['setTimeout', 'setInterval']) {
		const original = globalThis[name];
		Object.defineProperty(globalThis, name, {
			value: (handler, ...rest) => (typeof handler === 'function' ? original(handler, ...rest) : deny()),
			writable: false,
			configurable: false,
		});
	}

	// Verificación: si algo sigue disponible, no se ejecuta nada
	const leaks = NETWORK_APIS.filter((name) => g[name] !== undefined);
	const throws = (fn) => {
		try {
			fn();
			return false;
		} catch {
			return true;
		}
	};
	if (!throws(() => g.eval('1'))) leaks.push('eval');
	if (!throws(() => new g.Function('return 1'))) leaks.push('Function');
	if (!throws(() => (async () => {}).constructor('return 1'))) leaks.push('AsyncFunction');
	if (leaks.length) throw new Error(`No se pudo aislar: ${leaks.join(', ')}`);

	return [...NETWORK_APIS.filter((n) => n !== 'importScripts'), 'eval', 'Function', 'setTimeout(texto)'];
}

// ---------------------------------------------------------------- arranque

let currentId = -1;

const ready = (async () => {
	const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`);
	const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
	pyodide.setStdout({ batched: (text) => post({ type: 'stdout', id: currentId, text: `${text}\n` }) });
	pyodide.setStderr({ batched: (text) => post({ type: 'stderr', id: currentId, text: `${text}\n` }) });
	// Se precargan módulos puros de la biblioteca estándar. NUNCA uno que guarde
	// referencias a APIs del navegador (como pyodide.http, que guarda `fetch`):
	// esa copia sobreviviría al aislamiento y abriría la red de nuevo.
	pyodide.runPython('import json, random, collections, statistics, dataclasses');
	const python = String(pyodide.runPython('import sys; sys.version.split()[0]'));

	const blocked = lockDown();
	post({ type: 'ready', python, blocked });
	return pyodide;
})();

ready.catch((error) => post({ type: 'fatal', message: error instanceof Error ? error.message : String(error) }));

// Los mensajes llegan en orden y se ejecutan de uno en uno
let queue = Promise.resolve();

globalThis.addEventListener('message', (event) => {
	const message = parsePageMessage(event.data);
	if (!message) return;
	queue = queue.then(async () => {
		const pyodide = await ready;
		currentId = message.id;
		const started = performance.now();
		// Un espacio de nombres nuevo en cada ejecución: no quedan restos de la anterior
		const globals = pyodide.globals.get('dict')();
		try {
			globals.set('__name__', '__main__');
			globals.set('contexto', pyodide.toPy(JSON.parse(message.context)));
			const result = await pyodide.runPythonAsync(message.code, { globals });
			// Como en la consola de Python: si la última línea es una expresión, se muestra
			if (result !== undefined) {
				post({ type: 'stdout', id: message.id, text: `${String(result)}\n` });
				result.destroy?.();
			}
			post({ type: 'done', id: message.id, ms: Math.round(performance.now() - started) });
		} catch (error) {
			post({
				type: 'error',
				id: message.id,
				message: trimTraceback(error instanceof Error ? error.message : String(error)),
			});
		} finally {
			globals.destroy();
		}
	});
});
