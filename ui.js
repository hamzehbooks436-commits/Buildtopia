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
  ctx.globalAlpha = 1;
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
  ctx.imageSmoothingEnabled = false;
  drawSprite(ctx, assets.tiles, definition.sprite, x, y, size);
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
  pixel(remote ? "#2d6b8c" : "#44306d", 2, 15, 18, 11);
  pixel(remote ? "#8dd1db" : "#b498dd", 4, 16, 14, 2);
  pixel("#f2c1aa", 0, 20, 3, 6);
  pixel("#d59481", 19, 20, 3, 6);
  pixel("#312b4b", 4, 26, 6, 4);
  pixel("#312b4b", 12, 26, 6, 4);
  pixel("#241e35", 2, 30, 8, 2);
  pixel("#241e35", 12, 30, 8, 2);
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
  ctx.fillStyle = selected ? "#f6dcff" : "rgba(23, 17, 51, .82)";
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
    ctx.fillText(slot.count, x + size - 7, y + size - 7);
  }
  ctx.fillStyle = selected ? "#352151" : "#a9a0c2";
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
  for (let index = 0; index < HOTBAR_SIZE; index += 1) {
    drawSlot(ctx, assets, inventory, index, left + index * (slotSize + gap), top, slotSize, index === selectedSlot);
  }
}

export function drawInventoryPanel(ctx, assets, inventory, selectedSlot, width, height, drag = null) {
  const columns = 5;
  const gap = 7;
  const rows = Math.ceil(inventory.length / columns);
  const slotSize = Math.min(58, Math.max(30, Math.floor((width - 28 - (columns - 1) * gap) / columns)));
  const gridWidth = columns * slotSize + (columns - 1) * gap;
  const left = Math.round((width - gridWidth) / 2);
  const hotbarSlotSize = Math.min(58, Math.max(30, Math.floor((width - 28 - (HOTBAR_SIZE - 1) * gap) / HOTBAR_SIZE)));
  const top = height - hotbarSlotSize - 23 - 14 - (rows * slotSize + (rows - 1) * gap);
  ctx.save();
  ctx.fillStyle = "rgba(16, 11, 38, .94)";
  roundedRect(ctx, left - 14, top - 14, gridWidth + 28, rows * slotSize + (rows - 1) * gap + 28, 18);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, .3)";
  ctx.stroke();
  ctx.fillStyle = "#e2adff";
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
  ctx.fillStyle = "rgba(20, 14, 46, .74)";
  roundedRect(ctx, 16, 16, 310, 84, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 18px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("BUILDTOPIA", 29, 42);
  ctx.fillStyle = "#c9c0e6";
  ctx.font = "600 12px system-ui";
  ctx.fillText(worldName ? `World: ${worldName}  ·  ${online} online` : "Shared sky sandbox", 29, 63);
  ctx.fillText("A / D move  ·  W jump  ·  hold click mine", 29, 82);

  const gems = countItem(inventory, "gems");
  ctx.fillStyle = "rgba(20, 14, 46, .74)";
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
    ctx.fillStyle = index < lives ? "rgba(20, 14, 46, .74)" : "rgba(20, 14, 46, .4)";
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
  const rows = Math.ceil(SHOP_ITEMS.length / 2);
  const panelHeight = 111 + (rows - 1) * 93 + 75 + 30;
  const x = (width - panelWidth) / 2;
  const y = Math.max(60, (height - panelHeight - 40) / 2);
  ctx.fillStyle = "#23183f";
  roundedRect(ctx, x, y, panelWidth, panelHeight, 22);
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
    if (offer.item === "seed_package") {
      drawItemIcon(ctx, assets, "red_flower_seed", cardX + 12, cardY + 12, 28);
      drawItemIcon(ctx, assets, "blue_block_seed", cardX + 32, cardY + 23, 28);
      drawItemIcon(ctx, assets, "dirt_seed", cardX + 12, cardY + 38, 28);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("3 Random Seeds", cardX + 68, cardY + 30);
    } else if (offer.item === "inventory_slots") {
      ctx.fillStyle = "#6d4a92";
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
      ctx.fillText(`+${offer.amount} Inventory Slots`, cardX + 68, cardY + 30);
    } else {
      drawItemIcon(ctx, assets, offer.item, cardX + 12, cardY + 14, 46);
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`${offer.amount}× ${ITEM_DEFS[offer.item].name}`, cardX + 68, cardY + 30);
    }
    ctx.fillStyle = "#ffe77a";
    ctx.font = "700 12px system-ui";
    ctx.fillText(`${offer.cost.toLocaleString()} gems`, cardX + 68, cardY + 51);
    ctx.fillStyle = "#c4b6e0";
    ctx.font = "700 11px system-ui";
    ctx.fillText(offer.item === "seed_package" ? "Any seed · repeats possible" : "Click to buy", cardX + 68, cardY + 67);
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
