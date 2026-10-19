import { CAPE_GRID, HAT_GRIDS, HAT_ROOM, OUTFIT_COLORS } from '../../game/outfit';
import { BODY_FRONT, HEAD_DOWN, LEGS_FRONT } from '../../game/sprites';

// Datos de la sastrería. Todo se usa en el servidor para generar HTML y SVG:
// esta demo no envía ni una línea de JavaScript al navegador.

export { HAT_ROOM };
export const HERO_W = 16;
export const HERO_H = HAT_ROOM + HEAD_DOWN.length + BODY_FRONT.length + LEGS_FRONT[0].length;

/** Une los píxeles iguales de cada fila en un solo <rect> (menos nodos en el SVG). */
export function toRuns(rows, top = 0) {
	const runs = [];
	rows.forEach((row, y) => {
		for (let x = 0; x < row.length;) {
			const key = row[x];
			let w = 1;
			while (row[x + w] === key) w++;
			if (key !== '.') runs.push({ x, y: y + top, w, key });
			x += w;
		}
	});
	return runs;
}

const legsTop = HAT_ROOM + HEAD_DOWN.length + BODY_FRONT.length;
export const HERO_BODY = toRuns([...HEAD_DOWN, ...BODY_FRONT], HAT_ROOM);
/** Fotogramas de las piernas: 0 quieto, 1 y 2 pasos. */
export const HERO_LEGS = LEGS_FRONT.map((legs) => toRuns(legs, legsTop));

// Accesorios: los mismos sprites que lleva puestos el héroe del juego
// (src/game/outfit.js). `C` y `D` son el color de la capa y su sombra.
export const HATS = Object.fromEntries(Object.entries(HAT_GRIDS).map(([id, { top, rows }]) => [id, toRuns(rows, top)]));
export const CAPE = toRuns(CAPE_GRID.rows, CAPE_GRID.top);

// Grupos de opciones. `swatch` es el color de la muestra en las opciones de color.
// Los valores coinciden con los selectores de Tailor.astro:
// .tailor:has([name='shirt'][value='r']:checked) { --shirt: … }
export const GROUPS = [
	{
		name: 'shirt',
		legend: 'Túnica',
		choices: [
			{ value: 'b', label: 'Azul', swatch: OUTFIT_COLORS.shirt.b },
			{ value: 'r', label: 'Granate', swatch: OUTFIT_COLORS.shirt.r },
			{ value: 'g', label: 'Verde', swatch: OUTFIT_COLORS.shirt.g },
			{ value: 'p', label: 'Morada', swatch: OUTFIT_COLORS.shirt.p },
		],
	},
	{
		name: 'pants',
		legend: 'Calzas',
		choices: [
			{ value: 'n', label: 'Marino', swatch: OUTFIT_COLORS.pants.n },
			{ value: 'K', label: 'Cuero', swatch: OUTFIT_COLORS.pants.K },
			{ value: 'Q', label: 'Acero', swatch: OUTFIT_COLORS.pants.Q },
		],
	},
	{
		name: 'hair',
		legend: 'Pelo',
		choices: [
			{ value: 'k', label: 'Castaño', swatch: OUTFIT_COLORS.hair.k },
			{ value: 'y', label: 'Rubio', swatch: OUTFIT_COLORS.hair.y },
			{ value: 'O', label: 'Pelirrojo', swatch: OUTFIT_COLORS.hair.O },
			{ value: 'B', label: 'Moreno', swatch: OUTFIT_COLORS.hair.B },
		],
	},
	{
		name: 'hat',
		legend: 'Sombrero',
		choices: [
			{ value: 'none', label: 'Ninguno' },
			{ value: 'wizard', label: 'Mago' },
			{ value: 'helmet', label: 'Casco' },
			{ value: 'crown', label: 'Corona' },
		],
	},
	{
		name: 'cape',
		legend: 'Capa',
		choices: [
			{ value: 'none', label: 'Ninguna' },
			{ value: 'r', label: 'Roja', swatch: OUTFIT_COLORS.cape.r },
			{ value: 'u', label: 'Celeste', swatch: OUTFIT_COLORS.cape.u },
		],
	},
	{
		name: 'pose',
		legend: 'Pose',
		choices: [
			{ value: 'idle', label: 'Quieto' },
			{ value: 'walk', label: 'Andando' },
			{ value: 'jump', label: 'Saltando' },
		],
	},
];
