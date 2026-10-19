import { computed, toValue } from 'vue';

const normalize = (s) =>
	s
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();

export function useItemFilter(items, query, category) {
	return computed(() => {
		const q = normalize(toValue(query).trim());
		const cat = toValue(category);
		return toValue(items).filter(
			(item) => (cat === 'all' || item.category === cat) && normalize(item.name).includes(q),
		);
	});
}
