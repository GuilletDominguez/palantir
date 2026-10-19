import { CUSTOM_QUEST_RULES } from '../../state/catalog';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** La dificultad fija cuántas pociones pide la misión y cuánto paga. */
export function buildQuest(id, title, difficulty, potion) {
	const { potions, gold, xp } = CUSTOM_QUEST_RULES[difficulty];
	return { id, title, difficulty, requires: { [potion]: potions }, reward: { gold, xp } };
}

/** "Servidor" simulado: tarda un poco y rechaza las misiones contra dragones. */
export async function saveQuest(quest) {
	await delay(900);
	if (/drag[oó]n/i.test(quest.title)) {
		throw new Error('El gremio no acepta misiones contra dragones. ¡Demasiado peligroso!');
	}
	return quest;
}
