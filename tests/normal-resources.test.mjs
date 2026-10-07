import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { World, generateWorld } from '../world.js';
import { ITEM_DEFS, TILE_DEFS, spliceResult } from '../definitions.js';
import { addItem, removeItem } from '../inventory.js';
import { drawWorldLighting } from '../ui.js';

for (let i = 0; i < 12; i++) {
  const world = generateWorld(`normal-${i}`);
  const coal = [...world.foreground.entries()].filter(([, tile]) => tile === 74);
  assert.equal(coal.length, 40);
  for (const [index] of coal) {
    const x = index % world.width, y = Math.floor(index / world.width);
    assert.ok(y >= world.surface[x] + 5 && y < world.height - 3);
  }
  assert.ok(world.foreground.includes(20));
  assert.deepEqual(World.fromSave(world.serialize()).serialize(), world.serialize());
  const [minedIndex] = coal[0];
  world.foreground[minedIndex] = 0;
  assert.equal([...World.fromSave(world.serialize()).foreground].filter(tile => tile === 74).length, 39, 'Mined coal stays depleted');
}
for (const name of ['beach-test', 'ice-test', 'snow-test']) assert.ok(!generateWorld(name).foreground.includes(74));
const legacy = generateWorld('old-normal').serialize();
delete legacy.normalResourcesVersion;
legacy.foreground = legacy.foreground.map(tile => tile === 74 ? 2 : tile);
legacy.foreground[15] = 56; // Preserve a player build.
const upgraded = World.fromSave(legacy);
assert.equal([...upgraded.foreground].filter(tile => tile === 74).length, 40);
assert.equal(upgraded.foreground[15], 56);
assert.deepEqual(upgraded.serialize(), World.fromSave(legacy).serialize(), 'Migration is stable across transaction retries');

const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const dropSource = source.slice(source.indexOf('function dropsFor('), source.indexOf('function collectDrops('));
function drops(tile, rolls) {
  const state = { Math: Object.assign(Object.create(Math), { random: () => { assert.ok(rolls.length); return rolls.shift(); } }) };
  vm.createContext(state);
  vm.runInContext(dropSource, state);
  return JSON.parse(JSON.stringify(state.dropsFor(TILE_DEFS[tile])));
}
assert.deepEqual(drops(20, [0, .9]), [{ item: 'wood_block', amount: 1 }, { item: 'wood_background', amount: 2 }]);
assert.deepEqual(drops(20, [.999, .1]), [{ item: 'wood_block', amount: 3 }, { item: 'wood_seed', amount: 1 }, { item: 'wood_background', amount: 2 }]);
for (const [a, b] of [[.1, .1], [.1, .9], [.9, .1], [.9, .9]]) {
  const result = drops(56, [a, b]);
  assert.equal(result.some(drop => drop.item === 'wood_seed'), a < .5);
  assert.equal(result.some(drop => drop.item === 'gems'), b < .5);
  assert.ok(result.every(drop => drop.amount === 1));
}
for (const item of ['wood_seed', 'coal_seed', 'torch_seed']) {
  const world = new World(), tile = ITEM_DEFS[item].placesTile;
  const now = Date.now();
  world.plant(5, 5, tile, now);
  assert.equal(world.updatePlants(now + TILE_DEFS[tile].growTime - 1), 0);
  const restored = World.fromSave(world.serialize());
  assert.equal(restored.updatePlants(now + TILE_DEFS[tile].growTime), 1);
  assert.equal(restored.get(5, 5), TILE_DEFS[tile].growsInto);
}

const placement = source.slice(source.indexOf('async function placeSelected()'), source.indexOf('function updateCamera'));
const mutation = source.slice(source.indexOf('async function mutateWorld('), source.indexOf('async function savePlayerState('));
for (const [first, second] of [['wood_seed', 'coal_seed'], ['coal_seed', 'wood_seed']]) {
  for (const mode of ['retry', 'changed', 'failure']) {
    const world = new World();
    world.plant(5, 5, ITEM_DEFS[first].placesTile);
    let saved = world.serialize();
    const state = {
      world, inventory: [{ itemId: second, count: 2 }], selectedSlot: 0,
      shopOpen: false, pendingWorldChange: false, inventoryBusy: false, adminTools: null,
      player: {}, worldStateRef: {}, ITEM_DEFS, TILE_DEFS, spliceResult, World, addItem, removeItem,
      tileTarget: () => ({ x: 5, y: 5, inBounds: true, reachable: true, tileId: world.get(5, 5) }),
      canBuild: () => true, playerOverlapsTile: () => false,
      notify: () => {}, stopBreaking: () => {}, savePlayerState: () => {},
      runTransaction: async (_, callback) => {
        if (mode === 'failure') throw new Error('offline');
        if (mode === 'changed') saved.foreground[world.index(5, 5)] = 2;
        if (mode === 'retry') callback(saved);
        const result = callback(saved);
        if (result) saved = result;
        return { committed: result !== undefined, snapshot: { val: () => saved } };
      },
    };
    vm.createContext(state);
    vm.runInContext(mutation + placement, state);
    await state.placeSelected();
    assert.equal(state.inventory[0].count, mode === 'retry' ? 1 : 2);
    if (mode === 'retry') {
      assert.equal(state.world.get(5, 5), 79);
      assert.equal(state.world.plantedTiles.length, 1);
      const restored = World.fromSave(state.world.serialize());
      assert.equal(restored.get(5, 5), 79);
      assert.equal(restored.updatePlants(restored.plantedTiles[0].plantedAt + 45000), 1);
      assert.equal(restored.get(5, 5), 80);
    }
  }
}
const litWorld = new World();
assert.deepEqual(drops(79, []), [{ item: 'torch_seed', amount: 1 }]);
assert.deepEqual(drops(80, [0, .9]), [{ item: 'torch', amount: 1 }]);
assert.deepEqual(drops(80, [.999, .1]), [{ item: 'torch', amount: 3 }, { item: 'torch_seed', amount: 1 }]);
assert.equal(TILE_DEFS[79].lightRadius, undefined, 'Growing a crop does not place a lit torch');
litWorld.surface.fill(1);
function shade(world) {
  const shades = [], glows = [];
  const ctx = { save() {}, restore() {}, fillRect(x, y) { shades.push({ x, y, color: this.fillStyle }); }, createRadialGradient(...args) { glows.push(args); return { addColorStop() {} }; } };
  drawWorldLighting(ctx, world, { x: 0, y: 0 }, 320, 320);
  return { shades, glows };
}
const unlit = shade(litWorld);
litWorld.set(5, 5, 78);
const lit = shade(litWorld);
assert.equal(unlit.shades.find(rect => rect.x === 160 && rect.y === 160).color, 'rgba(8, 16, 30, 0.34)');
assert.equal(lit.shades.find(rect => rect.x === 160 && rect.y === 160).color, 'rgba(8, 16, 30, 0)');
assert.equal(lit.glows.length, 1);
litWorld.set(5, 5, 0);
assert.deepEqual(shade(litWorld), unlit, 'Removing a torch removes its light');
litWorld.set(10, 5, 78);
assert.equal(shade(litWorld).glows.length, 1, 'Off-screen torches still light the viewport');
console.log('Passed normal resource generation, migration, drops, crop growth, transactional torch crafting, and lighting checks.');
