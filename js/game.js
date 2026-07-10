// Core Hopper game logic: real-time, Lemmings-style. Hoppers spawn and hop
// continuously; the player places tools live to steer them to portals.
// Deliberately free of any DOM/canvas references so it can run headlessly in
// node (see test/) as well as in the browser. Rendering lives in render.js.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HopperGame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PPM = 16; // pixels per meter — 16px grid cell == 1 physics meter
  function px2m(v) { return v / PPM; }

  // Hopper collision polygon (the original Corona "bottomShape"), in pixels,
  // relative to the sprite centre.
  var HOPPER_SHAPE_PX = [
    [-20.5, 11], [-6, 3], [6, 3], [20.5, 8],
    [20.5, 15], [13, 22.5], [-16, 22.5], [-20.5, 18],
  ];
  var HOPPER_HALF_W = 20.5;

  // Tool definitions (sizes in px). "kind" drives physics behaviour.
  var TOOLS = {
    plank:   { w: 72, h: 14, kind: 'ground' },
    barrier: { w: 16, h: 76, kind: 'wall' },
    spring:  { w: 46, h: 16, kind: 'spring' },
    balloon: { w: 34, h: 42, kind: 'balloon' }, // one-shot buoyant lift (consumed on touch)
  };

  function Game(planck, level) {
    this.pl = planck;
    this.level = level;
    this.reset();
  }

  Game.prototype.reset = function () {
    var pl = this.pl, level = this.level;

    this.world = pl.World(pl.Vec2(0, px2m(level.gravity)));
    this.status = 'playing';
    this.paused = false;
    this.time = 0;
    this.portalAngle = 0;
    this.fireTime = 0;

    this.hoppers = [];
    this.items = [];        // player-placed tools: { type, x, y, w, h, body }
    this.events = [];       // queued collision outcomes, drained after each step

    // Inventory (copy so reset restores full counts).
    this.inv = {};
    for (var k in level.inventory) this.inv[k] = level.inventory[k];

    // Spawn bookkeeping.
    this.spawns = level.spawns.map(function (s) {
      return { def: s, emitted: 0, timer: -(s.startDelay || 0) };
    });
    this.totalToSpawn = level.spawns.reduce(function (a, s) { return a + s.count; }, 0);
    // Scoring: each portal is worth `points` (harder to reach = more). Win by
    // reaching targetScore. `required` (a hopper count) still works as a
    // fallback for older levels that don't define points/targetScore.
    this.portalPoints = level.portals.map(function (p) { return p.points || 1; });
    this.maxPortalPoints = Math.max.apply(null, this.portalPoints);
    this.targetScore = level.targetScore || level.required || 1;
    this.score = 0;
    this.saved = 0;
    this.dead = 0;
    this.hopCount = 0;
    this.pending = null;   // 'won' | 'lost' once decided; status commits after the outro
    this.outroT = 0;       // lose outro timer (lets the splat play)
    this.stallT = 0;       // deadlock timer: rises when nothing is moving/happening
    this.stallSample = 0;

    this._buildStatics();

    var self = this;
    this.world.on('begin-contact', function (c) { self._onContact(c); });
  };

  Game.prototype._staticBox = function (x, y, w, h, type, opts) {
    var pl = this.pl;
    var body = this.world.createBody();
    var def = { friction: 0.9, restitution: 0.1 };
    if (opts) for (var k in opts) def[k] = opts[k];
    var fix = body.createFixture(
      pl.Box(px2m(w) / 2, px2m(h) / 2, pl.Vec2(px2m(x + w / 2), px2m(y + h / 2))), def);
    fix.setUserData({ type: type });
    return body;
  };

  Game.prototype._buildStatics = function () {
    var pl = this.pl, level = this.level, W = level.width, H = level.height;

    // Blocks: ground (walkable) or wall (flips direction).
    level.blocks.forEach(function (b) {
      this._staticBox(b.x, b.y, b.w, b.h, b.wall ? 'wall' : 'ground', { friction: 0.95 });
    }, this);

    // Spikes: upward-pointing static triangles that kill.
    (level.spikes || []).forEach(function (s) {
      var cx = s.x + 8, cy = s.y + 16;
      var verts = [
        pl.Vec2(px2m(cx), px2m(cy - 16)),
        pl.Vec2(px2m(cx - 8), px2m(cy + 16)),
        pl.Vec2(px2m(cx + 8), px2m(cy + 16)),
      ];
      var body = this.world.createBody();
      body.createFixture(pl.Polygon(verts), { friction: 0.9 }).setUserData({ type: 'spike' });
    }, this);

    // Fire: 32x32 sensor hazards that kill.
    (level.fires || []).forEach(function (f) {
      var body = this.world.createBody();
      body.createFixture(pl.Box(px2m(28) / 2, px2m(24) / 2, pl.Vec2(px2m(f.x + 16), px2m(f.y + 20))),
        { isSensor: true }).setUserData({ type: 'fire' });
    }, this);

    // Portals: static sensor circles that save.
    level.portals.forEach(function (p, i) {
      var body = this.world.createBody();
      body.createFixture(this.pl.Circle(pl.Vec2(px2m(p.x + 24), px2m(p.y + 24)), px2m(22)),
        { isSensor: true }).setUserData({ type: 'portal', index: i });
    }, this);

    // Screen-edge walls keep hoppers in play (flip their direction).
    if (level.edgesFlip !== false) {
      this._staticBox(-20, -H, 20, H * 3, 'wall');
      this._staticBox(W, -H, 20, H * 3, 'wall');
    }
  };

  // --- Hoppers --------------------------------------------------------------

  Game.prototype._spawnHopper = function (x, y, dir) {
    var pl = this.pl;
    var body = this.world.createDynamicBody({
      position: pl.Vec2(px2m(x + 20.5), px2m(y + 22.5)),
      fixedRotation: true,
      bullet: true,
    });
    var verts = HOPPER_SHAPE_PX.map(function (p) { return pl.Vec2(px2m(p[0]), px2m(p[1])); });
    // filterGroupIndex -1: hoppers pass through each other (Lemmings-style),
    // so they never pile up or jam on springs/planks.
    var fix = body.createFixture(pl.Polygon(verts),
      { density: 1, friction: 0.9, restitution: 0.1, filterGroupIndex: -1 });
    var hopper = {
      body: body, dir: dir >= 0 ? 1 : -1, alive: true, exiting: false,
      exitT: 0, hopTimer: this.level.hopInterval - (this.level.firstHopDelay || 0.3),
      flipCd: 0, id: this.hoppers.length,
    };
    fix.setUserData({ type: 'hopper', ref: hopper });
    this.hoppers.push(hopper);
    return hopper;
  };

  // A hopper is "resting" if it's touching a solid surface and not moving
  // vertically — i.e. sitting still, ready to launch a fresh hop.
  Game.prototype._isResting = function (h) {
    var v = h.body.getLinearVelocity();
    if (Math.abs(v.y) > px2m(45)) return false; // rising/falling => airborne
    for (var ce = h.body.getContactList(); ce; ce = ce.next) {
      var c = ce.contact;
      if (!c.isTouching()) continue;
      if (c.getFixtureA().isSensor() || c.getFixtureB().isSensor()) continue; // ignore portal/balloon
      return true;
    }
    return false;
  };

  Game.prototype._hop = function (h) {
    var body = h.body, level = this.level, m = body.getMass();
    this.hopCount++; // consumed by the UI to play a faint hop sound
    body.setLinearVelocity(this.pl.Vec2(0, 0));
    body.applyLinearImpulse(
      this.pl.Vec2(m * px2m(level.hopVelX * h.dir), m * px2m(-level.hopVelY)),
      body.getWorldCenter(), true);
  };

  // --- Player actions -------------------------------------------------------

  Game.prototype.canPlace = function (type) {
    return TOOLS[type] && (this.inv[type] || 0) > 0 && this.status === 'playing';
  };

  Game.prototype.addItem = function (type, cx, cy) {
    if (!this.canPlace(type)) return false;
    var t = TOOLS[type], pl = this.pl;
    var body = this.world.createBody();
    var item = { type: type, x: cx - t.w / 2, y: cy - t.h / 2, w: t.w, h: t.h, body: body };
    var tag = t.kind === 'wall' ? 'wall' : t.kind === 'spring' ? 'spring'
      : t.kind === 'balloon' ? 'balloon' : 'ground';
    var fix = body.createFixture(
      pl.Box(px2m(t.w) / 2, px2m(t.h) / 2, pl.Vec2(px2m(cx), px2m(cy))),
      { friction: 0.95, restitution: 0.1, isSensor: t.kind === 'balloon' });
    fix.setUserData({ type: tag, itemRef: item });
    this.items.push(item);
    this.inv[type]--;
    this.stallT = 0; // player did something — not deadlocked
    return true;
  };

  Game.prototype.removeLastItem = function () {
    if (this.items.length === 0) return false;
    var it = this.items.pop();
    this.world.destroyBody(it.body);
    this.inv[it.type]++;
    this.stallT = 0;
    return true;
  };

  Game.prototype.togglePause = function () { this.paused = !this.paused; };

  // --- Collision handling ---------------------------------------------------

  Game.prototype._onContact = function (contact) {
    var a = contact.getFixtureA().getUserData();
    var b = contact.getFixtureB().getUserData();
    if (!a || !b) return;
    var hop = a.type === 'hopper' ? a : (b.type === 'hopper' ? b : null);
    if (!hop) return;
    var other = hop === a ? b : a;
    var h = hop.ref;
    if (!h.alive || h.exiting) return;
    if (other.type === 'spike' || other.type === 'fire') this.events.push({ k: 'die', h: h });
    else if (other.type === 'portal') this.events.push({ k: 'save', h: h, portal: other.index });
    else if (other.type === 'wall') this.events.push({ k: 'flip', h: h });
    else if (other.type === 'balloon') this.events.push({ k: 'balloon', h: h, item: other.itemRef });
    // (springs are handled continuously in step(), not as one-shot contacts)
  };

  Game.prototype._drain = function () {
    for (var i = 0; i < this.events.length; i++) {
      var e = this.events[i], h = e.h;
      if (!h.alive || h.exiting) continue;
      if (e.k === 'die') this._die(h);
      else if (e.k === 'save') this._save(h, e.portal);
      else if (e.k === 'flip') this._flip(h);
      else if (e.k === 'balloon') this._balloon(h, e.item);
    }
    this.events.length = 0;
  };

  Game.prototype._balloon = function (h, item) {
    if (!item || item.used || h.floatT > 0) return;
    item.used = true;                    // the hopper grabs it — consume it
    this.world.destroyBody(item.body);
    var idx = this.items.indexOf(item);
    if (idx >= 0) this.items.splice(idx, 1);
    h.floatT = this.level.balloonTime || 1.3; // seconds carried aloft before it pops
  };

  Game.prototype._die = function (h) {
    h.alive = false;
    this.dead++;
    this.stallT = 0; // progress happened
    var body = h.body;
    body.setFixedRotation(false);
    body.getFixtureList().setSensor(true);
    var m = body.getMass();
    body.applyLinearImpulse(this.pl.Vec2(m * px2m(20 * h.dir), m * px2m(-240)), body.getWorldCenter(), true);
    body.applyAngularImpulse(body.getInertia() * (5 * h.dir), true);
  };

  Game.prototype._save = function (h, portalIndex) {
    h.exiting = true;
    this.saved++;
    this.stallT = 0; // progress happened
    this.score += this.portalPoints[portalIndex] || 1;
    this.justSaved = true; // one-shot flag for SFX, cleared by consumer
    var p = this.level.portals[portalIndex] || this.level.portals[0];
    h.exitCX = p.x + 24; h.exitCY = p.y + 24; // portal centre — twirl target
    var body = h.body;
    body.setLinearVelocity(this.pl.Vec2(0, 0));
    body.setGravityScale(0);
    body.getFixtureList().setSensor(true);
  };

  Game.prototype._flip = function (h) {
    if (h.flipCd > 0) return;
    h.dir = -h.dir;
    h.flipCd = 0.25;
    // Nudge away from the wall so we don't immediately re-collide.
    var v = h.body.getLinearVelocity();
    h.body.setLinearVelocity(this.pl.Vec2(px2m(this.level.hopVelX * 0.4 * h.dir), v.y));
    var p = h.body.getPosition();
    h.body.setPosition(this.pl.Vec2(p.x + px2m(3 * h.dir), p.y));
  };

  // True if the hopper is currently touching a spring pad.
  Game.prototype._touchingSpring = function (h) {
    for (var ce = h.body.getContactList(); ce; ce = ce.next) {
      if (!ce.contact.isTouching()) continue;
      var fa = ce.contact.getFixtureA(), fb = ce.contact.getFixtureB();
      var a = fa.getUserData(), b = fb.getUserData();
      var other = (a && a.type === 'hopper') ? b : a;
      if (other && other.type === 'spring') return true;
    }
    return false;
  };

  // --- Simulation step ------------------------------------------------------

  Game.prototype.step = function (dt) {
    if (this.paused || this.status !== 'playing') { return this.status; }
    if (dt > 0.05) dt = 0.05;
    this.time += dt;
    this.fireTime += dt;
    this.portalAngle += dt * (Math.PI / 2);

    // Spawning (stop once the result is decided so no new hoppers appear mid-outro).
    if (!this.pending) this.spawns.forEach(function (s) {
      if (s.emitted >= s.def.count) return;
      s.timer += dt;
      var interval = s.def.interval || 1.2;
      if (s.timer >= (s.emitted === 0 ? 0 : interval)) {
        s.timer = 0;
        this._spawnHopper(s.def.x, s.def.y, s.def.dir);
        s.emitted++;
      }
    }, this);

    // Per-hopper timers + hopping.
    this.hoppers.forEach(function (h) {
      if (!h.alive || h.exiting) return;
      if (h.flipCd > 0) h.flipCd -= dt;
      // Balloon buoyancy: gentle negative gravity, and no hopping while it
      // lasts, so the lift is a controlled float (~one ledge high) rather than
      // a runaway as hop impulses compound.
      // Balloon: the hopper is carried aloft, rising steadily and drifting with
      // the level's wind, until the balloon pops (floatT runs out) and it falls.
      if (h.floatT > 0) {
        h.floatT -= dt;
        var wind = (this.level.wind || 0) * (this.level.windSpeed || 70);
        h.body.setGravityScale(0);
        h.body.setLinearVelocity(this.pl.Vec2(px2m(wind), px2m(-(this.level.balloonRise || 170))));
        if (h.floatT <= 0) h.body.setGravityScale(1); // pop → fall
        h.hopTimer = this.level.hopInterval - 0.3;
        return;
      }
      // Spring: launch up AND forward (in the hopper's travel direction), like a
      // trampoline — so it arcs onward instead of bouncing straight up in place.
      if (this._touchingSpring(h)) {
        var sv = h.body.getLinearVelocity();
        if (sv.y > -px2m(80)) {
          h.body.setLinearVelocity(this.pl.Vec2(
            px2m((this.level.springVelX || 118) * h.dir),
            px2m(-(this.level.springVelY || 430))));
          h.hopTimer = 0;
        }
        return;
      }
      h.hopTimer += dt;
      if (h.hopTimer >= this.level.hopInterval) {
        // Only hop when actually resting on a surface — never off thin air (e.g.
        // mid-flight after a spring bounce). If airborne, hold the hop and take
        // it the instant the hopper lands.
        if (this._isResting(h)) { h.hopTimer -= this.level.hopInterval; this._hop(h); }
        else { h.hopTimer = this.level.hopInterval; }
      }
    }, this);

    this.world.step(dt);
    this._drain();

    // Exit animation + fall-off-the-world death.
    this.hoppers.forEach(function (h) {
      if (h.exiting && h.exitT < 1) h.exitT = Math.min(1, h.exitT + dt / 0.7);
      if (h.alive && !h.exiting) {
        var y = h.body.getPosition().y * PPM;
        if (y > this.level.height + 60) { h.alive = false; this.dead++; }
      }
    }, this);

    this._detectStall(dt);
    this._checkEnd(dt);
    return this.status;
  };

  Game.prototype._allSpawned = function () {
    return this.spawns.every(function (s) { return s.emitted >= s.def.count; });
  };

  // Deadlock guard: once every hopper has spawned, if no active hopper moves
  // (e.g. all pinned under planks) and the player does nothing, the level would
  // otherwise hang forever. Sample positions periodically; if nothing moved for
  // a few seconds, end the level as a loss. Any movement/tool/save/death resets.
  Game.prototype._detectStall = function (dt) {
    if (this.pending || !this._allSpawned()) return;
    this.stallSample += dt;
    if (this.stallSample < 0.4) return;
    this.stallSample = 0;
    var moved = false, active = 0;
    for (var i = 0; i < this.hoppers.length; i++) {
      var h = this.hoppers[i];
      if (!h.alive || h.exiting) continue;
      active++;
      // Track horizontal progress only — a hopper bouncing in place under a
      // plank changes y but isn't getting anywhere.
      var x = h.body.getPosition().x * PPM;
      if (h._sx === undefined || Math.abs(x - h._sx) > 8) moved = true;
      h._sx = x;
    }
    if (active === 0 || moved) this.stallT = 0;
    else this.stallT += 0.4;
    if (this.stallT >= 5) {
      // Deadlocked: the stragglers aren't going anywhere. If the target is
      // already met, that's a win; otherwise a loss.
      if (this.score >= this.targetScore) this.pending = 'won';
      else { this.pending = 'lost'; this.outroT = 0; }
    }
  };

  Game.prototype._anyTwirling = function () {
    return this.hoppers.some(function (h) { return h.exiting && h.exitT < 1; });
  };

  Game.prototype._checkEnd = function (dt) {
    // Once a result is pending, keep simulating until its animation finishes,
    // THEN commit the status (so the world doesn't freeze mid-twirl / mid-splat).
    if (this.pending === 'won') {
      if (!this._anyTwirling()) this.status = 'won';
      return;
    }
    if (this.pending === 'lost') {
      this.outroT -= dt;
      if (this.outroT <= 0 && !this._anyTwirling()) this.status = 'lost';
      return;
    }
    // Decide the outcome (score-based). We DON'T end the instant the target is
    // hit — let every hopper finish its run first, so late hoppers still count
    // (you can beat the target) and the level doesn't cut off mid-stream.
    var remaining = this.totalToSpawn - this.saved - this.dead;
    var allDone = this._allSpawned() && remaining <= 0;
    if (allDone) {
      if (this.score >= this.targetScore) this.pending = 'won';
      else { this.pending = 'lost'; this.outroT = 0.9; }
      return;
    }
    // Give up early only when the target is already out of reach.
    if (this.score + remaining * this.maxPortalPoints < this.targetScore) {
      this.pending = 'lost'; this.outroT = 0.9;
    }
  };

  // --- Render snapshot (px) -------------------------------------------------

  Game.prototype.getState = function () {
    var hoppers = this.hoppers.map(function (h) {
      var p = h.body.getPosition();
      return { x: p.x * PPM, y: p.y * PPM, angle: h.body.getAngle(), dir: h.dir,
               alive: h.alive, exiting: h.exiting, exitT: h.exitT,
               exitCX: h.exitCX, exitCY: h.exitCY, floating: h.floatT > 0 };
    });
    return {
      status: this.status, paused: this.paused,
      hoppers: hoppers, items: this.items,
      portalAngle: this.portalAngle, fireTime: this.fireTime,
      inv: this.inv, saved: this.saved, dead: this.dead,
      score: this.score, targetScore: this.targetScore,
      clinched: this.score >= this.targetScore,
      portalPoints: this.portalPoints, total: this.totalToSpawn,
    };
  };

  Game.PPM = PPM;
  Game.TOOLS = TOOLS;
  return Game;
});
