import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_") && firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes("PASTE_") && firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("PASTE_"));
const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const database = app ? getDatabase(app) : null;
export function requireFirebase() { if (!firebaseConfigured) throw new Error("Firebase is not configured yet. Add your web app configuration to firebase-config.js."); }
export function usernameKey(value) { return value.trim().toLowerCase(); }
export function validName(value, min, max) { return new RegExp(`^[A-Za-z0-9_-]{${min},${max}}$`).test(value); }
