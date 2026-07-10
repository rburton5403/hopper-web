global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');

const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400 };
function flatLevel(portal, extra){
  return Object.assign({
    name:'t', width:960, height:540,
    blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}],
    spikes:[], fires:[],
    spawns:[{x:60,y:425,dir:1,count:3,interval:1.1,startDelay:0.8}],
    portals:[Object.assign({points:2}, portal)],
    targetScore:2, inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true,
  }, PHYS, extra);
}
function trySave(portal, items, maxT=14){
  const g = new Game(planck, flatLevel(portal));
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  for(let i=0;i<60*maxT;i++){ g.step(1/60); }
  return g.score; // points scored = (#saved)*2
}

// SPRING: spring at a landing spot (~347). Sweep portal center to find catches.
console.log('=== SPRING (spring center 347,462) ===');
let best=null;
for(let px=360;px<=520;px+=20) for(let py=240;py<=360;py+=20){
  const sc = trySave({x:px-24,y:py-24}, [['spring',347,462]]);
  if(sc>0){ if(!best||sc>best.sc) best={px,py,sc}; }
}
console.log('best spring catch:', best);

// BALLOON: balloon near a hop apex (~302,394). Sweep portal center.
console.log('=== BALLOON (balloon center 302,394) ===');
let best2=null;
for(let px=340;px<=520;px+=20) for(let py=150;py<=300;py+=20){
  const sc = trySave({x:px-24,y:py-24}, [['balloon',302,394]]);
  if(sc>0){ if(!best2||sc>best2.sc) best2={px,py,sc}; }
}
console.log('best balloon catch:', best2);
