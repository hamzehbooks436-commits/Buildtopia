import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { World } from '../world.js';
import { ITEM_DEFS, TILE_DEFS, spliceResult } from '../definitions.js';
import { addItem, removeItem } from '../inventory.js';

// Exercise the actual placement and transaction callbacks without a live account.
const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const placement = source.slice(source.indexOf('async function placeSelected()'), source.indexOf('function updateCamera'));
const mutation = source.slice(source.indexOf('async function mutateWorld('), source.indexOf('async function savePlayerState('));
function game(first, second, mode = 'success') {
  const world = new World();
  if (first) world.plant(5, 5, first);
  const inventory = [{ itemId: second, count: 2 }]; // Full bag must still splice.
  let saved = world.serialize();
  const state = {
    world, inventory, selectedSlot: 0, shopOpen: false, pendingWorldChange: false, inventoryBusy: false, adminTools: null,
    player: {}, worldStateRef: {}, ITEM_DEFS, TILE_DEFS, spliceResult, World,
    addItem, removeItem, generateWorld: () => new World(),
    tileTarget: () => ({ x: 5, y: 5, inBounds: true, reachable: true, tileId: world.get(5, 5) }),
    canBuild: () => true, playerOverlapsTile: () => false,
    notify: () => {}, stopBreaking: () => {}, savePlayerState: () => {},
    runTransaction: async (_, callback) => {
      if (mode === 'failure') throw new Error('offline');
      if (mode === 'changed') saved.foreground[world.index(5, 5)] = 2;
      if (mode === 'grown') saved.plantedTiles[0].plantedAt = 0;
      if (mode === 'retry') callback(saved);
      const result = callback(saved);
      if (result) saved = result;
      return { committed: result !== undefined, snapshot: { val: () => saved } };
    },
  };
  vm.createContext(state);
  vm.runInContext(mutation + placement, state);
  return state;
}
let checks = 0;
for (const [ingredient, result] of [['red_flower_seed','red_block_seed'], ['blue_flower_seed','blue_block_seed'], ['green_flower_seed','green_block_seed'], ['yellow_flower_seed','yellow_block_seed'], ['rock_seed','brick_seed']]) {
  for (const [first, second] of [['clay_seed', ingredient], [ingredient, 'clay_seed']]) {
    const g = game(ITEM_DEFS[first].placesTile, second, 'retry');
    await g.placeSelected();
    const tile = ITEM_DEFS[result].placesTile;
    assert.equal(g.world.get(5, 5), tile);
    assert.equal(g.inventory[0].count, 1);
    assert.equal(g.world.plantedTiles.length, 1);
    assert.equal(g.world.plantedTiles[0].tileId, tile);
    assert.equal(TILE_DEFS[tile].drops[0].item, result);
    const restored = World.fromSave(g.world.serialize());
    assert.equal(restored.get(5, 5), tile);
    const time = restored.plantedTiles[0].plantedAt;
    assert.equal(restored.updatePlants(time + TILE_DEFS[tile].growTime - 1), 0);
    assert.equal(restored.updatePlants(time + TILE_DEFS[tile].growTime), 1);
    assert.equal(restored.get(5, 5), TILE_DEFS[tile].growsInto);
    for (const drop of TILE_DEFS[restored.get(5, 5)].harvest.drops) assert.ok(ITEM_DEFS[drop.item]);
    checks++;
  }
}
for (const mode of ['failure', 'changed', 'grown']) {
  const g = game(12, 'red_flower_seed', mode);
  await g.placeSelected();
  assert.equal(g.inventory[0].count, 2);
  assert.notEqual(g.world.get(5, 5), 19);
  checks++;
}
for (const tile of [13, 25, 1]) {
  const g = game(tile, 'red_flower_seed');
  await g.placeSelected();
  assert.equal(g.inventory[0].count, 2);
  assert.equal(g.world.get(5, 5), tile);
  checks++;
}
for (const restriction of ['locked', 'unreachable', 'pending']) {
  const g = game(12, 'red_flower_seed');
  if (restriction === 'locked') g.canBuild = () => false;
  if (restriction === 'unreachable') g.tileTarget = () => ({ inBounds: true, reachable: false });
  if (restriction === 'pending') g.pendingWorldChange = true;
  await g.placeSelected();
  assert.equal(g.inventory[0].count, 2);
  assert.equal(g.world.get(5, 5), 12);
  checks++;
}
const ordinary = game(0, 'clay_seed');
await ordinary.placeSelected();
assert.equal(ordinary.world.get(5, 5), 12);
assert.equal(ordinary.inventory[0].count, 1);
const brick = ITEM_DEFS.brick_block.placesTile;
assert.ok(TILE_DEFS[brick].solid);
assert.ok(TILE_DEFS[brick].drops.some(d => d.item === 'brick_seed'));
console.log(`Passed ${checks + 2} placement, splicing, growth, persistence, and brick checks.`);
