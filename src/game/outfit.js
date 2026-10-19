// El atuendo del héroe: lo eligen en la sastrería (demo de CSS) y lo lleva
// puesto el personaje del juego. Solo datos y funciones puras, sin DOM, para
// que lo usen tanto el motor como la demo (que lo convierte en SVG en el servidor).

/** Filas libres sobre la cabeza del sprite para que quepan los sombreros. */
export const HAT_ROOM = 4;

export const OUTFIT_COLORS = {
	shirt: { b: '#3b5dc9', r: '#b13e53', g: '#38b764', p: '#5d275d' },
	pants: { n: '#29366f', K: '#5a3a28', Q: '#566c86' },
	hair: { k: '#8f563b', y: '#ffcd75', O: '#ef7d57', B: '#333c57' },
	cape: { r: '#b13e53', u: '#41a6f6' },
};

export const HATS = ['wizard', 'helmet', 'crown'];

export const DEFAULT_OUTFIT = { shirt: 'b', pants: 'n', hair: 'k', hat: 'none', cape: 'none' };

const ALLOWED = {
	shirt: Object.keys(OUTFIT_COLORS.shirt),
	pants: Object.keys(OUTFIT_COLORS.pants),
	hair: Object.keys(OUTFIT_COLORS.hair),
	hat: ['none', ...HATS],
	cape: ['none', ...Object.keys(OUTFIT_COLORS.cape)],
};

/** Valida datos externos (localStorage, formulario): lo que no encaje vuelve al valor por defecto. */
export function parseOutfit(value) {
	const source = typeof value === 'object' && value !== null ? value : {};
	const pick = (key) => {
		const v = source[key];
		return typeof v === 'string' && ALLOWED[key].includes(v) ? v : DEFAULT_OUTFIT[key];
	};
	return { shirt: pick('shirt'), pants: pick('pants'), hair: pick('hair'), hat: pick('hat'), cape: pick('cape') };
}

// Sprites de los accesorios, en coordenadas del sprite completo (16 × 20,
// con HAT_ROOM filas libres arriba). `C` y `D` son el color de la capa y su sombra.
export const HAT_GRIDS = {
	wizard: {
		top: 0,
		rows: [
			'........oo......',
			'.......opo......',
			'......oppo......',
			'.....opyppo.....',
			'....oppppppo....',
			'..oooooooooooo..',
			'..oppppppppppo..',
			'..oooooooooooo..',
		],
	},
	helmet: {
		top: 4,
		rows: [
			'.....oooooo.....',
			'....oqqqqqqo....',
			'...oqwqqqqqqo...',
			'...oqqqqqqqqo...',
			'...oqqqqqqqqo...',
			'...oQQQQQQQQo...',
		],
	},
	crown: {
		top: 2,
		rows: ['....oo.oo.oo....', '....yy.yy.yy....', '...oyyoyyoyyo...', '...oyyyryyyyo...', '...oooooooooo...'],
	},
};

export const CAPE_GRID = {
	top: HAT_ROOM + 9,
	rows: [
		'..oCCCCCCCCCCo..',
		'.oDCCCCCCCCCCDo.',
		'.oDCCCCCCCCCCDo.',
		'.oDDCCCCCCCCDDo.',
		'.oDDCCCCCCCCDDo.',
		'..oDDCCCCCCDDo..',
		'...oooooooooo...',
	],
};

/** Oscurece un color #rrggbb (equivale a color-mix con negro). */
export function shade(hex, amount = 0.35) {
	return (
		'#' +
		[1, 3, 5]
			.map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)))
			.map((v) => v.toString(16).padStart(2, '0'))
			.join('')
	);
}

/** Colores que sustituyen a las letras variables del sprite del héroe. */
export function outfitPalette(outfit) {
	const hair = OUTFIT_COLORS.hair[outfit.hair];
	const cape = outfit.cape === 'none' ? '#000000' : OUTFIT_COLORS.cape[outfit.cape];
	return {
		k: hair,
		K: shade(hair),
		b: OUTFIT_COLORS.shirt[outfit.shirt],
		n: OUTFIT_COLORS.pants[outfit.pants],
		C: cape,
		D: shade(cape),
	};
}

/**
 * Viste un sprite de 16 × 16 (cabeza, cuerpo y piernas): le añade las filas de
 * HAT_ROOM, la capa (detrás, o delante si mira hacia arriba) y el sombrero.
 */
export function dress(rows, outfit, capeInFront = false) {
	const width = rows[0].length;
	const grid = [...Array.from({ length: HAT_ROOM }, () => '.'.repeat(width)), ...rows].map((r) => [...r]);
	const overlay = (layer, under) =>
		layer.rows.forEach((row, dy) =>
			[...row].forEach((px, x) => {
				const y = layer.top + dy;
				if (px === '.' || !grid[y]) return;
				if (!under || grid[y][x] === '.') grid[y][x] = px;
			}),
		);
	if (outfit.cape !== 'none') overlay(CAPE_GRID, !capeInFront);
	if (outfit.hat !== 'none') overlay(HAT_GRIDS[outfit.hat], false);
	return grid.map((r) => r.join(''));
}
