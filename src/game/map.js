import { BUILDING_H, BUILDING_W, places } from '../skills/registry';
import { rng } from './sprites';

// Nueve tiles por columna de edificios: la última (x = 42) es la de Proyectos
export const MAP_W = 51;
export const MAP_H = 30;

export const Ground = { Grass: 0, Flowers: 1, Path: 2, Water: 3 };

const ROAD_NORTH = 13;
const ROAD_SOUTH = 25;
const ROAD_X = 20;
const POND = { x: 17, y: 3, w: 8, h: 3 };
const PLAZA = { x: ROAD_X - 2, y: 16, w: 6, h: 6 };
const STATUE = { x: ROAD_X, y: 18, w: 2, h: 3 };

export function buildMap() {
	const rand = rng(42);
	const ground = Array.from({ length: MAP_H }, () =>
		Array.from({ length: MAP_W }, () => (rand() < 0.08 ? Ground.Flowers : Ground.Grass)),
	);
	const solid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
	const reserved = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));

	const fill = (r, g) => {
		for (let y = r.y; y < r.y + r.h; y++)
			for (let x = r.x; x < r.x + r.w; x++) {
				ground[y][x] = g;
				reserved[y][x] = true;
			}
	};
	const block = (r) => {
		for (let y = r.y; y < r.y + r.h; y++)
			for (let x = r.x; x < r.x + r.w; x++) {
				solid[y][x] = true;
				reserved[y][x] = true;
			}
	};

	// Caminos principales
	fill({ x: 2, y: ROAD_NORTH, w: MAP_W - 4, h: 2 }, Ground.Path);
	fill({ x: 2, y: ROAD_SOUTH, w: MAP_W - 4, h: 2 }, Ground.Path);
	fill({ x: ROAD_X, y: ROAD_NORTH, w: 2, h: ROAD_SOUTH - ROAD_NORTH }, Ground.Path);
	// Plaza central con la estatua "Sobre mí"
	fill(PLAZA, Ground.Path);
	block(STATUE);

	// Estanque
	fill(POND, Ground.Water);
	block(POND);

	const buildings = [];
	const signs = [];
	const interactables = [];

	for (const place of places) {
		const rect = { x: place.tile.x, y: place.tile.y, w: BUILDING_W, h: BUILDING_H };
		block(rect);
		buildings.push({ id: place.id, rect });

		const doorX = rect.x + 2;
		const below = rect.y + rect.h;
		const road = below <= ROAD_NORTH ? ROAD_NORTH : ROAD_SOUTH;
		fill({ x: doorX, y: below, w: 2, h: road - below }, Ground.Path);

		const sign = { x: rect.x + 4, y: below };
		signs.push(sign);
		block({ ...sign, w: 1, h: 1 });

		interactables.push({
			id: place.id,
			label: place.name,
			zone: { x: doorX - 1, y: below, w: 5, h: 2 },
		});
	}

	interactables.push({
		id: 'about',
		label: 'Sobre mí',
		zone: { x: STATUE.x - 1, y: STATUE.y - 1, w: STATUE.w + 2, h: STATUE.h + 2 },
	});

	// Cartel de bienvenida en la plaza
	const welcome = { x: PLAZA.x + PLAZA.w - 1, y: PLAZA.y };
	signs.push(welcome);
	block({ ...welcome, w: 1, h: 1 });
	interactables.push({
		id: 'welcome',
		label: 'Bienvenida',
		zone: { x: welcome.x - 1, y: welcome.y - 1, w: 3, h: 3 },
	});

	// Árboles: borde de dos tiles y algunos sueltos donde no estorben
	const trees = [];
	for (let y = 0; y < MAP_H; y++)
		for (let x = 0; x < MAP_W; x++) {
			const border = x < 2 || y < 2 || x >= MAP_W - 2 || y >= MAP_H - 2;
			const scatter = !reserved[y][x] && !nearReserved(reserved, x, y) && rand() < 0.1;
			if (border || scatter) {
				trees.push({ x, y });
				solid[y][x] = true;
				ground[y][x] = Ground.Grass;
			}
		}

	return {
		ground,
		trees,
		signs,
		buildings,
		statue: STATUE,
		solid,
		interactables,
		// Justo encima de la estatua, mirándola
		spawn: { x: (ROAD_X + 1) * 16, y: (STATUE.y - 2) * 16 + 8 },
	};
}

function nearReserved(reserved, x, y) {
	for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (reserved[y + dy]?.[x + dx]) return true;
	return false;
}
