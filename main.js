import { loadAssets } from "./assets.js";
import { HOTBAR_SIZE, REACH, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { ITEM_DEFS, TILE_DEFS } from "./definitions.js";
import { addItem, countItem, createInventory, removeItem } from "./inventory.js";
import { createPlayer, playerOverlapsTile, updatePlayer } from "./player.js";
import { drawCrosshair, drawHotbar, drawHud, drawPlayer, drawShop, drawSky, drawTile, shopOfferAt } from "./ui.js";
import { World, clearSave, generateWorld, loadSave, saveGame } from "./world.js";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const intro = document.querySelector("#intro-card");
const playButton = document.querySelector("#play-button");
const shopButton = document.querySelector("#shop-button");

let assets;
let world;
let inventory;
let player;
let running = false;
let lastFrame = 0;
let lastSave = 0;
let selectedSlot = 0;
let shopOpen = false;
let shopLayout = null;
const camera = { x: 0, y: 0 };
const input = { left: false, right: false, jumpPressed: false, pointerDown: false, pointer: { x: 0, y: 0 } };
const breaking = { active: false, x: -1, y: -1, startedAt: 0, progress: 0 };
const toast = { message: "", timeLeft: 0 };

function resize() {
  canvas.width = Math.max(320, window.innerWidth);
  canvas.height = Math.max(320, window.innerHeight);
  context.imageSmoothingEnabled = false;
}

function stateFromSave() {
  const saved = loadSave();
  const restoredWorld = saved ? World.fromSave(saved.world ?? {}) : null;
  world = restoredWorld ?? generateWorld();
  inventory = createInventory(saved?.inventory);
  const surface = world.surface[18] || 39;
  player = createPlayer(saved?.player?.x ?? 18 * TILE_SIZE, saved?.player?.y ?? (surface - 3) * TILE_SIZE);
  player.vx = 0;
  player.vy = 0;
  selectedSlot = Math.min(Math.max(0, saved?.selectedSlot ?? 0), HOTBAR_SIZE - 1);
  notify(restoredWorld ? "World restored — crops kept growing." : "Welcome to your new sky world!");
}

function save() {
  if (!world || !player) return;
  saveGame({ world: world.serialize(), inventory, player: { x: player.x, y: player.y }, selectedSlot });
  lastSave = performance.now();
}

function notify(message) {
  toast.message = message;
  toast.timeLeft = 2.4;
}

function tileTarget() {
  const x = Math.floor((input.pointer.x + camera.x) / TILE_SIZE);
  const y = Math.floor((input.pointer.y + camera.y) / TILE_SIZE);
  const inBounds = x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  const centerX = x * TILE_SIZE + TILE_SIZE / 2;
  const centerY = y * TILE_SIZE + TILE_SIZE / 2;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const reachable = Math.hypot(centerX - playerCenterX, centerY - playerCenterY) <= REACH;
  return { x, y, inBounds, reachable, tileId: inBounds ? world.get(x, y) : 0 };
}

function stopBreaking() {
  breaking.active = false;
  breaking.progress = 0;
  breaking.x = -1;
  breaking.y = -1;
}

function dropsFor(definition) {
  const source = definition.harvest?.drops ?? definition.drops ?? [];
  return source.map((drop) => {
    if (drop.chance && Math.random() > drop.chance) return null;
    const amount = drop.min ? Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min : drop.count ?? 1;
    return { item: drop.item, amount };
  }).filter(Boolean);
}

function completeBreak(target) {
  const definition = TILE_DEFS[target.tileId];
  if (!definition || definition.unbreakable) return;
  world.set(target.x, target.y, 0);
  world.removePlant(target.x, target.y);
  const drops = dropsFor(definition);
  drops.forEach((drop) => addItem(inventory, drop.item, drop.amount));
  const message = definition.harvest ? `Harvested ${definition.name}!` : `Mined ${definition.name}.`;
  notify(message);
  save();
}

function updateBreaking(now, target) {
  if (!input.pointerDown || !target.inBounds || !target.reachable || target.tileId === 0 || shopOpen) {
    stopBreaking();
    return;
  }
  const definition = TILE_DEFS[target.tileId];
  if (!definition || definition.unbreakable) { stopBreaking(); return; }
  if (!breaking.active || breaking.x !== target.x || breaking.y !== target.y) {
    Object.assign(breaking, { active: true, x: target.x, y: target.y, startedAt: now, progress: 0 });
  }
  breaking.progress = (now - breaking.startedAt) / definition.breakTime;
  if (breaking.progress >= 1) {
    completeBreak(target);
    stopBreaking();
  }
}

function placeSelected() {
  if (shopOpen) return;
  const target = tileTarget();
  const slot = inventory[selectedSlot];
  if (!target.inBounds || !target.reachable || !slot) return;
  const item = ITEM_DEFS[slot.itemId];
  if (!item.placesTile) { notify("That item cannot be placed."); return; }
  if (world.get(target.x, target.y) !== 0) { notify("That space is occupied."); return; }
  if (playerOverlapsTile(player, target.x, target.y)) { notify("Give yourself a little room."); return; }
  if (!removeItem(inventory, slot.itemId, 1)) return;
  if (TILE_DEFS[item.placesTile].growTime) world.plant(target.x, target.y, item.placesTile);
  else world.set(target.x, target.y, item.placesTile);
  notify(`Placed ${item.name}.`);
  save();
}

function nearShop() {
  const target = tileTarget();
  return target.reachable && TILE_DEFS[target.tileId]?.shop;
}

function toggleShop() {
  if (!shopOpen && !nearShop()) { notify("Point at the Sky Market and press E."); return; }
  shopOpen = !shopOpen;
  shopButton.setAttribute("aria-expanded", String(shopOpen));
  shopButton.textContent = shopOpen ? "Close market" : "Sky Market";
  stopBreaking();
}

function openShopFromUi() {
  shopOpen = !shopOpen;
  shopButton.setAttribute("aria-expanded", String(shopOpen));
  shopButton.textContent = shopOpen ? "Close market" : "Sky Market";
  stopBreaking();
}

function buy(offer) {
  if (!offer) return;
  if (countItem(inventory, "gems") < offer.cost) { notify("Not enough Sky Gems."); return; }
  removeItem(inventory, "gems", offer.cost);
  if (!addItem(inventory, offer.item, offer.amount)) {
    addItem(inventory, "gems", offer.cost);
    notify("Your inventory is full.");
    return;
  }
  notify(`Bought ${offer.amount}× ${ITEM_DEFS[offer.item].name}.`);
  save();
}

function updateCamera(delta) {
  const desiredX = player.x + player.width / 2 - canvas.width / 2;
  const desiredY = player.y + player.height / 2 - canvas.height * .58;
  const maxX = Math.max(0, WORLD_WIDTH * TILE_SIZE - canvas.width);
  const maxY = Math.max(0, WORLD_HEIGHT * TILE_SIZE - canvas.height);
  camera.x += (Math.max(0, Math.min(maxX, desiredX)) - camera.x) * Math.min(1, delta * 6);
  camera.y += (Math.max(0, Math.min(maxY, desiredY)) - camera.y) * Math.min(1, delta * 6);
}

function drawWorld() {
  drawSky(context, assets, camera, canvas.width, canvas.height);
  const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
  const endX = Math.min(WORLD_WIDTH, Math.ceil((camera.x + canvas.width) / TILE_SIZE) + 1);
  const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
  const endY = Math.min(WORLD_HEIGHT, Math.ceil((camera.y + canvas.height) / TILE_SIZE) + 1);
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const dx = x * TILE_SIZE - camera.x;
      const dy = y * TILE_SIZE - camera.y;
      drawTile(context, assets, world.getBackground(x, y), dx, dy, TILE_SIZE, true);
    }
  }
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const dx = x * TILE_SIZE - camera.x;
      const dy = y * TILE_SIZE - camera.y;
      drawTile(context, assets, world.get(x, y), dx, dy);
    }
  }
  drawPlayer(context, player, camera);
  const target = tileTarget();
  drawCrosshair(context, target, camera, target.reachable);
  drawHotbar(context, assets, inventory, selectedSlot, canvas.width, canvas.height);
  drawHud(context, assets, { inventory, selectedSlot, toast, target, breaking }, canvas.width);
  if (shopOpen) shopLayout = drawShop(context, assets, inventory, canvas.width, canvas.height);
  else shopLayout = null;
}

function frame(now) {
  if (!running) return;
  const delta = Math.min(.033, (now - lastFrame) / 1000 || 0);
  lastFrame = now;
  if (!shopOpen) updatePlayer(player, world, input, delta);
  input.jumpPressed = false;
  const grew = world.updatePlants();
  if (grew) { notify(grew === 1 ? "A crop is ready to harvest!" : `${grew} crops are ready to harvest!`); save(); }
  updateCamera(delta);
  updateBreaking(now, tileTarget());
  toast.timeLeft = Math.max(0, toast.timeLeft - delta);
  if (now - lastSave > 12000) save();
  drawWorld();
  requestAnimationFrame(frame);
}

function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  input.pointer.x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  input.pointer.y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
}

function start() {
  if (running) return;
  running = true;
  intro.classList.add("is-hidden");
  shopButton.hidden = false;
  canvas.focus();
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("beforeunload", save);
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault();
  if (event.key === "a" || event.key === "ArrowLeft") input.left = true;
  if (event.key === "d" || event.key === "ArrowRight") input.right = true;
  if ((event.key === "w" || event.key === "ArrowUp" || event.key === " ") && !event.repeat) input.jumpPressed = true;
  if (/^[1-8]$/.test(event.key)) selectedSlot = Number(event.key) - 1;
  if ((event.key === "e" || event.key === "E") && !event.repeat) {
    if (nearShop() || shopOpen) toggleShop();
    else placeSelected();
  }
  if (event.key === "Escape" && shopOpen) openShopFromUi();
  if (event.key === "r" || event.key === "R") {
    if (confirm("Start a fresh Buildtopia world? Your current saved world will be replaced.")) {
      clearSave();
      stateFromSave();
      if (shopOpen) openShopFromUi();
      save();
    }
  }
});
window.addEventListener("keyup", (event) => {
  if (event.key === "a" || event.key === "ArrowLeft") input.left = false;
  if (event.key === "d" || event.key === "ArrowRight") input.right = false;
});
canvas.addEventListener("mousemove", pointerPosition);
canvas.addEventListener("mousedown", (event) => {
  pointerPosition(event);
  canvas.focus();
  if (!running) return;
  if (shopOpen) { buy(shopOfferAt(input.pointer, shopLayout)); return; }
  if (event.button === 0) input.pointerDown = true;
  if (event.button === 2) placeSelected();
});
canvas.addEventListener("mouseup", (event) => {
  if (event.button === 0) { input.pointerDown = false; stopBreaking(); }
});
canvas.addEventListener("mouseleave", () => { input.pointerDown = false; stopBreaking(); });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
playButton.addEventListener("click", start);
shopButton.addEventListener("click", openShopFromUi);

async function bootstrap() {
  resize();
  try {
    assets = await loadAssets();
    stateFromSave();
  } catch (error) {
    intro.querySelector("p:not(.eyebrow)").textContent = "The game art could not load. Keep the texture images beside this page, then refresh.";
    playButton.disabled = true;
    console.error(error);
  }
}

bootstrap();
