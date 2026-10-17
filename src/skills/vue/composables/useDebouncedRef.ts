import { onWatcherCleanup, readonly, ref, watch, type Ref } from 'vue';

/** Devuelve una copia de solo lectura de `source` que se actualiza tras `delay` ms sin cambios. */
export function useDebouncedRef<T>(source: Ref<T>, delay = 200) {
	const debounced = ref(source.value) as Ref<T>;

	watch(source, (value) => {
		const timer = setTimeout(() => (debounced.value = value), delay);
		onWatcherCleanup(() => clearTimeout(timer));
	});

	return readonly(debounced);
}
