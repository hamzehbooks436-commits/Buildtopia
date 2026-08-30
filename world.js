import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { TILE_DEFS, isSolid } from "./definitions.js";

export class World {
  constructor() {
    this.width = WORLD_WIDTH;
    this.height = WORLD_HEIGHT;
    this.foreground = new Int16Array(this.width * this.height);
    this.background = new Int16Array(this.width * this.height);
    this.plantedTiles = [];
    this.surface = new Int16Array(this.width);
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

  serialize() {
    return {
      foreground: Array.from(this.foreground),
      background: Array.from(this.background),
      plantedTiles: this.plantedTiles,
      surface: Array.from(this.surface),
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
    world.updatePlants();
    return world;
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
      else if (y >= surface + 5) world.set(x, y, 2);
      else if (y >= surface) world.set(x, y, 1);
      if (y >= surface - 10 && y < world.height - 1) world.setBackground(x, y, 2);
    }
  }

  const shopX = 27;
  const shopY = world.surface[shopX] - 1;
  world.set(shopX, shopY, 30);
  world.set(shopX, shopY - 1, 30);
  world.set(20, world.surface[20] - 1, 20);
  world.set(21, world.surface[21] - 1, 20);
  return world;
}

export function tileCenter(x, y) {
  return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
}
