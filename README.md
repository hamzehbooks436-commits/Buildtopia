# Buildtopia Multiplayer

Buildtopia is a shared browser sandbox designed for GitHub Pages. Players create an account with a username and password, enter a named world through the World Gate, and see other online players in that world. Worlds, crops, edits, and each player's inventory are stored in Firebase Realtime Database.

## Firebase setup

1. Create a Firebase project and register a **Web app**.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Realtime Database**, create a database.
4. Copy the web configuration object into [firebase-config.js](firebase-config.js). Its `databaseURL` value is required.
5. In **Realtime Database → Rules**, replace the rules with the contents of [firebase-rules.json](firebase-rules.json), then publish them.
6. In **Authentication → Settings → Authorized domains**, add your GitHub Pages domain, for example `your-name.github.io`.

The Firebase config is safe to publish; the database rules protect the data. Never put a Firebase Admin SDK private key in this project.

## Publish to GitHub Pages

Push this folder to a GitHub repository, then enable **Settings → Pages → Deploy from a branch** and select the branch/folder containing `index.html`. Open the Pages URL to create an account and play. Firebase authentication and the database require the site to be served over HTTP(S), so do not open `index.html` directly from the file system.

## Controls

- **A/D** or **arrow keys** — move
- **W**, **Up**, or **Space** — jump
- **Hold click / press a block** — mine or harvest
- **Right click** or **E** — place the selected item on desktop
- **1–5** — select a hotbar slot
- **Mouse wheel** or **+/-** — zoom in and out (you stay centered)
- **Click a White Door** — return to the World Gate (the door is also your respawn point)
- **Pickaxe** (Sky Market, 500 gems) — breaks blocks 55% faster; a tool, not a placeable block
- **I** or **Inventory** — open the inventory (the other 15+ slots)
- **Sky Market** — open the shop
- **World Gate** — save and return to the world-picker page

On iPad and other touch devices, movement and jump buttons appear automatically. Tap an empty tile to place the selected item, tap a compatible planted seed to splice it, or press an occupied tile to mine and harvest. The game controls disable browser text selection so touches stay in the game.

## Seed splicing

Plant one seed, then select the second seed and tap, use **E**, or right click the exact same tile before the first seed grows. Either order works. Both seeds become one new planted seed with a fresh growth timer. Mine it before it grows to collect the resulting seed, or let it grow and harvest the crop. The in-game **Recipes** panel lists every available combination.

- Clay Seed + Red Flower Seed → Red Block Seed
- Clay Seed + Blue Flower Seed → Blue Block Seed
- Clay Seed + Green Flower Seed → Green Block Seed
- Clay Seed + Yellow Flower Seed → Yellow Block Seed
- Clay Seed + Rock Seed → Brick Seed (grows in 55 seconds)

Incompatible pairs do not consume seeds. Splicing uses the same reach and world-lock restrictions as planting.
