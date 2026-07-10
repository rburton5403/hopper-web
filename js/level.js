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

  // ------------------------------------------------------------------ Level 3
  // The crowd grows: 8 hoppers pour out over a wide fire canyon. Lay a plank
  // walkway across to the portal. Save 6 of 8.
  var LEVEL3 = withPhys({
    name: 'The Long Haul',
    subtitle: 'A whole crowd of hoppers over a wide fire canyon. Save 6 of 8.',
    width: W, height: H, background: 'background',
    blocks: [
      { x: 0,   y: 470, w: 300, h: 70, tex: 'grass' },   // left floor
      { x: 660, y: 470, w: 300, h: 70, tex: 'grass' },   // right floor
      { x: 380, y: 300, w: 180, h: 20, tex: 'grass' },   // high ledge (portal B)
    ],
    spikes: [ { x: 904, y: 438 }, { x: 922, y: 438 }, { x: 940, y: 438 } ],
    fires: [
      { x: 312, y: 508 }, { x: 360, y: 508 }, { x: 408, y: 508 }, { x: 456, y: 508 },
      { x: 504, y: 508 }, { x: 552, y: 508 }, { x: 600, y: 508 },
    ],
    spawns: [ { x: 60, y: 425, dir: 1, count: 8, interval: 1.2, startDelay: 1.2 } ],
    portals: [ { x: 740, y: 402 }, { x: 446, y: 232 } ],  // A: right floor, B: high ledge
    required: 6,
    inventory: { plank: 6, barrier: 2, spring: 1 },
    edgesFlip: true,
  });

  // Build a row of fire cells spanning [x0,x1) at the given top y.
  function fireRow(x0, x1, y) { var a = []; for (var x = x0; x < x1; x += 48) a.push({ x: x, y: y }); return a; }

  // ------------------------------------------------------------------ Level 4
  // Crowd control: 10 hoppers over a broad canyon, with a high alternate portal.
  var LEVEL4 = withPhys({
    name: 'Crowd Control',
    subtitle: '10 hoppers, a broad fire canyon, two ways home. Save 7.',
    width: W, height: H, background: 'background',
    blocks: [
      { x: 0,   y: 470, w: 240, h: 70, tex: 'grass' },
      { x: 720, y: 470, w: 240, h: 70, tex: 'grass' },
      { x: 520, y: 290, w: 160, h: 20, tex: 'grass' },   // high ledge (portal B)
    ],
    spikes: [],
    fires: fireRow(252, 708, 508),
    spawns: [ { x: 40, y: 425, dir: 1, count: 10, interval: 1.0, startDelay: 1.2 } ],
    portals: [ { x: 800, y: 402 }, { x: 576, y: 222 } ],
    required: 7,
    inventory: { plank: 8, barrier: 2, spring: 1, balloon: 2 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 5
  // The gauntlet: 14 hoppers over the widest canyon yet. Save 10.
  var LEVEL5 = withPhys({
    name: 'The Gauntlet',
    subtitle: 'The widest canyon yet — 14 hoppers pouring out. Save 10.',
    width: W, height: H, background: 'background',
    blocks: [
      { x: 0,   y: 470, w: 200, h: 70, tex: 'grass' },
      { x: 760, y: 470, w: 200, h: 70, tex: 'grass' },
      { x: 410, y: 280, w: 160, h: 20, tex: 'grass' },   // high ledge (portal B)
    ],
    spikes: [ { x: 900, y: 438 }, { x: 918, y: 438 }, { x: 936, y: 438 } ],
    fires: fireRow(212, 748, 508),
    spawns: [ { x: 36, y: 425, dir: 1, count: 14, interval: 0.9, startDelay: 1.2 } ],
    portals: [ { x: 840, y: 402 }, { x: 466, y: 212 } ],
    required: 10,
    inventory: { plank: 9, barrier: 3, spring: 1, balloon: 2 },
    edgesFlip: true,
  });

  return { LEVELS: [LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5] };
});
