import { atom, onMount } from 'nanostores';
import { DEFAULT_OUTFIT, parseOutfit } from '../game/outfit';

const STORAGE_KEY = 'palantir:outfit';

// Lo que lleva puesto el héroe. Es estético y no forma parte de la economía,
// así que va en su propia clave y no toca el esquema de `palantir:save`.
export const $outfit = atom(DEFAULT_OUTFIT);

onMount($outfit, () => {
	if (typeof window === 'undefined') return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		// parseOutfit valida cada campo: un valor manipulado vuelve al de por defecto
		if (raw) $outfit.set(parseOutfit(JSON.parse(raw)));
	} catch {}
	return $outfit.listen((outfit) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit));
		} catch {}
	});
});
