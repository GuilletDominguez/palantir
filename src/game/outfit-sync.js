import { $outfit } from '../stores/outfit';
import { parseOutfit } from './outfit';

/**
 * Puente entre la sastrería y el juego. La sastrería es CSS puro y no envía
 * JavaScript; es el juego, que ya está cargado, el que escucha su formulario:
 * - al cambiar un radio, guarda el atuendo en $outfit (y el motor redibuja al héroe);
 * - al cargar la página, marca los radios con el atuendo guardado.
 */
export function syncTailorForm() {
	const form = document.querySelector('form.tailor');
	if (!form) return;

	const read = () => parseOutfit(Object.fromEntries(new FormData(form)));

	const saved = $outfit.get();
	for (const [name, value] of Object.entries(saved)) {
		// Los valores ya están validados por parseOutfit; CSS.escape por si acaso
		const input = form.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);
		if (input) input.checked = true;
	}

	form.addEventListener('change', () => $outfit.set(read()));
	// "reset" se dispara antes de que el formulario recupere sus valores iniciales
	form.addEventListener('reset', () => setTimeout(() => $outfit.set(read())));
}
