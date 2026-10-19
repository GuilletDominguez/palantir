<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useCartStore } from '../stores/cart';
import PixelIcon from './PixelIcon.vue';

const cart = useCartStore();
// storeToRefs mantiene la reactividad al desestructurar estado y getters
const { lines, total, gold, count, error } = storeToRefs(cart);

const spentPct = computed(() => (gold.value > 0 ? Math.min(100, Math.round((total.value / gold.value) * 100)) : 0));
</script>

<template>
	<aside class="cart" aria-labelledby="vue-cart-title">
		<h3 id="vue-cart-title">Carrito ({{ count }})</h3>

		<div
			class="budget"
			role="meter"
			:aria-valuenow="total"
			aria-valuemin="0"
			:aria-valuemax="gold"
			aria-label="Oro que vas a gastar"
		>
			<div class="bar" :style="{ width: `${spentPct}%` }" />
		</div>
		<p class="gold">Total: {{ total }} / {{ gold }} ●</p>

		<p v-if="!lines.length" class="empty">El carrito está vacío.</p>
		<TransitionGroup v-else tag="ul" name="line">
			<li v-for="{ item, qty } in lines" :key="item.id">
				<PixelIcon :sprite="item.sprite" :size="20" />
				<span class="name">{{ item.name }}</span>
				<span class="qty">×{{ qty }}</span>
				<button type="button" :aria-label="`Quitar ${item.name}`" @click="cart.remove(item.id)">−</button>
			</li>
		</TransitionGroup>

		<p v-if="error" role="alert" class="error">{{ error }}</p>

		<div v-if="lines.length" class="actions">
			<button type="button" class="pay" @click="cart.checkout()">Pagar {{ total }} ●</button>
			<button type="button" class="clear" @click="cart.clear()">Vaciar</button>
		</div>
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
.empty,
.error {
	margin: 0;
	font-size: 1.1rem;
}
.empty {
	color: var(--color-px-q);
}
.error {
	line-height: 1.1;
	color: var(--color-px-O);
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
.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
}
li button,
.pay,
.clear {
	font-family: var(--font-pixel);
	font-size: 0.55rem;
	cursor: pointer;
	background: var(--color-px-r);
	color: var(--color-px-w);
	border: 2px solid var(--color-px-o);
	padding: 0.25rem 0.45rem;
}
.pay {
	background: var(--color-px-g);
	color: var(--color-px-o);
	box-shadow: inset -2px -2px 0 var(--color-px-d);
	padding: 0.4rem 0.6rem;
}
.pay:hover {
	background: var(--color-px-l);
}
.clear {
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
