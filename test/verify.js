global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');
function run(idx, items, maxT=70){
  const g = new Game(planck, LEVELS[idx]);
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, score:s.score+'/'+s.targetScore, saved:s.saved, dead:s.dead};
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

console.log('L1 (plank):          ', run(0, [['plank',485,455]]));
console.log('L2 (bridge->A):      ', run(1, planks(360,560,470)));
console.log('L3 (bridge+spring->B):', run(2, [...planks(324,556,470), ['spring',652,462]]));
console.log('L4 (bridge+spring->B):', run(3, [...planks(264,636,470), ['spring',720,462]]));
console.log('L5 (bridge+2 springs):', run(4, [...planks(244,396,470), ...planks(564,716,470), ['spring',410,462], ['spring',490,462]]));

// Spring no longer traps: a spring with no portal above -> hopper escapes forward (no stall-loss on L1-like flat)
const PHYS={gravity:600,hopVelX:105,hopVelY:257,hopInterval:1.1,firstHopDelay:0.5,springVelX:118,springVelY:430};
const flat=Object.assign({name:'t',width:960,height:540,blocks:[{x:0,y:470,w:960,h:70}],spikes:[],fires:[],
  spawns:[{x:200,y:425,dir:1,count:1,interval:0,startDelay:0.5}],portals:[{x:850,y:402,points:1}],targetScore:1,
  inventory:{spring:3},edgesFlip:true},PHYS);
const g=new Game(planck, flat); g.addItem('spring',300,462);
let st='playing'; for(let i=0;i<60*15;i++){ st=g.step(1/60); if(st!=='playing')break; }
console.log('spring-no-portal (should WIN, hopper arcs past):', st, 'saved', g.saved);
