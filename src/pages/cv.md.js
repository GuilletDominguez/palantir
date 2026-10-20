// /cv.md: el CV en Markdown, generado en cada build con los datos de la web.
import { buildCv, cvToMarkdown } from '../lib/cv';
import { CANONICAL_SITE } from '../lib/site';

// El CV siempre enlaza a la URL principal: el PDF es un archivo fijo y debe coincidir.
export function GET() {
	return new Response(cvToMarkdown(buildCv(CANONICAL_SITE)), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
}
