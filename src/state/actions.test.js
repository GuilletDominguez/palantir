import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addQuest, brew, buyItem, checkout, completeQuest, game, removeQuest, sellItem } from './actions';
import { LEVEL_THRESHOLDS, QUESTS, levelFor } from './catalog';
import { $player, createInitialState } from './economy';
import { events } from './events';
import { SAVE_VERSION, parseSave } from './persistence';

const state = (patch = {}) => ({ ...createInitialState(), ...patch });

/** Desenvuelve un resultado que debe ser correcto (falla el test si no). */
function expectOk(result) {
	if (!result.ok) throw new Error(`Se esperaba ok y llegó: ${result.reason}`);
	return result.state;
}

function expectFail(result, reason) {
	expect(result.ok).toBe(false);
	if (!result.ok) expect(result.reason).toMatch(reason);
}

const customQuest = (patch = {}) => ({
	id: 'custom-1',
	title: 'Limpiar el pozo',
	difficulty: 'fácil',
	requires: { 'potion-life': 1 },
	reward: { gold: 10, xp: 20 },
	...patch,
});

describe('buyItem', () => {
	it('descuenta el oro y añade el ingrediente', () => {
		const next = expectOk(buyItem(state({ gold: 20 }), 'herb', 2));
		expect(next.gold).toBe(14);
		expect(next.inventory).toEqual({ herb: 2 });
	});

	it('falla si no hay oro suficiente', () => expectFail(buyItem(state({ gold: 5 }), 'crystal', 1), /faltan 1 de oro/));
	it('falla si el objeto no existe', () => expectFail(buyItem(state(), 'dragon-egg'), /no existe/));
	it('falla si intentas comprar una poción', () =>
		expectFail(buyItem(state(), 'potion-life'), /solo vende ingredientes/));
	it('falla con cantidades no válidas', () => {
		for (const qty of [0, -1, 1.5]) expectFail(buyItem(state(), 'herb', qty), /Cantidad no válida/);
	});
	it('no modifica el estado original', () => {
		const original = state();
		buyItem(original, 'herb', 1);
		expect(original).toEqual(state());
	});
});

describe('checkout', () => {
	it('compra todas las líneas a la vez', () => {
		const next = expectOk(checkout(state({ gold: 20 }), { mushroom: 1, herb: 2 }));
		expect(next.gold).toBe(10);
		expect(next.inventory).toEqual({ mushroom: 1, herb: 2 });
	});

	it('falla con el carrito vacío', () => expectFail(checkout(state(), {}), /vacío/));
	it('no compra nada si el total supera el oro', () =>
		expectFail(checkout(state({ gold: 10 }), { crystal: 1, fireflower: 1 }), /faltan 2 de oro/));
	it('no compra nada si una línea no es válida', () =>
		expectFail(checkout(state(), { herb: 1, 'potion-life': 1 }), /solo vende ingredientes/));
});

describe('sellItem', () => {
	it('vende al 50 % redondeando hacia abajo', () => {
		const next = expectOk(sellItem(state({ gold: 0, inventory: { 'potion-mana': 2, herb: 1 } }), 'potion-mana'));
		expect(next.gold).toBe(9);
		expect(next.inventory).toEqual({ 'potion-mana': 1, herb: 1 });
		// Hierba lunar cuesta 3: se vende por 1
		expect(expectOk(sellItem(next, 'herb')).gold).toBe(10);
	});

	it('elimina la entrada al llegar a cero', () => {
		const next = expectOk(sellItem(state({ inventory: { elixir: 1 } }), 'elixir'));
		expect(next.inventory).toEqual({});
	});

	it('falla si no hay unidades suficientes', () =>
		expectFail(sellItem(state({ inventory: { elixir: 1 } }), 'elixir', 2), /No tienes suficientes/));
	it('falla si el objeto no existe', () => expectFail(sellItem(state(), 'dragon-egg'), /no existe/));
	it('falla con cantidades no válidas', () =>
		expectFail(sellItem(state({ inventory: { elixir: 1 } }), 'elixir', 0), /Cantidad no válida/));
});

describe('brew', () => {
	it('consume los ingredientes y añade la poción', () => {
		const next = expectOk(brew(state({ inventory: { mushroom: 2, herb: 1 } }), 'life'));
		expect(next.inventory).toEqual({ mushroom: 1, 'potion-life': 1 });
	});

	it('falla si faltan ingredientes', () =>
		expectFail(brew(state({ inventory: { mushroom: 1 } }), 'life'), /Faltan ingredientes: 1 × Hierba lunar/));
	it('falla si la receta no existe', () => expectFail(brew(state(), 'philosopher-stone'), /no existe/));
});

describe('completeQuest', () => {
	it('consume las pociones y da la recompensa', () => {
		const next = expectOk(completeQuest(state({ gold: 0, inventory: { 'potion-life': 2 } }), 'bridge'));
		expect(next.gold).toBe(15);
		expect(next.xp).toBe(30);
		expect(next.inventory).toEqual({ 'potion-life': 1 });
		expect(next.completedQuests).toEqual(['bridge']);
	});

	it('falla si faltan pociones', () => expectFail(completeQuest(state(), 'bridge'), /Te falta: 1 × Poción de Vida/));
	it('falla si la misión ya está hecha', () =>
		expectFail(
			completeQuest(state({ inventory: { 'potion-life': 1 }, completedQuests: ['bridge'] }), 'bridge'),
			/Ya completaste/,
		));
	it('falla si el nivel no llega', () =>
		expectFail(completeQuest(state({ inventory: { 'potion-mana': 2 } }), 'tower'), /Necesitas nivel 2/));
	it('falla si la misión no existe', () => expectFail(completeQuest(state(), 'kill-the-dragon'), /no existe/));
	it('también completa misiones publicadas por el usuario', () => {
		const withQuest = expectOk(addQuest(state({ inventory: { 'potion-life': 1 } }), customQuest()));
		expect(expectOk(completeQuest(withQuest, 'custom-1')).completedQuests).toEqual(['custom-1']);
	});
});

describe('addQuest y removeQuest', () => {
	it('publica y retira una misión propia', () => {
		const added = expectOk(addQuest(state(), customQuest()));
		expect(added.customQuests.map((q) => q.id)).toEqual(['custom-1']);
		expect(expectOk(removeQuest(added, 'custom-1')).customQuests).toEqual([]);
	});

	it('rechaza títulos cortos', () => expectFail(addQuest(state(), customQuest({ title: 'abc' })), /4 letras/));
	it('rechaza ids repetidos', () => expectFail(addQuest(state(), customQuest({ id: 'bridge' })), /Ya existe/));
	it('rechaza misiones que no piden pociones', () => {
		expectFail(addQuest(state(), customQuest({ requires: {} })), /no es válida/);
		expectFail(addQuest(state(), customQuest({ requires: { herb: 1 } })), /no es válida/);
		expectFail(addQuest(state(), customQuest({ requires: { 'potion-life': 0 } })), /no es válida/);
	});
	it('no deja retirar misiones del catálogo', () => expectFail(removeQuest(state(), 'bridge'), /que has publicado tú/));
});

describe('niveles', () => {
	it('se derivan de la XP', () => {
		expect(levelFor(0)).toBe(1);
		expect(levelFor(LEVEL_THRESHOLDS[1] - 1)).toBe(1);
		expect(levelFor(LEVEL_THRESHOLDS[1])).toBe(2);
		expect(levelFor(1_000_000)).toBe(LEVEL_THRESHOLDS.length);
	});
});

describe('ciclo completo', () => {
	it('comprar → crear → entregar, partiendo de una partida nueva', () => {
		let s = createInitialState();
		s = expectOk(checkout(s, { mushroom: 1, herb: 1 }));
		s = expectOk(brew(s, 'life'));
		s = expectOk(completeQuest(s, 'bridge'));
		expect(s).toMatchObject({ gold: 20 - 7 + 15, xp: 30, inventory: {}, completedQuests: ['bridge'] });
	});

	it('todas las misiones del catálogo se pueden completar en orden', () => {
		let s = state({ gold: 1000 });
		for (const quest of QUESTS) {
			s = expectOk(checkout(s, { mushroom: 4, herb: 4, crystal: 4, feather: 2, fireflower: 2, slime: 1 }));
			for (const recipe of ['life', 'mana', 'mana', 'strength', 'strength', 'speed', 'elixir'])
				s = expectOk(brew(s, recipe));
			s = expectOk(completeQuest(s, quest.id));
		}
		expect(s.completedQuests).toEqual(QUESTS.map((q) => q.id));
	});
});

describe('wrappers del store', () => {
	beforeEach(() => $player.set(createInitialState()));

	it('aplican el estado y emiten eventos, incluida la subida de nivel', () => {
		const brewed = vi.fn();
		const levelUp = vi.fn();
		const offBrewed = events.on('potion:brewed', brewed);
		events.on('level:up', levelUp);

		game.checkout({ mushroom: 2, herb: 2 });
		game.brew('life');
		game.brew('life');
		game.completeQuest('bridge');
		expect(levelUp).not.toHaveBeenCalled();
		$player.set({ ...$player.get(), inventory: { ...$player.get().inventory, 'potion-speed': 1 } });
		game.completeQuest('merchant');

		expect(brewed).toHaveBeenCalledWith({ potionId: 'potion-life', name: 'Poción de Vida' });
		expect(brewed).toHaveBeenCalledTimes(2);
		expect(levelUp).toHaveBeenCalledWith({ level: 2 });
		offBrewed();
		events.off('level:up', levelUp);
	});

	it('no tocan el store ni emiten nada si la acción falla', () => {
		const bought = vi.fn();
		events.on('item:bought', bought);
		const before = $player.get();
		const result = game.buy('crystal', 10);
		expect(result.ok).toBe(false);
		expect($player.get()).toBe(before);
		expect(bought).not.toHaveBeenCalled();
		events.off('item:bought', bought);
	});
});

describe('parseSave', () => {
	const valid = { ...createInitialState(), gold: 42, inventory: { herb: 2 }, completedQuests: ['bridge'] };

	it('recupera una partida válida', () => {
		expect(parseSave(JSON.stringify(valid))).toEqual(valid);
	});

	it('devuelve null con datos corruptos o de otra versión', () => {
		for (const raw of [
			null,
			'',
			'{',
			'[]',
			'"hola"',
			JSON.stringify({ ...valid, gold: -5 }),
			JSON.stringify({ ...valid, version: SAVE_VERSION + 1 }),
		]) {
			expect(parseSave(raw)).toBeNull();
		}
	});

	it('descarta las entradas sueltas que no son válidas', () => {
		const dirty = {
			...valid,
			inventory: { herb: 2, 'dragon-egg': 1, crystal: -3, slime: 1.5 },
			completedQuests: ['bridge', 'bridge', 'unknown', 7],
			customQuests: [customQuest(), customQuest(), { id: 'broken' }],
		};
		expect(parseSave(JSON.stringify(dirty))).toEqual({
			...valid,
			customQuests: [customQuest()],
		});
	});
});
