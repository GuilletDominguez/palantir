// Datos estáticos del juego. Los ingredientes son los que ya tenía el
// laboratorio de Svelte; las misiones reutilizan las del tablón de React.

export const STARTING_GOLD = 20;

/** XP mínima para cada nivel: el índice + 1 es el nivel. */
export const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500];

export function levelFor(xp) {
	let level = 0;
	while (level < LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS[level]) level++;
	return level;
}

/** XP necesaria para el siguiente nivel, o null si ya es el máximo. */
export function nextLevelXp(xp) {
	return LEVEL_THRESHOLDS[levelFor(xp)] ?? null;
}

export const sellPrice = (item) => Math.floor(item.price / 2);

export const INGREDIENTS = [
	{
		id: 'mushroom',
		kind: 'ingredient',
		name: 'Seta roja',
		price: 4,
		color: '#b13e53',
		effects: { vida: 3, fuerza: 1 },
		sprite: ['..rrrr..', '.rwrrwr.', 'rrrrrrrr', 'rwrrrrwr', '..wwww..', '..wqww..', '..wwqw..', '...ww...'],
	},
	{
		id: 'herb',
		kind: 'ingredient',
		name: 'Hierba lunar',
		price: 3,
		color: '#38b764',
		effects: { vida: 2, mana: 1 },
		sprite: ['......g.', '....ggl.', '...gglg.', '..gglgg.', '.gglgg..', '.glgg...', '.dg.....', 'd.......'],
	},
	{
		id: 'crystal',
		kind: 'ingredient',
		name: 'Cristal azur',
		price: 6,
		color: '#41a6f6',
		effects: { mana: 3 },
		sprite: ['...cc...', '..cwcc..', '.cwcccu.', '.ccccuu.', '.cccuuu.', '..ccuu..', '...cu...', '........'],
	},
	{
		id: 'feather',
		kind: 'ingredient',
		name: 'Pluma de grifo',
		price: 5,
		color: '#f4f4f4',
		effects: { velocidad: 3 },
		sprite: ['.....ww.', '....wwq.', '...wwq..', '..wwq...', '.wwq....', '.wq.....', 'k.......', '........'],
	},
	{
		id: 'fireflower',
		kind: 'ingredient',
		name: 'Flor de fuego',
		price: 6,
		color: '#ef7d57',
		effects: { fuerza: 3, velocidad: 1 },
		sprite: ['...yy...', '..yOOy..', '.yOrrOy.', '.yOrrOy.', '..yOOy..', '...gg...', '..g.g...', '...g....'],
	},
	{
		id: 'slime',
		kind: 'ingredient',
		name: 'Baba de slime',
		price: 2,
		color: '#a7f070',
		effects: { vida: 1, mana: 1, velocidad: 1 },
		sprite: ['........', '...ll...', '..llll..', '.lwllll.', '.llolol.', 'llllllll', '.llllll.', '........'],
	},
];

/** Frasco 8×8 relleno con la letra de paleta indicada. */
const flask = (c) => [
	'...oo...',
	'...qq...',
	'..oqqo..',
	`.o${c}${c}${c}${c}o.`,
	`o${c}${c}w${c}${c}${c}o`,
	`o${c.repeat(6)}o`,
	`o${c.repeat(6)}o`,
	'.oooooo.',
];

// El precio de una poción es el doble de lo que cuestan sus ingredientes:
// venderla devuelve exactamente lo invertido, así que no hay oro infinito.
export const POTIONS = [
	{ id: 'potion-life', kind: 'potion', name: 'Poción de Vida', price: 14, color: '#b13e53', sprite: flask('r') },
	{ id: 'potion-mana', kind: 'potion', name: 'Poción de Maná', price: 18, color: '#41a6f6', sprite: flask('u') },
	{ id: 'potion-strength', kind: 'potion', name: 'Poción de Fuerza', price: 20, color: '#ef7d57', sprite: flask('O') },
	{ id: 'potion-speed', kind: 'potion', name: 'Poción de Velocidad', price: 14, color: '#73eff7', sprite: flask('c') },
	{ id: 'elixir', kind: 'potion', name: 'Elixir del Equilibrio', price: 30, color: '#ffcd75', sprite: flask('y') },
];

export const RECIPES = [
	{ id: 'life', inputs: { mushroom: 1, herb: 1 }, output: 'potion-life' },
	{ id: 'mana', inputs: { crystal: 1, herb: 1 }, output: 'potion-mana' },
	{ id: 'strength', inputs: { fireflower: 1, mushroom: 1 }, output: 'potion-strength' },
	{ id: 'speed', inputs: { feather: 1, slime: 1 }, output: 'potion-speed' },
	{ id: 'elixir', inputs: { mushroom: 1, crystal: 1, feather: 1 }, output: 'elixir' },
];

export const QUESTS = [
	{
		id: 'bridge',
		title: 'Reparar el puente del río',
		difficulty: 'fácil',
		requires: { 'potion-life': 1 },
		reward: { gold: 15, xp: 30 },
	},
	{
		id: 'merchant',
		title: 'Escoltar al mercader hasta el puerto',
		difficulty: 'fácil',
		requires: { 'potion-speed': 1 },
		reward: { gold: 15, xp: 30 },
	},
	{
		id: 'tower',
		title: 'Ayudar al mago de la torre',
		difficulty: 'media',
		requires: { 'potion-mana': 2 },
		reward: { gold: 30, xp: 50 },
		minLevel: 2,
	},
	{
		id: 'crypt',
		title: 'Recuperar el amuleto de la cripta',
		difficulty: 'media',
		requires: { 'potion-strength': 2 },
		reward: { gold: 40, xp: 70 },
		minLevel: 2,
	},
	{
		id: 'portal',
		title: 'Sellar el portal del bosque',
		difficulty: 'difícil',
		requires: { elixir: 1, 'potion-mana': 1 },
		reward: { gold: 60, xp: 120 },
		minLevel: 3,
	},
];

/** Misiones publicadas por el usuario: la dificultad fija lo que piden y lo que dan. */
export const CUSTOM_QUEST_RULES = {
	fácil: { potions: 1, gold: 10, xp: 20 },
	media: { potions: 2, gold: 25, xp: 40 },
	difícil: { potions: 3, gold: 50, xp: 70 },
};

export const ITEMS = [...INGREDIENTS, ...POTIONS];
export const ITEMS_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
export const RECIPES_BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

/** Receta cuyos ingredientes coinciden exactamente con la mezcla, si existe. */
export function findRecipe(mix) {
	const mixKeys = Object.keys(mix).filter((k) => mix[k] > 0);
	return RECIPES.find((r) => {
		const keys = Object.keys(r.inputs);
		return keys.length === mixKeys.length && keys.every((k) => mix[k] === r.inputs[k]);
	});
}
