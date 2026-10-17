<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { BUDGET, useCartStore } from '../stores/cart';
import PixelIcon from './PixelIcon.vue';

const cart = useCartStore();
// storeToRefs mantiene la reactividad al desestructurar estado y getters
const { lines, total, remaining, count } = storeToRefs(cart);

const spentPct = computed(() => Math.round((total.value / BUDGET) * 100));
</script>

<template>
	<aside class="cart" aria-labelledby="vue-cart-title">
		<h3 id="vue-cart-title">Mochila ({{ count }})</h3>

		<div
			class="budget"
			role="meter"
			:aria-valuenow="total"
			aria-valuemin="0"
			:aria-valuemax="BUDGET"
			aria-label="Oro gastado"
		>
			<div class="bar" :style="{ width: `${spentPct}%` }" />
		</div>
		<p class="gold">Oro: {{ remaining }} / {{ BUDGET }}</p>

		<p v-if="!lines.length" class="empty">La mochila está vacía.</p>
		<TransitionGroup v-else tag="ul" name="line">
			<li v-for="{ item, qty } in lines" :key="item.id">
				<PixelIcon :sprite="item.sprite" :size="20" />
				<span class="name">{{ item.name }}</span>
				<span class="qty">×{{ qty }}</span>
				<button type="button" :aria-label="`Quitar ${item.name}`" @click="cart.remove(item.id)">−</button>
			</li>
		</TransitionGroup>

		<button v-if="lines.length" type="button" class="clear" @click="cart.clear()">Vaciar</button>
	</aside>
</template>

<style scoped>
.cart {
	display: grid;
	align-content: start;
	gap: 0.6rem;
	padding: 0.9rem;
	background: var(--color-px-o);
	border: 2px solid var(--color-px-Q);
}
h3 {
	margin: 0;
	font-family: var(--font-pixel);
	font-size: 0.7rem;
	color: var(--color-px-g);
}
.budget {
	height: 10px;
	background: var(--color-px-B);
	border: 2px solid var(--color-px-Q);
}
.bar {
	height: 100%;
	background: var(--color-px-y);
	transition: width 0.25s steps(5);
}
.gold,
.empty {
	margin: 0;
	font-size: 1.1rem;
}
.empty {
	color: var(--color-px-q);
}
ul {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 0.3rem;
}
li {
	display: grid;
	grid-template-columns: auto 1fr auto auto;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
}
.qty {
	color: var(--color-px-y);
}
li button,
.clear {
	font-family: var(--font-pixel);
	font-size: 0.55rem;
	cursor: pointer;
	background: var(--color-px-r);
	color: var(--color-px-w);
	border: 2px solid var(--color-px-o);
	padding: 0.25rem 0.45rem;
}
.clear {
	justify-self: start;
	background: var(--color-px-B);
}

.line-enter-active,
.line-leave-active {
	transition: all 0.2s steps(4);
}
.line-enter-from,
.line-leave-to {
	opacity: 0;
	transform: translateX(12px);
}
</style>
