global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

// BARRIER on Level 2: place in the hoppers' rightward path on the left floor.
function barrierTest(){
  const g = new Game(planck, LEVELS[1]);
  const placed = g.addItem('barrier', 250, 432); // left floor top=470; barrier sits on it
  let dirs=new Set(), flips=0;
  const origFlip = Game.prototype._flip;
  g._flip = function(h){ flips++; origFlip.call(this,h); };
  let minX=1e9,maxX=-1e9;
  for(let i=0;i<60*12;i++){ g.step(1/60);
    g.hoppers.forEach(h=>{ if(h.alive&&!h.exiting){ dirs.add(h.dir); const x=h.body.getPosition().x*16; minX=Math.min(minX,x);maxX=Math.max(maxX,x);} }); }
  return { placed, flips, sawBothDirs: dirs.has(1)&&dirs.has(-1), xRange:[+minX.toFixed(0),+maxX.toFixed(0)] };
}

// SPRING on Level 2: place at a landing spot; expect a higher apex than normal.
function springTest(){
  function apex(useSpring, sx){
    const g = new Game(planck, LEVELS[1]);
    if(useSpring) g.addItem('spring', sx, 462); // left floor, top ~470
    let base=null, mx=0;
    for(let i=0;i<60*7;i++){ g.step(1/60); const h=g.hoppers[0]; if(h&&h.alive&&!h.exiting){const y=h.body.getPosition().y*16; if(base===null)base=y; mx=Math.max(mx, base-y);} }
    return +mx.toFixed(0);
  }
  // find a landing x first (no spring): sample hopper x when near floor
  return { apexNoSpring: apex(false), apexWithSpring_at159: apex(true,159), apexWithSpring_at248: apex(true,248) };
}

console.log('barrier:', barrierTest());
console.log('spring :', springTest());
