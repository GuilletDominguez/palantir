<script setup>
import { onMounted, ref } from 'vue';
import CartPanel from './components/CartPanel.vue';
import CategoryTabs from './components/CategoryTabs.vue';
import ItemCard from './components/ItemCard.vue';
import SearchBox from './components/SearchBox.vue';
import SellPanel from './components/SellPanel.vue';
import { useDebouncedRef } from './composables/useDebouncedRef';
import { useItemFilter } from './composables/useItemFilter';
import { ITEMS } from './items';
import { useCartStore } from './stores/cart';

const cart = useCartStore();

const query = ref('');
const category = ref('all');
const debouncedQuery = useDebouncedRef(query, 150);
const visible = useItemFilter(ITEMS, debouncedQuery, category);

onMounted(() => cart.hydrate());
</script>

<template>
	<div class="shop">
		<section class="catalog" aria-label="Catálogo">
			<div class="controls">
				<SearchBox v-model="query" />
				<CategoryTabs v-model="category" />
			</div>

			<TransitionGroup v-if="visible.length" tag="div" name="grid" class="grid">
				<ItemCard
					v-for="item in visible"
					:key="item.id"
					:item="item"
					:missing-gold="cart.missingGold(item)"
					@buy="cart.add"
				/>
			</TransitionGroup>
			<p v-else class="none">No hay ingredientes que coincidan con «{{ debouncedQuery }}».</p>
		</section>

		<div class="side">
			<CartPanel />
			<SellPanel />
		</div>
	</div>
</template>

<style scoped>
.shop {
	display: grid;
	gap: 1rem;
	grid-template-columns: minmax(0, 1fr);
	color: var(--color-px-w);
	font-family: var(--font-body);
}
@media (min-width: 720px) {
	.shop {
		grid-template-columns: minmax(0, 1fr) 15rem;
	}
}
.catalog {
	display: grid;
	gap: 0.9rem;
	align-content: start;
}
.side {
	display: grid;
	gap: 1rem;
	align-content: start;
}
.controls {
	display: grid;
	gap: 0.7rem;
}
.grid {
	position: relative;
	display: grid;
	gap: 0.6rem;
	grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
}
.none {
	font-size: 1.2rem;
	color: var(--color-px-q);
}

.grid-move,
.grid-enter-active,
.grid-leave-active {
	transition: all 0.2s steps(4);
}
.grid-enter-from,
.grid-leave-to {
	opacity: 0;
	transform: scale(0.85);
}
.grid-leave-active {
	position: absolute;
}
</style>
