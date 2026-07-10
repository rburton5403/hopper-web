global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

const g = new Game(planck, LEVELS[0]);
g.addItem('plank', 485, 455);
let savedAt=null, wonAt=null, exitTatWin=null;
for(let i=0;i<60*20;i++){
  const st=g.step(1/60);
  if(savedAt===null && g.saved>=g.required){ savedAt=g.time; }
  if(st==='won'){ wonAt=g.time; exitTatWin=g.getState().hoppers.find(h=>h.exiting).exitT; break; }
}
console.log('saved reached target at t =', savedAt?.toFixed(2));
console.log('status became won at   t =', wonAt?.toFixed(2));
console.log('delay (should be ~0.7s twirl) =', (wonAt-savedAt).toFixed(2), 's');
console.log('exitT of hopper when won (should be 1.0) =', exitTatWin?.toFixed(3));

// pending should hold status at 'playing' during the twirl
const g2 = new Game(planck, LEVELS[0]);
g2.addItem('plank', 485, 455);
let sawPendingPlaying=false;
for(let i=0;i<60*20;i++){ const st=g2.step(1/60);
  if(g2.pending==='won' && st==='playing') sawPendingPlaying=true;
  if(st!=='playing') break; }
console.log('kept simulating while pending won:', sawPendingPlaying);
