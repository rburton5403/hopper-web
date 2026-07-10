global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS={gravity:600,hopVelX:105,hopVelY:257,hopInterval:1.1,firstHopDelay:0.5,springVelX:118,springVelY:430};
function flat(){ return Object.assign({name:'t',width:1200,height:540,
  blocks:[{x:0,y:470,w:1200,h:70,tex:'grass'}], spikes:[],fires:[],
  spawns:[{x:60,y:425,dir:1,count:1,interval:1.1,startDelay:0.5}],
  portals:[{x:1100,y:900,points:1}], targetScore:1,
  inventory:{plank:9,spring:3}, edgesFlip:true}, PHYS); }
const g=new Game(planck, flat());
g.addItem('spring', 347, 462);
let launched=false, peakY=999, peakX=0, land=null, prevY=null, springX=null;
for(let i=0;i<60*7;i++){ g.step(1/60); const h=g.hoppers[0]; if(!h)continue;
  const x=h.body.getPosition().x*16, y=h.body.getPosition().y*16, vy=h.body.getLinearVelocity().y*16;
  if(!launched && vy<-300){ launched=true; springX=x; }
  if(launched){ if(y<peakY){peakY=y;peakX=x;}
    if(prevY!==null && prevY<440 && y>=440 && !land){ land={x:x.toFixed(0),y:y.toFixed(0)}; } }
  prevY=y;
}
console.log('spring placed at x=347 (floor top 470)');
console.log('launch x=', springX&&springX.toFixed(0), '| arc PEAK at x=', peakX.toFixed(0), 'y=', peakY.toFixed(0), '(height above floor rest ~', (447-peakY).toFixed(0),'px)');
console.log('lands back near floor at x=', land&&land.x);
