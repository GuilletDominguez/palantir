import { useDeferredValue, useOptimistic, useState } from 'react';
import { levelFor, nextLevelXp } from '../../state/catalog';
import Filters from './components/Filters';
import QuestForm from './components/QuestForm';
import QuestList from './components/QuestList';
import { QuestsProvider, usePlayer, useQuests } from './state/QuestsContext';
import styles from './QuestBoard.module.css';

export default function QuestBoard() {
	return (
		<QuestsProvider>
			<Board />
		</QuestsProvider>
	);
}

function Board() {
	const player = usePlayer();
	const quests = useQuests();
	// Las misiones nuevas aparecen al instante, antes de que el "servidor" responda.
	// Si el store ya la tiene (misma id), no se duplica mientras termina la acción.
	const [optimisticQuests, addOptimisticQuest] = useOptimistic(quests, (state, view) =>
		state.some((v) => v.quest.id === view.quest.id) ? state : [view, ...state],
	);

	const [status, setStatus] = useState('todas');
	const [query, setQuery] = useState('');
	// El input se actualiza en cada tecla; el filtrado va con prioridad baja
	const deferredQuery = useDeferredValue(query);

	// Estado derivado: se calcula al renderizar, sin useEffect ni estado duplicado
	const visible = filterQuests(optimisticQuests, status, deferredQuery);
	const level = levelFor(player.xp);
	const nextXp = nextLevelXp(player.xp);
	const pendingCount = quests.filter((q) => !q.done).length;

	return (
		<div className={styles.board}>
			<section className={styles.main} aria-label="Tablón de misiones">
				<Filters status={status} onStatusChange={setStatus} query={query} onQueryChange={setQuery} />
				<QuestList quests={visible} level={level} inventory={player.inventory} stale={query !== deferredQuery} />
			</section>

			<aside className={styles.side}>
				<div className={styles.stats}>
					<p>
						Oro: <strong className={styles.gold}>{player.gold}</strong>
					</p>
					<p>
						Nivel {level} · XP {player.xp}
						{nextXp !== null && ` / ${nextXp}`}
					</p>
					<p>Misiones pendientes: {pendingCount}</p>
				</div>
				<QuestForm onOptimisticAdd={addOptimisticQuest} />
			</aside>
		</div>
	);
}

function filterQuests(quests, status, query) {
	const q = query.trim().toLowerCase();
	return quests.filter(
		({ quest, done }) =>
			(status === 'todas' || (status === 'completadas' ? done : !done)) && quest.title.toLowerCase().includes(q),
	);
}
