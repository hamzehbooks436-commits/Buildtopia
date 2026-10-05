import assert from 'node:assert/strict';
import { generateWorld, World } from '../world.js';
import { createPlayer, updatePlayer } from '../player.js';
import { TILE_DEFS, ITEM_DEFS } from '../definitions.js';
import { WINTER_CYCLE_MS, winterWeather } from '../winter.js';
import { drawSky, drawWinterSnow } from '../ui.js';

for (const name of ['ice', 'ice-kingdom', 'snow-land', 'SNOW_HILLS', 'ICE_COURSE']) {
  const world = generateWorld(name);
  assert.equal(world.worldType, 'ice');
  assert.ok(world.foreground.includes(68));
  assert.ok(world.foreground.includes(69));
  assert.ok(!world.foreground.includes(5), 'Winter ground has no lava layer');
  for (let x = 72; x <= 113; x++) {
    assert.equal(world.surface[x], 39);
    assert.equal(world.get(x, 39), 66, 'Frozen lake has an unbroken slippery surface');
  }
  for (let x = 0; x < world.width; x++) assert.equal(world.get(x, world.height - 1), 3);
  assert.equal(world.get(16, world.surface[16] - 1), 6, 'White Door is accessible');
  const player = createPlayer(18 * 32, (world.surface[18] - 3) * 32);
  for (let frame = 0; frame < 180; frame++) updatePlayer(player, world, {}, 1 / 60);
  assert.ok(player.grounded, 'Spawn lands safely on snow');
  assert.equal(player.y + player.height, world.surface[18] * 32);
  const save = world.serialize();
  assert.deepEqual(World.fromSave(save).serialize(), save, 'Winter tiles and type persist');
  world.updateFlowers(Date.now() + 7200000);
  assert.ok(!world.foreground.some(tile => tile >= 40 && tile <= 43), 'Winter worlds do not sprout summer flowers');
}
assert.equal(generateWorld('beach-test').worldType, 'beach');
assert.equal(generateWorld('garden').worldType, 'sky');
assert.equal(ITEM_DEFS.snow_block.placesTile, 68);
assert.ok(TILE_DEFS[68].drops.some(drop => drop.item === 'snow_block' && drop.count === 1));
assert.ok(TILE_DEFS[68].drops.some(drop => drop.item === 'snowball' && drop.count === 3));
assert.equal(TILE_DEFS[69].harvest.drops[0].item, 'wood_block');

assert.equal(winterWeather(WINTER_CYCLE_MS * .3).nightAmount, 0);
assert.equal(winterWeather(WINTER_CYCLE_MS * .85).nightAmount, 1);
assert.notDeepEqual(winterWeather(WINTER_CYCLE_MS * .85).colors, winterWeather(WINTER_CYCLE_MS * 1.85).colors);
let daySnow = false, nightSnow = false, clear = false;
for (let now = 5000; now < WINTER_CYCLE_MS * 20; now += 10000) {
  const weather = winterWeather(now);
  if (!weather.night && weather.snowIntensity > 0) daySnow = true;
  if (weather.night && weather.snowIntensity > 0) nightSnow = true;
  if (!weather.snowIntensity) clear = true;
  assert.ok(weather.nightAmount >= 0 && weather.nightAmount <= 1);
  assert.ok(weather.snowIntensity >= 0 && weather.snowIntensity <= 1);
}
assert.ok(daySnow && nightSnow && clear, 'Random showers occur in both day and night with clear periods');

// Exercise drawing with a controlled clock and confirm aurora is night-only.
const originalNow = Date.now;
let gradients = 0, flakes = 0;
const gradient = { addColorStop() {} };
const ctx = new Proxy({}, { get: (_target, key) => key === 'createLinearGradient' ? () => { gradients++; return gradient; } : key === 'fillRect' ? () => flakes++ : () => {} });
const assets = { winterDaySky: { width: 900, height: 520 }, winterNightSky: { width: 900, height: 520 } };
try {
  Date.now = () => WINTER_CYCLE_MS * .3;
  drawSky(ctx, assets, { x: 0, y: 0 }, 900, 520, 'ice');
  assert.equal(gradients, 0, 'Day has no northern lights');
  Date.now = () => WINTER_CYCLE_MS * .85;
  drawSky(ctx, assets, { x: 0, y: 0 }, 900, 520, 'ice');
  assert.ok(gradients > 0, 'Night draws glowing aurora curtains');
  let snowyTime = 5000;
  while (!winterWeather(snowyTime).snowIntensity) snowyTime += 10000;
  Date.now = () => snowyTime;
  flakes = 0;
  drawWinterSnow(ctx, { x: 0, y: 0 }, 900, 520);
  assert.ok(flakes > 0);
} finally { Date.now = originalNow; }
console.log('Winter prefixes, terrain, spawn, mining, persistence, day/night, aurora and snowfall checks passed.');
