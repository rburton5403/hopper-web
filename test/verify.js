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
  return (st==='won'?'WON ':'FAIL')+' '+s.score+'/'+s.targetScore+' (saved '+s.saved+', dead '+s.dead+')';
}
function planks(x0,x1,y){const a=[];const w=72;let c=x0+w/2;while(c-w/2<x1){a.push(['plank',c,y+7]);c+=w;}return a;}
function balloons(x,y,n){return Array.from({length:n},()=>['balloon',x,y]);}

console.log('L1  plank            :', run(0,[['plank',485,455]]));
console.log('L2  spring up        :', run(1,[['spring',298,462]]));
console.log('L3  barrier turn     :', run(2,[['barrier',640,430]]));
console.log('L4  balloon+wind     :', run(3,balloons(440,400,5)));
console.log('L5  bridge+2 springs :', run(4,[...planks(244,396,470),...planks(564,716,470),['spring',410,462],['spring',490,462]]));
console.log('L6  funnel+2 springs :', run(5,[...planks(360,600,470),['spring',384,462],['spring',520,462]]));
console.log('L7  barrier+plank    :', run(6,[...planks(300,420,470),['barrier',700,430]]));
console.log('L8  funnel+2 springs :', run(7,[...planks(340,620,470),['spring',384,462],['spring',512,462]]));
console.log('L9  2 barriers       :', run(8,[['barrier',320,430],['barrier',568,430]]));
console.log('L10 bridge+2 springs :', run(9,[...planks(320,640,470),['spring',380,462],['spring',512,462]]));
