// Datos del panel "Sobre mí", extraídos del CV.

export const profile = {
	name: 'Guillermo Domínguez García',
	role: 'Desarrollador Full Stack',
	headline: 'Vue.js · Python · Ciberseguridad',
	location: 'Sevilla, España',
	yearsOfExperience: 5,
	languages: 'Español (nativo) · Inglés (A2)',
	summary:
		'Desarrollador web con 5 años de experiencia y una progresión constante: del bootcamp al front-end, y de ahí a la IA aplicada al desarrollo y la ciberseguridad. Me adapto con rapidez a áreas nuevas y las convierto en aportación real al equipo. Combino lo técnico con una buena base en diseño y UX/UI (Figma), lo que me permite cuidar la experiencia de usuario y colaborar con perfiles de diseño y producto.',

	links: [
		{ label: 'GitHub', href: 'https://github.com/GuilletDominguez' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/guillermo-dom%C3%ADnguez-garc%C3%ADa/' },
		{ label: 'Email', href: 'mailto:guilledg1@gmail.com' },
	],

	experience: [
		{
			role: 'Desarrollador web y seguridad',
			company: 'OpenWebinars',
			period: 'Dic 2021 – Oct 2026',
			tasks: [
				'Interfaces front-end con Vue.js y Astro sobre APIs REST.',
				'Desarrollo asistido por IA con Claude Code para crear, revisar y mejorar código.',
				'Integración de backends Django mediante API REST y OAuth.',
				'Pentesting sobre el entorno de la empresa y aplicación de prácticas de seguridad.',
				'Cumplimiento y documentación de la normativa ISO 27001.',
			],
		},
		{
			role: 'Desarrollador de proyectos web (Full Stack)',
			company: 'Don Bosco F5, Sevilla',
			period: 'Abr 2021 – Oct 2021',
			tasks: ['Proyectos web con HTML5, CSS3, JavaScript, Vue.js y Laravel.'],
		},
		{
			role: 'Atención al cliente',
			company: 'Grupo Konecta, Sevilla',
			period: 'Nov 2020 – Ene 2021',
			tasks: ['Atención telefónica a particulares y clientes de cartera, y ventas.'],
		},
	],

	skills: [
		{ group: 'Front-end', items: ['HTML5', 'CSS3', 'JavaScript', 'Vue.js', 'Pinia', 'Astro', 'Tailwind CSS', 'Bootstrap', 'Axios', 'Figma'] },
		{ group: 'Back-end', items: ['Python', 'Django (API REST, OAuth)', 'Laravel (inicial)'] },
		{ group: 'Herramientas', items: ['Git', 'Claude Code', 'GitHub Copilot', 'Cloudflare', 'Linux', 'Kali Linux'] },
		{ group: 'Integraciones', items: ['APIs REST', 'Brevo', 'Clientify', 'Google Analytics', 'ElevenLabs', 'Algolia'] },
		{ group: 'Seguridad', items: ['Pentesting', 'Buenas prácticas de seguridad', 'ISO 27001'] },
		{ group: 'Competencias', items: ['Proactividad', 'Autonomía', 'Trabajo en equipo', 'Empatía', 'Adaptación'] },
	],

	education: [
		{ title: 'Bootcamp de Desarrollo Full Stack', place: 'Don Bosco F5, Sevilla', period: '2021' },
		{ title: 'Bachillerato', place: 'I.E.S. Nervión, Sevilla', period: '2011 – 2014' },
	],

	certifications: [
		{
			group: 'Ciberseguridad',
			items: [
				'Onboarding en Ciberseguridad',
				'IA para Ciberseguridad',
				'Desarrollo Seguro',
				'Fundamentos legales de la ciberseguridad y protección de datos',
			],
		},
		{
			group: 'Normativa',
			items: [
				'Implementación de la ISO 27001',
				'Formación obligatoria ISO 27001',
				'Introducción al Esquema Nacional de Seguridad (ENS)',
				'Protección de datos y seguridad de la información (inicial y avanzado)',
			],
		},
		{
			group: 'Desarrollo',
			items: ['Refactoring y Clean Code', 'Vibe Coding: prototipado de apps con IA', 'Planificación y ejecución de proyectos ágiles'],
		},
	],
};
