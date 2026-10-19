// Analizador de contraseñas: estima cuánto costaría adivinarla. Es una
// aproximación didáctica (en producción se usaría algo como zxcvbn), pero
// sigue la misma idea: un atacante no prueba combinaciones al azar, prueba
// primero palabras comunes, secuencias del teclado, fechas y repeticiones.

export const SCORE_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];

/** Intentos por segundo: GPU contra un hash rápido filtrado, y login web con límite de intentos. */
export const OFFLINE_GUESSES_PER_SECOND = 1e10;
export const ONLINE_GUESSES_PER_SECOND = 10;

export const COMMON_WORDS = [
	'password',
	'contraseña',
	'contrasena',
	'qwerty',
	'admin',
	'letmein',
	'welcome',
	'iloveyou',
	'monkey',
	'dragon',
	'master',
	'sunshine',
	'princess',
	'football',
	'futbol',
	'barcelona',
	'realmadrid',
	'betis',
	'sevilla',
	'madrid',
	'españa',
	'espana',
	'hola',
	'amor',
	'teamo',
	'palantir',
	'secret',
	'secreto',
	'login',
	'superman',
	'batman',
	'pokemon',
	'minecraft',
	'usuario',
	'root',
	'toor',
	'pass',
	'clave',
	'familia',
	'verano',
	'invierno',
	'shadow',
	'hunter',
	'charlie',
	'killer',
	'trustno1',
	'azerty',
];

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm', '1234567890'];

// Leetspeak: p4ssw0rd se prueba igual que password
const LEET = { 4: 'a', '@': 'a', 3: 'e', 1: 'i', '!': 'i', 0: 'o', 5: 's', $: 's', 7: 't' };

export function charsetSize(password) {
	let size = 0;
	if (/[a-zñ]/.test(password)) size += 27;
	if (/[A-ZÑ]/.test(password)) size += 27;
	if (/\d/.test(password)) size += 10;
	if (/[ -/:-@[-`{-~]/.test(password)) size += 33;
	if (/[^\x00-\x7fñÑ]/.test(password)) size += 100;
	return size;
}

function findMatches(password) {
	const lower = password.toLowerCase();
	const normalized = [...lower].map((c) => LEET[c] ?? c).join('');
	const matches = [];

	for (const word of COMMON_WORDS) {
		for (const source of new Set([lower, normalized])) {
			const at = source.indexOf(word);
			if (at >= 0) {
				const leet = source === normalized && lower.indexOf(word) < 0;
				matches.push({
					start: at,
					end: at + word.length,
					bits: Math.log2(COMMON_WORDS.length) + (leet ? 2 : 0),
					finding: {
						kind: 'common',
						text: `Contiene una palabra muy común: «${password.slice(at, at + word.length)}»${leet ? ' (con leetspeak, que no engaña a nadie)' : ''}.`,
					},
				});
				break;
			}
		}
	}

	for (const row of KEYBOARD_ROWS) {
		for (const line of [row, [...row].reverse().join('')]) {
			for (let len = line.length; len >= 4; len--) {
				let found = false;
				for (let i = 0; i + len <= line.length; i++) {
					const at = lower.indexOf(line.slice(i, i + len));
					if (at >= 0) {
						matches.push({
							start: at,
							end: at + len,
							bits: 6,
							finding: { kind: 'keyboard', text: `«${password.slice(at, at + len)}» es una secuencia del teclado.` },
						});
						found = true;
						break;
					}
				}
				if (found) break;
			}
		}
	}

	// abcd, 9876…: caracteres consecutivos en orden
	for (let i = 0; i < lower.length;) {
		let j = i + 1;
		const step = lower.charCodeAt(i + 1) - lower.charCodeAt(i);
		if (Math.abs(step) === 1) while (j < lower.length && lower.charCodeAt(j) - lower.charCodeAt(j - 1) === step) j++;
		if (j - i >= 4) {
			matches.push({
				start: i,
				end: j,
				bits: 5,
				finding: { kind: 'sequence', text: `«${password.slice(i, j)}» es una secuencia ordenada.` },
			});
			i = j;
		} else i++;
	}

	for (const m of password.matchAll(/(.)\1{2,}/gu)) {
		matches.push({
			start: m.index,
			end: m.index + m[0].length,
			bits: Math.log2(charsetSize(m[1]) || 1) + Math.log2(m[0].length),
			finding: { kind: 'repeat', text: `«${m[0]}» repite el mismo carácter.` },
		});
	}

	for (const m of password.matchAll(/(?:\d{1,2}[/.-]?\d{1,2}[/.-]?)?(?:19|20)\d{2}/g)) {
		matches.push({
			start: m.index,
			end: m.index + m[0].length,
			bits: Math.log2(366 * 100),
			finding: { kind: 'date', text: `«${m[0]}» parece una fecha o un año: es de lo primero que se prueba.` },
		});
	}

	return matches;
}

export function formatDuration(seconds) {
	if (seconds < 1) return 'al instante';
	const units = [
		[60, 'segundo', 'segundos'],
		[60, 'minuto', 'minutos'],
		[24, 'hora', 'horas'],
		[365, 'día', 'días'],
		[100, 'año', 'años'],
	];
	let value = seconds;
	for (const [size, one, many] of units) {
		if (value < size) {
			const n = Math.floor(value);
			return `${n} ${n === 1 ? one : many}`;
		}
		value /= size;
	}
	return 'siglos';
}

export function analyzePassword(password) {
	const chars = [...password];
	const size = charsetSize(password);
	const perChar = size > 0 ? Math.log2(size) : 0;
	const findings = [];

	// Cada carácter cuesta log2(alfabeto) bits, salvo los que caen dentro de un
	// patrón conocido: esos se cobran una vez, con el coste del patrón.
	const covered = new Array(chars.length).fill(false);
	let bits = 0;
	const matches = findMatches(password).sort((a, b) => b.end - b.start - (a.end - a.start));
	for (const m of matches) {
		if (covered.slice(m.start, m.end).some(Boolean)) continue;
		covered.fill(true, m.start, m.end);
		bits += m.bits;
		findings.push(m.finding);
	}
	bits += covered.filter((c) => !c).length * perChar;

	if (chars.length > 0 && chars.length < 12) {
		findings.push({
			kind: 'short',
			text: `Tiene ${chars.length} caracteres: con 12 o más el tiempo para adivinarla se dispara.`,
		});
	}

	bits = Math.max(0, Math.round(bits * 10) / 10);
	const score = bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
	// De media, el atacante acierta tras probar la mitad de las combinaciones
	const guesses = 2 ** bits / 2;
	return {
		length: chars.length,
		charsetSize: size,
		bits,
		score,
		findings,
		crackTime: {
			offline: formatDuration(guesses / OFFLINE_GUESSES_PER_SECOND),
			online: formatDuration(guesses / ONLINE_GUESSES_PER_SECOND),
		},
	};
}
