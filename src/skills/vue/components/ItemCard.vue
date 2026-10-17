<script setup lang="ts">
import type { Item } from '../items';
import PixelIcon from './PixelIcon.vue';

defineProps<{ item: Item; affordable: boolean }>();
const emit = defineEmits<{ buy: [item: Item] }>();
</script>

<template>
	<article class="card" :class="{ disabled: !affordable }">
		<PixelIcon :sprite="item.sprite" :size="40" />
		<h4>{{ item.name }}</h4>
		<p class="price">{{ item.price }} <span aria-label="monedas">●</span></p>
		<button type="button" :disabled="!affordable" @click="emit('buy', item)">
			{{ affordable ? 'Comprar' : 'Sin oro' }}
		</button>
	</article>
</template>

<style scoped>
.card {
	display: grid;
	justify-items: center;
	gap: 0.4rem;
	padding: 0.75rem 0.5rem;
	background: var(--color-px-B);
	border: 2px solid var(--color-px-o);
	text-align: center;
}
h4 {
	margin: 0;
	font-size: 1.1rem;
	line-height: 1;
}
.price {
	margin: 0;
	color: var(--color-px-y);
	font-family: var(--font-pixel);
	font-size: 0.6rem;
}
button {
	font-family: var(--font-pixel);
	font-size: 0.55rem;
	padding: 0.45rem 0.6rem;
	cursor: pointer;
	background: var(--color-px-g);
	color: var(--color-px-o);
	border: 2px solid var(--color-px-o);
	box-shadow: inset -2px -2px 0 var(--color-px-d);
}
button:hover:not(:disabled) {
	background: var(--color-px-l);
}
button:active:not(:disabled) {
	box-shadow: inset 2px 2px 0 var(--color-px-d);
}
.disabled {
	opacity: 0.55;
}
button:disabled {
	cursor: not-allowed;
	background: var(--color-px-Q);
	box-shadow: none;
}
</style>
