# Cosy Cribbage

A cosy, 16-bit style online cribbage game. Play against Winnie (the computer) or with friends, on a randomly generated lane through autumn countryside.

## Status
Vertical slice:
- Full cribbage rules against Winnie, the computer
- Full-screen layout with no scrolling
- Rest stops: each round is played beside the lane on a surface that matches the biome (picnic blanket, tree slab, jetty, straw bale, granite slab, tea room tablecloth, deckchair rug and more), with you and Winnie seated at it
- Points scored light lanterns further along the lane; at the end of the round you both walk to them
- Winnie reacts in speech bubbles
- Lane generator: one seed makes a new lane each game. It starts in the meadow, ends on the village green, and passes through a shuffled run of forest, orchard, river (with a bridge and jetty), farm, moor, village (with a tea room), churchyard and town
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
- `src/lane.js` lane generator
- `src/biomes.js` biome table: ground, lane colours, scenery, rest stop surface and entering line
- `src/scenery.js` art for the newer biomes
- `src/scene.js` the full-screen scene: rest stop mode and walk mode
- `src/reststop.js` rest stop surfaces, seated walkers and lanterns
- `src/weather.js` falling leaves
- `src/sound.js` synthesised effects and music

## Roadmap
1. Vertical slice: table view, walk view, meadow and forest biomes, one weather type, one moment, basic sound
2. Lane generator with full biome set and seeds
3. Avatars, moments, weather set
4. Multiplayer with friends
