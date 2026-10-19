// Datos del panel "Sobre mí" y del CV descargable, con la redacción del CV.
// Las **palabras clave** van entre dobles asteriscos: se pintan en negrita en la
// web y en el PDF (componente Rich.astro) y quedan igual en el Markdown.

export const profile = {
	name: 'Guillermo Domínguez García',
	role: 'Desarrollador Full Stack',
	headline: 'Vue.js · Python · Ciberseguridad',
	location: 'Sevilla, España',
	yearsOfExperience: 5,
	summary:
		'Desarrollador web con 5 años de experiencia y una progresión constante: del bootcamp al front-end, y de ahí a la **IA aplicada al desarrollo** y la **ciberseguridad**. Me adapto con rapidez a áreas nuevas y las convierto en aportación real al equipo. Combino lo técnico con una buena base en **diseño y UX/UI** (Figma), lo que me permite cuidar la experiencia de usuario y colaborar con perfiles de diseño y producto. Trabajo bien en equipo, con autonomía y ganas de seguir creciendo.',

	links: [
		{ label: 'GitHub', href: 'https://github.com/GuilletDominguez' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/guillermodominguezgarcia' },
		{ label: 'Email', href: 'mailto:guilledg1@gmail.com' },
	],

	experience: [
		{
			role: 'Desarrollador web y seguridad',
			company: 'OpenWebinars',
			period: 'Dic 2021 – Oct 2026',
			tasks: [
				'Construcción de interfaces front-end con **Vue.js** y **Astro**, basadas en **APIs REST**.',
				'Desarrollo asistido por IA con **Claude Code** para acelerar la creación, revisión y mejora del código.',
				'Experiencia integrando backends **Django** mediante **API REST** y **OAuth**.',
				'Realización de **pentesting** sobre el entorno de la empresa y aplicación de prácticas de seguridad.',
				'Colaboración en tareas de cumplimiento y documentación de normativa **ISO 27001**.',
			],
		},
		{
			role: 'Desarrollador de proyectos web (Full Stack)',
			company: 'Don Bosco F5, Sevilla',
			period: 'Abr 2021 – Oct 2021',
			tasks: [
				'Desarrollo de varios proyectos web con distintas herramientas y tecnologías (HTML5, CSS3, JavaScript, Vue.js, Laravel).',
			],
		}
	],

	skills: [
		{
			group: 'Front-end',
			items: ['HTML5', 'CSS3', 'JavaScript', 'Vue.js', 'Pinia', 'Astro', 'Tailwind CSS', 'Bootstrap', 'Axios', 'Figma', 'React', 'Svelte'],
		},
		{ group: 'Back-end', items: ['Python', 'Django (integración vía API REST y OAuth)', 'Laravel (formación inicial)'] },
		{
			group: 'Herramientas',
			items: ['Git', 'Claude Code', 'GitHub Copilot (revisión de PRs)', 'Cloudflare', 'Linux', 'Kali Linux'],
		},
		{ group: 'Integraciones', items: ['APIs REST', 'Brevo', 'Clientify', 'Google Analytics', 'ElevenLabs', 'Algolia'] },
		{ group: 'Seguridad', items: ['Pentesting', 'Buenas prácticas de seguridad', 'Normativa ISO 27001'] },
		{ group: 'Competencias', items: ['Proactividad', 'Autonomía', 'Trabajo en equipo', 'Empatía', 'Adaptación'] },
	],

	education: [
		{ title: 'Bootcamp de Desarrollo Full Stack', place: 'Don Bosco F5, Sevilla', period: '2021' },
		{ title: 'Bachillerato', place: 'I.E.S. Nervión, Sevilla', period: '2011 – 2014' },
	],
};
