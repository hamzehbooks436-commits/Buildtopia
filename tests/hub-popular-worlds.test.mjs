import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../hub.html", import.meta.url), "utf8");
const hub = readFileSync(new URL("../hub.js", import.meta.url), "utf8");
const main = readFileSync(new URL("../main.js", import.meta.url), "utf8");

assert.match(html, /id="popular-world-list"/);
assert.match(hub, /b\.online - a\.online/);
assert.match(hub, /popularWorlds\.slice\(0, 8\)/);
assert.match(main, /worldName: requestedName/);

console.log("Hub active-world ranking and presence display-name checks passed.");
