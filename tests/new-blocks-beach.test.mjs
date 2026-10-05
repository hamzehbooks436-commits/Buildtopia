import assert from "node:assert/strict";
import { ITEM_DEFS, SHOP_ITEMS, TILE_DEFS, spliceResult } from "../definitions.js";
import { World, generateWorld } from "../world.js";

assert.equal(spliceResult(55, 2), "glass_block");
assert.equal(spliceResult(56, 2), null);
assert.equal(spliceResult(56, 43), "ladder");
for (const item of ["sand_block", "wood_block", "glass_block", "door_block", "ladder", "checkpoint_block", "coconut_block", "wrench"]) assert.ok(ITEM_DEFS[item], `${item} is defined`);
assert.equal(TILE_DEFS[58].solid, false);
assert.equal(TILE_DEFS[59].ladder, true);
assert.equal(TILE_DEFS[61].water, true);
assert.equal(TILE_DEFS[20].name, "Tree");
assert.deepEqual(TILE_DEFS[20].harvest.drops[0], { item: "wood_block", min: 1, max: 3 });
assert.deepEqual(TILE_DEFS[21].harvest.drops[1], { item: "gems", min: 5, max: 10 });

const prices = Object.fromEntries(SHOP_ITEMS.map((offer) => [offer.item, offer.cost]));
assert.equal(prices.seed_package, 250);
assert.equal(prices.moon_seed, 25);
assert.equal(prices.pickaxe, 750);
assert.equal(prices.checkpoint_block, 500);

const beach = generateWorld("beach-sunset");
assert.equal(beach.worldType, "beach");
for (const tile of [55, 61, 62, 63]) assert.ok(beach.foreground.includes(tile), `Beach contains tile ${tile}`);
const saved = beach.serialize();
saved.blockSettings["4,5"] = { destination: "beach-two" };
const restored = World.fromSave(saved);
assert.equal(restored.worldType, "beach");
assert.equal(restored.blockSettings["4,5"].destination, "beach-two");
assert.equal(generateWorld("garden").worldType, "sky");

console.log("New blocks, recipes, rewards, prices, beach terrain and door-setting persistence passed.");
