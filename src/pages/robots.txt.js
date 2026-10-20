import { absoluteUrl, withBase } from '../lib/url';

// robots.txt: todo se puede indexar salvo /og/ (solo sirve para generar la
// imagen de las redes), y se indica dónde está el sitemap.
export function GET({ site }) {
	const body = `User-agent: *
Allow: ${withBase('/')}
Disallow: ${withBase('/og/')}

Sitemap: ${absoluteUrl('/sitemap.xml', site).href}
`;
	return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
