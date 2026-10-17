<script setup lang="ts">
import { useId } from 'vue';

const query = defineModel<string>({ required: true });
// useId genera el mismo id en servidor y cliente
const id = useId();
</script>

<template>
	<div class="search">
		<label :for="id">Buscar</label>
		<input :id="id" v-model="query" type="search" placeholder="espada, poción..." autocomplete="off" />
	</div>
</template>

<style scoped>
.search {
	display: grid;
	gap: 0.35rem;
}
label {
	font-family: var(--font-pixel);
	font-size: 0.6rem;
	color: var(--color-px-q);
}
input {
	font: inherit;
	font-size: 1.25rem;
	padding: 0.35rem 0.6rem;
	background: var(--color-px-o);
	color: var(--color-px-w);
	border: 2px solid var(--color-px-Q);
	outline: none;
}
input:focus-visible {
	border-color: var(--color-px-g);
}
</style>
