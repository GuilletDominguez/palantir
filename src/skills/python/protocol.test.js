import { describe, expect, it } from 'vitest';
import { MAX_CODE, MAX_OUTPUT, parsePageMessage, parseWorkerMessage, trimTraceback } from './protocol';

describe('parseWorkerMessage', () => {
	it('acepta los mensajes bien formados', () => {
		expect(parseWorkerMessage({ type: 'stdout', id: 3, text: 'hola\n' })).toEqual({
			type: 'stdout',
			id: 3,
			text: 'hola\n',
		});
		expect(parseWorkerMessage({ type: 'done', id: 1, ms: 12 })).toEqual({ type: 'done', id: 1, ms: 12 });
		expect(parseWorkerMessage({ type: 'ready', python: '3.14.2', blocked: ['fetch'] })).toMatchObject({
			type: 'ready',
		});
	});

	it('descarta cualquier otra cosa (el código del visitante puede llamar a postMessage)', () => {
		const bad = [
			null,
			'stdout',
			{ type: 'html', html: '<img src=x onerror=alert(1)>' },
			{ type: 'stdout', id: -1, text: 'x' },
			{ type: 'stdout', id: 1.5, text: 'x' },
			{ type: 'stdout', id: 1, text: 42 },
			{ type: 'stdout', id: 1, text: 'x'.repeat(MAX_OUTPUT + 1) },
			{ type: 'done', id: 1, ms: Number.NaN },
			{ type: 'ready', python: '3', blocked: [{}] },
		];
		for (const data of bad) expect(parseWorkerMessage(data), JSON.stringify(data)?.slice(0, 60)).toBeNull();
	});

	it('copia solo los campos esperados', () => {
		expect(parseWorkerMessage({ type: 'error', id: 2, message: 'x', extra: '<script>' })).toEqual({
			type: 'error',
			id: 2,
			message: 'x',
		});
	});
});

describe('parsePageMessage', () => {
	it('limita el tamaño del código', () => {
		expect(parsePageMessage({ type: 'run', id: 1, code: 'print(1)', context: '{}' })).not.toBeNull();
		expect(parsePageMessage({ type: 'run', id: 1, code: 'x'.repeat(MAX_CODE + 1), context: '{}' })).toBeNull();
		expect(parsePageMessage({ type: 'eval', id: 1, code: 'x', context: '{}' })).toBeNull();
	});
});

describe('trimTraceback', () => {
	it('quita los marcos internos de Pyodide', () => {
		const message = [
			'Traceback (most recent call last):',
			'  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async',
			'    await CodeRunner(',
			'  File "<exec>", line 2, in <module>',
			'ZeroDivisionError: division by zero',
		].join('\n');
		expect(trimTraceback(message)).toBe(
			'Traceback (most recent call last):\n  File "<exec>", line 2, in <module>\nZeroDivisionError: division by zero',
		);
	});

	it('deja igual los errores sin traceback', () => {
		expect(trimTraceback('SyntaxError: invalid syntax\n')).toBe('SyntaxError: invalid syntax');
	});
});
