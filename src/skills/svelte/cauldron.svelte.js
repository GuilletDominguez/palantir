// Estado reactivo fuera de los componentes: en Svelte 5 las runas también
// funcionan en módulos .svelte.js, y una clase es la forma idiomática de
// agrupar estado ($state), valores derivados ($derived) y métodos.

import { uid } from '../../lib/id';
import { game } from '../../state/actions';
import { INGREDIENTS, ITEMS_BY_ID, findRecipe } from '../../state/catalog';
import { STAT_LABELS } from './ingredients';

export const MAX_INGREDIENTS = 4;
export const MAX_STAT = MAX_INGREDIENTS * 3;

const emptyStats = () => ({ vida: 0, mana: 0, fuerza: 0, velocidad: 0 });
const INGREDIENTS_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

// El caldero es estado local del laboratorio: los ingredientes solo se
// descuentan del inventario compartido al preparar la poción.
export class Cauldron {
	contents = $state([]);
	/** Nombre del lote; si está vacío se usa el de la receta o el generado. */
	customName = $state('');

	/** Mezcla actual como ingrediente → cantidad, el formato de las recetas. */
	mix = $derived.by(() => {
		const mix = {};
		for (const { ingredient } of this.contents) mix[ingredient.id] = (mix[ingredient.id] ?? 0) + 1;
		return mix;
	});

	recipe = $derived(findRecipe(this.mix));

	stats = $derived.by(() => {
		const total = emptyStats();
		for (const { ingredient } of this.contents) for (const [k, v] of Object.entries(ingredient.effects)) total[k] += v;
		return total;
	});

	total = $derived(Object.values(this.stats).reduce((a, b) => a + b, 0));
	color = $derived(mixColors(this.contents.map((s) => s.ingredient.color)));
	rarity = $derived(this.total >= 9 ? 'legendaria' : this.total >= 5 ? 'rara' : 'común');
	autoName = $derived(this.recipe ? ITEMS_BY_ID.get(this.recipe.output).name : potionName(this.stats, this.total));
	name = $derived(this.customName.trim() || this.autoName);
	isFull = $derived(this.contents.length >= MAX_INGREDIENTS);
	isEmpty = $derived(this.contents.length === 0);
	/** Motivo por el que no se puede preparar, o null si se puede. */
	blocked = $derived(
		this.isEmpty
			? 'Añade ingredientes al caldero.'
			: this.recipe
				? null
				: 'Esta mezcla no corresponde a ninguna receta.',
	);

	countOf(id) {
		return this.mix[id] ?? 0;
	}

	add(ingredient) {
		if (this.isFull) return;
		// Reactividad profunda: push sobre un array $state actualiza la vista
		this.contents.push({ uid: uid(), ingredient });
	}

	remove(slotId) {
		this.contents = this.contents.filter((s) => s.uid !== slotId);
	}

	/** Sustituye el contenido por los ingredientes de una receta. */
	load(recipe) {
		this.contents = Object.entries(recipe.inputs).flatMap(([id, qty]) =>
			Array.from({ length: qty }, () => ({ uid: uid(), ingredient: INGREDIENTS_BY_ID.get(id) })),
		);
	}

	brew() {
		if (this.blocked || !this.recipe) return { ok: false, reason: this.blocked ?? '' };
		const result = game.brew(this.recipe.id);
		if (result.ok) {
			this.contents = [];
			this.customName = '';
		}
		return result;
	}
}

function mixColors(colors) {
	if (!colors.length) return '#41a6f6';
	const sum = [0, 0, 0];
	for (const c of colors) for (let i = 0; i < 3; i++) sum[i] += parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
	return (
		'#' +
		sum
			.map((v) =>
				Math.round(v / colors.length)
					.toString(16)
					.padStart(2, '0'),
			)
			.join('')
	);
}

function potionName(stats, total) {
	if (total === 0) return 'Agua del pozo';
	// Sin receta: nombres de "mezcla" distintos a los de las pociones del catálogo
	if (Object.values(stats).every((v) => v > 0)) return 'Brebaje del Equilibrio';
	const [best] = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
	const grade = total >= 9 ? 'suprema' : total >= 5 ? 'mayor' : 'menor';
	return `Mezcla ${grade} de ${STAT_LABELS[best]}`;
}
