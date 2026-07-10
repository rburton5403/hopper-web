// Entry point: wires assets, canvas, input, UI and the animation loop together.
(function () {
  'use strict';

  var Game = window.HopperGame;
  var Renderer = window.HopperRender;
  var level = window.HopperLevels.LEVELS[0];

  var ASSETS = {
    background: 'assets/background.png',
    grass: 'assets/grass.png',
    dirt: 'assets/dirt.png',
    hopper: 'assets/hopper.png',
    spike: 'assets/spike.png',
    portal: 'assets/portal.png',
    spawn: 'assets/spawn.png',
  };

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  canvas.width = level.width;
  canvas.height = level.height;

  var els = {
    go: document.getElementById('go'),
    reset: document.getElementById('reset'),
    undo: document.getElementById('undo'),
    planks: document.getElementById('planksLeft'),
    hint: document.getElementById('hint'),
    overlay: document.getElementById('overlay'),
    overlayText: document.getElementById('overlayText'),
    overlayBtn: document.getElementById('overlayBtn'),
  };

  var game, renderer, images = {};
  var mouse = { x: 0, y: 0, over: false };

  function loadImages(map, done) {
    var keys = Object.keys(map), left = keys.length, failed = false;
    if (left === 0) return done({});
    keys.forEach(function (k) {
      var im = new Image();
      im.onload = function () { images[k] = im; if (--left === 0) done(images); };
      im.onerror = function () { failed = true; if (--left === 0) done(images); };
      im.src = map[k];
    });
  }

  function snap(v, step) { return Math.round(v / step) * step; }

  function toCanvas(evt) {
    var r = canvas.getBoundingClientRect();
    var cx = (evt.clientX - r.left) * (canvas.width / r.width);
    var cy = (evt.clientY - r.top) * (canvas.height / r.height);
    return { x: cx, y: cy };
  }

  function updateHud() {
    var s = game.getState();
    els.planks.textContent = s.planksLeft;
    els.undo.disabled = s.status !== 'build' || s.planks.length === 0;
    els.go.disabled = s.status !== 'build';
    if (s.status === 'build') {
      els.hint.textContent = s.planksLeft > 0
        ? 'Click in the pit to drop a plank, then press Go.'
        : 'Out of planks — press Go, or Undo to reposition.';
    } else if (s.status === 'playing') {
      els.hint.textContent = 'Hop! Hop! Hop!';
    }
  }

  function showOverlay(won) {
    els.overlay.classList.add('show');
    els.overlay.classList.toggle('won', won);
    els.overlay.classList.toggle('lost', !won);
    els.overlayText.textContent = won ? 'The Hopper made it home! 🎉' : 'Splat! The Hopper didn\'t make it.';
    els.overlayBtn.textContent = won ? 'Play Again' : 'Try Again';
  }
  function hideOverlay() { els.overlay.classList.remove('show'); }

  function resetGame() {
    game.reset();
    hideOverlay();
    updateHud();
  }

  // --- Input ---------------------------------------------------------------

  canvas.addEventListener('mousemove', function (e) {
    var p = toCanvas(e);
    mouse.x = snap(p.x, 8); mouse.y = snap(p.y, 8); mouse.over = true;
  });
  canvas.addEventListener('mouseleave', function () { mouse.over = false; });
  canvas.addEventListener('click', function (e) {
    var p = toCanvas(e);
    if (game.addPlank(snap(p.x, 8), snap(p.y, 8))) updateHud();
  });
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (game.removeLastPlank()) updateHud();
  });

  els.go.addEventListener('click', function () { game.start(); updateHud(); });
  els.reset.addEventListener('click', resetGame);
  els.undo.addEventListener('click', function () { if (game.removeLastPlank()) updateHud(); });
  els.overlayBtn.addEventListener('click', resetGame);

  // --- Loop ----------------------------------------------------------------

  var last = null, prevStatus = 'build';
  function frame(now) {
    if (last === null) last = now;
    var dt = (now - last) / 1000;
    last = now;

    var status = game.step(dt);
    if (status !== prevStatus) {
      if (status === 'won') showOverlay(true);
      // Delay the lose overlay slightly so the splat animation is visible.
      else if (status === 'lost') setTimeout(function () {
        if (game.status === 'lost') showOverlay(false);
      }, 700);
      prevStatus = status;
      updateHud();
    }

    var s = game.getState();
    var ghostValid = mouse.x > 0 && mouse.x < level.width && mouse.y > 0 && mouse.y < level.height;
    renderer.draw(s, {
      ghost: mouse.over ? { x: mouse.x, y: mouse.y } : null,
      ghostValid: ghostValid,
    });

    requestAnimationFrame(frame);
  }

  // --- Boot ----------------------------------------------------------------

  loadImages(ASSETS, function (imgs) {
    game = new Game(window.planck, level);
    renderer = new Renderer(ctx, imgs, level);
    prevStatus = game.status;
    updateHud();
    // Optional "watch it solve itself" demo: append ?auto to the URL.
    if (/[?&]auto/.test(location.search)) { game.addPlank(320, 280); updateHud(); game.start(); }
    requestAnimationFrame(frame);
  });
})();
