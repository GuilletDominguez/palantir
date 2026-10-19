// Comprueba, después del build, que la CSP de cada página permite todo lo que
// la página lleva en línea. Si algún <script> o <style> en línea no tiene su
// hash en la CSP, el navegador lo bloquearía: este script hace fallar el build
// antes de publicar algo roto (por ejemplo, tras actualizar React o Astro).
// Uso: node scripts/check-csp.mjs   (se ejecuta solo con npm run build)

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const pages = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? pages(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
	);
const sha256 = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;

let problems = 0;
for (const page of pages(DIST)) {
	const html = readFileSync(page, 'utf8');
	const csp = html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/i)?.[1];
	if (!csp) {
		console.error(`✗ ${page}: no tiene CSP`);
		problems++;
		continue;
	}
	const allowed = new Set([...csp.matchAll(/'(sha256-[^']+)'/g)].map((m) => m[1]));
	const blocks = [
		...[...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].map(
			(m) => ['script', m[1]],
		),
		...[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ['style', m[1]]),
	];
	for (const [kind, code] of blocks) {
		const hash = sha256(code);
		if (!allowed.has(hash)) {
			console.error(`✗ ${page}: <${kind}> en línea sin hash en la CSP (${hash})\n    ${code.trim().slice(0, 100)}`);
			problems++;
		}
	}
	console.log(`✓ ${page}: ${blocks.length} bloques en línea, todos permitidos`);
}

if (problems) {
	console.error(`\n${problems} problema(s) de CSP: el navegador bloquearía esos bloques.`);
	process.exit(1);
}
