global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400 };
function flat(portal){ return Object.assign({ name:'t', width:960, height:540,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:1,interval:1.1,startDelay:0.5}],
  portals:[Object.assign({points:2},portal)], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }
const g=new Game(planck, flat({x:900,y:900})); // portal out of the way
g.addItem('balloon',302,394);
let touched=false;
for(let i=0;i<60*5;i++){ g.step(1/60); const h=g.hoppers[0];
  if(h&&h.alive&&!h.exiting){ const y=h.body.getPosition().y*16, x=h.body.getPosition().x*16;
    if(h.floatT>0){ if(!touched){console.log('BALLOON TOUCHED at x='+x.toFixed(0)+' y='+y.toFixed(0)); touched=true;} if(i%6===0) console.log('  float x='+x.toFixed(0),'y='+y.toFixed(0),'floatT='+h.floatT.toFixed(2)); } } }
