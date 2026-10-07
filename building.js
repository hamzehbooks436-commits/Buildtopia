import { ITEM_DEFS, TILE_DEFS, spliceResult } from './definitions.js';
import { REACH, TILE_SIZE } from './config.js';
import { playerOverlapsTile } from './player.js';

export const BUILD_REACH = TILE_SIZE * 6.5;

// Used by both the placement preview and the drag brush.
export function placementCheck(world, player, itemId, target, allowed = true, buildMode = false) {
  const item = ITEM_DEFS[itemId];
  if (!item?.placesTile) return { ok: false, reason: 'Select a block or furniture from Inventory.' };
  if (!world.inBounds(target.x, target.y)) return { ok: false, reason: 'Outside the world.' };
  const distance = Math.hypot((target.x + .5) * TILE_SIZE - (player.x + player.width / 2), (target.y + .5) * TILE_SIZE - (player.y + player.height / 2));
  if (distance > (buildMode ? BUILD_REACH : REACH)) return { ok: false, reason: 'Move closer to build here.' };
  if (!allowed) return { ok: false, reason: 'Only the world lock owner can build here.' };
  if (world.isProtected(target.x, target.y)) return { ok: false, reason: 'The family house is protected.' };
  if (item.backgroundOnly) return world.getBackground(target.x, target.y) ? { ok: false, reason: 'Background already occupied.' } : { ok: true, reason: 'Place background wall.' };
  const tile = world.get(target.x, target.y), crafted = spliceResult(tile, item.placesTile);
  if (tile && !crafted) return { ok: false, reason: 'Space occupied. Build mode never replaces blocks.' };
  if (!crafted && TILE_DEFS[item.placesTile]?.solid && playerOverlapsTile(player, target.x, target.y)) return { ok: false, reason: 'Move out of this space first.' };
  if (item.placesTile === 71 && !world.isSolid(target.x, target.y - 1)) return { ok: false, reason: 'Icicles need a solid ceiling.' };
  return { ok: true, reason: crafted ? 'Splice these items.' : `Place ${item.name}.` };
}

export function strokeTiles(from, to) {
  const tiles = [];
  let x = from.x, y = from.y;
  const dx = Math.abs(to.x - x), dy = -Math.abs(to.y - y), sx = x < to.x ? 1 : -1, sy = y < to.y ? 1 : -1;
  let error = dx + dy;
  // A capped Bresenham line fills gaps between fast pointer movements.
  for (let i = 0; i < 128; i++) {
    tiles.push({ x, y });
    if (x === to.x && y === to.y) break;
    const twice = error * 2;
    if (twice >= dy) { error += dy; x += sx; }
    if (twice <= dx) { error += dx; y += sy; }
  }
  return tiles;
}
