// Estado reactivo fuera de los componentes: en Svelte 5 las runas también
// funcionan en módulos .svelte.ts, y una clase es la forma idiomática de
// agrupar estado ($state), valores derivados ($derived) y métodos.

import { STAT_LABELS, type Ingredient, type StatKey, type Stats } from './ingredients';

export const MAX_INGREDIENTS = 4;
export const MAX_STAT = MAX_INGREDIENTS * 3;

export type Rarity = 'común' | 'rara' | 'legendaria';

export interface Potion {
	id: string;
	name: string;
	color: string;
	rarity: Rarity;
	stats: Stats;
}

interface Slot {
	uid: string;
	ingredient: Ingredient;
}

const emptyStats = (): Stats => ({ vida: 0, mana: 0, fuerza: 0, velocidad: 0 });

export class Cauldron {
	contents = $state<Slot[]>([]);
	/** Nombre personalizado; si está vacío se usa el generado. */
	customName = $state('');
	book = $state<Potion[]>([]);

	stats = $derived.by(() => {
		const total = emptyStats();
		for (const { ingredient } of this.contents)
			for (const [k, v] of Object.entries(ingredient.effects)) total[k as StatKey] += v;
		return total;
	});

	total = $derived(Object.values(this.stats).reduce((a, b) => a + b, 0));
	color = $derived(mixColors(this.contents.map((s) => s.ingredient.color)));
	rarity = $derived<Rarity>(this.total >= 9 ? 'legendaria' : this.total >= 5 ? 'rara' : 'común');
	autoName = $derived(potionName(this.stats, this.total));
	name = $derived(this.customName.trim() || this.autoName);
	isFull = $derived(this.contents.length >= MAX_INGREDIENTS);
	isEmpty = $derived(this.contents.length === 0);

	add(ingredient: Ingredient) {
		if (this.isFull) return;
		// Reactividad profunda: push sobre un array $state actualiza la vista
		this.contents.push({ uid: crypto.randomUUID(), ingredient });
	}

	remove(uid: string) {
		this.contents = this.contents.filter((s) => s.uid !== uid);
	}

	brew(): Potion | null {
		if (this.isEmpty) return null;
		const potion: Potion = {
			id: crypto.randomUUID(),
			name: this.name,
			color: this.color,
			rarity: this.rarity,
			// $state.snapshot devuelve una copia plana, sin proxies reactivos
			stats: $state.snapshot(this.stats),
		};
		this.book = [potion, ...this.book].slice(0, 6);
		this.contents = [];
		this.customName = '';
		return potion;
	}
}

function mixColors(colors: string[]) {
	if (!colors.length) return '#41a6f6';
	const sum = [0, 0, 0];
	for (const c of colors) for (let i = 0; i < 3; i++) sum[i] += parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
	return '#' + sum.map((v) => Math.round(v / colors.length).toString(16).padStart(2, '0')).join('');
}

function potionName(stats: Stats, total: number) {
	if (total === 0) return 'Agua del pozo';
	if (Object.values(stats).every((v) => v > 0)) return 'Elixir del Equilibrio';
	const [best] = (Object.entries(stats) as [StatKey, number][]).sort((a, b) => b[1] - a[1])[0];
	const grade = total >= 9 ? 'suprema' : total >= 5 ? 'mayor' : 'menor';
	return `Poción ${grade} de ${STAT_LABELS[best]}`;
}
