<script>
	// $bindable: el padre puede usar bind:value y el valor fluye en ambos sentidos
	let { value = $bindable(''), placeholder } = $props();
	const id = $props.id();
</script>

<div class="field">
	<label for={id}>Nombre de la poción</label>
	<input {id} bind:value {placeholder} maxlength="32" autocomplete="off" />
</div>

<style>
	.field {
		display: grid;
		gap: 0.35rem;
	}
	label {
		font-family: var(--font-pixel);
		font-size: 0.55rem;
		color: var(--color-px-q);
	}
	input {
		font: inherit;
		font-size: 1.15rem;
		padding: 0.3rem 0.55rem;
		color: var(--color-px-w);
		background: var(--color-px-o);
		border: 2px solid var(--color-px-Q);
		outline: none;
	}
	input:focus-visible {
		border-color: var(--color-px-O);
	}
</style>
