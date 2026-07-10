global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');
function run(idx, items, maxT=80){
  const g = new Game(planck, LEVELS[idx]);
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let st='playing';
  for(let i=0;i<60*maxT;i++){ st=g.step(1/60); if(st!=='playing') break; }
  const s=g.getState();
  return {status:st, score:s.score, target:s.targetScore, saved:s.saved, dead:s.dead};
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}

// L6: bridge central pit + two springs to central portal
function L6(){ const b=planks(360,600,470); let best={score:-1};
  for(let l=384;l<=440;l+=8)for(let r=520;r<=572;r+=8){ const r2=run(5,[...b,['spring',l,462],['spring',r,462]]);
    if(r2.score>best.score)best={...r2,l,r}; if(r2.status==='won')return {won:true,l,r,...r2}; } return {won:false,best}; }
// L7: barrier flips crowd + plank bridges gap 300..420 back to left portal
function L7(){ const p=planks(300,420,470); let best={score:-1};
  for(let bx=700;bx<=820;bx+=8){ const r=run(6,[...p,['barrier',bx,430]]);
    if(r.score>best.score)best={...r,bx}; if(r.status==='won')return {won:true,bx,...r}; } return {won:false,best}; }
// L8: bridge + two springs (spikes present)
function L8(){ const b=planks(340,620,470); let best={score:-1};
  for(let l=384;l<=448;l+=8)for(let r=520;r<=584;r+=8){ const r2=run(7,[...b,['spring',l,462],['spring',r,462]]);
    if(r2.score>best.score)best={...r2,l,r}; if(r2.status==='won')return {won:true,l,r,...r2}; } return {won:false,best}; }
// L9: two barriers flip both crowds back to side portals
function L9(){ let best={score:-1};
  for(let l=320;l<=392;l+=8)for(let r=568;r<=640;r+=8){ const r2=run(8,[['barrier',l,430],['barrier',r,430]]);
    if(r2.score>best.score)best={...r2,l,r}; if(r2.status==='won')return {won:true,l,r,...r2}; } return {won:false,best}; }

console.log('L6:', L6());
console.log('L7:', L7());
console.log('L8:', L8());
console.log('L9:', L9());
