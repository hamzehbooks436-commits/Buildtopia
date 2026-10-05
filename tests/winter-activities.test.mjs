import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { generateWorld, World } from '../world.js';
import { WinterActivities, createSnowball } from '../winter-activities.js';
import { canPlaceIgloo, buildIgloo } from '../igloo.js';
import { createPlayer, updatePlayer } from '../player.js';
import { removeItem, addItem } from '../inventory.js';
import { TILE_DEFS, ITEM_DEFS, SHOP_ITEMS } from '../definitions.js';

const winter = generateWorld('snow-adventure');
assert.ok(winter.foreground.includes(70));
assert.ok(winter.foreground.includes(71));
assert.equal(winter.penguinHomes.length, 4);
assert.deepEqual(World.fromSave(winter.serialize()).penguinHomes, winter.penguinHomes);
const pending = [[66, 55]], reached = new Set();
while (pending.length) {
  const [x, y] = pending.pop(), key = `${x},${y}`;
  if (reached.has(key) || !winter.inBounds(x, y) || winter.isSolid(x, y)) continue;
  reached.add(key);
  pending.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}
assert.ok(reached.has('52,52') && reached.has('99,55'), 'Both caves connect to the entrance');
assert.ok(reached.has(`66,${winter.surface[66] - 1}`), 'Ladder shaft reaches the surface');
assert.ok(TILE_DEFS[70].drops.some(drop => drop.item === 'ice_crystal'));
assert.ok(ITEM_DEFS.ice_crystal.placesTile === 70);
assert.ok(TILE_DEFS[68].drops.some(drop => drop.item === 'snowball'));
assert.equal(SHOP_ITEMS.find(offer => offer.item === 'igloo_kit').cost, 250);

const buildingWorld = new World();
for (let x = 0; x < 30; x++) buildingWorld.set(x, 20, 68);
assert.ok(canPlaceIgloo(buildingWorld, 12, 20));
buildIgloo(buildingWorld, 12, 20);
assert.equal(buildingWorld.get(16, 19), 0);
assert.equal(buildingWorld.get(16, 18), 0, 'Igloo doorway has two tiles of headroom');
const visitor = createPlayer(17 * 32, 19 * 32);
for (let i = 0; i < 35; i++) updatePlayer(visitor, buildingWorld, { left: true }, 1 / 60);
assert.ok(visitor.x < 16 * 32 && visitor.x > 8 * 32, 'Player can walk inside the igloo');
assert.ok(visitor.grounded);
assert.equal(buildingWorld.getBackground(12, 19), 72, 'Igloo interior has a recessed background wall');
assert.equal(buildingWorld.getBackground(16, 19), 0, 'Doorway stays open to the outside');
assert.equal(World.fromSave(buildingWorld.serialize()).getBackground(12, 19), 72, 'Igloo background survives save/load');
const oldIgloo = buildingWorld.serialize();
delete oldIgloo.iglooBackgroundVersion;
oldIgloo.background.fill(0);
const upgradedIgloo = World.fromSave(oldIgloo);
assert.equal(upgradedIgloo.getBackground(12, 19), 72, 'Older built igloos receive background walls');
assert.deepEqual(Array.from(upgradedIgloo.foreground), oldIgloo.foreground, 'Background upgrade preserves all foreground blocks');
assert.equal(canPlaceIgloo(buildingWorld, 12, 20), false, 'Kit cannot overwrite an existing structure');
assert.equal(canPlaceIgloo(buildingWorld, 1, 20), false, 'Kit cannot extend past world bounds');

const activities = new WinterActivities();
activities.updatePenguins(winter, 1 / 60);
const initialX = activities.penguins[0].x;
for (let i = 0; i < 90; i++) activities.updatePenguins(winter, 1 / 60);
assert.notEqual(activities.penguins[0].x, initialX, 'Penguins wander');
for (const penguin of activities.penguins) {
  assert.ok(Math.abs(penguin.x - penguin.homeX) <= 4 * 32);
  assert.ok(penguin.grounded);
  assert.ok(!winter.isSolid(Math.floor((penguin.x + 10) / 32), Math.floor((penguin.y + 12) / 32)));
}

const air = new World();
const shooter = createPlayer(32, 32);
const shot = createSnowball(shooter, 'shooter', 'shot-1', 100000, { x: 400, y: 45 });
assert.ok(activities.addSnowball(shot, 100000));
assert.equal(activities.addSnowball(shot, 100000), false, 'Repeated presence snapshots do not duplicate shots');
let hit = null;
activities.updateSnowballs(air, [{ ...shooter, uid: 'shooter' }, { x: 130, y: 32, width: 22, height: 32, uid: 'friend' }], 100220, victim => hit = victim.uid);
assert.equal(hit, 'friend', 'Snowball tags another player, ignoring its owner');
assert.equal(activities.snowballs.length, 0);
assert.equal(activities.splashes.length, 1);
const blocked = new WinterActivities();
air.set(3, 1, 2);
blocked.addSnowball({ ...shot, id: 'shot-wall' }, 100000);
hit = null;
blocked.updateSnowballs(air, [{ x: 130, y: 32, width: 22, height: 32, uid: 'friend' }], 100250, victim => hit = victim.uid);
assert.equal(hit, null, 'Snowballs cannot tag through walls');
assert.equal(blocked.snowballs.length, 0);
assert.equal(blocked.addSnowball({ ...shot, id: 'stale' }, 110000), false);
assert.equal(blocked.addSnowball({ ...shot, id: 'invalid', vx: Infinity }, 100000), false);

const icicleWorld = new World();
icicleWorld.set(5, 4, 2); icicleWorld.set(5, 5, 71); icicleWorld.set(5, 10, 2);
const victim = createPlayer(5 * 32 + 5, 9 * 32);
const falling = new WinterActivities();
assert.equal(falling.nearbyIcicles(icicleWorld, victim).length, 1);
icicleWorld.set(5, 7, 2);
assert.equal(falling.nearbyIcicles(icicleWorld, victim).length, 0, 'A floor between player and icicle prevents activation');
icicleWorld.set(5, 7, 0);
icicleWorld.blockSettings['5,5'] = { icicleFallAt: 100000 };
let hits = 0, finished = [];
falling.updateIcicles(icicleWorld, victim, 100300, () => hits++);
assert.equal(hits, 0, 'Icicle warns before falling');
assert.ok(falling.fallingIcicles[0].warning);
for (let now = 100450; now < 101600; now += 16) finished = falling.updateIcicles(icicleWorld, victim, now, () => hits++);
assert.equal(hits, 1, 'Falling icicle hits only once');
assert.ok(finished.some(tile => tile.key === '5,5'), 'Icicle shatters on the floor');
assert.equal(World.fromSave(icicleWorld.serialize()).blockSettings['5,5'].icicleFallAt, 100000, 'Online falling event persists');

// Exercise the actual throw handler: one item spent, cooldown, and presence event.
const main = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const throwSource = main.slice(main.indexOf('function throwSelectedSnowball'), main.indexOf('async function placeIgloo'));
let clock = 200000, saves = 0, sends = 0;
const state = { running: true, shopOpen: false, inventoryOpen: false, recipesOpen: false, doorSettings: { hidden: true }, tradePanel: { hidden: true }, inventory: [{ itemId: 'snowball', count: 3 }], selectedSlot: 0, lastSnowballAt: 0, latestSnowball: null, player: shooter, user: { uid: 'shooter' }, camera: { x: 0, y: 0 }, zoom: 1, input: { pointer: { x: 400, y: 45 } }, Date: { now: () => clock }, createSnowball, winterActivities: new WinterActivities(), removeItem, stopBreaking: () => {}, savePlayerState: () => saves++, updatePresence: () => sends++ };
vm.createContext(state); vm.runInContext(throwSource, state);
state.throwSelectedSnowball(); state.throwSelectedSnowball();
assert.equal(state.inventory[0].count, 2);
assert.equal(saves, 1); assert.equal(sends, 1);
clock += 600; state.throwSelectedSnowball(false);
assert.equal(state.inventory[0].count, 1);
state.shopOpen = true; clock += 600; state.throwSelectedSnowball();
assert.equal(state.inventory[0].count, 1, 'Menus do not throw or spend items');

const kitSource = main.slice(main.indexOf('async function placeIgloo'), main.indexOf('function updateWinterActivities'));
const kitWorld = new World();
const kitState = { world: kitWorld, inventory: [{ itemId: 'igloo_kit', count: 1 }], player: {}, canPlaceIgloo, buildIgloo, iglooTiles: () => [], playerOverlapsTile: () => false, removeItem, addItem, notify: () => {}, stopBreaking: () => {}, savePlayerState: () => {}, mutateWorld: async () => false };
vm.createContext(kitState); vm.runInContext(kitSource, kitState);
await kitState.placeIgloo({ x: 12, y: 19 });
assert.equal(kitState.inventory[0].count, 1, 'Failed igloo transaction refunds the whole kit');

const presenceSource = main.slice(main.indexOf('async function updatePresence'), main.indexOf('async function completeBreak'));
let sentPresence;
const presenceState = { presenceRef: {}, gamePresenceRef: null, player: shooter, username: 'Test explorer', latestSnowball: state.latestSnowball, Date: { now: () => clock }, set: async (_ref, payload) => { sentPresence = payload; } };
vm.createContext(presenceState); vm.runInContext(presenceSource, presenceState);
await presenceState.updatePresence();
assert.equal(sentPresence.snowball.owner, 'shooter');
const receiver = new WinterActivities();
assert.ok(receiver.addSnowball(JSON.parse(JSON.stringify(sentPresence.snowball)), clock));
let receivedHit = false;
receiver.updateSnowballs(new World(), [{ x: 130, y: 8, width: 22, height: 50, uid: 'friend' }], clock + 300, () => receivedHit = true);
assert.ok(receivedHit, 'Serialized presence event reaches and tags the receiving client');
console.log('Connected caves, crystals, igloo entry/refund, penguins, icicles and multiplayer snowball event checks passed.');
