import { placementCheck } from "../building.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { World, generateWorld } from '../world.js';
import { ITEM_DEFS, SHOP_ITEMS, TILE_DEFS, spliceResult } from '../definitions.js';
import { AUTUMN_LEAF_INTERVAL as hour } from '../autumn.js';
import { claimGhost, findGhost, followGhost, ghostPosition, GHOST_NAMES, keepCaughtGhost, petState } from '../ghosts.js';
import { applyNpcOffer } from '../npcs.js';
import { applyClothing } from '../wardrobe.js';
import { addItem, createInventory, removeItem } from '../inventory.js';
import { TILE_SIZE } from '../config.js';

const count = (world, tile) => Array.from(world.foreground).filter(value => value === tile).length;
const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');

test('autumn worlds are wider, flatter and sparse, with no ponds or structure labels', () => {
  for (const name of ['autumn-woods', 'fall-village', 'AUTUMN-test', 'FallTest']) {
    const world = generateWorld(name);
    assert.equal(world.worldType, 'autumn');
    assert.equal(world.width, 256);
    assert.equal(world.height, 72);
    for (const tile of [81, 89, 90, 91, 92, 93, 94, 95, 96, 97]) assert.ok(count(world, tile) > 0);
    assert.equal(count(world, 61), 0);
    assert.ok(Math.max(...world.surface) - Math.min(...world.surface) <= 2);
    assert.ok([90, 91, 92].reduce((sum, tile) => sum + count(world, tile), 0) < 15);
    assert.equal(count(world, 87), 5);
    assert.equal(world.get(16, 38), 6);
    assert.ok(world.isSolid(16, 39));
    assert.equal(Object.keys(world.ghosts).length, 1);
    assert.ok(world.background.includes(88));
    assert.deepEqual(world.generatedPlaces, []);
    assert.equal(Object.keys(world.familyNpcs).length, 3);
    for (const [right, floor] of [[100, 39], [216, 39]]) {
      assert.equal(world.get(right, floor - 1), 0);
      assert.equal(world.get(right, floor - 2), 0);
      assert.equal(world.isSolid(right, floor - 1), false);
    }
    assert.deepEqual(World.fromSave(world.serialize()).serialize(), world.serialize());
  }
  assert.equal(generateWorld('normal-autumn').worldType, 'sky');
});

test('hourly leaves persist their deadline, count placed batches, preserve builds, and never grow crops', () => {
  const world = generateWorld('fall-leaves'), start = world.autumnGrownAt;
  world.foreground[world.foreground.indexOf(87)] = 0;
  assert.equal(world.updateAutumnResources(start + hour - 1), 0);
  const restored = World.fromSave(world.serialize());
  assert.equal(restored.updateAutumnResources(start + hour), 1);
  assert.equal(count(restored, 87), 5);
  assert.equal(restored.updateAutumnResources(start + hour), 0);
  restored.set(30, 20, 87); // A player-placed batch also counts toward the cap.
  assert.equal(restored.updateAutumnResources(start + 3 * hour), 0);
  assert.equal(count(restored, 87), 6, 'Placed blocks are not deleted to enforce a spawn cap');
  assert.equal(restored.autumnGrownAt, start + 3 * hour);
  assert.ok(TILE_DEFS[87].drops.every(drop => !drop.item.endsWith('_seed')));
  const blocked = generateWorld('fall-blocked'); blocked.foreground.fill(56);
  assert.equal(blocked.updateAutumnResources(blocked.autumnGrownAt + hour), 0);
  assert.ok(blocked.foreground.every(tile => tile === 56));
  assert.equal(generateWorld('garden').updateAutumnResources(Date.now() + hour), 0);
});

test('pumpkin drops have a true 50 percent boundary and never duplicate crops', () => {
  const dropsSource = source.slice(source.indexOf('function dropsFor('), source.indexOf('function collectDrops('));
  for (const roll of [0, .499999, .5, .999]) {
    const state = { Math: Object.assign(Object.create(Math), { random: () => roll }) };
    vm.createContext(state); vm.runInContext(dropsSource, state);
    const drops = state.dropsFor(TILE_DEFS[81]);
    assert.equal(drops.some(drop => drop.item === 'pumpkin_seed'), roll < .5);
    assert.ok(drops.every(drop => drop.amount === 1));
  }
});

test('pumpkin and torch splice in either order with retry-safe placement and refunds', async () => {
  const placement = source.slice(source.indexOf('async function placeSelected('), source.indexOf('function updateCamera'));
  const mutation = source.slice(source.indexOf('async function mutateWorld('), source.indexOf('async function savePlayerState('));
  assert.equal(spliceResult(82, 79), 'jack_o_lantern_seed');
  for (const [first, second] of [['pumpkin_seed', 'torch_seed'], ['torch_seed', 'pumpkin_seed']]) {
    for (const mode of ['retry', 'changed', 'offline']) {
      const world = new World(); world.plant(5, 5, ITEM_DEFS[first].placesTile);
      let saved = world.serialize();
      const state = { world, inventory: [{ itemId: second, count: 2 }], selectedSlot: 0, shopOpen: false,
        pendingWorldChange: false, inventoryBusy: false, adminTools: null, player: { x: 5 * 32, y: 5 * 32, width: 22, height: 32 }, worldStateRef: {},
        buildMode: false, placementCheck, ITEM_DEFS, TILE_DEFS, spliceResult, World, addItem, removeItem,
        tileTarget: () => ({ x: 5, y: 5, inBounds: true, reachable: true, tileId: world.get(5, 5) }),
        canBuild: () => true, playerOverlapsTile: () => false, notify() {}, stopBreaking() {}, savePlayerState() {},
        runTransaction: async (_, callback) => {
          if (mode === 'offline') throw Error('offline');
          if (mode === 'changed') saved.foreground[world.index(5, 5)] = 2;
          if (mode === 'retry') callback(saved);
          const next = callback(saved); if (next) saved = next;
          return { committed: !!next, snapshot: { val: () => saved } };
        } };
      vm.createContext(state); vm.runInContext(mutation + placement, state); await state.placeSelected();
      assert.equal(state.inventory[0].count, mode === 'retry' ? 1 : 2);
      if (mode === 'retry') {
        const grown = World.fromSave(state.world.serialize());
        assert.equal(grown.get(5, 5), 85);
        assert.equal(grown.updatePlants(grown.plantedTiles[0].plantedAt + 60000), 1);
        assert.equal(grown.get(5, 5), 86);
        assert.ok(TILE_DEFS[86].harvest.drops.some(drop => drop.item === 'jack_o_lantern'));
      }
    }
  }
});

test('all tree types drop background walls; planted autumn trees retain autumn colours', () => {
  for (const tree of [20, 62, 69, 90, 91, 92]) assert.ok(TILE_DEFS[tree].harvest.drops.some(drop => drop.item === 'wood_background' && drop.count === 2));
  const world = generateWorld('autumn-garden'); world.plant(18, 37, 75, 100);
  world.updatePlants(30100); assert.ok([90, 91, 92].includes(world.get(18, 37)));
  const regular = new World(); regular.plant(18, 37, 75, 100); regular.updatePlants(30100);
  assert.equal(regular.get(18, 37), 20);
});

test('wood walls coexist with foreground builds, survive saves, and can be mined', async () => {
  const world = generateWorld('autumn-walls'); world.setBackground(18, 36, 88); world.set(18, 36, 56);
  const restored = World.fromSave(world.serialize()); assert.equal(restored.getBackground(18, 36), 88);
  restored.set(18, 36, 0);
  const breakSource = source.slice(source.indexOf('async function completeBreak('), source.indexOf('function updateBreaking('));
  const state = { world: restored, inventoryBusy: false, adminTools: null, TILE_DEFS, user: { uid: 'local' }, localMode: true,
    mutateWorld: async callback => { callback(restored); return true; }, collectDrops: drops => ({ collected: drops, inventoryFull: false }),
    dropsFor: def => def.drops, formatDrops: () => 'wall', notify() {}, savePlayerState() {} };
  vm.createContext(state); vm.runInContext(breakSource, state);
  await state.completeBreak({ x: 18, y: 36, tileId: 88, background: true });
  assert.equal(restored.getBackground(18, 36), 0);
  assert.equal(restored.get(18, 36), 0);
});

test('ghost capture is exclusive, retry-safe, saved across worlds, and follows its player', () => {
  const world = generateWorld('fall-pets'); const [id, ghost] = Object.entries(world.ghosts)[0];
  const pos = ghostPosition(ghost, 1000), player = { x: pos.x, y: pos.y, width: 22, height: TILE_SIZE, facing: 1 };
  assert.equal(findGhost(world, player, pos, 1000).id, id);
  assert.equal(findGhost(world, { ...player, x: 100000 }, null, 1000), null);
  assert.equal(claimGhost(world, id, 'alice', 1000), true);
  assert.equal(claimGhost(world, id, 'bob', 1000), false);
  assert.equal(findGhost(world, player, pos, 1000), null);
  const restored = World.fromSave(world.serialize());
  assert.equal(restored.ghosts[id].caughtBy, 'alice');
  const original = { slots: createInventory(), size: 20, ownedOutfits: { 'autumn-plaid': true } };
  const saved = keepCaughtGhost(original, 'fall-pets', id, restored.ghosts[id], 'alice');
  assert.deepEqual(keepCaughtGhost(saved, 'fall-pets', id, restored.ghosts[id], 'alice'), saved);
  assert.equal(Object.keys(petState(saved).ghostPets).length, 1);
  assert.throws(() => keepCaughtGhost(original, 'fall-pets', id, restored.ghosts[id], 'bob'));
  const pet = petState(JSON.parse(JSON.stringify(saved))).ghostPets[saved.equippedGhost];
  const follower = followGhost(pet, player, null, .03, 1000);
  const moved = followGhost(pet, { ...player, x: player.x + 100 }, follower, .03, 1000);
  assert.ok(moved.x > follower.x);
  assert.equal(followGhost(null, player, moved, .03), null);
  assert.equal(petState(saved).equippedGhost, saved.equippedGhost);
  assert.deepEqual(petState(applyNpcOffer(saved, { requires: [], rewards: [], repeatable: true }, 'npc', 'request')), petState(saved));
  assert.deepEqual(petState(applyClothing(saved, 'autumn-plaid')), petState(saved));
});

test('failed pet save recovers the claimed ghost exactly once without consuming the tool', async () => {
  const world = generateWorld('autumn-retry'), [id, ghost] = Object.entries(world.ghosts)[0];
  const pos = ghostPosition(ghost), inventory = [{ itemId: 'ghost_buster', count: 1 }];
  let failSave = true;
  const state = { world, worldKey: 'autumn-retry', user: { uid: 'alice' }, inventory, selectedSlot: 0,
    inventoryMeta: petState(), running: true, shopOpen: false, inventoryOpen: false, recipesOpen: false,
    petsPanel: { hidden: true }, doorSettings: { hidden: true }, tradePanel: { hidden: true }, inventoryBusy: false,
    ghostCaptureBusy: false, pendingWorldChange: false, adminTools: null, player: { ...pos, width: 22, height: 32 },
    input: { pointer: pos }, zoom: 1, camera: { x: 0, y: 0 }, petFollower: null,
    findGhost, claimGhost, keepCaughtGhost, GHOST_NAMES, resetGameInput() {}, notify() {}, updatePresence() {},
    mutateWorld: async callback => callback(world) !== false,
    changeSpecialInventory: async transform => { if (failSave) throw Error('offline'); state.inventoryMeta = petState(transform({ ...state.inventoryMeta, slots: inventory, size: 20 })); },
  };
  const captureSource = source.slice(source.indexOf('async function recoverGhostPets('), source.indexOf('function throwSelectedSnowball('));
  vm.createContext(state); vm.runInContext(captureSource, state);
  await state.captureGhost(false);
  assert.equal(world.ghosts[id].caughtBy, 'alice');
  assert.equal(Object.keys(state.inventoryMeta.ghostPets).length, 0);
  failSave = false; await state.recoverGhostPets(); await state.recoverGhostPets();
  assert.equal(Object.keys(state.inventoryMeta.ghostPets).length, 1);
  assert.equal(inventory[0].count, 1);
});

test('Ghost Buster is NPC-only and no autumn crop leaks into seed packages', () => {
  assert.equal(ITEM_DEFS.ghost_buster.npcOnly, true);
  assert.equal(SHOP_ITEMS.some(offer => offer.item === 'ghost_buster'), false);
  assert.ok(!createInventory().some(slot => slot?.itemId === 'ghost_buster'));
  const npcSave = applyNpcOffer({ slots: Array(20).fill(null), size: 20 }, { requires: [], rewards: [{ itemId: 'ghost_buster', amount: 1 }], repeatable: true }, 'your-npc', 'reward');
  assert.ok(npcSave.slots.some(slot => slot?.itemId === 'ghost_buster'));
  assert.equal(ITEM_DEFS.pumpkin_seed.excludeFromSeedPackage, true);
  assert.equal(ITEM_DEFS.jack_o_lantern_seed.excludeFromSeedPackage, true);
  for (const def of Object.values(TILE_DEFS)) assert.ok(!(def.harvest?.drops ?? def.drops ?? []).some(drop => drop.item === 'ghost_buster'));
});
