import assert from "node:assert/strict";
import { World } from "../world.js";
import { createPlayer, updatePlayer, playerTouchesTile, respawnPlayer } from "../player.js";
import { PHYSICS, TILE_SIZE } from "../config.js";
import { ITEM_DEFS, SHOP_ITEMS, SHOP_SECTIONS, TILE_DEFS } from "../definitions.js";
import { drawShop, shopActionAt, shopOfferAt } from "../ui.js";

const dt = 1 / 60;
const course = new World();
course.set(5, 6, 64);
const jumper = createPlayer(5 * TILE_SIZE + 5, 6 * TILE_SIZE + 10);
jumper.vy = -PHYSICS.jumpSpeed;
let clearedPlatform = false;
for (let i = 0; i < 120; i++) {
  updatePlayer(jumper, course, {}, dt);
  if (jumper.y + jumper.height < 6 * TILE_SIZE) clearedPlatform = true;
  if (jumper.grounded) break;
}
assert.ok(clearedPlatform, "Jump passes upward through the platform");
assert.equal(jumper.y + jumper.height, 6 * TILE_SIZE, "Fall lands exactly on its top");
assert.ok(jumper.grounded);

const side = createPlayer(4 * TILE_SIZE, 6 * TILE_SIZE);
side.vx = PHYSICS.runSpeed;
updatePlayer(side, course, { right: true }, .033);
assert.ok(side.vx > 0, "Platform sides do not stop movement");
const crossing = createPlayer(5 * TILE_SIZE + 5, 6 * TILE_SIZE - TILE_SIZE - 2);
crossing.vy = PHYSICS.maxFallSpeed;
updatePlayer(crossing, course, {}, .033);
assert.ok(crossing.grounded, "Fast falls cannot tunnel through the platform");

course.set(5, 6, 65);
const bouncing = createPlayer(5 * TILE_SIZE + 5, 6 * TILE_SIZE - TILE_SIZE - 2);
bouncing.vy = 240;
updatePlayer(bouncing, course, { jumpPressed: true }, dt);
assert.equal(bouncing.vy, -PHYSICS.bounceSpeed);
assert.equal(bouncing.grounded, false);
assert.equal(bouncing.jumpBuffer, 0, "Pad consumes buffered jumps");
let apex = bouncing.y;
for (let i = 0; i < 35; i++) {
  updatePlayer(bouncing, course, {}, dt);
  apex = Math.min(apex, bouncing.y);
}
assert.ok(5 * TILE_SIZE - apex > PHYSICS.jumpSpeed ** 2 / (2 * PHYSICS.gravity), "Pad launches higher than a normal jump");
const underneath = createPlayer(5 * TILE_SIZE + 5, 7 * TILE_SIZE + 2);
underneath.vy = -300;
updatePlayer(underneath, course, {}, dt);
assert.equal(underneath.vy, 0, "Hitting the underside does not trigger a bounce");

function slide(tile, input) {
  const floor = new World();
  for (let x = 0; x < 20; x++) floor.set(x, 6, tile);
  const runner = createPlayer(5 * TILE_SIZE + 5, 5 * TILE_SIZE);
  runner.grounded = true;
  runner.vx = PHYSICS.runSpeed;
  for (let i = 0; i < 10; i++) updatePlayer(runner, floor, input, dt);
  return runner;
}
assert.ok(slide(66, {}).vx > 200, "Ice preserves momentum after release");
assert.equal(slide(56, {}).vx, 0, "Normal ground still stops quickly");
assert.ok(slide(66, { left: true }).vx > 0, "Reversing on ice takes time");
assert.ok(slide(56, { left: true }).vx < 0, "Normal ground reverses promptly");

course.set(5, 6, 67);
const victim = createPlayer(5 * TILE_SIZE + 5, 6 * TILE_SIZE);
assert.ok(playerTouchesTile(victim, course, "hazard"));
Object.assign(victim, { vx: 200, vy: 500, jumpBuffer: .1, coyoteTime: .1 });
respawnPlayer(victim, { x: 64, y: 96 });
assert.deepEqual([victim.x, victim.y, victim.vx, victim.vy, victim.jumpBuffer, victim.coyoteTime], [64, 96, 0, 0, 0, 0]);
assert.equal(playerTouchesTile(victim, course, "hazard"), false);

const restored = World.fromSave(course.serialize());
assert.equal(restored.get(5, 6), 67, "Parkour tiles survive save/load");
for (const itemId of ["wooden_platform", "bounce_pad", "ice_block", "spike_block"]) {
  const tile = TILE_DEFS[ITEM_DEFS[itemId].placesTile];
  assert.ok(SHOP_ITEMS.some((offer) => offer.rewards?.some((reward) => reward.item === itemId)), "Every block is included in the package");
  assert.ok(!SHOP_ITEMS.some((offer) => offer.item === itemId), "Parkour blocks are not sold individually");
  assert.equal(tile.drops[0].item, itemId, "Mining returns the placed item");
}

// Verify every scaled market card maps to its offer on a short touch display.
const ctx = new Proxy({}, { get: () => () => {} });
const seenOffers = new Set();
for (const [width, height] of [[768, 500], [390, 844], [844, 390]]) {
  function hit(layout, card) {
    return { x: layout.offsetX + (card.x + 10) * layout.scale, y: layout.y + (card.y + 10 - layout.y) * layout.scale };
  }
  const menu = drawShop(ctx, {}, [], width, height);
  assert.equal(menu.cards.length, SHOP_SECTIONS.length + 1);
  for (const card of menu.cards) {
    assert.equal(shopOfferAt(hit(menu, card), menu), null, "Opening a category never buys an item");
    const action = shopActionAt(hit(menu, card), menu);
    assert.equal(action.kind, "section");
    if (action.sectionId === "clothes") continue; // Clothing purchases have a separate ownership flow.
    const layout = drawShop(ctx, {}, [], width, height, action.sectionId);
    assert.ok(layout.y + layout.panelHeight * layout.scale <= height, "Section fits the viewport");
    for (const offerCard of layout.cards) {
      const offer = shopOfferAt(hit(layout, offerCard), layout);
      assert.ok(SHOP_ITEMS.includes(offer), "Category purchase uses the original offer and price");
      if (width === 768) {
        assert.ok(!seenOffers.has(offer), "Each offer appears in exactly one section");
        seenOffers.add(offer);
      }
    }
    for (const button of layout.buttons) {
      assert.equal(shopActionAt(hit(layout, button), layout).kind, button.action.kind);
      assert.equal(shopOfferAt(hit(layout, button), layout), null);
    }
  }
}
assert.equal(seenOffers.size, SHOP_ITEMS.length, "All market offers are available");
console.log("Platform collision, bounce, ice momentum, spikes, persistence and market checks passed.");
