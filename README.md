# Hopper (Web)

A browser remake of **Hopper**, a physics puzzle originally built with the Corona
SDK (Gargle Games, 2013) — reimagined as a **real-time, Lemmings-style** game.

Hoppers spawn and hop on their own, and they never stop. They hop in the
direction they face and can't steer, so they'll happily hop off a cliff into the
fire. You place tools **in real time** to build them a safe path to the portal.

**▶ Play it:** https://rburton5403.github.io/hopper-web/

## How to play

- Pick a tool from the tray (or press **1** / **2** / **3**).
- **Left-click** the board to place it; **right-click** to undo the last one.
- **Plank** — a bridge to hop across. **Barrier** — bounces hoppers back the
  other way. **Spring** — launches them straight up. **Balloon** — floats the
  next hopper that touches it up to a higher ledge (used once).
- Get enough hoppers into a spinning **portal** to win; they spin, shrink and
  twirl in as they're sucked home. **Space** pauses, **R** restarts.

Five levels so far, growing toward ten — progressively more hoppers and a
higher minimum to clear: *The Spike Pit* (1) → *Two Ways Home* (4, save 3) →
*The Long Haul* (8, save 6) → *Crowd Control* (10, save 7) → *The Gauntlet*
(14, save 10).

## How it's built

Plain HTML5 canvas + JavaScript, no build step, no framework — just static files,
so it deploys straight to GitHub Pages.

| File | Role |
|------|------|
| `js/level.js`  | Level data + physics tuning (DOM-free, UMD) |
| `js/game.js`   | Real-time engine: hopping, direction/flip, spawns, hazards, tools, win/lose (DOM-free, UMD) |
| `js/render.js` | Canvas renderer — hoppers, animated fire, tools, portal twirl |
| `js/sound.js`  | Synthesized Web Audio SFX (portal "suck", splat, place) |
| `js/main.js`   | Assets, real-time input, tool palette, HUD, level select, loop |
| `js/planck.min.js` | [planck.js](https://github.com/piqnt/planck.js) — a Box2D port, for the physics |

Because `game.js` and `level.js` have no DOM dependencies, the mechanics are
verified headlessly in Node (load planck with `global.window = global` first):

```bash
node test/sim_all.js  # every level is winnable (with a plank bridge); balloon lifts
node test/tools.js    # barrier flips hopper direction; spring launches it high
node test/outro.js    # a cleared level waits for the twirl before declaring the win
```

**Key physics gotcha:** `hopInterval` must exceed the hop airtime
(`2*hopVelY/gravity`), or a hopper re-hops in mid-air and flies away instead of
landing and resting between hops.

## Credits

- Original **Hopper** game and art: Gargle Games (2013).
- Physics: [planck.js](https://github.com/piqnt/planck.js). Inspired by Lemmings.
- Web remake: this repository.
