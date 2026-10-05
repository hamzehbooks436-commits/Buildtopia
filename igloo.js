// Nine tiles wide, five tiles tall, with a two-tile-high doorway on the right.
export function iglooTiles(centerX, floorY) {
  const tiles = [];
  for (let dx = -4; dx <= 4; dx++) tiles.push({ x: centerX + dx, y: floorY, tileId: 68 });
  for (let dy = -5; dy < 0; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const roof = (dy === -5 && Math.abs(dx) <= 1) || (dy === -4 && Math.abs(dx) >= 2 && Math.abs(dx) <= 3);
      const wall = Math.abs(dx) === 4 && dy >= -3 && (dx < 0 || dy === -3);
      if (roof || wall) tiles.push({ x: centerX + dx, y: floorY + dy, tileId: 68 });
    }
  }
  return tiles;
}

export function canPlaceIgloo(world, centerX, floorY) {
  for (let y = floorY - 5; y <= floorY; y++) for (let x = centerX - 4; x <= centerX + 4; x++) {
    if (!world.inBounds(x, y)) return false;
    const tile = world.get(x, y);
    if (y < floorY ? tile !== 0 : ![0, 68, 66, 1, 55].includes(tile)) return false;
  }
  return true;
}

export function buildIgloo(world, centerX, floorY) {
  for (const tile of iglooTiles(centerX, floorY)) world.set(tile.x, tile.y, tile.tileId);
  addIglooBackground(world, centerX, floorY);
}

export function addIglooBackground(world, centerX, floorY) {
  for (let dy = -4; dy < 0; dy++) {
    const halfWidth = dy === -4 ? 1 : 3;
    for (let dx = -halfWidth; dx <= halfWidth; dx++) world.setBackground(centerX + dx, floorY + dy, 72);
  }
}

export function restoreIglooBackgrounds(world) {
  // Upgrade intact older igloos without altering terrain, interiors or inventory.
  for (let y = 5; y < world.height; y++) for (let x = 4; x < world.width - 4; x++) {
    if (world.get(x, y - 5) !== 68 || world.get(x, y - 1) !== 0 || world.get(x + 4, y - 1) !== 0) continue;
    if (iglooTiles(x, y).every(tile => world.get(tile.x, tile.y) === tile.tileId)) addIglooBackground(world, x, y);
  }
}
