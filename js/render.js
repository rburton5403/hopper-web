// Canvas renderer for Hopper Web. Draws the world snapshot from Game.getState().
(function (root, factory) {
  root.HopperRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Sprite pixel sizes (native asset dimensions).
  var SIZES = {
    hopper: { w: 41, h: 45 },
    spike: { w: 16, h: 32 },
    portal: { w: 48, h: 48 },
    spawn: { w: 16, h: 16 },
  };

  function Renderer(ctx, images, level) {
    this.ctx = ctx;
    this.img = images;
    this.level = level;
  }

  Renderer.prototype.draw = function (state, opts) {
    var ctx = this.ctx, level = this.level, img = this.img;
    opts = opts || {};

    // Background.
    if (img.background) ctx.drawImage(img.background, 0, 0, level.width, level.height);
    else { ctx.fillStyle = '#8ecae6'; ctx.fillRect(0, 0, level.width, level.height); }

    // Blocks — tile a 32px texture across each rectangle.
    level.blocks.forEach(function (b) {
      this._tile(img[b.tex], b.x, b.y, b.w, b.h, 32);
    }, this);

    // Spikes.
    level.spikes.forEach(function (s) {
      if (img.spike) ctx.drawImage(img.spike, s.x, s.y, SIZES.spike.w, SIZES.spike.h);
      else this._tri(s.x + 8, s.y + 16);
    }, this);

    // Spawn marker (only during build, subtle).
    if (state.status === 'build' && img.spawn) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img.spawn, level.spawn.x + 12, level.spawn.y + 30, SIZES.spawn.w, SIZES.spawn.h);
      ctx.globalAlpha = 1;
    }

    // Planks placed by the player.
    state.planks.forEach(function (p) {
      this._plank(p.x, p.y, p.w, p.h);
    }, this);

    // Ghost plank preview during build.
    if (opts.ghost && state.status === 'build' && state.planksLeft > 0) {
      var g = opts.ghost, sz = level.plankSize;
      ctx.globalAlpha = 0.5;
      this._plank(g.x - sz.w / 2, g.y - sz.h / 2, sz.w, sz.h, opts.ghostValid);
      ctx.globalAlpha = 1;
    }

    // Portal — rotating.
    var pc = { x: level.portal.x + 24, y: level.portal.y + 24 };
    ctx.save();
    ctx.translate(pc.x, pc.y);
    ctx.rotate(state.portalAngle);
    if (img.portal) ctx.drawImage(img.portal, -24, -24, SIZES.portal.w, SIZES.portal.h);
    else { ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();

    // Hopper.
    this._hopper(state.hopper);
  };

  Renderer.prototype._hopper = function (h) {
    var ctx = this.ctx, img = this.img, s = SIZES.hopper;
    var scale = 1;
    if (h.exiting) scale = 1 - h.exitT; // shrink into the portal
    if (scale <= 0.02) return;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    ctx.scale(scale, scale);
    if (!h.alive) ctx.globalAlpha = 0.85;
    if (img.hopper) ctx.drawImage(img.hopper, -s.w / 2, -s.h / 2, s.w, s.h);
    else { ctx.fillStyle = '#43a047'; ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h); }
    ctx.restore();
  };

  // Tile a texture across a rect, clipped to the rect bounds.
  Renderer.prototype._tile = function (texture, x, y, w, h, tile) {
    var ctx = this.ctx;
    if (!texture) { ctx.fillStyle = '#6b4f2a'; ctx.fillRect(x, y, w, h); return; }
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    for (var yy = y; yy < y + h; yy += tile) {
      for (var xx = x; xx < x + w; xx += tile) {
        ctx.drawImage(texture, xx, yy, tile, tile);
      }
    }
    ctx.restore();
  };

  Renderer.prototype._plank = function (x, y, w, h, valid) {
    var ctx = this.ctx;
    var y0 = y, r = h / 2;
    // Wooden plank look.
    ctx.fillStyle = valid === false ? '#c62828' : '#a9743b';
    this._roundRect(x, y0, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = valid === false ? '#8e1f1f' : '#6f4a24';
    ctx.lineWidth = 2;
    this._roundRect(x, y0, w, h, 4);
    ctx.stroke();
    // grain lines
    ctx.strokeStyle = 'rgba(80,50,20,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y0 + r); ctx.lineTo(x + w - 4, y0 + r);
    ctx.stroke();
  };

  Renderer.prototype._roundRect = function (x, y, w, h, r) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  Renderer.prototype._tri = function (cx, cy) {
    var ctx = this.ctx;
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx - 8, cy + 16); ctx.lineTo(cx + 8, cy + 16);
    ctx.closePath(); ctx.fill();
  };

  return Renderer;
});
