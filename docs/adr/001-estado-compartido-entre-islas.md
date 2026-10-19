# ADR 001: estado compartido entre islas

- **Estado:** aceptada
- **Fecha:** 2026-10-19

## Contexto

Mi portfolio es un pueblo de 8 bits hecho con Astro. Cada edificio es una demo con un framework distinto: una tienda en Vue, un laboratorio en Svelte y un tablón de misiones en React. Al principio cada demo funcionaba por su cuenta, con su propio estado y su propio `localStorage`.

Quería que las tres formaran **un único juego**: compras ingredientes en Vue, preparas pociones con ellos en Svelte y las entregas en React a cambio de oro y experiencia. El juego del canvas, que no usa ningún framework, también tenía que enterarse para mostrar el oro y avisar de lo que pasa.

Eso choca con cómo funciona Astro. Cada isla es una aplicación independiente que se hidrata por separado y en momentos distintos (con `client:visible`, solo cuando abres su edificio). No hay un árbol de componentes común donde poner un contexto o un store.

Además, el HTML de las islas se genera en el servidor, donde no hay `localStorage`. Si la isla pinta en el cliente la partida guardada nada más hidratarse, su HTML no coincide con el del servidor y el framework avisa de un *hydration mismatch*.

## Opciones que consideré

| Opción | A favor | En contra |
| --- | --- | --- |
| **nanostores** | Es lo que recomienda Astro. Pesa menos de 1 KB, no depende de ningún framework y tiene adaptadores oficiales para Vue y React. Svelte lo lee de forma nativa con `$store`. | Una dependencia más (pequeña). |
| **Eventos del DOM** (`CustomEvent` en `window`) | No necesita librerías. | Sirven para avisar de lo que pasa, pero no guardan estado. Una isla que se hidrata tarde se pierde los eventos anteriores, así que cada una tendría que reconstruir el estado por su cuenta. |
| **Objeto global en `window`** | Muy simple. | No es reactivo: cada isla tendría que volver a consultar el estado para enterarse de los cambios. Es un cajón sin tipos que cualquiera puede modificar. |
| **Un único framework** | Elimina el problema. | Elimina también el objetivo del portfolio, que es demostrar cada framework con sus propias buenas prácticas. |

## Decisión

Uso **nanostores** con un único átomo, `$player`, que guarda toda la partida. Alrededor organizo tres capas, todas en `src/state/`:

1. **Funciones puras de transición** (`actions.js`): `buyItem`, `brew`, `completeQuest`… reciben el estado y devuelven `{ ok: true, state }` o `{ ok: false, reason }`. No tocan el store, así que las pruebo con Vitest sin montar ningún componente. Si algo no cuadra, el estado original no cambia: nunca hay oro negativo ni misiones repetidas.
2. **Wrappers** (`game.buy()`, `game.brew()`…): son la única puerta de entrada al store. Aplican la función pura y, si sale bien, guardan el nuevo estado y emiten un evento (`potion:brewed`, `level:up`…) para el juego.
3. **Persistencia** (`persistence.js`): cargo y guardo en `localStorage` solo en el cliente, dentro del `onMount` del store. Valido todo lo que leo y lo trato como `unknown`. Si la partida está corrupta, empiezo de cero en vez de romper la página.

El nivel no se guarda: lo calculo a partir de la XP.

Para hidratar sin desajustes, cada isla pinta el **estado inicial** hasta que se monta, igual que el servidor, y después pasa a la partida real:

- en React, con la opción `ssr: 'initial'` de `useStore`, que se apoya en el `getServerSnapshot` de `useSyncExternalStore`;
- en Vue, con una bandera que se activa en `onMounted`;
- en Svelte, con una bandera que se activa en un `$effect`.

## Consecuencias

- **Buenas:**
  - Cualquier cambio se ve al instante en las tres islas y en el HUD del juego.
  - Toda la lógica del juego está en JavaScript plano y cubierta por tests.
  - Cada framework sigue usando sus propias herramientas para el estado local: Pinia para el carrito, runas para el caldero y `useOptimistic` para publicar misiones.
- **Malas:**
  - Las islas dependen de un módulo compartido, así que una demo ya no se puede copiar a otro proyecto sin `src/state/`.
  - Cada framework necesita su pequeño truco de hidratación, y hay que conocerlo.
- **A vigilar:** si cambio la forma de la partida, tengo que subir `SAVE_VERSION` y añadir una migración. Si no, las partidas antiguas se descartan y el jugador empieza de cero.
