global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400 };
function flat(portal){ return Object.assign({ name:'t', width:960, height:540,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:1,interval:1.1,startDelay:0.5}],
  portals:[Object.assign({points:2},portal)], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }
// SINGLE hopper, spring, no portal in the way (put portal far) to see bounce height
const g=new Game(planck, flat({x:900,y:900}));
g.addItem('spring',347,462);
let maxUp=999;
for(let i=0;i<60*8;i++){ g.step(1/60); const h=g.hoppers[0];
  if(h&&h.alive){ const y=h.body.getPosition().y*16, x=h.body.getPosition().x*16, vy=h.body.getLinearVelocity().y*16;
    const ts=g._touchingSpring(h); maxUp=Math.min(maxUp,y);
    if(i>=150 && i<=230 && i%3===0) console.log('t='+g.time.toFixed(2),'x='+x.toFixed(0),'y='+y.toFixed(0),'vy='+vy.toFixed(0),'spring='+ts); } }
console.log('peak y (min):', maxUp.toFixed(0), '(rest ~431 on spring; portal would be ~300)');
