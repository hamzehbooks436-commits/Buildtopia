import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { World, generateWorld } from '../world.js';
import { buildLegacyAutumnWorld } from '../autumn-legacy.js';
import { applyNpcOffer, normalizeNpc } from '../npcs.js';
import { countItem } from '../inventory.js';
import { claimGhost, updateGhostSpawns, GHOST_SPAWN_INTERVAL as hour } from '../ghosts.js';
import { TILE_DEFS } from '../definitions.js';
import { drawShop, shopActionAt, drawTile } from '../ui.js';

test('old 128-wide saves expand without shifting crops, builds, walls, or capture receipts', () => {
  const old = buildLegacyAutumnWorld(new World(128));
  old.set(20, 30, 50); old.setBackground(22, 30, 88);
  old.plant(21, 37, 82);
  old.blockSettings['20,30'] = { note: 'keep' };
  claimGhost(old, 'cabin-west', 'alice', 1000);
  const saved = old.serialize();
  delete saved.width; delete saved.height; delete saved.autumnLayoutVersion; delete saved.ghostSpawnVersion;
  const upgraded = World.fromSave(saved);
  assert.equal(upgraded.width, 256);
  assert.equal(upgraded.get(20, 30), 50);
  assert.equal(upgraded.getBackground(22, 30), 88);
  assert.equal(upgraded.get(21, 37), 82);
  assert.equal(upgraded.blockSettings['20,30'].note, 'keep');
  assert.equal(upgraded.ghosts['cabin-west'].caughtBy, 'alice');
  assert.equal(Object.values(upgraded.ghosts).filter(ghost => !ghost.caughtBy).length, 1);
  assert.equal(upgraded.foreground.includes(61), false, 'Untouched old ponds are removed');
  assert.equal(Object.keys(upgraded.familyNpcs).length, 3);
  assert.deepEqual(World.fromSave(upgraded.serialize()).serialize(), upgraded.serialize());
  const normal = new World(128); normal.surface.fill(39); normal.set(126, 40, 56);
  const expanded = World.fromSave(normal.serialize());
  assert.equal(expanded.get(126, 40), 56);
  assert.ok(expanded.isSolid(254, expanded.surface[254]));
});

test('family payments and rewards are exact, repeatable, and accept mixed autumn trees', () => {
  const family = generateWorld('autumn-family').familyNpcs;
  for (const [id, npc] of Object.entries(family)) assert.equal(normalizeNpc(npc).x, npc.x);
  const pumpkin = family['family-mother'].offers.trade;
  const bag = { slots: [{ itemId: 'pumpkin_block', count: 20 }, null, null], size: 3 };
  const first = applyNpcOffer(bag, pumpkin, 'mother', 'first');
  assert.equal(countItem(first.slots, 'pumpkin_block'), 10);
  assert.equal(countItem(first.slots, 'gems'), 50);
  const second = applyNpcOffer(first, pumpkin, 'mother', 'second');
  assert.equal(countItem(second.slots, 'pumpkin_block'), 0);
  assert.equal(countItem(second.slots, 'gems'), 100);
  const mushrooms = applyNpcOffer({ slots: [{ itemId: 'forest_mushroom', count: 5 }, null], size: 2 }, family['family-child'].offers.trade, 'child', 'first');
  assert.equal(countItem(mushrooms.slots, 'forest_mushroom'), 0);
  assert.equal(countItem(mushrooms.slots, 'gems'), 20);
  const mix = { slots: [{ itemId: 'tile_90', count: 7 }, { itemId: 'tile_91', count: 5 }, { itemId: 'tile_92', count: 9 }, null], size: 4 };
  const lumber = family['family-father'].offers.trade;
  const traded = applyNpcOffer(mix, lumber, 'father', 'first');
  assert.equal(countItem(traded.slots, 'pickaxe'), 1);
  assert.equal(['tile_90', 'tile_91', 'tile_92'].reduce((n, id) => n + countItem(traded.slots, id), 0), 1);
  assert.equal(countItem(mix.slots, 'tile_90'), 7, 'Retry staging preserves source');
  assert.throws(() => applyNpcOffer({ slots: [{ itemId: 'tile_91', count: 19 }], size: 1 }, lumber, 'father', 'short'), /need 20/);
  for (const tile of [90, 91, 92]) assert.ok(TILE_DEFS[tile].harvest.drops.some(drop => drop.item === `tile_${tile}`));
});

test('family house walls, foundations and interiors resist mining and blocked doorways', async () => {
  const world = generateWorld('fall-protection'), source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
  const house = world.familyHouse;
  for (const point of [[house.left, 36], [house.right, 38], [205, 39], [209, 38]]) assert.equal(world.isProtected(...point), true);
  assert.equal(world.isProtected(house.right + 1, 38), false);
  let updates = 0;
  const state = { world, inventoryBusy: false, adminTools: null, TILE_DEFS,
    isAdminAccount: () => true, user: {}, localMode: false,
    mutateWorld: async () => { updates++; return true; } };
  vm.createContext(state);
  vm.runInContext(source.slice(source.indexOf('async function completeBreak('), source.indexOf('function updateBreaking(')), state);
  await state.completeBreak({ x: 202, y: 39, tileId: 56 });
  await state.completeBreak({ x: 205, y: 38, tileId: 88, background: true });
  assert.equal(updates, 0, 'Admin and regular mining cannot destroy the house');
  for (const npc of Object.values(world.familyNpcs)) assert.ok(!world.isSolid(npc.x, npc.y) && world.isSolid(npc.x, npc.y + 1));
});

test('only one ghost spawns per real hour with a persisted cap of two wild ghosts', () => {
  const world = generateWorld('fall-clock'), start = world.ghostSpawnedAt;
  assert.equal(updateGhostSpawns(world, start + hour - 1), 0);
  assert.equal(updateGhostSpawns(world, start + hour), 1);
  assert.equal(Object.values(world.ghosts).filter(ghost => !ghost.caughtBy).length, 2);
  assert.equal(updateGhostSpawns(world, start + hour), 0);
  assert.equal(updateGhostSpawns(world, start + 2 * hour), 0);
  claimGhost(world, 'initial', 'alice', start + 2 * hour);
  const restored = World.fromSave(world.serialize());
  assert.equal(updateGhostSpawns(restored, start + 2 * hour), 0);
  assert.equal(updateGhostSpawns(restored, start + 3 * hour), 1);
  assert.equal(Object.values(restored.ghosts).filter(ghost => !ghost.caughtBy).length, 2);
  for (const [id, ghost] of Object.entries(restored.ghosts)) if (!ghost.caughtBy) claimGhost(restored, id, 'alice', start + 3 * hour);
  assert.equal(updateGhostSpawns(restored, start + 8 * hour), 1, 'Missed hours spawn once, not a crowd');
  assert.equal(Object.values(restored.ghosts).filter(ghost => !ghost.caughtBy).length, 1);
  assert.equal(restored.ghosts.initial.caughtBy, 'alice');
});

test('trees draw in exactly one tile and Clothes exposes reachable pets on desktop and mobile', () => {
  const draws = [];
  const ctx = new Proxy({}, { get(target, prop) { if (prop === 'drawImage') return (...args) => draws.push(args); return () => {}; } });
  for (const tree of [90, 91, 92]) {
    drawTile(ctx, { tiles: {} }, tree, 10, 20, 32);
    assert.deepEqual(draws.pop().slice(-4), [10, 20, 32, 32]);
  }
  const save = { ghostPets: { caught: { variant: 1, caughtAt: 1000 } }, equippedGhost: 'caught' };
  for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
    const clothes = drawShop(ctx, {}, [], width, height, 'clothes', false, save);
    assert.ok(clothes.buttons.some(button => button.action.sectionId === 'clothes-pets'));
    const pets = drawShop(ctx, {}, [], width, height, 'clothes-pets', false, save);
    assert.ok(pets.y >= 0 && pets.y + pets.panelHeight * pets.scale <= height);
    for (const target of [...pets.cards, ...pets.buttons]) {
      const point = { x: pets.offsetX + (target.x + 10) * pets.scale, y: pets.y + (target.y + 10 - pets.y) * pets.scale };
      assert.deepEqual(shopActionAt(point, pets), target.action);
    }
    assert.ok(pets.cards.some(card => card.action.kind === 'pet' && card.action.petId === 'caught'));
    assert.ok(pets.buttons.some(button => button.action.kind === 'pet' && button.action.petId === null));
  }
});
