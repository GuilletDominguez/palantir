// Creación de DOM sin innerHTML, compartida por las demos que muestran texto
// del visitante (el cuartel de ciberseguridad y la biblioteca de Python).

/**
 * Crea un elemento con atributos e hijos. Los strings siempre se insertan como
 * nodos de texto, nunca como HTML, así que lo que escribe el usuario no puede
 * convertirse en etiquetas ni en scripts.
 */
export function h(tag, attrs = {}, ...children) {
	const el = document.createElement(tag);
	for (const [name, value] of Object.entries(attrs)) {
		// Defensa en profundidad: los eventos se enlazan con addEventListener, nunca como atributo
		if (/^on/i.test(name)) throw new Error(`h(): atributo de evento no permitido (${name})`);
		if (value === false) continue;
		el.setAttribute(name, value === true ? '' : String(value));
	}
	el.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
	return el;
}
