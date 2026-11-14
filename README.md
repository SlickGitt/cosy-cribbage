# Cosy Cribbage

A cosy, 16-bit style online cribbage game. Play against Winnie (the computer) or with friends, on a randomly generated lane through autumn countryside.

## Status
Gameplay prototype: full rules against the computer, with a simple table layout.

## Run locally
No build step. Serve the folder with any static server, for example:

    python3 -m http.server 8000

then open http://localhost:8000.

## Structure
- `index.html` page shell
- `styles/main.css` styles
- `src/cards.js` cards, suits and helpers
- `src/scoring.js` hand and pegging scoring
- `src/ai.js` Winnie's discard and pegging choices
- `src/game.js` game flow and rendering

## Roadmap
1. Vertical slice: table view, walk view, meadow and forest biomes, one weather type, one moment, basic sound
2. Lane generator with full biome set and seeds
3. Avatars, moments, weather set
4. Multiplayer with friends
