const BLOCK_2_4 = [{ count: 2, weight: 1 }, { count: 3, weight: 1 }, { count: 4, weight: 1 }];

export const TILE_DEFS = {
  0: { name: "Empty", solid: false, color: "transparent" },
  1: { name: "Dirt", solid: true, breakTime: 420, drops: [{ item: "dirt_seed", count: 1, chance: .5 }, { item: "dirt_block", count: 1, chance: .2 }], color: "#9f633f", sprite: [84, 12, 20, 20] },
  2: { name: "Rock", solid: true, breakTime: 1200, drops: [{ item: "rock_seed", count: 1, chance: .5 }, { item: "rock", count: 1, chance: .2 }, { item: "gems", count: 1, chance: .35 }], color: "#9992e4", sprite: [139, 12, 20, 20] },
  3: { name: "Bedrock", solid: true, unbreakable: true, color: "#403c55", sprite: [314, 286, 18, 18] },
  4: { name: "Clay", solid: true, breakTime: 700, drops: [{ item: "clay_seed", count: 1, chance: .5 }, { item: "clay_block", count: 1, chance: .2 }], color: "#ebafdf", sprite: [84, 40, 20, 20] },
  5: { name: "Lava", solid: false, breakTime: 1600, drops: [{ item: "lava_seed", count: 1, chance: .5 }, { item: "lava_block", count: 1, chance: .2 }], color: "#ff8846", sprite: [139, 40, 20, 20] },
  6: { name: "White Door", solid: false, unbreakable: true, door: true, color: "#e8e6f2", sprite: [314, 40, 18, 18] },
  7: { name: "World Lock", solid: true, breakTime: 800, drops: [{ item: "world_lock", count: 1 }], color: "#f2c14e", sprite: [314, 64, 18, 18] },

  10: { name: "Dirt Seed", solid: false, breakTime: 180, drops: [{ item: "dirt_seed", count: 1 }], growTime: 30000, growsInto: 20, color: "#70e65d", sprite: [3, 193, 18, 18] },
  11: { name: "Moonflower Seed", solid: false, breakTime: 180, drops: [{ item: "moon_seed", count: 1 }], growTime: 45000, growsInto: 21, color: "#71d7ff", sprite: [4, 223, 18, 18] },
  12: { name: "Clay Seed", solid: false, breakTime: 180, drops: [{ item: "clay_seed", count: 1 }], growTime: 40000, growsInto: 25, color: "#ebafdf", sprite: [4, 130, 18, 18] },
  13: { name: "Rock Seed", solid: false, breakTime: 180, drops: [{ item: "rock_seed", count: 1 }], growTime: 60000, growsInto: 26, color: "#9992e4", sprite: [26, 130, 18, 18] },
  14: { name: "Lava Seed", solid: false, breakTime: 180, drops: [{ item: "lava_seed", count: 1 }], growTime: 60000, growsInto: 27, color: "#ff8846", sprite: [48, 130, 18, 18] },
  15: { name: "Red Flower Seed", solid: false, breakTime: 180, drops: [{ item: "red_flower_seed", count: 1 }], growTime: 20000, growsInto: 28, color: "#ff628c", sprite: [70, 130, 18, 18] },
  16: { name: "Blue Flower Seed", solid: false, breakTime: 180, drops: [{ item: "blue_flower_seed", count: 1 }], growTime: 20000, growsInto: 29, color: "#43b9ff", sprite: [92, 130, 18, 18] },
  17: { name: "Green Flower Seed", solid: false, breakTime: 180, drops: [{ item: "green_flower_seed", count: 1 }], growTime: 20000, growsInto: 31, color: "#65ec81", sprite: [114, 130, 18, 18] },
  18: { name: "Yellow Flower Seed", solid: false, breakTime: 180, drops: [{ item: "yellow_flower_seed", count: 1 }], growTime: 20000, growsInto: 32, color: "#ffdb42", sprite: [136, 130, 18, 18] },
  19: { name: "Red Block Seed", solid: false, breakTime: 180, drops: [{ item: "red_block_seed", count: 1 }], growTime: 50000, growsInto: 33, color: "#ff5975", sprite: [158, 130, 18, 18] },
  22: { name: "Blue Block Seed", solid: false, breakTime: 180, drops: [{ item: "blue_block_seed", count: 1 }], growTime: 50000, growsInto: 34, color: "#359ef5", sprite: [180, 130, 18, 18] },
  23: { name: "Green Block Seed", solid: false, breakTime: 180, drops: [{ item: "green_block_seed", count: 1 }], growTime: 50000, growsInto: 35, color: "#4edb79", sprite: [202, 130, 18, 18] },
  24: { name: "Yellow Block Seed", solid: false, breakTime: 180, drops: [{ item: "yellow_block_seed", count: 1 }], growTime: 50000, growsInto: 36, color: "#ffcf3f", sprite: [224, 130, 18, 18] },

  20: { name: "Dirtwood Tree", solid: false, breakTime: 480, harvest: { drops: [{ item: "dirt_block", weighted: BLOCK_2_4 }, { item: "dirt_seed", min: 1, max: 2 }, { item: "gems", min: 1, max: 2 }] }, color: "#6e9e4a", sprite: [4, 17, 20, 20] },
  21: { name: "Moonflower", solid: false, breakTime: 500, harvest: { drops: [{ item: "moon_seed", weighted: [{ count: 1, weight: 9 }, { count: 2, weight: 1 }] }, { item: "gems", min: 1, max: 2 }] }, color: "#d982ff", sprite: [18, 194, 18, 18] },
  25: { name: "Clay Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "clay_block", weighted: BLOCK_2_4 }, { item: "clay_seed", count: 1, chance: .35 }] }, color: "#ebafdf", sprite: [4, 160, 20, 20] },
  26: { name: "Rock Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "rock", weighted: BLOCK_2_4 }, { item: "rock_seed", count: 1, chance: .35 }, { item: "gems", count: 1, chance: .35 }] }, color: "#9992e4", sprite: [26, 160, 20, 20] },
  27: { name: "Lava Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "lava_block", weighted: BLOCK_2_4 }, { item: "lava_seed", count: 1, chance: .35 }] }, color: "#ff8846", sprite: [48, 160, 20, 20] },
  28: { name: "Red Flower Crop", solid: false, breakTime: 300, harvest: { drops: [{ item: "red_flower", weighted: BLOCK_2_4 }, { item: "red_flower_seed", count: 1, chance: .35 }] }, color: "#ff628c", sprite: [70, 160, 20, 20] },
  29: { name: "Blue Flower Crop", solid: false, breakTime: 300, harvest: { drops: [{ item: "blue_flower", weighted: BLOCK_2_4 }, { item: "blue_flower_seed", count: 1, chance: .35 }] }, color: "#43b9ff", sprite: [92, 160, 20, 20] },
  31: { name: "Green Flower Crop", solid: false, breakTime: 300, harvest: { drops: [{ item: "green_flower", weighted: BLOCK_2_4 }, { item: "green_flower_seed", count: 1, chance: .35 }] }, color: "#65ec81", sprite: [114, 160, 20, 20] },
  32: { name: "Yellow Flower Crop", solid: false, breakTime: 300, harvest: { drops: [{ item: "yellow_flower", weighted: BLOCK_2_4 }, { item: "yellow_flower_seed", count: 1, chance: .35 }] }, color: "#ffdb42", sprite: [136, 160, 20, 20] },
  33: { name: "Red Block Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "red_block", weighted: BLOCK_2_4 }, { item: "red_block_seed", count: 1, chance: .35 }] }, color: "#ff5975", sprite: [158, 160, 20, 20] },
  34: { name: "Blue Block Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "blue_block", weighted: BLOCK_2_4 }, { item: "blue_block_seed", count: 1, chance: .35 }] }, color: "#359ef5", sprite: [180, 160, 20, 20] },
  35: { name: "Green Block Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "green_block", weighted: BLOCK_2_4 }, { item: "green_block_seed", count: 1, chance: .35 }] }, color: "#4edb79", sprite: [202, 160, 20, 20] },
  36: { name: "Yellow Block Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "yellow_block", weighted: BLOCK_2_4 }, { item: "yellow_block_seed", count: 1, chance: .35 }] }, color: "#ffcf3f", sprite: [224, 160, 20, 20] },

  37: { name: "Brick Seed", solid: false, breakTime: 180, drops: [{ item: "brick_seed", count: 1 }], growTime: 55000, growsInto: 38, color: "#f57e66", sprite: [246, 130, 18, 18] },
  38: { name: "Brick Crop", solid: false, breakTime: 400, harvest: { drops: [{ item: "brick_block", weighted: BLOCK_2_4 }, { item: "brick_seed", count: 1, chance: .35 }] }, color: "#f57e66", sprite: [246, 160, 20, 20] },
  54: { name: "Brick Block", solid: true, breakTime: 800, drops: [{ item: "brick_seed", count: 1, chance: .5 }, { item: "brick_block", count: 1, chance: .2 }], color: "#f57e66", sprite: [100, 90, 20, 20] },

  40: { name: "Red Flower", solid: false, breakTime: 200, drops: [{ item: "red_flower_seed", count: 1, chance: .5 }, { item: "red_flower", count: 1, chance: .2 }], color: "#ff628c", sprite: [4, 60, 18, 18] },
  41: { name: "Blue Flower", solid: false, breakTime: 200, drops: [{ item: "blue_flower_seed", count: 1, chance: .5 }, { item: "blue_flower", count: 1, chance: .2 }], color: "#43b9ff", sprite: [26, 60, 18, 18] },
  42: { name: "Green Flower", solid: false, breakTime: 200, drops: [{ item: "green_flower_seed", count: 1, chance: .5 }, { item: "green_flower", count: 1, chance: .2 }], color: "#65ec81", sprite: [48, 60, 18, 18] },
  43: { name: "Yellow Flower", solid: false, breakTime: 200, drops: [{ item: "yellow_flower_seed", count: 1, chance: .5 }, { item: "yellow_flower", count: 1, chance: .2 }], color: "#ffdb42", sprite: [70, 60, 18, 18] },

  50: { name: "Red Block", solid: true, breakTime: 700, drops: [{ item: "red_block_seed", count: 1, chance: .5 }, { item: "red_block", count: 1, chance: .2 }], color: "#ff5975", sprite: [4, 90, 20, 20] },
  51: { name: "Blue Block", solid: true, breakTime: 700, drops: [{ item: "blue_block_seed", count: 1, chance: .5 }, { item: "blue_block", count: 1, chance: .2 }], color: "#359ef5", sprite: [28, 90, 20, 20] },
  52: { name: "Green Block", solid: true, breakTime: 700, drops: [{ item: "green_block_seed", count: 1, chance: .5 }, { item: "green_block", count: 1, chance: .2 }], color: "#4edb79", sprite: [52, 90, 20, 20] },
  53: { name: "Yellow Block", solid: true, breakTime: 700, drops: [{ item: "yellow_block_seed", count: 1, chance: .5 }, { item: "yellow_block", count: 1, chance: .2 }], color: "#ffcf3f", sprite: [76, 90, 20, 20] },
};

// Sorted tile pairs make splicing work in either planting order.
export const SEED_RECIPES = {
  "12+15": "red_block_seed",
  "12+16": "blue_block_seed",
  "12+17": "green_block_seed",
  "12+18": "yellow_block_seed",
  "12+13": "brick_seed",
};

export function spliceResult(firstTile, secondTile) {
  return SEED_RECIPES[[firstTile, secondTile].sort((a, b) => a - b).join("+")] ?? null;
}

export const ITEM_DEFS = {
  brick_seed: { name: "Brick Seed", placesTile: 37, color: "#f57e66", sprite: [246, 130, 18, 18], description: "Splice Clay and Rock Seeds on the same tile. Grows into a Brick Crop." },
  brick_block: { name: "Brick Block", placesTile: 54, color: "#f57e66", sprite: [100, 90, 20, 20], description: "A sturdy brick building block." },
  dirt_seed: { name: "Dirt Seed", placesTile: 10, color: "#8cd46f", sprite: [3, 193, 18, 18], description: "Grows into a Dirtwood Tree." },
  moon_seed: { name: "Moonflower Seed", placesTile: 11, color: "#9ac8ff", sprite: [4, 223, 18, 18], description: "Grows into a Moonflower." },
  clay_seed: { name: "Clay Seed", placesTile: 12, color: "#b8b4c8", sprite: [4, 130, 18, 18], description: "Grows into a Clay Crop. Place a flower seed on the same tile for colored block seeds, or a Rock Seed for a Brick Seed." },
  rock_seed: { name: "Rock Seed", placesTile: 13, color: "#948ea7", sprite: [26, 130, 18, 18], description: "Grows into a Rock Crop. Splice with a Clay Seed on the same tile for a Brick Seed." },
  lava_seed: { name: "Lava Seed", placesTile: 14, color: "#ff9a4a", sprite: [48, 130, 18, 18], description: "Grows into a Lava Crop." },
  red_flower_seed: { name: "Red Flower Seed", placesTile: 15, color: "#ff628c", sprite: [70, 130, 18, 18], description: "Grows Red Flowers. Place it on the same tile as a Clay Seed for a Red Block Seed." },
  blue_flower_seed: { name: "Blue Flower Seed", placesTile: 16, color: "#43b9ff", sprite: [92, 130, 18, 18], description: "Grows Blue Flowers. Place it on the same tile as a Clay Seed for a Blue Block Seed." },
  green_flower_seed: { name: "Green Flower Seed", placesTile: 17, color: "#65ec81", sprite: [114, 130, 18, 18], description: "Grows Green Flowers. Place it on the same tile as a Clay Seed for a Green Block Seed." },
  yellow_flower_seed: { name: "Yellow Flower Seed", placesTile: 18, color: "#ffdb42", sprite: [136, 130, 18, 18], description: "Grows Yellow Flowers. Place it on the same tile as a Clay Seed for a Yellow Block Seed." },
  red_block_seed: { name: "Red Block Seed", placesTile: 19, color: "#ff5975", sprite: [158, 130, 18, 18], description: "Grows into a Red Block Crop." },
  blue_block_seed: { name: "Blue Block Seed", placesTile: 22, color: "#359ef5", sprite: [180, 130, 18, 18], description: "Grows into a Blue Block Crop." },
  green_block_seed: { name: "Green Block Seed", placesTile: 23, color: "#4edb79", sprite: [202, 130, 18, 18], description: "Grows into a Green Block Crop." },
  yellow_block_seed: { name: "Yellow Block Seed", placesTile: 24, color: "#ffcf3f", sprite: [224, 130, 18, 18], description: "Grows into a Yellow Block Crop." },
  dirt_block: { name: "Dirt Block", placesTile: 1, color: "#a96a46", sprite: [84, 12, 20, 20], description: "A sturdy building block." },
  rock: { name: "Rock", placesTile: 2, color: "#948ea7", sprite: [139, 12, 20, 20], description: "A durable building block." },
  clay_block: { name: "Clay", placesTile: 4, color: "#b8b4c8", sprite: [84, 40, 20, 20], description: "Smooth building clay." },
  lava_block: { name: "Lava", placesTile: 5, color: "#ff9a4a", sprite: [139, 40, 20, 20], description: "Molten rock. Handle with care." },
  red_flower: { name: "Red Flower", placesTile: 40, color: "#ff628c", sprite: [4, 60, 18, 18], description: "A bright decorative flower." },
  blue_flower: { name: "Blue Flower", placesTile: 41, color: "#43b9ff", sprite: [26, 60, 18, 18], description: "A calm decorative flower." },
  green_flower: { name: "Green Flower", placesTile: 42, color: "#65ec81", sprite: [48, 60, 18, 18], description: "A fresh decorative flower." },
  yellow_flower: { name: "Yellow Flower", placesTile: 43, color: "#ffdb42", sprite: [70, 60, 18, 18], description: "A sunny decorative flower." },
  red_block: { name: "Red Block", placesTile: 50, color: "#ffb0b6", sprite: [4, 90, 20, 20], description: "A colorful building block." },
  blue_block: { name: "Blue Block", placesTile: 51, color: "#9ae7ff", sprite: [28, 90, 20, 20], description: "A colorful building block." },
  green_block: { name: "Green Block", placesTile: 52, color: "#b3ff91", sprite: [52, 90, 20, 20], description: "A colorful building block." },
  yellow_block: { name: "Yellow Block", placesTile: 53, color: "#fff59b", sprite: [76, 90, 20, 20], description: "A colorful building block." },
  gems: { name: "Sky Gems", currency: true, color: "#ffdf5f", sprite: [280, 220, 18, 18], description: "Spend these in the Sky Market." },
  pickaxe: { name: "Pickaxe", color: "#c8c8d4", sprite: [314, 88, 18, 18], description: "Breaks blocks 55% faster. A tool — it can't be placed." },
  white_door: { name: "White Door", placesTile: 6, color: "#f4f2fa", sprite: [314, 40, 18, 18], description: "Click it to return to the World Gate. You respawn here." },
  world_lock: { name: "World Lock", placesTile: 7, color: "#f2c14e", sprite: [314, 64, 18, 18], description: "Locks a world so only you can build or break in it." },
};

export const SLOT_UPGRADE = { item: "inventory_slots", amount: 5, cost: 500 };

export const SHOP_ITEMS = [
  { item: "seed_package", amount: 3, cost: 75 },
  { item: "dirt_seed", amount: 2, cost: 2 },
  { item: "moon_seed", amount: 1, cost: 7 },
  { item: "dirt_block", amount: 4, cost: 4 },
  { item: "rock", amount: 2, cost: 6 },
  SLOT_UPGRADE,
  { item: "pickaxe", amount: 1, cost: 500 },
  { item: "world_lock", amount: 1, cost: 15000 },
];

export function isSolid(tileId) {
  return Boolean(TILE_DEFS[tileId]?.solid);
}
