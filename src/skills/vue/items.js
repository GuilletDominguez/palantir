import { INGREDIENTS } from '../../state/catalog';

// Los ingredientes vienen del catálogo compartido; la categoría solo le
// importa a la tienda (para las pestañas), así que se añade aquí.

export const CATEGORIES = {
	plantas: 'Plantas',
	minerales: 'Minerales',
	criaturas: 'Criaturas',
};

const CATEGORY_OF = {
	mushroom: 'plantas',
	herb: 'plantas',
	fireflower: 'plantas',
	crystal: 'minerales',
	feather: 'criaturas',
	slime: 'criaturas',
};

export const ITEMS = INGREDIENTS.map((i) => ({ ...i, category: CATEGORY_OF[i.id] ?? 'plantas' }));

export const ITEMS_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
