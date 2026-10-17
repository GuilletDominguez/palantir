// Fuente única de verdad para las skills: la usan el mapa del juego,
// los carteles del panel y (más adelante) el modo lista accesible.

export type SkillId = 'vue' | 'react' | 'svelte' | 'css' | 'cyber' | 'python';

export interface Skill {
	id: SkillId;
	name: string;
	tagline: string;
	/** Colores del tejado del edificio en el mapa (claro, oscuro). */
	roof: [string, string];
	/** Esquina superior izquierda del edificio, en tiles. */
	tile: { x: number; y: number };
	/** Buenas prácticas que explica el cartel junto a la demo. */
	practices: { title: string; detail: string }[];
	ready: boolean;
}

export const skills: Skill[] = [
	{
		id: 'vue',
		name: 'Vue',
		tagline: 'La tienda del pueblo, hecha con Vue 3 + Pinia.',
		roof: ['#38b764', '#257179'],
		tile: { x: 3, y: 7 },
		ready: true,
		practices: [
			{
				title: '<script setup> + TypeScript',
				detail: 'Props y eventos tipados con defineProps<T>() y defineEmits<T>(), sin runtime extra.',
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
				title: 'Pinia (setup store)',
				detail: 'El carrito vive en un store con estado, getters (computed) y acciones; storeToRefs mantiene la reactividad.',
			},
			{
				title: 'SSR sin desajustes',
				detail: 'El carrito guardado en localStorage se recupera en onMounted, así el HTML del servidor y el del cliente coinciden.',
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
		practices: [
			{
				title: 'useReducer + Context',
				detail: 'Un reductor puro con acciones tipadas (unión discriminada) y estado y dispatch en contextos separados para evitar renders de más.',
			},
			{
				title: 'Acciones de formulario',
				detail: '<form action> con useActionState para validar y devolver errores; useFormStatus desactiva el botón sin pasar props.',
			},
			{
				title: 'useOptimistic',
				detail: 'La misión aparece al instante mientras el "servidor" responde. Si falla (prueba con un dragón), se deshace sola.',
			},
			{
				title: 'useDeferredValue',
				detail: 'El buscador responde en cada tecla y el filtrado se procesa con prioridad baja; la lista se atenúa mientras tanto.',
			},
			{
				title: 'Estado derivado',
				detail: 'El oro y los filtros se calculan durante el render: sin useEffect ni estado duplicado que sincronizar.',
			},
			{
				title: 'memo + CSS Modules',
				detail: 'Las tarjetas solo se re-renderizan si cambian, y los estilos tienen nombres únicos por componente.',
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
		practices: [
			{
				title: 'Runas: $state y $derived',
				detail: 'El color, las estadísticas, la rareza y el nombre de la poción se derivan solos de los ingredientes.',
			},
			{
				title: 'Estado en una clase .svelte.ts',
				detail: 'La lógica del caldero vive fuera de los componentes, en una clase con campos reactivos y métodos.',
			},
			{
				title: '$props, callbacks y $bindable',
				detail: 'Props tipadas, eventos como funciones (onpick) y bind:value bidireccional solo donde hace falta.',
			},
			{
				title: 'Snippets',
				detail: '{#snippet} y {@render} reutilizan marcado con parámetros sin crear componentes nuevos; children sustituye a los slots.',
			},
			{
				title: 'Movimiento y transiciones',
				detail: 'Tween.of anima las barras, y fly/scale con animate:flip mueven los ingredientes y el recetario.',
			},
			{
				title: '$effect para lo externo',
				detail: 'Solo se usa para sincronizar con localStorage, y no se ejecuta en el servidor, así que el SSR es seguro.',
			},
		],
	},
	{
		id: 'css',
		name: 'CSS',
		tagline: 'Próximamente.',
		roof: ['#41a6f6', '#3b5dc9'],
		tile: { x: 3, y: 18 },
		ready: false,
		practices: [],
	},
	{
		id: 'cyber',
		name: 'Ciberseguridad',
		tagline: 'Próximamente.',
		roof: ['#566c86', '#333c57'],
		tile: { x: 12, y: 18 },
		ready: false,
		practices: [],
	},
	{
		id: 'python',
		name: 'Python',
		tagline: 'Próximamente.',
		roof: ['#ffcd75', '#3b5dc9'],
		tile: { x: 24, y: 18 },
		ready: false,
		practices: [],
	},
];

/** Edificios que no son skills (aparecen en el mapa pero no cuentan como skill). */
export type ExtraPlaceId = 'hobbies';
export type PlaceId = SkillId | ExtraPlaceId;

export type Place = Pick<Skill, 'name' | 'roof' | 'tile'> & { id: PlaceId };

export const places: Place[] = [
	...skills,
	{ id: 'hobbies', name: 'Aficiones', roof: ['#ef7d57', '#5d275d'], tile: { x: 33, y: 18 } },
];

export const BUILDING_W = 6;
export const BUILDING_H = 5;
