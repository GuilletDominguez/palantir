import { ITEMS_BY_ID, QUESTS, RECIPES_BY_ID, levelFor, sellPrice } from './catalog';
import { $player, createInitialState } from './economy';
import { events } from './events';

// Funciones puras de transición: (estado, argumentos) → nuevo estado o motivo
// del fallo. No tocan el store ni el DOM, así que se prueban sin montar nada.
// Si algo no cuadra se devuelve { ok: false } y el estado original sigue intacto:
// nunca hay oro ni cantidades negativas, ni misiones repetidas.

const fail = (reason) => ({ ok: false, reason });
const ok = (state) => ({ ok: true, state });
const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

function addQty(inventory, id, delta) {
	const next = { ...inventory };
	const qty = (next[id] ?? 0) + delta;
	if (qty > 0) next[id] = qty;
	else delete next[id];
	return next;
}

/** Lo que falta para cubrir `needs`, en texto ("2 × Poción de Maná"). */
export function missingItems(inventory, needs) {
	return Object.entries(needs)
		.filter(([id, qty]) => (inventory[id] ?? 0) < qty)
		.map(([id, qty]) => `${qty - (inventory[id] ?? 0)} × ${ITEMS_BY_ID.get(id)?.name ?? id}`);
}

function consume(inventory, needs) {
	return Object.entries(needs).reduce((inv, [id, qty]) => addQty(inv, id, -qty), inventory);
}

export function allQuests(state) {
	return [...state.customQuests, ...QUESTS];
}

export function findQuest(state, questId) {
	return allQuests(state).find((q) => q.id === questId);
}

export function buyItem(state, itemId, qty = 1) {
	const item = ITEMS_BY_ID.get(itemId);
	if (!item) return fail('Ese objeto no existe.');
	if (item.kind !== 'ingredient') return fail('La tienda solo vende ingredientes.');
	if (!isPositiveInt(qty)) return fail('Cantidad no válida.');
	const cost = item.price * qty;
	if (cost > state.gold) return fail(`Te faltan ${cost - state.gold} de oro.`);
	return ok({ ...state, gold: state.gold - cost, inventory: addQty(state.inventory, itemId, qty) });
}

/** Compra varias líneas de una vez: o se compran todas, o ninguna. */
export function checkout(state, lines) {
	const entries = Object.entries(lines);
	if (entries.length === 0) return fail('El carrito está vacío.');
	let total = 0;
	for (const [id, qty] of entries) total += (ITEMS_BY_ID.get(id)?.price ?? 0) * qty;
	if (total > state.gold) return fail(`Te faltan ${total - state.gold} de oro.`);

	let result = ok(state);
	for (const [id, qty] of entries) {
		if (!result.ok) break;
		result = buyItem(result.state, id, qty);
	}
	return result;
}

export function sellItem(state, itemId, qty = 1) {
	const item = ITEMS_BY_ID.get(itemId);
	if (!item) return fail('Ese objeto no existe.');
	if (!isPositiveInt(qty)) return fail('Cantidad no válida.');
	if ((state.inventory[itemId] ?? 0) < qty) return fail(`No tienes suficientes unidades de ${item.name}.`);
	return ok({
		...state,
		gold: state.gold + sellPrice(item) * qty,
		inventory: addQty(state.inventory, itemId, -qty),
	});
}

export function brew(state, recipeId) {
	const recipe = RECIPES_BY_ID.get(recipeId);
	if (!recipe) return fail('Esa receta no existe.');
	const missing = missingItems(state.inventory, recipe.inputs);
	if (missing.length) return fail(`Faltan ingredientes: ${missing.join(', ')}.`);
	return ok({ ...state, inventory: addQty(consume(state.inventory, recipe.inputs), recipe.output, 1) });
}

export function completeQuest(state, questId) {
	const quest = findQuest(state, questId);
	if (!quest) return fail('Esa misión no existe.');
	if (state.completedQuests.includes(questId)) return fail('Ya completaste esta misión.');
	if (quest.minLevel && levelFor(state.xp) < quest.minLevel) return fail(`Necesitas nivel ${quest.minLevel}.`);
	const missing = missingItems(state.inventory, quest.requires);
	if (missing.length) return fail(`Te falta: ${missing.join(', ')}.`);
	return ok({
		...state,
		gold: state.gold + quest.reward.gold,
		xp: state.xp + quest.reward.xp,
		inventory: consume(state.inventory, quest.requires),
		completedQuests: [...state.completedQuests, questId],
	});
}

export function addQuest(state, quest) {
	if (quest.title.trim().length < 4) return fail('El título necesita al menos 4 letras.');
	if (findQuest(state, quest.id)) return fail('Ya existe una misión con ese id.');
	const requires = Object.entries(quest.requires);
	const valid =
		requires.length > 0 &&
		requires.every(([id, qty]) => ITEMS_BY_ID.get(id)?.kind === 'potion' && isPositiveInt(qty)) &&
		quest.reward.gold >= 0 &&
		quest.reward.xp >= 0;
	if (!valid) return fail('La misión no es válida.');
	return ok({ ...state, customQuests: [quest, ...state.customQuests] });
}

export function removeQuest(state, questId) {
	if (!state.customQuests.some((q) => q.id === questId)) {
		return fail('Solo puedes retirar las misiones que has publicado tú.');
	}
	return ok({
		...state,
		customQuests: state.customQuests.filter((q) => q.id !== questId),
		completedQuests: state.completedQuests.filter((id) => id !== questId),
	});
}

// ------------------------------------------------------------------ wrappers
// Única puerta de entrada al store: aplican la función pura y, si sale bien,
// guardan el nuevo estado y emiten el evento. Los componentes solo usan esto.

function commit(result, after) {
	if (result.ok) {
		const prev = $player.get();
		$player.set(result.state);
		after?.(prev, result.state);
	}
	return result;
}

export const game = {
	buy: (itemId, qty = 1) =>
		commit(buyItem($player.get(), itemId, qty), (prev, next) =>
			events.emit('item:bought', { itemId, qty, cost: prev.gold - next.gold }),
		),

	checkout: (lines) =>
		commit(checkout($player.get(), lines), () => {
			for (const [itemId, qty] of Object.entries(lines)) {
				events.emit('item:bought', { itemId, qty, cost: (ITEMS_BY_ID.get(itemId)?.price ?? 0) * qty });
			}
		}),

	sell: (itemId, qty = 1) =>
		commit(sellItem($player.get(), itemId, qty), (prev, next) =>
			events.emit('item:sold', { itemId, qty, earned: next.gold - prev.gold }),
		),

	brew: (recipeId) =>
		commit(brew($player.get(), recipeId), () => {
			const potionId = RECIPES_BY_ID.get(recipeId).output;
			events.emit('potion:brewed', { potionId, name: ITEMS_BY_ID.get(potionId).name });
		}),

	completeQuest: (questId) =>
		commit(completeQuest($player.get(), questId), (prev, next) => {
			const quest = findQuest(next, questId);
			events.emit('quest:completed', { questId, title: quest.title, ...quest.reward });
			const level = levelFor(next.xp);
			if (level > levelFor(prev.xp)) events.emit('level:up', { level });
		}),

	addQuest: (quest) => commit(addQuest($player.get(), quest)),

	removeQuest: (questId) => commit(removeQuest($player.get(), questId)),

	reset() {
		$player.set(createInitialState());
		events.emit('game:reset', {});
	},
};
