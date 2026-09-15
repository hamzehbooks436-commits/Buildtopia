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
  return { sky, tiles: createTileAtlas() };
}
