global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400 };
function flat(){ return Object.assign({ name:'t', width:960, height:540,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:1,interval:1.1,startDelay:0.5}],
  portals:[{x:400,y:300,points:2}], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }

function trace(items,label){
  const g=new Game(planck, flat());
  for(const it of items) g.addItem(it[0],it[1],it[2]);
  let sprung=0,floated=0, peak=999, peakX=0;
  const os=Game.prototype._spring; g._spring=function(h){ const before=h.body.getLinearVelocity().y*16; os.call(this,h); sprung++; };
  console.log('---',label,'---');
  for(let i=0;i<60*6;i++){ g.step(1/60); const h=g.hoppers[0];
    if(h&&h.alive&&!h.exiting){ const y=h.body.getPosition().y*16, x=h.body.getPosition().x*16; if(y<peak){peak=y;peakX=x;} if(h.floatT>0)floated++; if(i%12===0) console.log('t='+g.time.toFixed(1),'x='+x.toFixed(0),'y='+y.toFixed(0),'vy='+(h.body.getLinearVelocity().y*16).toFixed(0)); }
  }
  console.log('springFires='+sprung,'floatFrames='+floated,'peakY='+peak.toFixed(0),'peakX='+peakX.toFixed(0));
}
trace([['spring',347,462]],'SPRING at 347,462');
trace([['balloon',302,394]],'BALLOON at 302,394');
