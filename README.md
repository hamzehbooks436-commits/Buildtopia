# Buildtopia Multiplayer

Buildtopia is a shared browser sandbox designed for GitHub Pages. Players can use an online account or choose **Play locally** to save worlds only on their device. Online worlds, crops, edits, presence, trades, and each player's inventory are stored in Firebase Realtime Database.

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

## Autumn worlds

Autumn worlds follow a shared 12-minute day/night cycle: eight minutes of daylight and four minutes of night, with warm dusk and dawn transitions, a moon and stars behind drifting clouds, and dimmer nighttime terrain and leaves. Torches and Jack'o Lanterns light nearby surface tiles at night. The cycle continues through saves and applies automatically to existing autumn worlds.


Create a **new** world beginning with **autumn** or **fall**, such as `autumn-forest` or `fall-village`. Existing saves retain their terrain. Worlds are now **256 × 72 blocks**, twice their original area. Autumn maps have a heavily clouded sky, drifting leaves, nearly flat orange ground, sparse one-block yellow/orange/red trees, a cabin, a pumpkin patch, a harvest stall, and a protected family house. Ponds and floating structure labels have been removed. Older 128-wide saves expand without shifting player builds; untouched generated autumn terrain is upgraded to the sparse layout.

- **Pumpkin:** found around the forest and pumpkin patches. Mining returns a Pumpkin and has a **50% chance of one Pumpkin Crop**. Plant the crop to grow a Pumpkin Plant in 45 seconds; harvest for 1–3 pumpkins and a 50% chance of one crop.
- **Pumpkin Crop + Torch Crop → Jack'o Lantern Crop:** splice on the same tile in either order before either grows. The result grows in 60 seconds. Harvest for 1–3 Jack'o Lanterns and a 50% chance of one crop. Placed lanterns light nearby tiles.
- **Leaves Batch Block:** no crop. Every real hour, autumn worlds replenish leaf batches up to **five on the map**, counting placed batches too. The clock persists through saves; occupied tiles and buildings are preserved.
- **Wood Background:** every tree type drops two walls. Place these in the background and build or walk in front of them. On desktop, hold click on a wall with empty foreground to mine it. On touch devices, select an empty slot or Pickaxe and hold the wall. Hay Bales, Rustic Fences, Cabin Roofs, Harvest Crates, and Forest Mushrooms can also be collected from generated places and reused.
- **Ghost pets:** select a **Ghost Buster**, click/tap a ghost within four tiles, or press **E** near one. A captured ghost becomes your saved pet and follows you across worlds. Open **Sky Market → Clothes → Pets** to choose a follower or dismiss it. Pets also appear in **Sky Market → Clothes → Pets**, where equipping and dismissing are free. One ghost starts in an autumn world; **one more spawns each real hour, up to two uncaught ghosts**. The saved clock prevents reloads or missed hours from spawning a crowd. Online players can see each other's followers. World claims persist before pet saving and automatically recover after a failed save or on re-entry.
- **Ghost Buster distribution:** only through NPC rewards configured by the admin. In your NPC editor, add **Ghost Buster** under **NPC gives**. It has no shop offer, crafting recipe, starter grant, natural drop, or free-admin-catalogue entry. The generated family does not distribute this tool. Autumn crops are excluded from random seed packages.

The family house, including its walls, background, foundation and doorways, is protected against mining and building. **Mara** trades 10 Pumpkins for 50 Sky Gems; **Rowan** trades 5 Forest Mushrooms for 20 Sky Gems; **Elias** trades 20 Autumn Trees in any colour mix for one Pickaxe. All three trades are repeatable and preserve payment on insufficient funds or bag space. Harvesting autumn trees now also gives the tree itself for collection, replanting or trading. Family NPCs work in local and online worlds and are kept separate from admin-created NPCs.

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

Normal worlds have surface trees and exactly **40 underground Coal deposits** when first generated. Existing normal saves receive the resources once, replacing only underground Rock and using empty surface tiles; mined deposits never refill automatically.

- Trees give **1–3 Wood Blocks** and have a **50% chance of one Wood Crop** (never more than one).
- Breaking a Wood Block returns the block, plus independent **50% chances** of **one Wood Crop** and **one gem**.
- Mining Coal gives one Coal block and one Coal Crop. Plant a Wood Crop to grow a tree in 30 seconds, or a Coal Crop to grow a coal plant in 60 seconds.
- **Wood Crop + Coal Crop → Torch Crop**: plant either crop and place the other on the same tile before it grows. The Torch Crop grows in **45 seconds** into a Torch Plant. Harvest it for **1–3 torches** and a **50% chance of one Torch Crop**. Place torches to light ground within five tiles; mine them to relocate them. Underground ground becomes darker with depth, making torch light useful.

Plant one seed, then select the second seed and tap, use **E**, or right click the exact same tile before the first seed grows. Either order works. Both seeds become one new planted seed with a fresh growth timer. Mine it before it grows to collect the resulting seed, or let it grow and harvest the crop. The in-game **Recipes** panel lists every available combination.

Block recipes use the same exact-tile method: Sand + Rock makes Glass, and Wood + Yellow Flower makes a Ladder.

- Clay Seed + Red Flower Seed → Red Block Seed
- Clay Seed + Blue Flower Seed → Blue Block Seed
- Clay Seed + Green Flower Seed → Green Block Seed
- Clay Seed + Yellow Flower Seed → Yellow Block Seed
- Clay Seed + Rock Seed → Brick Seed (grows in 55 seconds)

Incompatible pairs do not consume seeds. Splicing uses the same reach and world-lock restrictions as planting.


## Furniture and building materials

Sky Market → Furniture & Home sells ten collectible, walk-through furnishings: Wooden Chair, Dining Table, Cozy Bed, Soft Sofa, Bookshelf, Wooden Cabinet, Floor Lamp, Woven Rug, Potted Plant and Stone Fireplace. Lamps and fireplaces light nearby tiles. Mine furniture to collect it and move it; it persists in existing and new worlds.

Furniture is placed exactly like any other block: select it in Inventory or the hotbar, then right-click or press **E** on desktop, or tap an empty tile on touch devices. Normal reach, inventory consumption, occupied-space checks, world locks and family-house protection apply. Hold click/press to mine furniture and collect it again.

Building Blocks now sells wood, brick, glass, background walls and ladders in bulk, plus a 150-gem Builder Pack containing 50 Wood Blocks, 50 Brick Blocks, 20 Glass Blocks, 50 Wood Background walls and 10 Ladders. Market categories have Prev/Next pages to keep cards readable on phones.
