# Buildtopia

A self-contained, single-player 2D tile sandbox. It uses the provided `skytexture.jpg` for the parallax sky and `textures.jpg` as the source art for tile and item textures.

On Windows, double-click `start-buildtopia.bat` to start the game. It launches a small local server and opens the game in your default browser. You can also use any simple static web server; opening `index.html` directly may be blocked by browser security rules for JavaScript modules.

## Controls

- **A / D** or **Arrow keys** — move
- **W**, **Up**, or **Space** — jump
- **Hold left click** — mine / harvest a tile in reach
- **Right click** or **E** — place the selected hotbar item
- **1–8** — select a hotbar slot
- **Sky Market button** — open the shop from the game UI
- **R** — restart with a new world

The world, inventory, player location, and growing crops save automatically in browser storage. Crops use real timestamps, so they progress while the game is closed.
