import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { World } from "../world.js";
import { createPlayer, updatePlayer } from "../player.js";

const ladderWorld = new World();
ladderWorld.set(5, 5, 59);
const climber = createPlayer(5 * 32 + 5, 5 * 32);
updatePlayer(climber, ladderWorld, { left: false, right: false, jumpPressed: true, jumpHeld: true }, .1);
assert.equal(climber.vy, -135, "Ladder climbing has a steady upward velocity");

const waterWorld = new World();
waterWorld.set(5, 5, 61);
const swimmer = createPlayer(5 * 32 + 5, 5 * 32);
updatePlayer(swimmer, waterWorld, { left: false, right: false, jumpPressed: true, jumpHeld: true }, .1);
assert.ok(swimmer.vy < 0, "Holding jump swims upward");
assert.ok(Math.abs(swimmer.vy) < 180, "Swimming is controlled rather than a full jump");

const auth = readFileSync(new URL("../auth.js", import.meta.url), "utf8");
const hub = readFileSync(new URL("../hub.js", import.meta.url), "utf8");
const main = readFileSync(new URL("../main.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../world.html", import.meta.url), "utf8");
const assets = readFileSync(new URL("../assets.js", import.meta.url), "utf8");
assert.match(auth, /buildtopiaLocalMode/);
assert.match(hub, /Playing locally/);
assert.match(main, /enterLocalWorld/);
assert.match(main, /requestTrade/);
assert.match(main, /locked\?\.\[user\.uid\]/);
assert.match(main, /claimTrade/);
assert.match(html, /id="door-settings"/);
assert.match(html, /id="trade-panel"/);
assert.match(assets, /createSunsetSky/);

console.log("Ladder, swimming, local play, door UI, sunset sky and trade-flow checks passed.");
