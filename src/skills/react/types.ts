export type Difficulty = 'fácil' | 'media' | 'difícil';

export interface Quest {
	id: string;
	title: string;
	difficulty: Difficulty;
	reward: number;
	done: boolean;
	/** Solo en la lista optimista: aún no confirmada por el "servidor". */
	pending?: boolean;
}

export type StatusFilter = 'todas' | 'pendientes' | 'completadas';

export const REWARDS: Record<Difficulty, number> = { fácil: 10, media: 25, difícil: 50 };
