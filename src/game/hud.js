import { LEVEL_THRESHOLDS, levelFor, nextLevelXp } from '../state/catalog';
import { $level, $player } from '../state/economy';
import { events } from '../state/events';
import { $activePanel } from '../stores/ui';

const TYPE_MS = 28; // ms por letra del efecto máquina de escribir
const HOLD_MS = 2200; // tiempo que se queda el mensaje completo

/**
 * HUD (oro, nivel, XP) y notificaciones tipo Pokémon. Es HTML encima del
 * canvas: se escala con el resto de la interfaz y los lectores de pantalla
 * anuncian los mensajes gracias a aria-live.
 */
export function startHud({ hud, toast }) {
	const gold = hud.querySelector('[data-gold]');
	const level = hud.querySelector('[data-level]');
	const xpBar = hud.querySelector('[data-xp-bar]');
	const xpMeter = hud.querySelector('[role="meter"]');
	const toastText = toast.querySelector('[data-text]');
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

	let lastGold = null;
	$player.subscribe((p) => {
		gold.textContent = String(p.gold);
		if (lastGold !== null && p.gold !== lastGold) {
			// Reiniciar la animación: quitar la clase, forzar reflow y volver a ponerla
			gold.classList.remove('hud-flash');
			void gold.offsetWidth;
			gold.classList.add('hud-flash');
		}
		lastGold = p.gold;

		const from = LEVEL_THRESHOLDS[levelFor(p.xp) - 1];
		const to = nextLevelXp(p.xp);
		const pct = to === null ? 100 : Math.round(((p.xp - from) / (to - from)) * 100);
		xpBar.style.width = `${pct}%`;
		xpMeter.setAttribute('aria-valuenow', String(p.xp));
		xpMeter.setAttribute('aria-valuetext', to === null ? `${p.xp} XP, nivel máximo` : `${p.xp} de ${to} XP`);
	});
	$level.subscribe((l) => (level.textContent = String(l)));

	// ------------------------------------------------------ notificaciones
	const queue = [];
	let showing = false;

	/** Mensajes iguales seguidos se agrupan ("×3") en vez de hacer cola. */
	function push(key, text) {
		const last = queue.at(-1);
		if (last?.key === key) last.count++;
		else queue.push({ key, count: 1, text });
		next();
	}

	function next() {
		// Con un panel abierto el juego queda detrás del diálogo: se espera a cerrarlo
		if (showing || $activePanel.get() !== null) return;
		const msg = queue.shift();
		if (!msg) return;
		showing = true;
		show(msg.text(msg.count));
	}

	function show(text) {
		toast.hidden = false;
		toast.dataset.done = 'false';
		let i = reducedMotion.matches ? text.length : 0;
		const type = () => {
			toastText.textContent = text.slice(0, i);
			if (i < text.length) {
				i++;
				setTimeout(type, TYPE_MS);
				return;
			}
			toast.dataset.done = 'true';
			setTimeout(() => {
				toast.hidden = true;
				showing = false;
				next();
			}, HOLD_MS);
		};
		type();
	}

	$activePanel.subscribe(() => next());

	const article = (name) => (/^Elixir/.test(name) ? 'un' : 'una');
	events.on('potion:brewed', ({ potionId, name }) =>
		push(`brew:${potionId}`, (n) => (n > 1 ? `¡Has creado ${name} ×${n}!` : `¡Has creado ${article(name)} ${name}!`)),
	);
	events.on('quest:completed', ({ questId, title, gold, xp }) =>
		push(`quest:${questId}`, () => `¡Misión cumplida: ${title}! +${gold} oro, +${xp} XP`),
	);
	events.on('level:up', ({ level }) => push(`level:${level}`, () => `¡Subes al nivel ${level}!`));
	events.on('game:reset', () => {
		queue.length = 0;
		push('reset', () => '¡Empieza una partida nueva!');
	});
}
