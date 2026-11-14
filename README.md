# Cosy Cribbage

A cosy, 16-bit style online cribbage game. Play against Winnie (the computer) or with friends, on a randomly generated lane through autumn countryside.

## Status
Vertical slice:
- Full cribbage rules against Winnie, the computer
- Table view: a pixel room with a window onto the lane, scores on the chalkboard
- Walk view after each round: both walkers walk their points along a generated lane
- Lane generator: one seed makes a new lane each game, with meadow and forest stretches
- One moment (a deer when you first enter the forest), falling leaves, synthesised sound and a lofi loop

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
- `src/game.js` game flow and the card table
- `src/pixel.js` seeded random numbers and pixel drawing helpers
- `src/art.js` code-drawn scenery, animals and walker sprites
- `src/lane.js` lane generator and biome rendering
- `src/scenes.js` the room above the table and the walk view
- `src/weather.js` falling leaves
- `src/sound.js` synthesised effects and music

## Roadmap
1. Vertical slice: table view, walk view, meadow and forest biomes, one weather type, one moment, basic sound
2. Lane generator with full biome set and seeds
3. Avatars, moments, weather set
4. Multiplayer with friends
