// Cabeceras HTTP de seguridad: qué hacen y qué ataque frenan.

export const SECURITY_HEADERS = [
	{
		name: 'Content-Security-Policy',
		stops: 'XSS e inyección de recursos',
		what: 'Lista blanca de orígenes desde los que la página puede cargar scripts, estilos, imágenes o conexiones. Sin unsafe-inline, un script inyectado no se ejecuta.',
		example: "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'",
	},
	{
		name: 'Strict-Transport-Security',
		stops: 'Degradación a HTTP y robo de sesión en redes abiertas',
		what: 'Obliga al navegador a usar siempre HTTPS con este dominio durante el tiempo indicado, aunque alguien escriba http://.',
		example: 'max-age=63072000; includeSubDomains; preload',
	},
	{
		name: 'X-Content-Type-Options',
		stops: 'MIME sniffing',
		what: 'Impide que el navegador "adivine" el tipo de un archivo: un .txt subido por un usuario no se ejecutará como script.',
		example: 'nosniff',
	},
	{
		name: 'frame-ancestors (CSP)',
		stops: 'Clickjacking',
		what: 'Decide quién puede meter la página en un iframe. Sustituye a la antigua X-Frame-Options.',
		example: "frame-ancestors 'none'",
	},
	{
		name: 'Referrer-Policy',
		stops: 'Fuga de URLs con datos privados',
		what: 'Controla cuánto de la URL actual se envía a otros sitios al seguir un enlace.',
		example: 'strict-origin-when-cross-origin',
	},
	{
		name: 'Permissions-Policy',
		stops: 'Abuso de APIs sensibles por terceros',
		what: 'Desactiva funciones que la web no necesita (cámara, micrófono, geolocalización), también para los iframes que incruste.',
		example: 'camera=(), microphone=(), geolocation=()',
	},
];
