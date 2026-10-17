<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import type { Potion } from '../cauldron.svelte';

	let { potions }: { potions: Potion[] } = $props();
</script>

<section class="book" aria-labelledby="svelte-book-title">
	<h4 id="svelte-book-title">Recetario</h4>
	{#if potions.length === 0}
		<p class="empty">Aún no has preparado ninguna poción.</p>
	{:else}
		<ul>
			{#each potions as potion (potion.id)}
				<li animate:flip={{ duration: 250 }} in:fly={{ x: -16, duration: 250 }}>
					<span class="flask" style:background={potion.color}></span>
					<span class="name">{potion.name}</span>
					<span class="rarity" data-rarity={potion.rarity}>{potion.rarity}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.book {
		display: grid;
		align-content: start;
		gap: 0.5rem;
		padding: 0.8rem;
		background: var(--color-px-o);
		border: 2px solid var(--color-px-Q);
	}
	h4 {
		margin: 0;
		font-family: var(--font-pixel);
		font-size: 0.6rem;
		color: var(--color-px-O);
	}
	.empty {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-px-q);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.35rem;
	}
	li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.05rem;
		line-height: 1.05;
	}
	.flask {
		width: 12px;
		height: 14px;
		border: 2px solid var(--color-px-w);
		border-top-width: 4px;
	}
	.rarity {
		font-family: var(--font-pixel);
		font-size: 0.45rem;
		color: var(--color-px-q);
	}
	.rarity[data-rarity='rara'] {
		color: var(--color-px-c);
	}
	.rarity[data-rarity='legendaria'] {
		color: var(--color-px-y);
	}
</style>
