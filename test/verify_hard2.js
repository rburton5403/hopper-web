global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');
function run(idx, items, maxT=90){
  const g = new Game(planck, LEVELS[idx]);
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, score:s.score, target:s.targetScore, saved:s.saved, dead:s.dead};
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

// L8: bridge + 2 springs central
function L8(){ const b=planks(340,620,470); let best={score:-1};
  for(let l=384;l<=456;l+=8)for(let r=512;r<=584;r+=8){ const r2=run(7,[...b,['spring',l,462],['spring',r,462]]);
    if(r2.score>best.score)best={...r2,l,r}; if(r2.status==='won')return {won:true,l,r,...r2}; } return {won:false,best}; }
// L10: bridge + 2 springs central (all hoppers to central 3pt)
function L10(){ const b=planks(320,640,470); let best={score:-1};
  for(let l=380;l<=456;l+=8)for(let r=512;r<=588;r+=8){ const r2=run(9,[...b,['spring',l,462],['spring',r,462]]);
    if(r2.score>best.score)best={...r2,l,r}; if(r2.status==='won')return {won:true,l,r,...r2}; } return {won:false,best}; }

console.log('L8:', L8());
console.log('L10:', L10());
