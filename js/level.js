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
    springVelX: 118,   // spring: forward launch speed (in the hopper's direction)
    springVelY: 430,   // spring: upward launch (apex ~154px, forward reach ~170px)
    balloonTime: 1.3,  // seconds a hopper is carried by a balloon
    balloonRise: 170,  // px/s the balloon rises
    windSpeed: 70,     // px/s horizontal drift while ballooning (× level.wind)
  };
  // Per level: `wind` is -1 (blows left), 0 (straight up), or +1 (blows right).
  function withPhys(o) { for (var k in PHYS) if (!(k in o)) o[k] = PHYS[k]; return o; }

  var W = 960, H = 540;

  // Build a row of fire cells spanning [x0,x1) at the given top y.
  function fireRow(x0, x1, y) { var a = []; for (var x = x0; x < x1; x += 48) a.push({ x: x, y: y }); return a; }

  // ------------------------------------------------------------------ Level 1
  // Teacher: one hopper, one spike pit, one plank to bridge it. (1 pt to win.)
  var LEVEL1 = withPhys({
    name: 'The Spike Pit',
    subtitle: 'Drop a plank to bridge the gap and reach the portal.',
    width: W, height: H, background: 'background',
    blocks: [
      { x: 0,   y: 430, w: 410, h: 110, tex: 'grass' },
      { x: 550, y: 430, w: 410, h: 110, tex: 'grass' },
      { x: 410, y: 500, w: 140, h: 40,  tex: 'dirt' },
    ],
    spikes: [ { x: 420, y: 468 }, { x: 452, y: 468 }, { x: 484, y: 468 }, { x: 516, y: 468 } ],
    fires: [],
    spawns: [ { x: 100, y: 385, dir: 1, count: 1, interval: 0, startDelay: 1.2 } ],
    portals: [ { x: 700, y: 386, points: 1 } ],
    targetScore: 1,
    inventory: { plank: 3 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 2
  // Teaches the SPRING. A cliff, then a high ledge with the portal — too high to
  // hop to. Drop a spring on the floor and the hoppers arc up onto the ledge.
  var LEVEL2 = withPhys({
    name: 'Spring Up',
    subtitle: 'That ledge is too high to hop. Use a spring to bounce up to it. Reach 3.',
    width: W, height: H, background: 'background', wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 430, h: 70, tex: 'grass' },   // starting floor (ends in a cliff)
      { x: 470, y: 340, w: 490, h: 20, tex: 'grass' },   // high ledge with the portal
    ],
    spikes: [],
    fires: fireRow(430, 960, 512),                        // fire fills the pit under the ledge
    spawns: [ { x: 60, y: 425, dir: 1, count: 4, interval: 1.6, startDelay: 1.2 } ],
    portals: [ { x: 680, y: 316, points: 1 } ],
    targetScore: 3,
    inventory: { spring: 3 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 3
  // Teaches the BARRIER. The hoppers march right toward the fire, but the only
  // portal is behind them on the left. Turn them around!
  var LEVEL3 = withPhys({
    name: 'About Turn',
    subtitle: 'The portal is behind them and there\'s fire ahead — bounce them back. Reach 3.',
    width: W, height: H, background: 'background', wind: -1,
    blocks: [
      { x: 0, y: 470, w: 780, h: 70, tex: 'grass' },
    ],
    spikes: [],
    fires: fireRow(780, 960, 508),                        // deadly right end
    spawns: [ { x: 470, y: 425, dir: 1, count: 4, interval: 1.5, startDelay: 1.2 } ],
    portals: [ { x: 40, y: 402, points: 1 } ],            // only portal — far left, behind the spawn
    targetScore: 3,
    inventory: { barrier: 3 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 4
  // Teaches the BALLOON + WIND. The portal is high up and off to the side; a
  // balloon lifts a hopper and the wind carries it across onto the ledge.
  var LEVEL4 = withPhys({
    name: 'Up and Away',
    subtitle: 'Catch the wind! A balloon floats one hopper up, drifting to the ledge. Reach 3.',
    width: W, height: H, background: 'background', wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 960, h: 70, tex: 'grass' },   // floor
      { x: 560, y: 250, w: 400, h: 20, tex: 'grass' },   // high-right ledge with the portal
    ],
    spikes: [],
    fires: [],
    spawns: [ { x: 120, y: 425, dir: 1, count: 5, interval: 1.7, startDelay: 1.2 } ],
    portals: [ { x: 640, y: 226, points: 1 } ],
    targetScore: 3,
    inventory: { balloon: 6 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 5
  // The gauntlet: hoppers pour in from BOTH sides toward a central island.
  // Bridge both fire pits, then spring them up the 3-pt central portal.
  // 14 hoppers (7 each side), target 18.
  var LEVEL5 = withPhys({
    name: 'The Gauntlet',
    subtitle: 'Hoppers from both sides! Bridge in and spring them up. Reach 18.',
    width: W, height: H, background: 'background',
    wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 240, h: 70, tex: 'grass' },   // left floor
      { x: 400, y: 470, w: 160, h: 70, tex: 'grass' },   // center island
      { x: 720, y: 470, w: 240, h: 70, tex: 'grass' },   // right floor
    ],
    spikes: [],
    fires: fireRow(244, 396, 508).concat(fireRow(564, 716, 508)),
    spawns: [
      { x: 40,  y: 425, dir:  1, count: 7, interval: 1.5, startDelay: 1.2 },
      { x: 900, y: 425, dir: -1, count: 7, interval: 1.5, startDelay: 1.8 },
    ],
    // A: center island floor (1 pt); B: high center (3 pt), reached by springing up from the island.
    portals: [ { x: 520, y: 402, points: 1 }, { x: 470, y: 250, points: 3 } ],
    targetScore: 18,
    inventory: { plank: 8, spring: 2, barrier: 3, balloon: 2 },
    edgesFlip: true,
  });

  function spikeRow(x0, x1, y) { var a = []; for (var x = x0; x < x1; x += 18) a.push({ x: x, y: y }); return a; }

  // ------------------------------------------------------------------ Level 6
  // Two tiers, four spawns: hoppers pour in from the top ledges AND the ground,
  // both sides, all funnelling to a central fire pit. Bridge it and spring them
  // up the 3-pt portal. 12 hoppers, target 24.
  var LEVEL6 = withPhys({
    name: 'Two Tiers',
    subtitle: 'Four streams of hoppers funnel to the middle. Reach 24.',
    width: W, height: H, background: 'background', wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 360, h: 70, tex: 'grass' },
      { x: 600, y: 470, w: 360, h: 70, tex: 'grass' },
      { x: 0,   y: 250, w: 280, h: 18, tex: 'grass' },   // upper-left ledge
      { x: 680, y: 250, w: 280, h: 18, tex: 'grass' },   // upper-right ledge
    ],
    spikes: [],
    fires: fireRow(360, 600, 508),
    spawns: [
      { x: 40,  y: 425, dir:  1, count: 3, interval: 1.6, startDelay: 1.0 },
      { x: 900, y: 425, dir: -1, count: 3, interval: 1.6, startDelay: 1.4 },
      { x: 90,  y: 205, dir:  1, count: 3, interval: 1.6, startDelay: 2.2 },
      { x: 830, y: 205, dir: -1, count: 3, interval: 1.6, startDelay: 2.6 },
    ],
    // A: low 1-pt portal in the centre (the walk-in default); B: high 3-pt above
    // it (spring). No portal sits next to a spawn, so hoppers hop toward the fire.
    portals: [ { x: 456, y: 402, points: 1 }, { x: 456, y: 250, points: 3 } ],
    targetScore: 24,
    inventory: { plank: 8, spring: 3, barrier: 3, balloon: 2 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 7
  // Barrier REQUIRED: hoppers march right toward the fire, but the only portal
  // is behind them on the left. Turn them around with a barrier, and bridge the
  // gap on the way back. 8 hoppers, target 6.
  var LEVEL7 = withPhys({
    name: 'About Face',
    subtitle: 'The portal is behind them! Turn the hoppers around. Reach 6.',
    width: W, height: H, background: 'background', wind: -1,
    blocks: [
      { x: 0,   y: 470, w: 300, h: 70, tex: 'grass' },   // left floor (portal A)
      { x: 420, y: 470, w: 420, h: 70, tex: 'grass' },   // right floor (spawn) — gap 300..420
    ],
    spikes: [],
    fires: fireRow(840, 960, 508),                        // deadly right end
    spawns: [ { x: 560, y: 425, dir: 1, count: 8, interval: 1.3, startDelay: 1.2 } ],
    portals: [ { x: 40, y: 402, points: 1 } ],            // only portal — far left, behind spawn
    targetScore: 6,
    inventory: { plank: 3, spring: 1, barrier: 3, balloon: 1 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 8
  // Pinball: four spawns over two tiers, spikes lining the pit, a bigger crowd.
  // Bridge and spring them up the 3-pt portal. 16 hoppers, target 30.
  var LEVEL8 = withPhys({
    name: 'Pinball',
    subtitle: 'Sixteen hoppers, spikes, and a long way up. Reach 30.',
    width: W, height: H, background: 'background', wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 340, h: 70, tex: 'grass' },
      { x: 620, y: 470, w: 340, h: 70, tex: 'grass' },
      { x: 60,  y: 260, w: 240, h: 18, tex: 'grass' },
      { x: 660, y: 260, w: 240, h: 18, tex: 'grass' },
    ],
    spikes: [],                      // spikes across the pit floor lip
    fires: fireRow(348, 612, 508),
    spawns: [
      { x: 40,  y: 425, dir:  1, count: 4, interval: 1.5, startDelay: 1.0 },
      { x: 900, y: 425, dir: -1, count: 4, interval: 1.5, startDelay: 1.4 },
      { x: 90,  y: 215, dir:  1, count: 4, interval: 1.5, startDelay: 2.2 },
      { x: 850, y: 215, dir: -1, count: 4, interval: 1.5, startDelay: 2.6 },
    ],
    portals: [ { x: 840, y: 402, points: 1 }, { x: 456, y: 250, points: 3 } ],
    targetScore: 30,
    inventory: { plank: 8, spring: 4, barrier: 3, balloon: 3 },
    edgesFlip: true,
  });

  // ------------------------------------------------------------------ Level 9
  // The Divide: two crowds march INTO a central fire pit. The only portals sit
  // behind each spawn, so you MUST turn both crowds around with barriers (and
  // the flipped hoppers still need a safe path back). 16 hoppers, target 24.
  var LEVEL9 = withPhys({
    name: 'The Divide',
    subtitle: 'Both crowds march into the fire — turn them around to the side portals. Reach 24.',
    width: W, height: H, background: 'background', wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 400, h: 70, tex: 'grass' },   // left floor (portal A)
      { x: 560, y: 470, w: 400, h: 70, tex: 'grass' },   // right floor (portal B)
    ],
    spikes: [],
    fires: fireRow(404, 556, 508),                        // central pit
    spawns: [
      { x: 220, y: 425, dir:  1, count: 8, interval: 1.2, startDelay: 1.0 },
      { x: 740, y: 425, dir: -1, count: 8, interval: 1.2, startDelay: 1.4 },
    ],
    portals: [ { x: 20, y: 402, points: 2 }, { x: 900, y: 402, points: 2 } ],
    targetScore: 24,
    inventory: { plank: 3, spring: 1, barrier: 4, balloon: 1 },
    edgesFlip: true,
  });

  // ----------------------------------------------------------------- Level 10
  // The Hopper Trials: the works — two tiers, four spawns, fire and spikes, and
  // a target you can only hit by using planks, springs AND barriers together.
  // 20 hoppers, target 48.
  var LEVEL10 = withPhys({
    name: 'The Hopper Trials',
    subtitle: 'Everything at once. Planks, springs and barriers. Reach 48.',
    width: W, height: H, background: 'background', wind: 1,
    blocks: [
      { x: 0,   y: 470, w: 320, h: 70, tex: 'grass' },
      { x: 640, y: 470, w: 320, h: 70, tex: 'grass' },
      { x: 0,   y: 250, w: 220, h: 18, tex: 'grass' },
      { x: 740, y: 250, w: 220, h: 18, tex: 'grass' },
    ],
    spikes: [],
    fires: fireRow(328, 632, 508),
    spawns: [
      { x: 40,  y: 425, dir:  1, count: 5, interval: 1.4, startDelay: 1.0 },
      { x: 900, y: 425, dir: -1, count: 5, interval: 1.4, startDelay: 1.4 },
      { x: 110, y: 205, dir:  1, count: 5, interval: 1.4, startDelay: 2.4 },
      { x: 820, y: 205, dir: -1, count: 5, interval: 1.4, startDelay: 2.8 },
    ],
    // A/B side (2 pt, behind the upper spawns — barrier), C central high (3 pt — spring).
    portals: [ { x: 20, y: 208, points: 2 }, { x: 900, y: 208, points: 2 }, { x: 456, y: 250, points: 3 } ],
    targetScore: 48,
    inventory: { plank: 10, spring: 4, barrier: 5, balloon: 3 },
    edgesFlip: true,
  });

  return { LEVELS: [LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5,
                    LEVEL6, LEVEL7, LEVEL8, LEVEL9, LEVEL10] };
});
