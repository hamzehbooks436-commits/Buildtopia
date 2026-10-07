// Stable IDs are stored with each NPC so adding outfits never changes its look.
export const NPC_OUTFIT_GROUPS = [
  { id: "normal", name: "Normal", count: 20 },
  { id: "winter", name: "Winter", count: 7 },
  { id: "summer", name: "Summer", count: 8 },
  { id: "autumn", name: "Autumn", count: 7 },
];

export const NPC_OUTFITS = [
  // Seven autumn outfits shared by the market and NPC wardrobe.
  { id: "autumn-maple-knit", name: "Maple Knit Sweater", group: "autumn", style: "knit", top: "#bd6038", bottom: "#493d37", trim: "#f5cf91" },
  { id: "autumn-plaid", name: "Harvest Plaid Shirt", group: "autumn", style: "jacket", top: "#96503c", bottom: "#344960", trim: "#e6b56a", pattern: "checks" },
  { id: "autumn-cardigan", name: "Mustard Cardigan", group: "autumn", style: "cardigan", top: "#c49a3c", bottom: "#554437", trim: "#f5e4bb" },
  { id: "autumn-trench", name: "Chestnut Trench Coat", group: "autumn", style: "trench", top: "#96664b", bottom: "#343c49", trim: "#e3c498" },
  { id: "autumn-scarf", name: "Forest Coat & Scarf", group: "autumn", style: "wool", top: "#50674a", bottom: "#403a37", trim: "#dc9147" },
  { id: "autumn-hoodie", name: "Pumpkin Hoodie", group: "autumn", style: "hoodie", top: "#d17c36", bottom: "#4b405b", trim: "#f4d6a3" },
  { id: "autumn-dress", name: "Burgundy Autumn Dress", group: "autumn", style: "dress", top: "#883e52", bottom: "#883e52", trim: "#d5b16a" },
  // 20 everyday outfits, with different cuts, details and accessories.
  { id: "casual-tee", name: "Casual T-shirt", group: "normal", style: "tee", top: "#8df0a4", bottom: "#345d8c", trim: "#edf9ef" },
  { id: "striped-tee", name: "Striped T-shirt", group: "normal", style: "tee", top: "#58b8ed", bottom: "#283f61", trim: "#ffffff", pattern: "stripes" },
  { id: "hoodie", name: "Hoodie", group: "normal", style: "hoodie", top: "#ae82df", bottom: "#354157", trim: "#e5d3ff" },
  { id: "denim-jacket", name: "Denim Jacket", group: "normal", style: "jacket", top: "#508cca", bottom: "#283653", trim: "#f4df9d", pattern: "pockets" },
  { id: "varsity-jacket", name: "Varsity Jacket", group: "normal", style: "varsity", top: "#d74f67", bottom: "#343d60", trim: "#fff2d6" },
  { id: "tracksuit", name: "Tracksuit", group: "normal", style: "tracksuit", top: "#4f6cce", bottom: "#4f6cce", trim: "#ffffff" },
  { id: "overalls", name: "Builder Overalls", group: "normal", style: "overalls", top: "#568fd0", bottom: "#355f92", trim: "#ffda72" },
  { id: "mechanic", name: "Mechanic Coveralls", group: "normal", style: "coveralls", top: "#657a8d", bottom: "#657a8d", trim: "#f0b553", pattern: "pockets" },
  { id: "chef", name: "Chef Uniform", group: "normal", style: "chef", top: "#f5f0df", bottom: "#353347", trim: "#dc5a54" },
  { id: "doctor", name: "Doctor Coat", group: "normal", style: "doctor", top: "#f1fbff", bottom: "#63b9bc", trim: "#de5374" },
  { id: "formal-suit", name: "Formal Suit", group: "normal", style: "suit", top: "#363954", bottom: "#363954", trim: "#dd5976" },
  { id: "waistcoat", name: "Waistcoat", group: "normal", style: "vest", top: "#8b604e", bottom: "#473d49", trim: "#fff2ce" },
  { id: "city-guard", name: "City Guard", group: "normal", style: "guard", top: "#467689", bottom: "#334258", trim: "#f6d168" },
  { id: "explorer", name: "Explorer Jacket", group: "normal", style: "explorer", top: "#9b8255", bottom: "#566653", trim: "#e9c67d" },
  { id: "farmer", name: "Farmer Outfit", group: "normal", style: "farmer", top: "#709c61", bottom: "#4a648e", trim: "#d8a255", pattern: "checks" },
  { id: "sailor", name: "Sailor Uniform", group: "normal", style: "sailor", top: "#ebf5ff", bottom: "#324d85", trim: "#3874c1" },
  { id: "wizard-robe", name: "Wizard Robe", group: "normal", style: "robe", top: "#8b5cbb", bottom: "#523d84", trim: "#ffe07a", pattern: "stars" },
  { id: "city-dress", name: "City Dress", group: "normal", style: "dress", top: "#d977b4", bottom: "#d977b4", trim: "#f8d6ec" },
  { id: "adventurer-tunic", name: "Adventurer Tunic", group: "normal", style: "tunic", top: "#55a68b", bottom: "#584d48", trim: "#e3ad68" },
  { id: "artist", name: "Artist Apron", group: "normal", style: "apron", top: "#e9b16f", bottom: "#555a86", trim: "#f9ecdd", pattern: "paint" },
  // 7 winter outfits: warm sleeves, coats, scarves and snow gear.
  { id: "winter-puffer", name: "Puffer Jacket", group: "winter", style: "puffer", top: "#ed8954", bottom: "#444d70", trim: "#ffe9bd" },
  { id: "winter-parka", name: "Fur-trimmed Parka", group: "winter", style: "parka", top: "#789668", bottom: "#43514a", trim: "#f7e6c9" },
  { id: "winter-wool-coat", name: "Wool Coat & Scarf", group: "winter", style: "wool", top: "#ba7895", bottom: "#4c435b", trim: "#ffd373" },
  { id: "winter-knit", name: "Cable-knit Sweater", group: "winter", style: "knit", top: "#e6c58d", bottom: "#535c86", trim: "#fff1ce" },
  { id: "winter-ski", name: "Ski Suit", group: "winter", style: "ski", top: "#53cfda", bottom: "#366db0", trim: "#ffdc68" },
  { id: "winter-snowsuit", name: "Snow Expedition Suit", group: "winter", style: "snowsuit", top: "#7494da", bottom: "#7494da", trim: "#e9f8ff" },
  { id: "winter-festive", name: "Festive Sweater", group: "winter", style: "festive", top: "#c94a68", bottom: "#3a5651", trim: "#fff1d4" },
  // 8 summer outfits: short sleeves, shorts and lightweight clothing.
  { id: "summer-tank", name: "Tank Top & Shorts", group: "summer", style: "tank", top: "#f4a454", bottom: "#5a9ec3", trim: "#fff2c9" },
  { id: "summer-hawaiian", name: "Hawaiian Shirt", group: "summer", style: "hawaiian", top: "#d87399", bottom: "#e9ce8d", trim: "#fff3b5", pattern: "flowers" },
  { id: "summer-beach", name: "Beach Shirt & Shorts", group: "summer", style: "beach", top: "#66c9c5", bottom: "#526cae", trim: "#eafcff", pattern: "waves" },
  { id: "summer-sundress", name: "Floral Sundress", group: "summer", style: "sundress", top: "#f3bd62", bottom: "#f3bd62", trim: "#fff0d6", pattern: "flowers" },
  { id: "summer-linen", name: "Linen Shirt", group: "summer", style: "linen", top: "#f0e7c7", bottom: "#b99167", trim: "#b0bfa2" },
  { id: "summer-safari", name: "Safari Outfit", group: "summer", style: "safari", top: "#cdb479", bottom: "#9b8656", trim: "#678964", pattern: "pockets" },
  { id: "summer-sport", name: "Summer Sports Kit", group: "summer", style: "sport", top: "#7394f2", bottom: "#445ca4", trim: "#fff1b6" },
  { id: "summer-lifeguard", name: "Lifeguard Outfit", group: "summer", style: "lifeguard", top: "#f5f2dd", bottom: "#e96865", trim: "#e96865" },
];

export const NPC_OUTFIT_BY_ID = Object.fromEntries(NPC_OUTFITS.map(outfit => [outfit.id, outfit]));
export function npcOutfit(id) { return NPC_OUTFIT_BY_ID[id] ?? NPC_OUTFIT_BY_ID["casual-tee"]; }

// Fit the original wardrobe coordinates onto the player's 22 x 32 pixel body.
// Presets differ in garment shape and pixel details, as well as their palette.
export function drawNpcClothes(ctx, npc) {
  const outfit = npcOutfit(npc.outfitId), style = outfit.style;
  const top = npc.outfit || outfit.top, bottom = outfit.bottom, trim = outfit.trim;
  const bodyX = x => Math.max(0, Math.min(22, Math.round((x - 3) * 22 / 27)));
  const bodyY = y => Math.max(0, Math.min(32, Math.round(y <= 24 ? 15 + (y - 10) * 11 / 14 : 26 + (y - 24) * 6 / 8)));
  const p = (color, x, y, w, h) => {
    const left = bodyX(x), top = bodyY(y);
    const width = Math.min(22 - left, Math.max(1, bodyX(x + w) - left));
    const height = Math.min(32 - top, Math.max(1, bodyY(y + h) - top));
    ctx.fillStyle = color; ctx.fillRect(left, top, width, height);
  };
  const short = outfit.group === "summer";
  const sleeveless = ["tank", "sundress", "sport", "lifeguard"].includes(style);
  const dress = ["dress", "sundress", "robe"].includes(style);
  p(npc.skin, 3, 12, 5, 13); p(npc.skin, 26, 12, 4, 13);
  p(bottom, 8, 24, 7, short ? 4 : 7); p(bottom, 18, 24, 7, short ? 4 : 7);
  if (short) { p(npc.skin, 8, 28, 7, 3); p(npc.skin, 18, 28, 7, 3); }
  p("#26394c", 7, 30, 8, 2); p("#26394c", 18, 30, 8, 2);
  p(top, 7, 10, 19, 15);
  if (!sleeveless) { p(top, 3, 12, 5, short ? 5 : 10); p(top, 26, 12, 4, short ? 5 : 10); }
  p(npc.skin, 13, 10, 7, 2);
  if (dress) { p(top, 6, 23, 21, 5); p(top, 4, 27, 25, 3); p(trim, 6, 22, 21, 2); }
  if (outfit.pattern === "stripes") for (const y of [14, 19, 23]) p(trim, 7, y, 19, 2);
  if (outfit.pattern === "checks") { for (const y of [14, 19]) p(trim, 7, y, 19, 1); for (const x of [11, 17, 23]) p(trim, x, 12, 1, 11); }
  if (outfit.pattern === "pockets") { p(trim, 9, 16, 5, 4); p(trim, 20, 16, 4, 4); }
  if (outfit.pattern === "flowers") for (const [x, y] of [[10, 15], [21, 18], [15, 23]]) { p(trim, x, y, 3, 1); p(trim, x + 1, y - 1, 1, 3); }
  if (outfit.pattern === "waves") { p(trim, 7, 17, 6, 2); p(trim, 13, 19, 6, 2); p(trim, 19, 17, 7, 2); }
  if (outfit.pattern === "stars") { p(trim, 11, 15, 3, 1); p(trim, 12, 14, 1, 3); p(trim, 21, 24, 3, 1); }
  if (outfit.pattern === "paint") { p("#ee6980", 12, 20, 3, 3); p("#65a8ef", 19, 23, 4, 2); p("#8dd687", 15, 26, 2, 2); }
  switch (style) {
    case "cardigan": p(trim, 14, 11, 6, 14); p(top, 16, 14, 2, 11); for (const y of [16, 20, 23]) p(trim, 16, y, 1, 1); p(trim, 8, 23, 6, 1); p(trim, 20, 23, 5, 1); break;
    case "trench": p(top, 5, 12, 23, 17); p(trim, 11, 12, 3, 6); p(trim, 20, 12, 3, 6); p(trim, 6, 23, 21, 2); p("#60452f", 15, 23, 4, 2); for (const y of [19, 26]) { p(trim, 13, y, 1, 1); p(trim, 21, y, 1, 1); } break;
    case "tee": p(trim, 11, 12, 11, 1); break;
    case "hoodie": p(top, 5, 4, 3, 9); p(top, 25, 4, 3, 9); p(trim, 12, 12, 1, 5); p(trim, 21, 12, 1, 5); p(trim, 12, 21, 10, 2); break;
    case "jacket": p(trim, 16, 12, 2, 12); p(trim, 8, 23, 17, 2); break;
    case "varsity": p(trim, 3, 12, 5, 10); p(trim, 26, 12, 4, 10); p(trim, 16, 11, 2, 13); p(trim, 10, 15, 3, 4); break;
    case "tracksuit": p(trim, 16, 12, 1, 13); p(trim, 8, 26, 1, 4); p(trim, 24, 26, 1, 4); p(trim, 4, 13, 1, 8); p(trim, 28, 13, 1, 8); break;
    case "overalls": p(trim, 7, 10, 19, 6); p(top, 10, 11, 3, 14); p(top, 21, 11, 3, 14); p(top, 11, 17, 12, 8); p(bottom, 14, 19, 6, 4); break;
    case "coveralls": p(trim, 16, 12, 1, 13); p("#3a4353", 7, 23, 19, 2); p(trim, 16, 23, 3, 2); break;
    case "chef": p(trim, 13, 11, 7, 2); p(trim, 8, 23, 17, 2); for (const x of [13, 20]) for (const y of [16, 20]) p("#475066", x, y, 1, 1); break;
    case "doctor": p("#68bccb", 14, 12, 5, 13); p(trim, 20, 15, 5, 1); p(trim, 22, 13, 1, 5); p("#889db2", 10, 17, 2, 5); p("#889db2", 10, 21, 4, 1); break;
    case "suit": p("#fff4e7", 13, 11, 7, 4); p(trim, 16, 13, 2, 7); p("#68708b", 11, 12, 2, 7); p("#68708b", 21, 12, 2, 7); break;
    case "vest": p(trim, 3, 12, 5, 10); p(trim, 26, 12, 4, 10); p(trim, 14, 11, 5, 3); p("#e9c27d", 16, 16, 1, 1); p("#e9c27d", 16, 20, 1, 1); break;
    case "guard": p(trim, 8, 12, 17, 2); p(trim, 20, 15, 4, 4); p("#2f3849", 7, 23, 19, 2); p(trim, 16, 23, 3, 2); break;
    case "explorer": p(trim, 9, 16, 5, 4); p(trim, 20, 16, 4, 4); for (let i = 0; i < 5; i++) p("#704633", 8 + i * 3, 11 + i * 3, 4, 3); break;
    case "farmer": p(bottom, 10, 11, 3, 14); p(bottom, 21, 11, 3, 14); p(bottom, 10, 18, 14, 7); p(trim, 12, 18, 1, 1); p(trim, 21, 18, 1, 1); break;
    case "sailor": p(trim, 8, 11, 5, 3); p(trim, 20, 11, 5, 3); p(trim, 13, 14, 7, 2); p(trim, 15, 16, 3, 6); break;
    case "robe": p(trim, 15, 12, 3, 17); p(trim, 4, 27, 25, 2); break;
    case "dress": p(trim, 10, 12, 4, 2); p(trim, 19, 12, 4, 2); p(trim, 14, 21, 5, 4); break;
    case "tunic": p(top, 6, 23, 21, 4); p(trim, 7, 22, 19, 2); p("#f3d171", 15, 22, 4, 2); p(trim, 16, 12, 1, 5); break;
    case "apron": p(trim, 10, 12, 3, 5); p(trim, 21, 12, 3, 5); p(trim, 10, 17, 14, 11); p(top, 12, 21, 10, 5); p("#ee6980", 14, 24, 3, 2); p("#65a8ef", 21, 19, 2, 2); break;
    case "puffer": p(top, 5, 12, 23, 14); for (const y of [15, 19, 23]) p("#9c593e", 6, y, 21, 1); p(trim, 16, 12, 2, 14); break;
    case "parka": p(top, 5, 9, 23, 19); p(trim, 5, 7, 4, 9); p(trim, 24, 7, 4, 9); p(trim, 7, 25, 19, 3); p(trim, 16, 12, 2, 14); break;
    case "wool": p(top, 6, 12, 21, 16); p(trim, 6, 10, 21, 4); p(trim, 20, 14, 4, 10); p("#40394d", 16, 18, 1, 1); p("#40394d", 16, 23, 1, 1); break;
    case "knit": for (const x of [10, 16, 22]) for (const y of [14, 18, 22]) { p(trim, x, y, 2, 2); p(trim, x + 1, y + 2, 2, 1); } p(trim, 7, 23, 19, 2); break;
    case "ski": p(trim, 7, 16, 19, 3); p(trim, 16, 12, 2, 13); p(trim, 3, 21, 5, 4); p(trim, 26, 21, 4, 4); p("#fafcff", 7, 29, 9, 3); p("#fafcff", 17, 29, 9, 3); break;
    case "snowsuit": p(top, 5, 5, 3, 8); p(top, 25, 5, 3, 8); p(trim, 7, 12, 19, 3); p(trim, 16, 15, 2, 15); p("#334869", 8, 28, 7, 4); p("#334869", 18, 28, 7, 4); break;
    case "festive": p(trim, 7, 13, 19, 2); p(trim, 7, 22, 19, 2); p(trim, 15, 16, 4, 4); p(trim, 13, 18, 8, 1); p(trim, 17, 15, 1, 7); break;
    case "tank": p(npc.skin, 7, 10, 3, 6); p(npc.skin, 23, 10, 3, 6); p(trim, 11, 12, 11, 1); p(trim, 8, 24, 17, 1); break;
    case "hawaiian": p(trim, 11, 11, 3, 3); p(trim, 20, 11, 3, 3); p(trim, 16, 14, 1, 10); break;
    case "beach": p(trim, 11, 12, 11, 1); p(trim, 8, 25, 7, 1); p(trim, 18, 25, 7, 1); break;
    case "sundress": p(npc.skin, 7, 10, 4, 5); p(npc.skin, 22, 10, 4, 5); p(top, 11, 10, 2, 6); p(top, 20, 10, 2, 6); p(npc.skin, 8, 30, 7, 1); p(npc.skin, 18, 30, 7, 1); break;
    case "linen": p(trim, 16, 12, 1, 13); p(trim, 9, 16, 5, 3); p(trim, 3, 16, 5, 2); p(trim, 26, 16, 4, 2); break;
    case "safari": p(trim, 7, 23, 19, 2); p("#fff0c1", 16, 23, 3, 2); p(trim, 16, 12, 1, 10); break;
    case "sport": p(trim, 7, 12, 3, 12); p(trim, 23, 12, 3, 12); p(trim, 14, 16, 5, 2); p(trim, 17, 18, 2, 4); break;
    case "lifeguard": p(trim, 13, 16, 8, 2); p(trim, 16, 13, 2, 8); p("#f8d263", 24, 23, 4, 7); break;
  }
}
