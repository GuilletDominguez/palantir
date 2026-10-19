import { useStore } from '@nanostores/react';
import { createContext, use } from 'react';
import { QUESTS } from '../../../state/catalog';
import { $player } from '../../../state/economy';

// La partida vive en nanostores, fuera de React. El Provider se suscribe una
// sola vez y la reparte por contexto, así ningún componente lee el store suelto.
const PlayerContext = createContext(null);

export function QuestsProvider({ children }) {
	// useStore usa useSyncExternalStore. Con ssr: 'initial', al hidratar React
	// usa el valor inicial del átomo (el mismo que en el servidor) y después
	// vuelve a renderizar con la partida guardada: sin hydration mismatch.
	const player = useStore($player, { ssr: 'initial' });
	return <PlayerContext value={player}>{children}</PlayerContext>;
}

export function usePlayer() {
	const ctx = use(PlayerContext);
	if (!ctx) throw new Error('usePlayer debe usarse dentro de <QuestsProvider>');
	return ctx;
}

/** Misiones del catálogo y las publicadas por el usuario, con su estado. */
export function useQuests() {
	const { customQuests, completedQuests } = usePlayer();
	return [
		...customQuests.map((quest) => ({ quest, custom: true, done: completedQuests.includes(quest.id) })),
		...QUESTS.map((quest) => ({ quest, custom: false, done: completedQuests.includes(quest.id) })),
	];
}
