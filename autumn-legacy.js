// Used only to recognise untouched tiles while upgrading older autumn saves.
import { replenishAutumnLeaves } from "./autumn.js";

export function buildLegacyAutumnWorld(world) {
  world.worldType = "autumn";
  for (let x = 0; x < world.width; x++) {
    const floor = Math.round(39 + Math.sin(x * .12) * 1.5 + Math.sin(x * .037));
    world.surface[x] = floor;
    for (let y = floor; y < world.height; y++) world.set(x, y, y === world.height - 1 ? 3 : y < floor + 5 ? 89 : 2);
  }
  const level = (start, end, floor) => {
    for (let x = start; x <= end; x++) {
      const previous = world.surface[x];
      world.surface[x] = floor;
      for (let y = Math.min(previous, floor) - 6; y <= Math.max(previous, floor) + 5; y++) world.set(x, y, y < floor ? 0 : y < floor + 5 ? 89 : 2);
    }
  };
  const house = (start, floor, abandoned) => {
    const end = start + 8;
    level(start - 1, end + 1, floor);
    for (let x = start; x <= end; x++) {
      world.set(x, floor, 56);
      if (!abandoned || ![start + 2, start + 5].includes(x)) world.set(x, floor - 4, 95);
      for (let y = floor - 3; y < floor; y++) {
        world.setBackground(x, y, 88);
        if (x === start || (x === end && y === floor - 3)) world.set(x, y, 56);
      }
    }
    for (let x = start + 2; x <= end - 2; x++) if (!abandoned || x !== start + 4) world.set(x, floor - 5, 95);
    world.set(start + 2, floor - 3, 57);
    world.set(start + 5, floor - 3, 57);
    if (abandoned) { world.set(start, floor - 2, 0); world.set(start + 3, floor - 1, 97); }
    else { world.set(start + 1, floor - 1, 96); world.set(start + 5, floor - 1, 93); }
    // Two tiles of open doorway on the right; background walls never collide.
    world.generatedPlaces.push({ name: abandoned ? "Abandoned Cabin" : "Harvest Cottage", x: start + 4, y: floor - 6 });
  };
  level(12, 20, 39);
  world.set(16, 38, 6);
  house(3, 39, true);
  house(26, 39, true);
  level(43, 59, 40);
  for (let x = 45; x <= 57; x += 2) world.set(x, 39, 81);
  world.set(43, 39, 94); world.set(59, 39, 94);
  world.set(44, 39, 93);
  world.generatedPlaces.push({ name: "Pumpkin Patch", x: 51, y: 37 });
  for (const [start, end] of [[65, 75], [80, 86]]) {
    level(start - 1, end + 1, 39);
    for (let x = start; x <= end; x++) {
      const depth = Math.min(3, x - start + 1, end - x + 1);
      world.surface[x] = 39 + depth;
      for (let y = 39; y < 39 + depth; y++) world.set(x, y, 61);
    }
    world.set(start - 1, 38, 97);
    world.generatedPlaces.push({ name: "Forest Pond", x: Math.floor((start + end) / 2), y: 36 });
  }
  level(93, 123, 39);
  house(94, 39, false); house(113, 39, false);
  // Open harvest stall and a small square, deliberately left without NPCs.
  for (let x = 105; x <= 110; x++) world.set(x, 35, 95);
  world.set(105, 36, 56); world.set(110, 36, 56);
  for (const x of [105, 108, 110]) world.set(x, 38, 96);
  world.set(106, 38, 81); world.set(109, 38, 93);
  world.set(93, 38, 94); world.set(123, 38, 94);
  world.generatedPlaces.push({ name: "Harvest Village", x: 108, y: 33 });
  const treeXs = [1, 13, 22, 24, 36, 38, 41, 61, 63, 77, 88, 90, 92, 124, 126];
  treeXs.forEach((x, i) => {
    const y = world.surface[x] - 1;
    if (!world.get(x, y)) world.set(x, y, 90 + i % 3);
  });
  // A few loose pumpkins can also be found away from the main patch.
  for (const x of [21, 40, 60, 91]) if (!world.get(x, world.surface[x] - 1)) world.set(x, world.surface[x] - 1, 81);
  world.ghosts = Object.fromEntries([
    ["cabin-west", 7, 37, 0], ["cabin-east", 30, 37, 1],
    ["patch", 52, 37, 2], ["pond", 70, 36, 0], ["village", 108, 36, 1],
  ].map(([id, x, y, variant]) => [id, { x, y, variant }]));
  replenishAutumnLeaves(world);
  return world;
}

