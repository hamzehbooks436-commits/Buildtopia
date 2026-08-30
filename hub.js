import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { auth, database, firebaseConfigured, requireFirebase, usernameKey, validName } from "./firebase.js";

const form = document.querySelector("#world-form");
const input = document.querySelector("#world-name");
const status = document.querySelector("#hub-status");
const welcome = document.querySelector("#welcome-name");
const signOutButton = document.querySelector("#sign-out");
let currentUser = null;
function setStatus(message, isError = false) { status.textContent = message; status.classList.toggle("is-error", isError); }

if (!firebaseConfigured) setStatus("Firebase setup is required before worlds can be used.", true);
else onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("index.html"); return; }
  currentUser = user;
  const profile = await get(ref(database, `users/${user.uid}/profile`));
  welcome.textContent = profile.val()?.username ?? "Explorer";
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
