import assert from 'node:assert/strict';
import { ITEM_DEFS, TILE_DEFS, SHOP_ITEMS, SHOP_SECTIONS } from '../definitions.js';
import { World } from '../world.js';
import { createPlayer, updatePlayer } from '../player.js';
import { drawFurniture } from '../furniture.js';

const tile = ITEM_DEFS.wooden_door.placesTile;
assert.equal(TILE_DEFS[tile].solid, false);
assert.ok(!TILE_DEFS[tile].door && !TILE_DEFS[tile].worldDoor, 'Ordinary door has no travel behavior');
assert.deepEqual(TILE_DEFS[tile].drops, [{ item: 'wooden_door', count: 1 }]);
assert.ok(SHOP_SECTIONS.find(section => section.id === 'building').items.includes('wooden_door'));
assert.equal(SHOP_ITEMS.find(offer => offer.item === 'wooden_door').cost, 20);
const world = new World();
for (let x = 0; x < 15; x++) world.set(x, 10, 56);
world.set(7, 8, 56); world.set(7, 9, tile);
assert.equal(World.fromSave(world.serialize()).get(7, 9), tile);
for (const direction of ['right', 'left']) {
  const player = createPlayer((direction === 'right' ? 5 : 9) * 32, 9 * 32);
  for (let frame = 0; frame < 40; frame++) updatePlayer(player, world, { [direction]: true }, 1 / 60);
  assert.ok(direction === 'right' ? player.x > 8 * 32 : player.x < 7 * 32, 'Player passes through the doorway in either direction');
}
let pixels = 0;
const ctx = new Proxy({}, { get: (_, key) => key === 'clearRect' ? () => { throw Error('Door must preserve the background'); } : key === 'fillRect' ? () => pixels++ : () => {} });
assert.equal(drawFurniture(ctx, 'wooden_door', 0, 0, 32), true);
assert.ok(pixels > 0);
console.log('Wooden door movement, persistence, collectible drops, shop and transparent entrance rendering passed.');
