// Genera public/cv.pdf imprimiendo la página /cv/ con Chrome.
// Uso: npm run cv   (necesita Google Chrome o Chromium instalado en el equipo)
//
// El PDF se sube al repositorio, porque el build de Cloudflare no tiene Chrome.
// Para que nunca se quede desactualizado, se guarda la huella (SHA-256) del CV
// en Markdown con el que se generó; scripts/check-cv.mjs la compara en cada
// build y lo hace fallar si los datos del CV han cambiado desde entonces.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chrome, withPreview } from './lib/chrome.mjs';
import { CV_HASH_FILE } from './check-cv.mjs';

await withPreview(async (base) => {
	chrome(`${base}/cv/`, ['--print-to-pdf=public/cv.pdf', '--no-pdf-header-footer']);
});

if (!existsSync('public/cv.pdf')) throw new Error('No se generó public/cv.pdf');
const hash = createHash('sha256').update(readFileSync('dist/cv.md')).digest('hex');
writeFileSync(CV_HASH_FILE, `${hash}\n`);
console.log(`✓ public/cv.pdf generado (huella del CV: ${hash.slice(0, 12)}…)`);
