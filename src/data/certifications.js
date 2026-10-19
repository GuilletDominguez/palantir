// Certificaciones: los diplomas de OpenWebinars, con su URL pública de
// verificación. Las imágenes son WebP de 1600 px; Astro genera las miniaturas.

import desarrolloSeguro from '../assets/certificaciones/desarrollo-seguro.webp';
import ens from '../assets/certificaciones/ens.webp';
import formacionIso from '../assets/certificaciones/formacion-iso-27001.webp';
import fundamentosLegales from '../assets/certificaciones/fundamentos-legales.webp';
import iaCiber from '../assets/certificaciones/ia-ciberseguridad.webp';
import implementacionIso from '../assets/certificaciones/implementacion-iso-27001.webp';
import onboarding from '../assets/certificaciones/onboarding-ciberseguridad.webp';
import proteccionDatos from '../assets/certificaciones/proteccion-datos.webp';
import proteccionDatosAvanzado from '../assets/certificaciones/proteccion-datos-avanzado.webp';
import proyectosAgiles from '../assets/certificaciones/proyectos-agiles.webp';
import refactoring from '../assets/certificaciones/refactoring-clean-code.webp';
import vibeCoding from '../assets/certificaciones/vibe-coding.webp';

export const CERT_GROUPS = ['Ciberseguridad', 'Normativa', 'Desarrollo'];

const ow = (code) => `https://openwebinars.net/cert/${code}`;

// Cada certificación:
// - kind: "Curso" o "Itinerario" (una ruta de varios cursos).
// - group: "Ciberseguridad", "Normativa" o "Desarrollo".
// - date: fecha de expedición, AAAA-MM-DD.
// - image: el diploma importado (Astro conoce su tamaño y genera las miniaturas).
// - verifyUrl: página pública donde cualquiera puede comprobar el certificado.
export const certifications = [
	{
		id: 'onboarding-ciberseguridad',
		title: 'Onboarding en Ciberseguridad',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Ciberseguridad',
		hours: 7,
		date: '2024-12-10',
		image: onboarding,
		verifyUrl: ow('xCBe'),
	},
	{
		id: 'ia-ciberseguridad',
		title: 'IA para Ciberseguridad',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Ciberseguridad',
		hours: 9,
		date: '2025-10-29',
		image: iaCiber,
		verifyUrl: ow('CXJy'),
	},
	{
		id: 'desarrollo-seguro',
		title: 'Desarrollo Seguro',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Ciberseguridad',
		hours: 15,
		date: '2025-10-29',
		image: desarrolloSeguro,
		verifyUrl: ow('PXFQ'),
	},
	{
		id: 'fundamentos-legales',
		title: 'Fundamentos legales de la ciberseguridad y protección de datos',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Ciberseguridad',
		hours: 5,
		date: '2024-12-10',
		image: fundamentosLegales,
		verifyUrl: ow('M1AT'),
	},
	{
		id: 'formacion-iso-27001',
		title: 'Formación obligatoria ISO 27001: seguridad y protección de datos',
		issuer: 'OpenWebinars',
		kind: 'Itinerario',
		group: 'Normativa',
		hours: 47,
		date: '2025-12-17',
		image: formacionIso,
		verifyUrl: ow('DjYC'),
	},
	{
		id: 'implementacion-iso-27001',
		title: 'Implementación de la ISO 27001',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Normativa',
		hours: 10,
		date: '2025-12-17',
		image: implementacionIso,
		verifyUrl: ow('G1ZR'),
	},
	{
		id: 'ens',
		title: 'Introducción al Esquema Nacional de Seguridad (ENS)',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Normativa',
		hours: 7,
		date: '2025-12-17',
		image: ens,
		verifyUrl: ow('ixta'),
	},
	{
		id: 'proteccion-datos-avanzado',
		title: 'Protección de datos y seguridad de la información (avanzado)',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Normativa',
		hours: 7,
		date: '2025-12-17',
		image: proteccionDatosAvanzado,
		verifyUrl: ow('IAWJ'),
	},
	{
		id: 'proteccion-datos',
		title: 'Protección de datos y seguridad de la información',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Normativa',
		hours: 11,
		date: '2025-04-01',
		image: proteccionDatos,
		verifyUrl: ow('s7lB'),
	},
	{
		id: 'refactoring-clean-code',
		title: 'Técnicas de refactoring y Clean Code',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Desarrollo',
		hours: 10,
		date: '2025-10-29',
		image: refactoring,
		verifyUrl: ow('PKSB'),
	},
	{
		id: 'vibe-coding',
		title: 'Vibe Coding: prototipar apps con IA',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Desarrollo',
		hours: 2,
		date: '2025-10-29',
		image: vibeCoding,
		verifyUrl: ow('BmsP'),
	},
	{
		id: 'proyectos-agiles',
		title: 'Planificación y ejecución de proyectos ágiles',
		issuer: 'OpenWebinars',
		kind: 'Curso',
		group: 'Desarrollo',
		hours: 8,
		date: '2025-10-29',
		image: proyectosAgiles,
		verifyUrl: ow('jOp9'),
	},
];

/** "17 dic 2025" */
export function formatDate(iso) {
	return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
		new Date(`${iso}T00:00:00Z`),
	);
}

export const totalHours = certifications.reduce((sum, c) => sum + c.hours, 0);
