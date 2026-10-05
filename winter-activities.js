import { TILE_SIZE } from './config.js';

export const SNOWBALL_LIFETIME = 3000;
export function createSnowball(player, owner, id, now, target = null) {
  const x = player.x + player.width / 2;
  const y = player.y + player.height * .4;
  let dx = target ? target.x - x : player.facing;
  let dy = target ? target.y - y : -.3;
  const length = Math.hypot(dx, dy) || 1;
  dx /= length; dy /= length;
  return { id, owner, x, y, vx: dx * 460, vy: dy * 460, at: now };
}

export class WinterActivities {
  constructor() {
    this.penguins = [];
    this.snowballs = [];
    this.splashes = [];
    this.seenShots = new Map();
    this.fallingIcicles = [];
    this.icicleRequests = new Set();
    this.icicleHits = new Set();
  }

  addSnowball(shot, now) {
    if (!shot || typeof shot.id !== 'string' || shot.id.length > 160 || typeof shot.owner !== 'string' || this.seenShots.has(shot.id)) return false;
    if (![shot.x, shot.y, shot.vx, shot.vy, shot.at].every(Number.isFinite) || Math.abs(shot.vx) > 500 || Math.abs(shot.vy) > 500 || now - shot.at > SNOWBALL_LIFETIME || shot.at > now + 1000) return false;
    this.seenShots.set(shot.id, shot.at);
    this.snowballs.push({ ...shot, currentX: shot.x, currentY: shot.y, elapsed: 0 });
    return true;
  }

  updateSnowballs(world, targets, now, onHit) {
    for (const [id, at] of this.seenShots) if (now - at > 10000) this.seenShots.delete(id);
    this.splashes = this.splashes.filter(splash => now - splash.at < 450);
    this.snowballs = this.snowballs.filter(shot => {
      const age = Math.max(0, Math.min(SNOWBALL_LIFETIME, now - shot.at)) / 1000;
      while (shot.elapsed < age) {
        shot.elapsed = Math.min(age, shot.elapsed + 1 / 120);
        shot.currentX = shot.x + shot.vx * shot.elapsed;
        shot.currentY = shot.y + shot.vy * shot.elapsed + 210 * shot.elapsed ** 2;
        const hitWall = world.isSolid(Math.floor(shot.currentX / TILE_SIZE), Math.floor(shot.currentY / TILE_SIZE));
        const victim = targets.find(target => target.uid !== shot.owner && shot.currentX + 5 > target.x && shot.currentX - 5 < target.x + target.width && shot.currentY + 5 > target.y && shot.currentY - 5 < target.y + target.height);
        if (hitWall || victim) {
          this.splashes.push({ x: shot.currentX, y: shot.currentY, at: now });
          if (victim) onHit?.(victim, shot);
          return false;
        }
      }
      return now - shot.at < SNOWBALL_LIFETIME;
    });
  }

  updatePenguins(world, delta) {
    const homes = world.penguinHomes ?? [];
    if (this.penguins.length !== homes.length) this.penguins = homes.map((home, index) => ({ homeX: home.x * TILE_SIZE, x: home.x * TILE_SIZE + 6, y: (home.y + 1) * TILE_SIZE - 24, width: 20, height: 24, direction: index % 2 ? -1 : 1, vy: 0, grounded: true }));
    for (const penguin of this.penguins) {
      const nextX = penguin.x + penguin.direction * 30 * delta;
      const probeX = penguin.direction > 0 ? nextX + penguin.width : nextX;
      const footRow = Math.floor((penguin.y + penguin.height + .1) / TILE_SIZE);
      const blocked = world.isSolid(Math.floor(probeX / TILE_SIZE), Math.floor((penguin.y + 2) / TILE_SIZE)) || world.isSolid(Math.floor(probeX / TILE_SIZE), Math.floor((penguin.y + penguin.height - 2) / TILE_SIZE));
      const ledge = penguin.grounded && !world.isSolid(Math.floor((nextX + penguin.width / 2) / TILE_SIZE), footRow);
      if (blocked || ledge || Math.abs(nextX - penguin.homeX) > TILE_SIZE * 4) penguin.direction *= -1;
      else penguin.x = nextX;
      penguin.vy = Math.min(500, penguin.vy + 1200 * delta);
      const nextY = penguin.y + penguin.vy * delta;
      penguin.grounded = false;
      const col = Math.floor((penguin.x + penguin.width / 2) / TILE_SIZE);
      let landed = false;
      for (let row = Math.floor((penguin.y + penguin.height) / TILE_SIZE); row <= Math.floor((nextY + penguin.height) / TILE_SIZE); row++) {
        if (world.isSolid(col, row)) { penguin.y = row * TILE_SIZE - penguin.height; penguin.vy = 0; penguin.grounded = true; landed = true; break; }
      }
      if (!landed) penguin.y = nextY;
    }
  }

  nearbyIcicles(world, player) {
    const candidates = [];
    const px = player.x + player.width / 2;
    for (let y = Math.max(1, Math.floor(player.y / TILE_SIZE) - 7); y <= Math.floor(player.y / TILE_SIZE); y++) {
      for (let x = Math.floor(px / TILE_SIZE) - 2; x <= Math.floor(px / TILE_SIZE) + 2; x++) {
        const key = `${x},${y}`;
        if (world.get(x, y) !== 71 || world.blockSettings[key]?.icicleFallAt || this.icicleRequests.has(key) || player.y < y * TILE_SIZE + 20 || Math.abs(px - (x * TILE_SIZE + 16)) >= 64) continue;
        let blocked = false;
        for (let row = y + 1; row < Math.floor(player.y / TILE_SIZE); row++) if (world.isSolid(x, row)) { blocked = true; break; }
        if (!blocked) candidates.push({ x, y, key });
      }
    }
    return candidates;
  }

  updateIcicles(world, player, now, onHit) {
    this.fallingIcicles = [];
    const finished = [];
    for (const [key, settings] of Object.entries(world.blockSettings)) {
      if (!Number.isFinite(settings?.icicleFallAt)) continue;
      const [x, y] = key.split(',').map(Number);
      if (!world.inBounds(x, y) || world.get(x, y) !== 71) continue;
      const age = Math.max(0, (now - settings.icicleFallAt) / 1000);
      const fallingTime = Math.max(0, age - .45);
      let top = y * TILE_SIZE + 600 * fallingTime ** 2;
      let hitFloor = false;
      for (let row = y + 1; row <= Math.floor((top + 28) / TILE_SIZE); row++) if (world.isSolid(x, row)) { top = row * TILE_SIZE - 28; hitFloor = true; break; }
      if (age > 4) { finished.push({ x, y, key }); continue; }
      const hitId = `${key}:${settings.icicleFallAt}`;
      // Sweep the vertical interval since the previous frame to avoid tunnelling.
      const previousTop = y * TILE_SIZE + 600 * Math.max(0, fallingTime - .04) ** 2;
      if (fallingTime > 0 && !this.icicleHits.has(hitId) && x * TILE_SIZE + 22 > player.x && x * TILE_SIZE + 10 < player.x + player.width && top + 28 > player.y && previousTop < player.y + player.height) {
        this.icicleHits.add(hitId);
        onHit?.();
      }
      if (hitFloor) { finished.push({ x, y, key }); continue; }
      this.fallingIcicles.push({ x: x * TILE_SIZE + (age < .45 ? Math.sin(age * 90) * 2 : 0), y: top, warning: age < .45 });
    }
    if (this.icicleHits.size > 200) this.icicleHits.clear();
    return finished;
  }
}
