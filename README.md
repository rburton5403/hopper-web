# Hopper (Web)

A browser remake of **Hopper**, a physics puzzle game originally built with the
Corona SDK (Gargle Games, 2013). The hopper hops on its own — up and to the
right, over and over — and can't steer. Your job is to build it a path.

**▶ Play it:** https://rburton5403.github.io/hopper-web/

![Hopper gameplay](assets/hopper.png)

## How to play

- The hopper auto-hops on a timer. It always launches up and to the right.
- **Left-click** in the pit to drop a **plank** as a stepping stone.
- **Right-click** (or the **Undo** button) removes the last plank.
- Press **Go** to release the hopper. Reach the spinning **portal** to win.
- Touch a **spike** or fall in the pit and you start over (**Reset**).

You have 3 planks — but the first level only needs one well-placed board.

Add `?auto` to the URL to watch the game solve itself.

## How it's built

Plain HTML5 canvas + JavaScript, no build step, no framework — it's just static
files, so it deploys straight to GitHub Pages.

| File | Role |
|------|------|
| `js/level.js`  | Level data + physics tuning (DOM-free, UMD) |
| `js/game.js`   | Physics, hopping, collisions, win/lose (DOM-free, UMD) |
| `js/render.js` | Canvas renderer |
| `js/main.js`   | Asset loading, input, UI, animation loop |
| `js/planck.min.js` | [planck.js](https://github.com/piqnt/planck.js) — a Box2D port for the physics |

Physics constants (hop velocity, gravity, hop interval) mirror the original
Corona game's feel: a bottom-heavy collision body, fixed rotation, and an impulse
hop. Because `game.js` and `level.js` have no DOM dependencies, the game logic is
verified headlessly in Node:

```bash
node test/measure.js   # measures a single hop arc (apex + horizontal distance)
node test/sim.js        # proves the level is winnable and finds solutions
```

## Credits

- Original **Hopper** game and art: Gargle Games (2013).
- Physics: [planck.js](https://github.com/piqnt/planck.js).
- Web remake: this repository.
