// sitemap.xml: las páginas que deben indexar los buscadores. Se genera en el
// build a partir de `site` (astro.config.mjs), así que sigue al dominio.
const PAGES = ['/', '/pueblo/'];

export function GET({ site }) {
	const urls = PAGES.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
