# Arquitectura del portfolio

Guía para entender cómo está hecho el portfolio: qué hace cada tecnología, por qué se eligió y dónde está en el código.

**Todo el código es JavaScript moderno, sin TypeScript.** Lo que en otros proyectos comprueban los tipos al compilar aquí se hace de dos formas: la lógica importante está en funciones puras con tests (Vitest), y todo lo que llega de fuera (la partida guardada, los mensajes del worker de Python, el atuendo) se valida **en tiempo de ejecución** antes de usarlo.

## La idea en una frase

Una única página de **Astro** muestra un pueblo de 8 bits dibujado en un `<canvas>`. Cada edificio es una skill. Al entrar se abre un panel con una demo hecha **con ese framework concreto** (Vue, React, Svelte...) y, al lado, un cartel que explica las buenas prácticas que aplica.

```
┌──────────────────────── index.astro ────────────────────────┐
│                                                             │
│  Game.astro  ──(JavaScript plano, sin framework)──┐         │
│     ├─ canvas: mapa, jugador, colisiones          │         │
│     └─ HUD + notificaciones ◄── $player, eventos  │         │
│                                                   ▼         │
│                                    $activePanel (nanostores)│
│                                                   │         │
│  SkillPanel.astro  ◄──────────────────────────────┘         │
│     └─ <dialog>                                             │
│         ├─ <VueShop client:visible />    ← isla de Vue      │
│         ├─ <QuestBoard client:visible /> ← isla de React    │
│         ├─ <AlchemyLab client:visible /> ← isla de Svelte   │
│         └─ cartel de buenas prácticas (HTML estático)       │
│                                                             │
│  Las tres islas y el HUD comparten la partida ($player)     │
│  de src/state/ (ver sección 13).                            │
└─────────────────────────────────────────────────────────────┘
```

## Mapa de archivos

| Archivo | Qué hace |
| --- | --- |
| [src/pages/index.astro](../src/pages/index.astro) | La única página: monta el juego y el panel |
| [src/layouts/Layout.astro](../src/layouts/Layout.astro) | `<html>`, fuentes, meta tags |
| [src/styles/global.css](../src/styles/global.css) | Tailwind y los tokens de color de la paleta |
| [src/skills/registry.js](../src/skills/registry.js) | **Fuente única de datos**: nombre, colores, posición y buenas prácticas de cada skill, más los edificios que no son skills (`places`) |
| [src/data/](../src/data/) | Contenido del perfil (sacado del CV) y de las aficiones |
| [src/stores/ui.js](../src/stores/ui.js) | Estado compartido: qué panel está abierto |
| [src/state/](../src/state/) | **La partida compartida** entre las islas: catálogo, acciones, store, persistencia y eventos (sección 13) |
| [src/components/Game.astro](../src/components/Game.astro) | Canvas, HUD, notificaciones, aviso de "pulsa A" y controles táctiles |
| [src/components/SkillPanel.astro](../src/components/SkillPanel.astro) | El `<dialog>` con las demos y los carteles |
| [src/components/AboutPanel.astro](../src/components/AboutPanel.astro) | Panel "Sobre mí" (hoja de personaje) |
| [src/components/HobbiesPanel.astro](../src/components/HobbiesPanel.astro) | Panel de Aficiones |
| [scripts/generate-statue.mjs](../scripts/generate-statue.mjs) | Convierte tu foto en el busto pixelado de la estatua |
| [src/game/](../src/game/) | Motor del juego (ver más abajo) |
| [src/skills/vue/](../src/skills/vue/) | La demo de Vue |
| [src/skills/react/](../src/skills/react/) | La demo de React |
| [src/skills/svelte/](../src/skills/svelte/) | La demo de Svelte |
| [src/skills/css/](../src/skills/css/) | La demo de CSS (sin JavaScript) |
| [src/skills/cyber/](../src/skills/cyber/) | La demo de Ciberseguridad (Web Components) |
| [src/skills/python/](../src/skills/python/) | La demo de Python (Pyodide en un Web Worker) |
| [src/lib/dom.js](../src/lib/dom.js) | `h()`: crear DOM sin `innerHTML` (cuartel y biblioteca) |

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

Se añaden con `npx astro add <nombre>`, que instala el paquete y lo registra en [astro.config.mjs](../astro.config.mjs). Ahora mismo están `@astrojs/vue`, `@astrojs/react`, `@astrojs/svelte` y Tailwind (como plugin de Vite). Convivir tres frameworks en un mismo proyecto tiene sus trampas: ver la sección 12.

---

## 2. El motor del juego: JavaScript + Canvas 2D

Sin motores externos (Phaser, Kaplay...). Todo está en [src/game/](../src/game/):

| Archivo | Responsabilidad |
| --- | --- |
| [palette.js](../src/game/palette.js) | Paleta de 18 colores (basada en *Sweetie 16*) |
| [sprites.js](../src/game/sprites.js) | Genera todos los gráficos |
| [map.js](../src/game/map.js) | Construye el pueblo: suelo, árboles, edificios, zonas de interacción |
| [input.js](../src/game/input.js) | Teclado y controles táctiles unificados |
| [engine.js](../src/game/engine.js) | Bucle del juego: actualizar → dibujar |

### Sprites hechos con código

No hay ni un solo PNG. Los sprites se definen de dos formas:

**a) Cuadrículas de texto**, donde cada letra es un color de la paleta y `.` es transparente:

```js
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

La escala se calcula en `resize()` dentro de [engine.js](../src/game/engine.js). Tiene en cuenta el `devicePixelRatio` (pantallas retina) y nunca deja que el mapa quede más pequeño que la pantalla, para que no aparezcan franjas vacías en móviles altos.

### Bucle del juego

`requestAnimationFrame` llama a `frame()` unas 60 veces por segundo:

- **`update(dt)`**: mueve al jugador según `velocidad × dt` (los segundos desde el último fotograma), así va igual de rápido a 60 Hz que a 144 Hz. Después comprueba si está dentro de la zona de alguna puerta.
- **`render()`**: coloca la cámara centrada en el jugador (sin salirse del mapa), dibuja el suelo pre-renderizado y luego los objetos **ordenados por su coordenada Y inferior**. Ese orden (*y-sorting*) es lo que hace que el personaje pase *por delante* de un árbol si está debajo y *por detrás* si está encima.

### Colisiones

El personaje tiene una caja pequeña en los pies (10×5 px). Antes de moverse se comprueba si esa caja tocaría algún tile marcado como sólido en `map.solid`. El movimiento en X y en Y se prueba **por separado**: así, si chocas en diagonal contra una pared, sigues deslizándote a lo largo de ella.

### Entrada

[input.js](../src/game/input.js) unifica teclado (WASD, flechas, Enter, Espacio, E) y botones táctiles (Pointer Events) en el mismo estado. Las direcciones se guardan en el orden en que se pulsaron y **manda la última**, como en los juegos de Game Boy. La acción se "encola" y se consume una sola vez, para que mantener pulsada la tecla no abra el panel varias veces.

La cruceta táctil solo aparece en pantallas táctiles gracias a la media query `(pointer: coarse)`.

---

## 3. nanostores: el puente entre el juego y las islas

**Problema:** el juego es JavaScript plano y las demos son islas de distintos frameworks. Cada isla de Astro es una aplicación independiente, así que no pueden compartir un `ref` de Vue ni un contexto de React.

**Solución:** [nanostores](https://github.com/nanostores/nanostores), la librería que recomienda Astro para esto. Pesa menos de 1 KB, no depende de ningún framework y tiene adaptadores para Vue, React y Svelte.

```js
// src/stores/ui.js
export const $activePanel = atom<PanelId | null>(null);
```

- El juego hace `$activePanel.set('vue')` al pulsar A frente a la puerta.
- El panel hace `$activePanel.subscribe(...)` y abre el `<dialog>` con la sección correcta.
- El juego también está suscrito y **desactiva el movimiento** mientras haya un panel abierto.
- Al cerrar el diálogo, el estado vuelve a `null`.

El mismo mecanismo, a lo grande, conecta las tres demos en un único juego: ver la sección 13.

---

## 4. El panel: `<dialog>` nativo

[SkillPanel.astro](../src/components/SkillPanel.astro) usa el elemento `<dialog>` de HTML con `showModal()`. Esto da gratis:

- Escape para cerrar.
- **Foco atrapado** dentro del diálogo (accesibilidad).
- El fondo inerte y oscurecido con `::backdrop`.
- `<form method="dialog">`: el botón de cerrar funciona sin JavaScript.

El cartel de buenas prácticas se genera en el servidor a partir de `skill.practices` del [registro](../src/skills/registry.js): es HTML estático y no envía JS.

---

## 5. La demo de Vue: la tienda del pueblo

Ubicada en [src/skills/vue/](../src/skills/vue/). Es la tienda de ingredientes del juego: un catálogo con buscador y filtros por categoría, un carrito que se paga con el oro de la partida y un mostrador para vender pociones al 50 % de su precio.

```
vue/
├── app.js                    ← instala Pinia en cada isla de Vue
├── items.js                  ← ingredientes del catálogo + categorías de la tienda
├── VueShop.vue               ← componente raíz
├── stores/cart.js            ← store de Pinia (carrito local + partida compartida)
├── composables/
│   ├── useDebouncedRef.js
│   └── useItemFilter.js
└── components/
    ├── SearchBox.vue
    ├── CategoryTabs.vue
    ├── ItemCard.vue
    ├── CartPanel.vue
    ├── SellPanel.vue
    └── PixelIcon.vue
```

### Buenas prácticas aplicadas (y dónde verlas)

**`<script setup>`**. Es la forma moderna y más concisa de escribir componentes: todo lo que declaras está disponible en la plantilla, sin `return`.

**Props declaradas y validadas** ([ItemCard.vue](../src/skills/vue/components/ItemCard.vue)):

```js
const { item, missingGold } = defineProps({
  item: { type: Object, required: true },
  missingGold: { type: Number, required: true },
});
const emit = defineEmits(['buy']);
```

Cada prop dice qué tipo de valor espera y si es obligatoria. En desarrollo, Vue avisa en la consola si un componente padre le pasa algo que no encaja. `defineEmits` deja escrito qué eventos puede lanzar el componente.

**Props desestructuradas con valor por defecto** ([PixelIcon.vue](../src/skills/vue/components/PixelIcon.vue)): `size: { type: Number, default: 32 }`. Desde Vue 3.5, desestructurar el resultado de `defineProps` sigue siendo reactivo.

**`defineModel()`** ([SearchBox.vue](../src/skills/vue/components/SearchBox.vue), [CategoryTabs.vue](../src/skills/vue/components/CategoryTabs.vue)). Antes, para que un componente aceptara `v-model` había que declarar una prop `modelValue` y emitir `update:modelValue`. Con `defineModel()` es una sola línea:

```js
const query = defineModel({ required: true });
```

**`useId()`** (SearchBox). Genera ids únicos que **coinciden en servidor y cliente**, necesarios para enlazar `<label for>` con su `<input>` sin romper la hidratación.

**Composables** ([composables/](../src/skills/vue/composables/)). Son funciones `useAlgo()` que encapsulan lógica reactiva reutilizable; equivalen a los custom hooks de React.

- `useDebouncedRef(source, delay)` devuelve una copia del valor que se actualiza solo cuando dejas de escribir. Usa `onWatcherCleanup()` (Vue 3.5) para cancelar el temporizador anterior, sin variables globales.
- `useItemFilter(items, query, category)` acepta refs, getters o valores planos gracias a `MaybeRefOrGetter` + `toValue()`. Es el patrón recomendado para que un composable sea flexible.

**Pinia con *setup store*** ([stores/cart.js](../src/skills/vue/stores/cart.js)). El store se escribe igual que un componente:

| Concepto en Pinia | Cómo se escribe |
| --- | --- |
| state | `ref()` |
| getters | `computed()` |
| actions | funciones normales |

En el componente se usa `storeToRefs(cart)` para desestructurar sin perder la reactividad ([CartPanel.vue](../src/skills/vue/components/CartPanel.vue)).

**Pinia y nanostores juntos**. Cada uno se ocupa de lo suyo. El carrito (lo que *vas a* comprar) solo le importa a la tienda, así que es estado local en Pinia. El oro y el inventario son de la partida compartida: el store de Pinia los lee con `useStore($player)` de `@nanostores/vue`, que devuelve un `ref` de solo lectura. Para cambiarlos, «Pagar» llama a `game.checkout()`, que compra todas las líneas o ninguna. Si falla, el motivo aparece en el carrito.

**Pinia dentro de Astro** ([app.js](../src/skills/vue/app.js)). Cada isla es una app de Vue independiente. La opción `appEntrypoint` de `@astrojs/vue` (en [astro.config.mjs](../astro.config.mjs)) ejecuta ese archivo para cada app y ahí se instala Pinia.

**Hidratación sin desajustes**. El servidor no tiene `localStorage`, así que su HTML muestra la partida inicial. Si la isla pintara la partida guardada nada más hidratarse, el HTML del cliente no coincidiría con el del servidor y Vue daría un *hydration mismatch*. Por eso el store expone `player`, que devuelve el estado inicial hasta que `VueShop` llama a `cart.hydrate()` en `onMounted()`, que solo se ejecuta en el navegador. A partir de ahí, Vue pinta la partida real.

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

La estatua de la plaza es tu busto en tonos de piedra. No está dibujado a mano: lo genera [scripts/generate-statue.mjs](../scripts/generate-statue.mjs) a partir de [src/assets/foto.jpg](../src/assets/foto.jpg) y lo guarda como cuadrícula de texto en [src/game/statue.js](../src/game/statue.js), con el mismo formato que el resto de sprites.

```sh
npm run statue     # regenera src/game/statue.js
```

**[sharp](https://sharp.pixelplumbing.com/)** es la librería de procesado de imágenes más usada en Node (Astro también la usa por dentro). El script la usa para recortar, redimensionar y leer los píxeles en bruto (`.raw()`). Es una dependencia de desarrollo: solo se ejecuta en tu máquina y no llega al navegador.

El proceso, en cuatro pasos:

1. **Quitar el fondo con *flood fill***. Partiendo de los bordes de la foto, se "inunda" todo píxel claro y poco saturado (el gris del fondo) que esté conectado. Lo que no se alcanza es la persona. Se hace a resolución completa, porque a 24 px el pelo y el fondo se confundirían. Las semillas no se ponen en el borde inferior porque ahí la camisa toca el borde de la foto.
2. **Reducir** el recorte de cabeza y hombros a 24×28 px con el filtro `lanczos3`, que conserva más detalle que una media simple.
3. **Pasar a tonos de piedra**: se calcula la luminancia de cada píxel, se normaliza el contraste usando los percentiles 4 y 96 (para que unos pocos píxeles extremos no lo aplanen) y se reparte en 4 grises de la paleta.
4. **Añadir el contorno**: todo píxel transparente que toque la silueta pasa a ser `o` (contorno oscuro), como en los sprites hechos a mano.

En el juego, [sprites.js](../src/game/sprites.js) coloca el busto sobre un pedestal dibujado con rectángulos y con una placa dorada.

## 9. Panel "Sobre mí" y Aficiones

**Contenido separado del marcado**. Los datos del CV viven en [src/data/profile.js](../src/data/profile.js) y los de las aficiones en [src/data/hobbies.js](../src/data/hobbies.js). Los componentes solo los recorren. Para cambiar un texto no hay que tocar HTML, y si más adelante se hace el "modo lista" accesible, podrá reutilizar los mismos datos.

**`astro:assets` y `<Image>`** ([AboutPanel.astro](../src/components/AboutPanel.astro)). La foto se importa como módulo (`import foto from '../assets/foto.jpg'`) y se pinta con el componente `<Image>` de Astro. En el build, Astro la redimensiona al tamaño indicado, la convierte a WebP y añade `width`/`height` (así no hay saltos de layout al cargar) y `loading="lazy"`. Las imágenes de `src/assets/` se optimizan; las de `public/` se sirven tal cual.

**HTML semántico con estética de RPG**:
- `<dl>` (lista de definiciones) para los atributos "Clase / Nivel / Origen" y los grupos de habilidades.
- `<ol>` para la experiencia ("Misiones completadas"), porque el orden importa.
- `<details>`/`<summary>` nativos para plegar las certificaciones: accesibles y sin JavaScript. La flecha gira con la variante `group-open:` de Tailwind.
- Los enlaces externos llevan `target="_blank"` con `rel="noopener noreferrer"`, para que la página abierta no pueda controlar la tuya mediante `window.opener`.

**Edificios que no son skills**. En [registry.js](../src/skills/registry.js), `places` es la lista de todos los edificios del mapa: las skills más los extra, como `hobbies`. El mapa y el motor recorren `places`, mientras que el contador de skills y los carteles de buenas prácticas siguen usando `skills`.

**`PixelIcon.astro`**. Es la versión sin JavaScript del `PixelIcon.vue` de la tienda: el mismo formato de cuadrícula convertido en un SVG en el servidor. Así los iconos de las aficiones (pesa rusa, pala de pádel, claqueta, tele y casco) no cargan ningún framework.

## 10. La demo de React: el tablón de misiones del gremio

Ubicada en [src/skills/react/](../src/skills/react/). Es el tablón de misiones del juego. Cada misión pide pociones, y al entregarlas da oro y XP. Algunas exigen un nivel mínimo: se ven, pero no se pueden hacer hasta alcanzarlo. También se pueden publicar misiones propias, y la dificultad elegida fija cuántas pociones piden y cuánto pagan.

El "servidor" está simulado en [api.js](../src/skills/react/api.js): tarda casi un segundo en responder y **rechaza cualquier misión que mencione un dragón**, para poder ver qué pasa cuando una petición falla.

```
react/
├── QuestBoard.jsx            ← componente raíz (la isla)
├── QuestBoard.module.css     ← estilos (CSS Modules)
├── types.js · api.js
├── state/
│   └── QuestsContext.jsx     ← se suscribe a la partida y la reparte (usePlayer / useQuests)
└── components/
    ├── Filters.jsx · QuestList.jsx · QuestCard.jsx
    ├── QuestForm.jsx         ← acción de formulario + useOptimistic
    └── SubmitButton.jsx      ← useFormStatus
```

### Buenas prácticas aplicadas

**Store externo + Context** ([QuestsContext.jsx](../src/skills/react/state/QuestsContext.jsx)). La partida no es estado de React: vive en nanostores, compartida con las otras islas. El provider se suscribe **una sola vez** con `useStore($player)` de `@nanostores/react` y reparte el valor por contexto, así que ningún componente lee el store suelto. `useStore` se apoya en `useSyncExternalStore`, el hook que ofrece React para suscribirse a stores externos sin *tearing* (que dos componentes vean versiones distintas del estado en un mismo render).

La opción `ssr: 'initial'` resuelve la hidratación. Al hidratar, React usa el valor inicial del átomo, igual que en el servidor, y justo después vuelve a renderizar con la partida guardada. Así no hay *hydration mismatch*.

Los hooks `usePlayer()` y `useQuests()` lanzan un error claro si se usan fuera del provider. En React 19, `<Context>` sirve directamente como provider (ya no hace falta `.Provider`) y `use(Context)` sustituye a `useContext`.

Antes, el tablón usaba un `useReducer` propio. Su papel lo cumplen ahora las funciones puras de [src/state/actions.js](../src/state/actions.js), que siguen siendo `(estado, args) → nuevo estado` y se prueban sin React (sección 13).

**Acciones de formulario** ([QuestForm.jsx](../src/skills/react/components/QuestForm.jsx)). En React 19, `<form action={fn}>` acepta una función que recibe el `FormData`:

- `useActionState(accion, estadoInicial)` devuelve el estado que retorna la acción (aquí, el error y los valores a conservar si falla) y la función para pasar a `action`.
- Los campos son **no controlados** (`defaultValue`, sin `useState` por cada input). Cuando la acción termina bien, React resetea el formulario solo.
- `useFormStatus()` ([SubmitButton.jsx](../src/skills/react/components/SubmitButton.jsx)) lee si el `<form>` padre está enviándose, sin pasar props. Así se desactiva el botón y cambia a "Enviando…".

**`useOptimistic`** ([QuestBoard.jsx](../src/skills/react/QuestBoard.jsx)). La misión aparece en la lista **al instante**, parpadeando y con "guardando…", mientras el servidor responde. El estado optimista solo existe mientras dura la acción:

- si va bien, se sustituye por el estado real, que ya incluye la misión;
- si falla, React **descarta** la misión temporal. No hay que escribir código para deshacerlo: escribe "Matar al dragón" y lo verás.

Un detalle importante: la misión guardada llega al store mientras la acción aún no ha terminado, así que durante un instante existen a la vez la versión optimista y la real. Para que no salga duplicada, el id se genera en el formulario antes de llamar al servidor, y el reductor de `useOptimistic` ignora las misiones cuyo id ya está en la lista real.

Como el store es externo a React, no hace falta envolver la actualización en `startTransition`. Esa regla, la de volver a entrar en la transición después de un `await`, solo aplica al estado propio de React.

**`useDeferredValue`**. El buscador actualiza el input en cada tecla (prioridad alta), mientras que el filtrado usa una copia "diferida" del texto que React procesa cuando tiene tiempo. Mientras las dos no coinciden, la lista se atenúa (`stale`). Con 5 misiones no se nota, pero con miles es lo que evita que escribir vaya a trompicones.

**Estado derivado, sin `useEffect`**. El nivel, las misiones pendientes, lo que le falta a cada misión y la lista filtrada se **calculan durante el render** a partir del estado. Guardarlos en otro `useState` y sincronizarlos con un `useEffect` es un antipatrón muy común (ver *You Might Not Need an Effect* en la documentación de React).

**`memo`** ([QuestCard.jsx](../src/skills/react/components/QuestCard.jsx)). Las tarjetas solo se re-renderizan si cambia su misión, su estado (hecha, bloqueada) o el inventario. Funciona por dos motivos:

- las misiones son objetos estables, porque vienen del catálogo o del store y las acciones no las copian;
- las tarjetas no reciben callbacks nuevos en cada render, porque importan `game.completeQuest` directamente de `src/state`.

Tampoco se re-renderizan al cambiar los filtros si su misión sigue visible.

**`useId`** para enlazar cada `<label>` con su input con ids que coinciden en servidor y cliente. Los errores usan `aria-invalid`, `aria-describedby` y `role="alert"` para que los lectores de pantalla los anuncien.

**CSS Modules** ([QuestBoard.module.css](../src/skills/react/QuestBoard.module.css)). Al importar `styles from './X.module.css'`, cada clase se renombra a algo único (`._card_wv65f_4`), así que no puede chocar con los estilos de Vue, Svelte o Tailwind. Los estados visuales se controlan con atributos `data-*` (`data-done`, `data-difficulty`) en vez de concatenar clases.

## 11. La demo de Svelte: el caldero del alquimista

Ubicada en [src/skills/svelte/](../src/skills/svelte/). La estantería muestra los ingredientes de tu inventario, con cuántos te quedan. Echas hasta 4 en el caldero, y este calcula en vivo el color de la mezcla, las estadísticas, la rareza y si coincide con alguna receta. Solo una mezcla que coincide con una receta se puede preparar: entonces se descuentan los ingredientes y la poción va al inventario compartido. El recetario marca qué recetas puedes hacer ya, y al pulsar una la carga en el caldero.

```
svelte/
├── AlchemyLab.svelte         ← componente raíz (la isla)
├── cauldron.svelte.js        ← clase con el estado reactivo
├── ingredients.js            ← re-exporta los ingredientes del catálogo + nombres de stats
└── components/
    ├── IngredientShelf.svelte  ← snippets + callback props
    ├── CauldronPot.svelte      ← children (snippet) + style:
    ├── StatBar.svelte          ← Tween
    ├── NameField.svelte        ← $bindable
    ├── RecipeBook.svelte       ← recetas disponibles (estado derivado)
    └── PixelIcon.svelte
```

### Buenas prácticas aplicadas

**Runas** (Svelte 5). La reactividad se declara explícitamente:

| Runa | Para qué |
| --- | --- |
| `$state(valor)` | Estado reactivo. Es **profundo**: `array.push()` actualiza la vista |
| `$derived(expr)` / `$derived.by(fn)` | Valor calculado a partir de otros; se recalcula solo cuando cambian sus dependencias |
| `$effect(fn)` | Efecto secundario tras renderizar (solo en el navegador) |
| `$props()` | Las props del componente (con valores por defecto al desestructurar) |
| `$bindable()` | Marca una prop que admite `bind:` desde el padre |

**Estado en una clase `.svelte.js`** ([cauldron.svelte.js](../src/skills/svelte/cauldron.svelte.js)). En Svelte 5 las runas funcionan fuera de los componentes, en archivos `.svelte.js`. La forma idiomática de agrupar estado y lógica es una clase:

```js
export class Cauldron {
  contents = $state([]);
  stats = $derived.by(() => /* suma los efectos */);
  color = $derived(mixColors(this.contents.map(...)));
  rarity = $derived(this.total >= 9 ? 'legendaria' : ...);
  add(ingredient) { this.contents.push(...); }
}
```

El componente solo hace `const lab = new Cauldron()` y lee `lab.color`, `lab.name`... Es el equivalente a un store de Pinia o a un custom hook, pero sin librería.

El caldero es **estado local**: echar un ingrediente no lo gasta todavía. La estantería resta lo que ya hay en el caldero (`inventario − lab.countOf(id)`) para no dejarte usar más de lo que tienes. Los ingredientes solo se descuentan de la partida al llamar a `game.brew()`. Así, el inventario compartido nunca queda en un estado a medias.

`lab.recipe` es otro `$derived`: busca la receta cuyos ingredientes coinciden exactamente con la mezcla. Si no hay ninguna, `lab.blocked` explica por qué no se puede preparar.

**Eventos como callbacks** ([IngredientShelf.svelte](../src/skills/svelte/components/IngredientShelf.svelte)). En Svelte 5, `createEventDispatcher` queda obsoleto: los eventos son props de tipo función (`onpick`), igual que `onclick` en los elementos HTML.

**`$bindable` y `bind:value`** ([NameField.svelte](../src/skills/svelte/components/NameField.svelte)). El padre escribe `<NameField bind:value={lab.customName} />` y el nombre fluye en los dos sentidos. Por defecto las props van solo de padre a hijo; el enlace bidireccional hay que pedirlo explícitamente. `$props.id()` genera un id estable entre servidor y cliente para el `<label>`.

**Snippets**. `{#snippet effects(ingredient)}…{/snippet}` define un trozo de marcado con parámetros que se pinta con `{@render effects(ingredient)}`. Sirve para reutilizar marcado dentro de un componente sin crear otro archivo. El contenido entre etiquetas de un componente llega como el snippet `children` ([CauldronPot.svelte](../src/skills/svelte/components/CauldronPot.svelte)): es el sustituto de los `<slot>` de Svelte 4.

**Directivas de estilo**. `style:--liquid={color}` pasa el color derivado como variable CSS, y el CSS del caldero hace el resto (`color-mix()` para las sombras y las burbujas). `class:bubbling={...}` añade o quita una clase según una condición.

**Movimiento** ([StatBar.svelte](../src/skills/svelte/components/StatBar.svelte)). `Tween.of(() => value, { duration, easing })` sigue un valor y expone en `.current` el valor intermedio animado: las barras crecen suavemente en vez de saltar.

**Transiciones y animaciones**:
- `in:fly` / `out:scale` animan la entrada y la salida de los ingredientes del caldero;
- `animate:flip` desliza los elementos que cambian de posición en un `{#each}` con clave;
- `{#key toast?.id}` vuelve a crear el aviso de "poción añadida" (o el motivo del fallo) para que la transición se repita cada vez.

**Stores con `$store`** ([AlchemyLab.svelte](../src/skills/svelte/AlchemyLab.svelte)). Svelte no necesita adaptador para nanostores. Cualquier objeto con un método `subscribe` que devuelva la función para darse de baja cumple el *contrato de store* de Svelte, y los átomos de nanostores lo cumplen. Basta con importar el átomo y escribir `$playerStore`: Svelte se suscribe y se da de baja solo. Hay que renombrarlo al importarlo (`$player as playerStore`), porque Svelte reserva el prefijo `$` para esta sintaxis.

**`$effect` para hidratar sin desajustes**. Un `$effect` solo se ejecuta en el navegador, después de montar. Aquí únicamente pone `mounted = true`. Hasta entonces, `player` es el estado inicial, el mismo que pintó el servidor. Después pasa a ser `$playerStore`, con la partida guardada.

## 12. Tres frameworks en un mismo proyecto

Astro permite mezclar frameworks, pero hay que conocer dos problemas que han aparecido aquí.

**1. React debe saber qué archivos son suyos**. React (y Preact o Solid) usan JSX, y su plugin de Vite procesa por defecto todos los `.js` y `.jsx`. En [astro.config.mjs](../astro.config.mjs) se limita con `react({ include: ['**/skills/react/**/*.jsx'] })`. El patrón tiene que acabar en `*.jsx`: con `**/skills/react/**` a secas también entraba el `.module.css`, y el build fallaba al intentar leer CSS como si fuera JavaScript.

**2. Conflicto entre Vue y el Fast Refresh de React** (solo en desarrollo). `@vitejs/plugin-vue` compila el código de los `.vue` reutilizando la configuración `oxc` de Vite, y el plugin de React mete ahí la opción de Fast Refresh. Resultado: el código de Vue en el servidor llamaba a `$RefreshSig$` (una función de React que solo existe en el navegador) y la página daba error 500. Como es una incompatibilidad entre los dos plugins, lo resuelve un pequeño plugin propio, `isolateVueFromReactRefresh()` en [astro.config.mjs](../astro.config.mjs), que entrega a Vue una vista de la configuración con Fast Refresh desactivado mediante un `Proxy`. A React no le afecta y en producción no hace falta (`apply: 'serve'`).

**3. APIs que solo existen en "contextos seguros"**. `crypto.randomUUID()` funcionaba en `localhost`, pero al abrir la web desde otro PC por `http://192.168.x.x` las demos de React y Svelte dejaban de responder. El navegador solo expone algunas APIs en **contextos seguros**, que son HTTPS o `localhost` (se puede comprobar con `isSecureContext`). Además de `randomUUID`, les pasa al portapapeles, a la geolocalización y a los service workers, entre otras. En producción con HTTPS habría funcionado, pero para no depender de eso los ids salen de una función propia en [src/lib/id.js](../src/lib/id.js).

Para ver el servidor de desarrollo desde otro equipo de la misma red: `npx astro dev --background --host`, y entrar por la IP que muestra.

**Cuánto pesa cada cosa** (build de producción, JS sin comprimir):

| Paquete | Tamaño | Cuándo se descarga |
| --- | --- | --- |
| Motor del juego | ~17 KB | Al cargar la página |
| Demo de Vue + runtime de Vue | ~8 KB + ~84 KB | Al entrar en su edificio |
| Demo de React + React DOM | ~6 KB + ~220 KB | Al entrar en su edificio |
| Demo de Svelte (incluye su runtime) | ~13 KB + ~45 KB | Al entrar en su edificio |

Gracias a `client:visible` dentro de secciones ocultas, quien solo pasea por el pueblo descarga unos 17 KB de JavaScript. Se nota también la diferencia de filosofía: Svelte compila los componentes y su runtime es pequeño, mientras que React lleva un runtime grande.

## 13. La economía compartida entre las islas

Las tres demos forman un único juego: compras ingredientes en la tienda (Vue), preparas pociones en el laboratorio (Svelte) y las entregas en el tablón (React) a cambio de oro y XP, con las que vuelves a la tienda. El HUD del juego muestra el oro, el nivel y la XP, y avisa de lo que pasa con notificaciones al estilo Pokémon.

**El problema**. Cada isla de Astro es una aplicación independiente que se hidrata por separado y en momentos distintos (`client:visible`). No hay un árbol de componentes común donde poner un contexto o un store. Además, el HTML de las islas se genera en el servidor, donde no hay `localStorage`. Las opciones que valoré y por qué elegí nanostores están en el [ADR 001](adr/001-estado-compartido-entre-islas.md).

```
src/state/
├── catalog.js       ← datos estáticos: ingredientes, pociones, recetas, misiones, niveles
├── actions.js       ← funciones puras + wrappers que las aplican al store (game.*)
├── economy.js       ← el átomo $player, el nivel derivado ($level) y la carga/guardado
├── persistence.js   ← localStorage: validar, migrar, leer, escribir, sincronizar pestañas
├── events.js        ← bus de eventos (on / off / emit)
└── actions.test.js  ← tests con Vitest
```

### Un átomo y acciones puras

Toda la partida es **un único átomo**, `$player` (oro, XP, inventario, misiones completadas y misiones publicadas). Cada acción sustituye el objeto entero, así que ninguna isla puede ver un estado a medio actualizar. El nivel no se guarda: `$level` es un `computed` que se calcula a partir de la XP.

Ningún componente hace `$player.set()`. La lógica está en **funciones puras** con la misma forma:

```js
buyItem(state, 'herb', 2)  // → { ok: true, state: nuevoEstado }
brew(state, 'life')        // → { ok: false, reason: 'Faltan ingredientes: 1 × Hierba lunar.' }
```

Si algo no cuadra (falta oro, faltan pociones, la misión ya está hecha o el nivel no llega), devuelven el motivo y el estado original no cambia. Así es imposible acabar con oro negativo o misiones duplicadas. Cada isla enseña `reason` con su propio estilo.

Los **wrappers** (`game.buy()`, `game.brew()`, `game.completeQuest()`…) son la única puerta de entrada al store. Aplican la función pura y, si sale bien, guardan el nuevo estado y emiten el evento correspondiente. `level:up` se detecta comparando el nivel antes y después de entregar una misión.

### La economía no se puede romper

Una poción vale el doble de lo que cuestan sus ingredientes, y se vende al 50 %. Venderla devuelve justo lo invertido, así que comprar, preparar y vender no genera oro infinito: el oro solo sale de las misiones. La partida empieza con 20 de oro, que da para la Poción de Vida (7) y completar la primera misión en menos de un minuto.

### Cómo lee cada framework el store

| Isla | Cómo se suscribe | Cómo evita el *hydration mismatch* |
| --- | --- | --- |
| Vue | `useStore($player)` de `@nanostores/vue`, dentro del store de Pinia | `cart.hydrate()` en `onMounted` |
| React | `useStore($player, { ssr: 'initial' })` de `@nanostores/react` | `getServerSnapshot` de `useSyncExternalStore` |
| Svelte | `$playerStore`, el contrato de store nativo | `mounted = true` en un `$effect` |
| Juego | `$player.subscribe()` y `events.on()` | No hidrata: el script actualiza el HTML del HUD |

La idea es la misma en los tres casos: **hasta montarse, cada isla pinta el estado inicial**, que es exactamente lo que generó el servidor. Después pasa a la partida guardada. Si no se hiciera así, Vue avisaría en consola de que el HTML no coincide y React lanzaría un error de hidratación.

### Persistencia

La partida se guarda en `localStorage` con la clave `portfolio:save`. Lo hace el `onMount` del átomo, que nanostores ejecuta cuando el store recibe su primer suscriptor:

- en el servidor no hay `window`, así que no hace nada y el SSR usa el estado inicial;
- en el navegador carga la partida, se suscribe para guardarla en cada cambio y escucha el evento `storage` para **sincronizar pestañas** (si juegas en dos, las dos se actualizan).

Todo lo que se lee se trata como `unknown` y se valida en `parseSave()`. Si el JSON está roto, el oro es negativo o la versión es desconocida, se descarta la partida y se empieza de cero sin errores. Las entradas sueltas que no son válidas (un objeto que ya no existe, una misión repetida…) se eliminan sin perder el resto. El campo `version` y la tabla `MIGRATIONS` permiten cambiar el formato más adelante sin romper las partidas guardadas.

Todos los accesos a `localStorage` van dentro de `try/catch`: en modo privado, o con la cuota llena, la partida sigue funcionando en memoria.

### El HUD y las notificaciones

[src/game/hud.js](../src/game/hud.js) pinta el oro, el nivel y una barra de XP en una capa HTML encima del canvas. Usa el mismo `pixel-frame` y la misma fuente que el aviso de "pulsa A". Elegí HTML en vez de dibujarlo en el canvas por tres motivos: se adapta al tamaño de pantalla sin escalar ×5 en escritorio, no tapa el aviso en móvil y los lectores de pantalla oyen los mensajes gracias a `aria-live`.

Las notificaciones escuchan el bus de eventos y salen en una caja blanca con efecto de máquina de escribir y una flecha `▼` que parpadea. Como las acciones ocurren dentro del `<dialog>` modal, que tapa el juego, los mensajes **esperan en cola** hasta que cierras el panel. Si se repiten seguidos, se agrupan («¡Has creado Poción de Vida ×3!»).

### Tests

[actions.test.js](../src/state/actions.test.js) prueba con Vitest cada acción en su caso feliz y en todos sus casos de error. También prueba:

- el ciclo completo comprar → preparar → entregar desde una partida nueva;
- que todas las misiones del catálogo se pueden completar en orden;
- que los wrappers emiten los eventos (incluido `level:up`) y no tocan nada cuando la acción falla;
- que `parseSave()` rechaza o limpia partidas corruptas.

Como las funciones son puras, los tests no montan ningún componente ni necesitan navegador.

## 14. La demo de CSS: la sastrería

Ubicada en [src/skills/css/](../src/skills/css/). Personalizas al héroe del pueblo: túnica, calzas, pelo, sombrero, capa y pose (quieto, andando o saltando). Una ficha muestra las estadísticas que da cada prenda. **No hay ni una línea de JavaScript**: es un componente de Astro sin directiva `client:*`, y toda la interactividad está en [tailor.css](../src/skills/css/tailor.css).

```
css/
├── Tailor.astro              ← componente raíz: un <form> con radios
├── tailor.css                ← toda la lógica
├── wardrobe.js               ← opciones y sprites (solo se usa en el servidor)
└── components/
    ├── ChoiceGroup.astro     ← <fieldset> de radios
    ├── HeroPreview.astro     ← el héroe en SVG
    └── SpecSheet.astro       ← ficha con <details name>
```

### Buenas prácticas aplicadas

**El sprite se genera en el servidor**. [HeroPreview.astro](../src/skills/css/components/HeroPreview.astro) reutiliza las piezas del jugador del juego (`HEAD_DOWN`, `BODY_FRONT`, `LEGS_FRONT` de [sprites.js](../src/game/sprites.js)) y las convierte en un SVG. Para reducir nodos, cada tramo de píxeles iguales de una fila se une en un solo `<rect>` (`toRuns()`).

Las partes fijas (piel, contorno) llevan su color en el HTML. Las que se pueden cambiar solo llevan una clase (`.shirt`, `.hair`…), y el CSS las pinta con una variable: `fill: var(--shirt)`.

**`:has()` como estado**. Cada opción es un `<input type="radio">` de verdad. El selector padre lee cuál está marcado y cambia una variable de toda la demo:

```css
.tailor:has([name='shirt'][value='r']:checked) {
  --shirt: var(--color-px-r);
}
```

Con la misma idea se muestran u ocultan los sombreros, la capa y los fotogramas de las piernas. Estas reglas de estado van **fuera de `@scope`** a propósito. Escribirlas como `:scope:has(...)` dentro de `@scope` era la combinación más nueva de la demo y la más arriesgada: si un navegador pinta bien el estado inicial pero no recalcula ese `:has()` al marcar un radio, el héroe no cambia. El `.tailor:has(...)` clásico funciona en Chrome desde la versión 105. Es el patrón del *checkbox hack* de toda la vida, pero sin depender de que el input esté justo antes del elemento que cambia.

**`@property`**. Una variable CSS normal no se puede animar, porque el navegador no sabe qué tipo de dato contiene. Al registrarla con `syntax: '<color>'` sí admite `transition`, y con `steps(4)` el cambio de color va a saltos, como en un juego de 8 bits.

**Animación por fotogramas**. Al andar se repite el ciclo de piernas 0 → 1 → 0 → 2, el mismo que usa el motor del juego. Cada grupo de piernas tiene su `@keyframes` de opacidad con `steps(1)`, que cambia de golpe en vez de fundir. Al saltar, la figura sube y la sombra del suelo se estrecha. Con `prefers-reduced-motion` todo queda quieto.

**Container queries**. `container: tailor / inline-size` convierte la demo en un contenedor. La regla `@container tailor (min-width: 36rem)` pone el probador y el vestuario en dos columnas según el ancho **del panel**, no el de la pantalla. Así la demo funciona igual dentro del diálogo que en cualquier otra parte.

**`@layer` y `@scope`**. `@layer tailor.base, tailor.hero, tailor.choices` declara el orden de la cascada: una regla de una capa posterior gana a una anterior sin importar la especificidad. `@scope (.tailor)` limita a la demo los selectores de los estilos estáticos. Es el aislamiento nativo de CSS, el mismo efecto que el `scoped` de Vue o los CSS Modules, pero sin herramientas. Todo va con **anidamiento nativo** (`&:hover`, `@container` dentro de una regla), sin Sass.

**Contadores CSS**. La ficha suma las estadísticas sin JavaScript. Cada radio marcado hace `counter-increment: mag 3`, y la ficha lo pinta con `content: counter(mag)`. Los contadores siguen el **orden del documento**, así que el vestuario va antes que la ficha en el HTML, y `order: -1` coloca el probador delante solo visualmente.

**El héroe del juego se viste igual**. Lo que eliges en la sastrería lo lleva puesto el personaje del pueblo, y se conserva al recargar. La sastrería sigue sin enviar JavaScript: es **el juego**, que ya está cargado, el que escucha su formulario.

- [src/game/outfit.js](../src/game/outfit.js) es la fuente única de las prendas: colores, sprites de sombreros y capa, y `dress()`, que viste una cuadrícula de 16 × 16 añadiendo la capa (detrás, o delante si mira hacia arriba) y el sombrero. Lo usan tanto el SVG de la sastrería como el canvas.
- [src/game/outfit-sync.js](../src/game/outfit-sync.js) escucha `change` y `reset` del formulario, guarda el atuendo en el store `$outfit` ([src/stores/outfit.js](../src/stores/outfit.js)) y, al cargar, marca los radios con el atuendo guardado.
- El motor se suscribe a `$outfit` y regenera los fotogramas del jugador con `playerFrames(outfit)`. `fromGrid()` acepta una paleta que sustituye a las letras variables del sprite (`k` pelo, `b` túnica, `n` calzas, `C`/`D` capa).
- Lo que llega de `localStorage` pasa por `parseOutfit()`: cualquier valor que no sea una prenda conocida vuelve al de por defecto.

**Dos trampas que aparecieron al hacerla**:

1. **El orden de `@layer` lo fija la primera aparición.** En el bundle, `tailor.css` llegaba antes que Tailwind, así que las capas `tailor.*` quedaban *por debajo* de `base`, el preflight de Tailwind. Ese preflight pone `opacity: 1` en todos los `input`, y los radios aparecían encima del texto de los botones. Por eso `tailor.css` empieza declarando el orden completo, `@layer theme, base, components, utilities, tailor;`, que funciona cargue antes quien cargue.
2. **Un *query container* aísla los contadores.** `container-type` aplica *style containment*, y con él los contadores no cruzan el borde del contenedor. Con `counter-reset` en el propio `.tailor`, las estadísticas se quedaban siempre en 1. La solución es reiniciarlos en `.layout`, un hijo del contenedor.

**HTML nativo antes que JavaScript**:
- `<details name="tailor-spec">` forma un acordeón exclusivo: al abrir uno se cierran los demás.
- `<button type="reset">` devuelve el formulario a los valores iniciales.
- Los radios se manejan con las flechas del teclado, y `label:has(:focus-visible)` muestra dónde está el foco.

## 15. La demo de Ciberseguridad: el cuartel de la guardia

Ubicada en [src/skills/cyber/](../src/skills/cyber/). Son tres estaciones para mirar y probar, no retos que resolver:

1. **Analizador de contraseñas**: estima los bits de entropía, detecta patrones y calcula cuánto se tardaría en adivinarla. Además explica la *k-anonymity* de Have I Been Pwned con el SHA-1 real de lo que escribes.
2. **XSS**: el mismo comentario insertado de tres formas. Con `innerHTML` se marca lo que se ejecutaría; con `textContent` se ve como texto; y saneado con lista blanca queda solo el formato permitido.
3. **Cabeceras de seguridad**: qué hace cada una y qué ataque frena.

Está hecho **sin framework**, con Web Components nativos:

```
cyber/
├── Barracks.astro              ← estructura + carga diferida de los componentes
├── headers.js                  ← datos de las cabeceras
├── components/HeaderCard.astro ← Declarative Shadow DOM
├── elements/
│   ├── base.js                 ← PixelElement, h() y hoja compartida
│   ├── password-analyzer.js    ← <password-analyzer>
│   └── xss-lab.js              ← <xss-lab>
└── lib/                        ← lógica pura, con tests
    ├── password.js · sha1.js · html.js
    └── *.test.js
```

### Seguridad de los campos de texto

Es una demo de seguridad en la que el visitante escribe HTML y contraseñas, así que las protecciones se diseñaron antes que la interfaz:

- **Nunca `innerHTML`.** Todo el DOM sale de `h()` ([base.js](../src/skills/cyber/elements/base.js)), que usa `createElement`, y los strings siempre entran como nodos de texto. Además, `h()` rechaza atributos `on*`: los eventos se enlazan con `addEventListener`.
- **Análisis inerte.** El HTML del usuario se analiza con `DOMParser`, que crea un documento sin contexto de navegación: no ejecuta scripts ni carga imágenes, así que un `onerror` nunca se dispara. El árbol de la primera columna se pinta como **texto**.
- **Saneado por lista blanca** ([html.js](../src/skills/cyber/lib/html.js)). No se limpia el árbol del usuario, sino que se construye uno **nuevo** copiando solo lo permitido:
  - unas pocas etiquetas de formato;
  - `href` solo con `http:`, `https:` o `mailto:`, y entonces con `target="_blank" rel="noopener noreferrer nofollow"`;
  - `<script>`, `<style>`, `<svg>`, `<math>` y `<noscript>` se eliminan con todo su contenido.
  
  Los tests lo prueban contra los vectores clásicos, incluidos dos de *mutation XSS* (`<noscript>` y `<math><style>`). En un proyecto real se usaría DOMPurify o la Sanitizer API.
- **Límites**: `maxlength` en los campos (128 y 400 caracteres) y profundidad máxima al recorrer el HTML.
- **La contraseña no sale del navegador**: no se envía ni se guarda, y se borra al cerrar el panel. Lleva `spellcheck="false"` y `autocomplete="off"`, porque el corrector mejorado de Chrome puede enviar el texto a un servidor.
- **Compatible con una CSP estricta**: no hay atributos `style` en línea creados por JS. La sangría del árbol se pone con `style.setProperty()`, que una CSP sin `unsafe-inline` sí permite.

### Buenas prácticas de Web Components

**Custom Elements + Shadow DOM**. `<password-analyzer>` y `<xss-lab>` extienden `PixelElement`, que crea la sombra y adopta los estilos. Las variables CSS sí atraviesan la sombra, así que la paleta del juego llega sin hacer nada. Dos detalles de la spec:

- en el constructor no se pueden tocar los atributos del propio elemento, así que el primer render va en `connectedCallback()`;
- `define()` comprueba `customElements.get()` antes de registrar, porque la recarga en caliente importa el módulo dos veces.

**`adoptedStyleSheets`**. La hoja común se crea **una vez** como `CSSStyleSheet` y la comparten todas las sombras. Si cada componente llevara su propio `<style>`, el navegador analizaría el mismo CSS varias veces.

**Carga diferida**. [Barracks.astro](../src/skills/cyber/Barracks.astro) observa el cuartel con un `IntersectionObserver` y hace `import('./elements')` cuando entra en pantalla, que es lo que hace `client:visible` por dentro. Mientras tanto, `:not(:defined)` muestra «Cargando…».

**Declarative Shadow DOM** ([HeaderCard.astro](../src/skills/cyber/components/HeaderCard.astro)). Un `<template shadowrootmode="open">` dentro de `<sec-card>` se convierte en su sombra **al parsear el HTML**, sin JavaScript; el elemento ni siquiera está registrado. El contenido va en el *light DOM* y se proyecta con `<slot>`, así lo indexan los buscadores y lo leen los lectores de pantalla. Aparecieron cuatro trampas:

- `<style is:inline>`: sin él, Astro saca el `<style>` de la plantilla, y tiene que quedarse dentro de la sombra.
- `<slot is:inline>`: sin él, Astro lo toma por uno de sus slots de componente y no lo pinta.
- **Los estilos de fuera ganan a `::slotted()`.** El preflight de Tailwind (`h4 { font-size: inherit }`) pisaba el tamaño de los títulos, así que el contenido proyectado se estiliza desde fuera.
- **El `box-sizing` global no entra en la sombra.** El `height: 100%` del `<article>` más su padding desbordaba la tarjeta. Ahora el anfitrión es un grid y el `article` se estira solo.

**SHA-1 con alternativa propia** ([sha1.js](../src/skills/cyber/lib/sha1.js)). Se usa Web Crypto cuando existe. Como solo está en contextos seguros (el mismo problema que `randomUUID`, sección 12), hay una implementación propia en JavaScript probada con los vectores oficiales. Have I Been Pwned usa SHA-1 para identificar contraseñas, pero ni SHA-1 ni SHA-256 sirven para guardarlas: para eso están Argon2id o bcrypt, y la demo lo dice.

## 16. La demo de Python: la biblioteca del mago

Ubicada en [src/skills/python/](../src/skills/python/). Es un editor con seis scripts de ejemplo que ejecutan **Python 3.14 de verdad** en el navegador, gracias a [Pyodide](https://pyodide.org): CPython compilado a WebAssembly. El primer ejemplo, «El mago analiza tu partida», recibe una copia de la partida de la economía compartida (sección 13) y la resume en una tabla.

```
python/
├── Library.astro         ← editor y consola (HTML del servidor) + carga diferida
├── library-client.js     ← controlador: worker, límites, salida
├── python.worker.js      ← carga Pyodide, aísla el worker y ejecuta
├── protocol.js           ← forma de los mensajes y su validación (con tests)
└── examples.js           ← los scripts de ejemplo
```

### Cómo funciona

- **Carga bajo demanda.** Igual que el cuartel, un `IntersectionObserver` hace `import()` del controlador cuando la biblioteca entra en pantalla. El controlador crea el worker, y el worker descarga Pyodide desde jsDelivr: unos 6 MB comprimidos (el `.wasm` y la biblioteca estándar), que después quedan en la caché del navegador.
- **Versión fijada.** La URL lleva la versión exacta (`v314.0.7`): una URL sin versión podría servir otro código mañana. Como `import()` en un worker no admite *Subresource Integrity*, la defensa completa sería alojar Pyodide en el propio dominio. Lo dejo como mejora, por el peso que añadiría al despliegue.
- **Web Worker de tipo módulo.** `new Worker(new URL('./python.worker.js', import.meta.url), { type: 'module' })` es la sintaxis que Vite reconoce para empaquetar el worker. En [astro.config.mjs](../astro.config.mjs), `worker: { format: 'es' }` hace que salga como módulo ES; si no, sale como IIFE.
- **Un espacio de nombres nuevo por ejecución**, con `contexto` dentro: una copia en JSON de la partida, con nombres legibles. Python no puede tocar el store.
- **Python no se puede interrumpir desde fuera** sin `SharedArrayBuffer`, que exige aislamiento entre orígenes (cabeceras COOP/COEP). Por eso «Parar» y el límite de 10 s **terminan el worker y crean otro**.

### Seguridad del editor

Aquí el visitante ejecuta código de verdad, así que hay varias capas:

1. **Aislamiento por diseño.** Un Web Worker no tiene DOM, `document`, cookies ni `localStorage`. Aunque el código intente algo, no puede tocar la página ni leer los datos del sitio.
2. **Sandbox sin red, verificado.** Tras cargar Pyodide (que sí necesita la red para descargarse), `lockDown()` redefine como no configurables, para que no se puedan restaurar:
   - `fetch`, `XMLHttpRequest`, `WebSocket`, `WebTransport`, `EventSource`, `indexedDB`, `caches`, `BroadcastChannel` y `Worker`;
   - `eval`, `Function` y los constructores de funciones async y generadoras, porque permiten ejecutar JavaScript a partir de un texto, y con él un `import()` dinámico a cualquier URL;
   - `setTimeout` y `setInterval` con un string, que también evalúan texto.
   
   Después **comprueba** cada bloqueo, y si algo sigue disponible lanza un error: el worker avisa y **no ejecuta nada** (*fail closed*).
3. **La página no se fía del worker.** El código del visitante puede llamar a `js.postMessage()` y fabricar mensajes, así que [protocol.js](../src/skills/python/protocol.js) valida la forma exacta de cada uno y copia solo los campos esperados. Los mensajes de una ejecución anterior se ignoran. La salida se pinta con nodos de texto: un `print("<img onerror=…>")` se ve tal cual.
4. **Límites**: 5000 caracteres de código, 10 s de ejecución y 20 000 caracteres de salida. Pasado el límite de salida, se para la ejecución, porque un `while True: print()` llenaría la página.

**El agujero que encontré al probarlo.** La primera versión precargaba `pyodide.http` antes de aislar el worker, y ese módulo **guarda su propia referencia a `fetch`**. Mi verificación miraba el global, que estaba bien bloqueado, pero `pyfetch()` seguía usando la copia: la petición salió (y solo falló por CORS). La lección es que **aislar no es solo borrar globales**: cualquier referencia capturada antes sobrevive. Ahora solo se precargan módulos puros de la biblioteca estándar. El ejemplo «Intento de escapar» lo comprueba en vivo: intenta `fetch`, `eval` con `import()`, `new Function`, un `pyfetch` a la propia web y un `loadPackage`, y todo sale bloqueado.

## 17. La versión rápida (`/resumen/`)

Para quien no tiene tiempo (o no puede) jugar: [src/pages/resumen.astro](../src/pages/resumen.astro) muestra todo el portfolio en una página normal:

- una ficha por demo con qué hace, la tecnología, cómo está hecha y el enlace al código, más un desplegable para probarla ahí mismo;
- la arquitectura, «Sobre mí», certificaciones, proyectos y aficiones.

Se llega desde un botón fijo arriba a la derecha del pueblo, desde un enlace de salto (el primer elemento que recibe el foco con el teclado), desde la bienvenida y desde el `<noscript>`.

**Una sola fuente de datos.** Las fichas salen de [registry.js](../src/skills/registry.js), igual que los carteles del pueblo; para eso cada skill tiene ahora `summary`, `stack` y `source`. «Sobre mí», «Aficiones», certificaciones y proyectos son los mismos componentes que se ven en los edificios. Cambiar algo en un sitio lo cambia en los dos.

**Las demos solo se descargan al abrirlas.** Cada una está dentro de un contenedor con `hidden`, y el botón «Probar la demo» (con `aria-expanded`) lo muestra. Lo oculto no entra en pantalla, así que `client:visible` y la carga diferida del cuartel y la biblioteca esperan. La economía se comparte igual que en el pueblo, porque es el mismo `localStorage`.

**Trampa: no usar `<details>` para esto.** Era la primera idea, pero Chrome oculta el contenido de un `<details>` cerrado con `content-visibility`, y el `IntersectionObserver` de `client:visible` no vuelve a avisar al abrirlo: Svelte se hidrataba, pero Vue y React no. Con `hidden` funciona igual que las secciones del diálogo del pueblo.

**Aviso del servidor de desarrollo.** Al añadir una página nueva que importa más islas, Vite puede volver a pre-empaquetar dependencias con el servidor en marcha. La página pide entonces versiones antiguas (`504 Outdated Optimize Dep`) y las islas no se hidratan. No es un fallo del código, porque en el build de producción todo funciona. Se arregla reiniciando con `npx astro dev --force`.

## 18. Certificaciones y Proyectos

Dos edificios que no son skills (como Aficiones), declarados en `places` de [registry.js](../src/skills/registry.js):

- **Certificaciones**, en el hueco frente a Aficiones. Muestra [Certifications.astro](../src/components/Certifications.astro): una galería agrupada (Ciberseguridad, Normativa, Desarrollo) con los diplomas reales.
  - **Datos** en [src/data/certifications.js](../src/data/certifications.js): título, tipo, horas, fecha, grupo, imagen y la URL pública de verificación de OpenWebinars. «Sobre mí» lee la misma lista.
  - **Imágenes**: los PNG originales (2339 px, unos 400 KB cada uno) se convirtieron con `sharp` a WebP de 1600 px (unos 50 KB) en [src/assets/certificaciones/](../src/assets/certificaciones/). `<Image>` de Astro genera además las miniaturas de 320 y 480 px con `srcset`, así que la galería descarga poco.
  - **Visor sin JavaScript** con la **Popover API**: la miniatura es un `<button popovertarget="…">` y el diploma grande un `<div popover>`. El navegador lo pone en la capa superior (por encima del `<dialog>` del pueblo), lo cierra con Esc o pulsando fuera y devuelve el foco al botón. **Trampa**: los popovers se centran con `inset: 0; margin: auto`, pero el preflight de Tailwind pone `margin: 0` a todo, y el visor salía pegado arriba a la izquierda. Hay que restaurar `margin: auto`.
  - Antes de publicarlos se revisó que los diplomas no llevaran datos personales sensibles. Solo incluyen el nombre, el curso, las horas, la fecha y el código de verificación, que es público a propósito.
- **Proyectos**, en una columna nueva: el mapa pasó de 42 a 51 tiles de ancho (`MAP_W`), nueve por columna de edificios. Muestra [Projects.astro](../src/components/Projects.astro), que lee [src/data/projects.js](../src/data/projects.js). Está vacío a propósito y enseña «Próximamente»: **añadir un proyecto es añadir una entrada a ese array**, y aparece en el edificio y en la versión rápida.

El mapa no necesitó más cambios: `buildMap()` recorre `places` y crea para cada edificio el camino hasta la carretera, el cartel y la zona para entrar. Los emblemas (medalla y martillo) son cuadrículas de 12 × 12 en `ICONS` de [sprites.js](../src/game/sprites.js).

## 19. Seguridad del despliegue y metadatos

La web se publica en **Cloudflare Pages** (`https://guillermo-dominguez.pages.dev`), y esa URL está en `site` de [astro.config.mjs](../astro.config.mjs). La canónica, el sitemap, `robots.txt` y la imagen para redes salen de ahí: cambiar de dominio es cambiar una línea.

### Content-Security-Policy

Hay **dos políticas**, porque la página y el worker de Python son documentos distintos:

1. **La de las páginas**, en un `<meta>` que genera Astro (`security.csp`).
   - Astro calcula el hash de cada script y estilo en línea que produce él mismo, así que **los scripts no necesitan `'unsafe-inline'`**. Solo se ejecuta lo que viene de la propia web (`'self'`) o tiene su hash.
   - Además: `object-src 'none'`, `base-uri 'none'` y `form-action 'self'`.
   - Una concesión consciente: `style-src-attr 'unsafe-inline'`. Vue y Svelte escriben atributos `style=""` en el HTML del servidor, y a un atributo no se le puede poner hash. El riesgo es inyección de CSS, no de scripts. Astro avisa al compilar de que `'self'` no se aplica a esos atributos, que es justo lo que se quiere.
2. **La del worker de Python**, como cabecera en [public/_headers](../public/_headers). Un worker no hereda la CSP de la página: usa la de la respuesta de su propio archivo. Solo puede cargar código de `cdn.jsdelivr.net` y compilar WebAssembly (`'wasm-unsafe-eval'`). Aunque alguien saltara el sandbox de la sección 16, no podría conectar con ningún otro sitio.

**Tres cosas que no tenían hash y cómo se resolvieron**:
- **Los `<style is:inline>` del Shadow DOM declarativo** del cuartel. Astro no calcula hashes de lo marcado `is:inline`. Los estilos pasaron a [sec-card.css](../src/skills/cyber/components/sec-card.css), enlazado con `<link>` dentro de la plantilla de la sombra, que se permite como `'self'`.
- **Un script en línea de React 19.** Tras un `<form action={función}>` (el de «Publicar misión»), React añade un fragmento que guarda los envíos hechos *antes* de hidratarse para repetirlos después. Es código fijo de React, así que su hash está en `scriptDirective.hashes`.
- **Shiki**, el resaltador de código de Markdown, pinta con estilos en línea. El proyecto no tiene Markdown, así que está desactivado (`markdown.syntaxHighlight: false`).

**La comprobación que lo protege**: `npm run build` ejecuta después [scripts/check-csp.mjs](../scripts/check-csp.mjs). Recorre cada página generada, calcula el hash de cada `<script>` y `<style>` en línea y **hace fallar el build** si alguno no está permitido por la CSP de su página. Si una actualización de React o Astro cambiara uno de esos fragmentos, el despliegue se pararía con el hash nuevo en el mensaje, en vez de publicar una web rota. Los `<script type="application/ld+json">` se excluyen, porque son datos y el navegador no los ejecuta.

### Cabeceras HTTP ([public/_headers](../public/_headers))

Cloudflare Pages lee este archivo al desplegar. Son las mismas cabeceras que explica el cuartel, y el cuartel lo dice:

| Cabecera | Para qué |
| --- | --- |
| `Content-Security-Policy: frame-ancestors 'none'` | Clickjacking. Va como cabecera porque `frame-ancestors` no funciona en un `<meta>` |
| `Strict-Transport-Security` | Siempre HTTPS, durante un año |
| `X-Content-Type-Options: nosniff` | El navegador no adivina tipos de archivo |
| `Referrer-Policy: strict-origin-when-cross-origin` | A otros sitios solo se les dice el origen |
| `Permissions-Policy` | Cámara, micrófono, geolocalización, pagos… desactivados |
| `Cross-Origin-Opener-Policy: same-origin` | Otra ventana no puede manipular esta con `window.opener` |
| `Cache-Control: immutable` en `/_astro/*` | Los archivos llevan hash en el nombre: caché de un año |

**Cómo se probó**: un servidor estático pequeño que imita a Cloudflare (sirve `dist/` y aplica `_headers`) y un recorrido con Chrome por DevTools por todos los edificios. El recorrido analiza una contraseña, ejecuta Python, abre un diploma y despliega las seis demos de la versión rápida. Por el camino registra cada violación de CSP, tanto de la página como de los workers. Resultado: ninguna.

### Metadatos

- **Open Graph y Twitter Card** en [Layout.astro](../src/layouts/Layout.astro): la tarjeta que aparece al compartir el enlace en LinkedIn, WhatsApp o X.
- **La imagen** ([public/og.png](../public/og.png), 1200 × 630) es la página interna [/og/](../src/pages/og.astro), dibujada con los sprites del juego. [scripts/generate-og.mjs](../scripts/generate-og.mjs) (`npm run og`) la fotografía con Chrome. Se sube al repo, así que el build de Cloudflare no necesita Chrome. `/og/` lleva `noindex` y está excluida en `robots.txt`.
- **Datos estructurados** `Person` (JSON-LD), para que los buscadores sepan quién es la persona del portfolio.
- **`sitemap.xml` y `robots.txt`** son endpoints de Astro ([src/pages/](../src/pages/)) que se generan desde `site`. **`manifest.webmanifest`** da nombre, colores e icono si alguien guarda la web en la pantalla de inicio.
- **`.node-version`** fija Node 24 para el build de Cloudflare.

## 20. El CV descargable

En «Sobre mí» (en el pueblo y en la versión rápida) y en la cabecera de la versión rápida se puede descargar el CV en **PDF** y en **Markdown**. También se puede ver como página en [/cv/](../src/pages/cv.astro).

**Una sola fuente.** [src/lib/cv.js](../src/lib/cv.js) monta el CV a partir de los mismos datos que la web: el perfil, las certificaciones (con su enlace de verificación) y las demos del portfolio. De ahí salen las tres versiones, así que nunca dicen cosas distintas.

- **Markdown** ([/cv.md](../src/pages/cv.md.js)): un endpoint que se genera en cada build.
- **PDF**: Chrome imprime la página `/cv/`. Esa página tiene estilo de impresión sobrio a propósito: una columna, texto real, encabezados estándar y tamaño A4 con `@page`. Así la lee bien una persona y también un **ATS**, los filtros automáticos de CV de las empresas. Detalles de impresión: `break-after: avoid` para que un título no se quede solo al final de una página, y las viñetas recuperadas porque el preflight de Tailwind las quita.

**Que el PDF no se quede desactualizado.** El build de Cloudflare no tiene Chrome, así que el PDF se genera en local con `npm run cv` y se sube al repo. Ese script guarda también la **huella SHA-256** del CV en Markdown con el que se hizo ([scripts/cv-pdf.sha256](../scripts/cv-pdf.sha256)). En cada build, [scripts/check-cv.mjs](../scripts/check-cv.mjs) compara esa huella con la del Markdown recién generado. Si alguien cambia un dato del CV y no regenera el PDF, **el build falla** con el mensaje «Ejecuta: npm run cv». Así nunca se publica un PDF que contradiga la web.

`npm run og` y `npm run cv` comparten [scripts/lib/chrome.mjs](../scripts/lib/chrome.mjs): compilar, levantar `astro preview` y ejecutar Chrome sin ventana.

## Cómo añadir una skill nueva

1. Rellena su entrada en [registry.js](../src/skills/registry.js): `practices`, `tagline` y `ready: true`. El edificio ya aparece en el mapa.
2. Instala la integración si hace falta: `npx astro add react`.
3. Crea la demo en `src/skills/<id>/`.
4. Móntala en [SkillPanel.astro](../src/components/SkillPanel.astro) con `client:visible`, igual que `VueShop`, `QuestBoard` o `AlchemyLab`.
5. Si el framework usa JSX, limita su integración con `include` (ver sección 12).

## Comandos

```sh
npm run dev           # servidor de desarrollo (o: npx astro dev --background)
npm test              # tests con Vitest
npm run favicon       # regenera el icono "</>" (SVG + PNG) en public/
npm run og            # regenera public/og.png (necesita Chrome)
npm run cv            # regenera public/cv.pdf (necesita Chrome): hazlo tras cambiar datos del CV
npm run build         # build estático en dist/ + comprobaciones de la CSP y del PDF del CV
```

## Próximas fases

- ~~**Fase 2:** React y Svelte~~ ✓ (Angular se quitó del alcance).
- ~~**Fase 2.5:** economía compartida entre las islas (tienda → laboratorio → tablón), con HUD, notificaciones, persistencia y tests~~ ✓ (sección 13 y [ADR 001](adr/001-estado-compartido-entre-islas.md)).
- ~~**Fase 3:** CSS puro (componentes sin JS), Ciberseguridad y Python (ejecutado en el navegador con Pyodide, que se carga solo al entrar)~~ ✓ (secciones 14, 15 y 16).
- **Fase 4:** ~~modo lista accesible sin juego~~ ✓ (versión rápida, sección 17), ~~metadatos y cabeceras de seguridad~~ ✓ (sección 19), sonido y despliegue en Cloudflare Pages.
- **Fase 5:** modo debug con <kbd>F3</kbd>: un inspector del store (`$player` en vivo, con la opción de editarlo) y un registro de los eventos del bus, con su hora y su contenido. Encaja con la arquitectura actual, porque solo tiene que suscribirse a `$player` y a `events`.
- **Más adelante:**
  - Multijugador o backend: guardar la partida en un servidor en vez de en `localStorage`. La validación de `parseSave()` y las acciones puras se podrían reutilizar en el servidor.
  - Rediseño visual de las tiendas, ahora que forman parte de un mismo juego.
