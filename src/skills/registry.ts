// Fuente única de verdad para las skills: la usan el mapa del juego,
// los carteles del panel y (más adelante) el modo lista accesible.

export type SkillId = 'vue' | 'react' | 'svelte' | 'angular' | 'css' | 'cyber' | 'python';

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
		tagline: 'Próximamente.',
		roof: ['#73eff7', '#41a6f6'],
		tile: { x: 12, y: 7 },
		ready: false,
		practices: [],
	},
	{
		id: 'svelte',
		name: 'Svelte',
		tagline: 'Próximamente.',
		roof: ['#ef7d57', '#b13e53'],
		tile: { x: 24, y: 7 },
		ready: false,
		practices: [],
	},
	{
		id: 'angular',
		name: 'Angular',
		tagline: 'Próximamente.',
		roof: ['#b13e53', '#5d275d'],
		tile: { x: 33, y: 7 },
		ready: false,
		practices: [],
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
