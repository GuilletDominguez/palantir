<script lang="ts">
	import { INGREDIENTS, STAT_LABELS, type Ingredient, type StatKey } from '../ingredients';
	import PixelIcon from './PixelIcon.svelte';

	// Svelte 5: los eventos de componente son props de tipo callback
	let { onpick, disabled = false }: { onpick: (ingredient: Ingredient) => void; disabled?: boolean } = $props();
</script>

<!-- Snippet: un trozo de marcado reutilizable con parámetros, sin crear otro componente -->
{#snippet effects(ingredient: Ingredient)}
	<span class="effects">
		{#each Object.entries(ingredient.effects) as [stat, value] (stat)}
			<span>+{value} {STAT_LABELS[stat as StatKey]}</span>
		{/each}
	</span>
{/snippet}

<section class="shelf" aria-label="Estantería de ingredientes">
	<h4>Ingredientes</h4>
	<div class="grid">
		{#each INGREDIENTS as ingredient (ingredient.id)}
			<button type="button" {disabled} onclick={() => onpick(ingredient)} style:--swatch={ingredient.color}>
				<PixelIcon sprite={ingredient.sprite} size={32} />
				<span class="name">{ingredient.name}</span>
				{@render effects(ingredient)}
			</button>
		{/each}
	</div>
	{#if disabled}
		<p class="hint">El caldero está lleno: prepara la poción o retira algo.</p>
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
