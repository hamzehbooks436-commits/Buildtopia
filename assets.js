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

  // Dirt Seed [3,193,18,18]
  paint([3, 193, 18, 18], (x, y) => {
    const seed = Math.hypot((x - 8.5) / 4.4, (y - 9.5) / 3.1);
    if (seed > 1) return null;
    if (seed > .82) return "#4f8f45";
    if (x + y < 12) return "#a5e08a";
    return "#75bd62";
  });

  // Moonflower Seed [4,223,18,18]
  paint([4, 223, 18, 18], (x, y) => {
    const seed = Math.hypot((x - 8.5) / 4.4, (y - 9.5) / 3.1);
    if (seed > 1) return null;
    if (seed > .82) return "#5d8fc4";
    if (x + y < 12) return "#cfe7fb";
    return "#82b4df";
  });

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
  paint([18, 194, 18, 18], (x, y) => {
    if (x >= 8 && x <= 10 && y >= 12) return "#705042";
    const bloom = Math.hypot((x - 8.5) / 6.5, (y - 8) / 6);
    if (bloom > 1) return null;
    if (bloom > .78) return "#8f5cc0";
    if (Math.hypot(x - 8.5, y - 8) < 2.2) return "#ffe77a";
    const roll = noise(x + 21, y + 9);
    return roll < .22 ? "#d0a5f5" : "#af79dc";
  });

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
