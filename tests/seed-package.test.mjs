import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { ITEM_DEFS, SHOP_ITEMS, SHOP_SECTIONS } from '../definitions.js';
import { addItem, removeItem, countItem } from '../inventory.js';

const source = fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const buy = source.slice(source.indexOf('function buy(offer)'), source.indexOf('function moveInventorySlot'));
const offer = SHOP_ITEMS.find(offer => offer.item === 'seed_package');
assert.equal(offer.cost, 250);
assert.equal(offer.amount, 3);
function purchase(inventory, rolls, selectedOffer = offer) {
  let draws = 0, saves = 0;
  const state = { inventory, ITEM_DEFS, addItem, removeItem, countItem,
    Math: { ...Math, floor: Math.floor, random: () => rolls[draws++ % rolls.length] },
    notify: () => {}, formatDrops: () => '', savePlayerState: () => saves++,
  };
  vm.createContext(state);
  vm.runInContext(buy, state);
  state.buy(selectedOffer);
  return { inventory: state.inventory, draws, saves };
}
const seeds = inventory => inventory.reduce((sum, slot) => sum + (slot?.itemId.endsWith('_seed') ? slot.count : 0), 0);
const normal = purchase([{ itemId: 'gems', count: 300 }, null, null, null], [0, .5, .999]);
assert.equal(countItem(normal.inventory, 'gems'), 50);
assert.equal(seeds(normal.inventory), 3);
assert.equal(normal.saves, 1);
assert.equal(normal.draws, 3);
const duplicate = purchase([{ itemId: 'gems', count: 250 }], [0]);
assert.equal(seeds(duplicate.inventory), 3, 'Duplicates stack in the slot freed by payment');
assert.equal(countItem(duplicate.inventory, 'gems'), 0);
for (const inventory of [
  [{ itemId: 'gems', count: 249 }, null, null, null],
  [{ itemId: 'gems', count: 300 }, null],
]) {
  const before = structuredClone(inventory);
  const result = purchase(inventory, [0, .5, .999]);
  assert.deepEqual(result.inventory, before, 'Insufficient funds or partial capacity leaves everything unchanged');
  assert.equal(result.saves, 0);
}
console.log('Seed package price, three draws, repeats, inventory capacity, payment and save checks passed.');

const pack = SHOP_ITEMS.find(entry => entry.item === 'parkour_package');
assert.equal(pack.cost, 1500);
assert.deepEqual(pack.rewards, [
  { item: 'ice_block', amount: 15 }, { item: 'spike_block', amount: 20 },
  { item: 'checkpoint_block', amount: 4 }, { item: 'lava_block', amount: 35 },
  { item: 'wooden_platform', amount: 15 }, { item: 'bounce_pad', amount: 5 },
]);
const building = SHOP_SECTIONS.find(section => section.id === 'building');
assert.ok(building.items.includes(pack.item));
assert.ok(building.items.includes('checkpoint_block'));
assert.ok(!SHOP_SECTIONS.some(section => section.id === 'parkour'));
const packageBag = [{ itemId: 'gems', count: 2000 }, ...Array(6).fill(null)];
const bought = purchase(packageBag, [], pack);
assert.equal(countItem(bought.inventory, 'gems'), 500);
for (const reward of pack.rewards) assert.equal(countItem(bought.inventory, reward.item), reward.amount);
assert.equal(bought.saves, 1);
assert.equal(bought.draws, 0);
for (const bag of [
  [{ itemId: 'gems', count: 1499 }, ...Array(6).fill(null)],
  [{ itemId: 'gems', count: 2000 }, ...Array(5).fill(null)],
  [{ itemId: 'gems', count: 2000 }, { itemId: 'bounce_pad', count: 998 }, ...Array(5).fill(null)],
]) {
  const before = structuredClone(bag);
  const result = purchase(bag, [], pack);
  assert.deepEqual(result.inventory, before, 'Package failure leaves all items and gems unchanged');
  assert.equal(result.saves, 0);
}
const exactPayment = purchase([{ itemId: 'gems', count: 1500 }, ...Array(5).fill(null)], [], pack);
assert.equal(countItem(exactPayment.inventory, 'gems'), 0);
assert.equal(countItem(exactPayment.inventory, 'bounce_pad'), 5, 'Payment can free a slot for package contents');
console.log('Parkour Package contents, section, price and atomic purchase checks passed.');
