import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { ITEMS_BY_ID, type Item } from '../items';

const STORAGE_KEY = 'palantir:vue-cart';
export const BUDGET = 100;

export const useCartStore = defineStore('cart', () => {
	// Estado: cantidad por id de objeto
	const quantities = ref<Record<string, number>>({});

	// Getters
	const lines = computed(() =>
		Object.entries(quantities.value).map(([id, qty]) => ({ item: ITEMS_BY_ID.get(id)!, qty })),
	);
	const total = computed(() => lines.value.reduce((sum, l) => sum + l.item.price * l.qty, 0));
	const remaining = computed(() => BUDGET - total.value);
	const count = computed(() => lines.value.reduce((sum, l) => sum + l.qty, 0));

	// Acciones
	function canAfford(item: Item) {
		return item.price <= remaining.value;
	}

	function add(item: Item) {
		if (!canAfford(item)) return;
		quantities.value[item.id] = (quantities.value[item.id] ?? 0) + 1;
	}

	function remove(id: string) {
		const qty = quantities.value[id];
		if (!qty) return;
		if (qty > 1) quantities.value[id] = qty - 1;
		else delete quantities.value[id];
	}

	function clear() {
		quantities.value = {};
	}

	/** Solo en cliente: se llama desde onMounted para no romper la hidratación. */
	function restore() {
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
			quantities.value = Object.fromEntries(
				Object.entries(saved).filter(([id, qty]) => ITEMS_BY_ID.has(id) && Number.isInteger(qty)),
			) as Record<string, number>;
		} catch {
			// localStorage no disponible o datos corruptos: empezamos vacíos
		}
	}

	// Solo se dispara ante cambios, que únicamente ocurren en el cliente.
	watch(
		quantities,
		(value) => {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			} catch {}
		},
		{ deep: true },
	);

	return { quantities, lines, total, remaining, count, canAfford, add, remove, clear, restore };
});
