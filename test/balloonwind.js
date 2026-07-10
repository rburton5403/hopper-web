global.window = global;
const planck = require('../js/planck.min.js');
const Game = require('../js/game.js');
const PHYS = { gravity:600, hopVelX:105, hopVelY:257, hopInterval:1.1, firstHopDelay:0.5, springVelY:400, balloonTime:1.3, balloonRise:170, windSpeed:70 };
function flat(wind){ return Object.assign({ name:'t', width:960, height:540, wind:wind,
  blocks:[{x:0,y:470,w:960,h:70,tex:'grass'}], spikes:[], fires:[],
  spawns:[{x:60,y:425,dir:1,count:1,interval:1.1,startDelay:0.5}],
  portals:[{x:900,y:900,points:2}], targetScore:2,
  inventory:{plank:9,barrier:3,spring:3,balloon:3}, edgesFlip:true }, PHYS); }
function drift(wind){
  const g=new Game(planck, flat(wind)); g.addItem('balloon',302,394);
  let start=null,end=null,peak=999;
  for(let i=0;i<60*5;i++){ g.step(1/60); const s=g.getState().hoppers[0];
    if(s && s.floating){ if(!start)start={x:s.x,y:s.y}; end={x:s.x,y:s.y}; peak=Math.min(peak,s.y); } }
  return {wind, riseFromTouch:start?(start.y-peak).toFixed(0):null, driftX:start&&end?(end.x-start.x).toFixed(0):null, endX:end?end.x.toFixed(0):null};
}
console.log('wind=0 :', drift(0));
console.log('wind=+1:', drift(1));
console.log('wind=-1:', drift(-1));
