import { $outfit } from '../stores/outfit';
import { $activePanel } from '../stores/ui';
import { HAT_ROOM } from './outfit';
import { places } from '../skills/registry';
import { Input } from './input';
import { buildMap, Ground, MAP_H, MAP_W } from './map';
import { building, loadSprites, PALETTE, playerFrames, TILE } from './sprites';

const SPEED = 72; // px nativos por segundo
const FONT = '"Press Start 2P"';

export async function startGame({ canvas, touch, prompt }) {
	await document.fonts.load(`8px ${FONT}`).catch(() => {});

	const sprites = loadSprites();
	const map = buildMap();
	const input = new Input(touch);
	const buildingSprites = new Map(
		places.map((p) => [p.id, building(p.id, map.buildings[0].rect.w, map.buildings[0].rect.h, p.roof)]),
	);
	const ground = renderGround(map.ground, sprites);
	const waterTiles = [];
	map.ground.forEach((row, y) => row.forEach((g, x) => g === Ground.Water && waterTiles.push([x, y])));

	const player = {
		x: map.spawn.x,
		y: map.spawn.y,
		facing: 'down',
		walkTime: 0,
		moving: false,
	};

	// Buffer a resolución nativa; luego se escala por un entero al canvas visible.
	const buffer = document.createElement('canvas');
	const bctx = buffer.getContext('2d');
	const ctx = canvas.getContext('2d');
	let scale = 2;

	const resize = () => {
		const dpr = window.devicePixelRatio || 1;
		const w = Math.round(canvas.clientWidth * dpr);
		const h = Math.round(canvas.clientHeight * dpr);
		canvas.width = w;
		canvas.height = h;
		// ~20×13 tiles visibles, pero sin que el mapa quede más pequeño que la pantalla
		scale = Math.max(
			2,
			Math.floor(Math.min(w / 320, h / 208)),
			Math.ceil(w / (MAP_W * TILE)),
			Math.ceil(h / (MAP_H * TILE)),
		);
		buffer.width = Math.ceil(w / scale);
		buffer.height = Math.ceil(h / scale);
		ctx.imageSmoothingEnabled = false;
		bctx.imageSmoothingEnabled = false;
	};
	new ResizeObserver(resize).observe(canvas);
	resize();

	// El héroe se viste con lo que se elija en la sastrería
	$outfit.subscribe((outfit) => (sprites.player = playerFrames(outfit)));

	$activePanel.subscribe((panel) => {
		input.enabled = panel === null;
		input.reset();
	});

	let current = null;
	let last = performance.now();

	const frame = (now) => {
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		update(dt);
		render(now);
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);

	// ------------------------------------------------------------ lógica

	function update(dt) {
		const dir = input.enabled ? input.direction : null;
		player.moving = dir !== null;
		if (dir) {
			player.facing = dir;
			player.walkTime += dt;
			const [vx, vy] = VECTORS[dir];
			move(vx * SPEED * dt, 0);
			move(0, vy * SPEED * dt);
		} else {
			player.walkTime = 0;
		}

		const tx = player.x / TILE;
		const ty = (player.y - 2) / TILE;
		const found =
			map.interactables.find(({ zone: z }) => tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h) ?? null;
		if (found !== current) {
			current = found;
			prompt.hidden = !found;
			if (found) prompt.querySelector('[data-label]').textContent = found.label;
		}

		if (input.consumeAction() && current) $activePanel.set(current.id);
	}

	function move(dx, dy) {
		const nx = player.x + dx;
		const ny = player.y + dy;
		if (!collides(nx, ny)) {
			player.x = nx;
			player.y = ny;
		}
	}

	function collides(x, y) {
		// Caja de colisión en los pies del personaje.
		const left = x - 5;
		const right = x + 5;
		const top = y - 5;
		const bottom = y;
		if (left < 0 || top < 0 || right >= MAP_W * TILE || bottom >= MAP_H * TILE) return true;
		for (let ty = Math.floor(top / TILE); ty <= Math.floor(bottom / TILE); ty++)
			for (let tx = Math.floor(left / TILE); tx <= Math.floor(right / TILE); tx++) if (map.solid[ty][tx]) return true;
		return false;
	}

	// ------------------------------------------------------------ render

	function render(now) {
		const vw = buffer.width;
		const vh = buffer.height;
		const camX = clampCam(Math.round(player.x - vw / 2), MAP_W * TILE, vw);
		const camY = clampCam(Math.round(player.y - 8 - vh / 2), MAP_H * TILE, vh);

		bctx.fillStyle = PALETTE.d;
		bctx.fillRect(0, 0, vw, vh);
		bctx.save();
		bctx.translate(-camX, -camY);
		bctx.drawImage(ground, 0, 0);

		const water = sprites.water[Math.floor(now / 400) % sprites.water.length];
		for (const [x, y] of waterTiles) bctx.drawImage(water, x * TILE, y * TILE);

		const inView = (x, y, w, h) => x + w > camX && x < camX + vw && y + h > camY && y < camY + vh;

		const drawables = [];
		for (const t of map.trees) {
			const x = t.x * TILE;
			const y = t.y * TILE;
			if (inView(x, y, TILE, TILE)) drawables.push({ bottom: y + TILE, draw: (c) => c.drawImage(sprites.tree, x, y) });
		}
		for (const s of map.signs) {
			const x = s.x * TILE;
			const y = s.y * TILE;
			if (inView(x, y, TILE, TILE)) drawables.push({ bottom: y + 12, draw: (c) => c.drawImage(sprites.sign, x, y) });
		}
		for (const b of map.buildings) {
			const x = b.rect.x * TILE;
			const y = b.rect.y * TILE;
			const w = b.rect.w * TILE;
			const h = b.rect.h * TILE;
			if (inView(x, y - 12, w, h + 12))
				drawables.push({
					bottom: y + h,
					draw: (c) => {
						c.drawImage(buildingSprites.get(b.id), x, y);
						const place = places.find((p) => p.id === b.id);
						label(c, place.name, x + w / 2, y - 2);
					},
				});
		}
		{
			const s = sprites.statue;
			const x = map.statue.x * TILE;
			const bottom = (map.statue.y + map.statue.h) * TILE;
			if (inView(x, bottom - s.height, s.width, s.height))
				drawables.push({ bottom, draw: (c) => c.drawImage(s, x, bottom - s.height) });
		}
		drawables.push({ bottom: player.y, draw: drawPlayer });

		drawables.sort((a, b) => a.bottom - b.bottom).forEach((d) => d.draw(bctx));

		if (current) {
			const bob = Math.round(Math.sin(now / 180) * 1.5);
			drawBubble(bctx, Math.round(player.x), Math.round(player.y) - 22 + bob);
		}

		bctx.restore();
		ctx.drawImage(buffer, 0, 0, vw * scale, vh * scale);
	}

	function drawPlayer(c) {
		const frames = sprites.player[player.facing];
		const step = player.moving ? 1 + (Math.floor(player.walkTime * 8) % 2) : 0;
		const x = Math.round(player.x) - 8;
		const y = Math.round(player.y) - 16;
		c.fillStyle = 'rgba(26, 28, 44, 0.35)';
		c.fillRect(x + 4, y + 15, 8, 2);
		c.fillRect(x + 3, y + 16, 10, 1);
		// Los fotogramas tienen HAT_ROOM filas extra arriba para el sombrero
		c.drawImage(frames[step], x, y - HAT_ROOM - (step ? 1 : 0));
	}
}

const VECTORS = {
	up: [0, -1],
	down: [0, 1],
	left: [-1, 0],
	right: [1, 0],
};

function clampCam(pos, world, view) {
	if (world <= view) return Math.round((world - view) / 2);
	return Math.max(0, Math.min(pos, world - view));
}

function label(c, text, cx, bottom) {
	c.font = `8px ${FONT}`;
	c.textAlign = 'center';
	c.textBaseline = 'bottom';
	const w = Math.ceil(c.measureText(text).width) + 6;
	const x = Math.round(cx - w / 2);
	c.fillStyle = PALETTE.o;
	c.fillRect(x, bottom - 11, w, 11);
	c.fillStyle = PALETTE.w;
	c.fillText(text, Math.round(cx), bottom - 1);
}

function drawBubble(c, cx, bottom) {
	const x = cx - 6;
	const y = bottom - 12;
	c.fillStyle = PALETTE.o;
	c.fillRect(x, y, 13, 11);
	c.fillRect(cx - 1, bottom - 1, 3, 2);
	c.fillStyle = PALETTE.w;
	c.fillRect(x + 1, y + 1, 11, 9);
	c.fillStyle = PALETTE.r;
	c.font = `8px ${FONT}`;
	c.textAlign = 'center';
	c.textBaseline = 'top';
	c.fillText('A', cx + 1, y + 2);
}

function renderGround(ground, sprites) {
	const c = document.createElement('canvas');
	c.width = MAP_W * TILE;
	c.height = MAP_H * TILE;
	const ctx = c.getContext('2d');
	const isPath = (x, y) => ground[y]?.[x] === Ground.Path;

	ground.forEach((row, y) =>
		row.forEach((g, x) => {
			const variant = (x * 7 + y * 13) % 4;
			const px = x * TILE;
			const py = y * TILE;
			if (g === Ground.Path) {
				ctx.drawImage(sprites.path[variant % sprites.path.length], px, py);
				// Bordes del camino para que no parezca un recorte plano
				ctx.fillStyle = PALETTE.k;
				ctx.globalAlpha = 0.45;
				if (!isPath(x, y - 1)) ctx.fillRect(px, py, TILE, 1);
				if (!isPath(x, y + 1)) ctx.fillRect(px, py + TILE - 1, TILE, 1);
				if (!isPath(x - 1, y)) ctx.fillRect(px, py, 1, TILE);
				if (!isPath(x + 1, y)) ctx.fillRect(px + TILE - 1, py, 1, TILE);
				ctx.globalAlpha = 1;
			} else if (g === Ground.Flowers) {
				ctx.drawImage(sprites.flowers[variant % sprites.flowers.length], px, py);
			} else {
				ctx.drawImage(sprites.grass[variant], px, py);
			}
		}),
	);
	return c;
}
