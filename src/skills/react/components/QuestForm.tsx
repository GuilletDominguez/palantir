import { startTransition, useActionState, useId } from 'react';
import { saveQuest } from '../api';
import { useQuestsDispatch } from '../state/QuestsContext';
import { REWARDS, type Difficulty, type Quest } from '../types';
import SubmitButton from './SubmitButton';
import styles from '../QuestBoard.module.css';

interface FormState {
	error: string | null;
	title: string;
	difficulty: Difficulty;
}

const initialState: FormState = { error: null, title: '', difficulty: 'media' };

export default function QuestForm({ onOptimisticAdd }: { onOptimisticAdd: (quest: Quest) => void }) {
	const dispatch = useQuestsDispatch();
	const titleId = useId();
	const difficultyId = useId();

	// Acción de formulario de React 19: recibe FormData, gestiona el pending
	// y devuelve el nuevo estado (errores, valores a conservar...).
	const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
		const title = String(formData.get('title') ?? '').trim();
		const difficulty = formData.get('difficulty') as Difficulty;

		if (title.length < 4) {
			return { error: 'El título necesita al menos 4 letras.', title, difficulty };
		}

		onOptimisticAdd({
			id: `tmp-${Date.now()}`,
			title,
			difficulty,
			reward: REWARDS[difficulty],
			done: false,
			pending: true,
		});

		try {
			const quest = await saveQuest(title, difficulty);
			// Tras un await hay que volver a entrar en la transición
			startTransition(() => dispatch({ type: 'added', quest }));
			return initialState;
		} catch (err) {
			// Al terminar la acción, useOptimistic descarta la misión temporal
			return { error: (err as Error).message, title, difficulty };
		}
	}, initialState);

	return (
		<form action={formAction} className={styles.form}>
			<h4>Publicar misión</h4>

			<div className={styles.field}>
				<label htmlFor={titleId}>Título</label>
				<input
					id={titleId}
					name="title"
					defaultValue={state.title}
					placeholder="Derrotar al dragón…"
					autoComplete="off"
					aria-invalid={state.error ? true : undefined}
					aria-describedby={state.error ? `${titleId}-error` : undefined}
				/>
			</div>

			<div className={styles.field}>
				<label htmlFor={difficultyId}>Dificultad</label>
				<select id={difficultyId} name="difficulty" defaultValue={state.difficulty}>
					{Object.entries(REWARDS).map(([d, reward]) => (
						<option key={d} value={d}>
							{d} ({reward} oro)
						</option>
					))}
				</select>
			</div>

			{state.error && (
				<p id={`${titleId}-error`} role="alert" className={styles.error}>
					{state.error}
				</p>
			)}

			<SubmitButton />
		</form>
	);
}
