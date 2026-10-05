import assert from "node:assert/strict";
import { addItem } from "../inventory.js";

const roomInStack = [{ itemId: "dirt_seed", count: 998 }, { itemId: "rock", count: 999 }, null];
assert.equal(addItem(roomInStack, "dirt_seed", 2), true);
assert.deepEqual(roomInStack, [{ itemId: "dirt_seed", count: 999 }, { itemId: "rock", count: 999 }, { itemId: "dirt_seed", count: 1 }]);

const notEnoughRoom = [{ itemId: "dirt_seed", count: 998 }, { itemId: "rock", count: 999 }];
const before = structuredClone(notEnoughRoom);
assert.equal(addItem(notEnoughRoom, "dirt_seed", 2), false);
assert.deepEqual(notEnoughRoom, before, "A rejected addition must not partially change inventory");

const openSlot = [{ itemId: "rock", count: 999 }, null];
assert.equal(addItem(openSlot, "moon_seed", 2), true);
assert.deepEqual(openSlot[1], { itemId: "moon_seed", count: 2 });

console.log("Inventory stack capacity and atomic full-bag checks passed.");
