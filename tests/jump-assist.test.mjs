import assert from 'node:assert/strict';
import { createPlayer, updatePlayer } from '../player.js';

const dt = 1 / 60;
const floor = { isSolid: (_x, y) => y >= 6 };
const air = { isSolid: () => false };

// A press shortly before landing survives until the next grounded update.
const early = createPlayer(64, 150);
early.vy = 220;
updatePlayer(early, floor, { jumpPressed: true }, dt);
for (let i = 0; i < 5; i++) updatePlayer(early, floor, {}, dt);
assert.ok(early.vy < 0, 'Buffered press jumps after landing');

// A late press still works just beyond a platform, but cannot become a double jump.
const late = createPlayer(64, 160);
late.grounded = true;
for (let i = 0; i < 4; i++) updatePlayer(late, air, {}, dt);
updatePlayer(late, air, { jumpPressed: true }, dt);
assert.ok(late.vy < -500, 'Ledge grace period permits a late jump');
const speed = late.vy;
updatePlayer(late, air, { jumpPressed: true }, dt);
assert.ok(late.vy > speed, 'Cannot jump a second time in midair');

const expired = createPlayer(64, 160);
expired.grounded = true;
for (let i = 0; i < 15; i++) updatePlayer(expired, air, {}, dt);
updatePlayer(expired, air, { jumpPressed: true }, dt);
assert.ok(expired.vy > 0, 'Ledge grace expires');

const stale = createPlayer(64, 0);
updatePlayer(stale, floor, { jumpPressed: true }, dt);
for (let i = 0; i < 90; i++) updatePlayer(stale, floor, {}, dt);
assert.ok(stale.grounded, 'Old presses do not cause an unexpected landing jump');

const held = createPlayer(64, 160);
held.grounded = true;
let jumps = 0;
for (let i = 0; i < 180; i++) {
  const previous = held.vy;
  updatePlayer(held, floor, { jumpHeld: true }, dt);
  if (previous >= 0 && held.vy < 0) jumps++;
}
assert.ok(jumps >= 3, 'Holding jump repeats on landing');
for (let i = 0; i < 90; i++) updatePlayer(held, floor, {}, dt);
assert.ok(held.grounded, 'Releasing jump stops repeat jumping');
console.log('Early presses, ledge grace, no double jump, expiry, held jump and release passed.');
