export const TILE_DEFS = {
  0: { name: "Empty", solid: false, color: "transparent" },
  1: { name: "Dirt", solid: true, breakTime: 420, drops: [{ item: "dirt_seed", count: 1 }], color: "#9f633f", sprite: [84, 12, 20, 20] },
  2: { name: "Rock", solid: true, breakTime: 1200, drops: [{ item: "rock", count: 1 }, { item: "gems", count: 1, chance: .35 }], color: "#7d7896", sprite: [139, 12, 20, 20] },
  3: { name: "Bedrock", solid: true, unbreakable: true, color: "#403c55", sprite: [314, 286, 18, 18] },
  10: { name: "Dirt Seed", solid: false, breakTime: 180, drops: [{ item: "dirt_seed", count: 1 }], growTime: 30000, growsInto: 20, color: "#75bd62", sprite: [3, 193, 18, 18] },
  11: { name: "Moonflower Seed", solid: false, breakTime: 180, drops: [{ item: "moon_seed", count: 1 }], growTime: 45000, growsInto: 21, color: "#82b4df", sprite: [4, 223, 18, 18] },
  20: { name: "Dirtwood Tree", solid: false, breakTime: 480, harvest: { drops: [{ item: "dirt_seed", min: 2, max: 4 }, { item: "gems", min: 1, max: 2 }] }, color: "#6e9e4a", sprite: [4, 17, 20, 20] },
  21: { name: "Moonflower", solid: false, breakTime: 500, harvest: { drops: [{ item: "moon_seed", min: 2, max: 4 }, { item: "gems", min: 2, max: 4 }] }, color: "#af79dc", sprite: [18, 194, 18, 18] },
  30: { name: "Sky Market", solid: true, unbreakable: true, shop: true, color: "#e6a94e", sprite: [105, 46, 20, 20] },
};

export const ITEM_DEFS = {
  dirt_seed: { name: "Dirt Seed", placesTile: 10, color: "#8cd46f", sprite: [3, 193, 18, 18], description: "Grows into a Dirtwood Tree." },
  moon_seed: { name: "Moonflower Seed", placesTile: 11, color: "#9ac8ff", sprite: [4, 223, 18, 18], description: "Grows into a Moonflower." },
  dirt_block: { name: "Dirt Block", placesTile: 1, color: "#a96a46", sprite: [84, 12, 20, 20], description: "A sturdy building block." },
  rock: { name: "Rock", placesTile: 2, color: "#948ea7", sprite: [139, 12, 20, 20], description: "A durable building block." },
  gems: { name: "Sky Gems", currency: true, color: "#ffdf5f", sprite: [326, 46, 18, 18], description: "Spend these in the Sky Market." },
};

export const SHOP_ITEMS = [
  { item: "dirt_seed", amount: 2, cost: 2 },
  { item: "moon_seed", amount: 1, cost: 7 },
  { item: "dirt_block", amount: 4, cost: 4 },
  { item: "rock", amount: 2, cost: 6 },
];

export function isSolid(tileId) {
  return Boolean(TILE_DEFS[tileId]?.solid);
}
