// Compact furniture fits one tile and lets players walk through furnished rooms.
export const FURNITURE = [
  { id: 'wooden_chair', tile: 98, name: 'Wooden Chair', color: '#bd854f', cost: 15 },
  { id: 'dining_table', tile: 99, name: 'Dining Table', color: '#d19b60', cost: 20 },
  { id: 'cozy_bed', tile: 100, name: 'Cozy Bed', color: '#6badd0', cost: 35 },
  { id: 'soft_sofa', tile: 101, name: 'Soft Sofa', color: '#bd735e', cost: 30 },
  { id: 'bookshelf', tile: 102, name: 'Bookshelf', color: '#b48658', cost: 25 },
  { id: 'wooden_cabinet', tile: 103, name: 'Wooden Cabinet', color: '#c49767', cost: 25 },
  { id: 'floor_lamp', tile: 104, name: 'Floor Lamp', color: '#f6d889', cost: 30, lightRadius: 5 },
  { id: 'woven_rug', tile: 105, name: 'Woven Rug', color: '#bc6666', cost: 10 },
  { id: 'potted_plant', tile: 106, name: 'Potted Plant', color: '#78b56e', cost: 15 },
  { id: 'stone_fireplace', tile: 107, name: 'Stone Fireplace', color: '#9a8c83', cost: 45, lightRadius: 5 },
];

export function drawFurniture(ctx, id, x, y, size) {
  if (id !== 'wooden_door' && !FURNITURE.some(item => item.id === id)) return false;
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 20, size / 20);
  const rect = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const wood = '#a56f43', edge = '#68472e', light = '#dfb681';
  if (id === 'wooden_door') {
    // An open leaf leaves the entrance visibly clear.
    rect(edge, 1, 1, 18, 3); rect(edge, 1, 4, 3, 16); rect(edge, 16, 4, 3, 16);
    rect(light, 2, 2, 16, 2); rect(wood, 2, 4, 2, 16); rect(wood, 16, 4, 2, 16);
    rect('#81512f', 12, 5, 4, 14); rect('#be8953', 13, 6, 2, 12); rect('#f1d183', 12, 11, 1, 2);
  } else if (id === 'wooden_chair') {
    rect(edge, 4, 3, 3, 16); rect(wood, 7, 4, 8, 6); rect(light, 7, 4, 8, 2);
    rect(edge, 4, 12, 13, 3); rect(wood, 5, 11, 12, 3); rect(edge, 14, 14, 2, 5);
  } else if (id === 'dining_table') {
    rect(edge, 2, 10, 16, 3); rect(light, 2, 8, 16, 3); rect(wood, 4, 13, 2, 6); rect(wood, 14, 13, 2, 6);
    rect('#e5e2d4', 8, 7, 5, 2); rect('#c9784e', 9, 6, 3, 1);
  } else if (id === 'cozy_bed') {
    rect(edge, 1, 8, 2, 11); rect(wood, 2, 13, 17, 4); rect(edge, 16, 16, 2, 3);
    rect('#f4eee3', 3, 10, 15, 4); rect('#75b8d7', 9, 10, 9, 5); rect('#4184ad', 9, 14, 9, 2); rect('#fffdf4', 3, 9, 5, 3);
  } else if (id === 'soft_sofa') {
    rect('#844e46', 2, 7, 16, 10); rect('#bc7367', 3, 6, 14, 7); rect('#d48f7e', 4, 12, 12, 4);
    rect('#9d5e54', 1, 10, 3, 7); rect('#9d5e54', 16, 10, 3, 7); rect(edge, 3, 17, 2, 2); rect(edge, 15, 17, 2, 2);
  } else if (id === 'bookshelf') {
    rect(edge, 2, 2, 16, 17); rect(wood, 3, 3, 14, 15);
    for (const y of [4, 11]) { rect('#513c32', 4, y, 12, 5); for (let i = 0; i < 5; i++) rect(['#729fa5','#c77455','#d5b267','#829462','#9b799d'][i], 4 + i * 2.5, y + i % 2, 2, 5 - i % 2); }
    rect(light, 2, 9, 16, 2); rect(light, 2, 17, 16, 2);
  } else if (id === 'wooden_cabinet') {
    rect(edge, 2, 4, 16, 15); rect(light, 2, 3, 16, 2); rect(wood, 3, 6, 14, 11);
    rect(edge, 9, 5, 1, 12); rect('#eccb81', 7, 10, 1, 2); rect('#eccb81', 12, 10, 1, 2);
  } else if (id === 'floor_lamp') {
    rect('#64524a', 9, 6, 2, 12); rect('#8f7556', 6, 18, 8, 1);
    rect('#cf9d55', 4, 7, 12, 2); rect('#f7d789', 5, 3, 10, 5); rect('#fff0b8', 7, 3, 6, 2);
  } else if (id === 'woven_rug') {
    rect('#814543', 1, 16, 18, 3); rect('#dc9d77', 2, 16, 16, 1); rect('#bd6662', 3, 17, 14, 1);
    for (let i=0;i<4;i++) rect('#e8ba84', 4+i*4, 17, 2, 1);
  } else if (id === 'potted_plant') {
    rect('#a65e43', 6, 13, 8, 3); rect('#c58057', 7, 16, 6, 3); rect('#477849', 9, 6, 2, 8);
    rect('#73a862', 4, 7, 6, 3); rect('#8abb72', 10, 4, 6, 3); rect('#5f9855', 6, 3, 4, 4); rect('#87b76f', 10, 9, 6, 3);
  } else if (id === 'stone_fireplace') {
    rect('#665f5e', 2, 5, 16, 14); rect('#b2a399', 1, 4, 18, 3); rect('#928780', 3, 7, 14, 11);
    rect('#33272a', 6, 9, 8, 8); rect(wood, 6, 16, 8, 2); rect('#e88a3d', 7, 12, 6, 5);
    rect('#ffd077', 9, 10, 2, 7); rect('#ffe7a3', 9, 14, 2, 2); rect('#b2a399', 1, 18, 18, 1);
  }
  ctx.restore(); return true;
}
