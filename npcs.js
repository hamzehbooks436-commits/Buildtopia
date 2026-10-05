import { ITEM_DEFS } from "./definitions.js";
import { addItem, countItem, removeItem } from "./inventory.js";
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from "./config.js";
import { NPC_OUTFIT_BY_ID, drawNpcClothes } from "./npc-outfits.js";

export function quantity(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error("Choose a positive whole quantity.");
  return n;
}

export function grantItems(slots, itemId, amount) {
  amount = quantity(amount);
  if (!ITEM_DEFS[itemId]) throw new Error("Choose an existing item.");
  const next = slots.map(slot => slot ? { ...slot } : null);
  let index = next.findIndex(slot => slot?.itemId === itemId);
  if (index < 0) index = next.findIndex(slot => !slot);
  if (index < 0) { index = next.length; next.push(null); }
  const total = (next[index]?.count ?? 0) + amount;
  if (!Number.isSafeInteger(total)) throw new Error("The total quantity is too large.");
  next[index] = { itemId, count: total };
  return next;
}

function lines(value) {
  const totals = new Map();
  for (const line of Object.values(value ?? {})) {
    if (!ITEM_DEFS[line.itemId]) throw new Error("Choose an existing item for each row.");
    const total = (totals.get(line.itemId) ?? 0) + quantity(line.amount);
    if (!Number.isSafeInteger(total)) throw new Error("The total quantity is too large.");
    totals.set(line.itemId, total);
  }
  return [...totals].map(([itemId, amount]) => ({ itemId, amount }));
}

export function normalizeNpc(raw) {
  const x = Number(raw.x), y = Number(raw.y);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) throw new Error("Choose a tile inside the world.");
  const name = String(raw.name ?? "").trim().slice(0, 40);
  if (!name) throw new Error("Give your NPC a name.");
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value ?? "") ? value : fallback;
  const offers = {};
  for (const [id, offer] of Object.entries(raw.offers ?? {})) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid action ID.");
    const label = String(offer.label ?? "").trim().slice(0, 80);
    if (!label) throw new Error("Give every action a button label.");
    offers[id] = { label, response: String(offer.response ?? "").slice(0, 2000), repeatable: offer.repeatable === true, requires: lines(offer.requires), rewards: lines(offer.rewards) };
  }
  const outfitId = Object.hasOwn(NPC_OUTFIT_BY_ID, raw.outfitId) ? raw.outfitId : "casual-tee";
  return { name, x, y, dialogue: String(raw.dialogue ?? "").slice(0, 2000), skin: color(raw.skin, "#f1c598"), hair: color(raw.hair, "#543729"), outfitId, outfit: color(raw.outfit, NPC_OUTFIT_BY_ID[outfitId].top), hat: ["none", "cap", "crown"].includes(raw.hat) ? raw.hat : "none", enabled: raw.enabled !== false, offers };
}

// Pure transaction transform: payment, all rewards and the one-time receipt
// succeed together. Never mutate the live bag from a Firebase retry callback.
export function applyNpcOffer(saved, offer, claimKey, requestId) {
  if (!saved || !Array.isArray(saved.slots)) throw new Error("Your inventory has not loaded yet.");
  if (saved.lastNpcRequest === requestId) return saved;
  if (!offer.repeatable && saved.npcClaims?.[claimKey]) throw new Error("You already completed this action.");
  const requires = lines(offer.requires), rewards = lines(offer.rewards);
  const next = { ...saved, slots: saved.slots.map(slot => slot ? { ...slot } : null), npcClaims: { ...(saved.npcClaims ?? {}) } };
  for (const line of requires) if (countItem(next.slots, line.itemId) < line.amount) throw new Error(`You need ${line.amount} ${ITEM_DEFS[line.itemId].name}.`);
  for (const line of requires) removeItem(next.slots, line.itemId, line.amount);
  for (const line of rewards) if (!addItem(next.slots, line.itemId, line.amount)) throw new Error("Make room in your inventory for all the rewards. Nothing was taken.");
  if (!offer.repeatable) next.npcClaims[claimKey] = true;
  next.lastNpcRequest = requestId;
  next.updatedAt = Date.now();
  return next;
}

export function npcAtPoint(npcs, point) {
  return Object.entries(npcs).find(([, npc]) => npc.enabled && point.x >= npc.x * TILE_SIZE && point.x <= (npc.x + 1) * TILE_SIZE && point.y >= npc.y * TILE_SIZE - 12 && point.y <= (npc.y + 1) * TILE_SIZE);
}

export function nearNpc(player, npc, reach) {
  return Math.hypot(player.x + player.width / 2 - (npc.x + .5) * TILE_SIZE, player.y + player.height / 2 - (npc.y + .5) * TILE_SIZE) <= reach;
}

export function drawNpc(ctx, npc, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(2,36,52,.25)"; ctx.fillRect(5, 29, 22, 4);
  drawNpcClothes(ctx, npc);
  ctx.fillStyle = npc.skin; ctx.fillRect(8, -5, 17, 16);
  ctx.fillStyle = npc.hair; ctx.fillRect(7, -7, 19, 5); ctx.fillRect(7, -3, 4, 6);
  ctx.fillStyle = "#19344c"; ctx.fillRect(13, 1, 2, 3); ctx.fillRect(21, 1, 2, 3); ctx.fillRect(16, 7, 5, 1);
  if (npc.hat === "cap") { ctx.fillStyle = npc.outfit; ctx.fillRect(6, -11, 21, 5); ctx.fillRect(19, -7, 12, 3); }
  if (npc.hat === "crown") { ctx.fillStyle = "#ffe77a"; ctx.fillRect(7, -9, 19, 4); for (const xx of [7, 15, 23]) ctx.fillRect(xx, -14, 3, 6); }
  ctx.restore();
}

export function drawNpcs(ctx, npcs, camera) {
  for (const npc of Object.values(npcs)) {
    if (!npc.enabled) continue;
    const x = npc.x * TILE_SIZE - camera.x, y = npc.y * TILE_SIZE - camera.y;
    drawNpc(ctx, npc, x, y);
    // Use the players' outlined floating name style, with space for NPC hats.
    ctx.save(); ctx.font = "800 11px system-ui"; ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(23, 13, 48, .78)";
    ctx.strokeText(npc.name, x + 16, y - 20, 200);
    ctx.fillStyle = "#fff3ad"; ctx.fillText(npc.name, x + 16, y - 20, 200); ctx.restore();
  }
}
