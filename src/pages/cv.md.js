// /cv.md: el CV en Markdown, generado en cada build con los datos de la web.
import { buildCv, cvToMarkdown } from '../lib/cv';

export function GET({ site }) {
	return new Response(cvToMarkdown(buildCv(site)), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
}
