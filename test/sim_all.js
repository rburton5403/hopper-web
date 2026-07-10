global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

function run(idx, items, maxT=55){
  const g = new Game(planck, LEVELS[idx]);
  for(const it of items) g.addItem(it[0], it[1], it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, saved:s.saved, dead:s.dead, need:s.required, total:s.total, t:+g.time.toFixed(1)};
}
function bridge(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

console.log('L1 plank@485 :', run(0,[['plank',485,455]]));
console.log('L2 bridge    :', run(1,[['plank',426,477],['plank',515,477]]));
console.log('L3 bridge    :', run(2,bridge(300,660,470)));
const b4=bridge(240,720,470); console.log('L4 bridge('+b4.length+'):', run(3,b4));
const b5=bridge(200,760,470); console.log('L5 bridge('+b5.length+'):', run(4,b5));

// Balloon lift: place a balloon in a hopper's path on level 4 left floor and
// confirm the hopper rises well above its normal apex.
function balloonLift(){
  const g=new Game(planck, LEVELS[3]);
  g.addItem('balloon', 150, 430);  // in the path, just above floor
  let base=null, maxUp=0, lifted=false;
  for(let i=0;i<60*6;i++){ g.step(1/60); const h=g.hoppers[0];
    if(h&&h.alive&&!h.exiting){ const y=h.body.getPosition().y*16; if(base===null)base=y; maxUp=Math.max(maxUp,base-y); if(h.floatT>0) lifted=true; } }
  return {touchedBalloon:lifted, maxRisePx:+maxUp.toFixed(0)};
}
console.log('balloon lift :', balloonLift(), '(normal apex ~53px)');
