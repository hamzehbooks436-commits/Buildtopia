import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { FURNITURE } from '../furniture.js';
import { ITEM_DEFS, TILE_DEFS, SHOP_ITEMS, SHOP_SECTIONS, spliceResult } from '../definitions.js';
import { World } from '../world.js';
import { createInventory, addItem, removeItem } from '../inventory.js';
import { playerOverlapsTile } from '../player.js';

assert.equal(FURNITURE.length, 10);
assert.equal(new Set(FURNITURE.map(item => item.tile)).size, 10);
const world = new World(), player = { x: 160, y: 160, width: 22, height: 32 };
for (const furniture of FURNITURE) {
  assert.equal(ITEM_DEFS[furniture.id].placesTile, furniture.tile);
  assert.equal(TILE_DEFS[furniture.tile].solid, false, 'Furniture does not block rooms');
  assert.deepEqual(TILE_DEFS[furniture.tile].drops, [{ item: furniture.id, count: 1 }]);
  assert.ok(SHOP_ITEMS.some(offer => offer.item === furniture.id));
  assert.ok(SHOP_SECTIONS.find(section => section.id === 'furniture').items.includes(furniture.id));
  world.set(6, 5, furniture.tile);
  assert.equal(World.fromSave(world.serialize()).get(6, 5), furniture.tile);
  const inventory = createInventory([{ itemId: furniture.id, count: 2 }]);
  assert.equal(inventory[0].itemId, furniture.id, 'Furniture survives inventory loading');
}
world.set(6, 5, 0);
// Actual placement code: retry, changed target and offline request each preserve
// furniture counts correctly. World transaction retries never double-charge.
const source = fs.readFileSync(new URL('../main.js', import.meta.url),'utf8');
const placement = source.slice(source.indexOf('async function placeSelected()'), source.indexOf('function updateCamera'));
const mutation = source.slice(source.indexOf('async function mutateWorld('), source.indexOf('async function savePlayerState('));
for (const mode of ['retry','changed','offline']) {
  const world = new World(); let saved = world.serialize();
  const state = { world, player, inventory:[{itemId:'wooden_chair',count:2}], selectedSlot:0, shopOpen:false, pendingWorldChange:false, inventoryBusy:false, adminTools:null,
    ITEM_DEFS,TILE_DEFS,World,spliceResult,playerOverlapsTile,addItem,removeItem,worldStateRef:{},canBuild:()=>true,notify(){},stopBreaking(){},savePlayerState(){},
    tileTarget:()=>({x:6,y:5,inBounds:true,reachable:true,tileId:world.get(6,5)}),
    runTransaction:async(_,callback)=>{
      if(mode==='offline') throw Error('offline');
      if(mode==='changed') saved.foreground[world.index(6,5)] = 56;
      callback(saved); const result = callback(saved); if(result) saved=result;
      return {committed:result!==undefined,snapshot:{val:()=>saved}};
    }
  };
  vm.createContext(state); vm.runInContext(mutation+placement,state); await state.placeSelected();
  assert.equal(state.inventory[0].count, mode==='retry'?1:2);
  assert.equal(state.world.get(6,5),mode==='retry'?98:mode==='changed'?56:0);
}
console.log('Furniture persistence, recoverable drops and ordinary block placement with retry/refunds passed.');
