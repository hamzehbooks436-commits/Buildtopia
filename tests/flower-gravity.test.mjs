import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { World } from '../world.js';

for (const tile of [21, 28, 29, 31, 32, 40, 41, 42, 43]) {
  const world = new World();
  world.set(5, 4, tile);
  world.set(5, 5, 1);
  world.set(5, 12, 2);
  assert.equal(world.settleFlowers(), 0);
  world.set(5, 5, 0);
  assert.equal(world.settleFlowers(), 1);
  assert.equal(world.get(5, 4), 0);
  assert.equal(world.get(5, 11), tile);
  assert.equal(world.settleFlowers(), 0);
  assert.equal(World.fromSave(world.serialize()).get(5, 11), tile);
}

const stacked = new World();
stacked.set(2, 2, 40);
stacked.set(2, 4, 41);
stacked.set(2, 10, 1);
stacked.naturalFlowers = [{ x: 2, y: 2 }, { x: 2, y: 4 }];
stacked.settleFlowers();
assert.equal(stacked.get(2, 8), 40);
assert.equal(stacked.get(2, 9), 41);
assert.deepEqual(stacked.naturalFlowers, [{ x: 2, y: 8 }, { x: 2, y: 9 }]);

const objects = new World();
objects.set(3, 1, 42);
objects.set(3, 3, 6);
objects.plant(3, 5, 12);
objects.set(3, 7, 5);
objects.set(3, 12, 3);
objects.updateFlowers(objects.flowerGrownAt + 1);
assert.equal(objects.get(3, 11), 42, 'Existing floating flowers settle before hourly growth');
assert.equal(objects.get(3, 3), 6);
assert.equal(objects.get(3, 5), 12);
assert.equal(objects.get(3, 7), 5);
assert.equal(objects.plantedTiles.length, 1);
const bottom = new World();
bottom.set(3, 2, 43);
bottom.settleFlowers();
assert.equal(bottom.get(3, bottom.height - 1), 43);

// Exercise the real transaction wrapper, including a Firebase callback retry.
const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const wrapper = source.slice(source.indexOf('async function mutateWorld('), source.indexOf('async function savePlayerState('));
const initial = new World();
initial.set(5, 4, 40);
initial.set(5, 5, 1);
initial.set(5, 10, 2);
let saved = initial.serialize();
const state = {
  pendingWorldChange: false, worldStateRef: {}, World,
  generateWorld: () => new World(), notify: () => {},
  runTransaction: async (_, callback) => {
    callback(saved);
    saved = callback(saved);
    return { committed: true, snapshot: { val: () => saved } };
  },
};
vm.createContext(state);
vm.runInContext(wrapper, state);
assert.equal(await state.mutateWorld(next => next.set(5, 5, 0)), true);
assert.equal(saved.foreground[initial.index(5, 9)], 40);
assert.equal(state.world.get(5, 9), 40);
assert.equal(saved.foreground.filter(tile => tile === 40).length, 1);
console.log('Flower support, all colors and blooms, stacking, tracking, existing saves, object preservation and transaction retry passed.');
