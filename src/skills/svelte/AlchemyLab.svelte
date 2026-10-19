<script>
	import { flip } from 'svelte/animate';
	import { fly, scale } from 'svelte/transition';
	import { INITIAL_PLAYER, $player as playerStore } from '../../state/economy';
	import { Cauldron, MAX_INGREDIENTS, MAX_STAT } from './cauldron.svelte';
	import { STAT_LABELS } from './ingredients';
	import CauldronPot from './components/CauldronPot.svelte';
	import IngredientShelf from './components/IngredientShelf.svelte';
	import NameField from './components/NameField.svelte';
	import PixelIcon from './components/PixelIcon.svelte';
	import RecipeBook from './components/RecipeBook.svelte';
	import StatBar from './components/StatBar.svelte';

	const lab = new Cauldron();
	let toast = $state(null);

	// $effect solo se ejecuta en el navegador. Hasta entonces se pinta el estado
	// inicial, igual que en el servidor, y la hidratación no encuentra diferencias.
	let mounted = $state(false);
	$effect(() => {
		mounted = true;
	});

	// nanostores sigue el contrato de store de Svelte: $playerStore se suscribe solo
	const player = $derived(mounted ? $playerStore : INITIAL_PLAYER);
	/** Unidades libres de cada ingrediente: inventario menos lo que ya está en el caldero. */
	const available = (id) => (player.inventory[id] ?? 0) - lab.countOf(id);

	function brew() {
		const batch = lab.customName.trim();
		const potion = lab.autoName;
		const result = lab.brew();
		const text = result.ok
			? batch && batch !== potion
				? `¡Lote «${batch}» listo: +1 ${potion}!`
				: `¡${potion} añadida al inventario!`
			: result.reason;
		toast = { id: Date.now(), text, error: !result.ok };
	}
</script>

<div class="lab">
	<IngredientShelf onpick={(i) => lab.add(i)} full={lab.isFull} {available} />

	<section class="workbench" aria-label="Caldero">
		<CauldronPot color={lab.color} bubbling={!lab.isEmpty}>
			<p class="potion-name">{lab.name}</p>
		</CauldronPot>

		<ul class="contents" aria-label="Ingredientes en el caldero">
			{#each lab.contents as slot (slot.uid)}
				<li animate:flip={{ duration: 200 }} in:fly={{ y: -24, duration: 200 }} out:scale={{ duration: 150 }}>
					<button type="button" onclick={() => lab.remove(slot.uid)} aria-label="Retirar {slot.ingredient.name}">
						<PixelIcon sprite={slot.ingredient.sprite} size={24} />
					</button>
				</li>
			{/each}
			{#each { length: MAX_INGREDIENTS - lab.contents.length }, i (i)}
				<li class="slot-empty" aria-hidden="true"></li>
			{/each}
		</ul>

		<div class="stats">
			{#each Object.entries(lab.stats) as [stat, value] (stat)}
				<StatBar label={STAT_LABELS[stat]} {value} max={MAX_STAT} />
			{/each}
			<p class="rarity">Rareza: <strong data-rarity={lab.rarity}>{lab.isEmpty ? '—' : lab.rarity}</strong></p>
		</div>

		<NameField bind:value={lab.customName} placeholder={lab.autoName} />

		<button type="button" class="brew" disabled={!!lab.blocked} aria-describedby="svelte-brew-hint" onclick={brew}>
			Preparar poción
		</button>
		<p id="svelte-brew-hint" class="hint">{lab.blocked ?? '¡La mezcla coincide con una receta!'}</p>

		<div class="toast-area" aria-live="polite">
			{#key toast?.id}
				{#if toast}
					<p class="toast" class:error={toast.error} in:fly={{ y: 10, duration: 250 }}>{toast.text}</p>
				{/if}
			{/key}
		</div>
	</section>

	<RecipeBook inventory={player.inventory} onload={(r) => lab.load(r)} />
</div>

<style>
	.lab {
		display: grid;
		gap: 1rem;
		grid-template-columns: minmax(0, 1fr);
		font-family: var(--font-body);
		color: var(--color-px-w);
	}
	@media (min-width: 900px) {
		.lab {
			grid-template-columns: minmax(0, 1fr) 16rem;
		}
		.lab > :global(:first-child) {
			grid-column: 1 / -1;
		}
	}
	.workbench {
		display: grid;
		gap: 0.8rem;
		align-content: start;
		padding: 1rem;
		background: var(--color-px-o);
		border: 2px solid var(--color-px-Q);
	}
	.potion-name {
		margin: 0;
		font-family: var(--font-pixel);
		font-size: 0.55rem;
		line-height: 1.6;
		color: var(--color-px-w);
		text-shadow: 2px 2px 0 var(--color-px-o);
	}
	.contents {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}
	.contents li {
		width: 40px;
		height: 40px;
	}
	.contents button {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		cursor: pointer;
		background: var(--color-px-B);
		border: 2px solid var(--color-px-O);
	}
	.contents button:hover {
		background: var(--color-px-r);
	}
	.slot-empty {
		border: 2px dashed var(--color-px-Q);
	}
	.stats {
		display: grid;
		gap: 0.4rem;
	}
	.rarity {
		margin: 0.2rem 0 0;
		font-size: 1.15rem;
	}
	.rarity [data-rarity='rara'] {
		color: var(--color-px-c);
	}
	.rarity [data-rarity='legendaria'] {
		color: var(--color-px-y);
	}
	.brew {
		cursor: pointer;
		font-family: var(--font-pixel);
		font-size: 0.6rem;
		padding: 0.6rem;
		color: var(--color-px-o);
		background: var(--color-px-O);
		border: 2px solid var(--color-px-o);
		box-shadow: inset -2px -2px 0 var(--color-px-r);
	}
	.brew:disabled {
		cursor: not-allowed;
		background: var(--color-px-Q);
		box-shadow: none;
	}
	.hint {
		margin: -0.4rem 0 0;
		font-size: 1.05rem;
		color: var(--color-px-q);
	}
	.toast-area {
		min-height: 1.5rem;
	}
	.toast {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-px-l);
	}
	.toast.error {
		color: var(--color-px-O);
	}
</style>
