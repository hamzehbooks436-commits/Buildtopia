import assert from 'node:assert/strict';
import { CLOTHING_OFFERS, applyClothing, wardrobeState } from '../wardrobe.js';
import { NPC_OUTFITS, NPC_OUTFIT_GROUPS } from '../npc-outfits.js';
import { normalizeNpc, applyNpcOffer } from '../npcs.js';
import { countItem } from '../inventory.js';
import { drawShop, shopActionAt, drawPlayer } from '../ui.js';
assert.equal(NPC_OUTFITS.length, 42);
for (const group of NPC_OUTFIT_GROUPS) assert.equal(NPC_OUTFITS.filter(o => o.group === group.id).length, group.count);
assert.equal(new Set(CLOTHING_OFFERS.map(o => o.outfitId)).size, 42);
const original = { slots: [{ itemId: 'gems', count: 300 }, { itemId: 'rock', count: 999 }], size: 2, npcClaims: { old: true } };
let saved = original;
for (const outfit of CLOTHING_OFFERS) {
  assert.equal(outfit.cost, 150);
  const bought = applyClothing(original, outfit.outfitId);
  assert.equal(countItem(bought.slots, 'gems'), 150);
  assert.equal(bought.equippedOutfit, outfit.outfitId);
  assert.equal(bought.ownedOutfits[outfit.outfitId], true);
  assert.deepEqual(applyClothing(bought, outfit.outfitId), bought, 'Re-equipping never charges twice');
  assert.deepEqual(wardrobeState(JSON.parse(JSON.stringify(bought))), wardrobeState(bought));
  assert.equal(normalizeNpc({ name: 'Autumn NPC', x: 5, y: 5, outfitId: outfit.outfitId }).outfitId, outfit.outfitId);
}
saved = applyClothing(saved, 'autumn-plaid');
saved = applyClothing(saved, 'autumn-hoodie');
assert.equal(countItem(saved.slots, 'gems'), 0);
assert.throws(() => applyClothing(saved, 'autumn-trench'), /Not enough/);
assert.throws(() => applyClothing(saved, 'missing'), /existing/);
saved = applyClothing(saved, 'autumn-plaid');
assert.equal(countItem(saved.slots, 'gems'), 0);
assert.equal(applyClothing(saved, null).equippedOutfit, null);
assert.equal(countItem(original.slots, 'gems'), 300, 'Retry transforms leave their input intact');
assert.deepEqual(wardrobeState({ ownedOutfits: { missing: true }, equippedOutfit: 'missing' }), { ownedOutfits: {}, equippedOutfit: null });
const npcResult = applyNpcOffer(saved, { requires: [], rewards: [], repeatable: true }, 'npc', 'request');
assert.deepEqual(wardrobeState(npcResult), wardrobeState(saved), 'NPC trades preserve wardrobe');
const ctx = new Proxy({}, { get: () => () => {} });
for (const [width, height] of [[768, 500], [390, 844], [844, 390]]) {
  const seen = new Set();
  const pages = width < 560 ? 14 : 7;
  for (let page = 0; page < pages; page++) {
    const layout = drawShop(ctx, {}, original.slots, width, height, 'clothes', false, saved, page);
    assert.ok(layout.y >= 0 && layout.y + layout.panelHeight * layout.scale <= height);
    for (const target of [...layout.cards, ...layout.buttons]) {
      const point = { x: layout.offsetX + (target.x + 10) * layout.scale, y: layout.y + (target.y + 10 - layout.y) * layout.scale };
      assert.deepEqual(shopActionAt(point, layout), target.action);
      if (target.action.outfitId) { assert.ok(!seen.has(target.action.outfitId)); seen.add(target.action.outfitId); }
    }
  }
  assert.equal(seen.size, 42, 'Every outfit is reachable on mobile and desktop');
}
for (const outfit of NPC_OUTFITS) drawPlayer(ctx, { x: 0, y: 0, width: 22, height: 32, facing: 1, outfitId: outfit.id }, { x: 0, y: 0 });
console.log('Wardrobe catalog, prices, atomic payments, ownership, free equip, persistence, NPC compatibility and market navigation passed.');
