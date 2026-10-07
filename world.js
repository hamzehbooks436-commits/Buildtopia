import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { TILE_DEFS, isSolid } from "./definitions.js";
import { buildIgloo, restoreIglooBackgrounds } from "./igloo.js";
import { buildAutumnWorld, updateAutumnResources } from "./autumn.js";
import { buildLegacyAutumnWorld } from "./autumn-legacy.js";
import { upgradeGhostSpawns, updateGhostSpawns } from "./ghosts.js";

const FLOWER_GROW_INTERVAL = 3600000;
const FLOWERS_PER_GROWTH = 5;
const MAX_FLOWERS = 20;
const FALLING_FLOWERS = new Set([21, 28, 29, 31, 32, 40, 41, 42, 43]);

export class World {
  constructor(width = WORLD_WIDTH) {
    this.width = width;
    this.height = WORLD_HEIGHT;
    this.foreground = new Int16Array(this.width * this.height);
    this.background = new Int16Array(this.width * this.height);
    this.plantedTiles = [];
    this.surface = new Int16Array(this.width);
    this.flowerGrownAt = Date.now();
    this.winterGrownAt = Date.now();
    this.naturalFlowers = [];
    this.worldType = "sky";
    this.blockSettings = {};
    this.penguinHomes = [];
    this.iglooBackgroundVersion = 1;
    this.normalResourcesVersion = 0;
    this.autumnGrownAt = Date.now();
    this.generatedPlaces = [];
    this.ghosts = {};
    this.ghostSpawnedAt = Date.now();
    this.ghostSequence = 0;
    this.ghostSpawnVersion = 2;
    this.autumnLayoutVersion = 2;
    this.familyHouse = null;
    this.familyNpcs = {};
  }

  index(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && x < this.width && y >= 0 && y < this.height; }
  get(x, y) { return this.inBounds(x, y) ? this.foreground[this.index(x, y)] : 3; }
  getBackground(x, y) { return this.inBounds(x, y) ? this.background[this.index(x, y)] : 0; }
  set(x, y, tileId) { if (this.inBounds(x, y)) this.foreground[this.index(x, y)] = tileId; }
  setBackground(x, y, tileId) { if (this.inBounds(x, y)) this.background[this.index(x, y)] = tileId; }
  isSolid(x, y) { return isSolid(this.get(x, y)); }
  isProtected(x, y) {
    const house = this.familyHouse;
    return !!house && x >= house.left && x <= house.right && y >= house.top && y <= house.bottom;
  }

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
        const autumnTree = this.worldType === "autumn" && definition.growsInto === 20;
        this.set(plant.x, plant.y, autumnTree ? 90 + (plant.x + plant.y) % 3 : definition.growsInto);
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
    if (["ice", "autumn"].includes(this.worldType)) return 0;
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

  updateWinterResources(now = Date.now(), snowmanRoll = Math.random()) {
    const hour = 3600000;
    if (this.worldType !== "ice" || now - this.winterGrownAt < hour) return 0;
    // Preserve the hourly schedule across saves; missed hours replenish once.
    this.winterGrownAt += Math.floor((now - this.winterGrownAt) / hour) * hour;
    const counts = { 69: 0, 70: 0, 73: 0 };
    for (const tile of this.foreground) if (tile in counts) counts[tile]++;
    const surfaceSpots = [], caveSpots = [];
    for (let x = 1; x < this.width - 1; x++) {
      for (let y = 1; y < this.height - 2; y++) {
        if (this.get(x, y) !== 0 || this.getBackground(x, y) !== 0) continue;
        const ground = this.get(x, y + 1);
        if ((ground === 66 || ground === 68) && y <= this.surface[x]) surfaceSpots.push({ x, y });
        else if (y > this.surface[x] + 5 && [2, 66, 68].includes(ground)) caveSpots.push({ x, y });
      }
    }
    const place = (tile, cap, spots, limit = cap) => {
      let grown = 0;
      while (counts[tile] < cap && grown < limit && spots.length) {
        const index = Math.floor(Math.random() * spots.length);
        const [{ x, y }] = spots.splice(index, 1);
        this.set(x, y, tile);
        counts[tile]++; grown++;
      }
      return grown;
    };
    // Reserve room for a successful snowman roll before replenishing pines.
    let grown = snowmanRoll < .5 ? place(73, 2, surfaceSpots, 1) : 0;
    grown += place(69, 12, surfaceSpots);
    grown += place(70, 9, caveSpots);
    return grown;
  }

  updateAutumnResources(now = Date.now()) { updateGhostSpawns(this, now); return updateAutumnResources(this, now); }

  serialize() {
    return {
      width: this.width,
      height: this.height,
      foreground: Array.from(this.foreground),
      background: Array.from(this.background),
      plantedTiles: this.plantedTiles,
      surface: Array.from(this.surface),
      flowerGrownAt: this.flowerGrownAt,
      winterGrownAt: this.winterGrownAt,
      naturalFlowers: this.naturalFlowers,
      worldType: this.worldType,
      blockSettings: this.blockSettings,
      penguinHomes: this.penguinHomes,
      iglooBackgroundVersion: this.iglooBackgroundVersion,
      normalResourcesVersion: this.normalResourcesVersion,
      autumnGrownAt: this.autumnGrownAt,
      generatedPlaces: this.generatedPlaces,
      ghosts: this.ghosts,
      ghostSpawnedAt: this.ghostSpawnedAt,
      ghostSequence: this.ghostSequence,
      ghostSpawnVersion: this.ghostSpawnVersion,
      autumnLayoutVersion: this.autumnLayoutVersion,
      familyHouse: this.familyHouse,
      familyNpcs: this.familyNpcs,
    };
  }

  static fromSave(data) {
    const world = new World();
    if (!Array.isArray(data?.foreground)) return null;
    const oldWidth = data.width ?? data.foreground.length / WORLD_HEIGHT;
    if (![128, WORLD_WIDTH].includes(oldWidth) || data.foreground.length !== oldWidth * WORLD_HEIGHT) return null;
    world.worldType = ["beach", "ice", "autumn"].includes(data.worldType) ? data.worldType : "sky";
    // Double the map without reinterpreting old row strides or losing builds.
    if (oldWidth < world.width) world.extendTerrain(oldWidth);
    for (let y = 0; y < world.height; y++) {
      world.foreground.set(data.foreground.slice(y * oldWidth, (y + 1) * oldWidth), y * world.width);
      if (Array.isArray(data.background) && data.background.length === data.foreground.length) world.background.set(data.background.slice(y * oldWidth, (y + 1) * oldWidth), y * world.width);
    }
    if (Array.isArray(data.surface) && data.surface.length === oldWidth) world.surface.set(data.surface);
    else world.rebuildSurface();
    world.plantedTiles = Array.isArray(data.plantedTiles) ? data.plantedTiles.filter((plant) => world.inBounds(plant.x, plant.y)) : [];
    world.flowerGrownAt = Number.isFinite(data.flowerGrownAt) ? data.flowerGrownAt : Date.now();
    world.winterGrownAt = Number.isFinite(data.winterGrownAt) ? data.winterGrownAt : Date.now();
    world.naturalFlowers = Array.isArray(data.naturalFlowers) ? data.naturalFlowers.filter((flower) => world.inBounds(flower.x, flower.y)) : [];
    world.worldType = ["beach", "ice", "autumn"].includes(data.worldType) ? data.worldType : "sky";
    world.autumnGrownAt = Number.isFinite(data.autumnGrownAt) ? data.autumnGrownAt : Date.now();
    world.generatedPlaces = Array.isArray(data.generatedPlaces) ? data.generatedPlaces.filter(place => world.inBounds(place.x, place.y) && typeof place.name === "string") : [];
    world.ghosts = Object.fromEntries(Object.entries(data.ghosts ?? {}).filter(([, ghost]) => ghost && Number.isInteger(ghost.x) && Number.isInteger(ghost.y) && world.inBounds(ghost.x, ghost.y)));
    world.ghostSpawnedAt = Number.isFinite(data.ghostSpawnedAt) ? data.ghostSpawnedAt : Date.now();
    world.ghostSequence = Number.isSafeInteger(data.ghostSequence) ? data.ghostSequence : 0;
    world.familyHouse = data.familyHouse ?? world.familyHouse;
    world.familyNpcs = data.familyNpcs ?? world.familyNpcs;
    if (world.worldType === "autumn" && data.autumnLayoutVersion !== 2) world.upgradeAutumnLayout(oldWidth);
    upgradeGhostSpawns(world, data.ghostSpawnVersion);
    world.blockSettings = data.blockSettings && typeof data.blockSettings === "object" ? data.blockSettings : {};
    world.penguinHomes = Array.isArray(data.penguinHomes) ? data.penguinHomes.filter((home) => Number.isInteger(home.x) && Number.isInteger(home.y) && world.inBounds(home.x, home.y)).map(({ x, y }) => ({ x, y })) : [];
    world.cleanupLegacyTiles();
    world.normalResourcesVersion = data.normalResourcesVersion === 1 ? 1 : 0;
    world.addNormalResources();
    if (!data.iglooBackgroundVersion) restoreIglooBackgrounds(world);
    world.updatePlants();
    return world;
  }

  extendTerrain(startX) {
    if (this.worldType === "autumn") {
      const extension = buildAutumnWorld(new World());
      for (let x = startX; x < this.width; x++) {
        this.surface[x] = extension.surface[x];
        for (let y = 0; y < this.height; y++) {
          this.set(x, y, extension.get(x, y)); this.setBackground(x, y, extension.getBackground(x, y));
        }
      }
      this.familyHouse = extension.familyHouse; this.familyNpcs = extension.familyNpcs;
      return;
    }
    for (let x = startX; x < this.width; x++) {
      const beach = this.worldType === "beach", ice = this.worldType === "ice";
      const floor = beach ? 49 : ice ? 39 : Math.round(39 + Math.sin(x * .19) * 1.7 + Math.sin(x * .067) * 3.4);
      this.surface[x] = floor;
      for (let y = 0; y < this.height; y++) {
        if (y === this.height - 1) this.set(x, y, 3);
        else if (y >= floor + 5) this.set(x, y, 2);
        else if (y >= floor) this.set(x, y, beach ? 55 : ice ? 68 : 1);
        else if (beach && y >= 41) this.set(x, y, 61);
      }
    }
  }

  upgradeAutumnLayout(oldWidth) {
    const old = new World(128); old.autumnGrownAt = this.autumnGrownAt;
    buildLegacyAutumnWorld(old);
    const fresh = buildAutumnWorld(new World());
    // Move only untouched generated tiles. Player builds, harvested resources,
    // planted crops, mined holes and edited backgrounds keep their coordinates.
    for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
      if (x >= oldWidth || (x < old.width && this.get(x, y) === old.get(x, y))) this.set(x, y, fresh.get(x, y));
      if (x >= oldWidth || (x < old.width && this.getBackground(x, y) === old.getBackground(x, y))) this.setBackground(x, y, fresh.getBackground(x, y));
    }
    this.surface.set(fresh.surface);
    this.generatedPlaces = []; this.familyHouse = fresh.familyHouse; this.familyNpcs = fresh.familyNpcs;
    this.autumnLayoutVersion = 2;
  }

  // Preserve registered background walls; strip retired terrain backgrounds.
  cleanupLegacyTiles() {
    for (let index = 0; index < this.background.length; index++) if (!TILE_DEFS[this.background[index]]?.backgroundOnly) this.background[index] = 0;
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

  // One-time addition also supports saved normal worlds without refilling mined
  // coal. Stable coordinate scores keep Firebase transaction retries consistent.
  addNormalResources() {
    if (this.worldType !== "sky" || this.normalResourcesVersion === 1) return;
    this.normalResourcesVersion = 1;
    const candidates = [];
    let coal = 0;
    for (let x = 1; x < this.width - 1; x++) {
      for (let y = this.surface[x] + 5; y < this.height - 3; y++) {
        if (this.get(x, y) === 74) coal++;
        if (this.get(x, y) === 2) {
          const index = this.index(x, y);
          const score = Math.imul(index ^ 0x45d9f3b, 0x45d9f3b) >>> 0;
          candidates.push({ x, y, score });
        }
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    for (const { x, y } of candidates.slice(0, Math.max(0, 40 - coal))) this.set(x, y, 74);
    for (let x = 8; x < this.width - 1; x += 14) {
      const y = this.surface[x] - 1;
      if (this.get(x, y) === 0 && this.isSolid(x, y + 1)) this.set(x, y, 20);
    }
  }
}

function generateBeachWorld() {
  const world = new World();
  world.worldType = "beach";
  const waterline = 41;
  for (let x = 0; x < world.width; x += 1) {
    const shoreDrop = x < 72 ? 0 : Math.min(10, Math.floor((x - 72) / 5));
    const ripple = Math.round(Math.sin(x * .16) * 1.2);
    const surface = Math.max(37, 39 + ripple + shoreDrop);
    world.surface[x] = surface;
    for (let y = 0; y < world.height; y += 1) {
      if (y >= world.height - 1) world.set(x, y, 3);
      else if (y >= surface + 5) world.set(x, y, 2);
      else if (y >= surface) world.set(x, y, 55);
      else if (x >= 72 && y >= waterline) world.set(x, y, 61);
    }
  }
  world.set(16, world.surface[16] - 1, 6);
  let palms = 0;
  for (let x = 24; x < 68; x += 8 + Math.floor(Math.random() * 5)) {
    const y = world.surface[x] - 1;
    world.set(x, y, 62);
    if (world.get(x + 1, y) === 0 && (palms === 0 || Math.random() < .7)) world.set(x + 1, y, 63);
    palms += 1;
  }
  return world;
}

function generateIceWorld() {
  const world = new World();
  world.worldType = "ice";
  for (let x = 0; x < world.width; x += 1) {
    const frozenLake = x >= 72 && x <= 113;
    const spawnArea = x >= 12 && x <= 22;
    const surface = frozenLake || spawnArea ? 39 : Math.round(39 + Math.sin(x * .13) * 2 + Math.sin(x * .045));
    world.surface[x] = surface;
    for (let y = surface; y < world.height; y += 1) {
      if (y === world.height - 1) world.set(x, y, 3);
      else if (frozenLake && y < surface + 4) world.set(x, y, 66);
      else if (y < surface + 5) world.set(x, y, 68);
      else world.set(x, y, 2);
    }
  }
  world.set(16, world.surface[16] - 1, 6);
  for (const center of [32, 120]) {
    const floor = world.surface[center];
    for (let x = center - 4; x <= center + 4; x++) {
      world.surface[x] = floor;
      for (let y = floor - 5; y <= floor + 1; y++) world.set(x, y, y >= floor ? 68 : 0);
    }
    buildIgloo(world, center, floor);
  }
  for (const x of [6, 27, 48, 60, 125]) world.set(x, world.surface[x] - 1, 69);
  // Connected underground rooms, with a ladder shaft away from the frozen lake.
  for (const room of [{ x: 52, y: 52, rx: 13, ry: 5 }, { x: 99, y: 55, rx: 14, ry: 5 }]) {
    for (let y = room.y - room.ry; y <= room.y + room.ry; y++) for (let x = room.x - room.rx; x <= room.x + room.rx; x++) {
      if (((x - room.x) / room.rx) ** 2 + ((y - room.y) / room.ry) ** 2 < 1) world.set(x, y, 0);
    }
  }
  for (let x = 52; x <= 100; x++) for (let y = 53; y <= 55; y++) world.set(x, y, 0);
  for (let y = world.surface[66] - 1; y <= 55; y++) { world.set(66, y, 59); world.set(67, y, 0); }
  for (const x of [43, 49, 57, 61, 88, 94, 102, 108]) {
    let floor = 52;
    while (!world.isSolid(x, floor) && floor < 65) floor++;
    if (world.get(x, floor - 1) === 0) world.set(x, floor - 1, 70);
  }
  for (const x of [46, 55, 91, 99, 106]) {
    for (let y = 45; y < 57; y++) {
      if (world.isSolid(x, y - 1) && world.get(x, y) === 0 && world.get(x, y + 1) === 0) { world.set(x, y, 71); break; }
    }
  }
  world.penguinHomes = [78, 87, 101, 110].map((x) => ({ x, y: world.surface[x] - 1 }));
  return world;
}

export function generateWorld(worldName = "") {
  if (/^(autumn|fall)/i.test(String(worldName))) return buildAutumnWorld(new World());
  if (/^(ice|snow)/i.test(String(worldName))) return generateIceWorld();
  if (String(worldName).toLowerCase().startsWith("beach")) return generateBeachWorld();
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
  world.addNormalResources();
  return world;
}

export function tileCenter(x, y) {
  return { x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 };
}
