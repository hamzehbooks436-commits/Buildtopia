import { PHYSICS, TILE_SIZE } from "./config.js";

export function createPlayer(x, y) {
  return { x, y, width: 22, height: TILE_SIZE, vx: 0, vy: 0, facing: 1, grounded: false, coyoteTime: 0, jumpBuffer: 0 };
}

function moveTowards(current, target, amount) {
  if (current < target) return Math.min(current + amount, target);
  return Math.max(current - amount, target);
}

function hasSolidAt(world, x, y) {
  return world.isSolid(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));
}

export function updatePlayer(player, world, input, delta) {
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  const acceleration = player.grounded ? PHYSICS.acceleration : PHYSICS.airAcceleration;
  player.vx = moveTowards(player.vx, direction * PHYSICS.runSpeed, acceleration * delta);
  if (!direction && player.grounded) player.vx = moveTowards(player.vx, 0, PHYSICS.acceleration * delta * 1.3);
  if (direction) player.facing = direction;

  // Remember early presses and allow a short grace period after leaving a ledge.
  player.coyoteTime = player.grounded ? PHYSICS.coyoteTime : Math.max(0, player.coyoteTime - delta);
  player.jumpBuffer = input.jumpPressed ? PHYSICS.jumpBufferTime : Math.max(0, player.jumpBuffer - delta);
  if ((player.jumpBuffer > 0 || input.jumpHeld) && (player.grounded || player.coyoteTime > 0)) {
    player.vy = -PHYSICS.jumpSpeed;
    player.grounded = false;
    player.coyoteTime = 0;
    player.jumpBuffer = 0;
  }
  player.vy = Math.min(player.vy + PHYSICS.gravity * delta, PHYSICS.maxFallSpeed);

  let nextX = player.x + player.vx * delta;
  if (player.vx > 0) {
    const probeX = nextX + player.width - 1;
    const top = Math.floor((player.y + 3) / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 3) / TILE_SIZE);
    for (let y = top; y <= bottom; y += 1) {
      if (hasSolidAt(world, probeX, y * TILE_SIZE + 2)) { nextX = Math.floor(probeX / TILE_SIZE) * TILE_SIZE - player.width; player.vx = 0; break; }
    }
  } else if (player.vx < 0) {
    const probeX = nextX;
    const top = Math.floor((player.y + 3) / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 3) / TILE_SIZE);
    for (let y = top; y <= bottom; y += 1) {
      if (hasSolidAt(world, probeX, y * TILE_SIZE + 2)) { nextX = (Math.floor(probeX / TILE_SIZE) + 1) * TILE_SIZE; player.vx = 0; break; }
    }
  }
  player.x = nextX;

  let nextY = player.y + player.vy * delta;
  player.grounded = false;
  if (player.vy > 0) {
    // Probe the feet so gravity cannot sink the player a pixel into the floor.
    const probeY = nextY + player.height;
    const left = Math.floor((player.x + 3) / TILE_SIZE);
    const right = Math.floor((player.x + player.width - 3) / TILE_SIZE);
    for (let x = left; x <= right; x += 1) {
      if (hasSolidAt(world, x * TILE_SIZE + 2, probeY)) { nextY = Math.floor(probeY / TILE_SIZE) * TILE_SIZE - player.height; player.vy = 0; player.grounded = true; break; }
    }
  } else if (player.vy < 0) {
    const probeY = nextY;
    const left = Math.floor((player.x + 3) / TILE_SIZE);
    const right = Math.floor((player.x + player.width - 3) / TILE_SIZE);
    for (let x = left; x <= right; x += 1) {
      if (hasSolidAt(world, x * TILE_SIZE + 2, probeY)) { nextY = (Math.floor(probeY / TILE_SIZE) + 1) * TILE_SIZE; player.vy = 0; break; }
    }
  }
  player.y = nextY;
}

export function playerOverlapsTile(player, tileX, tileY) {
  const x = tileX * TILE_SIZE;
  const y = tileY * TILE_SIZE;
  return player.x < x + TILE_SIZE && player.x + player.width > x && player.y < y + TILE_SIZE && player.y + player.height > y;
}
