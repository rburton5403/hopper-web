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
  return {status:st, score:s.score, target:s.targetScore, saved:s.saved, dead:s.dead};
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

// For a level, sweep a single spring x over [lo,hi] on top of the bridge, find best win.
function sweepSpring(idx, bridge, lo, hi){
  let best={score:-1};
  for(let sx=lo; sx<=hi; sx+=6){
    const r = run(idx, [...bridge, ['spring', sx, 462]]);
    if(r.score>best.score) best={...r, sx};
    if(r.status==='won'){ return {won:true, sx, ...r}; }
  }
  return {won:false, best};
}

// L2
{ const b=planks(360,560,470);
  console.log('L2 spring sweep:', sweepSpring(1, b, 600, 900)); }
// L3
{ const b=planks(324,556,470);
  console.log('L3 spring sweep:', sweepSpring(2, b, 580, 900)); }
// L4
{ const b=planks(264,636,470);
  console.log('L4 spring sweep:', sweepSpring(3, b, 660, 920)); }
