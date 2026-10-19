<script>
	import { ITEMS_BY_ID, RECIPES } from '../../../state/catalog';

	let { inventory, onload } = $props();

	// Estado derivado: qué recetas se pueden preparar con lo que tienes ahora.
	// Cuenta también lo que ya está en el caldero, porque cargar una receta lo sustituye.
	const rows = $derived(
		RECIPES.map((recipe) => ({
			recipe,
			potion: ITEMS_BY_ID.get(recipe.output),
			owned: inventory[recipe.output] ?? 0,
			ready: Object.entries(recipe.inputs).every(([id, qty]) => (inventory[id] ?? 0) >= qty),
			inputs: Object.entries(recipe.inputs)
				.map(([id, qty]) => `${qty > 1 ? `${qty} ` : ''}${ITEMS_BY_ID.get(id).name}`)
				.join(' + '),
		})),
	);
	const readyCount = $derived(rows.filter((r) => r.ready).length);
</script>

<section class="book" aria-labelledby="svelte-book-title">
	<h4 id="svelte-book-title">Recetario <span class="count">{readyCount}/{rows.length} listas</span></h4>
	<ul>
		{#each rows as { recipe, potion, owned, ready, inputs } (recipe.id)}
			<li>
				<button
					type="button"
					data-ready={ready}
					disabled={!ready}
					onclick={() => onload(recipe)}
					aria-label="{potion.name}: {inputs}. {ready ? 'Cargar en el caldero' : 'Faltan ingredientes'}"
				>
					<span class="flask" style:background={potion.color}></span>
					<span class="name">{potion.name}<small>{inputs}</small></span>
					<span class="owned" title="En el inventario">×{owned}</span>
				</button>
			</li>
		{/each}
	</ul>
	<p class="tip">Pulsa una receta lista para cargarla en el caldero.</p>
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
	.count {
		color: var(--color-px-q);
		font-size: 0.45rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.35rem;
	}
	button {
		width: 100%;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.3rem;
		font: inherit;
		font-size: 1.05rem;
		line-height: 1.05;
		text-align: left;
		color: var(--color-px-w);
		background: none;
		border: 2px solid transparent;
		cursor: pointer;
	}
	button[data-ready='true'] {
		border-color: var(--color-px-g);
	}
	button[data-ready='true']:hover {
		background: var(--color-px-B);
	}
	button:disabled {
		cursor: default;
		color: var(--color-px-q);
	}
	button:focus-visible {
		outline: 2px solid var(--color-px-w);
		outline-offset: 2px;
	}
	small {
		display: block;
		font-size: 0.9rem;
		color: var(--color-px-q);
	}
	.flask {
		width: 12px;
		height: 14px;
		border: 2px solid var(--color-px-w);
		border-top-width: 4px;
	}
	.owned {
		font-family: var(--font-pixel);
		font-size: 0.5rem;
		color: var(--color-px-y);
	}
	.tip {
		margin: 0;
		font-size: 1rem;
		color: var(--color-px-q);
	}
</style>
