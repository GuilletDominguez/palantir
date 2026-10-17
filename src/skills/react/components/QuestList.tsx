import type { Quest } from '../types';
import QuestCard from './QuestCard';
import styles from '../QuestBoard.module.css';

export default function QuestList({ quests, stale }: { quests: Quest[]; stale: boolean }) {
	if (quests.length === 0) {
		return <p className={styles.empty}>No hay misiones con ese filtro.</p>;
	}

	return (
		// Mientras el filtrado diferido está pendiente, la lista se atenúa
		<ul className={styles.list} style={{ opacity: stale ? 0.6 : 1 }} aria-busy={stale}>
			{quests.map((quest) => (
				<QuestCard key={quest.id} quest={quest} />
			))}
		</ul>
	);
}
