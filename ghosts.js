import { REACH, TILE_SIZE } from "./config.js";

export const GHOST_COLORS = ["#dcfff4", "#e8dcff", "#fff1cc"];
export const GHOST_NAMES = ["Wisp", "Boo", "Ember"];
export const GHOST_SPAWN_INTERVAL = 3600000;
export const MAX_WILD_GHOSTS = 2;

export function upgradeGhostSpawns(world, version) {
  world.ghostSpawnVersion = 2;
  if (world.worldType !== "autumn" || version === 2) return;
  let kept = 0;
  // Preserve capture receipts and owned pets; thin only uncaught legacy ghosts.
  world.ghosts = Object.fromEntries(Object.entries(world.ghosts).filter(([, ghost]) => ghost.caughtBy || kept++ < 1));
}

export function updateGhostSpawns(world, now = Date.now()) {
  if (world.worldType !== "autumn" || now - world.ghostSpawnedAt < GHOST_SPAWN_INTERVAL) return 0;
  world.ghostSpawnedAt += Math.floor((now - world.ghostSpawnedAt) / GHOST_SPAWN_INTERVAL) * GHOST_SPAWN_INTERVAL;
  if (Object.values(world.ghosts).filter(ghost => !ghost.caughtBy).length >= MAX_WILD_GHOSTS) return 0;
  const epoch = Math.floor(world.ghostSpawnedAt / GHOST_SPAWN_INTERVAL);
  for (let i = 0; i < world.width - 4; i++) {
    const x = 2 + (epoch * 31 + world.ghostSequence * 47 + i) % (world.width - 4);
    const y = world.surface[x] - 2;
    if (y < 1 || world.isProtected(x, y) || world.get(x, y) || world.getBackground(x, y) || !world.isSolid(x, y + 2)) continue;
    const sequence = ++world.ghostSequence;
    world.ghosts[`hour-${epoch}-${sequence}`] = { x, y, variant: sequence % 3 };
    return 1;
  }
  return 0;
}

export function ghostPosition(ghost, now = Date.now()) {
  const phase = ghost.x * .7 + ghost.y * .2;
  return { x: (ghost.x + .5) * TILE_SIZE + Math.sin(now / 2400 + phase) * TILE_SIZE * 1.25,
    y: (ghost.y + .5) * TILE_SIZE + Math.sin(now / 1100 + phase) * 9, variant: ghost.variant ?? 0 };
}

export function findGhost(world, player, point = null, now = Date.now()) {
  const center = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
  const candidates = Object.entries(world.ghosts ?? {}).filter(([, ghost]) => !ghost.caughtBy).map(([id, ghost]) => {
    const position = ghostPosition(ghost, now);
    return { id, ghost, position, distance: Math.hypot(center.x - position.x, center.y - position.y) };
  }).filter(entry => entry.distance <= REACH && (!point || Math.hypot(point.x - entry.position.x, point.y - entry.position.y) <= TILE_SIZE * .85));
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] ?? null;
}

export function claimGhost(world, id, uid, now = Date.now()) {
  const ghost = world.ghosts?.[id];
  if (!ghost || ghost.caughtBy || !uid) return false;
  world.ghosts[id] = { ...ghost, caughtBy: uid, caughtAt: now };
  return true;
}

export function petState(saved = {}) {
  const ghostPets = {};
  for (const [id, pet] of Object.entries(saved.ghostPets ?? {})) {
    if (!pet || !/^[a-zA-Z0-9_~:-]{1,100}$/.test(id) || !Number.isFinite(pet.caughtAt)) continue;
    const variant = Number.isInteger(pet.variant) && pet.variant >= 0 && pet.variant < 3 ? pet.variant : 0;
    ghostPets[id] = { name: GHOST_NAMES[variant], variant, caughtAt: pet.caughtAt };
  }
  return { ghostPets, equippedGhost: Object.hasOwn(ghostPets, saved.equippedGhost) ? saved.equippedGhost : null };
}

export function keepCaughtGhost(saved, worldKey, id, ghost, uid) {
  if (ghost?.caughtBy !== uid) throw new Error("That ghost has not been caught by you.");
  const state = petState(saved), petId = `${worldKey}~${id}`;
  if (!Object.hasOwn(state.ghostPets, petId)) {
    const variant = ghost.variant ?? 0;
    state.ghostPets[petId] = { name: GHOST_NAMES[variant], variant, caughtAt: ghost.caughtAt };
    state.equippedGhost = petId;
  }
  return { ...saved, ...state };
}

export function followGhost(pet, player, previous, delta, now = Date.now()) {
  if (!pet) return null;
  const target = { x: player.x + player.width / 2 - (player.facing || 1) * 38,
    y: player.y + 5 + Math.sin(now / 750) * 5 };
  if (!previous || Math.hypot(previous.x - target.x, previous.y - target.y) > TILE_SIZE * 12) return { ...target, variant: pet.variant };
  const amount = Math.min(1, delta * 5);
  return { x: previous.x + (target.x - previous.x) * amount, y: previous.y + (target.y - previous.y) * amount, variant: pet.variant };
}

export function drawGhost(ctx, ghost, camera, pet = false) {
  const x = Math.round(ghost.x - camera.x), y = Math.round(ghost.y - camera.y);
  ctx.save();
  ctx.translate(x - 12, y - 14);
  ctx.globalAlpha = pet ? .93 : .8;
  ctx.shadowColor = GHOST_COLORS[ghost.variant ?? 0]; ctx.shadowBlur = pet ? 7 : 12;
  ctx.fillStyle = GHOST_COLORS[ghost.variant ?? 0];
  ctx.fillRect(6, 0, 12, 3); ctx.fillRect(3, 3, 18, 3); ctx.fillRect(0, 6, 24, 15);
  for (let foot = 0; foot < 4; foot++) ctx.fillRect(foot * 6, 21, 3, 4);
  ctx.shadowBlur = 0; ctx.fillStyle = "#36475b";
  ctx.fillRect(6, 9, 3, 5); ctx.fillRect(15, 9, 3, 5); ctx.fillRect(10, 17, 4, 2);
  ctx.fillStyle = "#e8afbf"; ctx.fillRect(3, 15, 4, 2); ctx.fillRect(17, 15, 4, 2);
  if (pet) { ctx.fillStyle = "#f3bb4e"; ctx.fillRect(9, 23, 6, 2); }
  ctx.restore();
}

export function drawWildGhosts(ctx, world, camera, now = Date.now()) {
  for (const ghost of Object.values(world.ghosts ?? {})) if (!ghost.caughtBy) drawGhost(ctx, ghostPosition(ghost, now), camera);
}
