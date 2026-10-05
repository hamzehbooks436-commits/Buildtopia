import { INVENTORY_SIZE } from "./config.js";
import { ITEM_DEFS } from "./definitions.js";

export function createInventory(saved = null, size = INVENTORY_SIZE) {
  const slots = Array.from({ length: size }, () => null);
  if (saved && typeof saved === "object") {
    // Realtime Database returns sparse numeric arrays as keyed objects.
    Object.entries(saved).forEach(([key, slot]) => {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= size) return;
      if (slot && ITEM_DEFS[slot.itemId] && Number.isSafeInteger(slot.count) && slot.count > 0) slots[index] = { itemId: slot.itemId, count: slot.count };
    });
    return slots;
  }
  slots[0] = { itemId: "dirt_seed", count: 8 };
  slots[1] = { itemId: "moon_seed", count: 2 };
  slots[2] = { itemId: "dirt_block", count: 12 };
  slots[3] = { itemId: "rock", count: 4 };
  slots[4] = { itemId: "gems", count: 10 };
  slots[5] = { itemId: "wrench", count: 1 };
  return slots;
}

export function addItem(inventory, itemId, amount = 1) {
  if (!ITEM_DEFS[itemId] || !Number.isFinite(amount) || amount <= 0) return false;
  amount = Math.floor(amount);
  const capacity = inventory.reduce((total, slot) => {
    if (!slot) return total + 999;
    return slot.itemId === itemId ? total + Math.max(0, 999 - slot.count) : total;
  }, 0);
  // Keep additions atomic. Previously a large reward could partially change the
  // bag and still report that it was full.
  if (capacity < amount) return false;
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
  return true;
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
