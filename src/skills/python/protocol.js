// Protocolo entre la página y el worker de Python. Los dos lados validan lo
// que reciben: el worker ejecuta código del visitante, así que la página trata
// sus mensajes como datos no fiables (aunque el código del visitante intente
// imitar un mensaje con js.postMessage, aquí solo se acepta la forma exacta).

export const PYODIDE_VERSION = '314.0.7';
/** Versión fijada: una URL sin versión podría servir otro código mañana. */
export const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export const MAX_CODE = 5000;
export const MAX_OUTPUT = 20_000;
export const RUN_TIMEOUT_MS = 10_000;

const isRecord = (v) => typeof v === 'object' && v !== null;
const isId = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isText = (v, max) => typeof v === 'string' && v.length <= max;

export function parseWorkerMessage(data) {
	if (!isRecord(data)) return null;
	switch (data.type) {
		case 'ready':
			return isText(data.python, 200) && Array.isArray(data.blocked) && data.blocked.every((b) => isText(b, 40))
				? { type: 'ready', python: data.python, blocked: data.blocked }
				: null;
		case 'stdout':
		case 'stderr':
			return isId(data.id) && isText(data.text, MAX_OUTPUT) ? { type: data.type, id: data.id, text: data.text } : null;
		case 'done':
			return isId(data.id) && typeof data.ms === 'number' && Number.isFinite(data.ms)
				? { type: 'done', id: data.id, ms: data.ms }
				: null;
		case 'error':
			return isId(data.id) && isText(data.message, MAX_OUTPUT)
				? { type: 'error', id: data.id, message: data.message }
				: null;
		case 'fatal':
			return isText(data.message, 1000) ? { type: 'fatal', message: data.message } : null;
		default:
			return null;
	}
}

export function parsePageMessage(data) {
	if (!isRecord(data) || data.type !== 'run') return null;
	return isId(data.id) && isText(data.code, MAX_CODE) && isText(data.context, 100_000)
		? { type: 'run', id: data.id, code: data.code, context: data.context }
		: null;
}

/** Deja solo la parte del traceback que corresponde al código del visitante. */
export function trimTraceback(message) {
	const lines = message.trimEnd().split('\n');
	const first = lines.findIndex((l) => l.includes('File "<exec>"'));
	return first > 0 ? [lines[0], ...lines.slice(first)].join('\n') : message.trimEnd();
}
