export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
    image.src = src;
  });
}

// Hand-drawn pixel-art atlas. Textures are painted at the exact sprite
// rectangles referenced by definitions.js, so no coordinates change.
export function createTileAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 352;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  function paint(rect, painter) {
    const [originX, originY, width, height] = rect;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const color = painter(x, y);
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(originX + x, originY + y, 1, 1);
      }
    }
  }

  // A rounded seed blob on transparency, tinted with a palette.
  const seedArt = (rect, [base, outline, shine]) => paint(rect, (x, y) => {
    const seed = Math.hypot((x - 8.5) / 4.4, (y - 9.5) / 3.1);
    if (seed > 1) return null;
    if (seed > .82) return outline;
    if (y < 9 && x < 9) return shine;
    if (x === 10 && y >= 9) return outline;
    return base;
  });

  // A sprout with a stem and a round bloom of the given palette.
  const sproutArt = (rect, stem, [base, dark, light], center = "#ffe77a") => paint(rect, (x, y) => {
    const w = rect[2];
    const h = rect[3];
    if (x >= Math.floor(w / 2) - 1 && x <= Math.floor(w / 2) + 1 && y >= Math.floor(h * .62)) return y === Math.floor(h * .62) ? "#87536b" : stem;
    // Small leaves and petal-shaped edges replace the flat circular bloom.
    if (y >= h * .7 && y < h * .85 && Math.abs(x - w / 2) < 5) return x < w / 2 ? "#99ef6b" : "#35b772";
    const dx = x - (w - 1) / 2, dy = y - h * .4;
    const petals = 1 + .12 * Math.cos(Math.atan2(dy, dx) * 5);
    const bloom = Math.hypot(dx / (w * .33), dy / (h * .32)) / petals;
    if (bloom > 1) return null;
    if (bloom > .78) return dark;
    if (Math.hypot(x - (w - 1) / 2, y - h * .4) < Math.max(1.8, w * .11)) return center;
    return x + y < w * .7 ? light : base;
  });

  // Bright toy-like blocks with a broad face and a small shiny corner.
  const blockArt = (rect, [base, dark, light]) => paint(rect, (x, y) => {
    if (y === 0 || x === 0) return light;
    if (y === rect[3] - 1 || x === rect[2] - 1) return dark;
    if ((y === 3 && x >= 3 && x <= 7) || (x === 3 && y >= 3 && y <= 5)) return light;
    return base;
  });

  // Soft dirt with a clean grass cap and just two little clumps.
  paint([84, 12, 20, 20], (x, y) => {
    if (y === 0) return "#d4ff87";
    if (y < 3) return "#83e657";
    if (y === 3 || (y === 4 && (x % 7) < 3)) return "#3eb864";
    if ((x >= 4 && x <= 6 && y === 10) || (x >= 13 && x <= 15 && y === 16)) return "#bc6a43";
    if (x >= 11 && x <= 13 && y === 8) return "#ffd18b";
    return "#df985b";
  });
  blockArt([139, 12, 20, 20], ["#9992e4", "#7369b9", "#d2c8ff"]);
  paint([314, 286, 18, 18], (x, y) => {
    if (y === 0) return "#9680d2";
    return (x >= 3 && x <= 7 && y >= 5 && y <= 7) || (x >= 11 && x <= 14 && y >= 12 && y <= 14) ? "#554480" : "#705a9e";
  });

  // Clean door panels and a small gold handle.
  paint([314, 40, 18, 18], (x, y) => {
    if (x === 0 || x === 17 || y === 17) return "#8490cc";
    if (y === 0 || x === 1) return "#ffffff";
    if ((x === 3 || x === 14) && y > 2 && y < 15) return "#b0bff0";
    if ((y === 3 || y === 9 || y === 15) && x > 3 && x < 14) return "#b0bff0";
    if (x === 13 && (y === 10 || y === 11)) return y === 10 ? "#ffdb59" : "#dd9238";
    if (x === 2 && (y === 4 || y === 13)) return "#879bc5";
    return "#fffaf0";
  });

  // Simple gold lock and silver shackle.
  paint([314, 64, 18, 18], (x, y) => {
    if (y < 6) {
      if (x < 4 || x > 13 || y === 0) return null;
      if (x >= 7 && x <= 10 && y >= 3) return null;
      return x < 6 || y === 1 ? "#d8f5ff" : "#7daacb";
    }
    if (x < 1 || x > 16) return null;
    if (y === 6 || x === 1) return "#fff5b4";
    if (y === 17 || x === 16) return "#d7912b";
    if (Math.hypot(x - 8.5, y - 10) < 2 || (x === 8 && y < 15 && y > 10)) return "#785040";
    if ((x === 3 || x === 14) && (y === 8 || y === 15)) return "#d18b30";
    return "#ffd84c";
  });

  // Pickaxe: worn steel head on a wooden handle.
  paint([314, 88, 18, 18], (x, y) => {
    if (Math.abs(x - (15 - y)) <= 1 && y >= 4 && y <= 15 && x >= 2) return x + y === 15 ? "#6d4526" : "#ac7e4e";
    const arc = Math.hypot((x - 8.5) / 8.4, (y - 9) / 8.4);
    if (arc <= 1 && arc >= .72 && y <= 9) return arc >= .9 ? "#e0dcd4" : "#85838d";
    return null;
  });

  blockArt([84, 40, 20, 20], ["#ebafdf", "#c67dbe", "#ffe1f6"]);

  // Two broad flowing bands keep lava easy to recognize without visual noise.
  paint([139, 40, 20, 20], (x, y) => {
    if (y < 2) return "#fff38c";
    const wave = Math.round(Math.sin(x * Math.PI / 10));
    if (y === 7 + wave || y === 14 - wave) return "#ffd349";
    return "#ff8846";
  });

  // Flowers [4,60] [26,60] [48,60] [70,60] (18x18)
  const flowerPalettes = {
    red: ["#ff628c", "#d63776", "#ffc0d8"],
    blue: ["#43b9ff", "#426bda", "#b0f3ff"],
    green: ["#65ec81", "#29ad73", "#c2ff93"],
    yellow: ["#ffdb42", "#e99c2b", "#fff6ad"],
  };
  [["red", 4], ["blue", 26], ["green", 48], ["yellow", 70]].forEach(([color, sx]) => {
    sproutArt([sx, 60, 18, 18], "#ad7155", flowerPalettes[color]);
  });

  // Colored blocks [4,90] [28,90] [52,90] [76,90] (20x20)
  const blockPalettes = {
    red: ["#ff5975", "#ce3865", "#ffb0b6"],
    blue: ["#359ef5", "#3869cf", "#9ae7ff"],
    green: ["#4edb79", "#24a56b", "#b3ff91"],
    yellow: ["#ffcf3f", "#e59a27", "#fff59b"],
  };
  [["red", 4], ["blue", 28], ["green", 52], ["yellow", 76]].forEach(([color, sx], index) => {
    blockArt([sx, 90, 20, 20], blockPalettes[color], 21 + index * 4);
  });

  // Brick block, seed and crop use free atlas slots.
  const brickPalette = ["#f57e66", "#cf4e58", "#ffc596"];
  paint([100, 90, 20, 20], (x, y) => {
    const joint = (x + (Math.floor(y / 5) % 2) * 5) % 10;
    if (y % 5 === 0 || joint === 0) return "#ffe0ac";
    return Math.floor(y / 5) % 2 ? "#f58b70" : "#ff9f75";
  });
  seedArt([246, 130, 18, 18], brickPalette);
  sproutArt([246, 160, 20, 20], "#714830", brickPalette);

  // Beach and utility blocks.
  paint([124, 90, 20, 20], (x, y) => {
    if (y === 0 || x === 0) return "#fff5b4";
    if (y === 19 || x === 19) return "#e5b65c";
    if ((y === 5 && x >= 3 && x <= 6) || (y === 13 && x >= 12 && x <= 15)) return "#fff5b4";
    if ((y === 9 && x >= 9 && x <= 11) || (y === 16 && x >= 4 && x <= 5)) return "#e5b65c";
    return "#ffdf8b";
  });
  paint([148, 90, 20, 20], (x, y) => {
    if (x === 0 || y === 0) return "#ffd18b";
    if (x === 19 || y === 19 || y === 7 || y === 14) return "#bc6a43";
    if (y === 1 || y === 8 || y === 15) return "#f5b876";
    if ((y === 4 && x >= 3 && x <= 7) || (y === 11 && x >= 12 && x <= 16)) return "#ffd18b";
    return "#df985b";
  });
  paint([172, 90, 20, 20], (x, y) => {
    if (x === 0 || y === 0) return "#dbfbff";
    if (x === 19 || y === 19) return "#4f96e8";
    if ((y === 3 && x >= 3 && x <= 7) || (x === 3 && y >= 3 && y <= 5)) return "#ffffff";
    if (x + y === 23 && x >= 11 && x <= 16) return "#b0f3ff";
    return "rgba(113, 215, 255, .38)";
  });
  paint([196, 90, 20, 20], (x, y) => {
    if (x < 2 || x > 17 || y < 1) return null;
    if (x === 17 || y === 19) return "#3869cf";
    if (x === 2 || y === 1) return "#dbfbff";
    if (x === 3 || x === 16) return "#9ae7ff";
    if (x === 14 && (y === 11 || y === 12)) return y === 11 ? "#fff59b" : "#e59a27";
    if ((x === 5 || x === 14) && y >= 4 && y <= 8) return "#3869cf";
    if ((y === 4 || y === 8 || y === 16) && x >= 5 && x <= 14) return "#9ae7ff";
    return "#359ef5";
  });
  paint([220, 90, 20, 20], (x, y) => {
    if ((x >= 3 && x <= 5) || (x >= 14 && x <= 16)) {
      if (x === 3 || x === 14) return "#ffd18b";
      return x === 5 || x === 16 ? "#bc6a43" : "#df985b";
    }
    if (x >= 6 && x <= 13 && y % 5 === 2) return "#fff5b4";
    if (x >= 6 && x <= 13 && y % 5 === 3) return "#df985b";
    return null;
  });
  paint([244, 90, 20, 20], (x, y) => {
    const diamond = Math.abs(x - 9.5) + Math.abs(y - 8);
    if (diamond < 7) {
      if (diamond > 5) return "#24a56b";
      return x + y < 17 ? "#b3ff91" : "#4edb79";
    }
    if (x >= 8 && x <= 11 && y >= 14 && y <= 17) return x < 10 ? "#dbfbff" : "#4f96e8";
    if (x >= 5 && x <= 14 && y >= 18) return y === 18 ? "#9ae7ff" : "#3869cf";
    return null;
  });
  paint([268, 90, 20, 20], (x, y) => {
    if (y < 2) return "#b0f3ff";
    const wave = Math.round(Math.sin(x * Math.PI / 10));
    if (y === 7 + wave || y === 14 - wave) return "#71d7ff";
    return "#43b9ff";
  });
  paint([292, 90, 20, 20], (x, y) => {
    const leaf = (cx, cy, rx, ry) => Math.hypot((x - cx) / rx, (y - cy) / ry);
    const canopy = Math.min(leaf(5, 6, 5, 2.5), leaf(14, 6, 5, 2.5), leaf(9.5, 3, 3, 3), leaf(4, 9, 3, 3), leaf(15, 9, 3, 3));
    if (canopy <= 1) {
      if (canopy > .78) return "#2ab66c";
      return x + y < 15 ? "#c3ff81" : "#70e65d";
    }
    if (x >= 8 && x <= 11 && y >= 7) return y === 11 || y === 16 ? "#bc6a43" : x === 8 ? "#ffd18b" : "#df985b";
    return null;
  });
  paint([280, 190, 20, 20], (x, y) => {
    const radius = Math.hypot(x - 9.5, y - 10);
    if (radius > 7) return null;
    if (radius > 5.8) return "#ad7155";
    if (((x === 10 || x === 13) && y === 8) || (x === 12 && y === 11)) return "#87536b";
    return x + y < 17 ? "#ffd18b" : "#df985b";
  });

  // Parkour blocks in isolated atlas slots. Platform feet meet its top edge.
  paint([4, 250, 20, 20], (x, y) => {
    if (y > 5) return null;
    if (y === 0) return "#fff5b4";
    if (y === 5 || x % 7 === 0) return "#945232";
    if ((x === 3 || x === 16) && y === 3) return "#705a9e";
    return "#df985b";
  });
  paint([28, 250, 20, 20], (x, y) => {
    if (y < 4) return y === 0 ? "#f5c2ff" : "#d982ff";
    if (y >= 16) return y === 19 ? "#7369b9" : "#9992e4";
    if (x < 4 || x > 15) return null;
    if ((x + y) % 6 < 2 || (x - y + 24) % 6 < 2) return "#fff59b";
    return null;
  });
  paint([52, 250, 20, 20], (x, y) => {
    if (x === 0 || y === 0) return "#ffffff";
    if (x === 19 || y === 19) return "#4f96e8";
    if (x + y === 11 || x + y === 12 || (x + y === 23 && x > 8)) return "#dbfbff";
    if ((x === 13 && y >= 12 && y <= 15) || (y === 13 && x >= 12 && x <= 15)) return "#ffffff";
    return "#9ae7ff";
  });
  paint([76, 250, 20, 20], (x, y) => {
    if (y >= 16) return y === 19 ? "#a93863" : "#ef6683";
    const tip = 2 + Math.floor(x / 5) * 5;
    if (Math.abs(x - tip) > y / 6) return null;
    return x <= tip ? "#dbfbff" : "#8490cc";
  });

  paint([100, 250, 20, 20], (x, y) => {
    if (y < 3 || x === 0) return "#ffffff";
    if (y === 19 || x === 19) return "#96c9e6";
    if ((x >= 4 && x <= 7 && y === 9) || (x >= 12 && x <= 15 && y === 15)) return "#ceeafa";
    return "#effaff";
  });
  paint([124, 250, 20, 20], (x, y) => {
    if (y >= 16 && x >= 8 && x <= 11) return x === 8 ? "#df985b" : "#945232";
    const distance = Math.abs(x - 9.5);
    const tier = y < 6 ? y * .7 : y < 11 ? (y - 4) * .85 : (y - 8) * 1.1;
    if (y > 16 || distance > tier) return null;
    if (y < 3 || y === 6 || y === 11 || distance > tier - 1) return "#effaff";
    return x < 10 ? "#64c9bd" : "#298d86";
  });

  paint([148, 250, 20, 20], (x, y) => {
    const middle = x >= 7 && x <= 12 && y >= Math.abs(x - 9.5) + 1 && y <= 18;
    const left = x >= 2 && x <= 6 && y >= 8 + Math.abs(x - 4) && y <= 18;
    const right = x >= 13 && x <= 17 && y >= 6 + Math.abs(x - 15) && y <= 18;
    if (!(middle || left || right)) return null;
    if (x === 7 || x === 2 || x === 13 || y === 18) return "#7466d9";
    return x <= 9 ? "#e2faff" : x <= 12 ? "#98cfff" : "#b2a1ff";
  });
  paint([172, 250, 20, 20], (x, y) => {
    if (Math.abs(x - 9.5) > (19 - y) * .33) return null;
    if (y === 0) return "#fff";
    return x < 9 ? "#dbfbff" : x < 11 ? "#b0f3ff" : "#6aaedc";
  });
  paint([196, 250, 20, 20], (x, y) => {
    const radius = Math.hypot(x - 9.5, y - 9.5);
    if (radius > 7) return null;
    return radius > 5.5 ? "#b5d5e9" : x + y < 20 ? "#fff" : "#e2faff";
  });
  paint([220, 250, 20, 20], (x, y) => {
    if (y < 4 || y > 18 || Math.hypot((x - 9.5) / 9, (y - 15) / 11) > 1) return null;
    if (x >= 10 && x <= 14 && y >= 12) return "#325678";
    if (y % 4 === 0 || (x + (Math.floor(y / 4) % 2) * 3) % 7 === 0) return "#a7ccdf";
    return y < 9 ? "#fff" : "#e2faff";
  });
  paint([244, 250, 20, 20], (x, y) => {
    if (y >= 18 && ((x >= 4 && x <= 8) || (x >= 11 && x <= 15))) return "#ffbf64";
    if (y >= 10 && y < 16 && (x === 2 || x === 17)) return "#354c6f";
    if (Math.hypot((x - 9.5) / 7, (y - 10) / 9) > 1) return null;
    if ((x === 7 || x === 12) && y === 6) return "#08132f";
    if (x >= 8 && x <= 11 && y >= 8 && y <= 9) return "#ffbf64";
    if (Math.hypot((x - 9.5) / 4.7, (y - 11) / 7) < 1) return "#effaff";
    return x < 9 ? "#354c6f" : "#172c48";
  });

  paint([268, 250, 20, 20], (x, y) => {
    const joint = (x + (Math.floor(y / 5) % 2) * 5) % 10;
    if (y % 5 === 0 || joint === 0) return "#799fb8";
    if (y % 5 === 1) return "#c7e0ec";
    return "#abcbdc";
  });

  // Wrench inventory tool.
  paint([314, 112, 18, 18], (x, y) => {
    if (x <= 8 && y <= 8 && Math.hypot(x - 4, y - 4) <= 4) {
      if (x + y < 5 || (x <= 3 && y <= 3)) return null;
      return x < y ? "#dbfbff" : "#7daacb";
    }
    if (Math.hypot(x - 13, y - 13) <= 3) {
      if (Math.hypot(x - 13, y - 13) < 1.2) return null;
      return x + y < 26 ? "#fff5b4" : "#ffd84c";
    }
    if (Math.abs(x - y) <= 1 && x >= 5 && x <= 13) return x < y ? "#dbfbff" : "#7daacb";
    return null;
  });

  // Seed row at y=130 (18x18, step 22)
  seedArt([4, 130, 18, 18], ["#ebafdf", "#c67dbe", "#ffe1f6"]);
  seedArt([26, 130, 18, 18], ["#9992e4", "#7369b9", "#d2c8ff"]);
  seedArt([48, 130, 18, 18], ["#ff8846", "#e45148", "#fff38c"]);
  seedArt([70, 130, 18, 18], flowerPalettes.red);
  seedArt([92, 130, 18, 18], flowerPalettes.blue);
  seedArt([114, 130, 18, 18], flowerPalettes.green);
  seedArt([136, 130, 18, 18], flowerPalettes.yellow);
  seedArt([158, 130, 18, 18], blockPalettes.red);
  seedArt([180, 130, 18, 18], blockPalettes.blue);
  seedArt([202, 130, 18, 18], blockPalettes.green);
  seedArt([224, 130, 18, 18], blockPalettes.yellow);

  // Crop row at y=160 (20x20, step 22)
  sproutArt([4, 160, 20, 20], "#6d6a80", ["#ebafdf", "#c67dbe", "#ffe1f6"]);
  sproutArt([26, 160, 20, 20], "#6d6a80", ["#9992e4", "#7369b9", "#d2c8ff"]);
  sproutArt([48, 160, 20, 20], "#7a3a20", ["#ff8846", "#e45148", "#fff38c"]);
  sproutArt([70, 160, 20, 20], "#ad7155", flowerPalettes.red);
  sproutArt([92, 160, 20, 20], "#ad7155", flowerPalettes.blue);
  sproutArt([114, 160, 20, 20], "#ad7155", flowerPalettes.green);
  sproutArt([136, 160, 20, 20], "#ad7155", flowerPalettes.yellow);
  sproutArt([158, 160, 20, 20], "#87536b", blockPalettes.red);
  sproutArt([180, 160, 20, 20], "#3d5270", blockPalettes.blue);
  sproutArt([202, 160, 20, 20], "#2f5a38", blockPalettes.green);
  sproutArt([224, 160, 20, 20], "#6d5a20", blockPalettes.yellow);

  // Dirt Seed [3,193,18,18]
  seedArt([3, 193, 18, 18], ["#70e65d", "#2ab66c", "#c3ff81"]);

  // Moonflower Seed [4,223,18,18]
  seedArt([4, 223, 18, 18], ["#71d7ff", "#4f96e8", "#dbfbff"]);

  // Dirtwood Tree [4,17,20,20]
  paint([4, 17, 20, 20], (x, y) => {
    if (x >= 8 && x <= 11 && y >= 13) return y === 13 ? "#87536b" : "#ad7155";
    const canopy = Math.hypot((x - 9.5) / 8, (y - 8) / 7);
    if (canopy > 1) return null;
    if (canopy > .8) return "#2ab66c";
    return x + y < 15 ? "#c3ff81" : "#70e65d";
  });

  // Moonflower [18,194,18,18]
  sproutArt([18, 194, 18, 18], "#ad7155", ["#d982ff", "#a34fde", "#f5c2ff"]);

  // Sky Gems in an isolated atlas slot
  paint([280, 220, 18, 18], (x, y) => {
    const facet = Math.abs(x - 8.5) + Math.abs(y - 8.5);
    if (facet > 6.5) return null;
    if (facet > 5.4) return "#d9a72e";
    if (x - y < -1.5 && facet < 5) return "#fff3ad";
    return "#ffdf5f";
  });

  return canvas;
}

export async function loadAssets() {
  const sky = await loadImage("./skytexture.jpg");
  return { sky, sunsetSky: createSunsetSky(), winterDaySky: createWinterSky(false), winterNightSky: createWinterSky(true), tiles: createTileAtlas() };
}

export function createWinterSky(night) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 520);
  gradient.addColorStop(0, night ? "#08132f" : "#72bde5");
  gradient.addColorStop(1, night ? "#244e73" : "#e1f6ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 520);
  ctx.fillStyle = night ? "#f2f4ff" : "#fff5cb";
  ctx.beginPath();
  ctx.arc(715, 100, night ? 24 : 34, 0, Math.PI * 2);
  ctx.fill();
  if (night) {
    for (let i = 0; i < 85; i++) {
      ctx.globalAlpha = .35 + (i % 5) * .13;
      ctx.fillRect((i * 127 + 19) % 900, (i * 71 + 13) % 330, i % 9 === 0 ? 2 : 1, 2);
    }
    ctx.globalAlpha = 1;
  }
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = night ? (layer ? "#35637d" : "#274660") : (layer ? "#b4d8e9" : "#98bfd8");
    ctx.beginPath();
    ctx.moveTo(0, 520);
    for (let x = 0; x <= 960; x += 80) ctx.lineTo(x, 360 + layer * 55 - Math.sin(x * .02 + layer * 2) * 55);
    ctx.lineTo(900, 520);
    ctx.fill();
  }
  return canvas;
}

export function createSunsetSky() {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#3159a8");
  gradient.addColorStop(.48, "#f07a78");
  gradient.addColorStop(1, "#ffd37d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff2a8";
  ctx.beginPath();
  ctx.arc(690, 280, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.5)";
  for (const [x, y, w] of [[90,110,170],[380,155,130],[720,80,120]]) {
    ctx.fillRect(x, y, w, 12);
    ctx.fillRect(x + 25, y - 12, w - 55, 12);
  }
  return canvas;
}
