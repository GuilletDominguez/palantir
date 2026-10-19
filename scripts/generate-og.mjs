// Genera public/og.png, la imagen que aparece al compartir el enlace (LinkedIn,
// WhatsApp, X…). Fotografía la página /og/ a 1200 × 630 con Chrome.
// Uso: npm run og   (necesita Google Chrome o Chromium instalado en el equipo)
// La imagen se sube al repositorio: el build de Cloudflare no necesita Chrome.

import { existsSync } from 'node:fs';
import { chrome, withPreview } from './lib/chrome.mjs';

await withPreview(async (base) => {
	chrome(`${base}/og/`, ['--window-size=1200,630', '--screenshot=public/og.png']);
});

if (!existsSync('public/og.png')) throw new Error('No se generó public/og.png');
console.log('✓ public/og.png generado');
