import { loadAssets } from "./assets.js";
import { HOTBAR_SIZE, INVENTORY_SIZE, MAX_INVENTORY_SIZE, PHYSICS, REACH, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { ITEM_DEFS, SEED_RECIPES, TILE_DEFS, spliceResult } from "./definitions.js";
import { addItem, countItem, createInventory, removeItem } from "./inventory.js";
import { createPlayer, playerOverlapsTile, updatePlayer } from "./player.js";
import { drawCrosshair, drawHotbar, drawHud, drawInventoryPanel, drawPlayer, drawShop, drawSky, drawTile, shopOfferAt } from "./ui.js";
import { World, generateWorld } from "./world.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { get, onDisconnect, onValue, push, ref, remove, runTransaction, set, update } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { auth, database, firebaseConfigured } from "./firebase.js";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const loadingCard = document.querySelector("#loading-card");
const loadingTitle = document.querySelector("#loading-title");
const loadingMessage = document.querySelector("#loading-message");
const leaveButton = document.querySelector("#leave-button");
const shopButton = document.querySelector("#shop-button");
const bagButton = document.querySelector("#bag-button");
const recipesButton = document.querySelector("#recipes-button");
const recipesPanel = document.querySelector("#recipes-panel");
const recipesClose = document.querySelector("#recipes-close");
const recipesList = document.querySelector("#recipes-list");
const doorSettings = document.querySelector("#door-settings");
const doorSettingsForm = document.querySelector("#door-settings-form");
const doorDestination = document.querySelector("#door-destination");
const doorSettingsClose = document.querySelector("#door-settings-close");
const tradePanel = document.querySelector("#trade-panel");
const tradeMessage = document.querySelector("#trade-message");
const tradeRequestActions = document.querySelector("#trade-request-actions");
const tradeActive = document.querySelector("#trade-active");
const tradeAccept = document.querySelector("#trade-accept");
const tradeDecline = document.querySelector("#trade-decline");
const tradeOfferForm = document.querySelector("#trade-offer-form");
const tradeItem = document.querySelector("#trade-item");
const tradeAmount = document.querySelector("#trade-amount");
const tradeMyOffer = document.querySelector("#trade-my-offer");
const tradeTheirOffer = document.querySelector("#trade-their-offer");
const tradeLock = document.querySelector("#trade-lock");
const tradeCancel = document.querySelector("#trade-cancel");
const params = new URLSearchParams(window.location.search);
const worldKey = params.get("world");
const requestedName = params.get("name") || worldKey;
const localMode = localStorage.getItem("buildtopiaLocalMode") === "true";
let assets, world, inventory, inventorySize = INVENTORY_SIZE, player, user, username = "Explorer", worldStateRef, playerStateRef, presenceRef, gamePresenceRef, metaRef, inventoryRef, worldLockedBy = null;
let running = false, lastFrame = 0, lastPlayerSave = 0, lastPlantCheck = 0, selectedSlot = 0, shopOpen = false, shopLayout = null, inventoryOpen = false, invLayout = null, recipesOpen = false, pendingWorldChange = false, remotePlayers = {};
const drag = { from: -1 };
const camera = { x: 0, y: 0 };
const ZOOM_MIN = .6, ZOOM_MAX = 2.5;
let zoom = 1;
function setZoom(next) { zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)); }
const input = { left: false, right: false, jumpPressed: false, jumpHeld: false, pointerDown: false, pointer: { x: 0, y: 0 } };
const breaking = { active: false, x: -1, y: -1, startedAt: 0, progress: 0 };
const toast = { message: "", timeLeft: 0 };
const lava = { hits: 0, lastHitAt: 0, inside: false };
let playerCheckpoint = null, lastDoorKey = "", doorSettingsTarget = null, activeTrade = null, activeTradeRef = null, tradeSubscription = null;

function fail(message) { loadingTitle.textContent = "Could not enter world"; loadingMessage.textContent = message; loadingCard.classList.remove("is-hidden"); }
function notify(message) { toast.message = message; toast.timeLeft = 2.4; }
function resize() { canvas.width = Math.max(320, window.innerWidth); canvas.height = Math.max(320, window.innerHeight); context.imageSmoothingEnabled = false; }
function stopBreaking() { Object.assign(breaking, { active: false, progress: 0, x: -1, y: -1 }); }
const ONLINE_WINDOW = 30000;
function isFresh(entry) { return Boolean(entry) && Date.now() - (entry.updatedAt || 0) < ONLINE_WINDOW; }
function onlineCount() { let total = 1; Object.entries(remotePlayers).forEach(([uid, remote]) => { if (uid !== user?.uid && isFresh(remote)) total += 1; }); return total; }
function setRecipesOpen(open) { recipesOpen = open; recipesPanel.hidden = !open; recipesButton.setAttribute("aria-expanded", String(open)); if (open) { setShopOpen(false); setInventoryOpen(false); } stopBreaking(); }
function setShopOpen(open) { shopOpen = open; shopButton.setAttribute("aria-expanded", String(open)); shopButton.textContent = open ? "Close market" : "Sky Market"; if (open && recipesOpen) setRecipesOpen(false); stopBreaking(); }
function setInventoryOpen(open) { inventoryOpen = open; bagButton.setAttribute("aria-expanded", String(open)); if (open && recipesOpen) setRecipesOpen(false); if (open) stopBreaking(); }
function canBuild() { return !worldLockedBy || worldLockedBy === user?.uid; }
function respawnPoint() { if (playerCheckpoint) return { x: playerCheckpoint.x, y: playerCheckpoint.y }; const doorIndex = world.foreground.indexOf(6); if (doorIndex >= 0) return { x: (doorIndex % world.width) * TILE_SIZE + 5, y: Math.max(0, Math.floor(doorIndex / world.width) - 2) * TILE_SIZE }; const surface = world.surface[18] || 39; return { x: 18 * TILE_SIZE, y: (surface - 3) * TILE_SIZE }; }
async function leaveToWorldGate() { await savePlayerState(); if (presenceRef) await remove(presenceRef).catch(() => {}); if (gamePresenceRef) await remove(gamePresenceRef).catch(() => {}); window.location.assign("hub.html"); }
function pointerPosition(event) { const bounds = canvas.getBoundingClientRect(); input.pointer.x = (event.clientX - bounds.left) * (canvas.width / bounds.width); input.pointer.y = (event.clientY - bounds.top) * (canvas.height / bounds.height); }
function tileTarget() { const worldX = input.pointer.x / zoom + camera.x, worldY = input.pointer.y / zoom + camera.y, x = Math.floor(worldX / TILE_SIZE), y = Math.floor(worldY / TILE_SIZE), inBounds = x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT; const reachable = Math.hypot(x * TILE_SIZE + TILE_SIZE / 2 - (player.x + player.width / 2), y * TILE_SIZE + TILE_SIZE / 2 - (player.y + player.height / 2)) <= REACH; return { x, y, inBounds, reachable, tileId: inBounds ? world.get(x, y) : 0 }; }
function dropsFor(definition) { return (definition.harvest?.drops ?? definition.drops ?? []).map((drop) => { if (drop.chance && Math.random() > drop.chance) return null; let amount; if (drop.weighted) { const total = drop.weighted.reduce((sum, option) => sum + option.weight, 0); let roll = Math.random() * total; amount = drop.weighted[drop.weighted.length - 1].count; for (const option of drop.weighted) { roll -= option.weight; if (roll < 0) { amount = option.count; break; } } } else amount = drop.min ? Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min : drop.count ?? 1; return { item: drop.item, amount }; }).filter(Boolean); }
function collectDrops(drops) { const collected = []; let inventoryFull = false; drops.forEach((drop) => { if (addItem(inventory, drop.item, drop.amount)) collected.push(drop); else inventoryFull = true; }); return { collected, inventoryFull }; }
function formatDrops(drops) { return drops.map((drop) => `${drop.amount}x ${ITEM_DEFS[drop.item].name}`).join(", "); }
async function mutateWorld(mutator) { if (pendingWorldChange) return false; pendingWorldChange = true; try { if (typeof localMode !== "undefined" && localMode) { if (mutator(world) === false) return false; world.settleFlowers(); localStorage.setItem(`buildtopiaWorld:${worldKey}`, JSON.stringify(world.serialize())); return true; } const result = await runTransaction(worldStateRef, (current) => { if (current) { const saved = World.fromSave(current); if (!saved) return; if (mutator(saved) === false) return; saved.settleFlowers(); return saved.serialize(); } const next = generateWorld(typeof worldKey === "undefined" ? "" : worldKey); if (mutator(next) === false) return; next.settleFlowers(); return next.serialize(); }); const updatedWorld = World.fromSave(result.snapshot.val()); if (updatedWorld) world = updatedWorld; return result.committed; } catch { notify("World update failed. Check your connection."); return false; } finally { pendingWorldChange = false; } }
async function savePlayerState() { if (!player || !inventory) return; const playerSave = { player: { x: player.x, y: player.y }, checkpoint: playerCheckpoint, worldName: requestedName, updatedAt: Date.now() }; const inventorySave = { slots: inventory, size: inventorySize, selectedSlot, updatedAt: Date.now() }; if (localMode) { localStorage.setItem("buildtopiaLocalInventory", JSON.stringify(inventorySave)); localStorage.setItem(`buildtopiaPlayer:${worldKey}`, JSON.stringify(playerSave)); return; } if (inventoryRef) await set(inventoryRef, inventorySave).catch(() => {}); if (playerStateRef) await set(playerStateRef, playerSave).catch(() => {}); }
async function updatePresence() { if (presenceRef && player) await set(presenceRef, { username, x: Math.round(player.x), y: Math.round(player.y), facing: player.facing, updatedAt: Date.now() }).catch(() => {}); if (gamePresenceRef) await set(gamePresenceRef, { world: worldKey, worldName: requestedName, name: username, updatedAt: Date.now() }).catch(() => {}); }
async function completeBreak(target) { const definition = TILE_DEFS[target.tileId]; if (!definition || definition.unbreakable) return; const committed = await mutateWorld((next) => { if (next.get(target.x, target.y) !== target.tileId) return false; next.set(target.x, target.y, 0); next.removePlant(target.x, target.y); delete next.blockSettings?.[`${target.x},${target.y}`]; next.naturalFlowers = (next.naturalFlowers ?? []).filter((flower) => flower.x !== target.x || flower.y !== target.y); }); if (!committed) return; if (target.tileId === 7 && worldLockedBy === user?.uid && !world.foreground.includes(7)) { if (metaRef) await runTransaction(metaRef, (current) => { if (!current) return current; const next = { ...current }; delete next.lockedBy; return next; }); worldLockedBy = null; notify("World lock removed — anyone can build here again."); } const { collected, inventoryFull } = collectDrops(dropsFor(definition)); const action = definition.harvest ? "Harvested" : "Mined"; notify(collected.length ? `${action} ${definition.name}: ${formatDrops(collected)}${inventoryFull ? " (inventory full)" : ""}` : `${action} ${definition.name}, but your inventory is full.`); await savePlayerState(); }
function updateBreaking(now, target) { if (!input.pointerDown || !target.inBounds || !target.reachable || !target.tileId || shopOpen || pendingWorldChange) { stopBreaking(); return; } if (!canBuild()) { stopBreaking(); return; } const definition = TILE_DEFS[target.tileId]; if (!definition || definition.unbreakable) { stopBreaking(); return; } if (!breaking.active || breaking.x !== target.x || breaking.y !== target.y) Object.assign(breaking, { active: true, x: target.x, y: target.y, startedAt: now, progress: 0 }); breaking.progress = (now - breaking.startedAt) / (definition.breakTime * (countItem(inventory, "pickaxe") > 0 ? .45 : 1)); if (breaking.progress >= 1) { completeBreak(target); stopBreaking(); } }
async function placeSelected() { if (shopOpen || pendingWorldChange) return; const target = tileTarget(), slot = inventory[selectedSlot]; if (!target.inBounds || !target.reachable || !slot) return; const item = ITEM_DEFS[slot.itemId]; if (!item.placesTile) { notify("That item cannot be placed."); return; } if (!canBuild()) { notify("This world is locked — only the lock's owner can build here."); return; }
  const craftedSeed = spliceResult(target.tileId, item.placesTile);
  if (target.tileId && !craftedSeed) { notify("That space is occupied. These items cannot be spliced."); return; }
  if (!craftedSeed && playerOverlapsTile(player, target.x, target.y)) { notify("Give yourself a little room."); return; }
  const itemId = slot.itemId;
  if (!removeItem(inventory, itemId, 1)) return;
  stopBreaking();
  const placedTile = craftedSeed ? ITEM_DEFS[craftedSeed].placesTile : item.placesTile;
  const committed = await mutateWorld((next) => {
    // Abort on a changed target, including a seed that grew during the request.
    // Firebase may retry this callback; inventory changes stay outside it.
    if (next.get(target.x, target.y) !== target.tileId) return false;
    if (TILE_DEFS[placedTile].growTime) next.plant(target.x, target.y, placedTile);
    else next.set(target.x, target.y, placedTile);
  });
  if (!committed) {
    addItem(inventory, itemId, 1);
    notify("Could not place: the tile changed or the connection failed. Your seed/item was returned.");
    savePlayerState();
    return;
  }
  if (item.placesTile === 7) {
    if (metaRef) await runTransaction(metaRef, (current) => ({ ...(current ?? { name: requestedName, key: worldKey, ownerId: user.uid, createdAt: Date.now() }), lockedBy: user.uid }));
    worldLockedBy = user.uid;
    notify("World locked! Only you can build or break here now.");
  } else notify(craftedSeed ? `Crafted ${ITEM_DEFS[craftedSeed].name}!` : `Placed ${item.name}.`);
  savePlayerState();
}

function updateCamera(delta) { const viewWidth = canvas.width / zoom, viewHeight = canvas.height / zoom, desiredX = player.x + player.width / 2 - viewWidth / 2, desiredY = player.y + player.height / 2 - viewHeight / 2, maxX = Math.max(0, WORLD_WIDTH * TILE_SIZE - viewWidth), maxY = Math.max(0, WORLD_HEIGHT * TILE_SIZE - viewHeight); camera.x += (Math.max(0, Math.min(maxX, desiredX)) - camera.x) * Math.min(1, delta * 6); camera.y += (Math.max(0, Math.min(maxY, desiredY)) - camera.y) * Math.min(1, delta * 6); }
function lavaContact() { const left = Math.floor((player.x + 3) / TILE_SIZE), right = Math.floor((player.x + player.width - 3) / TILE_SIZE), top = Math.floor((player.y + 3) / TILE_SIZE), bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE); for (let y = top; y <= bottom; y += 1) for (let x = left; x <= right; x += 1) if (world.get(x, y) === 5) return { x, y }; return null; }
function checkLava(now) { const contact = lavaContact(); if (!contact) { lava.inside = false; return; } const fresh = !lava.inside; lava.inside = true; if (!fresh && now - lava.lastHitAt < 1000) return; lava.lastHitAt = now; lava.hits += 1; player.vy = -PHYSICS.jumpSpeed * 1.2; player.grounded = false; const lavaBelow = contact.y * TILE_SIZE + TILE_SIZE / 2 > player.y + player.height / 2 + 6; if (!lavaBelow) player.vx = (player.x + player.width / 2 >= contact.x * TILE_SIZE + TILE_SIZE / 2 ? 1 : -1) * PHYSICS.runSpeed * 1.2; if (lava.hits >= 4) { const spawn = respawnPoint(); player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0; lava.hits = 0; lava.inside = false; notify("The lava was too hot — you burned up and respawned at the door!"); savePlayerState(); } else notify(`Ouch! Lava burns! ${4 - lava.hits} lives left.`); }
function unstickPlayer() { if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) { const spawn = respawnPoint(); player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0; return; } const centerX = Math.floor((player.x + player.width / 2) / TILE_SIZE), centerY = Math.floor((player.y + player.height / 2) / TILE_SIZE); if (player.vy >= 0 && world.isSolid(centerX, centerY)) { player.y = centerY * TILE_SIZE - player.height - .01; player.vy = 0; } }
function playerSpecialTiles() { const tiles = []; const left = Math.floor((player.x + 3) / TILE_SIZE), right = Math.floor((player.x + player.width - 3) / TILE_SIZE), top = Math.floor((player.y + 3) / TILE_SIZE), bottom = Math.floor((player.y + player.height - 3) / TILE_SIZE); for (let y = top; y <= bottom; y += 1) for (let x = left; x <= right; x += 1) tiles.push({ x, y, tileId: world.get(x, y) }); return tiles; }
async function goToWorld(name) { const cleanName = String(name || "").trim(); if (!/^[A-Za-z0-9_-]{3,28}$/.test(cleanName)) { notify("That door needs a valid destination world."); return; } await savePlayerState(); if (presenceRef) await remove(presenceRef).catch(() => {}); if (gamePresenceRef) await remove(gamePresenceRef).catch(() => {}); const key = cleanName.toLowerCase(); window.location.assign(`world.html?world=${encodeURIComponent(key)}&name=${encodeURIComponent(cleanName)}`); }
function checkSpecialTiles() {
  const contacts = playerSpecialTiles();
  const checkpoint = contacts.find((tile) => tile.tileId === 60);
  if (checkpoint) {
    const key = `${checkpoint.x},${checkpoint.y}`;
    if (playerCheckpoint?.key !== key) { playerCheckpoint = { key, x: checkpoint.x * TILE_SIZE + 5, y: checkpoint.y * TILE_SIZE - player.height }; notify("Checkpoint activated!"); savePlayerState(); }
  }
  const door = contacts.find((tile) => tile.tileId === 58);
  if (!door) { lastDoorKey = ""; return; }
  const key = `${door.x},${door.y}`;
  if (key === lastDoorKey) return;
  lastDoorKey = key;
  const destination = world.blockSettings?.[key]?.destination;
  if (destination) goToWorld(destination);
  else notify("This World Door has no destination. Use the Wrench on it.");
}
function openDoorSettings(target) { doorSettingsTarget = { x: target.x, y: target.y }; const saved = world.blockSettings?.[`${target.x},${target.y}`]; doorDestination.value = saved?.destination || ""; doorSettings.hidden = false; stopBreaking(); doorDestination.focus(); }
function closeDoorSettings() { doorSettings.hidden = true; doorSettingsTarget = null; }
function offerLabel(offer) { return offer?.itemId && ITEM_DEFS[offer.itemId] ? `${offer.amount}× ${ITEM_DEFS[offer.itemId].name}` : "Nothing"; }
function fillTradeItems() {
  const previous = tradeItem.value;
  tradeItem.textContent = "";
  inventory.forEach((slot) => {
    const definition = ITEM_DEFS[slot?.itemId];
    if (!slot || !definition?.placesTile) return;
    const option = document.createElement("option");
    option.value = slot.itemId;
    option.textContent = `${definition.name} (${countItem(inventory, slot.itemId)} available)`;
    if (![...tradeItem.options].some((existing) => existing.value === option.value)) tradeItem.appendChild(option);
  });
  if ([...tradeItem.options].some((option) => option.value === previous)) tradeItem.value = previous;
}
async function requestTrade(uid, remote) {
  if (localMode) { notify("Trading is available in online worlds with other players."); return; }
  if (activeTrade) { notify("Finish your current trade first."); return; }
  const nextRef = push(ref(database, "trades"));
  await set(nextRef, { fromUid: user.uid, toUid: uid, fromName: username, toName: remote.username || "Player", status: "requested", world: worldKey, createdAt: Date.now(), offers: {}, locked: {}, claimed: {} });
  notify(`Trade request sent to ${remote.username || "player"}.`);
}
function renderTrade() {
  if (!activeTrade) { tradePanel.hidden = true; return; }
  tradePanel.hidden = false;
  const incoming = activeTrade.status === "requested" && activeTrade.toUid === user.uid;
  const waiting = activeTrade.status === "requested" && activeTrade.fromUid === user.uid;
  tradeRequestActions.hidden = !(incoming || waiting);
  tradeAccept.hidden = waiting;
  tradeDecline.textContent = waiting ? "Cancel request" : "Decline";
  tradeActive.hidden = activeTrade.status !== "active";
  if (incoming) tradeMessage.textContent = `${activeTrade.fromName} wants to trade with you.`;
  else if (waiting) tradeMessage.textContent = `Waiting for ${activeTrade.toName} to accept your trade request.`;
  else if (activeTrade.status === "active") {
    const otherUid = activeTrade.fromUid === user.uid ? activeTrade.toUid : activeTrade.fromUid;
    const otherName = activeTrade.fromUid === user.uid ? activeTrade.toName : activeTrade.fromName;
    tradeMessage.textContent = `Trading with ${otherName}.`;
    tradeMyOffer.textContent = offerLabel(activeTrade.offers?.[user.uid]);
    tradeTheirOffer.textContent = offerLabel(activeTrade.offers?.[otherUid]);
    fillTradeItems();
    const mineLocked = Boolean(activeTrade.locked?.[user.uid]);
    const anyLocked = Object.values(activeTrade.locked ?? {}).some(Boolean);
    tradeLock.disabled = mineLocked || !activeTrade.offers?.[user.uid];
    tradeLock.textContent = mineLocked ? "Offer locked" : "Lock my offer";
    tradeOfferForm.querySelectorAll("input, select, button").forEach((element) => { element.disabled = mineLocked; });
    tradeCancel.disabled = anyLocked;
    if (activeTrade.locked?.[user.uid] && activeTrade.locked?.[otherUid] && !activeTrade.claimed?.[user.uid]) claimTrade(otherUid);
  }
}
async function claimTrade(otherUid) {
  const offer = activeTrade?.offers?.[otherUid];
  if (!offer) return;
  const staged = inventory.map((slot) => slot ? { ...slot } : null);
  if (!addItem(staged, offer.itemId, offer.amount)) { notify("Make inventory room to receive the other trade offer."); return; }
  const claimedRef = ref(database, `trades/${activeTradeRef.key}/claimed/${user.uid}`);
  const claimed = await runTransaction(claimedRef, (current) => current ? undefined : true);
  if (!claimed.committed) return;
  inventory = staged;
  await savePlayerState();
  const latest = (await get(activeTradeRef)).val();
  if (latest?.claimed?.[latest.fromUid] && latest?.claimed?.[latest.toUid]) await update(activeTradeRef, { status: "completed", completedAt: Date.now() });
  notify(`Trade received: ${offerLabel(offer)}.`);
}
function watchTrades() {
  if (localMode || tradeSubscription) return;
  tradeSubscription = onValue(ref(database, "trades"), (snapshot) => {
    const entries = Object.entries(snapshot.val() ?? {}).filter(([, trade]) => (trade.fromUid === user.uid || trade.toUid === user.uid) && !["completed", "cancelled", "declined"].includes(trade.status));
    if (!entries.length) { activeTrade = null; activeTradeRef = null; renderTrade(); return; }
    const [id, trade] = entries.sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))[0];
    activeTrade = trade;
    activeTradeRef = ref(database, `trades/${id}`);
    renderTrade();
  });
}
async function useWrenchAtPointer() {
  const worldX = input.pointer.x / zoom + camera.x, worldY = input.pointer.y / zoom + camera.y;
  for (const [uid, remote] of Object.entries(remotePlayers)) {
    if (uid === user.uid || !isFresh(remote)) continue;
    if (worldX >= remote.x && worldX <= remote.x + 22 && worldY >= remote.y && worldY <= remote.y + TILE_SIZE) { await requestTrade(uid, remote); return true; }
  }
  const target = tileTarget();
  if (target.reachable && target.tileId === 58) { if (!canBuild()) { notify("Only the world lock owner can change this door."); return true; } openDoorSettings(target); return true; }
  notify("Use the Wrench on a World Door or another player.");
  return true;
}
function buy(offer) { if (!offer) return; if (countItem(inventory, "gems") < offer.cost) { notify("Not enough Sky Gems."); return; } if (offer.item === "seed_package") {
    const pool = Object.keys(ITEM_DEFS).filter(id => id.endsWith("_seed"));
    // Stage the complete purchase so a full bag never charges for a partial pack.
    const next = inventory.map(slot => slot ? { ...slot } : null);
    removeItem(next, "gems", offer.cost);
    const rewards = [];
    for (let i = 0; i < offer.amount; i += 1) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (!addItem(next, item, 1)) { notify("Make room for 3 random seeds. No gems were spent."); return; }
      const existing = rewards.find(reward => reward.item === item);
      if (existing) existing.amount += 1;
      else rewards.push({ item, amount: 1 });
    }
    inventory = next;
    notify("Seed package: " + formatDrops(rewards) + ".");
    savePlayerState();
    return;
  } if (offer.item === "inventory_slots") { if (inventorySize >= MAX_INVENTORY_SIZE) { notify("Your inventory is fully upgraded."); return; } removeItem(inventory, "gems", offer.cost); const before = inventory.length; inventorySize = Math.min(MAX_INVENTORY_SIZE, inventorySize + offer.amount); while (inventory.length < inventorySize) inventory.push(null); notify(`Bought ${inventorySize - before} more inventory slots!`); savePlayerState(); return; } if (offer.item === "pickaxe" && countItem(inventory, "pickaxe") > 0) { notify("You already own a Pickaxe."); return; } removeItem(inventory, "gems", offer.cost); if (!addItem(inventory, offer.item, offer.amount)) { addItem(inventory, "gems", offer.cost); notify("Your inventory is full."); return; } notify(`Bought ${offer.amount}× ${ITEM_DEFS[offer.item].name}.`); savePlayerState(); }
function moveInventorySlot(from, to) { if (from === to) return; const source = inventory[from], target = inventory[to]; if (!source) return; if (!target) { inventory[to] = source; inventory[from] = null; } else if (target.itemId === source.itemId) { const total = Math.min(999, source.count + target.count); const moved = total - target.count; target.count = total; source.count -= moved; if (source.count <= 0) inventory[from] = null; } else { inventory[to] = source; inventory[from] = target; } savePlayerState(); }
function drawWorld() { drawSky(context, assets, camera, canvas.width, canvas.height, world.worldType); const viewWidth = canvas.width / zoom, viewHeight = canvas.height / zoom; const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1), endX = Math.min(WORLD_WIDTH, Math.ceil((camera.x + viewWidth) / TILE_SIZE) + 1), startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1), endY = Math.min(WORLD_HEIGHT, Math.ceil((camera.y + viewHeight) / TILE_SIZE) + 1); context.save(); context.scale(zoom, zoom); for (let y = startY; y < endY; y += 1) for (let x = startX; x < endX; x += 1) drawTile(context, assets, world.get(x, y), x * TILE_SIZE - camera.x, y * TILE_SIZE - camera.y); Object.entries(remotePlayers).forEach(([uid, remote]) => { if (uid !== user.uid && isFresh(remote)) drawPlayer(context, { x: remote.x, y: remote.y, width: 22, height: TILE_SIZE, facing: remote.facing || 1 }, camera, remote.username, true); }); drawPlayer(context, player, camera, username); const target = tileTarget(); drawCrosshair(context, target, camera, target.reachable); context.restore(); drawHotbar(context, assets, inventory, selectedSlot, canvas.width, canvas.height); drawHud(context, assets, { inventory, selectedSlot, toast, target, breaking, worldName: requestedName, online: onlineCount(), lavaHits: lava.hits }, canvas.width); invLayout = inventoryOpen ? drawInventoryPanel(context, assets, inventory, selectedSlot, canvas.width, canvas.height, drag.from >= 0 ? { from: drag.from, pointer: input.pointer } : null) : null; shopLayout = shopOpen ? drawShop(context, assets, inventory, canvas.width, canvas.height) : null; }
function frame(now) { if (!running) return; const delta = Math.min(.033, (now - lastFrame) / 1000 || 0); lastFrame = now; const modalOpen = !doorSettings.hidden || !tradePanel.hidden || recipesOpen; if (!shopOpen && !modalOpen) { updatePlayer(player, world, input, delta); checkLava(now); unstickPlayer(); checkSpecialTiles(); } input.jumpPressed = false; updateCamera(delta); updateBreaking(now, tileTarget()); toast.timeLeft = Math.max(0, toast.timeLeft - delta); if (now - lastPlayerSave > 250) { lastPlayerSave = now; savePlayerState(); updatePresence(); } if (now - lastPlantCheck > 1500 && !pendingWorldChange) { lastPlantCheck = now; mutateWorld((next) => { next.updatePlants(); next.updateFlowers(); }); } drawWorld(); requestAnimationFrame(frame); }
async function enterWorld() { if (!worldKey || !/^[a-z0-9_-]{3,28}$/.test(worldKey)) { fail("This world name is invalid. Return to the World Gate and enter a valid name."); return; } const profile = (await get(ref(database, `users/${user.uid}/profile`))).val(); username = profile?.username ?? user.displayName ?? user.email?.split("@")[0] ?? "Explorer"; worldStateRef = ref(database, `worlds/${worldKey}/state`); playerStateRef = ref(database, `users/${user.uid}/worlds/${worldKey}`); inventoryRef = ref(database, `users/${user.uid}/inventory`); presenceRef = ref(database, `worlds/${worldKey}/presence/${user.uid}`); gamePresenceRef = ref(database, `gamePresence/${user.uid}`); metaRef = ref(database, `worlds/${worldKey}/meta`); await runTransaction(metaRef, (current) => current ?? { name: requestedName, key: worldKey, ownerId: user.uid, createdAt: Date.now() }); worldLockedBy = ((await get(metaRef)).val() ?? {}).lockedBy ?? null; await runTransaction(worldStateRef, (current) => current ?? generateWorld(worldKey).serialize()); const savedPlayer = (await get(playerStateRef)).val(); world = World.fromSave((await get(worldStateRef)).val()) ?? generateWorld(worldKey); playerCheckpoint = savedPlayer?.checkpoint ?? null; let savedInventory = (await get(inventoryRef)).val(); let sourceSelected = savedInventory?.selectedSlot;
  if (!Array.isArray(savedInventory?.slots)) {
    // One-time migration: the account inventory does not exist yet, so merge every
    // old per-world inventory into one, then delete the stale per-world copies.
    const oldWorlds = (await get(ref(database, `users/${user.uid}/worlds`))).val() ?? {};
    const merged = [];
    let maxSize = INVENTORY_SIZE;
    Object.values(oldWorlds).forEach((entry) => {
      if (Array.isArray(entry?.inventory)) merged.push(...entry.inventory);
      if (Number.isFinite(entry?.inventorySize)) maxSize = Math.max(maxSize, entry.inventorySize);
      if (Number.isFinite(entry?.selectedSlot)) sourceSelected = Math.max(sourceSelected ?? 0, entry.selectedSlot);
    });
    savedInventory = { slots: merged, size: maxSize };
    const cleanup = {};
    Object.keys(oldWorlds).forEach((key) => { cleanup[`${key}/inventory`] = null; cleanup[`${key}/inventorySize`] = null; cleanup[`${key}/selectedSlot`] = null; });
    if (Object.keys(cleanup).length) await update(ref(database, `users/${user.uid}/worlds`), cleanup).catch(() => {});
  }
  inventorySize = Math.max(INVENTORY_SIZE, Math.min(MAX_INVENTORY_SIZE, Math.floor(savedInventory?.size) || INVENTORY_SIZE)); inventory = createInventory(savedInventory?.slots ?? null, inventorySize); let grantedDoor = false; if (!world.foreground.includes(6) && !inventory.some((slot) => slot?.itemId === "white_door")) { addItem(inventory, "white_door", 1); grantedDoor = true; } if (!inventory.some((slot) => slot?.itemId === "wrench")) addItem(inventory, "wrench", 1); const spawn = respawnPoint(); player = createPlayer(savedPlayer?.player?.x ?? spawn.x, savedPlayer?.player?.y ?? spawn.y); selectedSlot = Math.min(Math.max(0, sourceSelected ?? 0), inventory.length - 1); onValue(worldStateRef, (snapshot) => { const next = World.fromSave(snapshot.val()); if (next) world = next; }); onValue(ref(database, `worlds/${worldKey}/presence`), (snapshot) => { remotePlayers = snapshot.val() ?? {}; }); await onDisconnect(presenceRef).remove(); await onDisconnect(gamePresenceRef).remove(); await updatePresence(); await update(ref(database, `users/${user.uid}`), { lastWorld: worldKey, lastSeenAt: Date.now() }); watchTrades(); assets = await loadAssets(); resize(); running = true; loadingCard.classList.add("is-hidden"); if (grantedDoor) notify("You received a White Door and Wrench."); else if (worldLockedBy && worldLockedBy !== user.uid) notify("This world is locked — you can look around but not build."); lastFrame = performance.now(); requestAnimationFrame(frame); }

async function enterLocalWorld() {
  if (!worldKey || !/^[a-z0-9_-]{3,28}$/.test(worldKey)) { fail("This world name is invalid."); return; }
  user = { uid: "local" };
  username = localStorage.getItem("buildtopiaLocalName") || "Local Explorer";
  const savedWorld = JSON.parse(localStorage.getItem(`buildtopiaWorld:${worldKey}`) || "null");
  world = World.fromSave(savedWorld) ?? generateWorld(worldKey);
  const savedPlayer = JSON.parse(localStorage.getItem(`buildtopiaPlayer:${worldKey}`) || "null");
  const savedInventory = JSON.parse(localStorage.getItem("buildtopiaLocalInventory") || "null");
  playerCheckpoint = savedPlayer?.checkpoint ?? null;
  inventorySize = Math.max(INVENTORY_SIZE, Math.min(MAX_INVENTORY_SIZE, Math.floor(savedInventory?.size) || INVENTORY_SIZE));
  inventory = createInventory(savedInventory?.slots ?? null, inventorySize);
  if (!inventory.some((slot) => slot?.itemId === "wrench")) addItem(inventory, "wrench", 1);
  if (!world.foreground.includes(6) && !inventory.some((slot) => slot?.itemId === "white_door")) addItem(inventory, "white_door", 1);
  const spawn = respawnPoint();
  player = createPlayer(savedPlayer?.player?.x ?? spawn.x, savedPlayer?.player?.y ?? spawn.y);
  selectedSlot = Math.min(Math.max(0, savedInventory?.selectedSlot ?? 0), inventory.length - 1);
  const localWorlds = JSON.parse(localStorage.getItem("buildtopiaLocalWorlds") || "{}");
  localWorlds[worldKey] = { worldName: requestedName, updatedAt: Date.now() };
  localStorage.setItem("buildtopiaLocalWorlds", JSON.stringify(localWorlds));
  localStorage.setItem(`buildtopiaWorld:${worldKey}`, JSON.stringify(world.serialize()));
  assets = await loadAssets(); resize(); running = true; loadingCard.classList.add("is-hidden"); notify("Local mode: progress is saved on this device."); lastFrame = performance.now(); requestAnimationFrame(frame);
}

window.addEventListener("resize", resize); window.addEventListener("beforeunload", () => { savePlayerState(); });
window.addEventListener("keydown", (event) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault(); if (event.key === "a" || event.key === "ArrowLeft") input.left = true; if (event.key === "d" || event.key === "ArrowRight") input.right = true; if (["w", "W", "ArrowUp", " "].includes(event.key)) { if (!event.repeat) input.jumpPressed = true; input.jumpHeld = true; } if (/^[1-5]$/.test(event.key)) selectedSlot = Number(event.key) - 1; if ((event.key === "e" || event.key === "E") && !event.repeat) placeSelected(); if ((event.key === "i" || event.key === "I") && !event.repeat) setInventoryOpen(!inventoryOpen); if (event.key === "+" || event.key === "=") setZoom(zoom * 1.15); if (event.key === "-" || event.key === "_") setZoom(zoom / 1.15); if (event.key === "Escape") { setShopOpen(false); setInventoryOpen(false); setRecipesOpen(false); closeDoorSettings(); } });
window.addEventListener("keyup", (event) => { if (["w", "W", "ArrowUp", " "].includes(event.key)) input.jumpHeld = false; if (event.key === "a" || event.key === "ArrowLeft") input.left = false; if (event.key === "d" || event.key === "ArrowRight") input.right = false; });
window.addEventListener("pointerup", (event) => { if (drag.from < 0) return; pointerPosition(event); const hit = inventoryOpen && invLayout ? invLayout.slots.find((slot) => input.pointer.x >= slot.x && input.pointer.x <= slot.x + slot.size && input.pointer.y >= slot.y && input.pointer.y <= slot.y + slot.size) : null; if (hit && hit.index !== drag.from) moveInventorySlot(drag.from, hit.index); drag.from = -1; });
canvas.addEventListener("pointermove", pointerPosition); canvas.addEventListener("pointerdown", (event) => { event.preventDefault(); pointerPosition(event); canvas.focus(); if (!running || recipesOpen || !doorSettings.hidden || !tradePanel.hidden) return; if (shopOpen) { buy(shopOfferAt(input.pointer, shopLayout)); return; } if (inventoryOpen) { if (invLayout) { const hit = invLayout.slots.find((slot) => input.pointer.x >= slot.x && input.pointer.x <= slot.x + slot.size && input.pointer.y >= slot.y && input.pointer.y <= slot.y + slot.size); if (hit) { drag.from = hit.index; selectedSlot = hit.index; } else if (input.pointer.x < invLayout.x || input.pointer.x > invLayout.x + invLayout.width || input.pointer.y < invLayout.y || input.pointer.y > invLayout.y + invLayout.height) setInventoryOpen(false); } return; } if (inventory[selectedSlot]?.itemId === "wrench") { useWrenchAtPointer(); return; } if (event.button === 0 || event.pointerType === "touch") { const target = tileTarget(); if (target.tileId === 6 && target.reachable) { leaveToWorldGate(); return; } if (event.pointerType === "touch") { const selectedItem = ITEM_DEFS[inventory[selectedSlot]?.itemId]; const canSplice = selectedItem?.placesTile && spliceResult(target.tileId, selectedItem.placesTile); if (!target.tileId || canSplice) { placeSelected(); return; } } input.pointerDown = true; canvas.setPointerCapture?.(event.pointerId); } }); canvas.addEventListener("pointerup", () => { input.pointerDown = false; stopBreaking(); }); canvas.addEventListener("pointercancel", () => { input.pointerDown = false; stopBreaking(); }); canvas.addEventListener("contextmenu", (event) => { event.preventDefault(); if (inventory[selectedSlot]?.itemId === "wrench") useWrenchAtPointer(); else placeSelected(); });
canvas.addEventListener("wheel", (event) => { event.preventDefault(); setZoom(zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)); }, { passive: false });
shopButton.addEventListener("click", () => setShopOpen(!shopOpen)); bagButton.addEventListener("click", () => setInventoryOpen(!inventoryOpen)); recipesButton.addEventListener("click", () => setRecipesOpen(!recipesOpen)); recipesClose.addEventListener("click", () => setRecipesOpen(false)); leaveButton.addEventListener("click", leaveToWorldGate);
doorSettingsClose.addEventListener("click", closeDoorSettings);
doorSettingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const destination = doorDestination.value.trim();
  if (!/^[A-Za-z0-9_-]{3,28}$/.test(destination) || !doorSettingsTarget) { notify("Use 3–28 letters, numbers, hyphens, or underscores."); return; }
  const { x, y } = doorSettingsTarget;
  const saved = await mutateWorld((next) => { if (next.get(x, y) !== 58) return false; next.blockSettings[`${x},${y}`] = { destination, updatedBy: user.uid, updatedAt: Date.now() }; });
  if (saved) { closeDoorSettings(); notify(`Door destination set to ${destination}.`); }
});
tradeAccept.addEventListener("click", async () => { if (activeTradeRef) await update(activeTradeRef, { status: "active", acceptedAt: Date.now() }); });
tradeDecline.addEventListener("click", async () => { if (activeTradeRef) await update(activeTradeRef, { status: activeTrade?.fromUid === user.uid ? "cancelled" : "declined", endedAt: Date.now() }); });
tradeCancel.addEventListener("click", async () => { if (activeTradeRef && !Object.values(activeTrade?.locked ?? {}).some(Boolean)) await update(activeTradeRef, { status: "cancelled", endedAt: Date.now() }); });
tradeOfferForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const itemId = tradeItem.value, amount = Math.max(1, Math.floor(Number(tradeAmount.value) || 1));
  if (!ITEM_DEFS[itemId]?.placesTile || countItem(inventory, itemId) < amount) { notify("You do not have that many blocks."); return; }
  await update(activeTradeRef, { [`offers/${user.uid}`]: { itemId, amount }, [`locked/${user.uid}`]: null, [`claimed/${user.uid}`]: null });
});
tradeLock.addEventListener("click", async () => {
  const offer = activeTrade?.offers?.[user.uid];
  if (!offer || activeTrade?.locked?.[user.uid]) return;
  if (!removeItem(inventory, offer.itemId, offer.amount)) { notify("You no longer have enough of that block."); return; }
  try { await savePlayerState(); await update(activeTradeRef, { [`locked/${user.uid}`]: true, [`lockedAt/${user.uid}`]: Date.now() }); }
  catch { addItem(inventory, offer.itemId, offer.amount); await savePlayerState(); notify("Could not lock the trade offer."); }
});
document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  button.style.touchAction = "none";
  const down = (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (control === "jump") { input.jumpPressed = true; input.jumpHeld = true; }
    else input[control] = true;
  };
  const up = (event) => {
    event.preventDefault();
    if (control === "jump") input.jumpHeld = false;
    else if (control === "left" || control === "right") input[control] = false;
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("lostpointercapture", up);
});

Object.entries(SEED_RECIPES).forEach(([pair, result]) => {
  const [first, second] = pair.split("+").map(Number);
  const row = document.createElement("div");
  row.className = "recipe-row";
  const ingredients = document.createElement("span");
  ingredients.textContent = `${TILE_DEFS[first].name} + ${TILE_DEFS[second].name}`;
  const arrow = document.createElement("span");
  arrow.className = "recipe-arrow";
  arrow.textContent = "→";
  const output = document.createElement("strong");
  output.textContent = ITEM_DEFS[result].name;
  row.append(ingredients, arrow, output);
  recipesList.appendChild(row);
});
function resetControls() {
  input.left = input.right = input.jumpHeld = input.jumpPressed = input.pointerDown = false;
  if (player) { player.jumpBuffer = 0; player.coyoteTime = 0; }
}
window.addEventListener("blur", resetControls);
document.addEventListener("visibilitychange", () => { if (document.hidden) resetControls(); });

if (localMode) enterLocalWorld().catch((error) => fail(error.message));
else if (!firebaseConfigured) fail("Add your Firebase project settings to firebase-config.js, then refresh.");
else onAuthStateChanged(auth, (nextUser) => { if (!nextUser) window.location.replace("index.html"); else { user = nextUser; enterWorld().catch((error) => fail(error.message)); } });
