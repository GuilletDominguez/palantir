import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { Category, Item } from '../items';

const normalize = (s: string) =>
	s
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();

export function useItemFilter(
	items: MaybeRefOrGetter<Item[]>,
	query: MaybeRefOrGetter<string>,
	category: MaybeRefOrGetter<Category | 'all'>,
) {
	return computed(() => {
		const q = normalize(toValue(query).trim());
		const cat = toValue(category);
		return toValue(items).filter(
			(item) => (cat === 'all' || item.category === cat) && normalize(item.name).includes(q),
		);
	});
}
