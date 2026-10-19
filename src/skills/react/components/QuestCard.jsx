import { memo, useState } from 'react';
import { game, missingItems } from '../../../state/actions';
import { ITEMS_BY_ID } from '../../../state/catalog';
import styles from '../QuestBoard.module.css';

// memo: la tarjeta solo se vuelve a renderizar si cambia la misión, su estado
// o el inventario. Las misiones son objetos estables (catálogo o store), y las
// acciones se importan de src/state, así que no hay callbacks nuevos en cada render.
const QuestCard = memo(function QuestCard({ quest, done, custom, locked, pending, inventory }) {
	const [error, setError] = useState(null);
	const { id, title, difficulty, reward, requires, minLevel } = quest;
	const ready = !done && !locked && missingItems(inventory, requires).length === 0;
	const hintId = `quest-${id}-needs`;

	function deliver() {
		const result = game.completeQuest(id);
		setError(result.ok ? null : result.reason);
	}

	return (
		<li className={styles.card} data-done={done} data-pending={pending} data-locked={locked}>
			<div className={styles.info}>
				<span className={styles.title}>{title}</span>
				<span id={hintId} className={styles.needs}>
					{locked && <span className={styles.lock}>Requiere nivel {minLevel} · </span>}
					{Object.entries(requires).map(([itemId, qty], i) => {
						const have = Math.min(inventory[itemId] ?? 0, qty);
						return (
							<span key={itemId} data-ok={done || have >= qty}>
								{i > 0 && ' + '}
								{ITEMS_BY_ID.get(itemId)?.name ?? itemId} {done ? qty : have}/{qty}
							</span>
						);
					})}
				</span>
				{error && (
					<span role="alert" className={styles.error}>
						{error}
					</span>
				)}
			</div>
			<span className={styles.badge} data-difficulty={difficulty}>
				{difficulty}
			</span>
			<span className={styles.reward}>{pending ? 'guardando…' : `${reward.gold} ● ${reward.xp} XP`}</span>
			<div className={styles.actions}>
				{done ? (
					<span className={styles.doneTag}>¡Hecha!</span>
				) : (
					<button
						type="button"
						className={styles.deliver}
						disabled={pending || !ready}
						aria-describedby={hintId}
						onClick={deliver}
					>
						Entregar
					</button>
				)}
				{custom && (
					<button
						type="button"
						className={styles.remove}
						disabled={pending}
						onClick={() => game.removeQuest(id)}
						aria-label={`Retirar «${title}»`}
					>
						✕
					</button>
				)}
			</div>
		</li>
	);
});

export default QuestCard;
