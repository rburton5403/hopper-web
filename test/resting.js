global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');

// Instrument _hop to assert the hopper was resting at every hop.
function airborneHops(levelIdx, items){
  const g = new Game(planck, LEVELS[levelIdx]);
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let total=0, bad=0;
  const orig = Game.prototype._hop;
  g._hop = function(h){ total++; if(!this._isResting(h)) bad++; orig.call(this,h); };
  for(let i=0;i<60*25;i++){ if(g.step(1/60)!=='playing') break; }
  return { totalHops: total, midAirHops: bad };
}

// Level 2 has a spring available — put one where a hopper lands so it bounces high.
console.log('L2 with spring bounce:', airborneHops(1, [['spring', 210, 462]]));
console.log('L1 normal           :', airborneHops(0, [['plank',485,455]]));
