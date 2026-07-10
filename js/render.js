// Canvas renderer for Hopper Web. Draws the world snapshot from Game.getState().
(function (root, factory) {
  root.HopperRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SIZES = { hopper: { w: 41, h: 45 }, spike: { w: 16, h: 32 }, portal: { w: 48, h: 48 } };

  function Renderer(ctx, images, level) {
    this.ctx = ctx; this.img = images; this.level = level;
  }

  Renderer.prototype.draw = function (state, opts) {
    var ctx = this.ctx, level = this.level, img = this.img;
    opts = opts || {};

    if (img.background) ctx.drawImage(img.background, 0, 0, level.width, level.height);
    else { ctx.fillStyle = '#8ecae6'; ctx.fillRect(0, 0, level.width, level.height); }

    // Blocks.
    level.blocks.forEach(function (b) {
      this._tile(img[b.tex], b.x, b.y, b.w, b.h, 32);
      if (b.wall) { ctx.fillStyle = 'rgba(60,40,20,.25)'; ctx.fillRect(b.x, b.y, b.w, b.h); }
    }, this);

    // Spikes.
    (level.spikes || []).forEach(function (s) {
      if (img.spike) ctx.drawImage(img.spike, s.x, s.y, SIZES.spike.w, SIZES.spike.h);
      else this._tri(s.x + 8, s.y + 16);
    }, this);

    // Fire (animated).
    (level.fires || []).forEach(function (f, i) { this._fire(f.x + 16, f.y + 32, state.fireTime, i); }, this);

    // Player-placed items.
    state.items.forEach(function (it) { this._item(it); }, this);

    // Ghost preview.
    if (opts.ghost && opts.tool && state.inv[opts.tool] > 0 && state.status === 'playing') {
      var T = (window.HopperGame && window.HopperGame.TOOLS[opts.tool]);
      if (T) {
        this.ctx.globalAlpha = 0.5;
        this._item({ type: opts.tool, x: opts.ghost.x - T.w / 2, y: opts.ghost.y - T.h / 2, w: T.w, h: T.h }, opts.ghostValid);
        this.ctx.globalAlpha = 1;
      }
    }

    // Portals.
    level.portals.forEach(function (p) {
      ctx.save();
      ctx.translate(p.x + 24, p.y + 24);
      ctx.rotate(state.portalAngle);
      if (img.portal) ctx.drawImage(img.portal, -24, -24, SIZES.portal.w, SIZES.portal.h);
      else { ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill(); }
      ctx.restore();
    }, this);

    // Hoppers.
    state.hoppers.forEach(function (h) { this._hopper(h); }, this);
  };

  Renderer.prototype._hopper = function (h) {
    var ctx = this.ctx, img = this.img, s = SIZES.hopper;
    var x = h.x, y = h.y, angle = h.angle, scale = 1;

    if (h.exiting) {
      // Spin, shrink and twirl into the portal centre — like being sucked in.
      var t = h.exitT;
      x = h.x + (h.exitCX - h.x) * t;
      y = h.y + (h.exitCY - h.y) * t;
      scale = 1 - t;
      angle = t * Math.PI * 6 * h.dir; // several fast spins
    }
    if (scale <= 0.02) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(h.dir < 0 ? -scale : scale, scale); // face travel direction
    if (!h.alive) ctx.globalAlpha = 0.85;
    if (img.hopper) ctx.drawImage(img.hopper, -s.w / 2, -s.h / 2, s.w, s.h);
    else { ctx.fillStyle = '#43a047'; ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h); }
    ctx.restore();
  };

  Renderer.prototype._item = function (it, valid) {
    if (it.type === 'plank') this._plank(it.x, it.y, it.w, it.h, valid);
    else if (it.type === 'barrier') this._barrier(it.x, it.y, it.w, it.h, valid);
    else if (it.type === 'spring') this._spring(it.x, it.y, it.w, it.h, valid);
    else if (it.type === 'balloon') this._balloon(it.x, it.y, it.w, it.h, valid);
  };

  Renderer.prototype._balloon = function (x, y, w, h, valid) {
    var ctx = this.ctx, cx = x + w / 2, rx = w / 2, ry = (h - 8) / 2, cy = y + ry;
    ctx.strokeStyle = 'rgba(90,60,30,.7)'; ctx.lineWidth = 1.5; // string
    ctx.beginPath(); ctx.moveTo(cx, cy + ry); ctx.lineTo(cx, y + h); ctx.stroke();
    ctx.fillStyle = valid === false ? '#c62828' : '#e0466e';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = valid === false ? '#8e1f1f' : '#b02a54'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; // highlight
    ctx.beginPath(); ctx.ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.25, ry * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  };

  Renderer.prototype._plank = function (x, y, w, h, valid) {
    var ctx = this.ctx;
    ctx.fillStyle = valid === false ? '#c62828' : '#a9743b';
    this._round(x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = valid === false ? '#8e1f1f' : '#6f4a24'; ctx.lineWidth = 2;
    this._round(x, y, w, h, 4); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,50,20,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 4, y + h / 2); ctx.lineTo(x + w - 4, y + h / 2); ctx.stroke();
  };

  Renderer.prototype._barrier = function (x, y, w, h, valid) {
    var ctx = this.ctx, cx = x + w / 2;
    ctx.fillStyle = valid === false ? '#c62828' : '#7d8a99';
    this._round(x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = valid === false ? '#8e1f1f' : '#4a545e'; ctx.lineWidth = 2;
    this._round(x, y, w, h, 4); ctx.stroke();
    // Outward chevrons signalling "bounces both ways".
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
    for (var k = 0; k < 3; k++) {
      var yy = y + 16 + k * 22;
      ctx.beginPath(); ctx.moveTo(cx - 5, yy - 4); ctx.lineTo(cx, yy); ctx.lineTo(cx - 5, yy + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 5, yy - 4); ctx.lineTo(cx, yy); ctx.lineTo(cx + 5, yy + 4); ctx.stroke();
    }
  };

  Renderer.prototype._spring = function (x, y, w, h, valid) {
    var ctx = this.ctx;
    ctx.fillStyle = valid === false ? '#c62828' : '#3aa0a0';
    this._round(x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = valid === false ? '#8e1f1f' : '#1f6b6b'; ctx.lineWidth = 2;
    this._round(x, y, w, h, 5); ctx.stroke();
    // Zigzag coil hint.
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    ctx.beginPath();
    var n = 5, x0 = x + 6, x1 = x + w - 6, step = (x1 - x0) / n, my = y + h / 2;
    ctx.moveTo(x0, my);
    for (var i = 0; i < n; i++) ctx.lineTo(x0 + step * (i + 0.5), my + (i % 2 ? 4 : -4)), ctx.lineTo(x0 + step * (i + 1), my);
    ctx.stroke();
  };

  Renderer.prototype._fire = function (cx, baseY, t, seed) {
    var ctx = this.ctx;
    var flick = Math.sin(t * 12 + seed * 1.7) * 0.5 + Math.sin(t * 7 + seed) * 0.5;
    var hgt = 30 + flick * 6;
    function flame(color, scale) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - hgt * scale);
      ctx.quadraticCurveTo(cx + 11 * scale, baseY - hgt * 0.4 * scale, cx + 7 * scale, baseY);
      ctx.quadraticCurveTo(cx, baseY + 3, cx - 7 * scale, baseY);
      ctx.quadraticCurveTo(cx - 11 * scale, baseY - hgt * 0.4 * scale, cx, baseY - hgt * scale);
      ctx.fill();
    }
    flame('#e8541e', 1);
    flame('#f5a623', 0.66);
    flame('#ffe066', 0.34);
  };

  Renderer.prototype._tile = function (texture, x, y, w, h, tile) {
    var ctx = this.ctx;
    if (!texture) { ctx.fillStyle = '#6b4f2a'; ctx.fillRect(x, y, w, h); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    for (var yy = y; yy < y + h; yy += tile)
      for (var xx = x; xx < x + w; xx += tile) ctx.drawImage(texture, xx, yy, tile, tile);
    ctx.restore();
  };

  Renderer.prototype._round = function (x, y, w, h, r) {
    var ctx = this.ctx;
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  Renderer.prototype._tri = function (cx, cy) {
    var ctx = this.ctx; ctx.fillStyle = '#9e9e9e';
    ctx.beginPath(); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx - 8, cy + 16); ctx.lineTo(cx + 8, cy + 16);
    ctx.closePath(); ctx.fill();
  };

  return Renderer;
});
