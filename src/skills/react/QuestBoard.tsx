import { useDeferredValue, useOptimistic, useState } from 'react';
import Filters from './components/Filters';
import QuestForm from './components/QuestForm';
import QuestList from './components/QuestList';
import { QuestsProvider, useQuests } from './state/QuestsContext';
import type { Quest, StatusFilter } from './types';
import styles from './QuestBoard.module.css';

export default function QuestBoard() {
	return (
		<QuestsProvider>
			<Board />
		</QuestsProvider>
	);
}

function Board() {
	const quests = useQuests();
	// Las misiones nuevas aparecen al instante, antes de que el "servidor" responda
	const [optimisticQuests, addOptimisticQuest] = useOptimistic(quests, (state, quest: Quest) => [quest, ...state]);

	const [status, setStatus] = useState<StatusFilter>('todas');
	const [query, setQuery] = useState('');
	// El input se actualiza en cada tecla; el filtrado va con prioridad baja
	const deferredQuery = useDeferredValue(query);

	// Estado derivado: se calcula al renderizar, sin useEffect ni estado duplicado
	const visible = filterQuests(optimisticQuests, status, deferredQuery);
	const gold = quests.reduce((sum, q) => (q.done ? sum + q.reward : sum), 0);
	const pendingCount = quests.filter((q) => !q.done).length;

	return (
		<div className={styles.board}>
			<section className={styles.main} aria-label="Tablón de misiones">
				<Filters status={status} onStatusChange={setStatus} query={query} onQueryChange={setQuery} />
				<QuestList quests={visible} stale={query !== deferredQuery} />
			</section>

			<aside className={styles.side}>
				<div className={styles.stats}>
					<p>
						Oro ganado: <strong className={styles.gold}>{gold}</strong>
					</p>
					<p>Misiones pendientes: {pendingCount}</p>
				</div>
				<QuestForm onOptimisticAdd={addOptimisticQuest} />
			</aside>
		</div>
	);
}

function filterQuests(quests: Quest[], status: StatusFilter, query: string) {
	const q = query.trim().toLowerCase();
	return quests.filter(
		(quest) =>
			(status === 'todas' || (status === 'completadas' ? quest.done : !quest.done)) &&
			quest.title.toLowerCase().includes(q),
	);
}
