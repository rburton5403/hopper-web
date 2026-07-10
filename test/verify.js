global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

function run(idx, items, maxT=60){
  const g = new Game(planck, LEVELS[idx]);
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, score:s.score, target:s.targetScore, saved:s.saved, dead:s.dead, t:+g.time.toFixed(1)};
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

// Level solutions
console.log('L1:', run(0, [['plank',485,455]]));
console.log('L2:', run(1, planks(360,560,470)));
console.log('L3:', run(2, [...planks(324,556,470), ['spring',700,462]]));
console.log('L4:', run(3, [...planks(264,636,470), ['spring',760,462]]));
console.log('L5:', run(4, [...planks(244,396,470), ...planks(564,716,470), ['spring',480,462]]));

// STALL: trap the only hopper (L1) under a plank right above spawn -> should end 'lost'
console.log('stall(trap L1):', run(0, [['plank',120,360]], 20));
