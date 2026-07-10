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
  return {status:st, score:s.score, target:s.targetScore, saved:s.saved, dead:s.dead};
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

// L5: bridge both pits, sweep two symmetric springs on the island for portal B.
{ const b=[...planks(244,396,470), ...planks(564,716,470)];
  let best={score:-1};
  for(let sxL=410; sxL<=470; sxL+=6){
    for(let sxR=490; sxR<=550; sxR+=6){
      const r=run(4, [...b, ['spring',sxL,462], ['spring',sxR,462]]);
      if(r.score>best.score) best={...r,sxL,sxR};
      if(r.status==='won'){ best={won:true,sxL,sxR,...r}; break; }
    }
    if(best.won) break;
  }
  console.log('L5 two-spring:', best);
}

// L3 BALLOON alternate: bridge, then sweep a balloon (grab point) for portal B.
{ const b=planks(324,556,470);
  let best={score:-1};
  for(let bx=600; bx<=760; bx+=8){
    for(let by=430; by<=470; by+=10){
      const r=run(2, [...b, ['balloon',bx,by]]);
      if(r.score>best.score) best={...r,bx,by};
    }
  }
  console.log('L3 best single-balloon (adds to bridge->A):', best);
}
