# Buildtopia Multiplayer

Buildtopia is a shared browser sandbox designed for GitHub Pages. Players can use an online account or choose **Play locally** to save worlds only on their device. Online worlds, crops, edits, presence, trades, and each player's inventory are stored in Firebase Realtime Database.

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

For local play, run **start-buildtopia.bat** and open **http://127.0.0.1:4173/**. The launcher serves this game folder; opening HTML files directly shows a launch guide. Versioned module imports refresh the updated game code. Previously saved worlds keep their original terrain, so use a fresh name such as `ice-adventure` or `snow-caves` for a new winter map.

- **A/D** or **arrow keys** — move
- **W**, **Up**, or **Space** — jump
- **Hold click / press a block** — mine or harvest
- **Right click** or **E** — place the selected item on desktop
- **1–5** — select a hotbar slot
- **Mouse wheel** or **+/-** — zoom in and out (you stay centered)
- **Click a White Door** — return to the World Gate (the door is also your respawn point)
- **Pickaxe** (Sky Market, 500 gems) — breaks blocks 55% faster; a tool, not a placeable block
- **I** or **Inventory** — open the inventory (the other 15+ slots)
- **Wrench** — select it in Inventory, then tap a World Door to set its destination or tap another online player to request a trade
- **Sky Market** — open the shop
- **World Gate** — save and return to the world-picker page

On iPad and other touch devices, movement and jump buttons appear automatically. Tap an empty tile to place the selected item, tap a compatible planted seed to splice it, or press an occupied tile to mine and harvest. The game controls disable browser text selection so touches stay in the game.

Sky Market opens a section menu: **Seeds & Growing**, **Building Blocks**, and **Tools & Upgrades**. Tap a section to open its own shop view. Use **All sections** or Escape to go back; **Close** exits the market.

## Admin blocks and NPCs

Log in with the **admin** username and the password you requested. This account has been created in Firebase Authentication, its username/profile are provisioned, and the NPC rules have been published to `buildtopia-f6b73`. Signing in switches a previous local-play session back to online play.

Only this account sees **Sky Market → Admin · Blocks & NPCs**. Search the complete item catalogue, enter a positive whole quantity and choose **Get items (free)**. All terrain tiles, decorative tiles, seeds, tools and gems are included. Admin stacks can exceed 999 and its inventory expands when needed; quantities and items persist across worlds and reloads.

To add an NPC, choose **+ Place NPC**, then tap a clear tile. Give it a custom name displayed above its head in the same outlined style as players. Choose its hair colour, skin colour, outfit colour, hat and position. The wardrobe contains **35 distinct outfits: 20 normal, 7 winter and 8 summer**, with a grouped selector, clickable outfit thumbnails and a live name/appearance preview. Existing NPC names and colours are preserved; older NPCs default to the Casual T-shirt until you choose a new outfit. The selected outfit is saved with the NPC and shared with other players. Choose **+ Add action / trade** to add as many actions as needed. Each action has:

- A button label and the NPC's response after completion.
- Any combination of items and quantities in **Player gives** and **NPC gives**, including Sky Gems.
- **Allow this action repeatedly**, or a one-time completion saved per player.

Empty payment means a free conversation or reward. Empty rewards means dialogue/information, optionally unlocked by giving items. Payments and rewards are applied together in one inventory transaction; missing payment or insufficient bag space changes nothing. NPC settings are shared immediately with online players and persist in their world.

Players tap a nearby NPC to talk or trade. The admin can use the Wrench on an NPC to edit it, or use **Edit** in the admin category to manage it from anywhere in that world. **Hide NPC** preserves its settings for later reactivation. Escape closes the editor or cancels placement.

Admin identity is the Firebase UID in `admin.js`; display names, editable profiles, browser flags and local mode cannot grant this role. Database rules restrict writes to `worlds/<world>/npcs` to that UID, with no parent world write that would override the restriction. The existing game inventory remains client-managed; these changes protect NPC configuration rather than implementing a separate authoritative anti-cheat economy.

Validation: run `node --test tests/*.test.mjs`. `firebase.json` configures only the database rules; `firebase deploy --only database --project buildtopia-f6b73` publishes them without changing website hosting. The live permission verification script in `artifacts/verify-admin-live.mjs` reads the requested password from `BUILDTOPIA_ADMIN_PASSWORD`, creates a temporary test account, checks allowed/denied access, and removes its test account/NPC afterward. It does not save passwords or tokens.

World names beginning with `beach` generate tropical terrain with sand, palms, coconuts, swimmable water, and a sunset sky. Hold jump to swim upward. Hold jump while touching a Ladder to climb at a steady pace. Walking over a Checkpoint changes your respawn point.

## Winter worlds

Create a new world whose name starts with **ice** or **snow**, such as `ice-kingdom` or `snow-valley`. Existing worlds keep their saved terrain. Winter worlds contain mineable Snow Blocks, snowy pines that drop wood, and a wide frozen lake made from slippery Ice Blocks.

The winter sky follows a 12-minute cycle: eight minutes of daylight and four minutes of night, with smooth sky transitions. Northern lights appear only at night and change their colour palette each night. Random gentle snow showers can happen during either day or night, with clear periods between them. Weather uses a shared clock for local and online play. Summer flowers do not naturally grow in winter worlds.

New winter worlds also include:

- **Ice caves:** two connected underground chambers. The ladder entrance is east of the snowy pines, before the frozen lake. Mine glowing Ice Crystals for collectible crystal decorations and gems.
- **Igloos:** two snow-built structures with doorways on the right and recessed snow-brick background walls. Background walls are decorative and stay in saves; intact older igloos receive them on loading. Explore igloos or buy an **Igloo Kit** in **Building Blocks** for **250 gems**. Select the kit, then click/tap a clear site or place with E/right-click: the target is the bottom middle of the interior. Allow nine tiles of width and five tiles of headroom. Snow Blocks can also be used to build your own design.
- **Penguins:** friendly creatures that waddle around the frozen lake and turn at obstacles and ledges.
- **Icicles:** ceiling hazards that shake for a moment before falling when someone approaches below. A hit returns the player to their checkpoint or spawn; icicles shatter on landing. Mine them carefully and hang collected icicles beneath solid ceilings.
- **Snowballs:** mining each Snow Block gives three snowballs; **Tools & Upgrades** sells 20 for **10 gems**. Select snowballs and click/tap to aim and throw, or press **E** to throw forward. They travel in an arc, splat against walls and players, and tag friends without damage or respawning. Online throws are shared through player presence.

Existing saved terrain is preserved. Use a new `ice`/`snow` world name for the generated caves and igloos; snowball collection, kits, and collected decorations work in existing worlds too.

## Parkour blocks

In **Sky Market → Building Blocks**, buy the **Parkour Package** for **1,500 gems**: 15 Ice Blocks, 20 Spike Blocks, 4 Checkpoints, 35 Lava, 15 Wooden Platforms, and 5 Bounce Pads. The whole package requires inventory space; failed purchases spend no gems. Checkpoints are also sold individually there for 500 gems each. Ice, spikes, platforms and bounce pads are available through the package.

- **Wooden Platform**: jump through from below or the sides and land on its top.
- **Bounce Pad**: landing on top automatically launches you higher than a normal jump.
- **Ice Block**: slippery ground that slows stopping and changing direction.
- **Spike Block**: touching it immediately returns you to your activated checkpoint, or the world spawn if you have none.

## Seed splicing

Plant one seed, then select the second seed and tap, use **E**, or right click the exact same tile before the first seed grows. Either order works. Both seeds become one new planted seed with a fresh growth timer. Mine it before it grows to collect the resulting seed, or let it grow and harvest the crop. The in-game **Recipes** panel lists every available combination.

Block recipes use the same exact-tile method: Sand + Rock makes Glass, and Wood + Yellow Flower makes a Ladder.

- Clay Seed + Red Flower Seed → Red Block Seed
- Clay Seed + Blue Flower Seed → Blue Block Seed
- Clay Seed + Green Flower Seed → Green Block Seed
- Clay Seed + Yellow Flower Seed → Yellow Block Seed
- Clay Seed + Rock Seed → Brick Seed (grows in 55 seconds)

Incompatible pairs do not consume seeds. Splicing uses the same reach and world-lock restrictions as planting.
