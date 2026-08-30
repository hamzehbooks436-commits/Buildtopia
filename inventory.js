import { INVENTORY_SIZE } from "./config.js";
import { ITEM_DEFS } from "./definitions.js";

export function createInventory(saved = null) {
  const slots = Array.from({ length: INVENTORY_SIZE }, () => null);
  if (Array.isArray(saved)) {
    saved.slice(0, INVENTORY_SIZE).forEach((slot, index) => {
      if (slot && ITEM_DEFS[slot.itemId] && Number.isFinite(slot.count) && slot.count > 0) slots[index] = { itemId: slot.itemId, count: Math.floor(slot.count) };
    });
    return slots;
  }
  slots[0] = { itemId: "dirt_seed", count: 8 };
  slots[1] = { itemId: "moon_seed", count: 2 };
  slots[2] = { itemId: "dirt_block", count: 12 };
  slots[3] = { itemId: "rock", count: 4 };
  slots[4] = { itemId: "gems", count: 10 };
  return slots;
}

export function addItem(inventory, itemId, amount = 1) {
  let remaining = amount;
  for (const slot of inventory) {
    if (slot?.itemId === itemId && slot.count < 999) {
      const added = Math.min(999 - slot.count, remaining);
      slot.count += added;
      remaining -= added;
      if (!remaining) return true;
    }
  }
  for (let index = 0; index < inventory.length && remaining; index += 1) {
    if (!inventory[index]) {
      const added = Math.min(999, remaining);
      inventory[index] = { itemId, count: added };
      remaining -= added;
    }
  }
  return remaining === 0;
}

export function removeItem(inventory, itemId, amount = 1) {
  let remaining = amount;
  for (let index = 0; index < inventory.length && remaining; index += 1) {
    const slot = inventory[index];
    if (slot?.itemId !== itemId) continue;
    const removed = Math.min(slot.count, remaining);
    slot.count -= removed;
    remaining -= removed;
    if (!slot.count) inventory[index] = null;
  }
  return remaining === 0;
}

export function countItem(inventory, itemId) {
  return inventory.reduce((count, slot) => count + (slot?.itemId === itemId ? slot.count : 0), 0);
}
