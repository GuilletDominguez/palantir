import { atom, computed, onMount } from 'nanostores';
import { STARTING_GOLD, levelFor } from './catalog';
import { SAVE_VERSION, clearLegacyKeys, loadSave, onExternalChange, writeSave } from './persistence';

export const createInitialState = () => ({
	gold: STARTING_GOLD,
	xp: 0,
	inventory: {},
	completedQuests: [],
	customQuests: [],
	version: SAVE_VERSION,
});

/**
 * Estado con el que se renderiza en el servidor. Las islas lo usan también en
 * su primer render en el cliente para que el HTML coincida al hidratar.
 */
export const INITIAL_PLAYER = createInitialState();

// Un único átomo con toda la partida: cada acción sustituye el objeto entero,
// así que nunca hay un estado intermedio a medio actualizar.
export const $player = atom(INITIAL_PLAYER);

/** El nivel se deriva de la XP; no se guarda. */
export const $level = computed($player, (p) => levelFor(p.xp));

// onMount se ejecuta cuando el store recibe su primer suscriptor. En el
// servidor no hay window, así que ahí no se carga nada y el SSR usa el estado
// inicial; en el navegador se recupera la partida y se empieza a guardar.
onMount($player, () => {
	if (typeof window === 'undefined') return;

	clearLegacyKeys();
	const saved = loadSave();
	if (saved) $player.set(saved);

	const stopSaving = $player.listen(writeSave);
	const stopSync = onExternalChange((state) => $player.set(state ?? createInitialState()));
	return () => {
		stopSaving();
		stopSync();
	};
});
