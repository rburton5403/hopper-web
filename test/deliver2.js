global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400 };
function flat(portal){ return Object.assign({ name:'t', width:960, height:540,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:4,interval:1.1,startDelay:0.6}],
  portals:[Object.assign({points:2},portal)], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }
function saved(portal, items){ const g=new Game(planck, flat(portal));
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  for(let i=0;i<60*16;i++){ g.step(1/60); } return {saved:g.saved,score:g.score}; }

console.log('=== SPRING: portal directly above spring(347) ===');
for(let px=326;px<=350;px+=4) for(let py=288;py<=316;py+=6){
  const r=saved({x:px-24,y:py-24}, [['spring',347,462]]);
  if(r.saved>0) console.log('portalC('+px+','+py+') -> saved '+r.saved+'/4');
}
console.log('=== BALLOON: portal along diagonal (balloon 302,394) ===');
for(let px=350;px<=390;px+=8) for(let py=200;py<=260;py+=10){
  const r=saved({x:px-24,y:py-24}, [['balloon',302,394]]);
  if(r.saved>0) console.log('portalC('+px+','+py+') -> saved '+r.saved+'/4');
}
