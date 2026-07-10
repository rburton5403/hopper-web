global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400 };
function flat(portal){ return Object.assign({ name:'t', width:960, height:540,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:4,interval:1.1,startDelay:0.6}],
  portals:[Object.assign({points:2},portal)], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }
const g=new Game(planck, flat({x:338-24,y:300-24}));
g.addItem('spring',347,462);
for(let i=0;i<60*20;i++){ g.step(1/60); }
console.log('saved:',g.saved,'dead:',g.dead,'total:',g.totalToSpawn);
g.hoppers.forEach((h,i)=>{ const p=h.body.getPosition(); console.log('hopper',i,'alive='+h.alive,'exiting='+h.exiting,'x='+(p.x*16).toFixed(0),'y='+(p.y*16).toFixed(0),'dir='+h.dir); });
