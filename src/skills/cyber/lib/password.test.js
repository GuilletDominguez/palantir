import { describe, expect, it } from 'vitest';
import { analyzePassword, charsetSize, formatDuration } from './password';
import { sha1Fallback } from './sha1';

const kinds = (pw) => analyzePassword(pw).findings.map((f) => f.kind);

describe('analyzePassword', () => {
	it('suspende las contraseñas típicas', () => {
		for (const pw of ['password', '123456', 'qwerty', 'Sevilla2024', 'p4ssw0rd']) {
			expect(analyzePassword(pw).score, pw).toBeLessThanOrEqual(1);
		}
	});

	it('aprueba una frase larga y aleatoria', () => {
		const a = analyzePassword('caballo-grapa-bateria-correcto-Ñu7');
		expect(a.score).toBe(4);
		expect(a.crackTime.offline).toBe('siglos');
	});

	it('detecta cada tipo de patrón', () => {
		expect(kinds('xxpasswordxx')).toContain('common');
		expect(kinds('P4ssw0rd!x')).toContain('common');
		expect(kinds('zzasdfgzz')).toContain('keyboard');
		expect(kinds('kkmnopkk')).toContain('sequence');
		expect(kinds('maaaaax')).toContain('repeat');
		expect(kinds('gato12/05/1990')).toContain('date');
		expect(kinds('corta')).toContain('short');
	});

	it('un patrón cuesta menos que el mismo número de caracteres al azar', () => {
		expect(analyzePassword('qwertyuiop').bits).toBeLessThan(analyzePassword('qhzvtmrkpw').bits);
	});

	it('una contraseña vacía no rompe nada', () => {
		expect(analyzePassword('')).toMatchObject({ length: 0, bits: 0, score: 0, findings: [] });
	});

	it('calcula el alfabeto según los tipos de carácter', () => {
		expect(charsetSize('abc')).toBe(27);
		expect(charsetSize('aB1!')).toBe(27 + 27 + 10 + 33);
	});
});

describe('formatDuration', () => {
	it('pasa a la unidad adecuada', () => {
		expect(formatDuration(0.5)).toBe('al instante');
		expect(formatDuration(1)).toBe('1 segundo');
		expect(formatDuration(90)).toBe('1 minuto');
		expect(formatDuration(3 * 86400)).toBe('3 días');
		expect(formatDuration(1e12)).toBe('siglos');
	});
});

describe('sha1Fallback', () => {
	it('coincide con los vectores de prueba oficiales', () => {
		expect(sha1Fallback('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
		expect(sha1Fallback('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
		expect(sha1Fallback('password')).toBe('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8');
		// Varios bloques de 64 bytes y texto UTF-8 (referencia: crypto de Node)
		expect(sha1Fallback('a'.repeat(1000))).toBe('291e9a6c66994949b57ba5e650361e98fc36b1ba');
		expect(sha1Fallback('contraseña')).toBe('8c31b65bdecdc9f18b695d7318186fd1feed690d');
	});
});
