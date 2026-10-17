<script setup lang="ts">
import { CATEGORIES, type Category } from '../items';

const selected = defineModel<Category | 'all'>({ required: true });

const options: { value: Category | 'all'; label: string }[] = [
	{ value: 'all', label: 'Todo' },
	...Object.entries(CATEGORIES).map(([value, label]) => ({ value: value as Category, label })),
];
</script>

<template>
	<fieldset class="tabs">
		<legend class="sr-only">Categoría</legend>
		<label v-for="opt in options" :key="opt.value" :class="{ active: selected === opt.value }">
			<input v-model="selected" type="radio" name="vue-shop-category" :value="opt.value" />
			{{ opt.label }}
		</label>
	</fieldset>
</template>

<style scoped>
.tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	border: 0;
	padding: 0;
	margin: 0;
}
label {
	cursor: pointer;
	font-family: var(--font-pixel);
	font-size: 0.55rem;
	padding: 0.45rem 0.6rem;
	background: var(--color-px-B);
	color: var(--color-px-q);
	border: 2px solid var(--color-px-o);
}
label.active {
	background: var(--color-px-g);
	color: var(--color-px-o);
}
label:has(input:focus-visible) {
	outline: 2px solid var(--color-px-w);
	outline-offset: 2px;
}
input {
	position: absolute;
	opacity: 0;
	pointer-events: none;
}
</style>
