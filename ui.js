import { CLOTHING_OFFERS, wardrobeState } from "./wardrobe.js";
import { drawNpcClothes, NPC_OUTFIT_GROUPS } from "./npc-outfits.js";
import { HOTBAR_SIZE, TILE_SIZE } from "./config.js";
import { ITEM_DEFS, SHOP_ITEMS, SHOP_SECTIONS, TILE_DEFS } from "./definitions.js";
import { countItem } from "./inventory.js";
import { drawFurniture } from "./furniture.js";
import { winterWeather } from "./winter.js";
import { autumnWeather } from "./autumn.js";
import { drawGhost, petState } from "./ghosts.js";

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.closePath();
}

function drawSprite(ctx, image, sprite, x, y, size) {
  if (!image || !sprite) return;
  const [sourceX, sourceY, sourceW, sourceH] = sprite;
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, size, size);
}

export function drawItemIcon(ctx, assets, itemId, x, y, size) {
  const item = ITEM_DEFS[itemId];
  if (!item) return;
  ctx.fillStyle = item.color;
  roundedRect(ctx, x, y, size, size, Math.max(3, size * .18));
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 1;
  if (!drawFurniture(ctx, item.furnitureId, x + size * .08, y + size * .08, size * .84)) drawSprite(ctx, assets.tiles, item.sprite, x + size * .13, y + size * .13, size * .74);
  ctx.restore();
}

export function drawSky(ctx, assets, camera, width, height, worldType = "sky") {
  if (worldType === "autumn") { drawAutumnSky(ctx, camera, width, height); return; }
  if (worldType === "ice") { drawWinterSky(ctx, assets, camera, width, height); return; }
  const image = worldType === "beach" ? assets.sunsetSky : assets.sky;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offset = -((camera.x * .06) % drawWidth);
  ctx.drawImage(image, offset, 0, drawWidth, drawHeight);
  ctx.drawImage(image, offset + drawWidth, 0, drawWidth, drawHeight);
  ctx.fillStyle = "rgba(5, 91, 121, .1)";
  ctx.fillRect(0, 0, width, height);
}

function drawAutumnSky(ctx, camera, width, height) {
  const now = Date.now();
  const weather = autumnWeather(now);
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, weather.sky[0]); sky.addColorStop(.55, weather.sky[1]); sky.addColorStop(1, weather.sky[2]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  const seconds = now / 1000;
  if (weather.nightAmount > 0) {
    ctx.globalAlpha = weather.nightAmount * .7;
    ctx.fillStyle = "#e8e2ce";
    for (let i = 0; i < 42; i++) {
      const x = ((i * 173 + 41) % 997) / 997 * width;
      const y = ((i * 97 + 23) % 389) / 389 * height * .55;
      ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }
    ctx.beginPath(); ctx.arc(width * .78, height * .19, Math.max(10, Math.min(width, height) * .032), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = weather.clouds[layer];
    ctx.globalAlpha = 1 - weather.nightAmount * .2;
    const span = 340 + layer * 110;
    const drift = (seconds * (3 + layer) - camera.x * .04) % span;
    for (let i = -2; i < Math.ceil(width / span) + 2; i++) {
      const x = i * span + drift, y = height * (.08 + layer * .12) + Math.sin(i * 2 + layer) * 18;
      ctx.beginPath(); ctx.ellipse(x + span / 2, y + 22, span * .68, height * .13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + span * .35, y - 6, span * .25, height * .09, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = weather.hills[layer];
    ctx.beginPath(); ctx.moveTo(0, height);
    for (let x = 0; x <= width + 40; x += 40) ctx.lineTo(x, height * (.81 + layer * .12) + Math.sin((x + camera.x * .12) / 120 + layer) * 24);
    ctx.lineTo(width, height); ctx.fill();
  }
  ctx.restore();
}

export function drawAutumnAtmosphere(ctx, world, camera, width, height) {
  if (world.worldType !== "autumn") return;
  ctx.save();
  const now = Date.now() / 1000;
  const nightAmount = autumnWeather(now * 1000).nightAmount;
  for (let i = 0; i < 24; i++) {
    const x = ((i * 173 + now * (10 + i % 4) - camera.x * .35) % (width + 40) + width + 40) % (width + 40) - 20;
    const y = ((i * 97 + now * (14 + i % 7) - camera.y * .12) % (height + 30) + height + 30) % (height + 30) - 15;
    ctx.fillStyle = ["#efbb59", "#d77543", "#b74e43"][i % 3];
    ctx.globalAlpha = .6 - nightAmount * .25;
    ctx.fillRect(x + Math.sin(now + i) * 15, y, i % 2 ? 5 : 3, 2);
  }
  ctx.restore();
}

function drawWinterSky(ctx, assets, camera, width, height) {
  const now = Date.now();
  const weather = winterWeather(now);
  const paintSky = (image) => {
    const scale = Math.max(width / image.width, height / image.height);
    ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
  };
  ctx.save();
  paintSky(assets.winterDaySky);
  if (weather.nightAmount > 0) {
    ctx.globalAlpha = weather.nightAmount;
    paintSky(assets.winterNightSky);
    drawAurora(ctx, width, height, weather, now);
  }
  ctx.globalAlpha = .1;
  ctx.fillStyle = "#b4d8e9";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawAurora(ctx, width, height, weather, now) {
  const seconds = now / 1000;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  // Two independent curtains: bright folded lower edges and rays fading upward.
  // Cap the ray count so large displays do not multiply the drawing cost.
  const step = Math.max(2, width / 260);
  for (let curtain = 0; curtain < 2; curtain++) {
    const drift = seconds * .075 + curtain * 2.7;
    const hue = weather.colors[curtain];
    const topHue = weather.colors[(curtain + 2) % 3];
    const edge = (u) => height * (.32 + curtain * .09
      + Math.sin(u * 6.2 + drift) * .042
      + Math.sin(u * 14 - drift * .6) * .022
      + Math.sin(u * 27 + drift * 1.2) * .009);
    // Soft bloom follows the curtain instead of filling a flat band.
    ctx.beginPath();
    for (let x = -step; x <= width + step; x += step) {
      const y = edge(x / width);
      if (x === -step) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsla(${hue}, 85%, 65%, .15)`;
    ctx.globalAlpha = weather.nightAmount * .75;
    ctx.lineWidth = height * .028;
    ctx.shadowColor = `hsl(${hue}, 90%, 60%)`;
    ctx.shadowBlur = height * .045;
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (let x = 0; x < width; x += step) {
      const u = x / width;
      const base = edge(u);
      const envelope = Math.pow(Math.max(0, Math.sin(u * Math.PI)), .6);
      const fold = .5 + .5 * Math.sin(u * 39 + drift * 1.8 + Math.sin(u * 12 - drift));
      const filament = .5 + .5 * Math.sin(u * 191 - seconds * .13 + curtain);
      const length = height * (.13 + .09 * fold + .025 * Math.sin(u * 17 + drift));
      const gradient = ctx.createLinearGradient(x, base - length, x, base + height * .009);
      gradient.addColorStop(0, `hsla(${topHue}, 80%, 70%, 0)`);
      gradient.addColorStop(.23, `hsla(${topHue}, 80%, 70%, .06)`);
      gradient.addColorStop(.65, `hsla(${hue}, 90%, 66%, .22)`);
      gradient.addColorStop(.94, `hsla(${hue}, 90%, 72%, .62)`);
      gradient.addColorStop(1, `hsla(${hue}, 90%, 65%, 0)`);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = weather.nightAmount * envelope * (.2 + fold * .5) * (.45 + filament * .55) * (.8 + .2 * Math.sin(seconds * .2 + curtain));
      ctx.fillRect(x, base - length, step * .86, length + height * .009);
    }
  }
  ctx.restore();
}

export function drawWinterSnow(ctx, camera, width, height) {
  const now = Date.now();
  const { snowIntensity } = winterWeather(now);
  if (!snowIntensity) return;
  ctx.save();
  ctx.fillStyle = "#fff";
  const seconds = now / 1000;
  const wrap = (value, length) => ((value % length) + length) % length;
  const count = Math.ceil(width * height / 8500);
  for (let i = 0; i < count; i++) {
    const depth = .45 + (i % 4) * .15;
    const x = wrap(i * 137 + seconds * (7 + depth * 9) + Math.sin(seconds * .5 + i) * 14 - camera.x * depth * .08, width + 10) - 5;
    const y = wrap(i * 83 + seconds * (18 + depth * 25) - camera.y * depth * .08, height + 10) - 5;
    ctx.globalAlpha = snowIntensity * depth;
    ctx.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
  }
  ctx.restore();
}

export function drawTile(ctx, assets, tileId, x, y, size = TILE_SIZE, background = false, bounceAge = -1) {
  const definition = TILE_DEFS[tileId];
  if (!definition || tileId === 0) return;
  ctx.save();
  if (background) ctx.globalAlpha = definition.backgroundOnly ? .9 : .19;
  ctx.imageSmoothingEnabled = false;
  if (definition.furnitureId) { drawFurniture(ctx, definition.furnitureId, x, y, size); ctx.restore(); return; }
  if (definition.glow) {
    const pulse = .8 + Math.sin(Date.now() / 750 + x / 50) * .2;
    const glow = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size * 2.5);
    glow.addColorStop(0, `rgba(158,175,255,${.38 * pulse})`);
    glow.addColorStop(1, "rgba(138,166,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - size * 2, y - size * 2, size * 5, size * 5);
  }
  if (definition.bounce && bounceAge >= 0 && bounceAge < .6 && assets.tiles) {
    // Split the existing sprite: the base stays planted while the spring and cap move.
    const [sx, sy, sw] = definition.sprite;
    const unit = size / 20;
    const compression = bounceAge < .07
      ? .48 * Math.sin(bounceAge / .07 * Math.PI / 2)
      : .48 * Math.exp(-9 * (bounceAge - .07)) * Math.cos(30 * (bounceAge - .07));
    const springHeight = 12 * unit * (1 - compression);
    const springBottom = y + 16 * unit;
    const springTop = springBottom - springHeight;
    ctx.drawImage(assets.tiles, sx, sy + 16, sw, 4, x, springBottom, size, 4 * unit);
    ctx.drawImage(assets.tiles, sx, sy + 4, sw, 12, x, springTop, size, springHeight);
    ctx.drawImage(assets.tiles, sx, sy, sw, 4, x, springTop - 4 * unit, size, 4 * unit);
  } else drawSprite(ctx, assets.tiles, definition.sprite, x, y, size);
  ctx.restore();
}

export function drawWorldLighting(ctx, world, camera, viewWidth, viewHeight) {
  const nightDarkness = world.worldType === "autumn" ? autumnWeather().nightAmount * .42 : 0;
  const left = Math.max(0, Math.floor(camera.x / TILE_SIZE));
  const top = Math.max(0, Math.floor(camera.y / TILE_SIZE));
  const right = Math.min(world.width, Math.ceil((camera.x + viewWidth) / TILE_SIZE));
  const bottom = Math.min(world.height, Math.ceil((camera.y + viewHeight) / TILE_SIZE));
  const lights = [];
  // Include nearby off-screen torches so light stays continuous while scrolling.
  for (let y = Math.max(0, top - 5); y < Math.min(world.height, bottom + 5); y++) {
    for (let x = Math.max(0, left - 5); x < Math.min(world.width, right + 5); x++) {
      const radius = TILE_DEFS[world.get(x, y)]?.lightRadius;
      if (radius) lights.push({ x, y, radius });
    }
  }
  ctx.save();
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    const depth = y - world.surface[x];
    const undergroundDarkness = Math.max(0, Math.min(.72, depth * .085));
    const darkness = nightDarkness ? 1 - (1 - undergroundDarkness) * (1 - nightDarkness) : undergroundDarkness;
    if (!darkness) continue;
    let illumination = 0;
    for (const light of lights) illumination = Math.max(illumination, Math.max(0, 1 - Math.hypot(x - light.x, y - light.y) / light.radius));
    ctx.fillStyle = `rgba(8, 16, 30, ${darkness * (1 - illumination)})`;
    ctx.fillRect(x * TILE_SIZE - camera.x, y * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
  }
  ctx.globalCompositeOperation = "screen";
  for (const light of lights) {
    const x = (light.x + .5) * TILE_SIZE - camera.x;
    const y = (light.y + .3) * TILE_SIZE - camera.y;
    const radius = light.radius * TILE_SIZE;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, "rgba(255, 204, 89, .34)");
    glow.addColorStop(.35, "rgba(255, 163, 60, .12)");
    glow.addColorStop(1, "rgba(255, 163, 60, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

export function drawWinterActivities(ctx, assets, activities, camera) {
  const now = Date.now();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const penguin of activities.penguins) {
    const bob = penguin.grounded ? Math.sin(now / 130 + penguin.homeX) * 1.2 : 0;
    ctx.save();
    ctx.translate(penguin.x - camera.x + penguin.width / 2, penguin.y - camera.y + bob);
    ctx.scale(penguin.direction, 1);
    ctx.drawImage(assets.tiles, 244, 250, 20, 20, -penguin.width / 2, 0, penguin.width, penguin.height);
    ctx.restore();
  }
  for (const icicle of activities.fallingIcicles) {
    if (icicle.warning) {
      ctx.fillStyle = "rgba(255,190,100,.7)";
      ctx.fillRect(icicle.x - camera.x + 10, icicle.y - camera.y + 35, 12, 3);
    }
    ctx.drawImage(assets.tiles, 172, 250, 20, 20, icicle.x - camera.x, icicle.y - camera.y, TILE_SIZE, TILE_SIZE);
  }
  ctx.fillStyle = "#fff";
  for (const shot of activities.snowballs) {
    const x = shot.currentX - camera.x, y = shot.currentY - camera.y;
    ctx.globalAlpha = .25;
    ctx.fillRect(x - shot.vx * .025 - 2, y - (shot.vy + 420 * shot.elapsed) * .025 - 2, 4, 4);
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }
  for (const splash of activities.splashes) {
    const progress = (now - splash.at) / 450;
    ctx.globalAlpha = 1 - progress;
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      ctx.fillRect(splash.x - camera.x + Math.cos(angle) * progress * 22, splash.y - camera.y + Math.sin(angle) * progress * 22, 3, 3);
    }
  }
  ctx.restore();
}

export function drawPlayer(ctx, player, camera, name = "", remote = false) {
  const x = Math.round(player.x - camera.x);
  const y = Math.round(player.y - camera.y);
  ctx.save();
  // Draw in a 22 x 32 pixel grid; physical and visible height share TILE_SIZE.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(player.width / 22, player.height / 32);
  const pixel = (color, px, py, w, h) => { ctx.fillStyle = color; ctx.fillRect(px, py, w, h); };
  pixel("#513749", 4, 0, 14, 5);
  pixel("#755044", 6, 0, 10, 2);
  pixel("#f2c1aa", 4, 5, 14, 10);
  pixel("#d59481", 4, 12, 14, 3);
  pixel("#f8d5b3", 6, 5, 10, 6);
  pixel("#25213c", player.facing > 0 ? 14 : 6, 7, 2, 3);
  if (!player.outfitId) {
  pixel(remote ? "#2d6b8c" : "#087da1", 2, 15, 18, 11);
  pixel(remote ? "#8dd1db" : "#62dc8a", 4, 16, 14, 2);
  pixel("#f2c1aa", 0, 20, 3, 6);
  pixel("#d59481", 19, 20, 3, 6);
  pixel("#312b4b", 4, 26, 6, 4);
  pixel("#312b4b", 12, 26, 6, 4);
  pixel("#241e35", 2, 30, 8, 2);
  pixel("#241e35", 12, 30, 8, 2);
  }
  if (player.outfitId) drawNpcClothes(ctx, { outfitId: player.outfitId, skin: "#f2c1aa" });
  ctx.restore();
  if (name) {
    ctx.font = "800 11px system-ui";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(23, 13, 48, .78)";
    ctx.strokeText(name, x + 11, y - 6);
    ctx.fillStyle = remote ? "#bcecff" : "#fff3ad";
    ctx.fillText(name, x + 11, y - 6);
  }
  ctx.restore();
}

export function drawBuildPreview(ctx, assets, world, camera, target, itemId, check, width, height) {
  const item = ITEM_DEFS[itemId];
  if (!item?.placesTile) return;
  const x = target.x * TILE_SIZE - camera.x, y = target.y * TILE_SIZE - camera.y;
  ctx.save();
  ctx.strokeStyle = "rgba(180,210,220,.12)"; ctx.lineWidth = 1;
  for (let gx = -camera.x % TILE_SIZE; gx < width; gx += TILE_SIZE) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,height); ctx.stroke(); }
  for (let gy = -camera.y % TILE_SIZE; gy < height; gy += TILE_SIZE) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(width,gy); ctx.stroke(); }
  ctx.globalAlpha = .6; drawTile(ctx, assets, item.placesTile, x, y); ctx.globalAlpha = 1;
  ctx.fillStyle = check.ok ? "rgba(90,225,150,.18)" : "rgba(255,100,100,.24)";
  ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE); ctx.strokeStyle = check.ok ? "#7cf3ac" : "#ff827d"; ctx.lineWidth = 2; ctx.strokeRect(x+1,y+1,TILE_SIZE-2,TILE_SIZE-2);
  ctx.restore();
}

export function drawCrosshair(ctx, target, camera, reachable) {
  if (!target.inBounds) return;
  const x = target.x * TILE_SIZE - camera.x;
  const y = target.y * TILE_SIZE - camera.y;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = reachable ? "#fff6a7" : "rgba(255, 255, 255, .35)";
  ctx.setLineDash(reachable ? [] : [4, 3]);
  ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  ctx.restore();
}

function drawSlot(ctx, assets, inventory, index, x, y, size, selected) {
  ctx.fillStyle = selected ? "#b8f4c5" : "rgba(3, 47, 66, .86)";
  roundedRect(ctx, x, y, size, size, 10);
  ctx.fill();
  ctx.lineWidth = selected ? 3 : 1;
  ctx.strokeStyle = selected ? "#ffffff" : "rgba(255, 255, 255, .25)";
  ctx.stroke();
  const slot = inventory[index];
  if (slot) {
    drawItemIcon(ctx, assets, slot.itemId, x + 8, y + 8, size - 16);
    ctx.fillStyle = "#fff";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "right";
    const countLabel = slot.count >= 1000000 ? `${(slot.count / 1000000).toFixed(1)}m` : slot.count >= 10000 ? `${(slot.count / 1000).toFixed(1)}k` : String(slot.count);
    ctx.fillText(countLabel, x + size - 7, y + size - 7, size - 10);
  }
  ctx.fillStyle = selected ? "#06435a" : "#acd2d9";
  ctx.font = "700 10px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(index + 1, x + 7, y + 13);
}

export function drawHotbar(ctx, assets, inventory, selectedSlot, width, height) {
  const gap = 7;
  const slotSize = Math.min(58, Math.max(30, Math.floor((width - 28 - (HOTBAR_SIZE - 1) * gap) / HOTBAR_SIZE)));
  const barWidth = HOTBAR_SIZE * slotSize + (HOTBAR_SIZE - 1) * gap;
  const left = Math.round((width - barWidth) / 2);
  const top = height - slotSize - 23;
  const slots = [];
  for (let index = 0; index < HOTBAR_SIZE; index += 1) {
    const x = left + index * (slotSize + gap);
    drawSlot(ctx, assets, inventory, index, x, top, slotSize, index === selectedSlot);
    slots.push({ x, y: top, size: slotSize, index });
  }
  return { slots };
}

export function drawInventoryPanel(ctx, assets, inventory, selectedSlot, width, height, drag = null) {
  const columns = inventory.length > 40 && width >= 700 ? 10 : 5;
  const gap = 7;
  const rows = Math.ceil(inventory.length / columns);
  const slotSize = Math.min(58, Math.max(18, Math.min(Math.floor((width - 28 - (columns - 1) * gap) / columns), Math.floor((height - 145 - (rows - 1) * gap) / rows))));
  const gridWidth = columns * slotSize + (columns - 1) * gap;
  const left = Math.round((width - gridWidth) / 2);
  const hotbarSlotSize = Math.min(58, Math.max(30, Math.floor((width - 28 - (HOTBAR_SIZE - 1) * gap) / HOTBAR_SIZE)));
  const top = height - hotbarSlotSize - 23 - 14 - (rows * slotSize + (rows - 1) * gap);
  ctx.save();
  ctx.fillStyle = "rgba(3, 47, 66, .95)";
  roundedRect(ctx, left - 14, top - 14, gridWidth + 28, rows * slotSize + (rows - 1) * gap + 28, 18);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, .3)";
  ctx.stroke();
  ctx.fillStyle = "#8df0a4";
  ctx.font = "800 11px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("INVENTORY", left - 4, top - 24 < 18 ? top - 2 : top - 22);
  const slots = [];
  for (let index = 0; index < inventory.length; index += 1) {
    const x = left + (index % columns) * (slotSize + gap);
    const y = top + Math.floor(index / columns) * (slotSize + gap);
    drawSlot(ctx, assets, inventory, index, x, y, slotSize, index === selectedSlot);
    if (drag && index === drag.from) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffe77a";
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x + 2, y + 2, slotSize - 4, slotSize - 4);
      ctx.setLineDash([]);
    }
    slots.push({ x, y, size: slotSize, index });
  }
  if (drag && drag.from >= 0 && inventory[drag.from]) {
    ctx.save();
    ctx.globalAlpha = .85;
    drawItemIcon(ctx, assets, inventory[drag.from].itemId, drag.pointer.x - slotSize / 2, drag.pointer.y - slotSize / 2, slotSize);
    ctx.restore();
  }
  ctx.restore();
  return { slots, x: left - 14, y: top - 14, width: gridWidth + 28, height: rows * slotSize + (rows - 1) * gap + 28 };
}

export function drawHud(ctx, assets, state, width) {
  const { inventory, selectedSlot, toast, target, breaking, worldName, online, lavaHits } = state;
  const selected = inventory[selectedSlot];
  ctx.save();
  ctx.fillStyle = "rgba(3, 55, 75, .78)";
  roundedRect(ctx, 16, 16, 310, 84, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 18px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("BUILDTOPIA", 29, 42);
  ctx.fillStyle = "#c9eaf0";
  ctx.font = "600 12px system-ui";
  ctx.fillText(worldName ? `World: ${worldName}  ·  ${online} online` : "Shared sky sandbox", 29, 63);
  ctx.fillText("A / D move  ·  W jump  ·  hold click mine", 29, 82);

  const gems = countItem(inventory, "gems");
  ctx.fillStyle = "rgba(3, 55, 75, .78)";
  roundedRect(ctx, width - 122, 16, 106, 42, 14);
  ctx.fill();
  drawItemIcon(ctx, assets, "gems", width - 112, 25, 22);
  ctx.fillStyle = "#fff3ad";
  ctx.font = "800 16px system-ui";
  ctx.fillText(`${gems} gems`, width - 82, 43);

  const lives = 4 - (lavaHits ?? 0);
  for (let index = 0; index < 4; index += 1) {
    const hx = width - 122 + 10 + index * 24;
    const hy = 66;
    ctx.fillStyle = index < lives ? "rgba(3, 55, 75, .78)" : "rgba(3, 55, 75, .42)";
    roundedRect(ctx, hx - 4, hy - 3, 20, 18, 6);
    ctx.fill();
    ctx.fillStyle = index < lives ? "#ff5a5a" : "rgba(255, 255, 255, .22)";
    ctx.beginPath();
    ctx.arc(hx + 5, hy + 6, 3.4, 0, Math.PI * 2);
    ctx.arc(hx + 11, hy + 6, 3.4, 0, Math.PI * 2);
    ctx.moveTo(hx + 1.6, hy + 7.4);
    ctx.lineTo(hx + 8, hy + 14);
    ctx.lineTo(hx + 14.4, hy + 7.4);
    ctx.closePath();
    ctx.fill();
  }

  if (selected) {
    ctx.fillStyle = "rgba(3, 55, 75, .78)";
    roundedRect(ctx, 16, 111, 226, 38, 12);
    ctx.fill();
    drawItemIcon(ctx, assets, selected.itemId, 22, 118, 24);
    ctx.fillStyle = "#fff";
    ctx.font = "700 12px system-ui";
    ctx.fillText(ITEM_DEFS[selected.itemId].name, 53, 135);
  }

  if (target?.inBounds && breaking?.active) {
    const definition = TILE_DEFS[target.tileId];
    const progress = Math.min(1, breaking.progress);
    const boxWidth = 170;
    const x = Math.round((width - boxWidth) / 2);
    ctx.fillStyle = "rgba(3, 55, 75, .82)";
    roundedRect(ctx, x, 18, boxWidth, 40, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`Mining ${definition?.name ?? "tile"}`, x + boxWidth / 2, 35);
    ctx.fillStyle = "rgba(255, 255, 255, .19)";
    roundedRect(ctx, x + 12, 42, boxWidth - 24, 7, 4);
    ctx.fill();
    ctx.fillStyle = "#fff0a2";
    roundedRect(ctx, x + 12, 42, (boxWidth - 24) * progress, 7, 4);
    ctx.fill();
  }

  if (toast?.message) {
    ctx.globalAlpha = Math.min(1, toast.timeLeft * 2);
    ctx.fillStyle = "rgba(3, 55, 75, .9)";
    ctx.font = "700 13px system-ui";
    const textWidth = ctx.measureText(toast.message).width + 36;
    roundedRect(ctx, (width - textWidth) / 2, 72, textWidth, 31, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(toast.message, width / 2, 92);
  }
  ctx.restore();
}

export function drawShop(ctx, assets, inventory, width, height, sectionId = null, admin = false, savedWardrobe = {}, page = 0) {
  const clothingSection = { id: "clothes", name: "Clothes", icon: "wrench", description: "42 outfits · captured pets · equip" };
  const clothing = sectionId === "clothes";
  const petView = sectionId === "clothes-pets";
  const wardrobe = wardrobeState(savedWardrobe);
  const pets = petState(savedWardrobe);
  const petEntries = Object.entries(pets.ghostPets).map(([petId, pet]) => ({ ...pet, petId }));
  const section = petView ? { id: "clothes-pets", name: "Clothes · Pets" } : clothing ? clothingSection : SHOP_SECTIONS.find((entry) => entry.id === sectionId);
  let sections = admin ? [...SHOP_SECTIONS, { id: "admin", name: "Admin · Blocks & NPCs", icon: "world_lock", description: "Any item, any quantity · NPC editor" }] : SHOP_SECTIONS;
  sections = [...sections, clothingSection];
  const allClothes = [...CLOTHING_OFFERS].sort((a, b) => Number(b.group === "autumn") - Number(a.group === "autumn"));
  const pageSize = width < 560 ? 3 : 6;
  const sectionOffers = section && !clothing && !petView ? SHOP_ITEMS.filter(offer => section.items.includes(offer.item)) : [];
  const paginated = clothing || petView || sectionOffers.length > pageSize;
  const pageCount = Math.max(1, Math.ceil((petView ? petEntries.length : clothing ? allClothes.length : sectionOffers.length) / pageSize));
  page = Math.max(0, Math.min(pageCount - 1, page));
  const entries = petView ? (petEntries.length ? petEntries.slice(page * pageSize, (page + 1) * pageSize) : [{ empty: true }]) : clothing ? allClothes.slice(page * pageSize, (page + 1) * pageSize) : section ? sectionOffers.slice(page * pageSize, (page + 1) * pageSize) : sections;
  const columns = width < 560 ? 1 : 2;
  ctx.fillStyle = "rgba(1, 30, 43, .62)";
  ctx.fillRect(0, 0, width, height);
  const panelWidth = Math.min(650, width - 24);
  const rows = Math.ceil(entries.length / columns);
  const cardHeight = entries.some((entry) => entry.rewards) ? 116 : 75;
  const rowStep = cardHeight + 18;
  const panelHeight = 145 + (rows - 1) * rowStep + cardHeight + (paginated ? (clothing || petView ? 106 : 68) : 24);
  // Fit all offers on small displays; hit testing uses the same transform.
  const scale = Math.min(1, Math.max(1, height - 32) / panelHeight);
  const x = (width - panelWidth) / 2;
  const y = (height - panelHeight * scale) / 2;
  const offsetX = width * (1 - scale) / 2;
  ctx.save();
  ctx.translate(offsetX, y);
  ctx.scale(scale, scale);
  ctx.translate(0, -y);
  ctx.fillStyle = "#075b79";
  roundedRect(ctx, x, y, panelWidth, panelHeight, 22);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "800 24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(section?.name ?? "Sky Market", x + 22, y + 42, panelWidth - 115);
  ctx.fillStyle = "#c9eaf0";
  ctx.font = "600 13px system-ui";
  ctx.fillText(`You have ${countItem(inventory, "gems")} Sky Gems`, x + 28, y + 68);
  ctx.fillText(petView ? "Your captured pets · choose one to follow you for free." : clothing ? "Outfits cost 150 gems · open Pets for your companions." : section ? "Choose an item to buy." : "Open a section to browse its items.", x + 28, y + 88, panelWidth - 56);

  const buttons = [];
  function button(label, bx, by, bw, action) {
    ctx.fillStyle = "#1688b7";
    roundedRect(ctx, bx, by, bw, 32, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, bx + bw / 2, by + 21);
    ctx.textAlign = "left";
    buttons.push({ x: bx, y: by, width: bw, height: 32, action });
  }
  button("Close", x + panelWidth - 82, y + 18, 64, { kind: "close" });
  if (section) button("‹ All sections", x + 18, y + 102, 125, { kind: "back" });
  if (clothing || petView) {
    const footerY = y + panelHeight - 76;
    if (clothing) {
      button("Original clothes", x + 18, footerY, 125, { kind: "clothing", outfitId: null });
      button(`Pets (${petEntries.length})`, x + panelWidth - 150, footerY, 132, { kind: "section", sectionId: "clothes-pets" });
    } else {
      button("‹ Outfits", x + 18, footerY, 125, { kind: "section", sectionId: "clothes" });
      button("Dismiss pet", x + panelWidth - 150, footerY, 132, { kind: "pet", petId: null });
    }
  }
  if (paginated) {
    const footerY = y + panelHeight - 76;
    button("‹ Prev", x + 18, footerY + 38, 64, { kind: "page", page: Math.max(0, page - 1) });
    button("Next ›", x + panelWidth - 82, footerY + 38, 64, { kind: "page", page: Math.min(pageCount - 1, page + 1) });
    ctx.fillStyle = "#c9eaf0"; ctx.textAlign = "center"; ctx.font = "600 12px system-ui";
    ctx.fillText(`${page + 1} / ${pageCount}`, x + panelWidth / 2, footerY + 59);
    ctx.textAlign = "left";
  }
  const cardWidth = (panelWidth - 36 - (columns - 1) * 18) / columns;
  const cards = [];

  entries.forEach((offer, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cardX = x + 18 + col * (cardWidth + 18);
    const cardY = y + 145 + row * rowStep;
    cards.push({ x: cardX, y: cardY, width: cardWidth, height: cardHeight, action: petView ? (offer.empty ? { kind: "none" } : { kind: "pet", petId: offer.petId }) : clothing ? { kind: "clothing", outfitId: offer.outfitId } : section ? { kind: "buy", offer } : { kind: "section", sectionId: offer.id } });
    ctx.fillStyle = "#06435a";
    roundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 14);
    ctx.fill();
    if (petView) {
      if (!offer.empty) drawGhost(ctx, { x: cardX + 36, y: cardY + 35, variant: offer.variant }, { x: 0, y: 0 }, true);
      ctx.fillStyle = "#fff"; ctx.font = "800 14px system-ui";
      ctx.fillText(offer.empty ? "No pets caught yet" : offer.name, cardX + 68, cardY + 25, cardWidth - 78);
      ctx.fillStyle = "#c9eaf0"; ctx.font = "600 11px system-ui";
      ctx.fillText(offer.empty ? "Catch one with a Ghost Buster." : "Ghost companion · yours forever", cardX + 68, cardY + 42, cardWidth - 78);
      ctx.fillStyle = "#ffe77a"; ctx.font = "700 12px system-ui";
      ctx.fillText(offer.empty ? "Find ghosts in autumn worlds" : pets.equippedGhost === offer.petId ? "Following ✓" : "Click to follow · free", cardX + 68, cardY + 61, cardWidth - 78);
      return;
    }
    if (clothing) {
      drawPlayer(ctx, { x: cardX + 18, y: cardY + 7, width: 33, height: 48, facing: 1, outfitId: offer.outfitId }, { x: 0, y: 0 });
      ctx.fillStyle = "#fff"; ctx.font = "800 14px system-ui";
      ctx.fillText(offer.name, cardX + 68, cardY + 23, cardWidth - 78);
      ctx.fillStyle = "#c9eaf0"; ctx.font = "600 11px system-ui";
      ctx.fillText(NPC_OUTFIT_GROUPS.find(group => group.id === offer.group)?.name ?? offer.group, cardX + 68, cardY + 39);
      ctx.fillStyle = "#ffe77a"; ctx.font = "700 12px system-ui";
      const owned = wardrobe.ownedOutfits[offer.outfitId];
      ctx.fillText(wardrobe.equippedOutfit === offer.outfitId ? "Equipped ✓" : owned ? "Owned · click to equip" : "150 gems · buy & equip", cardX + 68, cardY + 60, cardWidth - 78);
      return;
    }
    if (!section) {
      drawItemIcon(ctx, assets, offer.icon, cardX + 12, cardY + 14, 46);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.fillText(offer.name, cardX + 68, cardY + 26, cardWidth - 78);
      ctx.fillStyle = "#c9eaf0";
      ctx.font = "600 11px system-ui";
      ctx.fillText(offer.description, cardX + 68, cardY + 45, cardWidth - 78);
      ctx.fillStyle = "#ffe77a";
      ctx.fillText("Open section ›", cardX + 68, cardY + 64);
      return;
    }
    if (offer.rewards) {
      drawItemIcon(ctx, assets, offer.icon ?? "bounce_pad", cardX + 12, cardY + 14, 46);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.fillText(offer.name, cardX + 68, cardY + 30, cardWidth - 78);
      ctx.fillStyle = "#c9eaf0";
      ctx.font = "600 11px system-ui";
      for (let i = 0; i < offer.rewards.length; i += 2) {
        const label = offer.rewards.slice(i, i + 2).map((reward) => `${reward.amount} ${ITEM_DEFS[reward.item].name}`).join(" · ");
        ctx.fillText(label, cardX + 12, cardY + 72 + (i / 2) * 16, cardWidth - 24);
      }
    } else if (offer.item === "seed_package") {
      drawItemIcon(ctx, assets, "red_flower_seed", cardX + 12, cardY + 12, 28);
      drawItemIcon(ctx, assets, "blue_block_seed", cardX + 32, cardY + 23, 28);
      drawItemIcon(ctx, assets, "dirt_seed", cardX + 12, cardY + 38, 28);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("3 Random Seeds", cardX + 68, cardY + 30, cardWidth - 78);
    } else if (offer.item === "inventory_slots") {
      ctx.fillStyle = "#1688b7";
      roundedRect(ctx, cardX + 14, cardY + 14, 44, 48, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#ffe77a";
      ctx.font = "800 26px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("+", cardX + 36, cardY + 48);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`+${offer.amount} Inventory Slots`, cardX + 68, cardY + 30, cardWidth - 78);
    } else {
      drawItemIcon(ctx, assets, offer.item, cardX + 12, cardY + 14, 46);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`${offer.amount}× ${ITEM_DEFS[offer.item].name}`, cardX + 68, cardY + 30, cardWidth - 78);
    }
    ctx.fillStyle = "#ffe77a";
    ctx.font = "700 12px system-ui";
    ctx.fillText(`${offer.cost.toLocaleString()} gems`, cardX + 68, cardY + 51);
    ctx.fillStyle = "#acd2d9";
    ctx.font = "700 11px system-ui";
    if (!offer.rewards) ctx.fillText(offer.item === "seed_package" ? "Any seed · repeats possible" : "Click to buy", cardX + 68, cardY + 67);
  });
  ctx.restore();
  return { x, y, panelWidth, panelHeight, cardWidth, scale, offsetX, sectionId: section?.id ?? null, cards, buttons };
}

export function shopActionAt(point, layout) {
  if (!layout) return null;
  const { y } = layout;
  const scale = layout.scale ?? 1;
  point = { x: (point.x - (layout.offsetX ?? 0)) / scale, y: (point.y - y) / scale + y };
  for (const target of [...layout.buttons, ...layout.cards]) {
    if (point.x >= target.x && point.x <= target.x + target.width && point.y >= target.y && point.y <= target.y + target.height) return target.action;
  }
  return null;
}

export function shopOfferAt(point, layout) {
  const action = shopActionAt(point, layout);
  return action?.kind === "buy" ? action.offer : null;
}
