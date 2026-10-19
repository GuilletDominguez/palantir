// SHA-1 para la demo de Have I Been Pwned, que identifica las contraseñas
// filtradas por su SHA-1. OJO: ni SHA-1 ni SHA-256 sirven para GUARDAR
// contraseñas (son demasiado rápidos); para eso están Argon2id, scrypt o bcrypt.

/**
 * Implementación propia, para cuando no hay Web Crypto: el navegador solo
 * expone `crypto.subtle` en contextos seguros (HTTPS o localhost), y la web
 * también se abre por http en la red local durante el desarrollo.
 */
export function sha1Fallback(text) {
	const bytes = new TextEncoder().encode(text);
	const bitLength = bytes.length * 8;
	// Relleno: 0x80, ceros y la longitud en bits (64 bits, big endian)
	const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) << 6);
	padded.set(bytes);
	padded[bytes.length] = 0x80;
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, Math.floor(bitLength / 2 ** 32));
	view.setUint32(padded.length - 4, bitLength >>> 0);

	const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
	const w = new Uint32Array(80);
	const rotl = (x, n) => (x << n) | (x >>> (32 - n));

	for (let block = 0; block < padded.length; block += 64) {
		for (let i = 0; i < 16; i++) w[i] = view.getUint32(block + i * 4);
		for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);

		let [a, b, c, d, e] = h;
		for (let i = 0; i < 80; i++) {
			const [f, k] =
				i < 20
					? [(b & c) | (~b & d), 0x5a827999]
					: i < 40
						? [b ^ c ^ d, 0x6ed9eba1]
						: i < 60
							? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc]
							: [b ^ c ^ d, 0xca62c1d6];
			const temp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
			e = d;
			d = c;
			c = rotl(b, 30) >>> 0;
			b = a;
			a = temp;
		}
		h[0] = (h[0] + a) >>> 0;
		h[1] = (h[1] + b) >>> 0;
		h[2] = (h[2] + c) >>> 0;
		h[3] = (h[3] + d) >>> 0;
		h[4] = (h[4] + e) >>> 0;
	}
	return h.map((x) => x.toString(16).padStart(8, '0')).join('');
}

/** SHA-1 en hexadecimal: Web Crypto si está disponible, si no la implementación propia. */
export async function sha1(text) {
	const subtle = globalThis.crypto?.subtle;
	if (subtle) {
		const digest = await subtle.digest('SHA-1', new TextEncoder().encode(text));
		const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
		return { hex, source: 'web-crypto' };
	}
	return { hex: sha1Fallback(text), source: 'fallback' };
}
