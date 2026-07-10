// Entry point: assets, canvas, real-time input, tool palette, HUD, SFX, loop.
(function () {
  'use strict';

  var Game = window.HopperGame;
  var Renderer = window.HopperRender;
  var SFX = window.HopperSFX;
  var LEVELS = window.HopperLevels.LEVELS;

  var ASSETS = {
    background: 'assets/background.png', grass: 'assets/grass.png', dirt: 'assets/dirt.png',
    hopper: 'assets/hopper.png', spike: 'assets/spike.png', portal: 'assets/portal.png',
  };
  // Small inline SVG icons for tools without a bespoke sprite (self-contained).
  var svg = function (s) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(s); };
  var ICON_SPRING = svg('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><rect x="4" y="24" width="22" height="4" rx="2" fill="#1f6b6b"/><path d="M6 23 L24 20 L6 16 L24 13 L6 9" stroke="#3aa0a0" stroke-width="3" fill="none"/><rect x="6" y="5" width="18" height="4" rx="2" fill="#3aa0a0"/></svg>');
  var ICON_BALLOON = svg('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><ellipse cx="15" cy="12" rx="9" ry="11" fill="#e0466e" stroke="#b02a54" stroke-width="2"/><path d="M15 23 L15 29" stroke="#7a4a2a" stroke-width="1.5"/><ellipse cx="12" cy="8" rx="2.2" ry="3" fill="#ffffff" opacity="0.5"/></svg>');
  var ICON_BARRIER = svg('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><rect x="12" y="3" width="6" height="24" rx="2" fill="#7d8a99" stroke="#4a545e" stroke-width="1.5"/><path d="M15 8 l-4 3 4 3 M15 8 l4 3 -4 3 M15 16 l-4 3 4 3 M15 16 l4 3 -4 3" stroke="#ffd166" stroke-width="1.6" fill="none"/></svg>');
  var TOOL_META = {
    plank:   { label: 'Plank',   icon: 'assets/planks.png', desc: 'A bridge to hop across.' },
    barrier: { label: 'Barrier', icon: ICON_BARRIER, desc: 'Bounces hoppers the other way.' },
    spring:  { label: 'Spring',  icon: ICON_SPRING,  desc: 'Launches hoppers straight up.' },
    balloon: { label: 'Balloon', icon: ICON_BALLOON, desc: 'Floats the next hopper up (used once).' },
  };

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var els = {
    palette: document.getElementById('palette'),
    score: document.getElementById('score'),
    target: document.getElementById('target'),
    saved: document.getElementById('saved'),
    out: document.getElementById('out'),
    dead: document.getElementById('dead'),
    hint: document.getElementById('hint'),
    levelName: document.getElementById('levelName'),
    pause: document.getElementById('pause'),
    restart: document.getElementById('restart'),
    levelSel: document.getElementById('levelSel'),
    overlay: document.getElementById('overlay'),
    overlayText: document.getElementById('overlayText'),
    overlayBtn: document.getElementById('overlayBtn'),
    mute: document.getElementById('mute'),
  };

  var images = {}, game, renderer, level, levelIdx = 0;
  var selectedTool = null, mouse = { x: 0, y: 0, over: false };
  var prevStatus = 'playing', prevDead = 0, prevHopCount = 0, muted = false;

  function loadImages(map, done) {
    var keys = Object.keys(map), left = keys.length;
    if (!left) return done();
    keys.forEach(function (k) {
      var im = new Image();
      im.onload = im.onerror = function () { images[k] = im; if (--left === 0) done(); };
      im.src = map[k];
    });
  }

  function snap(v, s) { return Math.round(v / s) * s; }
  function toCanvas(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width),
             y: (e.clientY - r.top) * (canvas.height / r.height) };
  }

  function buildPalette() {
    els.palette.innerHTML = '';
    selectedTool = null;
    Object.keys(Game.TOOLS).forEach(function (type) {
      var count = level.inventory[type] || 0;
      if (count <= 0) return;
      var meta = TOOL_META[type];
      var btn = document.createElement('button');
      btn.className = 'tool';
      btn.dataset.tool = type;
      btn.innerHTML = '<img src="' + meta.icon + '" alt=""><span class="tlabel">' + meta.label +
        '</span><span class="tcount" id="count-' + type + '">' + count + '</span>';
      btn.title = meta.desc;
      btn.addEventListener('click', function () { selectTool(type); });
      els.palette.appendChild(btn);
      if (!selectedTool) selectTool(type);
    });
  }

  function selectTool(type) {
    selectedTool = type;
    [].forEach.call(els.palette.children, function (b) {
      b.classList.toggle('active', b.dataset.tool === type);
    });
  }

  function updateHud() {
    var s = game.getState();
    els.score.textContent = s.score;
    els.target.textContent = s.targetScore;
    els.saved.textContent = s.saved;
    els.out.textContent = s.total;
    els.dead.textContent = s.dead;
    Object.keys(Game.TOOLS).forEach(function (type) {
      var c = document.getElementById('count-' + type);
      if (c) {
        c.textContent = s.inv[type];
        var btn = c.closest('.tool');
        if (btn) btn.classList.toggle('empty', s.inv[type] <= 0);
      }
    });
    if (s.status === 'playing') {
      els.hint.textContent = s.clinched
        ? '⭐ Target reached — bringing the rest home for bonus points!'
        : (selectedTool
          ? 'Place a ' + TOOL_META[selectedTool].label.toLowerCase() + ' — left-click to drop, right-click to undo.'
          : 'Guide the hoppers to a portal!');
    }
    els.pause.textContent = game.paused ? 'Resume' : 'Pause';
  }

  function showOverlay(won) {
    els.overlay.classList.add('show');
    els.overlay.classList.toggle('won', won);
    els.overlay.classList.toggle('lost', !won);
    var s = game.getState();
    els.overlayText.textContent = won
      ? 'Score ' + s.score + '/' + s.targetScore + ' — level cleared! 🎉'
      : 'Scored ' + s.score + '/' + s.targetScore + ' (' + s.saved + ' home). Try again!';
    var hasNext = won && levelIdx < LEVELS.length - 1;
    els.overlayBtn.textContent = hasNext ? 'Next Level ▶' : (won ? 'Play Again' : 'Try Again');
    els.overlayBtn.dataset.next = hasNext ? '1' : '';
  }
  function hideOverlay() { els.overlay.classList.remove('show'); }

  function loadLevel(idx) {
    levelIdx = idx;
    level = LEVELS[idx];
    canvas.width = level.width; canvas.height = level.height;
    game = new Game(window.planck, level);
    renderer = new Renderer(ctx, images, level);
    prevStatus = 'playing'; prevDead = 0; prevHopCount = 0;
    els.levelName.textContent = (idx + 1) + '. ' + level.name;
    els.hint.textContent = level.subtitle || '';
    [].forEach.call(els.levelSel.children, function (b) {
      b.classList.toggle('active', +b.dataset.idx === idx);
    });
    buildPalette();
    hideOverlay();
    updateHud();
  }

  // --- Input ---------------------------------------------------------------

  canvas.addEventListener('mousemove', function (e) {
    var p = toCanvas(e); mouse.x = snap(p.x, 4); mouse.y = snap(p.y, 4); mouse.over = true;
  });
  canvas.addEventListener('mouseleave', function () { mouse.over = false; });
  canvas.addEventListener('click', function (e) {
    SFX.resume();
    if (!selectedTool) return;
    var p = toCanvas(e);
    if (game.addItem(selectedTool, snap(p.x, 4), snap(p.y, 4))) { SFX.place(); updateHud(); }
  });
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (game.removeLastItem()) updateHud();
  });
  window.addEventListener('keydown', function (e) {
    SFX.resume();
    if (e.key === ' ') { e.preventDefault(); game.togglePause(); updateHud(); }
    else if (e.key === 'r' || e.key === 'R') loadLevel(levelIdx);
    else if (e.key >= '1' && e.key <= '9') {
      var tools = [].map.call(els.palette.children, function (b) { return b.dataset.tool; });
      var t = tools[+e.key - 1]; if (t) selectTool(t);
    }
  });

  els.pause.addEventListener('click', function () { game.togglePause(); updateHud(); });
  els.restart.addEventListener('click', function () { loadLevel(levelIdx); });
  els.overlayBtn.addEventListener('click', function () {
    loadLevel(els.overlayBtn.dataset.next ? levelIdx + 1 : levelIdx);
  });
  els.mute.addEventListener('click', function () {
    muted = !muted; SFX.setEnabled(!muted); els.mute.textContent = muted ? '🔇' : '🔊';
    els.mute.classList.toggle('off', muted);
  });

  // --- Loop ----------------------------------------------------------------

  var last = null;
  function frame(now) {
    if (last === null) last = now;
    var dt = (now - last) / 1000; last = now;

    var status = game.step(dt);

    // SFX: portal suck + death splat + a faint hop (once per frame at most).
    if (game.justSaved) { game.justSaved = false; SFX.suck(); }
    if (game.hopCount > prevHopCount) { SFX.hop(); prevHopCount = game.hopCount; }
    var s = game.getState();
    if (s.dead > prevDead) { SFX.eek(); prevDead = s.dead; }

    if (status !== prevStatus) {
      // The engine finishes the twirl / splat animation before committing the
      // result, so it's safe to show the overlay as soon as the status flips.
      if (status === 'won') showOverlay(true);
      else if (status === 'lost') showOverlay(false);
      prevStatus = status; updateHud();
    } else if (status === 'playing') {
      updateHud();
    }

    var valid = mouse.x > 0 && mouse.x < level.width && mouse.y > 0 && mouse.y < level.height;
    renderer.draw(s, { ghost: mouse.over ? { x: mouse.x, y: mouse.y } : null, tool: selectedTool, ghostValid: valid });
    requestAnimationFrame(frame);
  }

  // --- Boot ----------------------------------------------------------------

  // Build the level-select buttons.
  LEVELS.forEach(function (lv, i) {
    var b = document.createElement('button');
    b.className = 'lvlbtn'; b.dataset.idx = i; b.textContent = 'Level ' + (i + 1);
    b.addEventListener('click', function () { loadLevel(i); });
    els.levelSel.appendChild(b);
  });

  loadImages(ASSETS, function () {
    var start = parseInt((location.hash || '#1').slice(1), 10);
    loadLevel(isNaN(start) ? 0 : Math.max(0, Math.min(LEVELS.length - 1, start - 1)));
    requestAnimationFrame(frame);
  });
})();
