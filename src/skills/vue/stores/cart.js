import { useStore } from '@nanostores/vue';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { game } from '../../../state/actions';
import { ITEMS_BY_ID as CATALOG, sellPrice } from '../../../state/catalog';
import { $player, INITIAL_PLAYER } from '../../../state/economy';
import { ITEMS_BY_ID } from '../items';

// El carrito es estado local de la tienda (Pinia): lo que vas a comprar.
// El oro y el inventario son de la partida compartida (nanostores) y solo
// cambian a través de las acciones de src/state/actions.js.
export const useCartStore = defineStore('cart', () => {
	// Hasta montar la isla se usa el estado inicial, igual que en el HTML del
	// servidor; así la partida guardada no provoca un hydration mismatch.
	const live = useStore($player);
	const hydrated = ref(false);
	const player = computed(() => (hydrated.value ? live.value : INITIAL_PLAYER));
	const gold = computed(() => player.value.gold);

	// Estado: cantidad por id de ingrediente
	const quantities = ref({});
	const error = ref(null);

	// Getters
	const lines = computed(() =>
		Object.entries(quantities.value).map(([id, qty]) => ({ item: ITEMS_BY_ID.get(id), qty })),
	);
	const total = computed(() => lines.value.reduce((sum, l) => sum + l.item.price * l.qty, 0));
	const remaining = computed(() => gold.value - total.value);
	const count = computed(() => lines.value.reduce((sum, l) => sum + l.qty, 0));
	const potions = computed(() =>
		Object.entries(player.value.inventory).flatMap(([id, qty]) => {
			const item = CATALOG.get(id);
			return item?.kind === 'potion' ? [{ item, qty, price: sellPrice(item) }] : [];
		}),
	);

	// Acciones
	function missingGold(item) {
		return Math.max(0, item.price - remaining.value);
	}

	function add(item) {
		if (missingGold(item) > 0) return;
		error.value = null;
		quantities.value[item.id] = (quantities.value[item.id] ?? 0) + 1;
	}

	function remove(id) {
		const qty = quantities.value[id];
		if (!qty) return;
		if (qty > 1) quantities.value[id] = qty - 1;
		else delete quantities.value[id];
	}

	function clear() {
		quantities.value = {};
	}

	function checkout() {
		const result = game.checkout(quantities.value);
		error.value = result.ok ? null : result.reason;
		if (result.ok) clear();
	}

	function sell(id) {
		const result = game.sell(id);
		error.value = result.ok ? null : result.reason;
	}

	/** Solo en cliente: se llama desde onMounted para no romper la hidratación. */
	function hydrate() {
		hydrated.value = true;
	}

	return {
		quantities,
		error,
		gold,
		lines,
		total,
		remaining,
		count,
		potions,
		missingGold,
		add,
		remove,
		clear,
		checkout,
		sell,
		hydrate,
	};
});
