// Bus de eventos. El store dice "cómo está" la partida; los eventos
// dicen "qué acaba de pasar", que es lo que el juego necesita para avisar.

export function createEmitter() {
	const handlers = {};

	function on(type, handler) {
		(handlers[type] ??= new Set()).add(handler);
		return () => off(type, handler);
	}

	function off(type, handler) {
		handlers[type]?.delete(handler);
	}

	function emit(type, payload) {
		handlers[type]?.forEach((h) => h(payload));
	}

	return { on, off, emit };
}

export const events = createEmitter();
