// Topple!'s page, style and screen code as files (no browser): what the
// developer agreed (DESIGN.md "Topple!"; 2026-11-10: the name, a setup
// screen as Tin Can Alley's, with the one-player games after it, one view
// from behind with the drag pad) is there, and the screen is
// wired to the site's log, game keeping, sound and stats. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PAGES } from '../src/core/resume.js';
import { toppleMini } from '../src/ui/topplepics.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('topple.html');
const css = await read('css/topple.css');
const js = await read('src/ui/topple.js');
const sceneJs = await read('src/ui/topple-scene.js');
const setsJs = await read('src/ui/topple-sets.js');
const core = await read('src/core/topple.js');
const setupHtml = page.match(/<section id="setup"[\s\S]*?<\/section>/)?.[0] ?? '';
const playHtml = page.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';

test('topple page: its name, the home tile after Tin Can Alley, kept one game at a time', async () => {
  assert.match(page, /<title>Topple!<\/title>/);
  assert.match(setupHtml, /<h1>Topple!<\/h1>/);
  assert.match(playHtml, /<div class="gname">Topple!<\/div>/);
  const home = await read('index.html');
  const one = home.match(/<section class="group" id="oneGroup"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(one, /id="tcaLink"[\s\S]*<a class="game" id="tpLink" href="topple.html">\s*<span class="pic shot" id="tpPic"[^>]*><img src="icons\/home\/topple\.webp"[^>]*><\/span>\s*Topple!\s*<\/a>/);
  assert.equal((toppleMini().match(/class="blk"/g) || []).length, 5, 'the rules picture\'s blocks');
  assert.ok(GAME_PAGES.includes('topple.html'), 'not one of the games kept one at a time');
  assert.match(js, /resumable\('topple', 1,/);
});

test('topple page: the setup screen: your face, Play! or Carry on where the game is, new scenes from the start', () => {
  assert.match(setupHtml, /<div class="faces" id="p1Faces"><\/div>/);
  assert.match(setupHtml, /id="playBtn">Play!<\/button>/);
  assert.match(setupHtml, /id="freshBtn" hidden>New scenes from scene 1<\/button>/);
  assert.match(js, /const setup = \{ p1: 'bear' \};/);
  assert.match(js, /\$\('playBtn'\)\.textContent = fresh \? 'Play!' : 'Carry on';/);
  assert.match(setupHtml, /Knock <b>every block<\/b> down with <b>5 balls<\/b>/);
});

test('topple page: no mockup choices left; no side view (developer, 2026-11-10, Q70: one view, from behind)', () => {
  assert.doesNotMatch(page + js + core, /mockup only|Skip scene|sideAim|Pull back|'pull'|sideFit|Which things/i, 'a mockup choice left');
  assert.doesNotMatch(page + js + core + css, /sideDrag|sideView|sideTarget|dotScaleFor|viewBtn|viewbtn|Side view|setView/, 'the side view left');
  assert.match(js, /const aimFor = \(dx, dy\) => \(current \? frontDrag\(dx, dy, parkSize\(\), current\.layout\.power\) : null\)/);
});

test('topple page: a device that can\'t show 3D is told so; three.js and cannon-es loaded with import()', () => {
  assert.match(setupHtml, /<div class="panel no3d" id="no3d" hidden>\s*<p>This phone or tablet can’t show the 3D park\.<\/p>/);
  assert.match(js, /await Promise\.all\(\[import\('\.\/topple-scene\.js'\), import\('\.\.\/core\/topple-world\.js'\)\]\)/);
  assert.doesNotMatch(js, /^import .*(topple-scene|topple-world|vendor)/m, 'loaded at the top: a failure would blank the page');
  assert.match(js, /el\.hidden = el\.id !== 'no3d'/);
  assert.match(sceneJs, /from '\.\.\/vendor\/three\/three\.module\.min\.js'/);
  assert.doesNotMatch(page + js + sceneJs, /https?:\/\/(?!github\.com|donpark2000\.goatcounter\.com)/, 'something loaded from another site');
});

test('topple page: the park: no double-tap zoom, the drag is pointer events, no page scroll; it fills the screen either way up', () => {
  assert.match(js, /canvas\.addEventListener\('touchend', e => e\.preventDefault\(\), \{ passive: false \}\)/);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.match(js, new RegExp(`addEventListener\\('${ev}'`), ev);
  assert.match(css, /\.park \{[^}]*touch-action: none/);
  const rule = sel => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.#]/g, m => `\\${m}`)} \\{([^}]*)\\}`))?.[1] ?? '';
  assert.match(rule('#play'), /position: fixed; inset: 0/);
  assert.match(rule('#play'), /grid-template-areas: "top top" "park park" "tally restart"/);
  const wide = css.match(/@media \(orientation: landscape\) \{([\s\S]*)\}\s*$/)?.[1] ?? '';
  assert.match(wide, /grid-template-areas: "home park" "name park" "tally park" "restart park" "\. park" "sound park"/);
  assert.match(css, /body\.tp-playing \.site-foot \{ display: none; \}/);
  assert.match(css, /\.park canvas \{ position: absolute; inset: 0;/);
  assert.match(js, /new ResizeObserver\(fit\)\.observe\(\$\('park'\)\)/);
});

test('topple page: the level\'s jewels and the hearts over the park; Start again asks and costs a heart', () => {
  assert.match(playHtml, /id="hudLevel"/);
  assert.match(playHtml, /id="hudHearts"/);
  // the level's name with its number (developer, 2026-11-12), the jewels under it when there's no room
  assert.match(playHtml, /id="hudLevel"[^>]*><span class="hudname" id="hudLevelName"><\/span><span class="jewels" id="hudJewels"><\/span>/);
  assert.match(js, /\$\('hudLevelName'\)\.textContent = `\$\{g\.level\} · \$\{name\}`/);
  assert.match(css, /\.hudlevel \{[^}]*flex-wrap: wrap/);
  assert.match(playHtml, /<div class="over" id="ask" hidden>[\s\S]*Start this scene again\? You lose a ❤️/);
  assert.match(js, /\$\('restartYes'\)\.onclick = \(\) => \{[\s\S]*?sceneOver\(game, false\)/);
});

test('topple page: a new level never shows the old one (the canvas hidden until drawn); cleared only once the shards and spray are down too', () => {
  // hidden as the play screen opens on a level not drawn yet, and as the setting changes
  assert.match(js, /function showPlay\(\) \{[\s\S]*?if \(!current \|\| stage\.level !== game\.level\) hideCanvas\(true\);[\s\S]*?\n\}/);
  assert.match(js, /if \(stage\.level !== game\.level\) \{\s*hideCanvas\(true\);\s*const r = await stage\.setLevel/);
  // shown only after the new scene is drawn
  assert.match(js, /stage\.setScene\(current\.parts\);[\s\S]*?stage\.render\(\);\s*hideCanvas\(false\);/);
  // still: the blocks and the effects; the effects move on every step, drawn or not
  assert.match(js, /stage\.tick\(dt\);\s*const still = world\.still\(\), fx = stage\.fxLive;\s*const \{ downChanged, ended: result \} = update\(round, dt, \{ down, still: still && fx === 0 \}\)/);
  assert.match(sceneJs, /get fxLive\(\) \{ return set\?\.fxLive\?\.\(\) \?\? 0; \}/);
});

test('topple page: the game kept on the device for every visit, the scene under way for this one', () => {
  assert.match(js, /export const GAME_KEY = 'web-games-topple-game';/);
  assert.doesNotMatch(js, /GAME_KEY = 'web-games-resume-/, 'a key the old-games cleanup removes');
  assert.match(js, /readGame\(JSON\.parse\(storage\?\.getItem\(GAME_KEY\)/);
  // a level opened as the game is read (one finished in 10.0, which had four): in the log
  assert.match(js, /if \(game && game\.reached > was\) L\('level opened: the one after a level done'/);
  // kept as each scene ends, before its card shows
  assert.match(js, /const outcome = sceneOver\(game, result\.won\)[,;][\s\S]*?saveGame\(\);[\s\S]*?showEnd\(\);/);
});

test('topple page: logged: 3D start, the fit, each scene, throw, touch, block down (and a post up again), the end', () => {
  for (const what of ["'3D started'", "'fit'", "kept ? 'scene picked up again' : 'scene'", "'layout thrown away'", "'throw'", "'ball touched'", "'block down'", "'block up again: a post leaning, not lying'", "'blocks down'", "'scene over'", "'start again: yes, a heart lost'", "'no 3D: told this device can’t show it'", "'resumed'", "'the game on this device'"]) {
    assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  }
  assert.match(js, /startLog\('topple'\)/);
});

// The drag pad (journal, "9.2 on the phone; home pictures and aiming", Q67).
test('topple page: the drag pad and its show: over the park, the touch going through to it, placed by padSpot; where a drag starts logged', () => {
  assert.match(playHtml, /<div class="pad" id="pad" aria-hidden="true" hidden><span>👆<\/span><\/div>/);
  assert.match(playHtml, /<div class="ghost" id="ghost" aria-hidden="true" hidden>👆<\/div>/);
  assert.match(playHtml, /id="hint"[^>]*>Drag from 👆, then let go<\/p>/);
  assert.match(js, /const HINT = 'Drag from 👆, then let go'/);
  for (const sel of ['.pad', '.ghost']) {
    const rule = css.match(new RegExp('\\n\\' + sel + ' \\{[^}]*\\}'))?.[0] ?? '';
    assert.match(rule, /pointer-events: none/, `${sel} would take the touch from the park`);
  }
  assert.match(js, /pad = padSpot\(box\.width, box\.height\)/);
  // a throw starts only on the pad: a press elsewhere makes it pulse, and is logged
  assert.match(js, /const p = padPress\(e\.clientX - box\.left, e\.clientY - box\.top, pad, ballPx\(\)\);\s*if \(!p\.on\) \{\s*L\('press off the pad', \{ from: p\.from, offPx: p\.offPx,[^\n]*\n\s*pulsePad\(\);\s*return;/);
  assert.match(css, /\n\.pad\.pulse \{ animation: tp-pad-pulse [^}]*\}/);
  assert.match(css, /@keyframes tp-pad-pulse/);
  assert.doesNotMatch(js + css, /\.wait\b|'wait'/, 'the pad never goes faint (it\'s the one control)');
  // no press, no dots: a mouse moving over the park only follows a drag
  assert.match(js, /function onMove\(e\) \{\s*if \(drag && e\.pointerId === drag\.id\) \{ drag\.x = e\.clientX; drag\.y = e\.clientY; \}\s*\}/);
  assert.match(js, /const dragNow = \(\) => \(drag \? /);
  assert.match(js, /const d = dragNow\(\) \?\? \(ok \? demoFrame\(\) : null\);/, 'the dots come from a drag or the show, nothing else');
  // the show runs on the clock, stops at a press on the pad, and aims at a block
  assert.match(js, /demo\.t = \(performance\.now\(\) - demo\.t0\) \/ 1000/);
  assert.match(js, /pulsePad\(\);\s*return;\s*\}\s*stopDemo\('a finger'\);/);
  assert.match(js, /if \(first === 'block'\)/);
  for (const what of ["'pad show'", "'pad show done'", "'pad show stopped'", "'drag too short: no throw'", "'press off the pad'"]) {
    assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  }
});

// Developer, 2026-11-12 (Q80): "Just 'balls left' (and draw the balls as
// they appear in the scene)"; no count of blocks down.
test('topple page: the score bar is your face and the balls left, drawn as the level\'s ball', () => {
  assert.doesNotMatch(playHtml, /downN|downWho|of \d+ down/);
  assert.match(playHtml, /<span class="balls" id="balls" role="img" aria-label="5 balls left"><\/span>\s*<span class="who">balls left<\/span>/);
  assert.match(js, /\$\('balls'\)\.classList\.toggle\('iron', levelInfo\(current\?\.id\.level \?\? game\.level\)\.ball === 'iron'\)/);
  assert.match(css, /\.balls\.iron i \{[^}]*radial-gradient/);
  assert.match(css, /\.balls i\.used, \.balls\.iron i\.used \{[^}]*outline: 2px dashed/);
});

// Developer, 2026-11-12 (Q81): after a level, the map: the next level
// unlocking, your face walking there; started from the map.
test('topple page: a level done shows the map, the next level unlocking and your face walking there; Play starts it', () => {
  assert.match(setupHtml, /<button type="button" class="big" id="mapGo" hidden>Play ▸<\/button>/);
  // the end card's button: the map and the walk (not the next level's screen)
  assert.match(js, /if \(o === 'level'\) \{\s*const walk = \{ from: game\.level - 1, to: game\.level, unlock: !!ended\.unlocked \};[\s\S]*?showMap\(walk\);/);
  assert.match(js, /unlocked: game\.reached > was\.reached/);
  // the walk: shake, the lock pops, the face along the road (roadAt), the dots behind it (roadTo), then Play
  for (const what of ["node.classList.add('shake')", "<span class=\"lock pop\">🔒</span>", 'placeFace(roadAt(P, e))', "fill.setAttribute('d', e > 0 ? roadPath(roadTo(P, e)) : '')", "$('mapGo').hidden = false"]) assert.ok(js.includes(what), `the walk lacks ${what}`);
  assert.match(js, /\$\('mapGo'\)\.onclick = \(\) => \{ if \(arrived\) startLevel\(arrived\); \};/);
  // reduced motion: all at once
  assert.match(js, /const quick = matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches;/);
  // logged
  for (const what of ["'map: the walk'", "'map: unlocked'", "'map: arrived'"]) assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  // your face on the map, not the "You" label
  assert.doesNotMatch(js, /class="you"/);
  assert.match(css, /\.mapface \{ position: absolute;/);
});

// Developer, 2026-11-12 (Q90): "I have to "start" 3 times before
// starting": a level on the map starts it, no Level screen.
test('topple page: a level on the map goes straight into play; no Level screen', () => {
  assert.doesNotMatch(page, /id="levelView"|id="lvGo"|class="panel lvcard"/);
  assert.doesNotMatch(js, /showLevelCard|\$\('lv[A-Z]/);
  assert.doesNotMatch(css, /\.lvcard|tp-level/);
  // a level open: logged and started (locked ones still shake)
  assert.match(js, /L\('map: a level, straight into play', \{[^}]*\}\);\s*startLevel\(lv\);\s*\};/);
  assert.match(js, /if \(!isOpen\(game, lv\)\) \{[\s\S]*?\$\('mapToast'\)\.textContent = `Finish level \$\{lv - 1\} first`;/);
});

// Developer, 2026-11-12 (Q92): "no way to start the whole game over with
// no memory of levels ... locking everything but level 1".
test('topple page: Start over from level 1 asks first, then a new game with only level 1 open', () => {
  assert.match(setupHtml, /<button type="button" class="pill" id="overBtn" hidden>Start over from level 1<\/button>/);
  assert.match(setupHtml, /<div class="overask" id="overAsk" role="dialog" aria-labelledby="overAskTitle" hidden>\s*<p id="overAskTitle">Start over from level 1\? The other levels lock again\.<\/p>\s*<button type="button" class="pill primary" id="overYes">Yes<\/button>\s*<button type="button" class="pill" id="overNo">No<\/button>/);
  // shown only once another level is open; the question hidden behind the map
  assert.match(js, /\$\('overBtn'\)\.hidden = game\.reached <= 1 \|\| !\$\('overAsk'\)\.hidden;/);
  assert.match(js, /if \(v !== 'faces'\) \$\('overAsk'\)\.hidden = true;/);
  // Yes: a new game keeping nothing (New scenes keeps the levels: createGame(newSeed(), game))
  assert.match(js, /\$\('overYes'\)\.onclick = \(\) => \{[\s\S]*?game = createGame\(newSeed\(\)\);[\s\S]*?saveGame\(\);/);
  assert.match(js, /\$\('freshBtn'\)\.onclick = \(\) => \{[\s\S]*?game = createGame\(newSeed\(\), game\);/);
  for (const what of ["'start over: asked'", "'start over: no'", "'start over: a new game, level 1 only'"]) assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
});

// Developer, 2026-11-12: "there seems to be no way to get to the map";
// Start again was cut off and did nothing (before the first ball).
test('topple page: a Map button on the play screen keeps the scene; Start again shows only once it can be used', () => {
  assert.match(playHtml, /<div class="restart">\s*<button type="button" class="pill" id="restartBtn"><span class="ic" aria-hidden="true">↺<\/span> <span>Start again<\/span><\/button>\s*<button type="button" class="pill" id="mapBtn"><span class="ic" aria-hidden="true">🗺️<\/span> <span>Map<\/span><\/button>/);
  assert.match(js, /\$\('restartBtn'\)\.classList\.toggle\('notyet', \$\('restartBtn'\)\.disabled\);/);
  assert.match(css, /\.restart \.pill\.notyet \{ visibility: hidden; \}/);
  // the map from a scene: parked, and carried on when it's played again
  assert.match(js, /\$\('mapBtn'\)\.onclick = \(\) => \{[\s\S]*?parked = current && !ended \? \{ id: current\.id, layout: current\.layout, settled \} : null;[\s\S]*?showMap\(\);/);
  assert.match(js, /if \(!kept && parked && JSON\.stringify\(parked\.id\) === JSON\.stringify\(sceneId\(\)\)\) \{ kept = parked;/);
  assert.ok(js.includes("L('map from the scene'"), 'not logged');
});

// Developer, 2026-11-12: the snow on the rock didn't look like snow ("just
// make it a rock"); the animals "less active and more subtle ... hopped
// across a scene once".
test('topple page: level 3\'s rock is plain; each animal crosses once a scene, from out of sight to out of sight', () => {
  assert.doesNotMatch(setsJs, /snowCapGeo/);
  assert.match(setsJs, /rock\(p\) \{[\s\S]*?mesh\(boulderGeo\(p\.seed\), photoMat\(maps\.concrete/);
  // no animal roams back and forth any more
  assert.doesNotMatch(setsJs, /function roamer/);
  for (const a of ['snake', 'rat', 'bunny', 'birds']) assert.match(setsJs, new RegExp(String.raw`function ${a}\(group\) \{[\s\S]*?crossing\(\d+,`), `${a}: not a crossing`);
  // a new scene: each crosses again; the view's edges from the scene's camera
  assert.match(setsJs, /out\.newScene = edges => \{ for \(const d of decor\) d\.reset\?\.\(edges\); \};/);
  assert.match(sceneJs, /if \(set\) set\.newScene\?\.\(viewEdges\); else parkBirds\.reset\(viewEdges\);/);
});

// Developer, 2026-11-12: "it would be cool if the animals 'acted
// frightened' when blocks fall and reverse direction and run off" (the
// walk itself: tests/topple-animals.test.js).
test('topple page: every animal takes fright when a block falls; logged', () => {
  assert.match(setsJs, /import \{ crossing, perched \} from '\.\.\/core\/topple-animals\.js';/);
  assert.doesNotMatch(setsJs, /^function crossing/m, 'a second copy of the walk');
  for (const a of ['snake', 'rat', 'bunny', 'birds']) {
    const body = setsJs.match(new RegExp(String.raw`function ${a}\(group\) \{[\s\S]*?\n\}`))?.[0] ?? '';
    assert.match(body, /fright: x => go\.fright\(x\)/, `${a}: no fright`);
    assert.match(body, /go\.advance\([^;]*go\.pace|hop \+= dt \* go\.pace/, `${a}: not faster running off`);
  }
  assert.match(setsJs, /out\.fright = x => decor\.map\(d => d\.fright\?\.\(x\)\)\.filter\(Boolean\);/);
  assert.match(sceneJs, /fright\(x\) \{ return set \? set\.fright\(x\) : \[parkBirds\.fright\(x\)\]\.filter\(Boolean\); \}/);
  // a block falling, or shattering / bursting (ice down first by shattering: seen in the browser)
  assert.match(js, /const fx0 = fell\[0\]\?\.body\.position\.x \?\? broke\[0\]\?\.at\[0\];/);
  assert.match(js, /if \(fx0 !== undefined\) \{ const scared = stage\.fright\(fx0\); if \(scared\.length\) L\('animal frightened'/);
});

// Star Light (developer, 2026-11-12, Q87: night, a moon and stars, blocks
// and balls that glow, shards their colour, an owl that says "who" once in
// a while, or a cloud passing the moon, not frightened: "both"). The owl's
// sitting, hooting and flying off: tests/topple-animals.test.js; the look:
// seen in the browser (journal).
test('topple page: Star Light: the night sky, glowing blocks and ball, coloured shards, the owl and the cloud; on the map', async () => {
  // level 3's photo made night (no new download); the night's own lights; no sky light on the shiny parts
  assert.match(setsJs, /5: \{ name: 'night', sky: 'lago_disola', night: true,/);
  assert.match(setsJs, /if \(S\.night\) \{ night = nightSky\(skyTex\.image\); bg = night\.tex; \}/);
  assert.match(setsJs, /environment: S\.night \? null : env/);
  assert.match(sceneJs, /const li = set\?\.lights;/);
  // each glowing block a halo and its colour; the light among them dims as they break
  assert.match(setsJs, /out\.decorate = \(m, b\) => \{ if \(b\.mat === 'glow'\) m\.add\(halo\(b\.c,/);
  assert.match(sceneJs, /set\?\.decorate\?\.\(m, b, i\);/);
  assert.match(sceneJs, /set\?\.placed\?\.\(blockMeshes, parts\);/);
  assert.match(setsJs, /glowLight\.intensity = lit\.length \? 7 \* on \/ lit\.length : 0;/);
  // the ball glows, no lifting ring
  assert.match(setsJs, /out\.ballRing = false;/);
  assert.match(sceneJs, /if \(set\?\.ballRing === false\) return m;/);
  // shards the block's colour
  assert.match(setsJs, /if \(b\.mat === 'ice' \|\| b\.mat === 'glow'\)/);
  assert.match(setsJs, /sparks\.setColorAt\(nk\+\+, spark\.set\(e\.c\)\)/);
  // the moon and the cloud (no fright); the owl a perched(), with a fright and its hoot through the page's sound
  const skyFn = setsJs.match(/function sky\(group, camera, night, covers\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.ok(skyFn, 'no sky()');
  assert.doesNotMatch(skyFn, /fright/, 'the cloud takes fright');
  // behind the photo's land (developer, 2026-11-12: they showed in front of the mountains): a mask
  // from the skyline writes depth only, nearer than the moon and cloud, inside the camera's far plane
  assert.match(setsJs, /const MASK_R = 150, CLOUD_D = 153, MOON_D = 156;/);
  assert.match(sceneJs, /new THREE\.PerspectiveCamera\(50, 0\.75, 0\.05, 160\)/, 'the far plane moved: check MOON_D');
  assert.match(skyFn, /colorWrite: false, depthWrite: true/);
  assert.match(skyFn, /if \(1\.0 - v < texture2D\(line, vec2\(u, 0\.5\)\)\.r\) discard;/);
  assert.match(setsJs, /rows: sm, H,/);
  // the moon where the view shows sky, below the level's name and hearts; worked out again when the view changes
  assert.match(skyFn, /spot = moonSpot\(skyline\(\), \{ x: MOON\.r \/ camera\.aspect, y: MOON\.r \}, \{ covers: cv \}\)/);
  assert.match(skyFn, /camera\.fov, camera\.aspect\]/);
  assert.match(sceneJs, /querySelectorAll\('\.hudpill'\)/);
  assert.match(await read('topple.html'), /class="hudpill hudlevel"[\s\S]*class="hudpill"/);
  // the cloud from cloudAt (a fifth of the speed), a wisp, not puffs
  assert.match(skyFn, /const c = cloudAt\(t\);/);
  assert.doesNotMatch(setsJs, /for \(let i = 0; i < 26; i\+\+\)/, 'the puffs are back');
  // the moon's place in the log at each scene's end
  assert.match(js, /moon: stage\.animals\?\.\(\)\.find\(a => a\.moon\)\?\.moon \}\);/);
  const owlFn = setsJs.match(/function owl\(group, bark, sound\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(owlFn, /const go = perched\(\d+\);/);
  assert.match(owlFn, /fright: x => go\.fright\(x\)/);
  assert.match(owlFn, /if \(go\.tick\(dt\)\) \{ hoot = 1; sound\('hoot'\); \}/);
  assert.match(setsJs, /decor\.push\(sky\(group, ctx\.camera, night, ctx\.covers \?\? \(\(\) => \[\]\)\)\);/);
  assert.match(sceneJs, /makeSetting\(n, \{ renderer, leafy, LEAF, camera, covers: hudCovers, sound: name => onSound\?\.\(name\) \}\)/);
  assert.match(js, /stage\.onSound = name => \{ if \(!SET_SOUND\[name\] \|\| !playing\) return; sound\.play\(SET_SOUND\[name\], 0, \{ quiet: true \}\); L\('owl hoots'/);
  assert.match(js, /glow: 'chime' \}/);
  // its picture on the map; the map tall enough for five
  assert.match(js, /5: \{ pic: \(\) => '🌙'/);
  assert.match(await read('css/topple.css'), /\.mapbox \{[^}]*height: min\(86vh, 700px\)/);
});
