<script lang="ts">
	import type { Snippet } from 'svelte';

	// children: el contenido que el padre mete entre <CauldronPot>…</CauldronPot>
	let { color, bubbling, children }: { color: string; bubbling: boolean; children?: Snippet } = $props();

	const bubbles = [
		{ left: 22, delay: 0, size: 6 },
		{ left: 45, delay: 0.5, size: 8 },
		{ left: 63, delay: 0.25, size: 5 },
		{ left: 78, delay: 0.8, size: 7 },
	];
</script>

<div class="pot" style:--liquid={color} class:bubbling>
	<div class="rim"></div>
	<div class="body">
		<div class="liquid">
			{#each bubbles as b, i (i)}
				<span class="bubble" style:left="{b.left}%" style:animation-delay="{b.delay}s" style:--size="{b.size}px"></span>
			{/each}
		</div>
	</div>
	<div class="legs"><span></span><span></span></div>
	{#if children}
		<div class="label">{@render children()}</div>
	{/if}
</div>

<style>
	.pot {
		position: relative;
		width: 100%;
		max-width: 15rem;
		margin-inline: auto;
		--outline: var(--color-px-o);
	}
	.rim {
		height: 18px;
		margin-inline: -6px;
		background: var(--color-px-Q);
		border: 4px solid var(--outline);
		box-shadow: inset 0 -4px 0 var(--color-px-B);
	}
	.body {
		height: 120px;
		margin-top: -4px;
		background: var(--color-px-B);
		border: 4px solid var(--outline);
		border-radius: 0 0 40% 40% / 0 0 30% 30%;
		overflow: hidden;
		position: relative;
	}
	.liquid {
		position: absolute;
		inset: 0 0 auto 0;
		height: 26px;
		background: var(--liquid);
		box-shadow: inset 0 -6px 0 color-mix(in srgb, var(--liquid), black 30%);
		transition: background-color 0.4s steps(4);
	}
	.bubble {
		position: absolute;
		top: 8px;
		width: var(--size);
		height: var(--size);
		background: color-mix(in srgb, var(--liquid), white 45%);
		border: 2px solid var(--outline);
		opacity: 0;
	}
	.bubbling .bubble {
		animation: rise 1.4s steps(5) infinite;
	}
	@keyframes rise {
		0% {
			transform: translateY(0);
			opacity: 1;
		}
		100% {
			transform: translateY(-34px);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bubbling .bubble {
			animation: none;
			opacity: 1;
		}
	}
	.legs {
		display: flex;
		justify-content: space-between;
		padding-inline: 22%;
		margin-top: -6px;
	}
	.legs span {
		width: 14px;
		height: 14px;
		background: var(--color-px-B);
		border: 4px solid var(--outline);
		border-top: 0;
	}
	.label {
		position: absolute;
		inset: 48px 12px auto 12px;
		text-align: center;
	}
</style>
