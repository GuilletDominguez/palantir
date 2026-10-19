<script>
	import { PALETTE } from '../../../game/palette';

	let { sprite, size = 32 } = $props();

	const pixels = $derived(
		sprite.flatMap((row, y) => [...row].flatMap((key, x) => (PALETTE[key] ? [{ x, y, fill: PALETTE[key] }] : []))),
	);
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {sprite[0].length} {sprite.length}"
	shape-rendering="crispEdges"
	aria-hidden="true"
>
	{#each pixels as p (`${p.x}-${p.y}`)}
		<rect x={p.x} y={p.y} width="1" height="1" fill={p.fill} />
	{/each}
</svg>
