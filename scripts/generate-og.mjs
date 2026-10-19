// Genera public/og.png, la imagen que aparece al compartir el enlace (LinkedIn,
// WhatsApp, X…). Fotografía la página /og/ a 1200 × 630 con Chrome.
// Uso: npm run og   (necesita Google Chrome o Chromium instalado en el equipo)
// La imagen se sube al repositorio: el build de Cloudflare no necesita Chrome.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const PORT = 4397;
const CHROMES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
const chrome = CHROMES.find((bin) => {
	try {
		execFileSync('which', [bin], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
});
if (!chrome) throw new Error('No encuentro Chrome ni Chromium para hacer la captura.');

execFileSync('npx', ['astro', 'build'], { stdio: 'inherit' });

const preview = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore', detached: true });
try {
	// Espera a que el servidor de vista previa responda
	for (let i = 0; i < 50; i++) {
		const ok = await fetch(`http://localhost:${PORT}/og/`).then((r) => r.ok).catch(() => false);
		if (ok) break;
		await new Promise((r) => setTimeout(r, 200));
	}
	execFileSync(chrome, [
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		'--window-size=1200,630',
		// Da tiempo a que carguen las fuentes pixeladas antes de la captura
		'--virtual-time-budget=3000',
		'--screenshot=public/og.png',
		`http://localhost:${PORT}/og/`,
	]);
} finally {
	process.kill(-preview.pid);
}

if (!existsSync('public/og.png')) throw new Error('No se generó public/og.png');
console.log('✓ public/og.png generado');
