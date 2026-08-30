import { createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { ref, runTransaction, set } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { auth, database, firebaseConfigured, requireFirebase, usernameKey, validName } from "./firebase.js";

const form = document.querySelector("#auth-form");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const submit = document.querySelector("#auth-submit");
const status = document.querySelector("#auth-status");
const loginTab = document.querySelector("#login-tab");
const signupTab = document.querySelector("#signup-tab");
let mode = "login";

function setStatus(message, isError = false) { status.textContent = message; status.classList.toggle("is-error", isError); }
function accountEmail(key) { return `${key}@accounts.buildtopia.game`; }
function setMode(nextMode) {
  mode = nextMode;
  const signup = mode === "signup";
  loginTab.classList.toggle("is-active", !signup);
  signupTab.classList.toggle("is-active", signup);
  loginTab.setAttribute("aria-selected", String(!signup));
  signupTab.setAttribute("aria-selected", String(signup));
  submit.textContent = signup ? "Create account" : "Log in";
  password.autocomplete = signup ? "new-password" : "current-password";
  setStatus("");
}
function friendlyError(error) {
  if (error?.code === "auth/invalid-credential") return "That username or password is incorrect.";
  if (error?.code === "auth/email-already-in-use") return "That username is already taken.";
  if (error?.code === "auth/weak-password") return "Use a password with at least 6 characters.";
  return error?.message ?? "Something went wrong. Try again.";
}

loginTab.addEventListener("click", () => setMode("login"));
signupTab.addEventListener("click", () => setMode("signup"));
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    requireFirebase();
    const displayName = username.value.trim();
    const key = usernameKey(displayName);
    if (!validName(displayName, 3, 20)) throw new Error("Use 3–20 letters, numbers, or underscores for your username.");
    if (password.value.length < 6) throw new Error("Use a password with at least 6 characters.");
    submit.disabled = true;
    setStatus(mode === "signup" ? "Creating your account…" : "Logging in…");
    if (mode === "login") {
      const credential = await signInWithEmailAndPassword(auth, accountEmail(key), password.value);
      await updateProfile(credential.user, { displayName });
    } else {
      const credential = await createUserWithEmailAndPassword(auth, accountEmail(key), password.value);
      const claim = await runTransaction(ref(database, `usernames/${key}`), (current) => current === null ? credential.user.uid : undefined);
      if (!claim.committed || claim.snapshot.val() !== credential.user.uid) {
        await deleteUser(credential.user);
        throw new Error("That username is already taken.");
      }
      await updateProfile(credential.user, { displayName });
      await set(ref(database, `users/${credential.user.uid}/profile`), { username: displayName, usernameKey: key, createdAt: Date.now() });
    }
    window.location.replace("hub.html");
  } catch (error) {
    setStatus(friendlyError(error), true);
  } finally { submit.disabled = false; }
});

if (!firebaseConfigured) setStatus("Firebase setup is required before accounts can be used.", true);
else onAuthStateChanged(auth, (user) => { if (user) window.location.replace("hub.html"); });
