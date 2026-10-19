// Fuente única de verdad para las skills: la usan el mapa del juego,
// los carteles del panel y (más adelante) el modo lista accesible.

export const REPO_URL = 'https://github.com/GuilletDominguez/palantir';

// Cada skill:
// - roof: colores del tejado del edificio en el mapa (claro, oscuro).
// - tile: esquina superior izquierda del edificio, en tiles.
// - practices: buenas prácticas que explica el cartel junto a la demo.
// - ready: false mientras el edificio está "en construcción".
// - summary, stack: qué hace la demo y con qué tecnologías (versión rápida).
// - source: carpeta del código en el repositorio.
export const skills = [
	{
		id: 'vue',
		name: 'Vue',
		tagline: 'La tienda de ingredientes del pueblo, hecha con Vue 3 + Pinia.',
		roof: ['#38b764', '#257179'],
		tile: { x: 3, y: 7 },
		ready: true,
		summary:
			'Tienda de ingredientes del juego: catálogo con buscador y filtros, carrito que se paga con el oro de la partida compartida y venta de pociones al 50 %.',
		stack: ['Vue 3.5', 'Pinia', 'JavaScript', '@nanostores/vue'],
		source: 'src/skills/vue',
		practices: [
			{
				title: '<script setup>',
				detail: 'Componentes concisos; las props se declaran con su tipo y si son obligatorias, y Vue avisa en desarrollo si llega algo inesperado.',
			},
			{
				title: 'defineModel()',
				detail: 'El buscador y los filtros exponen v-model directamente, sin boilerplate de prop + emit.',
			},
			{
				title: 'Composables',
				detail: 'useDebouncedRef y useItemFilter aíslan la lógica reutilizable fuera de los componentes.',
			},
			{
				title: 'Pinia + nanostores',
				detail:
					'El carrito es estado local en un setup store de Pinia; el oro y el inventario llegan de la partida compartida con useStore de @nanostores/vue.',
			},
			{
				title: 'SSR sin desajustes',
				detail:
					'La partida guardada se aplica tras onMounted: hasta entonces se pinta el estado inicial, igual que el HTML del servidor.',
			},
			{
				title: '<TransitionGroup>',
				detail: 'Las animaciones de entrada y salida de la lista se declaran, no se programan a mano.',
			},
		],
	},
	{
		id: 'react',
		name: 'React',
		tagline: 'El tablón de misiones del gremio, hecho con React 19.',
		roof: ['#73eff7', '#41a6f6'],
		tile: { x: 12, y: 7 },
		ready: true,
		summary:
			'Tablón de misiones: entregas las pociones que piden a cambio de oro y XP, y puedes publicar misiones propias contra un "servidor" simulado con respuestas optimistas.',
		stack: ['React 19', 'JavaScript (JSX)', 'CSS Modules', '@nanostores/react'],
		source: 'src/skills/react',
		practices: [
			{
				title: 'Store externo + Context',
				detail:
					'La partida vive en nanostores: useStore (useSyncExternalStore) se suscribe una vez en el Provider y la reparte por contexto. Con ssr: "initial" la hidratación coincide con el servidor.',
			},
			{
				title: 'Acciones de formulario',
				detail:
					'<form action> con useActionState para validar y devolver errores; useFormStatus desactiva el botón sin pasar props.',
			},
			{
				title: 'useOptimistic',
				detail:
					'La misión aparece al instante mientras el "servidor" responde, con la misma id que la guardada para no duplicarse. Si falla (prueba con un dragón), se deshace sola.',
			},
			{
				title: 'useDeferredValue',
				detail:
					'El buscador responde en cada tecla y el filtrado se procesa con prioridad baja; la lista se atenúa mientras tanto.',
			},
			{
				title: 'Estado derivado',
				detail:
					'El nivel, lo que falta para cada misión y los filtros se calculan durante el render: sin useEffect ni estado duplicado que sincronizar.',
			},
			{
				title: 'memo + CSS Modules',
				detail:
					'Las tarjetas solo se re-renderizan si cambia su misión o el inventario, y los estilos tienen nombres únicos por componente.',
			},
		],
	},
	{
		id: 'svelte',
		name: 'Svelte',
		tagline: 'El caldero del alquimista, hecho con Svelte 5.',
		roof: ['#ef7d57', '#b13e53'],
		tile: { x: 24, y: 7 },
		ready: true,
		summary:
			'Laboratorio de alquimia: mezclas ingredientes de tu inventario y el caldero calcula en vivo color, estadísticas, rareza y si la mezcla coincide con una receta.',
		stack: ['Svelte 5 (runas)', 'JavaScript', 'nanostores'],
		source: 'src/skills/svelte',
		practices: [
			{
				title: 'Runas: $state y $derived',
				detail:
					'El color, las estadísticas, la rareza y la receta que coincide con la mezcla se derivan solos de los ingredientes.',
			},
			{
				title: 'Estado en una clase .svelte.js',
				detail: 'La lógica del caldero vive fuera de los componentes, en una clase con campos reactivos y métodos.',
			},
			{
				title: '$props, callbacks y $bindable',
				detail: 'Props con valores por defecto, eventos como funciones (onpick) y bind:value bidireccional solo donde hace falta.',
			},
			{
				title: 'Snippets',
				detail:
					'{#snippet} y {@render} reutilizan marcado con parámetros sin crear componentes nuevos; children sustituye a los slots.',
			},
			{
				title: 'Movimiento y transiciones',
				detail: 'Tween.of anima las barras, y fly/scale con animate:flip mueven los ingredientes y el recetario.',
			},
			{
				title: 'Stores con $store',
				detail:
					'nanostores cumple el contrato de store de Svelte: $playerStore se suscribe y se limpia solo. Un $effect marca el montaje para hidratar sin desajustes.',
			},
		],
	},
	{
		id: 'css',
		name: 'CSS',
		tagline: 'La sastrería del pueblo: CSS puro, sin una sola línea de JavaScript.',
		roof: ['#41a6f6', '#3b5dc9'],
		tile: { x: 3, y: 18 },
		ready: true,
		summary:
			'Sastrería sin JavaScript: personalizas al héroe (ropa, sombrero, capa y pose) y el personaje del pueblo se viste igual.',
		stack: ['CSS moderno', ':has()', '@property', 'Container queries', '@layer + @scope'],
		source: 'src/skills/css',
		practices: [
			{
				title: ':has() como estado',
				detail: 'Los radios marcados cambian colores, accesorios y pose: el selector padre sustituye al JavaScript.',
			},
			{
				title: '@property',
				detail:
					'Las variables registradas como <color> se pueden animar: la ropa cambia de color a saltos con steps(4).',
			},
			{
				title: 'Container queries',
				detail: 'La sastrería se reorganiza según el ancho de su panel, no el de la pantalla.',
			},
			{
				title: '@layer + @scope',
				detail:
					'Capas para ordenar la cascada y @scope para aislar los estilos de forma nativa, con anidamiento sin preprocesador.',
			},
			{
				title: 'Contadores CSS',
				detail: 'Las estadísticas se calculan con counter-increment en cada prenda marcada y se pintan con counter().',
			},
			{
				title: 'HTML nativo',
				detail:
					'Acordeón exclusivo con <details name>, botón type="reset" y radios reales: accesible con teclado y lector de pantalla. El juego escucha el formulario y viste al héroe del pueblo.',
			},
		],
	},
	{
		id: 'cyber',
		name: 'Ciberseguridad',
		tagline: 'El cuartel de la guardia: seguridad web con Web Components nativos, sin framework.',
		roof: ['#566c86', '#333c57'],
		tile: { x: 12, y: 18 },
		ready: true,
		summary:
			'Tres estaciones: analizador de contraseñas con k-anonymity, laboratorio de XSS (innerHTML vs textContent vs saneado) y cabeceras de seguridad.',
		stack: ['Web Components', 'Shadow DOM', 'Web Crypto', 'JavaScript sin framework'],
		source: 'src/skills/cyber',
		practices: [
			{
				title: 'Nunca innerHTML',
				detail:
					'Todo el DOM se crea con createElement y textContent: lo que escribe el visitante nunca se interpreta como HTML.',
			},
			{
				title: 'Análisis inerte + lista blanca',
				detail:
					'DOMParser crea un documento donde nada se ejecuta; el saneado construye nodos nuevos solo con etiquetas permitidas. Probado contra XSS y mXSS clásicos.',
			},
			{
				title: 'Nada sale del navegador',
				detail:
					'La contraseña no se envía ni se guarda, se borra al cerrar y el corrector está desactivado (el de Chrome puede enviar el texto a un servidor).',
			},
			{
				title: 'k-anonymity',
				detail:
					'Have I Been Pwned solo necesita los 5 primeros caracteres del SHA-1 para decirte si una contraseña se ha filtrado.',
			},
			{
				title: 'Custom Elements + Shadow DOM',
				detail:
					'Componentes nativos con estilos aislados y una hoja compartida por adoptedStyleSheets. Se cargan con import() al entrar en el edificio.',
			},
			{
				title: 'Declarative Shadow DOM',
				detail:
					'Las tarjetas de cabeceras traen su sombra en el HTML del servidor: Shadow DOM sin una línea de JavaScript.',
			},
		],
	},
	{
		id: 'python',
		name: 'Python',
		tagline: 'La biblioteca del mago: Python 3.14 de verdad, ejecutándose en tu navegador con Pyodide.',
		roof: ['#ffcd75', '#3b5dc9'],
		tile: { x: 24, y: 18 },
		ready: true,
		summary:
			'Editor que ejecuta Python 3.14 real en el navegador, en un sandbox sin red. Uno de los ejemplos analiza tu partida del juego.',
		stack: ['Python 3.14', 'Pyodide (WebAssembly)', 'Web Workers', 'JavaScript'],
		source: 'src/skills/python',
		practices: [
			{
				title: 'Pyodide en un Web Worker',
				detail:
					'CPython compilado a WebAssembly corre fuera del hilo principal: ni un bucle infinito congela el pueblo.',
			},
			{
				title: 'Sandbox verificado',
				detail:
					'Antes de ejecutar nada se eliminan fetch, WebSocket, IndexedDB, eval y Function, y se comprueba. Si algo falla, no se ejecuta.',
			},
			{
				title: 'La página no se fía',
				detail:
					'Cada mensaje del worker se valida con un protocolo estricto y la salida se pinta como texto, nunca como HTML.',
			},
			{
				title: 'Límites',
				detail:
					'5000 caracteres de código, 10 segundos (luego se termina el worker y se crea otro) y 20 000 de salida.',
			},
			{
				title: 'Carga bajo demanda',
				detail: 'Unos 6 MB que solo se descargan al entrar, desde jsDelivr y con la versión fijada.',
			},
			{
				title: 'Python moderno',
				detail: 'f-strings, comprensiones, dataclasses, match y collections, sobre una copia de lectura de tu partida.',
			},
		],
	},
];

/** Edificios que no son skills (aparecen en el mapa pero no cuentan como skill). */

export const places = [
	...skills,
	{ id: 'hobbies', name: 'Aficiones', roof: ['#ef7d57', '#5d275d'], tile: { x: 33, y: 18 } },
	{ id: 'certs', name: 'Certificaciones', roof: ['#ffcd75', '#8f563b'], tile: { x: 33, y: 7 } },
	{ id: 'projects', name: 'Proyectos', roof: ['#b13e53', '#5d275d'], tile: { x: 42, y: 7 } },
];

export const BUILDING_W = 6;
export const BUILDING_H = 5;
