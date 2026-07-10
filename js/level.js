// Level definitions for Hopper Web.
// Coordinates are in canvas pixels, origin top-left, y increasing downward.
// The physics layer treats 16px = 1 meter (matching the original 16px grid).
// This module is UMD so it can be loaded in the browser (window.HopperLevels)
// and required in node for headless simulation/testing.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HopperLevels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CELL = 16; // pixels per grid cell (and per physics meter)

  // Level 1: a spike pit between two grass platforms. The hopper spawns on the
  // left, auto-hops up-and-to-the-right, and must reach the spinning portal on
  // the right. The player bridges the gap by placing planks as stepping stones.
  var LEVEL1 = {
    name: 'The Spike Pit',
    width: 640,
    height: 384,
    background: 'background',

    // Physics tuning (see game.js). Gravity in px/s^2 (16px = 1m).
    // hopInterval MUST exceed the hop airtime (2*hopVelY/gravity) so the hopper
    // lands and rests between hops instead of flying continuously.
    gravity: 600,
    // Desired hop takeoff velocity in px/s (up and to the right).
    hopVelX: 105,
    hopVelY: 257,
    hopInterval: 1.1,   // seconds between hops (airtime ~0.86s)
    firstHopDelay: 0.5, // seconds before the very first hop

    // Blocks are static rectangles rendered by tiling a 32px texture.
    blocks: [
      // Left platform (grass on top, dirt body). Top surface at y = 288.
      { x: 0,   y: 288, w: 224, h: 96, tex: 'grass' },
      // Right platform.
      { x: 416, y: 288, w: 224, h: 96, tex: 'grass' },
      // Thin floor at the bottom of the pit that the spikes stand on.
      { x: 224, y: 368, w: 192, h: 16, tex: 'dirt' },
    ],

    // Spikes: 16x32 triangles standing on the pit floor. x is the left edge.
    spikes: [
      { x: 240, y: 336 },
      { x: 272, y: 336 },
      { x: 304, y: 336 },
      { x: 336, y: 336 },
      { x: 368, y: 336 },
    ],

    // Spawn point: the hopper appears here (x,y is the hopper's top-left).
    spawn: { x: 176, y: 243 },

    // Portal (48x48). x,y is its top-left. Win when the hopper touches it.
    // Centred at x=608, sitting on the right platform at a natural landing spot.
    portal: { x: 584, y: 242 },

    // What the player has to work with.
    inventory: { planks: 3, ropes: 0 },

    // A plank is a static rectangle the player drops into the world.
    plankSize: { w: 64, h: 16 },
  };

  return {
    CELL: CELL,
    LEVELS: [LEVEL1],
  };
});
