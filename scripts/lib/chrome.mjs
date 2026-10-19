// Utilidades para los scripts que usan Chrome sobre la web compilada
// (generate-og.mjs y generate-cv.mjs): compilar, servir y ejecutar Chrome.

import { execFileSync, spawn } from 'node:child_process';

const CHROMES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

export function findChrome() {
	const chrome = CHROMES.find((bin) => {
		try {
			execFileSync('which', [bin], { stdio: 'ignore' });
			return true;
		} catch {
			return false;
		}
	});
	if (!chrome) throw new Error('No encuentro Chrome ni Chromium instalado en el equipo.');
	return chrome;
}

/** Compila la web, la sirve con `astro preview` y llama a fn(urlBase). */
export async function withPreview(fn, port = 4397) {
	execFileSync('npx', ['astro', 'build'], { stdio: 'inherit' });
	const preview = spawn('npx', ['astro', 'preview', '--port', String(port)], { stdio: 'ignore', detached: true });
	const base = `http://localhost:${port}`;
	try {
		for (let i = 0; i < 50; i++) {
			if (await fetch(base).then((r) => r.ok).catch(() => false)) break;
			await new Promise((r) => setTimeout(r, 200));
		}
		return await fn(base);
	} finally {
		process.kill(-preview.pid);
	}
}

/** Ejecuta Chrome en modo headless con las opciones dadas sobre una URL. */
export function chrome(url, options) {
	execFileSync(findChrome(), [
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		// Da tiempo a que carguen las fuentes antes de capturar o imprimir
		'--virtual-time-budget=3000',
		...options,
		url,
	]);
}
