# Arquitectura de Palantir

Guía para entender cómo está hecho el portfolio: qué hace cada tecnología, por qué se eligió y dónde está en el código.

## La idea en una frase

Una única página de **Astro** muestra un pueblo de 8 bits dibujado en un `<canvas>`. Cada edificio es una skill. Al entrar se abre un panel con una demo hecha **con ese framework concreto** (Vue, React, Svelte...) y, al lado, un cartel que explica las buenas prácticas que aplica.

```
┌──────────────────────── index.astro ────────────────────────┐
│                                                             │
│  Game.astro  ──(TypeScript plano, sin framework)──┐         │
│     └─ canvas: mapa, jugador, colisiones          │         │
│                                                   ▼         │
│                                    $activePanel (nanostores)│
│                                                   │         │
│  SkillPanel.astro  ◄──────────────────────────────┘         │
│     └─ <dialog>                                             │
│         ├─ <VueShop client:visible />   ← isla de Vue       │
│         ├─ (futuro) isla de React                           │
│         └─ cartel de buenas prácticas (HTML estático)       │
└─────────────────────────────────────────────────────────────┘
```

## Mapa de archivos

| Archivo | Qué hace |
| --- | --- |
| [src/pages/index.astro](../src/pages/index.astro) | La única página: monta el juego y el panel |
| [src/layouts/Layout.astro](../src/layouts/Layout.astro) | `<html>`, fuentes, meta tags |
| [src/styles/global.css](../src/styles/global.css) | Tailwind y los tokens de color de la paleta |
| [src/skills/registry.ts](../src/skills/registry.ts) | **Fuente única de datos**: nombre, colores, posición y buenas prácticas de cada skill, más los edificios que no son skills (`places`) |
| [src/data/](../src/data/) | Contenido del perfil (sacado del CV) y de las aficiones |
| [src/stores/ui.ts](../src/stores/ui.ts) | Estado compartido: qué panel está abierto |
| [src/components/Game.astro](../src/components/Game.astro) | Canvas, aviso de "pulsa A" y controles táctiles |
| [src/components/SkillPanel.astro](../src/components/SkillPanel.astro) | El `<dialog>` con las demos y los carteles |
| [src/components/AboutPanel.astro](../src/components/AboutPanel.astro) | Panel "Sobre mí" (hoja de personaje) |
| [src/components/HobbiesPanel.astro](../src/components/HobbiesPanel.astro) | Panel de Aficiones |
| [scripts/generate-statue.mjs](../scripts/generate-statue.mjs) | Convierte tu foto en el busto pixelado de la estatua |
| [src/game/](../src/game/) | Motor del juego (ver más abajo) |
| [src/skills/vue/](../src/skills/vue/) | La demo de Vue |

---

## 1. Astro: el esqueleto

**Qué es:** un framework que genera HTML en el servidor (o en el build) y **no manda JavaScript al navegador salvo que se lo pidas**.

**Por qué encaja aquí:** su arquitectura de **islas**. La página es HTML estático, y dentro puedes poner "islas" interactivas de *cualquier* framework: una de Vue al lado de una de React y otra de Svelte, cada una con su propio runtime. Es justo lo que pide un portfolio que quiere enseñar cada framework con su código real.

### Conceptos que se usan

- **Componentes `.astro`**: la parte de arriba (entre `---`) se ejecuta en el servidor; la de abajo es la plantilla HTML. Ver [Layout.astro](../src/layouts/Layout.astro).
- **`<script>` en un `.astro`**: Astro lo empaqueta como módulo y lo carga en el navegador. Así arranca el juego en [Game.astro](../src/components/Game.astro), sin ningún framework, porque un canvas no lo necesita.
- **Directivas `client:*`**: indican *cuándo* se hidrata una isla.
  - `client:load` → al cargar la página.
  - `client:visible` → cuando el elemento entra en pantalla. **Es la que usamos.**
  - `client:only` → solo en el cliente, sin HTML del servidor.

### El truco de `client:visible` dentro de un `<dialog>`

En [SkillPanel.astro](../src/components/SkillPanel.astro), cada demo está dentro de una `<section hidden>`. Un elemento oculto nunca "entra en pantalla", así que **Vue no se descarga hasta que abres su edificio**. Al abrir el panel, la sección se muestra, el `IntersectionObserver` de Astro la detecta y se hidrata. Resultado: la carga inicial solo incluye el juego, y cada framework se descarga bajo demanda.

Además, como `client:visible` también renderiza en el servidor, el contenido de las demos ya está en el HTML. Eso viene bien para el SEO aunque el visitante no las abra.

### Integraciones

Se añaden con `npx astro add <nombre>`, que instala el paquete y lo registra en [astro.config.mjs](../astro.config.mjs). Ahora mismo están `@astrojs/vue` y Tailwind (como plugin de Vite).

---

## 2. El motor del juego: TypeScript + Canvas 2D

Sin motores externos (Phaser, Kaplay...). Todo está en [src/game/](../src/game/):

| Archivo | Responsabilidad |
| --- | --- |
| [palette.ts](../src/game/palette.ts) | Paleta de 18 colores (basada en *Sweetie 16*) |
| [sprites.ts](../src/game/sprites.ts) | Genera todos los gráficos |
| [map.ts](../src/game/map.ts) | Construye el pueblo: suelo, árboles, edificios, zonas de interacción |
| [input.ts](../src/game/input.ts) | Teclado y controles táctiles unificados |
| [engine.ts](../src/game/engine.ts) | Bucle del juego: actualizar → dibujar |

### Sprites hechos con código

No hay ni un solo PNG. Los sprites se definen de dos formas:

**a) Cuadrículas de texto**, donde cada letra es un color de la paleta y `.` es transparente:

```ts
const POTION = [
  '...oo...',   // o = contorno
  '...qq...',   // q = gris (cristal)
  '..oqqo..',
  '.orrrro.',   // r = rojo (líquido)
  ...
];
```

`fromGrid()` recorre la cuadrícula y pinta un `fillRect(x, y, 1, 1)` por píxel en un canvas en memoria. Así están hechos el jugador, los árboles, los carteles y casi todos los iconos.

**b) Generación procedural**: la hierba, el camino y el agua usan un generador de números aleatorios **con semilla** (`rng(seed)`), así que salen "aleatorios" pero idénticos en cada carga. Los edificios se dibujan con rectángulos (tejado, tejas, ventanas, puerta) a partir de los colores de cada skill. El átomo de React se calcula pintando los píxeles que caen cerca de tres elipses rotadas.

El jugador tiene 4 direcciones × 3 fotogramas (quieto + 2 de paso). La izquierda no se dibuja: es la derecha volteada con `ctx.scale(-1, 1)`.

### Escalado pixel-perfect

El truco clásico para que el pixel art no salga borroso:

1. Todo se dibuja en un **buffer pequeño** a resolución nativa (16 px por tile).
2. Ese buffer se copia al canvas visible multiplicado por un **entero** (×2, ×3, ×5...).
3. `imageSmoothingEnabled = false` y `image-rendering: pixelated` evitan el suavizado.

La escala se calcula en `resize()` dentro de [engine.ts](../src/game/engine.ts). Tiene en cuenta el `devicePixelRatio` (pantallas retina) y nunca deja que el mapa quede más pequeño que la pantalla, para que no aparezcan franjas vacías en móviles altos.

### Bucle del juego

`requestAnimationFrame` llama a `frame()` unas 60 veces por segundo:

- **`update(dt)`**: mueve al jugador según `velocidad × dt` (los segundos desde el último fotograma), así va igual de rápido a 60 Hz que a 144 Hz. Después comprueba si está dentro de la zona de alguna puerta.
- **`render()`**: coloca la cámara centrada en el jugador (sin salirse del mapa), dibuja el suelo pre-renderizado y luego los objetos **ordenados por su coordenada Y inferior**. Ese orden (*y-sorting*) es lo que hace que el personaje pase *por delante* de un árbol si está debajo y *por detrás* si está encima.

### Colisiones

El personaje tiene una caja pequeña en los pies (10×5 px). Antes de moverse se comprueba si esa caja tocaría algún tile marcado como sólido en `map.solid`. El movimiento en X y en Y se prueba **por separado**: así, si chocas en diagonal contra una pared, sigues deslizándote a lo largo de ella.

### Entrada

[input.ts](../src/game/input.ts) unifica teclado (WASD, flechas, Enter, Espacio, E) y botones táctiles (Pointer Events) en el mismo estado. Las direcciones se guardan en el orden en que se pulsaron y **manda la última**, como en los juegos de Game Boy. La acción se "encola" y se consume una sola vez, para que mantener pulsada la tecla no abra el panel varias veces.

La cruceta táctil solo aparece en pantallas táctiles gracias a la media query `(pointer: coarse)`.

---

## 3. nanostores: el puente entre el juego y las islas

**Problema:** el juego es TypeScript plano y las demos son islas de distintos frameworks. Cada isla de Astro es una aplicación independiente, así que no pueden compartir un `ref` de Vue ni un contexto de React.

**Solución:** [nanostores](https://github.com/nanostores/nanostores), la librería que recomienda Astro para esto. Pesa menos de 1 KB, no depende de ningún framework y tiene adaptadores para Vue, React y Svelte.

```ts
// src/stores/ui.ts
export const $activePanel = atom<PanelId | null>(null);
```

- El juego hace `$activePanel.set('vue')` al pulsar A frente a la puerta.
- El panel hace `$activePanel.subscribe(...)` y abre el `<dialog>` con la sección correcta.
- El juego también está suscrito y **desactiva el movimiento** mientras haya un panel abierto.
- Al cerrar el diálogo, el estado vuelve a `null`.

---

## 4. El panel: `<dialog>` nativo

[SkillPanel.astro](../src/components/SkillPanel.astro) usa el elemento `<dialog>` de HTML con `showModal()`. Esto da gratis:

- Escape para cerrar.
- **Foco atrapado** dentro del diálogo (accesibilidad).
- El fondo inerte y oscurecido con `::backdrop`.
- `<form method="dialog">`: el botón de cerrar funciona sin JavaScript.

El cartel de buenas prácticas se genera en el servidor a partir de `skill.practices` del [registro](../src/skills/registry.ts): es HTML estático y no envía JS.

---

## 5. La demo de Vue: la tienda del pueblo

Ubicada en [src/skills/vue/](../src/skills/vue/). Es un catálogo de objetos con buscador, filtros por categoría y una mochila con presupuesto de 100 monedas que se guarda entre visitas.

```
vue/
├── app.ts                    ← instala Pinia en cada isla de Vue
├── items.ts                  ← datos y tipos
├── VueShop.vue               ← componente raíz
├── stores/cart.ts            ← store de Pinia
├── composables/
│   ├── useDebouncedRef.ts
│   └── useItemFilter.ts
└── components/
    ├── SearchBox.vue
    ├── CategoryTabs.vue
    ├── ItemCard.vue
    ├── CartPanel.vue
    └── PixelIcon.vue
```

### Buenas prácticas aplicadas (y dónde verlas)

**`<script setup lang="ts">`**. Es la forma moderna y más concisa de escribir componentes: todo lo que declaras está disponible en la plantilla, sin `return`.

**Props y eventos tipados** ([ItemCard.vue](../src/skills/vue/components/ItemCard.vue)):

```ts
defineProps<{ item: Item; affordable: boolean }>();
const emit = defineEmits<{ buy: [item: Item] }>();
```

Los tipos se comprueban en compilación y no generan código en tiempo de ejecución.

**Props desestructuradas con valor por defecto** ([PixelIcon.vue](../src/skills/vue/components/PixelIcon.vue)): `const { sprite, size = 32 } = defineProps<...>()`. Desde Vue 3.5 esto sigue siendo reactivo.

**`defineModel()`** ([SearchBox.vue](../src/skills/vue/components/SearchBox.vue), [CategoryTabs.vue](../src/skills/vue/components/CategoryTabs.vue)). Antes, para que un componente aceptara `v-model` había que declarar una prop `modelValue` y emitir `update:modelValue`. Con `defineModel()` es una sola línea:

```ts
const query = defineModel<string>({ required: true });
```

**`useId()`** (SearchBox). Genera ids únicos que **coinciden en servidor y cliente**, necesarios para enlazar `<label for>` con su `<input>` sin romper la hidratación.

**Composables** ([composables/](../src/skills/vue/composables/)). Son funciones `useAlgo()` que encapsulan lógica reactiva reutilizable; equivalen a los custom hooks de React.

- `useDebouncedRef(source, delay)` devuelve una copia del valor que se actualiza solo cuando dejas de escribir. Usa `onWatcherCleanup()` (Vue 3.5) para cancelar el temporizador anterior, sin variables globales.
- `useItemFilter(items, query, category)` acepta refs, getters o valores planos gracias a `MaybeRefOrGetter` + `toValue()`. Es el patrón recomendado para que un composable sea flexible.

**Pinia con *setup store*** ([stores/cart.ts](../src/skills/vue/stores/cart.ts)). El store se escribe igual que un componente:

| Concepto en Pinia | Cómo se escribe |
| --- | --- |
| state | `ref()` |
| getters | `computed()` |
| actions | funciones normales |

En el componente se usa `storeToRefs(cart)` para desestructurar sin perder la reactividad ([CartPanel.vue](../src/skills/vue/components/CartPanel.vue)).

**Pinia dentro de Astro** ([app.ts](../src/skills/vue/app.ts)). Cada isla es una app de Vue independiente. La opción `appEntrypoint` de `@astrojs/vue` (en [astro.config.mjs](../astro.config.mjs)) ejecuta ese archivo para cada app y ahí se instala Pinia.

**Hidratación sin desajustes**. El servidor no tiene `localStorage`. Si el carrito se leyera al crear el store, el HTML del servidor (vacío) no coincidiría con el del cliente (con objetos), y Vue daría un *hydration mismatch*. Por eso el carrito se recupera en `onMounted()`, que solo se ejecuta en el navegador. El `watch` que guarda los cambios solo se dispara cuando algo cambia, y eso solo ocurre en el cliente.

**`<TransitionGroup>`**. Las animaciones de entrada, salida y reordenación de la lista se declaran con clases CSS (`.grid-enter-from`, `.grid-move`...). El `steps(4)` en las transiciones les da el aspecto entrecortado de 8 bits.

**Estilos `scoped`**. Cada componente tiene su CSS aislado, pero usa los tokens globales (`var(--color-px-g)`) para mantener la paleta del juego.

**Accesibilidad**. Los filtros son `<input type="radio">` reales dentro de un `<fieldset>` (se manejan con teclado y los anuncian los lectores de pantalla). La barra de oro usa `role="meter"` y los botones solo con icono llevan `aria-label`.

**Reutilización entre juego y demo**. `PixelIcon.vue` convierte el **mismo formato de cuadrícula** que usa el canvas en un SVG con un `<rect>` por píxel, importando la misma paleta. Los objetos de la tienda están dibujados igual que el resto del pueblo.

---

## 6. Tailwind CSS v4

Configurado como plugin de Vite en [astro.config.mjs](../astro.config.mjs). En la v4 no hay `tailwind.config.js`: el tema se define en CSS con `@theme` ([global.css](../src/styles/global.css)):

```css
@theme {
  --color-px-g: #38b764;
  --font-pixel: "Press Start 2P", monospace;
}
```

Eso crea automáticamente utilidades como `bg-px-g`, `text-px-g` o `font-pixel`, y además expone las variables CSS para usarlas en los estilos `scoped` de Vue. **Una sola paleta para el canvas, Tailwind y los componentes.**

Se usa Tailwind en los `.astro` (layout, panel, HUD) y CSS con `scoped` en Vue, porque es lo idiomático en cada caso.

## 7. Fuentes

Se autoalojan con `@fontsource` (se importan en [Layout.astro](../src/layouts/Layout.astro)), así que no hay peticiones a Google Fonts (mejor privacidad y rendimiento):

- **Press Start 2P**: títulos y etiquetas, la fuente de 8 bits clásica.
- **VT323**: textos largos. Es pixelada pero mucho más legible.

El motor espera con `document.fonts.load()` a que la fuente esté lista antes de dibujar los nombres de los edificios en el canvas.

---

## 8. La estatua: de foto a pixel art con `sharp`

La estatua de la plaza es tu busto en tonos de piedra. No está dibujado a mano: lo genera [scripts/generate-statue.mjs](../scripts/generate-statue.mjs) a partir de [src/assets/foto.jpg](../src/assets/foto.jpg) y lo guarda como cuadrícula de texto en [src/game/statue.ts](../src/game/statue.ts), con el mismo formato que el resto de sprites.

```sh
npm run statue     # regenera src/game/statue.ts
```

**[sharp](https://sharp.pixelplumbing.com/)** es la librería de procesado de imágenes más usada en Node (Astro también la usa por dentro). El script la usa para recortar, redimensionar y leer los píxeles en bruto (`.raw()`). Es una dependencia de desarrollo: solo se ejecuta en tu máquina y no llega al navegador.

El proceso, en cuatro pasos:

1. **Quitar el fondo con *flood fill***. Partiendo de los bordes de la foto, se "inunda" todo píxel claro y poco saturado (el gris del fondo) que esté conectado. Lo que no se alcanza es la persona. Se hace a resolución completa, porque a 24 px el pelo y el fondo se confundirían. Las semillas no se ponen en el borde inferior porque ahí la camisa toca el borde de la foto.
2. **Reducir** el recorte de cabeza y hombros a 24×28 px con el filtro `lanczos3`, que conserva más detalle que una media simple.
3. **Pasar a tonos de piedra**: se calcula la luminancia de cada píxel, se normaliza el contraste usando los percentiles 4 y 96 (para que unos pocos píxeles extremos no lo aplanen) y se reparte en 4 grises de la paleta.
4. **Añadir el contorno**: todo píxel transparente que toque la silueta pasa a ser `o` (contorno oscuro), como en los sprites hechos a mano.

En el juego, [sprites.ts](../src/game/sprites.ts) coloca el busto sobre un pedestal dibujado con rectángulos y con una placa dorada.

## 9. Panel "Sobre mí" y Aficiones

**Contenido separado del marcado**. Los datos del CV viven en [src/data/profile.ts](../src/data/profile.ts) y los de las aficiones en [src/data/hobbies.ts](../src/data/hobbies.ts). Los componentes solo los recorren. Para cambiar un texto no hay que tocar HTML, y si más adelante se hace el "modo lista" accesible, podrá reutilizar los mismos datos.

**`astro:assets` y `<Image>`** ([AboutPanel.astro](../src/components/AboutPanel.astro)). La foto se importa como módulo (`import foto from '../assets/foto.jpg'`) y se pinta con el componente `<Image>` de Astro. En el build, Astro la redimensiona al tamaño indicado, la convierte a WebP y añade `width`/`height` (así no hay saltos de layout al cargar) y `loading="lazy"`. Las imágenes de `src/assets/` se optimizan; las de `public/` se sirven tal cual.

**HTML semántico con estética de RPG**:
- `<dl>` (lista de definiciones) para los atributos "Clase / Nivel / Origen" y los grupos de habilidades.
- `<ol>` para la experiencia ("Misiones completadas"), porque el orden importa.
- `<details>`/`<summary>` nativos para plegar las certificaciones: accesibles y sin JavaScript. La flecha gira con la variante `group-open:` de Tailwind.
- Los enlaces externos llevan `target="_blank"` con `rel="noopener noreferrer"`, para que la página abierta no pueda controlar la tuya mediante `window.opener`.

**Edificios que no son skills**. En [registry.ts](../src/skills/registry.ts), `places` es la lista de todos los edificios del mapa: las skills más los extra, como `hobbies`. El mapa y el motor recorren `places`, mientras que el contador de skills y los carteles de buenas prácticas siguen usando `skills`. El tipo `PlaceId` se amplía con cada lugar nuevo, así TypeScript avisa si falta algo (por ejemplo, el icono en `ICONS`).

**`PixelIcon.astro`**. Es la versión sin JavaScript del `PixelIcon.vue` de la tienda: el mismo formato de cuadrícula convertido en un SVG en el servidor. Así los iconos de las aficiones (pesa rusa, pala de pádel, claqueta, tele y casco) no cargan ningún framework.

## Cómo añadir una skill nueva

1. Rellena su entrada en [registry.ts](../src/skills/registry.ts): `practices`, `tagline` y `ready: true`. El edificio ya aparece en el mapa.
2. Instala la integración si hace falta: `npx astro add react`.
3. Crea la demo en `src/skills/<id>/`.
4. Móntala en [SkillPanel.astro](../src/components/SkillPanel.astro) con `client:visible`, igual que `VueShop`.

## Comandos

```sh
npm run dev           # servidor de desarrollo (o: npx astro dev --background)
npx astro check       # comprobación de tipos (.astro, .ts y .vue)
npm run build         # build estático en dist/
```

## Próximas fases

- **Fase 2:** React, Svelte y Angular (este último con `@analogjs/astro-angular` o Angular Elements, porque Astro no lo soporta de forma oficial).
- **Fase 3:** CSS puro (componentes sin JS), Ciberseguridad y Python (ejecutado en el navegador con Pyodide, que se carga solo al entrar).
- **Fase 4:** modo lista accesible sin juego, sonido, metadatos y despliegue.
