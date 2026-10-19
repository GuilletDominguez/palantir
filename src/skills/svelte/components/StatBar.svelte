<script>
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	let { label, value, max } = $props();

	// Tween.of sigue a `value` y anima su valor intermedio en `.current`
	const shown = Tween.of(() => value, { duration: 450, easing: cubicOut });
</script>

<div class="row">
	<span class="label">{label}</span>
	<div class="track" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
		<div class="fill" style:width="{(shown.current / max) * 100}%"></div>
	</div>
	<span class="value">{Math.round(shown.current)}</span>
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: 5.5rem 1fr 1.5rem;
		align-items: center;
		gap: 0.5rem;
	}
	.label {
		font-family: var(--font-pixel);
		font-size: 0.5rem;
		color: var(--color-px-q);
	}
	.track {
		height: 12px;
		background: var(--color-px-B);
		border: 2px solid var(--color-px-o);
	}
	.fill {
		height: 100%;
		background: var(--color-px-O);
		box-shadow: inset 0 -3px 0 var(--color-px-r);
	}
	.value {
		font-family: var(--font-pixel);
		font-size: 0.55rem;
		color: var(--color-px-y);
		text-align: right;
	}
</style>
