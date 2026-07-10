global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

function run(levelIdx, items, maxT=30){
  const g = new Game(planck, LEVELS[levelIdx]);
  for(const it of items) g.addItem(it[0], it[1], it[2]);
  let laststatus='playing';
  for(let i=0;i<60*maxT;i++){
    laststatus = g.step(1/60);
    if(laststatus!=='playing') break;
  }
  const s=g.getState();
  return {status:laststatus, saved:s.saved, dead:s.dead, t:+g.time.toFixed(2)};
}

console.log('L1 no planks   :', run(0, []));
// search 1-plank winners in the pit
let winners=[];
for(let x=420;x<=560;x+=8) for(let y=430;y<=470;y+=8){
  const r=run(0,[['plank',x,y]]); if(r.status==='won') winners.push({x,y,t:r.t});
}
console.log('L1 1-plank winners:', winners.length, winners.slice(0,6));
