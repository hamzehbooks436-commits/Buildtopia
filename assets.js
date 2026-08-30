export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
    image.src = src;
  });
}

export async function loadAssets() {
  const [sky, tiles] = await Promise.all([
    loadImage("./skytexture.jpg"),
    loadImage("./textures.jpg"),
  ]);
  return { sky, tiles };
}
