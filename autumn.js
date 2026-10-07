export const AUTUMN_LEAF_INTERVAL = 3600000;
export const MAX_AUTUMN_LEAVES = 5;

// Flat woodland with long clear stretches between generated places.
export function buildAutumnWorld(world) {
  world.worldType = "autumn";
  world.autumnLayoutVersion = 2;
  world.generatedPlaces = [];
  for (let x = 0; x < world.width; x++) {
    const floor = 39 + Math.round(Math.sin(x * .024) * .55);
    world.surface[x] = floor;
    for (let y = floor; y < world.height; y++) world.set(x, y, y === world.height - 1 ? 3 : y < floor + 5 ? 89 : 2);
  }
  const level = (start, end, floor = 39) => {
    for (let x = start; x <= end; x++) {
      world.surface[x] = floor;
      for (let y = floor - 7; y <= floor + 5; y++) world.set(x, y, y < floor ? 0 : y < floor + 5 ? 89 : 2);
    }
  };
  const house = (left, width, family = false) => {
    const right = left + width - 1, floor = 39;
    level(left - 1, right + 1);
    for (let x = left; x <= right; x++) {
      world.set(x, floor, 56);
      if (family || x !== left + 3) world.set(x, floor - 4, 95);
      if (x >= left + 2 && x <= right - 2) world.set(x, floor - 5, 95);
      for (let y = floor - 3; y < floor; y++) {
        world.setBackground(x, y, 88);
        if (x === left || x === right && y === floor - 3) world.set(x, y, 56);
      }
    }
    // Both entrances are open so residents and visitors can reach each other.
    for (const x of [left, right]) { world.set(x, floor - 1, 0); world.set(x, floor - 2, 0); }
    world.set(left + 2, floor - 3, 57); world.set(right - 2, floor - 3, 57);
    if (family) {
      world.familyHouse = { left, right, top: floor - 5, bottom: floor + 1 };
      world.familyNpcs = familyMembers(left, floor);
    } else world.set(left + 3, floor - 1, 97);
  };
  level(12, 20); world.set(16, 38, 6);
  house(92, 9);
  // A small patch, with room to walk around individual pumpkins.
  level(144, 159);
  for (const x of [146, 149, 152, 155]) world.set(x, 38, 81);
  world.set(144, 38, 94); world.set(159, 38, 94);
  // One family house and a modest harvest stall, separated by open forest.
  house(202, 15, true);
  level(240, 251);
  for (let x = 244; x <= 249; x++) world.set(x, 35, 95);
  world.set(244, 36, 56); world.set(249, 36, 56);
  world.set(244, 38, 96); world.set(248, 38, 93);
  world.set(241, 38, 94); world.set(251, 38, 94);
  const treeXs = [8, 30, 46, 64, 82, 112, 129, 168, 185, 229, 254];
  treeXs.forEach((x, i) => { if (x < world.width && !world.get(x, world.surface[x] - 1)) world.set(x, world.surface[x] - 1, 90 + i % 3); });
  for (const x of [36, 55, 74, 118, 134, 174, 190, 222, 235, 252]) if (!world.get(x, world.surface[x] - 1)) world.set(x, world.surface[x] - 1, 97);
  for (const x of [58, 121, 177]) if (!world.get(x, world.surface[x] - 1)) world.set(x, world.surface[x] - 1, 81);
  world.ghosts = { initial: { x: 96, y: 37, variant: 0 } };
  world.ghostSequence = 0;
  replenishAutumnLeaves(world);
  return world;
}

function familyMembers(left, floor) {
  const make = (name, x, outfitId, hair, dialogue, offer) => ({ name, x, y: floor - 1,
    outfitId, hair, skin: "#f1c598", outfit: "#c28c4d", hat: "none", enabled: true, fixed: true,
    dialogue, offers: { trade: { repeatable: true, response: "Thank you! Come back whenever you have more.", ...offer } } });
  return {
    "family-mother": make("Mara", left + 3, "autumn-cardigan", "#6f4431", "Welcome to our family home. I buy fresh pumpkins.", {
      label: "10 Pumpkins → 50 Sky Gems", requires: [{ itemId: "pumpkin_block", amount: 10 }], rewards: [{ itemId: "gems", amount: 50 }] }),
    "family-child": make("Rowan", left + 7, "autumn-hoodie", "#855b3b", "I collect forest mushrooms. Can you find five for me?", {
      label: "5 Mushrooms → 20 Sky Gems", requires: [{ itemId: "forest_mushroom", amount: 5 }], rewards: [{ itemId: "gems", amount: 20 }] }),
    "family-father": make("Elias", left + 11, "autumn-plaid", "#493b32", "Bring twenty autumn trees, in any mix of yellow, orange and red, and I will give you a Pickaxe.", {
      label: "20 Autumn Trees → Pickaxe", requires: [], requiresAny: [{ itemIds: ["tile_90", "tile_91", "tile_92"], amount: 20, label: "Autumn Trees (any colour)" }], rewards: [{ itemId: "pickaxe", amount: 1 }] }),
  };
}

export function replenishAutumnLeaves(world) {
  if (world.worldType !== "autumn") return 0;
  let count = 0;
  for (const tile of world.foreground) if (tile === 87) count++;
  const spots = [];
  for (let x = 1; x < world.width - 1; x++) {
    if (x >= 12 && x <= 20) continue;
    const y = world.surface[x] - 1;
    if (world.get(x, y) === 0 && !world.getBackground(x, y) && world.get(x, y + 1) === 89) {
      const score = Math.imul(x ^ Math.floor(world.autumnGrownAt / AUTUMN_LEAF_INTERVAL), 2654435761) >>> 0;
      spots.push({ x, y, score });
    }
  }
  spots.sort((a, b) => a.score - b.score);
  let grown = 0;
  for (const { x, y } of spots) {
    if (count >= MAX_AUTUMN_LEAVES) break;
    world.set(x, y, 87); count++; grown++;
  }
  return grown;
}

export function updateAutumnResources(world, now = Date.now()) {
  if (world.worldType !== "autumn" || now - world.autumnGrownAt < AUTUMN_LEAF_INTERVAL) return 0;
  // Missed hours replenish once. Advance the saved clock even if no room exists.
  world.autumnGrownAt += Math.floor((now - world.autumnGrownAt) / AUTUMN_LEAF_INTERVAL) * AUTUMN_LEAF_INTERVAL;
  return replenishAutumnLeaves(world);
}
