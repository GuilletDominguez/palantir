import { REWARDS, type Difficulty, type Quest } from './types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Servidor" simulado: tarda un poco y rechaza las misiones contra dragones. */
export async function saveQuest(title: string, difficulty: Difficulty): Promise<Quest> {
	await delay(900);
	if (/drag[oó]n/i.test(title)) {
		throw new Error('El gremio no acepta misiones contra dragones. ¡Demasiado peligroso!');
	}
	return { id: crypto.randomUUID(), title, difficulty, reward: REWARDS[difficulty], done: false };
}
