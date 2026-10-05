import assert from 'node:assert/strict';
import { createPlayer, updatePlayer, playerOverlapsTile } from '../player.js';
import { TILE_SIZE } from '../config.js';

// A one-tile corridor with a solid floor and ceiling, and an end wall.
const world = { isSolid: (x, y) => y >= 3 || y <= 1 || x >= 8 };
const player = createPlayer(TILE_SIZE, TILE_SIZE * 2);
assert.equal(player.height, TILE_SIZE);
for (let i = 0; i < 45; i++) updatePlayer(player, world, { left: false, right: true }, 1 / 60);
assert.ok(player.x > TILE_SIZE * 4, 'Walk through a one-block-high corridor');
assert.equal(player.y, TILE_SIZE * 2);
assert.ok(player.grounded);
for (let i = 0; i < 60; i++) updatePlayer(player, world, { left: false, right: true }, 1 / 60);
assert.equal(player.x + player.width, TILE_SIZE * 8, 'Stop at the wall');
assert.equal(playerOverlapsTile(player, 7, 1), false, 'Ceiling does not overlap player');
assert.equal(playerOverlapsTile(player, 7, 2), true, 'Occupied tile blocks placement');
assert.equal(playerOverlapsTile(player, 7, 3), false, 'Floor does not overlap player');

const openWorld = { isSolid: (_x, y) => y >= 3 };
updatePlayer(player, openWorld, { left: false, right: false, jumpPressed: true }, 1 / 60);
assert.ok(player.y < TILE_SIZE * 2, 'Jump lifts player');
for (let i = 0; i < 120; i++) updatePlayer(player, openWorld, { left: false, right: false }, 1 / 60);
assert.equal(player.y, TILE_SIZE * 2, 'Land at the correct height');
assert.ok(player.grounded);
console.log('One-block passage, wall collision, placement overlap, jumping and landing passed.');

