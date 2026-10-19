import { atom } from 'nanostores';

// Puente entre el juego (JavaScript sin framework) y las islas de cada framework.
// nanostores es agnóstico, así que Vue, React o Svelte pueden suscribirse igual.
export const $activePanel = atom(null);
