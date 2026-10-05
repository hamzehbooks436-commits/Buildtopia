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

  20: { name: "Tree", solid: false, breakTime: 480, harvest: { drops: [{ item: "wood_block", min: 1, max: 3 }, { item: "dirt_seed", min: 1, max: 2 }] }, color: "#6e9e4a", sprite: [4, 17, 20, 20] },
  21: { name: "Moonflower", solid: false, breakTime: 500, harvest: { drops: [{ item: "moon_seed", weighted: [{ count: 1, weight: 9 }, { count: 2, weight: 1 }] }, { item: "gems", min: 5, max: 10 }] }, color: "#d982ff", sprite: [18, 194, 18, 18] },
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

  55: { name: "Sand", solid: true, breakTime: 320, drops: [{ item: "sand_block", count: 1 }], color: "#f4d27b", sprite: [124, 90, 20, 20] },
  56: { name: "Wood Block", solid: true, breakTime: 520, drops: [{ item: "wood_block", count: 1 }], color: "#b8753d", sprite: [148, 90, 20, 20] },
  57: { name: "Glass Block", solid: true, breakTime: 420, drops: [{ item: "glass_block", count: 1 }], color: "#9de8f2", sprite: [172, 90, 20, 20] },
  58: { name: "World Door", solid: false, breakTime: 420, drops: [{ item: "door_block", count: 1 }], worldDoor: true, color: "#59b9dd", sprite: [196, 90, 20, 20] },
  59: { name: "Ladder", solid: false, breakTime: 260, drops: [{ item: "ladder", count: 1 }], ladder: true, color: "#d79b51", sprite: [220, 90, 20, 20] },
  60: { name: "Checkpoint", solid: false, breakTime: 600, drops: [{ item: "checkpoint_block", count: 1 }], checkpoint: true, color: "#55d98a", sprite: [244, 90, 20, 20] },
  61: { name: "Water", solid: false, unbreakable: true, water: true, color: "#39bde8", sprite: [268, 90, 20, 20] },
  62: { name: "Palm Tree", solid: false, breakTime: 520, harvest: { drops: [{ item: "wood_block", min: 1, max: 3 }, { item: "coconut_block", count: 1, chance: .5 }] }, color: "#42c66c", sprite: [292, 90, 20, 20] },
  63: { name: "Coconut Block", solid: true, breakTime: 360, drops: [{ item: "coconut_block", count: 1 }], color: "#8a552e", sprite: [280, 190, 20, 20] },
  64: { name: "Wooden Platform", solid: false, oneWay: true, breakTime: 400, drops: [{ item: "wooden_platform", count: 1 }], color: "#df985b", sprite: [4, 250, 20, 20] },
  65: { name: "Bounce Pad", solid: true, bounce: true, breakTime: 500, drops: [{ item: "bounce_pad", count: 1 }], color: "#d982ff", sprite: [28, 250, 20, 20] },
  66: { name: "Ice Block", solid: true, ice: true, breakTime: 420, drops: [{ item: "ice_block", count: 1 }], color: "#9ae7ff", sprite: [52, 250, 20, 20] },
  67: { name: "Spike Block", solid: false, hazard: true, breakTime: 500, drops: [{ item: "spike_block", count: 1 }], color: "#ef6683", sprite: [76, 250, 20, 20] },
  68: { name: "Snow Block", solid: true, breakTime: 320, drops: [{ item: "snow_block", count: 1 }, { item: "snowball", count: 3 }], color: "#effaff", sprite: [100, 250, 20, 20] },
  69: { name: "Snowy Pine Tree", solid: false, breakTime: 520, harvest: { drops: [{ item: "wood_block", min: 2, max: 4 }] }, color: "#64c9bd", sprite: [124, 250, 20, 20] },
  70: { name: "Ice Crystal", solid: false, glow: true, breakTime: 450, drops: [{ item: "ice_crystal", count: 1 }, { item: "gems", min: 4, max: 8 }], color: "#b2a1ff", sprite: [148, 250, 20, 20] },
  71: { name: "Icicle", solid: false, icicle: true, breakTime: 350, drops: [{ item: "icicle", count: 1 }], color: "#b0f3ff", sprite: [172, 250, 20, 20] },
  72: { name: "Igloo Background Wall", solid: false, unbreakable: true, backgroundOnly: true, color: "#abcbdc", sprite: [268, 250, 20, 20] },

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
  "2+55": "glass_block",
  "43+56": "ladder",
};

export function spliceResult(firstTile, secondTile) {
  return SEED_RECIPES[[firstTile, secondTile].sort((a, b) => a - b).join("+")] ?? null;
}

export const ITEM_DEFS = {
  ice_crystal: { name: "Ice Crystal", placesTile: 70, color: "#b2a1ff", sprite: [148, 250, 20, 20], description: "Mine glowing crystals in ice caves. Place them as luminous decorations." },
  icicle: { name: "Icicle", placesTile: 71, color: "#b0f3ff", sprite: [172, 250, 20, 20], description: "Hang below a solid ceiling. Shakes, then falls when someone approaches underneath." },
  snowball: { name: "Snowball", throwable: true, color: "#effaff", sprite: [196, 250, 20, 20], description: "Mine Snow Blocks or buy in Tools & Upgrades. Select and click/tap or press E to throw. Harmless snowball tags!" },
  igloo_kit: { name: "Igloo Kit", buildsIgloo: true, color: "#ceeafa", sprite: [220, 250, 20, 20], description: "Place on a clear 9-tile-wide area with 5 tiles of headroom. The doorway opens on the right." },
  snow_block: { name: "Snow Block", placesTile: 68, color: "#effaff", sprite: [100, 250, 20, 20], description: "Mine snow in ice and snow worlds, then build with it." },
  wooden_platform: { name: "Wooden Platform", placesTile: 64, color: "#df985b", sprite: [4, 250, 20, 20], description: "Jump through from below and land on top." },
  bounce_pad: { name: "Bounce Pad", placesTile: 65, color: "#d982ff", sprite: [28, 250, 20, 20], description: "Land on top to launch high into the air." },
  ice_block: { name: "Ice Block", placesTile: 66, color: "#9ae7ff", sprite: [52, 250, 20, 20], description: "Slippery footing: momentum takes longer to stop or reverse." },
  spike_block: { name: "Spike Block", placesTile: 67, color: "#ef6683", sprite: [76, 250, 20, 20], description: "Touching spikes sends you to your checkpoint, or world spawn." },
  brick_seed: { name: "Brick Seed", placesTile: 37, color: "#f57e66", sprite: [246, 130, 18, 18], description: "Splice Clay and Rock Seeds on the same tile. Grows into a Brick Crop." },
  brick_block: { name: "Brick Block", placesTile: 54, color: "#f57e66", sprite: [100, 90, 20, 20], description: "A sturdy brick building block." },
  sand_block: { name: "Sand", placesTile: 55, color: "#f4d27b", sprite: [124, 90, 20, 20], description: "Beach sand. Combine with Rock for Glass." },
  wood_block: { name: "Wood Block", placesTile: 56, color: "#b8753d", sprite: [148, 90, 20, 20], description: "Harvested from Trees and Palms. Combine with Rock or a Yellow Flower." },
  glass_block: { name: "Glass Block", placesTile: 57, color: "#9de8f2", sprite: [172, 90, 20, 20], description: "Clear building glass crafted from Sand and Rock." },
  door_block: { name: "World Door", placesTile: 58, color: "#59b9dd", sprite: [196, 90, 20, 20], description: "Walk through it to visit its destination. Select the Wrench and tap it to choose a world." },
  ladder: { name: "Ladder", placesTile: 59, color: "#d79b51", sprite: [220, 90, 20, 20], description: "Hold jump while touching it to climb at a steady speed." },
  checkpoint_block: { name: "Checkpoint", placesTile: 60, color: "#55d98a", sprite: [244, 90, 20, 20], description: "Walk over it to set your respawn point in this world." },
  coconut_block: { name: "Coconut Block", placesTile: 63, color: "#8a552e", sprite: [280, 190, 20, 20], description: "A tropical block found in beach worlds." },
  wrench: { name: "Wrench", tool: true, color: "#f4ca58", sprite: [314, 112, 18, 18], description: "Select it, then tap World Doors to configure them or players to request a trade." },
  dirt_seed: { name: "Dirt Seed", placesTile: 10, color: "#8cd46f", sprite: [3, 193, 18, 18], description: "Grows into a Tree that drops Wood Blocks." },
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

// Make every terrain/decorative tile available to the admin catalogue, including
// water, trees and crops that previously had no inventory item. Regular shops
// still offer only their explicitly listed items.
for (const [id, tile] of Object.entries(TILE_DEFS)) {
  if (Number(id) === 0 || Object.values(ITEM_DEFS).some(item => item.placesTile === Number(id))) continue;
  ITEM_DEFS[`tile_${id}`] = { name: tile.name, placesTile: Number(id), color: tile.color, sprite: tile.sprite, backgroundOnly: tile.backgroundOnly === true, description: `Place ${tile.name}.` };
}

export const SLOT_UPGRADE = { item: "inventory_slots", amount: 5, cost: 500 };

export const SHOP_ITEMS = [
  { item: "seed_package", amount: 3, cost: 250 },
  { item: "dirt_seed", amount: 2, cost: 2 },
  { item: "moon_seed", amount: 1, cost: 25 },
  { item: "dirt_block", amount: 4, cost: 4 },
  { item: "rock", amount: 2, cost: 6 },
  { item: "igloo_kit", amount: 1, cost: 250 },
  { item: "checkpoint_block", amount: 1, cost: 500 },
  { item: "parkour_package", name: "Parkour Package", amount: 1, cost: 1500, rewards: [
    { item: "ice_block", amount: 15 },
    { item: "spike_block", amount: 20 },
    { item: "checkpoint_block", amount: 4 },
    { item: "lava_block", amount: 35 },
    { item: "wooden_platform", amount: 15 },
    { item: "bounce_pad", amount: 5 },
  ] },
  SLOT_UPGRADE,
  { item: "pickaxe", amount: 1, cost: 750 },
  { item: "snowball", amount: 20, cost: 10 },
  { item: "world_lock", amount: 1, cost: 15000 },
];

export const SHOP_SECTIONS = [
  { id: "seeds", name: "Seeds & Growing", icon: "dirt_seed", description: "Seeds and surprise packages", items: ["seed_package", "dirt_seed", "moon_seed"] },
  { id: "building", name: "Building Blocks", icon: "dirt_block", description: "Blocks, igloos and parkour packs", items: ["dirt_block", "rock", "igloo_kit", "checkpoint_block", "parkour_package"] },
  { id: "upgrades", name: "Tools & Upgrades", icon: "pickaxe", description: "Equipment, snowballs and upgrades", items: ["pickaxe", "snowball", "inventory_slots", "world_lock"] },
];

export function isSolid(tileId) {
  return Boolean(TILE_DEFS[tileId]?.solid);
}
