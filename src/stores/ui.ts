import { atom } from 'nanostores';
import type { PlaceId } from '../skills/registry';

export type PanelId = PlaceId | 'welcome' | 'about';

// Puente entre el juego (vanilla TS) y las islas de cada framework.
// nanostores es agnóstico, así que Vue, React o Svelte pueden suscribirse igual.
export const $activePanel = atom<PanelId | null>(null);
