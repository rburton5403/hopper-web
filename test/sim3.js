global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

function run(items, maxT=40){
  const g = new Game(planck, LEVELS[1]);
  for(const it of items) g.addItem(it[0], it[1], it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, saved:s.saved, dead:s.dead, t:+g.time.toFixed(2)};
}

// Trace one hopper's landing spots with no items (diagnostic)
function trace(){
  const g = new Game(planck, LEVELS[1]);
  let lastY=null, spots=[];
  for(let i=0;i<60*12;i++){
    g.step(1/60);
    const hs=g.getState().hoppers;
    if(hs[0]){ const h=hs[0]; if(h.alive && !h.exiting){
      // record apex-to-ground landings: when vy crosses to ~rest near floor
    }}
  }
}

console.log('L2 no items    :', run([]));
console.log('L2 planks 426/515 :', run([['plank',426,477],['plank',515,477]]));
console.log('L2 planks 3x      :', run([['plank',420,477],['plank',495,477],['plank',560,477]]));

// search two-plank bridge
let best={saved:-1};
for(let x1=400;x1<=460;x1+=8) for(let x2=490;x2<=560;x2+=8){
  const r=run([['plank',x1,477],['plank',x2,477]]);
  if(r.saved>best.saved){ best={...r,x1,x2}; }
  if(r.status==='won'){ console.log('WON 2-plank:', {x1,x2,...r}); break; }
}
console.log('best 2-plank:', best);
