// Comprueba, después del build, que public/cv.pdf corresponde a los datos
// actuales del CV. El Markdown (/cv.md) se genera en cada build, pero el PDF se
// genera aparte (npm run cv): si alguien cambia el perfil, las certificaciones o
// las demos y no regenera el PDF, este script hace fallar el build.
// Uso: node scripts/check-cv.mjs   (se ejecuta solo con npm run build)

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Huella del CV con el que se generó el PDF (la escribe generate-cv.mjs). */
export const CV_HASH_FILE = 'scripts/cv-pdf.sha256';

function check() {
	const current = createHash('sha256').update(readFileSync('dist/cv.md')).digest('hex');
	const saved = existsSync(CV_HASH_FILE) ? readFileSync(CV_HASH_FILE, 'utf8').trim() : null;
	if (!existsSync('public/cv.pdf') || saved !== current) {
		console.error('✗ El PDF del CV no corresponde a los datos actuales. Ejecuta: npm run cv');
		process.exit(1);
	}
	console.log('✓ cv.pdf al día con los datos del CV');
}

// Solo se ejecuta al lanzarlo directamente, no al importarlo desde generate-cv.mjs
if (process.argv[1] === fileURLToPath(import.meta.url)) check();
