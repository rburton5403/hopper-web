// Level definitions for Hopper Web (real-time, Lemmings-style).
// Coordinates are canvas pixels, origin top-left, y down. 16px == 1 physics meter.
// UMD: window.HopperLevels in the browser, require() in node for headless tests.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HopperLevels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Shared physics feel. hopInterval MUST exceed hop airtime (2*hopVelY/gravity)
  // so hoppers land and rest between hops instead of flying continuously.
  var PHYS = {
    gravity: 600,
    hopVelX: 105,
    hopVelY: 257,     // airtime ~0.86s, per-hop reach ~89px, apex ~53px
    hopInterval: 1.1,
    firstHopDelay: 0.5,
    springVelY: 400,  // spring launch (apex ~133px)
  };
  function withPhys(o) { for (var k in PHYS) if (!(k in o)) o[k] = PHYS[k]; return o; }

  var W = 960, H = 540;

  // ------------------------------------------------------------------ Level 1
  // Teacher: one hopper, one spike pit, one plank to bridge it.
  var LEVEL1 = withPhys({
    name: 'The Spike Pit',
    subtitle: 'Drop a plank to bridge the gap.',
    width: W, height: H, background: 'background',
    blocks: [
      { x: 0,   y: 430, w: 410, h: 110, tex: 'grass' },
      { x: 550, y: 430, w: 410, h: 110, tex: 'grass' },
      { x: 410, y: 500, w: 140, h: 40,  tex: 'dirt' },
    ],
    spikes: [ { x: 420, y: 468 }, { x: 452, y: 468 }, { x: 484, y: 468 }, { x: 516, y: 468 } ],
    fires: [],
    spawns: [ { x: 100, y: 385, dir: 1, count: 1, interval: 0, startDelay: 1.2 } ],
    portals: [ { x: 700, y: 386 } ],
    required: 1,
    inventory: { plank: 3, barrier: 0, spring: 0 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 2
  // Multi-hopper: bridge a fire pit with planks, seat hoppers on the ground
  // portal with a barrier (so they don't hop past into the spikes), and use a
  // spring to send extras up to the high portal. Save 3 of 4.
  var LEVEL2 = withPhys({
    name: 'Two Ways Home',
    subtitle: 'Bridge the fire, turn them around, or spring them up. Save 3 of 4.',
    width: W, height: H, background: 'background',
    blocks: [
      { x: 0,   y: 470, w: 360, h: 70, tex: 'grass' },   // left floor
      { x: 560, y: 470, w: 400, h: 70, tex: 'grass' },   // right floor
      { x: 700, y: 300, w: 200, h: 20, tex: 'grass' },   // high ledge (portal B)
    ],
    spikes: [ { x: 872, y: 438 }, { x: 890, y: 438 }, { x: 908, y: 438 }, { x: 926, y: 438 } ],
    fires: [ { x: 372, y: 508 }, { x: 420, y: 508 }, { x: 468, y: 508 }, { x: 516, y: 508 } ],
    spawns: [ { x: 70, y: 425, dir: 1, count: 4, interval: 1.5, startDelay: 1.5 } ],
    portals: [ { x: 720, y: 402 }, { x: 776, y: 232 } ],  // A: right floor, B: high ledge
    required: 3,
    inventory: { plank: 4, barrier: 2, spring: 1 },
    edgesFlip: true,
  });

  return { LEVELS: [LEVEL1, LEVEL2] };
});
