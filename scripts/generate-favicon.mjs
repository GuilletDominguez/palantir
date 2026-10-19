// Genera el icono de la web: "</>" en pixel art con la paleta del juego.
// Uso: npm run favicon
// Salida en public/: favicon.svg (escala sin perder nitidez), favicon.ico
// (32 px, en formato PNG, que los navegadores aceptan), favicon.png (64 px)
// y apple-touch-icon.png (180 px, con fondo opaco porque iOS no admite transparencia).

import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const PALETTE = { o: '#1a1c2c', B: '#333c57', y: '#ffcd75', g: '#38b764' };
const SIZE = 16;

// Fondo: un cuadrado con las esquinas recortadas y contorno
const grid = Array.from({ length: SIZE }, (_, y) =>
	Array.from({ length: SIZE }, (_, x) => {
		if (y === 0 || y === 15 || x === 0 || x === 15) return '.';
		if (y === 1 || y === 14) return x >= 2 && x <= 13 ? 'o' : '.';
		if (x === 1 || x === 14) return 'o';
		return 'B';
	}),
);

const paint = (color, points) => points.forEach(([x, y]) => (grid[y][x] = color));
// Cada símbolo deja al menos un píxel de fondo con el borde y con los demás,
// para que se lean como tres trazos separados incluso a 16 px.
// "<"
paint('y', [[5, 5], [4, 6], [3, 7], [4, 8], [5, 9]]);
// ">"
paint('y', [[10, 5], [11, 6], [12, 7], [11, 8], [10, 9]]);
// "/"
paint('g', [[9, 4], [8, 5], [8, 6], [7, 7], [7, 8], [7, 9], [6, 10]]);

// SVG: un <rect> por tramo de píxeles iguales de cada fila
const rects = [];
grid.forEach((row, y) => {
	for (let x = 0; x < SIZE; ) {
		const key = row[x];
		let w = 1;
		while (row[x + w] === key) w++;
		if (PALETTE[key]) rects.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${PALETTE[key]}"/>`);
		x += w;
	}
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">${rects.join('')}</svg>\n`;
writeFileSync('public/favicon.svg', svg);

// PNG: se rasteriza a 16 px y se amplía con "nearest" para que los píxeles sigan siendo cuadrados
const base = await sharp(Buffer.from(svg), { density: 72 }).resize(SIZE, SIZE).png().toBuffer();
const scaled = (size) => sharp(base).resize(size, size, { kernel: 'nearest' });

await scaled(32).png().toFile('public/favicon.ico');
await scaled(64).png().toFile('public/favicon.png');
await sharp({ create: { width: 180, height: 180, channels: 4, background: PALETTE.o } })
	.composite([{ input: await scaled(160).png().toBuffer(), left: 10, top: 10 }])
	.png()
	.toFile('public/apple-touch-icon.png');

console.log(grid.map((r) => r.join('')).join('\n'));
