import { createContext, use, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Quest } from '../types';
import { initialQuests, questsReducer, type QuestAction } from './questsReducer';

// Estado y dispatch en contextos separados: los componentes que solo
// despachan acciones no se vuelven a renderizar cuando cambia la lista.
const QuestsContext = createContext<Quest[] | null>(null);
const QuestsDispatchContext = createContext<Dispatch<QuestAction> | null>(null);

export function QuestsProvider({ children }: { children: ReactNode }) {
	const [quests, dispatch] = useReducer(questsReducer, initialQuests);
	return (
		<QuestsContext value={quests}>
			<QuestsDispatchContext value={dispatch}>{children}</QuestsDispatchContext>
		</QuestsContext>
	);
}

export function useQuests() {
	const ctx = use(QuestsContext);
	if (!ctx) throw new Error('useQuests debe usarse dentro de <QuestsProvider>');
	return ctx;
}

export function useQuestsDispatch() {
	const ctx = use(QuestsDispatchContext);
	if (!ctx) throw new Error('useQuestsDispatch debe usarse dentro de <QuestsProvider>');
	return ctx;
}
