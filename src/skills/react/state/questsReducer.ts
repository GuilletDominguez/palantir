import type { Quest } from '../types';

// Unión discriminada: TypeScript obliga a tratar cada acción con su forma exacta.
export type QuestAction =
	| { type: 'added'; quest: Quest }
	| { type: 'toggled'; id: string }
	| { type: 'removed'; id: string };

// Reductor puro: misma entrada, misma salida, sin mutar el estado.
export function questsReducer(quests: Quest[], action: QuestAction): Quest[] {
	switch (action.type) {
		case 'added':
			return [action.quest, ...quests];
		case 'toggled':
			return quests.map((q) => (q.id === action.id ? { ...q, done: !q.done } : q));
		case 'removed':
			return quests.filter((q) => q.id !== action.id);
	}
}

export const initialQuests: Quest[] = [
	{ id: 'q1', title: 'Recoger 10 setas del bosque', difficulty: 'fácil', reward: 10, done: true },
	{ id: 'q2', title: 'Escoltar al mercader hasta el puerto', difficulty: 'media', reward: 25, done: false },
	{ id: 'q3', title: 'Recuperar el amuleto de la cripta', difficulty: 'difícil', reward: 50, done: false },
	{ id: 'q4', title: 'Reparar el puente del río', difficulty: 'media', reward: 25, done: false },
];
