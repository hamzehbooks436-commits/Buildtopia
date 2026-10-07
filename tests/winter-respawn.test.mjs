import assert from 'node:assert/strict';
import { World, generateWorld } from '../world.js';

const hour = 3600000;
const count = (world, tile) => world.foreground.filter(value => value === tile).length;
const world = generateWorld('snow-respawn');
const start = world.winterGrownAt;
assert.equal(world.updateWinterResources(start + hour - 1, 0), 0);
world.updateWinterResources(start + hour, .5);
assert.equal(count(world, 69), 12);
assert.equal(count(world, 70), 9);
assert.equal(count(world, 73), 0, '50% boundary is a failed roll');
for (const tile of [69, 70]) world.foreground[world.foreground.indexOf(tile)] = 0;
const restored = World.fromSave(world.serialize());
assert.equal(restored.winterGrownAt, start + hour);
assert.equal(restored.updateWinterResources(start + hour, 0), 0, 'Reload cannot duplicate the hourly attempt');
restored.updateWinterResources(start + 2 * hour, 0);
assert.equal(count(restored, 69), 12);
assert.equal(count(restored, 70), 9);
assert.equal(count(restored, 73), 1);
restored.updateWinterResources(start + 3 * hour, .49);
restored.updateWinterResources(start + 4 * hour, 0);
assert.equal(count(restored, 73), 2);
for (let i = 0; i < restored.foreground.length; i++) {
  if (![69, 70, 73].includes(restored.foreground[i])) continue;
  const x = i % restored.width, y = Math.floor(i / restored.width);
  assert.ok(restored.isSolid(x, y + 1), 'Spawns stand on ground');
}
const blocked = generateWorld('ice-blocked');
blocked.foreground.fill(68);
assert.equal(blocked.updateWinterResources(blocked.winterGrownAt + hour, 0), 0);
assert.ok(blocked.foreground.every(tile => tile === 68), 'Occupied tiles are never overwritten');
for (const name of ['garden', 'beach-test']) {
  const other = generateWorld(name);
  assert.equal(other.updateWinterResources(other.winterGrownAt + hour, 0), 0);
  assert.equal(count(other, 73), 0);
}
const legacy = world.serialize();
delete legacy.winterGrownAt;
assert.ok(Number.isFinite(World.fromSave(legacy).winterGrownAt));
