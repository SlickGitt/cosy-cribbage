# Lantern Lane

*A cosy cribbage game.*

A 16-bit style online cribbage game. Play against Winnie (the computer) or with friends, on a randomly generated lane through autumn countryside.

## Status
Vertical slice:
- Full cribbage rules against Winnie, the computer
- Full-screen layout with no scrolling
- Rest stops: each round is played beside the lane on a surface that matches the biome (picnic blanket, tree slab, jetty, straw bale, granite slab, tea room tablecloth, deckchair rug and more), with you and Winnie seated at it. Your picnic blanket (from the Collection) is spread out in the meadow and laid across the surface everywhere else
- Points scored light lanterns further along the lane; at the end of the round you both walk to them
- Winnie reacts in speech bubbles
- Lane generator: one seed makes a new lane each game. It starts in the meadow, ends on the village green, and passes through a shuffled run of forest, orchard, river (with a bridge and jetty), farm, moor, village (with a tea room), churchyard and town
- The lake: once per lane, a wide lake you row across in little boats, with lily pads for pegs, jetties at each shore, weeping willows, reeds, toads and a pair of swans. Rest stops there are played on a log raft afloat on the lake
- Moments, the first time you walk into each biome: a hot-air balloon over the meadow, a deer in the forest, a kingfisher diving in the river, a fish leaping by the boats on the lake, starlings swirling over the village
- Time of day follows the game: a golden afternoon, then amber, then dusk near home, with windows and lamps coming on, chimney smoke, fireflies and lantern glow
- Glints on the river, falling leaves, weather, synthesised sound and a lofi loop

## Run locally
No build step. Serve the folder with any static server, for example:

    python3 -m http.server 8000

then open http://localhost:8000.

## Tests
Scoring rules are covered by tests. Run them with Node 22 or later:

    node --test tests/*.test.mjs

## Friend play
Play a friend from the title screen. The game makes a link to send; whoever opens it joins, and you take turns whenever suits you. Nobody needs an account: each browser signs in quietly as an anonymous player.

The server deals from a properly shuffled deck, keeps each hand private, checks every move, calls Go when a player can't play, and does all the scoring. The browser only shows what that player is allowed to see.

- The production address uses the live Supabase project; previews and local copies use dev (see `src/online.js`).
- Database changes go in numbered files in `supabase/`. Run each one in the SQL Editor of dev, test, then live.
- `tests/db/simulate.mjs` checks the database scoring against `src/scoring.js` and plays full games between two players (needs a local Postgres; see the file header).

## Hosting
Cloudflare Pages deploys `main` automatically: https://lantern-lane-5dw.pages.dev

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
- `src/ground.js` textured ground and lane
- `src/sprites.js` baked, outlined scenery sprites
- `src/critters.js` animals and what they do when clicked
- `src/walkers.js` walker sprites (from the design canvas) and menu drawings
- `src/save.js` progress saved in the browser: walker, settings, stats, unlocks
- `src/unlocks.js` feats, ranks, field guide and rewards: what unlocks and how
- `src/collection.js` the Collection screen and gear (card backs, blankets, lanterns)

Style trial: the meadow, forest, river and village are switched on (`ACTIVE` in `src/biomes.js`) while the new look is tested. Click sheep, cows, birds, rabbits, squirrels, butterflies, trees, bushes and mushrooms in the lane view.
- `src/scene.js` the full-screen scene: rest stop mode and walk mode
- `src/reststop.js` rest stop surfaces, seated walkers and lanterns
- `src/moments.js` the moments: what happens, where, and their art
- `src/lake.js` the lake's shape and water, lily pad pegs, weeping willows and the rowing boats
- `src/weathers.js` weather kinds and how they follow each other
- `src/weather.js` falling leaves
- `src/sound.js` synthesised effects and music
- `src/online.js` friend play: signs in quietly, sends moves to the server and watches for the other player's moves
- `src/vendor/` the Supabase browser library, loaded only when friend play is used
- `supabase/001_friend_play.sql` the friend play database: tables, security rules, dealing, move checks and scoring

## Roadmap
1. Vertical slice: table view, walk view, meadow and forest biomes, one weather type, one moment, basic sound
2. Lane generator with full biome set and seeds
3. Avatars, moments, weather set
4. Multiplayer with friends

## Publishing

Run `python3 tools/stamp.py` before every push. It stamps each script and the stylesheet with a hash of its contents so browsers never mix a new page with cached old scripts.
