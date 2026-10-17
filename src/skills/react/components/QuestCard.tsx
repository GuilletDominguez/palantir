import { memo } from 'react';
import { useQuestsDispatch } from '../state/QuestsContext';
import type { Quest } from '../types';
import styles from '../QuestBoard.module.css';

// memo: si la misión no cambia, la tarjeta no se vuelve a renderizar.
// Funciona porque dispatch es estable y llega por contexto, no por props.
const QuestCard = memo(function QuestCard({ quest }: { quest: Quest }) {
	const dispatch = useQuestsDispatch();
	const { id, title, difficulty, reward, done, pending } = quest;

	return (
		<li className={styles.card} data-done={done} data-pending={pending}>
			<label className={styles.check}>
				<input
					type="checkbox"
					checked={done}
					disabled={pending}
					onChange={() => dispatch({ type: 'toggled', id })}
				/>
				<span className={styles.title}>{title}</span>
			</label>
			<span className={styles.badge} data-difficulty={difficulty}>
				{difficulty}
			</span>
			<span className={styles.reward}>{pending ? 'guardando…' : `${reward} ●`}</span>
			<button
				type="button"
				className={styles.remove}
				disabled={pending}
				onClick={() => dispatch({ type: 'removed', id })}
				aria-label={`Eliminar «${title}»`}
			>
				✕
			</button>
		</li>
	);
});

export default QuestCard;
