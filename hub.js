import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { get, onValue, ref } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { auth, database, firebaseConfigured, requireFirebase, usernameKey, validName } from "./firebase.js";

const form = document.querySelector("#world-form");
const input = document.querySelector("#world-name");
const status = document.querySelector("#hub-status");
const welcome = document.querySelector("#welcome-name");
const signOutButton = document.querySelector("#sign-out");
const onlineTotal = document.querySelector("#online-total");
const worldList = document.querySelector("#world-list");
const worldListEmpty = document.querySelector("#world-list-empty");
const popularWorldList = document.querySelector("#popular-world-list");
const popularWorldListEmpty = document.querySelector("#popular-world-list-empty");
let currentUser = null;
let visitedWorlds = {};
let presence = {};

const ONLINE_WINDOW = 30000;
function isFresh(entry) { return Boolean(entry) && Date.now() - (entry.updatedAt || 0) < ONLINE_WINDOW; }
function setStatus(message, isError = false) { status.textContent = message; status.classList.toggle("is-error", isError); }

function worldButton(world) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "world-list-button";
  const name = document.createElement("span");
  name.className = "world-list-name";
  name.textContent = world.name;
  const count = document.createElement("span");
  count.className = `world-list-count${world.online ? " has-players" : ""}`;
  count.textContent = `${world.online} online`;
  button.append(name, count);
  button.addEventListener("click", () => {
    window.location.assign(`world.html?world=${encodeURIComponent(world.key)}&name=${encodeURIComponent(world.name)}`);
  });
  return button;
}

function renderGate() {
  const worldCounts = {};
  let totalOnline = 0;
  const activeNames = {};
  Object.values(presence).forEach((entry) => {
    if (!isFresh(entry) || !entry.world) return;
    totalOnline += 1;
    worldCounts[entry.world] = (worldCounts[entry.world] ?? 0) + 1;
    if (entry.worldName) activeNames[entry.world] = entry.worldName;
  });
  onlineTotal.textContent = `${totalOnline} player${totalOnline === 1 ? "" : "s"} online right now`;

  const popularWorlds = Object.entries(worldCounts)
    .map(([key, online]) => ({ key, name: activeNames[key] || visitedWorlds[key]?.worldName || key, online }))
    .sort((a, b) => b.online - a.online || a.name.localeCompare(b.name));
  popularWorldList.textContent = "";
  popularWorldListEmpty.hidden = popularWorlds.length > 0;
  popularWorlds.slice(0, 8).forEach((world) => popularWorldList.appendChild(worldButton(world)));

  if (!currentUser) return;
  const worlds = Object.entries(visitedWorlds).map(([key, data]) => ({ key, name: data?.worldName || key, online: worldCounts[key] ?? 0, updatedAt: data?.updatedAt ?? 0 }));
  worlds.sort((a, b) => b.online - a.online || b.updatedAt - a.updatedAt);
  worldList.textContent = "";
  worldListEmpty.hidden = worlds.length > 0;
  worlds.slice(0, 8).forEach((world) => worldList.appendChild(worldButton(world)));
}

if (!firebaseConfigured) setStatus("Firebase setup is required before worlds can be used.", true);
else onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("index.html"); return; }
  currentUser = user;
  const profile = await get(ref(database, `users/${user.uid}/profile`));
  welcome.textContent = profile.val()?.username ?? "Explorer";
  onValue(ref(database, `users/${user.uid}/worlds`), (snapshot) => { visitedWorlds = snapshot.val() ?? {}; renderGate(); });
  onValue(ref(database, "gamePresence"), (snapshot) => { presence = snapshot.val() ?? {}; renderGate(); });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    requireFirebase();
    const name = input.value.trim();
    if (!validName(name, 3, 28)) throw new Error("Use 3–28 letters, numbers, hyphens, or underscores for a world name.");
    if (!currentUser) throw new Error("Your account is still loading.");
    const world = usernameKey(name);
    window.location.assign(`world.html?world=${encodeURIComponent(world)}&name=${encodeURIComponent(name)}`);
  } catch (error) { setStatus(error.message, true); }
});
signOutButton.addEventListener("click", async () => { if (auth) await signOut(auth); });
