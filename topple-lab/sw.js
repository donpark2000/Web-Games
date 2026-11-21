// The Topple Lab's sw.js: the main site's (../sw.js) with the lab's cache
// names. Made by tools/offline.js (tools/topple-lab.js); don't edit by hand.
// The offline app (DESIGN.md "Offline app"): a service worker that saves
// every file of the site on the device the first time the site is opened
// with a connection, so all the games play with none (a car, no wifi).
// Registered by src/ui/offline.js on every page.
//
// - Install: save every file in FILES into a cache named for this VERSION.
//   A file an older version saved with the same hash (HASHES) is copied
//   from that version's cache; the rest come fresh from the site (not the
//   browser's ordinary cache). So a release downloads only the files that
//   changed (Q139, 11.6). If any file fails, this version's cache is
//   removed, this version isn't used and the old one carries on. What it
//   did (kept, fetched, from which version) is kept with the hashes, and
//   told to a page that asks (its debug log).
// - Activate: delete older versions' caches; take over open pages.
// - Fetch, for this site's own files: the saved copy first (instant, and
//   the same whether online or not); the network for anything not saved.
//   Other sites (the stats counter) are left alone.
//   On localhost the network comes first instead, so the local server
//   shows edits on a reload; the saved copy is used when the server is
//   stopped. (127.0.0.1 behaves like the live site, for testing that.)
//
// A new VERSION (tools/offline.js, after any change to the site) makes
// this file different, so the browser installs it the next time a page
// opens online (src/ui/offline.js also asks for a check); the pages opened
// after that get the new files, and the home page loads again for them.

// ---- made by tools/offline.js (don't edit by hand) ----
const VERSION = '04606587ad45';
const MADE = '2026-11-21';
const RELEASE = '0.3';
const FILES = [
  '../css/bridges.css',
  '../css/cards.css',
  '../css/colour-sudoku.css',
  '../css/connect-four.css',
  '../css/count-to-9.css',
  '../css/dots-boxes.css',
  '../css/five-dice-3d.css',
  '../css/five-dice.css',
  '../css/follow-me.css',
  '../css/game.css',
  '../css/hidden-faces.css',
  '../css/laser-lab.css',
  '../css/log.css',
  '../css/matching.css',
  '../css/nim.css',
  '../css/reversi.css',
  '../css/rock-paper-scissors.css',
  '../css/site.css',
  '../css/snakes-ladders.css',
  '../css/tic-tac-toe.css',
  '../css/tin-can-alley.css',
  '../css/topple.css',
  '../data/topple/brick_wall_001_arm.jpg',
  '../data/topple/brick_wall_001_col.jpg',
  '../data/topple/brick_wall_001_nor.jpg',
  '../data/topple/brown_planks_09_arm.jpg',
  '../data/topple/brown_planks_09_col.jpg',
  '../data/topple/brown_planks_09_nor.jpg',
  '../data/topple/cliff_side_arm.jpg',
  '../data/topple/cliff_side_col.jpg',
  '../data/topple/cliff_side_nor.jpg',
  '../data/topple/concrete_floor_worn_001_arm.jpg',
  '../data/topple/concrete_floor_worn_001_col.jpg',
  '../data/topple/concrete_floor_worn_001_nor.jpg',
  '../data/topple/corrugated_iron_02_arm.jpg',
  '../data/topple/corrugated_iron_02_col.jpg',
  '../data/topple/corrugated_iron_02_nor.jpg',
  '../data/topple/gravel_concrete_col.jpg',
  '../data/topple/gravel_concrete_nor.jpg',
  '../data/topple/gravel_concrete_rough.jpg',
  '../data/topple/green_metal_rust_arm.jpg',
  '../data/topple/green_metal_rust_col.jpg',
  '../data/topple/green_metal_rust_nor.jpg',
  '../data/topple/knotted_pine_bark_arm.jpg',
  '../data/topple/knotted_pine_bark_col.jpg',
  '../data/topple/knotted_pine_bark_nor.jpg',
  '../data/topple/rusty_metal_02_arm.jpg',
  '../data/topple/rusty_metal_02_col.jpg',
  '../data/topple/rusty_metal_02_nor.jpg',
  '../data/topple/sand_01_arm.jpg',
  '../data/topple/sand_01_col.jpg',
  '../data/topple/sand_01_nor.jpg',
  '../data/topple/sky_construction_yard.jpg',
  '../data/topple/sky_goegap.jpg',
  '../data/topple/sky_lago_disola.jpg',
  '../data/topple/snow_02_arm.jpg',
  '../data/topple/snow_02_col.jpg',
  '../data/topple/snow_02_nor.jpg',
  '../data/topple/weathered_brown_planks_arm.jpg',
  '../data/topple/weathered_brown_planks_col.jpg',
  '../data/topple/weathered_brown_planks_nor.jpg',
  '../data/topple/wooden_barrel_arm.jpg',
  '../data/topple/wooden_barrel_col.jpg',
  '../data/topple/wooden_barrel_nor.jpg',
  '../icons/home/topple.webp',
  '../src/core/appversion.js',
  '../src/core/bridges.js',
  '../src/core/cannon-keys.js',
  '../src/core/colour-sudoku.js',
  '../src/core/connect-four.js',
  '../src/core/count-to-9.js',
  '../src/core/dice3d.js',
  '../src/core/dots-boxes.js',
  '../src/core/drawing.js',
  '../src/core/fit.js',
  '../src/core/five-dice-best.js',
  '../src/core/five-dice.js',
  '../src/core/fixed-step.js',
  '../src/core/follow-me.js',
  '../src/core/hidden-faces.js',
  '../src/core/laser-lab.js',
  '../src/core/log.js',
  '../src/core/matching.js',
  '../src/core/net.js',
  '../src/core/nim.js',
  '../src/core/players.js',
  '../src/core/release.js',
  '../src/core/resume.js',
  '../src/core/reversi.js',
  '../src/core/rock-paper-scissors.js',
  '../src/core/showbox.js',
  '../src/core/snakes-ladders.js',
  '../src/core/speedtest.js',
  '../src/core/stats.js',
  '../src/core/tic-tac-toe.js',
  '../src/core/tin-can-alley-physics.js',
  '../src/core/tin-can-alley.js',
  '../src/core/topple-animals.js',
  '../src/core/topple-blast-scenes.js',
  '../src/core/topple-blast.js',
  '../src/core/topple-levels.js',
  '../src/core/topple-moon-world.js',
  '../src/core/topple-moon.js',
  '../src/core/topple-movers.js',
  '../src/core/topple-road.js',
  '../src/core/topple-sky.js',
  '../src/core/topple-tutorial.js',
  '../src/core/topple-world.js',
  '../src/core/topple.js',
  '../src/core/version.js',
  '../src/ui/brboard.js',
  '../src/ui/bridges.js',
  '../src/ui/cardback.js',
  '../src/ui/colour-sudoku.js',
  '../src/ui/connect-four.js',
  '../src/ui/count-to-9.js',
  '../src/ui/csboard.js',
  '../src/ui/dbboard.js',
  '../src/ui/debuglog.js',
  '../src/ui/dots-boxes.js',
  '../src/ui/drawcuts.js',
  '../src/ui/drawwatch.js',
  '../src/ui/faces.js',
  '../src/ui/fit.js',
  '../src/ui/five-dice-3d.js',
  '../src/ui/five-dice-game.js',
  '../src/ui/fivedice-pics.js',
  '../src/ui/fmpads.js',
  '../src/ui/follow-me.js',
  '../src/ui/hfboard.js',
  '../src/ui/hidden-faces.js',
  '../src/ui/laser-lab.js',
  '../src/ui/llboard.js',
  '../src/ui/logpage.js',
  '../src/ui/matching.js',
  '../src/ui/matchstick.js',
  '../src/ui/net.js',
  '../src/ui/nim.js',
  '../src/ui/nozoom.js',
  '../src/ui/numbercard.js',
  '../src/ui/offline.js',
  '../src/ui/resume.js',
  '../src/ui/reversi.js',
  '../src/ui/rock-paper-scissors.js',
  '../src/ui/rpspics.js',
  '../src/ui/rvboard.js',
  '../src/ui/scrolllog.js',
  '../src/ui/snakes-ladders.js',
  '../src/ui/snlart.js',
  '../src/ui/sound.js',
  '../src/ui/sounds.js',
  '../src/ui/speedtest.js',
  '../src/ui/stats.js',
  '../src/ui/tcapics.js',
  '../src/ui/tic-tac-toe.js',
  '../src/ui/tin-can-alley-stall.js',
  '../src/ui/tin-can-alley.js',
  '../src/ui/topple-blast-fx.js',
  '../src/ui/topple-moon-looks.js',
  '../src/ui/topple-moon.js',
  '../src/ui/topple-scene.js',
  '../src/ui/topple-sets.js',
  '../src/ui/topple.js',
  '../src/ui/topplepics.js',
  '../src/ui/tray3d.js',
  '../src/vendor/cannon-es/LICENSE',
  '../src/vendor/cannon-es/cannon-es.js',
  '../src/vendor/three/LICENSE',
  '../src/vendor/three/RoundedBoxGeometry.js',
  '../src/vendor/three/three.module.min.js',
  'data/park/grass005_col.jpg',
  'data/park/grass005_nor.jpg',
  'data/park/grass005_rough.jpg',
  'data/park/leaf.png',
  'data/park/sky_je_gray_park.jpg',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'index.html',
  'lab/begin.js',
  'lab/start.js',
  'lab/storage.js',
  'log.html',
  'manifest.webmanifest',
  'src/core/park-ground.js',
  'src/core/release.js',
  'src/core/version.js',
  'src/ui/look3d.js',
  'src/ui/topple-scene.js',
  'src/ui/topple-sets.js',
  'src/ui/topple.js',
  'topple.html',
];
const HASHES = {
  '../css/bridges.css': 'c54b7427d75f',
  '../css/cards.css': 'fc31f485bb31',
  '../css/colour-sudoku.css': '8cc525c4a980',
  '../css/connect-four.css': 'be416b82fa36',
  '../css/count-to-9.css': 'f62e77d60b45',
  '../css/dots-boxes.css': '565df4f78941',
  '../css/five-dice-3d.css': 'be67ab96970b',
  '../css/five-dice.css': '907c29792d3f',
  '../css/follow-me.css': '915003b992f5',
  '../css/game.css': 'bcdaddbdcb96',
  '../css/hidden-faces.css': '19e295575eb0',
  '../css/laser-lab.css': '97c4abd780e9',
  '../css/log.css': 'f7f0c3922e0d',
  '../css/matching.css': 'fb387d9b1fc3',
  '../css/nim.css': '18e12295adb8',
  '../css/reversi.css': 'ae4a46ffe766',
  '../css/rock-paper-scissors.css': '706f9703cef4',
  '../css/site.css': '1fb57d9c9158',
  '../css/snakes-ladders.css': '559fbccb0dc8',
  '../css/tic-tac-toe.css': '975a84435d37',
  '../css/tin-can-alley.css': 'a3f45a5d6548',
  '../css/topple.css': '5a24ae5c7afa',
  '../data/topple/brick_wall_001_arm.jpg': 'aea26f8f725d',
  '../data/topple/brick_wall_001_col.jpg': '490af2950873',
  '../data/topple/brick_wall_001_nor.jpg': 'a1688a48e961',
  '../data/topple/brown_planks_09_arm.jpg': '54236a2ecffa',
  '../data/topple/brown_planks_09_col.jpg': 'ed5c4c238835',
  '../data/topple/brown_planks_09_nor.jpg': '1bb2614bb118',
  '../data/topple/cliff_side_arm.jpg': 'faa26475db4f',
  '../data/topple/cliff_side_col.jpg': '28f76b472580',
  '../data/topple/cliff_side_nor.jpg': 'e49e08d57cd2',
  '../data/topple/concrete_floor_worn_001_arm.jpg': '3ec9fb1bed63',
  '../data/topple/concrete_floor_worn_001_col.jpg': '0092c6976c8a',
  '../data/topple/concrete_floor_worn_001_nor.jpg': 'cd6a3d81e0a3',
  '../data/topple/corrugated_iron_02_arm.jpg': 'dc31f756c34b',
  '../data/topple/corrugated_iron_02_col.jpg': '8b8e8f1481b8',
  '../data/topple/corrugated_iron_02_nor.jpg': 'bbfa53b412aa',
  '../data/topple/gravel_concrete_col.jpg': '0cc40a4324a8',
  '../data/topple/gravel_concrete_nor.jpg': 'df37d264ee95',
  '../data/topple/gravel_concrete_rough.jpg': '4c7f43c80a54',
  '../data/topple/green_metal_rust_arm.jpg': 'ef05e05e048c',
  '../data/topple/green_metal_rust_col.jpg': 'b4e415dc4504',
  '../data/topple/green_metal_rust_nor.jpg': '806c86c7d423',
  '../data/topple/knotted_pine_bark_arm.jpg': 'c5e46eebd3c3',
  '../data/topple/knotted_pine_bark_col.jpg': '46fd3b1da9a1',
  '../data/topple/knotted_pine_bark_nor.jpg': 'e3210ad7524f',
  '../data/topple/rusty_metal_02_arm.jpg': 'fde5e692e38c',
  '../data/topple/rusty_metal_02_col.jpg': 'cfdea5e9e4b0',
  '../data/topple/rusty_metal_02_nor.jpg': '42258b9913a3',
  '../data/topple/sand_01_arm.jpg': '1c33e1f2d212',
  '../data/topple/sand_01_col.jpg': 'fa8691b39445',
  '../data/topple/sand_01_nor.jpg': 'd0424564200d',
  '../data/topple/sky_construction_yard.jpg': '1fa733d33fdd',
  '../data/topple/sky_goegap.jpg': '8e373a5fe65c',
  '../data/topple/sky_lago_disola.jpg': '45a782d4e17f',
  '../data/topple/snow_02_arm.jpg': '97f6bf0d9f0b',
  '../data/topple/snow_02_col.jpg': '5df33887d0ae',
  '../data/topple/snow_02_nor.jpg': 'fc63b46591a6',
  '../data/topple/weathered_brown_planks_arm.jpg': 'a8bb3092c24a',
  '../data/topple/weathered_brown_planks_col.jpg': '94dcbb3ee545',
  '../data/topple/weathered_brown_planks_nor.jpg': '65b497e9499f',
  '../data/topple/wooden_barrel_arm.jpg': '20853a069e87',
  '../data/topple/wooden_barrel_col.jpg': '6ec9f54487cb',
  '../data/topple/wooden_barrel_nor.jpg': '2ba85af76141',
  '../icons/home/topple.webp': '9779f778c732',
  '../src/core/appversion.js': '96c37eeaf764',
  '../src/core/bridges.js': '78eafe5fadc2',
  '../src/core/cannon-keys.js': 'e29b0c477b0c',
  '../src/core/colour-sudoku.js': '1f84d2058df2',
  '../src/core/connect-four.js': 'f219a6c7b589',
  '../src/core/count-to-9.js': '417f37361d87',
  '../src/core/dice3d.js': 'ebf46f49e40e',
  '../src/core/dots-boxes.js': '5a6221c43a7d',
  '../src/core/drawing.js': 'a9d7b3685388',
  '../src/core/fit.js': 'aa03ee79f27b',
  '../src/core/five-dice-best.js': '4643570b9243',
  '../src/core/five-dice.js': '1841bc98bc8f',
  '../src/core/fixed-step.js': '1c74bb8e2ef0',
  '../src/core/follow-me.js': 'b1303cc91da0',
  '../src/core/hidden-faces.js': 'fdc6231fabda',
  '../src/core/laser-lab.js': '21f6611784d5',
  '../src/core/log.js': '58f4132dcf06',
  '../src/core/matching.js': 'b95ececf7528',
  '../src/core/net.js': '01f93e039e36',
  '../src/core/nim.js': 'c948ce20355e',
  '../src/core/players.js': 'cdcbde55ab4c',
  '../src/core/release.js': 'ed112c190f5a',
  '../src/core/resume.js': 'f8feda70fba3',
  '../src/core/reversi.js': '5c1eff2f7729',
  '../src/core/rock-paper-scissors.js': '102269302158',
  '../src/core/showbox.js': '6856b6400bf2',
  '../src/core/snakes-ladders.js': 'ccc9b843ec89',
  '../src/core/speedtest.js': '7ac41aa7cfe0',
  '../src/core/stats.js': 'f5722e54aa29',
  '../src/core/tic-tac-toe.js': 'ad38a297a8dc',
  '../src/core/tin-can-alley-physics.js': 'dd91aad948b9',
  '../src/core/tin-can-alley.js': 'a997b9f1ef2f',
  '../src/core/topple-animals.js': '5fdf9e4a41c6',
  '../src/core/topple-blast-scenes.js': 'eab1f8e745ef',
  '../src/core/topple-blast.js': '472a66c7f411',
  '../src/core/topple-levels.js': '9844a8896e63',
  '../src/core/topple-moon-world.js': '0bda79003c86',
  '../src/core/topple-moon.js': '97dd1f0a9e3a',
  '../src/core/topple-movers.js': '536d4d28165f',
  '../src/core/topple-road.js': '727682928534',
  '../src/core/topple-sky.js': 'bbbc7bf24815',
  '../src/core/topple-tutorial.js': '44b11d757502',
  '../src/core/topple-world.js': '603c54b29e54',
  '../src/core/topple.js': '37c8c4c09d61',
  '../src/core/version.js': 'd63a4e90d8cd',
  '../src/ui/brboard.js': 'fb62b2682c7a',
  '../src/ui/bridges.js': '7385bf9ea2df',
  '../src/ui/cardback.js': 'c80f6be3a1b8',
  '../src/ui/colour-sudoku.js': 'e57410a5f042',
  '../src/ui/connect-four.js': '823e15764824',
  '../src/ui/count-to-9.js': 'c93a411fca3b',
  '../src/ui/csboard.js': '8f672dccad22',
  '../src/ui/dbboard.js': '090c25e54492',
  '../src/ui/debuglog.js': '2ea34e5d5620',
  '../src/ui/dots-boxes.js': 'a5b195ae9121',
  '../src/ui/drawcuts.js': 'efb5cae3a003',
  '../src/ui/drawwatch.js': '8635f60a4ace',
  '../src/ui/faces.js': '2bbbb90f0067',
  '../src/ui/fit.js': '217d454b3852',
  '../src/ui/five-dice-3d.js': 'c95a6f426862',
  '../src/ui/five-dice-game.js': 'bcf11d70f48a',
  '../src/ui/fivedice-pics.js': 'ac79c976019c',
  '../src/ui/fmpads.js': 'd1708ab26b3c',
  '../src/ui/follow-me.js': '8693ad71fc75',
  '../src/ui/hfboard.js': '829f1584722e',
  '../src/ui/hidden-faces.js': '4427af1b9ab5',
  '../src/ui/laser-lab.js': 'e3a640325093',
  '../src/ui/llboard.js': '80e92b39d129',
  '../src/ui/logpage.js': 'c7d1a6992d20',
  '../src/ui/matching.js': 'dafca809f4e3',
  '../src/ui/matchstick.js': '0c9866f4db0d',
  '../src/ui/net.js': '35e77272c525',
  '../src/ui/nim.js': 'c655030c3c10',
  '../src/ui/nozoom.js': '94f6360b227a',
  '../src/ui/numbercard.js': '026669d0b46e',
  '../src/ui/offline.js': '5ef815450d2b',
  '../src/ui/resume.js': 'cee2906a3304',
  '../src/ui/reversi.js': '266c55319149',
  '../src/ui/rock-paper-scissors.js': '0f28fffd2432',
  '../src/ui/rpspics.js': 'e15f095f1320',
  '../src/ui/rvboard.js': '80541178ebb9',
  '../src/ui/scrolllog.js': '61495b887fd7',
  '../src/ui/snakes-ladders.js': '7039f64b2a95',
  '../src/ui/snlart.js': 'd66bcd894886',
  '../src/ui/sound.js': '40930724f396',
  '../src/ui/sounds.js': 'ccbfc6cacead',
  '../src/ui/speedtest.js': 'd2cd6cdac3a8',
  '../src/ui/stats.js': 'e2a3adf0efec',
  '../src/ui/tcapics.js': '6ff8afd8c1f3',
  '../src/ui/tic-tac-toe.js': '00518955deac',
  '../src/ui/tin-can-alley-stall.js': '763a9240e8d5',
  '../src/ui/tin-can-alley.js': 'd370e0c6af65',
  '../src/ui/topple-blast-fx.js': 'c3ae157c254c',
  '../src/ui/topple-moon-looks.js': 'cef2734c636a',
  '../src/ui/topple-moon.js': '348ab526418e',
  '../src/ui/topple-scene.js': '76b123ed20bd',
  '../src/ui/topple-sets.js': 'a1d82d50536c',
  '../src/ui/topple.js': '263be15f3999',
  '../src/ui/topplepics.js': 'a064657b426e',
  '../src/ui/tray3d.js': 'b8a5722ce47e',
  '../src/vendor/cannon-es/LICENSE': '5122459e65eb',
  '../src/vendor/cannon-es/cannon-es.js': 'f0700cbd3a48',
  '../src/vendor/three/LICENSE': 'a70d6dc2d2a6',
  '../src/vendor/three/RoundedBoxGeometry.js': '04040241176e',
  '../src/vendor/three/three.module.min.js': '3e690ac7d180',
  'data/park/grass005_col.jpg': 'a921bf38229f',
  'data/park/grass005_nor.jpg': '9290c222d788',
  'data/park/grass005_rough.jpg': '09f5354328fe',
  'data/park/leaf.png': '4c9194446f7b',
  'data/park/sky_je_gray_park.jpg': '62b165acde67',
  'icons/apple-touch-icon.png': '48a7d266734d',
  'icons/icon-192.png': '42f2c87ad180',
  'icons/icon-512.png': '557113230560',
  'icons/icon.svg': 'c1d6df4e0698',
  'index.html': '9c8e632193ff',
  'lab/begin.js': 'cfba1bdae267',
  'lab/start.js': '57140b92aad6',
  'lab/storage.js': '0d2efcf2f431',
  'log.html': '600764928699',
  'manifest.webmanifest': '0f45c52de022',
  'src/core/park-ground.js': '99b1f1554881',
  'src/core/release.js': '0c39bd04fe1a',
  'src/ui/look3d.js': '6e362b7ebc83',
  'src/ui/topple-scene.js': '7b8ddd5624d8',
  'src/ui/topple-sets.js': '22c24362657f',
  'src/ui/topple.js': '9b4c9e0335fd',
  'topple.html': '31340bf7e209',
};
// ---- end ----

const PREFIX = 'topple-lab-';
const CACHE = PREFIX + VERSION;
const SCOPE = new URL(self.registration?.scope ?? './', self.location.href);
const FRESH_FIRST = self.location.hostname === 'localhost';

// The saved file for a request: the folder's address is its index.html;
// a ?query or #hash doesn't matter.
function savedKey(url) {
  const u = new URL(url);
  u.search = ''; u.hash = '';
  if (u.pathname.endsWith('/')) u.pathname += 'index.html';
  return u.href;
}

// Kept in each version's cache: its files' hashes and what its install did.
const RECORD = new URL('offline-record.json', SCOPE).href;
async function recordOf(cache) {
  try { return (await (await cache.match(RECORD))?.json()) ?? null; } catch { return null; }
}

// Copies into `cache` the files the newest older version saved with the
// same hash. Returns { kept: Set of files, from: that version or null }.
async function keepUnchanged(cache) {
  const kept = new Set();
  for (const name of (await caches.keys()).reverse()) {
    if (!name.startsWith(PREFIX) || name === CACHE) continue;
    const old = await caches.open(name);
    const rec = await recordOf(old);
    if (!rec?.hashes) continue;   // before 11.6, or an install that failed
    for (const f of FILES) {
      if (!HASHES[f] || rec.hashes[f] !== HASHES[f]) continue;
      const url = new URL(f, SCOPE).href, res = await old.match(url);
      if (res) { await cache.put(url, res); kept.add(f); }
    }
    return { kept, from: name.slice(PREFIX.length) };
  }
  return { kept, from: null };
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      const { kept, from } = await keepUnchanged(cache);
      const fresh = FILES.filter(f => !kept.has(f));
      await cache.addAll(fresh.map(f => new Request(new URL(f, SCOPE).href, { cache: 'reload' })));
      await cache.put(RECORD, new Response(JSON.stringify({ hashes: HASHES, kept: kept.size, fetched: fresh.length, from })));
    } catch (e) {
      await caches.delete(CACHE);
      throw e;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith(PREFIX) && k !== CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = () => cache.match(savedKey(req.url));
    if (FRESH_FIRST) {
      try { return await fetch(req); } catch (e) { return (await saved()) ?? Promise.reject(e); }
    }
    return (await saved()) ?? fetch(req);
  })());
});

// A page can ask which version is running (for its debug log, and the home
// page's version line).
self.addEventListener('message', event => {
  if (event.data !== 'version') return;
  event.waitUntil((async () => {
    const rec = await recordOf(await caches.open(CACHE));
    const install = rec && { kept: rec.kept, fetched: rec.fetched, from: rec.from };
    event.source?.postMessage({ release: RELEASE, version: VERSION, made: MADE, files: FILES.length, freshFirst: FRESH_FIRST, install });
  })());
});
