// Proyectos propios que aparecen en el edificio de Proyectos y en la versión
// rápida.

// Cada proyecto:
// - name: nombre del proyecto (el del repositorio).
// - description: qué hace, en una o dos frases.
// - stack: tecnologías principales, se muestran como etiquetas.
// - repo: URL del código. Opcional.
// - demo: URL de una demo en vivo. Opcional.
export const projects = [
	{
		name: 'header-auditor',
		description:
			'Herramienta de línea de comandos en Python que audita las cabeceras de seguridad HTTP de una web. Analiza sus valores (CSP, HSTS, cookies, CORS), da una nota de A+ a F con recomendaciones y se puede integrar en CI.',
		stack: ['Python', 'requests', 'pytest', 'GitHub Actions'],
		repo: 'https://github.com/GuilletDominguez/header-auditor',
	},
];
