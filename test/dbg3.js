global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400, balloonTime:1.3, balloonRise:170, windSpeed:70 };
function flat(portal,wind){ return Object.assign({ name:'t', width:960, height:540, wind:wind||0,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:1,interval:1.1,startDelay:0.5}],
  portals:[Object.assign({points:2},portal)], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }

// Balloon: does _balloon fire? does floatT set?
const g=new Game(planck, flat({x:900,y:900},1));
g.addItem('balloon',302,394);
let balloonCalls=0; const ob=Game.prototype._balloon; g._balloon=function(h,it){balloonCalls++; console.log('  _balloon called at t='+this.time.toFixed(2)+' item='+(!!it)+' used='+(it&&it.used)); ob.call(this,h,it);};
let maxFloat=0;
for(let i=0;i<60*6;i++){ g.step(1/60); const h=g.hoppers[0]; if(h) maxFloat=Math.max(maxFloat, h.floatT||0); }
console.log('balloonCalls='+balloonCalls,'maxFloatT='+maxFloat.toFixed(2),'items left='+g.items.length);

// verify hopper filter: check the fixture filterGroupIndex
const h=g.hoppers[0];
if(h){ const f=h.body.getFixtureList(); console.log('hopper fixture groupIndex=', f.getFilterGroupIndex && f.getFilterGroupIndex()); }
