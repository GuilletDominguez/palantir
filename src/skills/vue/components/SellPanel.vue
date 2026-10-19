<script setup>
import { storeToRefs } from 'pinia';
import { useCartStore } from '../stores/cart';
import PixelIcon from './PixelIcon.vue';

const cart = useCartStore();
const { potions } = storeToRefs(cart);
</script>

<template>
	<aside class="sell" aria-labelledby="vue-sell-title">
		<h3 id="vue-sell-title">Vender pociones</h3>
		<p v-if="!potions.length" class="empty">No tienes pociones. Prepáralas en el laboratorio de Svelte.</p>
		<TransitionGroup v-else tag="ul" name="line">
			<li v-for="{ item, qty, price } in potions" :key="item.id">
				<PixelIcon :sprite="item.sprite" :size="20" />
				<span class="name">{{ item.name }}</span>
				<span class="qty">×{{ qty }}</span>
				<button type="button" :aria-label="`Vender ${item.name} por ${price} de oro`" @click="cart.sell(item.id)">
					+{{ price }} ●
				</button>
			</li>
		</TransitionGroup>
	</aside>
</template>

<style scoped>
.sell {
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
	color: var(--color-px-y);
}
.empty {
	margin: 0;
	font-size: 1.1rem;
	line-height: 1.1;
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
	line-height: 1.05;
}
.qty {
	color: var(--color-px-y);
}
button {
	font-family: var(--font-pixel);
	font-size: 0.5rem;
	cursor: pointer;
	white-space: nowrap;
	background: var(--color-px-y);
	color: var(--color-px-o);
	border: 2px solid var(--color-px-o);
	padding: 0.25rem 0.4rem;
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
