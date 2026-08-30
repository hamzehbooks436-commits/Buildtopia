import { HOTBAR_SIZE, TILE_SIZE } from "./config.js";
import { ITEM_DEFS, SHOP_ITEMS, TILE_DEFS } from "./definitions.js";
import { countItem } from "./inventory.js";

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
  ctx.globalAlpha = .62;
  drawSprite(ctx, assets.tiles, item.sprite, x + size * .13, y + size * .13, size * .74);
  ctx.restore();
}

export function drawSky(ctx, assets, camera, width, height) {
  const image = assets.sky;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offset = -((camera.x * .06) % drawWidth);
  ctx.drawImage(image, offset, 0, drawWidth, drawHeight);
  ctx.drawImage(image, offset + drawWidth, 0, drawWidth, drawHeight);
  ctx.fillStyle = "rgba(36, 19, 82, .13)";
  ctx.fillRect(0, 0, width, height);
}

export function drawTile(ctx, assets, tileId, x, y, size = TILE_SIZE, background = false) {
  const definition = TILE_DEFS[tileId];
  if (!definition || tileId === 0) return;
  ctx.save();
  if (background) ctx.globalAlpha = .19;
  ctx.fillStyle = definition.color;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha *= .19;
  drawSprite(ctx, assets.tiles, definition.sprite, x + 2, y + 2, size - 4);
  ctx.globalAlpha = background ? .2 : .55;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 3, y + 3, size - 6, 1);
  ctx.restore();

  // A background tile is deliberately quiet: its main tint and source-art texture
  // establish depth, while the foreground-only details stay out of the sky.
  if (background) return;

  if (tileId === 1) {
    ctx.fillStyle = "#83c760";
    ctx.fillRect(x, y, size, 5);
    ctx.fillStyle = "rgba(63, 39, 68, .33)";
    ctx.fillRect(x + 5, y + 15, 3, 3);
    ctx.fillRect(x + 20, y + 23, 4, 3);
  }
  if (tileId === 2 || tileId === 3) {
    ctx.fillStyle = "rgba(33, 27, 61, .38)";
    ctx.fillRect(x + 8, y + 7, 5, 4);
    ctx.fillRect(x + 21, y + 19, 4, 5);
  }
  if (tileId === 10 || tileId === 11) {
    ctx.fillStyle = tileId === 10 ? "#3f7d43" : "#7653b8";
    ctx.fillRect(x + size / 2 - 2, y + size - 12, 4, 10);
    ctx.beginPath();
    ctx.ellipse(x + size / 2 - 5, y + size - 16, 7, 4, -.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tileId === 20 || tileId === 21) {
    ctx.fillStyle = "#705042";
    ctx.fillRect(x + size / 2 - 3, y + 12, 6, size - 12);
    ctx.fillStyle = tileId === 20 ? "#6fc65f" : "#c889ef";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tileId === 30) {
    ctx.fillStyle = "#4b2f42";
    ctx.fillRect(x + 4, y + 10, size - 8, size - 5);
    ctx.fillStyle = "#ffe77a";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("SHOP", x + size / 2, y + 23);
  }
}

export function drawPlayer(ctx, player, camera) {
  const x = Math.round(player.x - camera.x);
  const y = Math.round(player.y - camera.y);
  ctx.save();
  ctx.fillStyle = "rgba(26, 16, 56, .3)";
  ctx.ellipse(x + 11, y + 41, 15, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f2c1aa";
  roundedRect(ctx, x + 3, y + 1, 16, 17, 6);
  ctx.fill();
  ctx.fillStyle = "#44306d";
  roundedRect(ctx, x + 1, y + 15, 20, 20, 5);
  ctx.fill();
  ctx.fillStyle = "#d9a8f7";
  ctx.fillRect(x + 3, y + 18, 16, 3);
  ctx.fillStyle = "#312250";
  ctx.fillRect(x + 3, y + 35, 7, 5);
  ctx.fillRect(x + 13, y + 35, 7, 5);
  ctx.fillStyle = "#25213c";
  const eyeX = player.facing > 0 ? x + 14 : x + 6;
  ctx.fillRect(eyeX, y + 7, 2, 3);
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

export function drawHotbar(ctx, assets, inventory, selectedSlot, width, height) {
  const slotSize = Math.min(58, Math.max(43, Math.floor((width - 28) / HOTBAR_SIZE)));
  const gap = 7;
  const barWidth = HOTBAR_SIZE * slotSize + (HOTBAR_SIZE - 1) * gap;
  const left = Math.round((width - barWidth) / 2);
  const top = height - slotSize - 23;
  for (let index = 0; index < HOTBAR_SIZE; index += 1) {
    const x = left + index * (slotSize + gap);
    const selected = index === selectedSlot;
    ctx.fillStyle = selected ? "#f6dcff" : "rgba(23, 17, 51, .82)";
    roundedRect(ctx, x, top, slotSize, slotSize, 10);
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeStyle = selected ? "#ffffff" : "rgba(255, 255, 255, .25)";
    ctx.stroke();
    const slot = inventory[index];
    if (slot) {
      drawItemIcon(ctx, assets, slot.itemId, x + 10, top + 10, slotSize - 20);
      ctx.fillStyle = "#fff";
      ctx.font = "700 12px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(slot.count, x + slotSize - 7, top + slotSize - 7);
    }
    ctx.fillStyle = selected ? "#352151" : "#a9a0c2";
    ctx.font = "700 10px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(index + 1, x + 7, top + 13);
  }
}

export function drawHud(ctx, assets, state, width) {
  const { inventory, selectedSlot, toast, target, breaking } = state;
  const selected = inventory[selectedSlot];
  ctx.save();
  ctx.fillStyle = "rgba(20, 14, 46, .74)";
  roundedRect(ctx, 16, 16, 286, 84, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 18px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("BUILDTOPIA", 29, 42);
  ctx.fillStyle = "#c9c0e6";
  ctx.font = "600 12px system-ui";
  ctx.fillText("A / D move  ·  W jump  ·  hold click mine", 29, 63);
  ctx.fillText("right-click or E place  ·  market button", 29, 82);

  const gems = countItem(inventory, "gems");
  ctx.fillStyle = "rgba(20, 14, 46, .74)";
  roundedRect(ctx, width - 122, 16, 106, 42, 14);
  ctx.fill();
  drawItemIcon(ctx, assets, "gems", width - 112, 25, 22);
  ctx.fillStyle = "#fff3ad";
  ctx.font = "800 16px system-ui";
  ctx.fillText(`${gems} gems`, width - 82, 43);

  if (selected) {
    ctx.fillStyle = "rgba(20, 14, 46, .74)";
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
    ctx.fillStyle = "rgba(20, 14, 46, .78)";
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
    ctx.fillStyle = "rgba(20, 14, 46, .86)";
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

export function drawShop(ctx, assets, inventory, width, height) {
  ctx.fillStyle = "rgba(8, 5, 22, .58)";
  ctx.fillRect(0, 0, width, height);
  const panelWidth = Math.min(570, width - 36);
  const x = (width - panelWidth) / 2;
  const y = Math.max(70, (height - 365) / 2);
  ctx.fillStyle = "#23183f";
  roundedRect(ctx, x, y, panelWidth, 330, 22);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "800 24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("Sky Market", x + 28, y + 44);
  ctx.fillStyle = "#cfc6e7";
  ctx.font = "600 13px system-ui";
  ctx.fillText(`You have ${countItem(inventory, "gems")} Sky Gems`, x + 28, y + 68);
  ctx.fillText("Choose an item, or press Escape to leave.", x + 28, y + 88);

  const cardWidth = (panelWidth - 54) / 2;
  SHOP_ITEMS.forEach((offer, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cardX = x + 18 + col * (cardWidth + 18);
    const cardY = y + 111 + row * 93;
    ctx.fillStyle = "#332451";
    roundedRect(ctx, cardX, cardY, cardWidth, 75, 14);
    ctx.fill();
    drawItemIcon(ctx, assets, offer.item, cardX + 12, cardY + 14, 46);
    ctx.fillStyle = "#fff";
    ctx.font = "800 14px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${offer.amount}× ${ITEM_DEFS[offer.item].name}`, cardX + 68, cardY + 30);
    ctx.fillStyle = "#ffe77a";
    ctx.font = "700 12px system-ui";
    ctx.fillText(`${offer.cost} gems`, cardX + 68, cardY + 51);
    ctx.fillStyle = "#c4b6e0";
    ctx.font = "700 11px system-ui";
    ctx.fillText(`Click to buy`, cardX + 68, cardY + 67);
  });
  return { x, y, panelWidth, cardWidth };
}

export function shopOfferAt(point, layout) {
  if (!layout) return null;
  const { x, y, cardWidth } = layout;
  for (let index = 0; index < SHOP_ITEMS.length; index += 1) {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cardX = x + 18 + col * (cardWidth + 18);
    const cardY = y + 111 + row * 93;
    if (point.x >= cardX && point.x <= cardX + cardWidth && point.y >= cardY && point.y <= cardY + 75) return SHOP_ITEMS[index];
  }
  return null;
}
