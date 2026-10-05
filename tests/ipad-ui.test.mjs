import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../world.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../main.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../main.js", import.meta.url), "utf8");

assert.doesNotMatch(html, /data-control="place"/);
assert.match(html, /data-control="zoom-in"/);
assert.match(html, /data-control="zoom-out"/);
assert.match(html, /id="recipes-panel"/);
assert.match(css, /-webkit-user-select:\s*none/);
assert.match(css, /-webkit-touch-callout:\s*none/);
assert.match(main, /event\.pointerType === "touch"/);
assert.match(main, /!target\.tileId \|\| canSplice/);
assert.match(main, /input\.touchMineTarget = \{ x: target\.x, y: target\.y \}/);
assert.match(main, /updateBreaking\(now, miningTarget\(\)\)/);
assert.match(main, /control === "zoom-in"/);
assert.match(main, /control === "zoom-out"/);
assert.match(main, /lava\.hits >= 3/);
assert.match(main, /hotbarLayout\?\.slots\.find/);
assert.match(main, /selectedSlot = hotbarHit\.index/);
assert.match(main, /Object\.entries\(SEED_RECIPES\)/);

console.log("iPad direct world interaction, selection prevention, and recipes UI checks passed.");
