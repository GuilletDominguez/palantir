import { onWatcherCleanup, readonly, ref, watch } from 'vue';

/** Devuelve una copia de solo lectura de `source` que se actualiza tras `delay` ms sin cambios. */
export function useDebouncedRef(source, delay = 200) {
	const debounced = ref(source.value);

	watch(source, (value) => {
		const timer = setTimeout(() => (debounced.value = value), delay);
		onWatcherCleanup(() => clearTimeout(timer));
	});

	return readonly(debounced);
}
