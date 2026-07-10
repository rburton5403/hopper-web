// Core Hopper game logic: physics, hopping, collisions, win/lose.
// Deliberately free of any DOM/canvas references so it can run headlessly in
// node (see test/sim.js) as well as in the browser. Rendering lives in render.js.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HopperGame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PPM = 16; // pixels per meter — 16px grid cell == 1 physics meter

  function px2m(v) { return v / PPM; }

  // Hopper collision polygon (the original Corona "bottomShape"), in pixels,
  // relative to the sprite centre. Gives the hopper a rounded, bottom-heavy body.
  var HOPPER_SHAPE_PX = [
    [-20.5, 11], [-6, 3], [6, 3], [20.5, 8],
    [20.5, 15], [13, 22.5], [-16, 22.5], [-20.5, 18],
  ];

  function Game(planck, level) {
    this.pl = planck;
    this.level = level;
    this.reset();
  }

  Game.prototype.reset = function () {
    var pl = this.pl, level = this.level;

    this.world = pl.World(pl.Vec2(0, px2m(level.gravity)));
    this.status = 'build';   // 'build' -> 'playing' -> 'won' | 'lost'
    this.time = 0;
    this.hopTimer = 0;
    this.portalAngle = 0;
    this.exitT = 0;          // portal-exit animation progress (0..1)
    this.deathT = 0;         // death animation timer
    this.planks = [];        // { body, x, y, w, h } in px (top-left based rect)
    this.planksLeft = level.inventory.planks;

    this._buildStatics();
    this._spawnHopper();

    // Collision handling.
    var self = this;
    this.world.on('begin-contact', function (contact) {
      var a = contact.getFixtureA().getUserData();
      var b = contact.getFixtureB().getUserData();
      if (!a || !b) return;
      var types = [a.type, b.type];
      if (types.indexOf('hopper') === -1) return;
      if (types.indexOf('spike') !== -1) self._onDeath();
      else if (types.indexOf('portal') !== -1) self._onExit();
    });
  };

  Game.prototype._buildStatics = function () {
    var pl = this.pl, level = this.level;

    // Blocks (platforms / pit floor) as static boxes.
    level.blocks.forEach(function (b) {
      var body = this.world.createBody();
      var hw = px2m(b.w) / 2, hh = px2m(b.h) / 2;
      var cx = px2m(b.x + b.w / 2), cy = px2m(b.y + b.h / 2);
      var fix = body.createFixture(pl.Box(hw, hh, pl.Vec2(cx, cy)), {
        friction: 0.9, restitution: 0.175,
      });
      fix.setUserData({ type: 'block' });
    }, this);

    // Spikes as upward-pointing static triangles.
    level.spikes.forEach(function (s) {
      var cx = s.x + 8, cy = s.y + 16; // centre of the 16x32 sprite
      var verts = [
        pl.Vec2(px2m(cx + 0), px2m(cy - 16)),   // tip
        pl.Vec2(px2m(cx - 8), px2m(cy + 16)),   // bottom-left
        pl.Vec2(px2m(cx + 8), px2m(cy + 16)),   // bottom-right
      ];
      var body = this.world.createBody();
      var fix = body.createFixture(pl.Polygon(verts), { friction: 0.9 });
      fix.setUserData({ type: 'spike' });
    }, this);

    // Portal as a static sensor circle.
    var p = level.portal;
    var pcx = p.x + 24, pcy = p.y + 24;
    var portalBody = this.world.createBody();
    var pfix = portalBody.createFixture(this.pl.Circle(pl.Vec2(px2m(pcx), px2m(pcy)), px2m(18)), {
      isSensor: true,
    });
    pfix.setUserData({ type: 'portal' });
  };

  Game.prototype._spawnHopper = function () {
    var pl = this.pl, level = this.level;
    var sx = level.spawn.x + 20.5, sy = level.spawn.y + 22.5; // sprite centre

    var body = this.world.createDynamicBody({
      position: pl.Vec2(px2m(sx), px2m(sy)),
      fixedRotation: true,
      bullet: true,
    });
    var verts = HOPPER_SHAPE_PX.map(function (p) {
      return pl.Vec2(px2m(p[0]), px2m(p[1]));
    });
    var fix = body.createFixture(pl.Polygon(verts), {
      density: 1, friction: 0.9, restitution: 0.2,
    });
    fix.setUserData({ type: 'hopper' });

    this.hopper = { body: body, alive: true, exiting: false };
  };

  // --- Player actions -------------------------------------------------------

  // Place a plank centred on (cx, cy) in pixels. Only allowed during build.
  Game.prototype.addPlank = function (cx, cy) {
    if (this.status !== 'build' || this.planksLeft <= 0) return false;
    var pl = this.pl, sz = this.level.plankSize;
    var body = this.world.createBody();
    var fix = body.createFixture(
      pl.Box(px2m(sz.w) / 2, px2m(sz.h) / 2, pl.Vec2(px2m(cx), px2m(cy))),
      { friction: 0.95, restitution: 0.1 }
    );
    fix.setUserData({ type: 'plank' });
    this.planks.push({ body: body, x: cx - sz.w / 2, y: cy - sz.h / 2, w: sz.w, h: sz.h });
    this.planksLeft--;
    return true;
  };

  Game.prototype.removeLastPlank = function () {
    if (this.status !== 'build' || this.planks.length === 0) return false;
    var plank = this.planks.pop();
    this.world.destroyBody(plank.body);
    this.planksLeft++;
    return true;
  };

  Game.prototype.start = function () {
    if (this.status !== 'build') return;
    this.status = 'playing';
    // Seed the timer so the first hop fires after firstHopDelay seconds, then
    // every hopInterval seconds thereafter.
    this.hopTimer = this.level.hopInterval - this.level.firstHopDelay;
  };

  // --- Internal events ------------------------------------------------------

  Game.prototype._onDeath = function () {
    if (!this.hopper.alive || this.hopper.exiting) return;
    this.hopper.alive = false;
    this.status = 'lost';
    var body = this.hopper.body;
    body.setFixedRotation(false);
    body.getFixtureList().setSensor(true);
    // Get knocked upward, like the original onContactHazard.
    var m = body.getMass();
    body.applyLinearImpulse(this.pl.Vec2(m * px2m(30), m * px2m(-260)), body.getWorldCenter(), true);
    body.applyAngularImpulse(body.getInertia() * 6, true);
  };

  Game.prototype._onExit = function () {
    if (!this.hopper.alive || this.hopper.exiting) return;
    this.hopper.exiting = true;
    this.status = 'won';
    var body = this.hopper.body;
    body.setLinearVelocity(this.pl.Vec2(0, 0));
    body.setGravityScale(0);
    body.getFixtureList().setSensor(true);
  };

  Game.prototype._hop = function () {
    var body = this.hopper.body, level = this.level;
    var m = body.getMass();
    // Impulse = mass * desired takeoff velocity (from rest this sets velocity).
    var imp = this.pl.Vec2(m * px2m(level.hopVelX), m * px2m(-level.hopVelY));
    body.setLinearVelocity(this.pl.Vec2(0, 0));
    body.applyLinearImpulse(imp, body.getWorldCenter(), true);
  };

  // --- Simulation step ------------------------------------------------------

  Game.prototype.step = function (dt) {
    if (dt > 0.05) dt = 0.05; // clamp to keep physics stable on lag/tab-switch
    this.time += dt;
    this.portalAngle += dt * (Math.PI / 2); // 90 deg/sec like the original

    if (this.status === 'playing') {
      this.hopTimer += dt;
      if (this.hopper.alive && !this.hopper.exiting && this.hopTimer >= this.level.hopInterval) {
        this.hopTimer -= this.level.hopInterval;
        this._hop();
      }
    }

    this.world.step(dt);

    // Portal-exit animation: shrink the hopper into the portal centre.
    if (this.hopper.exiting && this.exitT < 1) {
      this.exitT = Math.min(1, this.exitT + dt / 0.8);
    }
    if (!this.hopper.alive) this.deathT += dt;

    // Fell off the level.
    if (this.status === 'playing') {
      var pos = this.hopper.body.getPosition();
      if (pos.y * PPM > this.level.height + 48) {
        this.status = 'lost';
        this.hopper.alive = false;
      }
    }
    return this.status;
  };

  // --- Render snapshot (px) -------------------------------------------------

  Game.prototype.getState = function () {
    var b = this.hopper.body;
    var p = b.getPosition();
    return {
      status: this.status,
      hopper: {
        x: p.x * PPM,
        y: p.y * PPM,
        angle: b.getAngle(),
        alive: this.hopper.alive,
        exiting: this.hopper.exiting,
        exitT: this.exitT,
      },
      portalAngle: this.portalAngle,
      planks: this.planks,
      planksLeft: this.planksLeft,
    };
  };

  Game.PPM = PPM;
  return Game;
});
