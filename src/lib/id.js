let counter = 0;

/**
 * Id único para claves de listas. No usa crypto.randomUUID() porque el navegador
 * solo lo expone en contextos seguros (HTTPS o localhost), y la web también se
 * abre por http en la red local durante el desarrollo.
 */
export function uid() {
	return `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
