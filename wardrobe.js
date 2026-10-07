import { NPC_OUTFITS, NPC_OUTFIT_BY_ID } from "./npc-outfits.js";
import { countItem, removeItem } from "./inventory.js";

export const CLOTHING_PRICE = 150;
export const CLOTHING_OFFERS = NPC_OUTFITS.map(outfit => ({ outfitId: outfit.id, name: outfit.name, group: outfit.group, cost: CLOTHING_PRICE }));
export function wardrobeState(saved = {}) {
  const ownedOutfits = {};
  for (const [id, owned] of Object.entries(saved.ownedOutfits ?? {})) {
    if (owned === true && Object.hasOwn(NPC_OUTFIT_BY_ID, id)) ownedOutfits[id] = true;
  }
  return { ownedOutfits, equippedOutfit: ownedOutfits[saved.equippedOutfit] ? saved.equippedOutfit : null };
}
// Payment and ownership are committed together; equipping an owned outfit is free.
export function applyClothing(saved, outfitId) {
  if (outfitId !== null && !Object.hasOwn(NPC_OUTFIT_BY_ID, outfitId)) throw new Error("Choose an existing outfit.");
  const wardrobe = wardrobeState(saved);
  const slots = saved.slots.map(slot => slot ? { ...slot } : null);
  if (outfitId && !wardrobe.ownedOutfits[outfitId]) {
    if (countItem(slots, "gems") < CLOTHING_PRICE) throw new Error("Not enough Sky Gems. Each outfit costs 150 gems.");
    removeItem(slots, "gems", CLOTHING_PRICE);
    wardrobe.ownedOutfits[outfitId] = true;
  }
  return { ...saved, slots, ...wardrobe, equippedOutfit: outfitId };
}
