global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

function tryWin(plankCenters, maxT=25){
  const g = new Game(planck, LEVELS[0]);
  for(const p of plankCenters) g.addPlank(p[0],p[1]);
  g.start();
  for(let i=0;i<60*maxT;i++){
    const s=g.step(1/60);
    if(s==='won') return {result:'won',t:+g.time.toFixed(2)};
    if(s==='lost') return {result:'lost',t:+g.time.toFixed(2),x:+g.getState().hopper.x.toFixed(0)};
  }
  return {result:'timeout',x:+g.getState().hopper.x.toFixed(0)};
}

console.log('no planks        ->', tryWin([]));

// Single plank search across the pit, at platform height (top y=288 => center 296)
let winners1=[];
for(let x=280;x<=400;x+=8){
  for(let y=250;y<=300;y+=6){
    const r=tryWin([[x,y]]);
    if(r.result==='won') winners1.push({x,y,t:r.t});
  }
}
console.log('1-plank winners  ->', winners1.length);
console.log(winners1.slice(0,10));

// Two-plank winners (stepping stones)
let winners2=[];
for(let x1=270;x1<=340;x1+=16){
  for(let x2=380;x2<=460;x2+=16){
    for(let y=250;y<=300;y+=8){
      const r=tryWin([[x1,y],[x2,y]]);
      if(r.result==='won') winners2.push({x1,x2,y,t:r.t});
    }
  }
}
console.log('2-plank winners  ->', winners2.length, winners2.slice(0,6));
