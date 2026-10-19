// El CV descargable se monta aquí a partir de los mismos datos que la web
// (perfil, certificaciones y demos). Lo usan el Markdown (/cv.md) y la página
// /cv/, de la que sale el PDF: si cambia un dato, cambian la web y los dos CV.
// No incluye el teléfono a propósito: el CV es público y los bots lo recopilan.

import { CERT_GROUPS, certifications } from '../data/certifications';
import { profile } from '../data/profile';
import { REPO_URL, skills } from '../skills/registry';

/** Nombre de los archivos que se descargan (sin extensión). */
export const CV_FILENAME = 'Guillermo-Dominguez-Garcia-CV';

/** Texto visible de un enlace: sin "https://", "www." ni "mailto:". */
const display = (href) =>
	decodeURIComponent(href)
		.replace(/^mailto:/, '')
		.replace(/^https?:\/\/(www\.)?/, '')
		.replace(/\/$/, '');

const link = (label) => {
	const l = profile.links.find((x) => x.label === label);
	return l && { text: display(l.href), href: l.href };
};

/**
 * Devuelve el CV como datos. `site` es la URL pública de la web (la `site` de
 * astro.config.mjs). Los textos pueden llevar **negritas** (ver profile.js).
 */
export function buildCv(site) {
	const portfolioUrl = new URL('/', site).href;
	const portfolio = { text: display(portfolioUrl), href: portfolioUrl };
	return {
		name: profile.name,
		role: profile.role,
		headline: profile.headline,
		// Dos líneas de contacto, como en el CV original
		contactLines: [
			[{ text: profile.location }, link('Email'), link('GitHub')],
			[link('LinkedIn'), portfolio],
		].map((line) => line.filter(Boolean)),
		summary: profile.summary,
		experience: profile.experience.filter((job) => !job.secondary),
		// "Otra experiencia": una línea por trabajo → "**Puesto**, Empresa (Ciudad), periodo: tarea"
		otherExperience: profile.experience
			.filter((job) => job.secondary)
			.map((job) => {
				const task = job.tasks.join(' ');
				const company = job.company.replace(/, ([^,]+)$/, ' ($1)');
				return `**${job.role}**, ${company}, ${job.period}: ${task[0].toLowerCase()}${task.slice(1)}`;
			}),
		skills: profile.skills.map((s) => ({
			group: s.group,
			text: s.items.join(s.group === 'Competencias' ? ' · ' : ', '),
		})),
		education: profile.education,
		certifications: CERT_GROUPS.map((group) => {
			const items = certifications.filter((c) => c.group === group);
			const issuers = [...new Set(items.map((c) => c.issuer))].join(', ');
			return { group, issuers, items: items.map((c) => ({ title: c.title, url: c.verifyUrl })) };
		}),
	};
}

/** El mismo CV en Markdown (las **negritas** ya están en ese formato). */
export function cvToMarkdown(cv) {
	const lines = [
		`# ${cv.name}`,
		'',
		`**${cv.role}** · ${cv.headline}  `,
		...cv.contactLines.map(
			(line, i) =>
				line.map((c) => (c.href ? `[${c.text}](${c.href})` : c.text)).join(' | ') +
				(i < cv.contactLines.length - 1 ? '  ' : ''),
		),
		'',
		'## Perfil',
		'',
		cv.summary,
		'',
		'## Experiencia profesional',
		'',
	];
	for (const job of cv.experience) {
		lines.push(`### ${job.role}`, '', `${job.company} · ${job.period}`, '', ...job.tasks.map((t) => `- ${t}`), '');
	}
	if (cv.otherExperience.length) lines.push('### Otra experiencia', '', ...cv.otherExperience.map((t) => `- ${t}`), '');
	lines.push('## Habilidades', '', ...cv.skills.map((s) => `- **${s.group}:** ${s.text}`), '');
	lines.push('## Formación', '', ...cv.education.map((e) => `- **${e.title}** · ${e.place} · ${e.period}`), '');
	lines.push('## Certificaciones · Formación no reglada', '');
	for (const { group, issuers, items } of cv.certifications) {
		lines.push(`- **${group}:** ${items.map((c) => `[${c.title}](${c.url})`).join(' · ')} (${issuers})`);
	}
	return lines.join('\n');
}
