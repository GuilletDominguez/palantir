import { useActionState, useId } from 'react';
import { uid } from '../../../lib/id';
import { game } from '../../../state/actions';
import { CUSTOM_QUEST_RULES, POTIONS } from '../../../state/catalog';
import { buildQuest, saveQuest } from '../api';
import SubmitButton from './SubmitButton';
import styles from '../QuestBoard.module.css';

const initialState = { error: null, title: '', difficulty: 'media', potion: POTIONS[0].id };

export default function QuestForm({ onOptimisticAdd }) {
	const titleId = useId();
	const difficultyId = useId();
	const potionId = useId();

	// Acción de formulario de React 19: recibe FormData, gestiona el pending
	// y devuelve el nuevo estado (errores, valores a conservar...).
	const [state, formAction] = useActionState(async (_prev, formData) => {
		const title = String(formData.get('title') ?? '').trim();
		const difficulty = formData.get('difficulty');
		const potion = String(formData.get('potion') ?? initialState.potion);

		if (title.length < 4) {
			return { error: 'El título necesita al menos 4 letras.', title, difficulty, potion };
		}

		// El id se genera aquí para que la versión optimista y la guardada coincidan
		const quest = buildQuest(uid(), title, difficulty, potion);
		onOptimisticAdd({ quest, done: false, custom: true, pending: true });

		try {
			const saved = await saveQuest(quest);
			// El store es externo a React: no hace falta startTransition. La versión
			// optimista y la real comparten id, así que no se ven duplicadas.
			const result = game.addQuest(saved);
			return result.ok ? initialState : { error: result.reason, title, difficulty, potion };
		} catch (err) {
			// Al terminar la acción, useOptimistic descarta la misión temporal
			return { error: err.message, title, difficulty, potion };
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
				<label htmlFor={potionId}>Poción que pide</label>
				<select id={potionId} name="potion" defaultValue={state.potion}>
					{POTIONS.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</div>

			<div className={styles.field}>
				<label htmlFor={difficultyId}>Dificultad</label>
				<select id={difficultyId} name="difficulty" defaultValue={state.difficulty}>
					{Object.entries(CUSTOM_QUEST_RULES).map(([d, { potions, gold }]) => (
						<option key={d} value={d}>
							{d} (×{potions} · {gold} oro)
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
