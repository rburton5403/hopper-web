// Synthesized sound effects via the Web Audio API — no asset files needed, so
// it stays self-contained for GitHub Pages. The AudioContext must be resumed
// after a user gesture (browsers block autoplay); main.js calls resume() on
// the first pointer/key interaction.
(function (root) {
  'use strict';
  var ctx = null, master = null, enabled = true;

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function noiseBuffer(dur) {
    var n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Hopper sucked into the portal: a descending vacuum whoosh with a swirl.
  function suck() {
    if (!enabled || !ensure()) return;
    var t = ctx.currentTime, dur = 0.55;

    // Pitch-down "vwoop".
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(720, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + dur);
    var lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(18, t); lfoGain.gain.value = 40;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(200, t + dur); bp.Q.value = 6;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(bp); bp.connect(g); g.connect(master);
    osc.start(t); lfo.start(t); osc.stop(t + dur); lfo.stop(t + dur);

    // Airy swirl (filtered noise sweeping up as it "closes").
    var src = ctx.createBufferSource(); src.buffer = noiseBuffer(dur);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass';
    hp.frequency.setValueAtTime(300, t); hp.frequency.exponentialRampToValueAtTime(2400, t + dur);
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.18, t); ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(ng); ng.connect(master);
    src.start(t); src.stop(t + dur);
  }

  // Hopper dies: a short dull splat.
  function splat() {
    if (!enabled || !ensure()) return;
    var t = ctx.currentTime, dur = 0.18;
    var src = ctx.createBufferSource(); src.buffer = noiseBuffer(dur);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, t); lp.frequency.exponentialRampToValueAtTime(200, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur);
  }

  // Placing a tool: a soft wooden click.
  function place() {
    if (!enabled || !ensure()) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator(); osc.type = 'square';
    osc.frequency.setValueAtTime(320, t); osc.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + 0.1);
  }

  function setEnabled(v) { enabled = v; }

  root.HopperSFX = { resume: resume, suck: suck, splat: splat, place: place, setEnabled: setEnabled };
})(typeof self !== 'undefined' ? self : this);
