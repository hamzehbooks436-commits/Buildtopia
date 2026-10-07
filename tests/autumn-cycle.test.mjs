import assert from 'node:assert/strict';
import { AUTUMN_CYCLE_MS, autumnWeather } from '../autumn.js';
import { drawSky, drawWorldLighting } from '../ui.js';

const at = phase => autumnWeather(phase * AUTUMN_CYCLE_MS);
assert.equal(at(.3).nightAmount, 0);
assert.equal(at(.85).nightAmount, 1);
assert.equal(at(2 / 3).night, true);
assert.deepEqual(at(.85), at(1.85), 'Reloads and elapsed cycles keep the shared clock');
assert.notDeepEqual(at(.3).sky, at(2 / 3).sky, 'Dusk has a warm palette');
assert.notDeepEqual(at(.3).sky, at(.85).sky, 'Night has a moonlit palette');
for (const boundary of [0, 2 / 3, 2 / 3 + .04, 1 - .04, 1]) {
  assert.ok(Math.abs(at(boundary - 1e-7).nightAmount - at(boundary + 1e-7).nightAmount) < .00001, 'Lighting is continuous at boundaries');
  const colors = phase => at(phase).sky.flatMap(rgb => rgb.match(/\d+/g).map(Number));
  assert.ok(colors(boundary - 1e-7).every((value, i) => Math.abs(value - colors(boundary + 1e-7)[i]) <= 1), 'Sky colors are continuous at boundaries');
}
const originalNow = Date.now;
const rects = [];
let moonCount = 0;
const gradient = { addColorStop() {} };
const ctx = new Proxy({ fillStyle: '' }, {
  get: (target, key) => key === 'fillStyle' ? target[key] : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => gradient : key === 'fillRect' ? (x, y) => rects.push({ x, y, style: target.fillStyle }) : key === 'arc' ? () => moonCount++ : () => {},
});
const world = { worldType: 'autumn', width: 8, height: 3, surface: Array(8).fill(1), get: () => 0 };
try {
  Date.now = () => AUTUMN_CYCLE_MS * .3;
  drawSky(ctx, {}, { x: 0, y: 0 }, 800, 500, 'autumn');
  assert.equal(moonCount, 0, 'Moon stays hidden during daylight');
  drawWorldLighting(ctx, world, { x: 0, y: 0 }, 256, 96);
  assert.ok(!rects.some(rect => rect.y === 0 && typeof rect.style === 'string' && rect.style.startsWith('rgba(8, 16, 30')), 'Daylight leaves surface clear');
  Date.now = () => AUTUMN_CYCLE_MS * .85;
  drawSky(ctx, {}, { x: 0, y: 0 }, 800, 500, 'autumn');
  assert.equal(moonCount, 1, 'Night draws the moon');
  rects.length = 0;
  drawWorldLighting(ctx, world, { x: 0, y: 0 }, 256, 96);
  const alpha = rect => Number(rect.style.match(/, ([\d.]+)\)$/)[1]);
  assert.ok(Math.abs(alpha(rects.find(rect => rect.x === 0 && rect.y === 0)) - .42) < 1e-10);
  world.get = (x, y) => x === 0 && y === 0 ? 84 : 0;
  rects.length = 0;
  drawWorldLighting(ctx, world, { x: 0, y: 0 }, 256, 96);
  assert.equal(alpha(rects.find(rect => rect.x === 0 && rect.y === 0)), 0, 'Lantern removes darkness at its tile');
  assert.ok(alpha(rects.find(rect => rect.x === 32 && rect.y === 0)) < .42, 'Lantern lights nearby surface');
  world.worldType = 'sky';
  world.get = () => 0;
  rects.length = 0;
  drawWorldLighting(ctx, world, { x: 0, y: 0 }, 256, 96);
  assert.ok(!rects.some(rect => rect.y === 0), 'Other world types keep their lighting');
} finally { Date.now = originalNow; }
console.log('Autumn cycle, smooth transitions, moon, surface lighting and lantern falloff passed.');
