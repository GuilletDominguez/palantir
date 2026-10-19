import { ITEMS_BY_ID, QUESTS } from './catalog';

// Persistencia en localStorage. Todo lo que viene de fuera se trata como
// `unknown` y se valida: si la partida está corrupta, se descarta y se empieza
// de cero en vez de romper la página.

export const SAVE_KEY = 'palantir:save';
export const SAVE_VERSION = 1;

/** Claves de la época en que cada demo guardaba lo suyo por separado. */
const LEGACY_KEYS = ['palantir:vue-cart', 'palantir:svelte-recipes'];

/**
 * Migraciones de esquema: la entrada `n` convierte una partida de la versión
 * `n` a la `n + 1`. Al subir SAVE_VERSION se añade aquí la conversión.
 */
const MIGRATIONS = {};

const isRecord = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const DIFFICULTIES = ['fácil', 'media', 'difícil'];

function parseCounts(value, accept) {
	if (!isRecord(value)) return {};
	return Object.fromEntries(Object.entries(value).filter((e) => accept(e[0]) && isCount(e[1]) && e[1] > 0));
}

function parseQuest(value) {
	if (!isRecord(value) || !isRecord(value.reward)) return null;
	const { id, title, difficulty, reward } = value;
	const requires = parseCounts(value.requires, (id) => ITEMS_BY_ID.get(id)?.kind === 'potion');
	if (
		typeof id !== 'string' ||
		typeof title !== 'string' ||
		!DIFFICULTIES.includes(difficulty) ||
		!isCount(reward.gold) ||
		!isCount(reward.xp) ||
		Object.keys(requires).length === 0
	) {
		return null;
	}
	return { id, title, difficulty: difficulty, requires, reward: { gold: reward.gold, xp: reward.xp } };
}

/** Convierte el texto guardado en un estado válido, o null si no se puede. */
export function parseSave(raw) {
	if (!raw) return null;
	let data;
	try {
		data = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!isRecord(data) || !isCount(data.version) || data.version > SAVE_VERSION) return null;

	for (let v = data.version; v < SAVE_VERSION; v++) {
		const migrate = MIGRATIONS[v];
		if (!migrate) return null;
		data = migrate(data);
	}
	const save = data;

	if (!isCount(save.gold) || !isCount(save.xp)) return null;

	const seen = new Set();
	const customQuests = (Array.isArray(save.customQuests) ? save.customQuests : [])
		.map(parseQuest)
		.filter((q) => q !== null && !seen.has(q.id) && !!seen.add(q.id));

	const known = new Set([...QUESTS.map((q) => q.id), ...customQuests.map((q) => q.id)]);
	const completedQuests = [
		...new Set(
			(Array.isArray(save.completedQuests) ? save.completedQuests : []).filter(
				(id) => typeof id === 'string' && known.has(id),
			),
		),
	];

	return {
		gold: save.gold,
		xp: save.xp,
		inventory: parseCounts(save.inventory, (id) => ITEMS_BY_ID.has(id)),
		completedQuests,
		customQuests,
		version: SAVE_VERSION,
	};
}

// --------------------------------------------- acceso a localStorage
// Solo se llama desde el navegador. Cualquier fallo (modo privado, cuota
// llena, almacenamiento bloqueado) se ignora: la partida sigue en memoria.

export function loadSave() {
	try {
		return parseSave(localStorage.getItem(SAVE_KEY));
	} catch {
		return null;
	}
}

export function writeSave(state) {
	try {
		const raw = JSON.stringify(state);
		if (localStorage.getItem(SAVE_KEY) !== raw) localStorage.setItem(SAVE_KEY, raw);
	} catch {}
}

export function clearLegacyKeys() {
	try {
		LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
	} catch {}
}

/** Avisa cuando otra pestaña cambia la partida (null si la borró o la corrompió). */
export function onExternalChange(callback) {
	const handler = (e) => {
		if (e.key === SAVE_KEY || e.key === null) callback(parseSave(e.newValue));
	};
	window.addEventListener('storage', handler);
	return () => window.removeEventListener('storage', handler);
}
