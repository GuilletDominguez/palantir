// Todos los gráficos se generan en tiempo de ejecución a resolución nativa
// (16 px por tile) a partir de cuadrículas de texto y primitivas.

import type { PlaceId } from '../skills/registry';
import { PALETTE } from './palette';
import { STATUE_BUST } from './statue';

export const TILE = 16;

export { PALETTE };

export type Sprite = HTMLCanvasElement;

function canvas(w: number, h: number): [Sprite, CanvasRenderingContext2D] {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const ctx = c.getContext('2d')!;
	ctx.imageSmoothingEnabled = false;
	return [c, ctx];
}

function paintGrid(ctx: CanvasRenderingContext2D, rows: string[], ox = 0, oy = 0) {
	rows.forEach((row, y) => {
		for (let x = 0; x < row.length; x++) {
			const color = PALETTE[row[x]];
			if (!color) continue;
			ctx.fillStyle = color;
			ctx.fillRect(ox + x, oy + y, 1, 1);
		}
	});
}

export function fromGrid(rows: string[]): Sprite {
	const [c, ctx] = canvas(rows[0].length, rows.length);
	paintGrid(ctx, rows);
	return c;
}

function flipX(src: Sprite): Sprite {
	const [c, ctx] = canvas(src.width, src.height);
	ctx.translate(src.width, 0);
	ctx.scale(-1, 1);
	ctx.drawImage(src, 0, 0);
	return c;
}

// PRNG determinista para que el mapa salga igual en cada carga.
export function rng(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------------------------------------------------------------- tiles

function grassTile(seed: number, flowers: boolean): Sprite {
	const [c, ctx] = canvas(TILE, TILE);
	const rand = rng(seed);
	ctx.fillStyle = PALETTE.g;
	ctx.fillRect(0, 0, TILE, TILE);
	for (let i = 0; i < 7; i++) {
		const x = Math.floor(rand() * 15);
		const y = Math.floor(rand() * 14) + 1;
		ctx.fillStyle = PALETTE.d;
		ctx.fillRect(x, y, 1, 2);
		ctx.fillRect(x + 1, y + 1, 1, 1);
	}
	for (let i = 0; i < 3; i++) {
		ctx.fillStyle = PALETTE.l;
		ctx.fillRect(Math.floor(rand() * 16), Math.floor(rand() * 16), 1, 1);
	}
	if (flowers) {
		for (let i = 0; i < 2; i++) {
			const x = 2 + Math.floor(rand() * 11);
			const y = 2 + Math.floor(rand() * 11);
			const petal = [PALETTE.w, PALETTE.y, PALETTE.O][Math.floor(rand() * 3)];
			ctx.fillStyle = petal;
			ctx.fillRect(x - 1, y, 3, 1);
			ctx.fillRect(x, y - 1, 1, 3);
			ctx.fillStyle = PALETTE.y;
			ctx.fillRect(x, y, 1, 1);
		}
	}
	return c;
}

function pathTile(seed: number): Sprite {
	const [c, ctx] = canvas(TILE, TILE);
	const rand = rng(seed);
	ctx.fillStyle = PALETTE.y;
	ctx.fillRect(0, 0, TILE, TILE);
	for (let i = 0; i < 6; i++) {
		ctx.fillStyle = i % 2 ? PALETTE.O : PALETTE.k;
		ctx.globalAlpha = 0.5;
		ctx.fillRect(Math.floor(rand() * 15), Math.floor(rand() * 15), i % 3 ? 1 : 2, 1);
	}
	ctx.globalAlpha = 1;
	return c;
}

function waterTile(frame: number): Sprite {
	const [c, ctx] = canvas(TILE, TILE);
	ctx.fillStyle = PALETTE.b;
	ctx.fillRect(0, 0, TILE, TILE);
	ctx.fillStyle = PALETTE.u;
	for (let y = 2; y < TILE; y += 6) {
		const off = (frame * 3 + y) % 8;
		ctx.fillRect(off, y, 4, 1);
		ctx.fillRect((off + 8) % 16, y + 3, 3, 1);
	}
	ctx.fillStyle = PALETTE.c;
	ctx.fillRect((frame * 5 + 3) % 14, 8, 2, 1);
	return c;
}

const TREE = [
	'.....oooooo.....',
	'...oolllddoo....',
	'..oglgggggddo...',
	'.ogllgggggggdo..',
	'.oglggggggggdo..',
	'oggggggglgggddo.',
	'ogggggggggggddo.',
	'ogggglggggggddo.',
	'ogggggggggggddo.',
	'.ogggggggggddo..',
	'.oddgggggggddo..',
	'..odddddddddo...',
	'...ooooKKooo....',
	'.......kK.......',
	'.......kK.......',
	'.....oookKoo....',
];

const SIGN = [
	'................',
	'.oooooooooooooo.',
	'.okkkkkkkkkkkko.',
	'.okKKKKKKKKKKko.',
	'.okkkkkkkkkkkko.',
	'.okKKKKKKKKkkko.',
	'.okkkkkkkkkkkko.',
	'.oooooooooooooo.',
	'......oKKo......',
	'......okKo......',
	'......okKo......',
	'......okKo......',
	'.....ookKoo.....',
	'................',
	'................',
	'................',
];

// ---------------------------------------------------------------- jugador

const HEAD_DOWN = [
	'................',
	'.....oooooo.....',
	'....okkkkkko....',
	'...okkkkkkkko...',
	'...okkkkkkkko...',
	'...okssssssko...',
	'...ossossosso...',
	'...osssssssso...',
	'....oossssoo....',
];
const HEAD_UP = [
	'................',
	'.....oooooo.....',
	'....okkkkkko....',
	'...okkkkkkkko...',
	'...okkkkkkkko...',
	'...okkkkkkkko...',
	'...okkkkkkkko...',
	'...oKkkkkkkKo...',
	'....ooKKKKoo....',
];
const HEAD_SIDE = [
	'................',
	'.....oooooo.....',
	'....okkkkkko....',
	'...okkkkkkkko...',
	'...okkkkkkkko...',
	'...okkkksssso...',
	'...okkkssosso...',
	'...okksssssso...',
	'....oossssoo....',
];
const BODY_FRONT = [
	'...obbbbbbbbo...',
	'..osbbbbbbbbso..',
	'..osbbbbbbbbso..',
	'...obbbbbbbbo...',
];
const BODY_SIDE = [
	'...obbbbbbbbo...',
	'...obbbsbbbbo...',
	'...obbbsbbbbo...',
	'...obbbbbbbbo...',
];
const LEGS_FRONT = [
	['...onnnoonnno...', '...onno..onno...', '....oo....oo....'],
	['...onnnoonnno...', '...onno..ooo....', '....oo..........'],
	['...onnnoonnno...', '....ooo..onno...', '..........oo....'],
];
const LEGS_SIDE = [
	['....onnnnnno....', '....onnoonno....', '....oo....oo....'],
	['....onnnnnno....', '...onno...onno..', '...oo......oo...'],
	['....onnnnnno....', '....onnoonno....', '....oo....oo....'],
];

export type Facing = 'down' | 'up' | 'left' | 'right';

function playerFrames(): Record<Facing, Sprite[]> {
	const build = (head: string[], body: string[], legs: string[][]) =>
		legs.map((l) => fromGrid([...head, ...body, ...l]));
	const down = build(HEAD_DOWN, BODY_FRONT, LEGS_FRONT);
	const up = build(HEAD_UP, BODY_FRONT, LEGS_FRONT);
	const right = build(HEAD_SIDE, BODY_SIDE, LEGS_SIDE);
	return { down, up, right, left: right.map(flipX) };
}

// ---------------------------------------------------------------- iconos

const ICONS: Partial<Record<PlaceId, string[]>> = {
	hobbies: [
		'..rr....rr..',
		'.rrrr..rrrr.',
		'rrwrrrrrrrrr',
		'rwrrrrrrrrrr',
		'rrrrrrrrrrrr',
		'rrrrrrrrrrrr',
		'.rrrrrrrrrr.',
		'..rrrrrrrr..',
		'...rrrrrr...',
		'....rrrr....',
		'.....rr.....',
	],
	vue: [
		'gggdd..ddggg',
		'.gggd..dggg.',
		'.ggggddgggg.',
		'..gggddggg..',
		'..gggddggg..',
		'...ggddgg...',
		'...gggggg...',
		'....gggg....',
		'....gggg....',
		'.....gg.....',
	],
	svelte: [
		'....OOOOO...',
		'..OOOOOOOO..',
		'.OOO....OO..',
		'.OO.........',
		'.OOO........',
		'..OOOOOOO...',
		'...OOOOOOO..',
		'........OOO.',
		'.........OO.',
		'..OO....OOO.',
		'..OOOOOOOO..',
		'...OOOOO....',
	],
	angular: [
		'.....rr.....',
		'...rrrrrr...',
		'rrrrrwwrrrrr',
		'rrrrrwwrrrrr',
		'.rrrwrrwrrr.',
		'.rrrwrrwrrr.',
		'.rrwwwwwwrr.',
		'..rwrrrrwr..',
		'..rwrrrrwr..',
		'...rrrrrr...',
		'....rrrr....',
		'.....rr.....',
	],
	css: [
		'...uu..uu...',
		'..uu....uu..',
		'..uu....uu..',
		'..uu....uu..',
		'.uu......uu.',
		'uu........uu',
		'.uu......uu.',
		'..uu....uu..',
		'..uu....uu..',
		'..uu....uu..',
		'...uu..uu...',
	],
	cyber: [
		'....qqqq....',
		'...qq..qq...',
		'...q....q...',
		'...q....q...',
		'.yyyyyyyyyy.',
		'.yyyyyyyyyy.',
		'.yyyyooyyyy.',
		'.yyyyooyyyy.',
		'.yyyyyoyyyy.',
		'.yyyyyyyyyy.',
		'.yyyyyyyyyy.',
	],
	python: [
		'...uuuuu....',
		'..uwuuuuu...',
		'......uuu...',
		'uuuuuuuuu.y.',
		'uuuuuuuuu.yy',
		'uuu......yyy',
		'uuu......yyy',
		'uu.yyyyyyyyy',
		'.u.yyyyyyyyy',
		'...yyy......',
		'...yyyyywy..',
		'....yyyyy...',
	],
};

// El átomo de React se rasteriza a partir de tres elipses rotadas.
function reactIcon(): Sprite {
	const size = 15;
	const [c, ctx] = canvas(size, size);
	const cx = 7;
	const cy = 7;
	ctx.fillStyle = PALETTE.c;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dx = x - cx;
			const dy = y - cy;
			if (dx * dx + dy * dy <= 2) {
				ctx.fillRect(x, y, 1, 1);
				continue;
			}
			for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
				const rx = dx * Math.cos(a) + dy * Math.sin(a);
				const ry = -dx * Math.sin(a) + dy * Math.cos(a);
				const d = (rx * rx) / 49 + (ry * ry) / 6.25;
				if (d > 0.7 && d < 1.2) {
					ctx.fillRect(x, y, 1, 1);
					break;
				}
			}
		}
	}
	return c;
}

function skillIcon(id: PlaceId): Sprite {
	if (id === 'react') return reactIcon();
	return fromGrid(ICONS[id]!);
}

// ---------------------------------------------------------------- edificios

export function building(id: PlaceId, wTiles: number, hTiles: number, roof: [string, string]): Sprite {
	const w = wTiles * TILE;
	const h = hTiles * TILE;
	const [c, ctx] = canvas(w, h);
	const rect = (x: number, y: number, rw: number, rh: number, color: string) => {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, rw, rh);
	};

	const roofH = Math.round(h * 0.55);
	const wallTop = roofH - 2;

	// Paredes
	rect(4, wallTop, w - 8, h - wallTop, PALETTE.o);
	rect(5, wallTop, w - 10, h - wallTop - 1, PALETTE.w);
	for (let y = wallTop + 4; y < h - 1; y += 4) rect(5, y, w - 10, 1, PALETTE.q);

	// Tejado con tejas escalonadas
	rect(0, 4, w, roofH - 4, PALETTE.o);
	rect(1, 5, w - 2, roofH - 6, roof[0]);
	for (let y = 9, row = 0; y < roofH - 2; y += 4, row++) {
		rect(1, y, w - 2, 1, roof[1]);
		for (let x = 1 + (row % 2) * 4; x < w - 1; x += 8) rect(x, y - 3, 1, 3, roof[1]);
	}
	rect(1, roofH - 3, w - 2, 1, roof[1]);
	rect(2, 2, w - 4, 3, PALETTE.o);
	rect(3, 3, w - 6, 1, roof[1]);

	// Emblema de la skill en el tejado
	const icon = skillIcon(id);
	const plaque = 18;
	const px = Math.floor((w - plaque) / 2);
	const py = 7;
	rect(px - 1, py - 1, plaque + 2, plaque + 2, PALETTE.o);
	rect(px, py, plaque, plaque, PALETTE.B);
	ctx.drawImage(icon, px + Math.floor((plaque - icon.width) / 2), py + Math.floor((plaque - icon.height) / 2));

	// Puerta centrada
	const doorW = 14;
	const doorH = 20;
	const dx = Math.floor((w - doorW) / 2);
	const dy = h - doorH;
	rect(dx - 1, dy - 1, doorW + 2, doorH + 1, PALETTE.o);
	rect(dx, dy, doorW, doorH, PALETTE.k);
	rect(dx + 2, dy + 2, doorW - 4, 6, PALETTE.K);
	rect(dx + 2, dy + 10, doorW - 4, 7, PALETTE.K);
	rect(dx + doorW - 4, dy + 9, 2, 2, PALETTE.y);

	// Ventanas
	const winW = 14;
	const winH = 10;
	const wy = wallTop + 6;
	for (const wx of [12, w - 12 - winW]) {
		rect(wx - 1, wy - 1, winW + 2, winH + 2, PALETTE.o);
		rect(wx, wy, winW, winH, PALETTE.c);
		rect(wx, wy, winW, 3, PALETTE.u);
		rect(wx + winW / 2, wy, 1, winH, PALETTE.o);
		rect(wx, wy + winH / 2, winW, 1, PALETTE.o);
		rect(wx - 1, wy + winH + 1, winW + 2, 2, roof[1]);
	}

	return c;
}

// ---------------------------------------------------------------- estatua

/** Busto pixelado (generado desde la foto) sobre un pedestal de piedra. 32×48 px. */
function statue(): Sprite {
	const w = 2 * TILE;
	const h = 3 * TILE;
	const [c, ctx] = canvas(w, h);
	const rect = (x: number, y: number, rw: number, rh: number, color: string) => {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, rw, rh);
	};

	// Pedestal: losa superior, columna con placa dorada y base
	const top = h - 17;
	rect(1, top, w - 2, 5, PALETTE.o);
	rect(2, top + 1, w - 4, 3, PALETTE.q);
	rect(2, top + 1, w - 4, 1, PALETTE.w);
	rect(5, top + 5, w - 10, 8, PALETTE.o);
	rect(6, top + 5, w - 12, 8, PALETTE.Q);
	rect(w - 9, top + 5, 3, 8, PALETTE.B);
	rect(10, top + 7, w - 20, 4, PALETTE.o);
	rect(11, top + 8, w - 22, 2, PALETTE.y);
	rect(0, h - 4, w, 4, PALETTE.o);
	rect(1, h - 4, w - 2, 3, PALETTE.Q);
	rect(1, h - 4, w - 2, 1, PALETTE.q);

	const bust = fromGrid(STATUE_BUST);
	ctx.drawImage(bust, Math.floor((w - bust.width) / 2), top - bust.height + 1);
	return c;
}

// ---------------------------------------------------------------- atlas

export function loadSprites() {
	return {
		grass: [0, 1, 2, 3].map((s) => grassTile(100 + s, false)),
		flowers: [0, 1].map((s) => grassTile(200 + s, true)),
		path: [0, 1, 2].map((s) => pathTile(300 + s)),
		water: [0, 1, 2].map(waterTile),
		tree: fromGrid(TREE),
		sign: fromGrid(SIGN),
		statue: statue(),
		player: playerFrames(),
	};
}

export type Sprites = ReturnType<typeof loadSprites>;
