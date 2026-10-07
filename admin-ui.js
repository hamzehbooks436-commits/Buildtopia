import { get, onValue, ref, set } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { ITEM_DEFS } from "./definitions.js";
import { isAdminAccount } from "./admin.js";
import { normalizeNpc, grantItems, applyNpcOffer, drawNpc, nearNpc, quantity } from "./npcs.js";
import { drawItemIcon } from "./ui.js";
import { REACH, WORLD_WIDTH, WORLD_HEIGHT } from "./config.js";
import { NPC_OUTFITS, NPC_OUTFIT_GROUPS, npcOutfit } from "./npc-outfits.js";

const catalog = Object.entries(ITEM_DEFS).sort((a, b) => a[1].name.localeCompare(b[1].name));
function node(tag, text, className) { const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el; }
function button(text, callback, className) { const el = node("button", text, className); el.type = "button"; el.addEventListener("click", callback); return el; }
function field(parent, label, input) { const el = node("label", label); el.append(input); parent.append(el); return input; }
function input(type, value, maxLength) { const el = node("input"); el.type = type; el.value = value ?? ""; if (maxLength) el.maxLength = maxLength; return el; }
function textArea(value) { const el = node("textarea"); el.value = value ?? ""; el.maxLength = 2000; el.rows = 3; return el; }
function itemSelect(value = "rock", entries = catalog) { const el = node("select"); for (const [id, def] of entries) { const option = node("option", def.name); option.value = id; el.append(option); } el.value = value; return el; }
function numberInput(value) { const el = input("number", value); el.min = "1"; el.step = "1"; el.required = true; return el; }
function itemsLabel(lines, alternatives = []) { return [...Object.values(lines ?? {}).map(line => `${line.amount.toLocaleString()} ${ITEM_DEFS[line.itemId]?.name ?? line.itemId}`), ...Object.values(alternatives).map(line => `${line.amount} ${line.label}`)].join(", ") || "Nothing"; }

export function createAdminTools(game) {
  const admin = isAdminAccount(game.user, game.localMode);
  let npcs = {}, activeNpcId = null, editingId = null, placing = false, busy = false, offerRows = [];
  const allNpcs = () => ({ ...npcs, ...(game.getWorld().familyNpcs ?? {}) });
  const panels = [];
  const root = document.querySelector(".game-shell");
  const npcRef = game.localMode ? null : ref(game.database, `worlds/${game.worldKey}/npcs`);
  function panel(title) {
    const el = node("section", null, "feature-panel admin-panel"); el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", title);
    const heading = node("div", null, "recipes-heading"); heading.append(node("h2", title), button("Close", close, "secondary-button")); el.append(heading); root.append(el); panels.push(el); return el;
  }
  const talk = panel("NPC conversation"), talkName = node("h3"), talkText = node("p", null, "npc-dialogue"), talkResponse = node("p", null, "npc-dialogue"), talkActions = node("div", null, "npc-actions"), talkStatus = node("p", null, "status-message");
  talk.append(talkName, talkText, talkActions, talkResponse, talkStatus);
  let market, editor, list, search, itemChoice, amount, icon, status, name, dialogue, x, y, skin, hair, outfit, outfitChoice, outfitGroup, outfitGallery, outfitDescription, hat, enabled, preview, offers, editorStatus, saveButton;
  function statusText(el, message, error = false) { el.textContent = message; el.classList.toggle("is-error", error); }
  function close() {
    if (busy) return;
    panels.forEach(p => p.hidden = true); activeNpcId = null; placing = false; game.resetInput(); game.focusCanvas();
  }
  function show(el) { panels.forEach(p => p.hidden = true); game.closeOverlays(); game.resetInput(); el.hidden = false; el.querySelector("input, textarea, select, button")?.focus(); }
  function isOpen() { return panels.some(p => !p.hidden); }
  function paintPreview() { drawItemIcon(icon.getContext("2d"), game.assets, itemChoice.value, 0, 0, 48); }
  function renderList() {
    list.replaceChildren();
    const entries = Object.entries(npcs);
    if (!entries.length) list.append(node("p", "No NPCs in this world yet. Place your first NPC."));
    for (const [id, npc] of entries) {
      const row = node("div", null, "npc-list-row"); row.append(node("span", `${npc.name} · tile ${npc.x}, ${npc.y}${npc.enabled ? "" : " · hidden"}`), button("Edit", () => openEditor(id))); list.append(row);
    }
  }
  async function grant() {
    if (!admin || busy) return;
    try {
      const itemId = itemChoice.value, qty = quantity(amount.value);
      if (ITEM_DEFS[itemId]?.npcOnly) throw new Error("This item is distributed only through NPC rewards.");
      busy = true;
      await game.changeInventory(saved => { const slots = grantItems(saved.slots, itemId, qty); return { ...saved, slots, size: Math.max(saved.size, slots.length) }; });
      statusText(status, `Added ${qty.toLocaleString()} ${ITEM_DEFS[itemId].name}. No gems spent.`);
    } catch (error) { statusText(status, error.message, true); } finally { busy = false; }
  }
  function rowGroup(parent, label, values) {
    const group = node("div", null, "npc-line-group"), rows = node("div", null, "npc-line-rows"); group.append(node("strong", label), rows);
    function add(value = {}) {
      const row = node("div", null, "npc-item-row"), select = itemSelect(value.itemId), qty = numberInput(value.amount ?? 1);
      select.setAttribute("aria-label", `${label} item`); qty.setAttribute("aria-label", `${label} quantity`);
      row.append(select, qty, button("Remove", () => row.remove(), "secondary-button")); rows.append(row);
    }
    group.append(button(`+ Add ${label.toLowerCase()} item`, () => add(), "secondary-button")); parent.append(group);
    for (const value of Object.values(values ?? {})) add(value);
    return () => [...rows.children].map(row => ({ itemId: row.querySelector("select").value, amount: quantity(row.querySelector("input").value) }));
  }
  function addOffer(id = crypto.randomUUID(), value = {}) {
    const card = node("fieldset", null, "npc-offer-editor"); card.append(node("legend", "Action / trade"));
    const label = field(card, "Button label", input("text", value.label ?? "", 80)); label.required = true;
    const response = field(card, "What the NPC says after completion", textArea(value.response));
    const repeatable = field(card, "Allow this action repeatedly", input("checkbox")); repeatable.checked = value.repeatable ?? true;
    const requires = rowGroup(card, "Player gives", value.requires), rewards = rowGroup(card, "NPC gives", value.rewards);
    card.append(button("Remove action", () => { card.remove(); offerRows = offerRows.filter(row => row.id !== id); }, "secondary-button"));
    offers.append(card); offerRows.push({ id, read: () => ({ label: label.value, response: response.value, repeatable: repeatable.checked, requires: requires(), rewards: rewards() }) });
  }
  function previewAppearance() { return { skin: skin.value, hair: hair.value, outfit: outfit.value, outfitId: outfitChoice.value, hat: hat.value }; }
  function previewNpc() {
    const ctx = preview.getContext("2d"); ctx.clearRect(0, 0, preview.width, preview.height); ctx.imageSmoothingEnabled = false;
    ctx.font = "800 11px system-ui"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(23,13,48,.78)";
    const label = name.value.trim() || "Your NPC"; ctx.strokeText(label, 72, 16, 136); ctx.fillStyle = "#fff3ad"; ctx.fillText(label, 72, 16, 136);
    drawNpc(ctx, previewAppearance(), (preview.width - 22 * 3) / 2, 36, 3);
    const selected = npcOutfit(outfitChoice.value);
    outfitDescription.textContent = `${selected.name} · ${NPC_OUTFIT_GROUPS.find(group => group.id === selected.group).name} outfit`;
    for (const card of outfitGallery.children) {
      const chosen = card.dataset.outfitId === outfitChoice.value;
      card.setAttribute("aria-pressed", String(chosen));
      const thumb = card.querySelector("canvas"), thumbCtx = thumb.getContext("2d"); thumbCtx.clearRect(0, 0, thumb.width, thumb.height); thumbCtx.imageSmoothingEnabled = false;
      drawNpc(thumbCtx, { ...previewAppearance(), outfitId: card.dataset.outfitId, outfit: chosen ? outfit.value : npcOutfit(card.dataset.outfitId).top }, (thumb.width - 22 * 1.4) / 2, 14, 1.4);
    }
  }
  function chooseOutfit(id) {
    const selected = npcOutfit(id); outfitChoice.value = selected.id; outfit.value = selected.top;
    if (outfitGroup.value !== selected.group) { outfitGroup.value = selected.group; renderOutfitGallery(); }
    previewNpc();
  }
  function renderOutfitGallery() {
    outfitGallery.replaceChildren();
    for (const clothing of NPC_OUTFITS.filter(entry => entry.group === outfitGroup.value)) {
      const card = button("", () => chooseOutfit(clothing.id), "npc-outfit-card"); card.dataset.outfitId = clothing.id; card.setAttribute("aria-label", `Wear ${clothing.name}`);
      const thumb = node("canvas"); thumb.width = 62; thumb.height = 74; thumb.setAttribute("aria-hidden", "true");
      card.append(thumb, node("span", clothing.name)); outfitGallery.append(card);
    }
    previewNpc();
  }
  function openEditor(id = null, position = null) {
    if (!admin || busy) return;
    editingId = id; placing = false;
    const npc = id ? npcs[id] : { name: "", dialogue: "", ...position, skin: "#f1c598", hair: "#543729", outfitId: "casual-tee", outfit: "#8df0a4", hat: "none", enabled: true };
    if (!npc) return;
    name.value = npc.name; dialogue.value = npc.dialogue; x.value = npc.x; y.value = npc.y; skin.value = npc.skin; hair.value = npc.hair; outfit.value = npc.outfit; hat.value = npc.hat; enabled.checked = npc.enabled;
    outfitChoice.value = npcOutfit(npc.outfitId).id; outfitGroup.value = npcOutfit(npc.outfitId).group; renderOutfitGallery();
    offers.replaceChildren(); offerRows = []; for (const [key, value] of Object.entries(npc.offers ?? {})) addOffer(key, value);
    editor.querySelector("[data-delete-npc]").hidden = !id;
    statusText(editorStatus, "Leave actions empty for a talking NPC. Add actions for info, rewards or trades."); previewNpc(); show(editor); name.focus();
  }
  function locationValid(npc, id) {
    if (game.getWorld().isSolid(npc.x, npc.y)) throw new Error("That tile is solid. Choose an empty or non-solid tile.");
    if (Object.entries(npcs).some(([key, value]) => key !== id && value.x === npc.x && value.y === npc.y)) throw new Error("Another NPC already occupies that tile.");
  }
  async function saveNpc(event) {
    event.preventDefault(); if (!admin || busy) return;
    try {
      const npc = normalizeNpc({ name: name.value, dialogue: dialogue.value, x: x.value, y: y.value, skin: skin.value, hair: hair.value, outfitId: outfitChoice.value, outfit: outfit.value, hat: hat.value, enabled: enabled.checked, offers: Object.fromEntries(offerRows.map(row => [row.id, row.read()])) });
      const id = editingId ?? crypto.randomUUID(); locationValid(npc, id); busy = true; saveButton.disabled = true;
      await set(ref(game.database, `worlds/${game.worldKey}/npcs/${id}`), { ...npc, updatedAt: Date.now(), updatedBy: game.user.uid });
      editingId = id; statusText(editorStatus, `${npc.name} saved. Players can tap the NPC to talk and trade.`); editor.querySelector("[data-delete-npc]").hidden = false;
    } catch (error) { statusText(editorStatus, error.message, true); } finally { busy = false; saveButton.disabled = false; }
  }
  async function deleteNpc() {
    if (!admin || !editingId || busy) return;
    // Hide instead of hard delete. The NPC remains recoverable in the editor.
    enabled.checked = false;
    await saveNpc({ preventDefault() {} });
  }
  function renderTalk() {
    const npc = allNpcs()[activeNpcId];
    if (!npc?.enabled) { if (activeNpcId) { busy = false; close(); game.notify("This NPC is no longer available."); } return; }
    talkName.textContent = npc.name; talkText.textContent = npc.dialogue || "Hello, explorer!"; talkActions.replaceChildren();
    for (const [offerId, offer] of Object.entries(npc.offers ?? {})) {
      const row = node("div", null, "npc-offer");
      const action = button(offer.label, () => performOffer(offerId));
      const claimKey = `${game.worldKey}_${activeNpcId}_${offerId}`;
      const claimed = !offer.repeatable && game.getInventorySave().npcClaims?.[claimKey];
      action.disabled = busy || claimed;
      if (claimed) action.textContent = `${offer.label} · Completed`;
      row.append(action, node("p", `You give: ${itemsLabel(offer.requires, offer.requiresAny)}`), node("p", `You receive: ${itemsLabel(offer.rewards)} · ${offer.repeatable ? "Repeatable" : "Once per player"}`)); talkActions.append(row);
    }
    if (admin && !npc.fixed) talkActions.append(button("Edit this NPC", () => openEditor(activeNpcId), "secondary-button"));
  }
  async function performOffer(offerId) {
    if (busy) return;
    const npcId = activeNpcId;
    try {
      busy = true; renderTalk();
      const npc = game.getWorld().familyNpcs?.[npcId] ?? (game.localMode ? npcs[npcId] : (await get(ref(game.database, `worlds/${game.worldKey}/npcs/${npcId}`))).val());
      const offer = npc?.offers?.[offerId];
      if (!npc?.enabled || !offer) throw new Error("This action is no longer available.");
      if (!nearNpc(game.getPlayer(), npc, REACH)) throw new Error("Move closer to this NPC first.");
      const requestId = crypto.randomUUID(), claimKey = `${game.worldKey}_${npcId}_${offerId}`;
      await game.changeInventory(saved => applyNpcOffer(saved, offer, claimKey, requestId));
      talkResponse.textContent = offer.response || "Done!";
      statusText(talkStatus, "Completed. Your items and rewards have been saved.");
    } catch (error) { statusText(talkStatus, error.message, true); } finally { busy = false; renderTalk(); }
  }
  if (admin) {
    market = panel("Admin · Blocks & NPCs"); market.id = "admin-market";
    market.append(node("p", "Take any item for free. Choose any whole quantity; admin stacks and bag space expand automatically."));
    const form = node("form", null, "panel-form"); search = field(form, "Search items", input("search", ""));
    itemChoice = field(form, "Item / block", itemSelect("rock", catalog.filter(([, def]) => !def.npcOnly))); amount = field(form, "Quantity", numberInput(1));
    icon = node("canvas"); icon.width = icon.height = 48; icon.setAttribute("aria-label", "Selected item preview");
    const grantButton = node("button", "Get items (free)"); grantButton.type = "submit"; form.append(icon, grantButton); market.append(form);
    status = node("p", null, "status-message"); status.setAttribute("aria-live", "polite"); market.append(status);
    form.addEventListener("submit", event => { event.preventDefault(); grant(); }); itemChoice.addEventListener("change", paintPreview);
    search.addEventListener("input", () => { const previous = itemChoice.value; itemChoice.replaceChildren(); for (const [id, def] of catalog.filter(([id, def]) => !def.npcOnly && `${def.name} ${id}`.toLowerCase().includes(search.value.toLowerCase()))) { const option = node("option", def.name); option.value = id; itemChoice.append(option); } if ([...itemChoice.options].some(o => o.value === previous)) itemChoice.value = previous; icon.getContext("2d").clearRect(0, 0, 48, 48); if (itemChoice.value) paintPreview(); grantButton.disabled = !itemChoice.value; });
    market.append(node("h3", "NPCs in this world"), button("+ Place NPC", () => { close(); placing = true; game.notify("Tap a clear tile in the world to place your NPC. Escape cancels."); })); list = node("div", null, "npc-list"); market.append(list);
    editor = panel("Customize NPC"); editor.id = "npc-editor";
    const editorForm = node("form", null, "panel-form"); name = field(editorForm, "Custom name (shown above the NPC)", input("text", "", 40)); name.required = true; name.placeholder = "Give your NPC a player-style name";
    dialogue = field(editorForm, "Greeting / dialogue", textArea());
    const coords = node("div", null, "npc-coordinates"); x = field(coords, "Tile X", input("number", 0)); y = field(coords, "Tile Y", input("number", 0)); x.min = y.min = 0; x.max = WORLD_WIDTH - 1; y.max = WORLD_HEIGHT - 1; x.step = y.step = 1; editorForm.append(coords);
    editorForm.append(node("h3", "Appearance & wardrobe"));
    const appearance = node("div", null, "npc-appearance"); skin = field(appearance, "Skin colour", input("color", "#f1c598")); hair = field(appearance, "Hair colour", input("color", "#543729")); outfit = field(appearance, "Outfit colour", input("color", "#8df0a4"));
    hat = node("select"); for (const text of ["none", "cap", "crown"]) { const option = node("option", text); option.value = text; hat.append(option); } field(appearance, "Hat", hat); editorForm.append(appearance);
    outfitChoice = node("select");
    for (const group of NPC_OUTFIT_GROUPS) {
      const options = node("optgroup"); options.label = `${group.name} · ${group.count} outfits`;
      for (const clothing of NPC_OUTFITS.filter(entry => entry.group === group.id)) { const option = node("option", clothing.name); option.value = clothing.id; options.append(option); }
      outfitChoice.append(options);
    }
    field(editorForm, `Outfit (${NPC_OUTFITS.length} styles)`, outfitChoice); outfitChoice.addEventListener("change", () => chooseOutfit(outfitChoice.value));
    const previewRow = node("div", null, "npc-preview-row"); preview = node("canvas"); preview.width = 144; preview.height = 160; preview.setAttribute("aria-label", "NPC appearance and custom name preview");
    const previewCopy = node("div"); outfitDescription = node("strong"); previewCopy.append(outfitDescription, node("p", "Choose a style below or from the outfit list. Hair, skin and outfit colours can be changed independently.")); previewRow.append(preview, previewCopy); editorForm.append(previewRow);
    outfitGroup = node("select"); for (const group of NPC_OUTFIT_GROUPS) { const option = node("option", `${group.name} (${group.count})`); option.value = group.id; outfitGroup.append(option); } field(editorForm, "Browse wardrobe", outfitGroup);
    outfitGallery = node("div", null, "npc-outfit-gallery"); outfitGallery.setAttribute("aria-label", "Outfit choices"); editorForm.append(outfitGallery); outfitGroup.addEventListener("change", renderOutfitGallery);
    for (const el of [name, skin, hair, outfit, hat]) el.addEventListener("input", previewNpc);
    enabled = field(editorForm, "Visible to players", input("checkbox")); enabled.checked = true;
    editorForm.append(node("h3", "Dialogue, information, rewards & trades"), node("p", "Each action can take any items, give any items or gems, and say something. Empty payment means free; empty rewards means dialogue or information only."));
    offers = node("div", null, "npc-offer-rows"); editorForm.append(offers, button("+ Add action / trade", () => addOffer(), "secondary-button"));
    saveButton = node("button", "Save NPC"); saveButton.type = "submit"; editorForm.append(saveButton); editorStatus = node("p", null, "status-message"); editorStatus.setAttribute("aria-live", "polite");
    const hide = button("Hide NPC", deleteNpc, "secondary-button"); hide.dataset.deleteNpc = "true"; editor.append(editorForm, hide, editorStatus); editorForm.addEventListener("submit", saveNpc); paintPreview();
  }
  if (npcRef) onValue(npcRef, snapshot => {
    const next = {};
    for (const [id, raw] of Object.entries(snapshot.val() ?? {})) { try { next[id] = normalizeNpc(raw); } catch { /* Ignore malformed old NPC records. */ } }
    npcs = next; if (admin) renderList(); if (activeNpcId) renderTalk();
  }, () => game.notify("Could not load NPCs. Check your connection."));
  return {
    admin, isOpen, close, getNpcs: allNpcs,
    openMarket() { if (admin) { renderList(); show(market); } },
    cancelPlacement() { placing = false; },
    handlePlacement(target) { if (!placing || !admin) return false; if (!target.inBounds) return true; try { locationValid(target, null); openEditor(null, target); } catch (error) { game.notify(error.message); } return true; },
    interact(id, edit = false) {
      const npc = allNpcs()[id]; if (!npc) return;
      if (admin && edit && !npc.fixed) { openEditor(id); return; }
      if (!nearNpc(game.getPlayer(), npc, REACH)) { game.notify("Move closer to this NPC to talk."); return; }
      activeNpcId = id; talkResponse.textContent = ""; talkStatus.textContent = ""; show(talk); renderTalk();
    },
  };
}
