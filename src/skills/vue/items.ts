export type Category = 'armas' | 'defensa' | 'consumibles' | 'tesoros';

export interface Item {
	id: string;
	name: string;
	price: number;
	category: Category;
	/** Sprite 8×8 con las letras de la paleta del juego. */
	sprite: string[];
}

export const CATEGORIES: Record<Category, string> = {
	armas: 'Armas',
	defensa: 'Defensa',
	consumibles: 'Consumibles',
	tesoros: 'Tesoros',
};

const SWORD = ['......wo', '.....wqo', '....wqo.', '.k.wqo..', '..kqo...', '..kk....', '.k..k...', 'k.......'];
const SHIELD = ['.oooooo.', 'obbbybbo', 'obbbybbo', 'oyyyyyyo', '.obbybo.', '.obbybo.', '..obbo..', '...oo...'];
const HELMET = ['..qqqq..', '.qwqqqq.', 'qwqqqqqq', 'qqqqqqqq', 'qooqqooq', 'qqqqqqqq', 'qq....qq', 'qq....qq'];
const POTION = ['...oo...', '...qq...', '..oqqo..', '.orrrro.', 'orrwrrro', 'orrrrrro', 'orrrrrro', '.oooooo.'];
const APPLE = ['....kgg.', '...k....', '.rrrrrr.', 'rrwrrrrr', 'rwrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rr.rr.'];
const KEY = ['........', '.yyy....', 'y...y...', 'y...yyyy', 'y...y.y.', '.yyy..yy', '........', '........'];
const GEM = ['..oooo..', '.owccco.', 'owccccco', 'occcccuo', '.occcuo.', '..ocuo..', '...oo...', '........'];

export const ITEMS: Item[] = [
	{ id: 'wood-sword', name: 'Espada de madera', price: 10, category: 'armas', sprite: SWORD },
	{ id: 'iron-sword', name: 'Espada de hierro', price: 35, category: 'armas', sprite: SWORD },
	{ id: 'shield', name: 'Escudo real', price: 25, category: 'defensa', sprite: SHIELD },
	{ id: 'helmet', name: 'Casco de acero', price: 20, category: 'defensa', sprite: HELMET },
	{ id: 'potion', name: 'Poción de vida', price: 8, category: 'consumibles', sprite: POTION },
	{ id: 'apple', name: 'Manzana', price: 3, category: 'consumibles', sprite: APPLE },
	{ id: 'key', name: 'Llave dorada', price: 15, category: 'tesoros', sprite: KEY },
	{ id: 'gem', name: 'Gema de cristal', price: 50, category: 'tesoros', sprite: GEM },
];

export const ITEMS_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
