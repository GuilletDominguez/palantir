<script>
	import { INGREDIENTS, STAT_LABELS } from '../ingredients';
	import PixelIcon from './PixelIcon.svelte';

	// Svelte 5: los eventos de componente son props de tipo callback
	let { onpick, full = false, available } = $props();

	const hasAny = $derived(INGREDIENTS.some((i) => available(i.id) > 0));
</script>

<!-- Snippet: un trozo de marcado reutilizable con parámetros, sin crear otro componente -->
{#snippet effects(ingredient)}
	<span class="effects">
		{#each Object.entries(ingredient.effects) as [stat, value] (stat)}
			<span>+{value} {STAT_LABELS[stat]}</span>
		{/each}
	</span>
{/snippet}

<section class="shelf" aria-label="Estantería de ingredientes">
	<h4>Ingredientes</h4>
	<div class="grid">
		{#each INGREDIENTS as ingredient (ingredient.id)}
			{@const left = available(ingredient.id)}
			<button
				type="button"
				disabled={full || left <= 0}
				onclick={() => onpick(ingredient)}
				style:--swatch={ingredient.color}
				aria-label="{ingredient.name}, quedan {left}"
			>
				<span class="count" class:none={left <= 0}>×{left}</span>
				<PixelIcon sprite={ingredient.sprite} size={32} />
				<span class="name">{ingredient.name}</span>
				{@render effects(ingredient)}
			</button>
		{/each}
	</div>
	{#if full}
		<p class="hint">El caldero está lleno: prepara la poción o retira algo.</p>
	{:else if !hasAny}
		<p class="hint">No te quedan ingredientes: cómpralos en la tienda de Vue.</p>
	{/if}
</section>

<style>
	.shelf {
		display: grid;
		gap: 0.6rem;
	}
	h4 {
		margin: 0;
		font-family: var(--font-pixel);
		font-size: 0.65rem;
		color: var(--color-px-O);
	}
	.grid {
		display: grid;
		gap: 0.5rem;
		grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
	}
	button {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 0.25rem;
		padding: 0.6rem 0.4rem;
		cursor: pointer;
		font: inherit;
		color: var(--color-px-w);
		background: var(--color-px-B);
		border: 2px solid var(--color-px-o);
		border-bottom: 5px solid var(--swatch);
	}
	button:hover:not(:disabled) {
		background: var(--color-px-Q);
	}
	button:focus-visible {
		outline: 2px solid var(--color-px-w);
		outline-offset: 2px;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.count {
		position: absolute;
		top: 0.3rem;
		right: 0.4rem;
		font-family: var(--font-pixel);
		font-size: 0.5rem;
		color: var(--color-px-y);
	}
	.count.none {
		color: var(--color-px-q);
	}
	.name {
		font-size: 1.15rem;
		line-height: 1;
	}
	.effects {
		display: grid;
		font-size: 0.95rem;
		line-height: 1;
		color: var(--color-px-y);
	}
	.hint {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-px-O);
	}
</style>
