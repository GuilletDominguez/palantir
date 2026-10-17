<script setup lang="ts">
import { computed } from 'vue';
import { PALETTE } from '../../../game/palette';

const { sprite, size = 32 } = defineProps<{ sprite: string[]; size?: number }>();

// Un <rect> por píxel opaco: el mismo formato de sprite que usa el juego.
const pixels = computed(() =>
	sprite.flatMap((row, y) =>
		[...row].flatMap((key, x) => (PALETTE[key] ? [{ x, y, fill: PALETTE[key] }] : [])),
	),
);
</script>

<template>
	<svg
		:width="size"
		:height="size"
		:viewBox="`0 0 ${sprite[0].length} ${sprite.length}`"
		shape-rendering="crispEdges"
		aria-hidden="true"
	>
		<rect v-for="p in pixels" :key="`${p.x}-${p.y}`" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
	</svg>
</template>
