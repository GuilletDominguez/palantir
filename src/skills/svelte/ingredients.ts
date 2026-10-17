export type StatKey = 'vida' | 'mana' | 'fuerza' | 'velocidad';
export type Stats = Record<StatKey, number>;

export interface Ingredient {
	id: string;
	name: string;
	color: string;
	effects: Partial<Stats>;
	/** Sprite 8×8 con las letras de la paleta del juego. */
	sprite: string[];
}

export const STAT_LABELS: Record<StatKey, string> = {
	vida: 'Vida',
	mana: 'Maná',
	fuerza: 'Fuerza',
	velocidad: 'Velocidad',
};

export const INGREDIENTS: Ingredient[] = [
	{
		id: 'mushroom',
		name: 'Seta roja',
		color: '#b13e53',
		effects: { vida: 3, fuerza: 1 },
		sprite: ['..rrrr..', '.rwrrwr.', 'rrrrrrrr', 'rwrrrrwr', '..wwww..', '..wqww..', '..wwqw..', '...ww...'],
	},
	{
		id: 'herb',
		name: 'Hierba lunar',
		color: '#38b764',
		effects: { vida: 2, mana: 1 },
		sprite: ['......g.', '....ggl.', '...gglg.', '..gglgg.', '.gglgg..', '.glgg...', '.dg.....', 'd.......'],
	},
	{
		id: 'crystal',
		name: 'Cristal azur',
		color: '#41a6f6',
		effects: { mana: 3 },
		sprite: ['...cc...', '..cwcc..', '.cwcccu.', '.ccccuu.', '.cccuuu.', '..ccuu..', '...cu...', '........'],
	},
	{
		id: 'feather',
		name: 'Pluma de grifo',
		color: '#f4f4f4',
		effects: { velocidad: 3 },
		sprite: ['.....ww.', '....wwq.', '...wwq..', '..wwq...', '.wwq....', '.wq.....', 'k.......', '........'],
	},
	{
		id: 'fireflower',
		name: 'Flor de fuego',
		color: '#ef7d57',
		effects: { fuerza: 3, velocidad: 1 },
		sprite: ['...yy...', '..yOOy..', '.yOrrOy.', '.yOrrOy.', '..yOOy..', '...gg...', '..g.g...', '...g....'],
	},
	{
		id: 'slime',
		name: 'Baba de slime',
		color: '#a7f070',
		effects: { vida: 1, mana: 1, velocidad: 1 },
		sprite: ['........', '...ll...', '..llll..', '.lwllll.', '.llolol.', 'llllllll', '.llllll.', '........'],
	},
];
