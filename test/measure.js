global.window = global;
const planck = require('../js/planck.min.js');
const { LEVELS } = require('../js/level.js');
const Game = require('../js/game.js');
const PPM = Game.PPM;
const level = JSON.parse(JSON.stringify(LEVELS[0]));
level.hopInterval = 3.0; level.firstHopDelay = 0.3; // one hop early, next far away

const g = new Game(planck, level);
console.log('hopper mass (kg):', g.hopper.body.getMass().toFixed(3));
g.start();
const s0 = g.getState().hopper, startX=s0.x, startY=s0.y;
let hopped=false, vAfter=null, apex=0, landX=null;
for(let i=0;i<300;i++){
  g.step(1/60);
  const v=g.hopper.body.getLinearVelocity(), h=g.getState().hopper;
  if(!hopped && v.y*PPM<-1){ hopped=true; vAfter={vx:+(v.x*PPM).toFixed(1),vy:+(v.y*PPM).toFixed(1)}; }
  if(hopped){ apex=Math.max(apex,startY-h.y);
    if(h.y>=startY-0.5 && g.time>0.4){ landX=h.x; break; } }
}
console.log('takeoff px/s:', vAfter, '| apex px:', apex.toFixed(1), '| horizontal dx px:', landX!==null?(landX-startX).toFixed(1):'nolanding');
