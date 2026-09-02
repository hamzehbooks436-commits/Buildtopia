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
function createTileAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 352;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  const noise = (x, y) => {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };

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

  const speckle = (x, y, base, dark, light, salt = 0) => {
    const roll = noise(x + salt, y + salt * 3);
    return roll < .16 ? dark : roll > .86 ? light : base;
  };

  // A rounded seed blob on transparency, tinted with a palette.
  const seedArt = (rect, [base, outline, shine]) => paint(rect, (x, y) => {
    const seed = Math.hypot((x - 8.5) / 4.4, (y - 9.5) / 3.1);
    if (seed > 1) return null;
    if (seed > .82) return outline;
    if (x + y < 12) return shine;
    return base;
  });

  // A sprout with a stem and a round bloom of the given palette.
  const sproutArt = (rect, stem, [base, dark, light], center = "#ffe77a") => paint(rect, (x, y) => {
    const w = rect[2];
    const h = rect[3];
    if (x >= Math.floor(w / 2) - 1 && x <= Math.floor(w / 2) + 1 && y >= Math.floor(h * .62)) return y === Math.floor(h * .62) ? "#5d4436" : stem;
    const bloom = Math.hypot((x - (w - 1) / 2) / (w * .33), (y - h * .4) / (h * .32));
    if (bloom > 1) return null;
    if (bloom > .78) return dark;
    if (Math.hypot(x - (w - 1) / 2, y - h * .4) < Math.max(1.8, w * .11)) return center;
    const roll = noise(x + 21, y + 9);
    return roll < .22 ? light : base;
  });

  // A solid speckled building block with beveled edges.
  const blockArt = (rect, [base, dark, light], salt) => paint(rect, (x, y) => {
    if (y === 0) return light;
    if (x === 0 || y === rect[3] - 1 || x === rect[2] - 1) return dark;
    return speckle(x, y, base, dark, light, salt);
  });

  // Dirt [84,12,20,20]
  paint([84, 12, 20, 20], (x, y) => speckle(x, y, "#9f633f", "#8a5233", "#b0714a"));

  // Rock [139,12,20,20]
  paint([139, 12, 20, 20], (x, y) => {
    if (y === 0) return "#8f8aa8";
    if (x === 0 || y === 19 || x === 19) return "#635e7c";
    return speckle(x, y, "#7d7896", "#6b6684", "#8d88a5", 5);
  });

  // Bedrock [314,286,18,18]
  paint([314, 286, 18, 18], (x, y) => {
    const chunk = noise(Math.floor(x / 3) + 7, Math.floor(y / 3) + 3);
    if (chunk < .3) return speckle(x, y, "#443f5e", "#3a3650", "#4a4666", 9);
    if (chunk < .62) return speckle(x, y, "#35314a", "#2f2b42", "#3a3650", 13);
    return speckle(x, y, "#403c55", "#35314a", "#4b4766", 17);
  });

  // White Door [314,40,18,18]
  paint([314, 40, 18, 18], (x, y) => {
    if (x === 0 || x === 17 || y === 0 || y === 17) return "#8d89a0";
    if (x === 13 && y === 9) return "#d9a72e";
    if (x === 2 || x === 15 || y === 2 || y === 15) return "#c2bed4";
    return speckle(x, y, "#f4f2fa", "#e6e2f0", "#ffffff", 29);
  });

  // World Lock [314,64,18,18]
  paint([314, 64, 18, 18], (x, y) => {
    if (x === 0 || x === 17 || y === 0 || y === 17) return "#c99a32";
    if ((y === 2 || y === 3) && x >= 5 && x <= 12 && (x <= 6 || x >= 11)) return "#8a6420";
    if (Math.hypot(x - 8.5, y - 10) < 2.2) return "#8a6420";
    return speckle(x, y, "#f2c14e", "#d9a72e", "#ffe08a", 25);
  });

  // Clay [84,40,20,20]
  blockArt([84, 40, 20, 20], ["#a8a4b8", "#8d89a0", "#c2bed0"], 3);

  // Lava [139,40,20,20]
  paint([139, 40, 20, 20], (x, y) => {
    if (y < 2) return noise(x + 31, y + 7) < .5 ? "#ffdd55" : "#ffb43a";
    const roll = noise(x + 31, y + 7);
    if (roll < .15) return "#ffdd55";
    if (roll > .85) return "#a83a1a";
    return roll > .72 ? "#f28a3a" : "#e06a2a";
  });

  // Flowers [4,60] [26,60] [48,60] [70,60] (18x18)
  const flowerPalettes = {
    red: ["#e05a5a", "#b83c3c", "#f28c8c"],
    blue: ["#5a8ae0", "#3c63b8", "#8cb2f2"],
    green: ["#58b858", "#3a8a3a", "#8cd88c"],
    yellow: ["#e0c84a", "#b89a2e", "#f2e286"],
  };
  [["red", 4], ["blue", 26], ["green", 48], ["yellow", 70]].forEach(([color, sx]) => {
    sproutArt([sx, 60, 18, 18], "#705042", flowerPalettes[color]);
  });

  // Colored blocks [4,90] [28,90] [52,90] [76,90] (20x20)
  const blockPalettes = {
    red: ["#b8524c", "#8f3a36", "#d4736c"],
    blue: ["#5278b8", "#3a5a8f", "#7398d4"],
    green: ["#4e9e58", "#387842", "#6fbf78"],
    yellow: ["#c8a83e", "#9c8028", "#e0c85e"],
  };
  [["red", 4], ["blue", 28], ["green", 52], ["yellow", 76]].forEach(([color, sx], index) => {
    blockArt([sx, 90, 20, 20], blockPalettes[color], 21 + index * 4);
  });

  // Seed row at y=130 (18x18, step 22)
  seedArt([4, 130, 18, 18], ["#a8a4b8", "#8d89a0", "#dcd8e8"]);
  seedArt([26, 130, 18, 18], ["#7d7896", "#635e7c", "#b6b1c9"]);
  seedArt([48, 130, 18, 18], ["#e06a2a", "#a83a1a", "#ffdd55"]);
  seedArt([70, 130, 18, 18], flowerPalettes.red);
  seedArt([92, 130, 18, 18], flowerPalettes.blue);
  seedArt([114, 130, 18, 18], flowerPalettes.green);
  seedArt([136, 130, 18, 18], flowerPalettes.yellow);
  seedArt([158, 130, 18, 18], blockPalettes.red);
  seedArt([180, 130, 18, 18], blockPalettes.blue);
  seedArt([202, 130, 18, 18], blockPalettes.green);
  seedArt([224, 130, 18, 18], blockPalettes.yellow);

  // Crop row at y=160 (20x20, step 22)
  sproutArt([4, 160, 20, 20], "#6d6a80", ["#a8a4b8", "#8d89a0", "#c2bed0"]);
  sproutArt([26, 160, 20, 20], "#6d6a80", ["#7d7896", "#635e7c", "#9a95b2"]);
  sproutArt([48, 160, 20, 20], "#7a3a20", ["#e06a2a", "#a83a1a", "#ffdd55"]);
  sproutArt([70, 160, 20, 20], "#705042", flowerPalettes.red);
  sproutArt([92, 160, 20, 20], "#705042", flowerPalettes.blue);
  sproutArt([114, 160, 20, 20], "#705042", flowerPalettes.green);
  sproutArt([136, 160, 20, 20], "#705042", flowerPalettes.yellow);
  sproutArt([158, 160, 20, 20], "#5d4436", blockPalettes.red);
  sproutArt([180, 160, 20, 20], "#3d5270", blockPalettes.blue);
  sproutArt([202, 160, 20, 20], "#2f5a38", blockPalettes.green);
  sproutArt([224, 160, 20, 20], "#6d5a20", blockPalettes.yellow);

  // Dirt Seed [3,193,18,18]
  seedArt([3, 193, 18, 18], ["#75bd62", "#4f8f45", "#a5e08a"]);

  // Moonflower Seed [4,223,18,18]
  seedArt([4, 223, 18, 18], ["#82b4df", "#5d8fc4", "#cfe7fb"]);

  // Dirtwood Tree [4,17,20,20]
  paint([4, 17, 20, 20], (x, y) => {
    if (x >= 8 && x <= 11 && y >= 13) return y === 13 ? "#5d4436" : "#705042";
    const canopy = Math.hypot((x - 9.5) / 8, (y - 8) / 7);
    if (canopy > 1) return null;
    if (canopy > .8) return "#5a8a3c";
    const roll = noise(x + 11, y + 3);
    if (roll < .18) return "#82b85c";
    if (roll > .85) return "#5f9440";
    return "#6e9e4a";
  });

  // Moonflower [18,194,18,18]
  sproutArt([18, 194, 18, 18], "#705042", ["#af79dc", "#8f5cc0", "#d0a5f5"]);

  // Sky Gems [326,46,18,18]
  paint([326, 46, 18, 18], (x, y) => {
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
