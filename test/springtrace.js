global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400, balloonTime:1.3, balloonRise:170, windSpeed:70 };
function flat(portal){ return Object.assign({ name:'t', width:960, height:540,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:3,interval:1.6,startDelay:0.5}],
  portals:[Object.assign({points:2},portal)], targetScore:6,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }
const g=new Game(planck, flat({x:338-24,y:300-24}));
g.addItem('spring',347,462);
for(let i=0;i<60*14;i++){ g.step(1/60);
  if(i%120===0){ const line=g.hoppers.map(h=>{const p=h.body.getPosition();const rest=g._isResting(h);const ts=g._touchingSpring(h);
    return 'x'+(p.x*16).toFixed(0)+' y'+(p.y*16).toFixed(0)+(h.exiting?'EXIT':'')+(rest?'R':'')+(ts?'S':''); }).join(' | ');
    console.log('t='+g.time.toFixed(1),'saved='+g.saved,'|',line); }
}
