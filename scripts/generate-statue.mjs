// Convierte la foto en el busto de la estatua de la plaza:
// src/game/statue.ts → cuadrícula de texto en tonos de piedra (mismo formato que sprites.ts)
//
// Uso: node scripts/generate-statue.mjs [ruta-foto]

import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = process.argv[2] ?? 'src/assets/foto.jpg';

// Recortes en px de la foto original (288×288)
const BUST_CROP = { left: 60, top: 2, width: 168, height: 196 };
const BUST_SIZE = { width: 24, height: 28 };

async function raw(input) {
	const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
	return { data, width: info.width, height: info.height, channels: info.channels };
}

/**
 * Máscara de la persona a resolución completa: flood fill desde los bordes
 * por los píxeles claros y poco saturados (el fondo gris de la foto).
 * Devuelve la foto como RGBA con el fondo transparente.
 */
async function cutout() {
	const img = await raw(sharp(SRC).removeAlpha());
	const { width: W, height: H, data } = img;
	const isBg = (i) => {
		const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		return max > 195 && (max - min) / max < 0.145;
	};
	const bg = new Uint8Array(W * H);
	const stack = [];
	// Sin semillas en el borde inferior: ahí la camisa toca el borde de la foto
	for (let x = 0; x < W; x++) stack.push(x);
	for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
	while (stack.length) {
		const i = stack.pop();
		if (bg[i] || !isBg(i)) continue;
		bg[i] = 1;
		const x = i % W;
		if (x > 0) stack.push(i - 1);
		if (x < W - 1) stack.push(i + 1);
		if (i >= W) stack.push(i - W);
		if (i < W * (H - 1)) stack.push(i + W);
	}
	const rgba = Buffer.alloc(W * H * 4);
	for (let i = 0; i < W * H; i++) {
		rgba[i * 4] = data[i * 3];
		rgba[i * 4 + 1] = data[i * 3 + 1];
		rgba[i * 4 + 2] = data[i * 3 + 2];
		rgba[i * 4 + 3] = bg[i] ? 0 : 255;
	}
	return sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

// ------------------------------------------------------------- estatua

async function statue(person) {
	const img = await raw(
		sharp(person).extract(BUST_CROP).resize(BUST_SIZE.width, BUST_SIZE.height, { kernel: 'lanczos3' }),
	);
	const { width: W, height: H, data } = img;
	const opaque = (i) => data[i * 4 + 3] > 140;
	const lum = (i) => 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];

	// Contraste normalizado sobre la silueta y reparto en 4 tonos de piedra
	const vals = [];
	for (let i = 0; i < W * H; i++) if (opaque(i)) vals.push(lum(i));
	vals.sort((a, b) => a - b);
	const lo = vals[Math.floor(vals.length * 0.04)];
	const hi = vals[Math.floor(vals.length * 0.96)];
	const tones = ['B', 'Q', 'q', 'w'];

	const grid = Array.from({ length: H }, (_, y) =>
		Array.from({ length: W }, (_, x) => {
			const i = y * W + x;
			if (!opaque(i)) return '.';
			const t = Math.min(0.999, Math.max(0, (lum(i) - lo) / (hi - lo)));
			return tones[Math.floor(Math.pow(t, 0.85) * tones.length)];
		}),
	);

	// Contorno de 1 px alrededor de la silueta (con margen para que quepa)
	const out = Array.from({ length: H + 1 }, (_, y) =>
		Array.from({ length: W + 2 }, (_, x) => grid[y - 1]?.[x - 1] ?? '.'),
	);
	const filled = (x, y) => !['.', 'o', undefined].includes(out[y]?.[x]);
	for (let y = 0; y < out.length; y++)
		for (let x = 0; x < out[0].length; x++)
			if (out[y][x] === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)))
				out[y][x] = 'o';

	const rows = out.map((r) => r.join(''));
	await writeFile(
		'src/game/statue.ts',
		`// Generado por scripts/generate-statue.mjs: no editar a mano.
// Busto de la estatua de la plaza, en tonos de piedra de la paleta.
export const STATUE_BUST = [
${rows.map((r) => `\t'${r}',`).join('\n')}
];
`,
	);
	console.log(rows.join('\n'));
}

const person = await cutout();
await statue(person);
console.log('\n✓ src/game/statue.ts generado');
