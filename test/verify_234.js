global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');
function run(idx, items, maxT=40){
  const g = new Game(planck, LEVELS[idx]);
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, score:s.score, target:s.targetScore, saved:s.saved, dead:s.dead};
}

// L2: sweep a spring on the starting floor
{ let best={score:-1};
  for(let sx=280; sx<=420; sx+=6){ const r=run(1,[['spring',sx,462]]);
    if(r.score>best.score)best={...r,sx}; if(r.status==='won'){best={won:true,sx,...r};break;} }
  console.log('L2 (spring up):', best); }

// L3: sweep a barrier before the fire
{ let best={score:-1};
  for(let bx=640; bx<=760; bx+=6){ const r=run(2,[['barrier',bx,430]]);
    if(r.score>best.score)best={...r,bx}; if(r.status==='won'){best={won:true,bx,...r};break;} }
  console.log('L3 (barrier turn):', best); }

// L4: sweep balloon placement (several balloons); check how many reach the ledge portal
{ let best={score:-1};
  for(let gx=440; gx<=560; gx+=10){ for(let gy=400; gy<=440; gy+=10){
    const balloons=[[gx,gy],[gx,gy],[gx,gy],[gx,gy],[gx,gy]].map(b=>['balloon',b[0],b[1]]);
    const r=run(3, balloons);
    if(r.score>best.score)best={...r,gx,gy}; if(r.status==='won'){best={won:true,gx,gy,...r};break;} }
    if(best.won)break; }
  console.log('L4 (balloon wind):', best); }
