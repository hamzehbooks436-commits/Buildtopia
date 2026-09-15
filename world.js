import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { TILE_DEFS, isSolid } from "./definitions.js";

const FLOWER_GROW_INTERVAL = 3600000;
const FLOWERS_PER_GROWTH = 5;
const MAX_FLOWERS = 20;
const FALLING_FLOWERS = new Set([21, 28, 29, 31, 32, 40, 41, 42, 43]);

export class World {
  constructor() {
    this.width = WORLD_WIDTH;
    this.height = WORLD_HEIGHT;
    this.foreground = new Int16Array(this.width * this.height);
    this.background = new Int16Array(this.width * this.height);
    this.plantedTiles = [];
    this.surface = new Int16Array(this.width);
    this.flowerGrownAt = Date.now();
    this.naturalFlowers = [];
  }

  index(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height; }
  get(x, y) { return this.inBounds(x, y) ? this.foreground[this.index(x, y)] : 3; }
  getBackground(x, y) { return this.inBounds(x, y) ? this.background[this.index(x, y)] : 0; }
  set(x, y, tileId) { if (this.inBounds(x, y)) this.foreground[this.index(x, y)] = tileId; }
  setBackground(x, y, tileId) { if (this.inBounds(x, y)) this.background[this.index(x, y)] = tileId; }
  isSolid(x, y) { return isSolid(this.get(x, y)); }

  plant(x, y, tileId, plantedAt = Date.now()) {
    this.set(x, y, tileId);
    this.plantedTiles = this.plantedTiles.filter((plant) => plant.x !== x || plant.y !== y);
    this.plantedTiles.push({ x, y, tileId, plantedAt });
  }

  removePlant(x, y) {
    this.plantedTiles = this.plantedTiles.filter((plant) => plant.x !== x || plant.y !== y);
  }

  updatePlants(now = Date.now()) {
    let grew = 0;
    this.plantedTiles = this.plantedTiles.filter((plant) => {
      const definition = TILE_DEFS[plant.tileId];
      if (definition && now - plant.plantedAt >= definition.growTime && this.get(plant.x, plant.y) === plant.tileId) {
        this.set(plant.x, plant.y, definition.growsInto);
        grew += 1;
        return false;
      }
      return this.get(plant.x, plant.y) === plant.tileId;
    });
    return grew;
  }

  settleFlowers() {
    let moved = 0;
    // Bottom-up keeps flowers in the same column from replacing each other.
    for (let x = 0; x < this.width; x += 1) {
      for (let y = this.height - 2; y >= 0; y -= 1) {
        const tileId = this.get(x, y);
        if (!FALLING_FLOWERS.has(tileId)) continue;
        let destination = y;
        for (let below = y + 1; below < this.height; below += 1) {
          const next = this.get(x, below);
          if (isSolid(next) || FALLING_FLOWERS.has(next)) break;
          // Pass non-solid decorations without overwriting doors, seeds or lava.
          if (next === 0) destination = below;
        }
        if (destination === y) continue;
        this.set(x, y, 0);
        this.set(x, destination, tileId);
        for (const flower of this.naturalFlowers) {
          if (flower.x === x && flower.y === y) flower.y = destination;
        }
        moved += 1;
      }
    }
    return moved;
  }

  // Every hour a handful of flowers sprout on empty surface tiles. The cap only
  // applies to these wild flowers — flowers planted by players never count.
  updateFlowers(now = Date.now()) {
    // Run even between growth cycles to repair flowers in already-dug worlds.
    this.settleFlowers();
    if (now - this.flowerGrownAt < FLOWER_GROW_INTERVAL) return 0;
    this.flowerGrownAt = now;
    this.naturalFlowers = (this.naturalFlowers ?? []).filter((flower) => {
      const tileId = this.get(flower.x, flower.y);
      return tileId >= 40 && tileId <= 43;
    });
    const target = Math.min(FLOWERS_PER_GROWTH, MAX_FLOWERS - this.naturalFlowers.length);
    let grown = 0, attempts = 0;
    while (grown < target && attempts < 500) {
      attempts += 1;
      const x = 1 + Math.floor(Math.random() * (this.width - 2));
      let ground = 0;
      while (ground < this.height && !this.isSolid(x, ground)) ground += 1;
      const y = ground - 1;
      if (y >= 0 && this.get(x, y) === 0) { this.set(x, y, 40 + Math.floor(Math.random() * 4)); this.naturalFlowers.push({ x, y }); grown += 1; }
    }
    return grown;
  }

  serialize() {
    return {
      foreground: Array.from(this.foreground),
      background: Array.from(this.background),
      plantedTiles: this.plantedTiles,
      surface: Array.from(this.surface),
      flowerGrownAt: this.flowerGrownAt,
      naturalFlowers: this.naturalFlowers,
    };
  }

  static fromSave(data) {
    const world = new World();
    if (!Array.isArray(data.foreground) || data.foreground.length !== world.foreground.length) return null;
    world.foreground.set(data.foreground);
    if (Array.isArray(data.background) && data.background.length === world.background.length) world.background.set(data.background);
    if (Array.isArray(data.surface) && data.surface.length === world.surface.length) world.surface.set(data.surface);
    else world.rebuildSurface();
    world.plantedTiles = Array.isArray(data.plantedTiles) ? data.plantedTiles.filter((plant) => world.inBounds(plant.x, plant.y)) : [];
    world.flowerGrownAt = Number.isFinite(data.flowerGrownAt) ? data.flowerGrownAt : Date.now();
    world.naturalFlowers = Array.isArray(data.naturalFlowers) ? data.naturalFlowers.filter((flower) => world.inBounds(flower.x, flower.y)) : [];
    world.cleanupLegacyTiles();
    world.updatePlants();
    return world;
  }

  // Older saves kept faint background blocks behind the terrain and the retired
  // Sky Market tile; both are stripped whenever a world is loaded.
  cleanupLegacyTiles() {
    this.background.fill(0);
    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < this.height; y += 1) {
        const tileId = this.foreground[this.index(x, y)];
        if (tileId !== 0 && !TILE_DEFS[tileId]) this.foreground[this.index(x, y)] = 0;
      }
    }
  }

  rebuildSurface() {
    for (let x = 0; x < this.width; x += 1) {
      this.surface[x] = 1;
      for (let y = 0; y < this.height; y += 1) {
        if (this.get(x, y) !== 0) { this.surface[x] = y; break; }
      }
    }
  }
}

export function generateWorld() {
  const world = new World();
  for (let x = 0; x < world.width; x += 1) {
    const rolling = Math.sin(x * .19) * 1.7 + Math.sin(x * .067) * 3.4;
    const surface = Math.round(39 + rolling);
    world.surface[x] = surface;
    for (let y = 0; y < world.height; y += 1) {
      if (y >= world.height - 1) world.set(x, y, 3);
      else if (y >= world.height - 3) world.set(x, y, 5);
      else if (y >= surface + 5) world.set(x, y, 2);
      else if (y >= surface) world.set(x, y, 1);
    }
  }

  world.set(16, world.surface[16] - 1, 6);
  world.set(20, world.surface[20] - 1, 20);
  world.set(21, world.surface[21] - 1, 20);
  for (let x = 1; x < world.width - 1; x += 1) {
    const y = world.surface[x] - 1;
    if (Math.random() < .16 && world.get(x, y) === 0) world.set(x, y, 40 + Math.floor(Math.random() * 4));
  }
  let clayPlaced = 0, attempts = 0;
  while (clayPlaced < 60 && attempts < 5000) {
    attempts += 1;
    const x = 1 + Math.floor(Math.random() * (world.width - 2));
    const minY = world.surface[x] + 5;
    const y = minY + Math.floor(Math.random() * Math.max(1, world.height - 3 - minY));
    if (world.get(x, y) === 2) { world.set(x, y, 4); clayPlaced += 1; }
  }
  return world;
}

export function tileCenter(x, y) {
  return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
}
