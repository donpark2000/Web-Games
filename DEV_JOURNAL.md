# Dev journal

A running record of decisions, findings, and open questions, newest at the
bottom. Findings record **evidence**: what was tested, what was observed,
and what it does and doesn't prove.

## Open questions

- **Q5. Is the Count to 9 robot too strong?** *Raised 2026-10-04 (entry
  "Count to 9 built").* The developer, after playing it on the live site:
  "The game play looks good. I think robot is a little too good. But
  Maybe I'm just too bad." It remembers each card it sees with chance
  `ROBOT_TUNING.remember` = 0.6 (`src/core/count-to-9.js`); the
  simulation table in that entry puts 0.4 at a child win rate of 38%
  (child remembering 30%) / 69% (60%) in easy mode, against 19% / 52% at
  0.6. To settle: the grandkids' games, or the developer's choice of 0.4.

## Resolved

- **Q1. Playing each other on separate devices.** *Raised 2026-10-04
  (entry "Kickoff decisions").* The developer: "it might be cool" for the
  kids to play each other in the same game on their own devices, but not
  the most important feature. GitHub Pages only serves files; it can't
  pass moves between two devices. It needs a go-between: a service we run,
  or a free outside one (e.g. a WebRTC signalling service), plus a "join
  code" step for the kids. An outside service conflicts with "nothing
  loaded from other sites" (`DESIGN.md`). Parked as a later phase; the
  tic-tac-toe rules are to be written so it can be added without
  rewriting them. **Parking confirmed** (developer, 2026-10-04); stays
  open as a later phase.
  **Dropped 2026-10-04** (developer): "Since I can't do the 'playing
  together on separate devices' with github hosting, I'm going to forget
  that for now." No longer planned.

- **Q4. Why the 🏠 button and the "aww" face didn't show on the
  developer's device.** *Raised 2026-10-04 (entry "Matching cards built;
  footer, 🏠, aww fixes").* The developer, on the live site: the 🏠 "did
  not change size" and the loser's sad face "did not show up". Locally,
  the same code measured 🏠 = 108 px = a grid square and the aww face
  present. Likely causes: (1) the browser's saved copy: the site was
  published at 21:31 UTC and GitHub Pages lets browsers reuse files for
  10 minutes (`Cache-Control: max-age=600`, checked with curl); (2) the
  aww face lasted only 2.8 s (now kept until the next round). Not
  confirmed: the device and the time of the test aren't known.
  **Resolved 2026-10-04:** after the publish of `bad3c7a`, the developer
  checked on their device: "Its all looking good" (the 🏠 size, the aww
  face, the footer and matching cards). The first cause (an old saved
  copy) can't be proven after the fact; the aww face now stays until the
  next round either way.

- **Q3. Copyright footer: exact wording.** *Raised 2026-10-04 (entry
  "Tic-tac-toe done").* The developer wants a small footer with their
  copyright notice on every screen ("no need to do it now"). To confirm:
  the wording, e.g. "© 2026 Donald Parker" (the git author name), and
  whether to add "Free software: GPL-3.0" with a link to the source.
  **Resolved 2026-10-04:** "© 2026 Donald Parker · Free software under
  the GPL-3.0 · Source code", "Source code" linking to the GitHub repo
  (the developer chose this option). On every page.
- **Q2. Licence.** *Raised 2026-10-04.* The repo was public with no
  licence. **Resolved 2026-10-04:** GPL-3.0, same as GP-200 Patch Manager
  Web (developer: "gpl 3 is fine"). `LICENSE` copied from that repo
  (the standard GPL-3.0 text, 674 lines).

## 2026-10-04: Kickoff decisions

The session started in the GP-200 Patch Manager Web repo by mistake; it
was moved to this folder (`C:\Users\dpark\Documents\Web-Games`, empty,
made that morning). Nothing in the GP-200 repo was changed.

**The developer's idea:** simple web games for their grandkids, a
tic-tac-toe game and a "find matching cards" game, both reached from the
same home page.

**Answers to the kickoff questions** (developer, 2026-10-04):
- Ages: **5-7** (early readers).
- Devices: **tablet (iPad/Android) and phone**.
- Tic-tac-toe: **two players on one device** and **against the
  computer**; playing each other on their own devices would be nice but
  isn't the most important feature (Q1).
- Repo: **public, hosted on GitHub Pages**, like GP-200 Patch Manager
  Web.

**Proposed by Claude, not objected to** (recorded in `DESIGN.md`; open to
change when the developer gives more details):
- Same setup as GP-200 Patch Manager Web: plain JavaScript, no build
  step, rules in `src/core/` tested under Node, a `?dev` debug log, and
  the same project files. Reason: the developer already knows this way of
  working, and it fits a small static site.
- Nothing loaded from other sites; no ads, tracking or sign-in.
- Tic-tac-toe computer: an easy setting that makes mistakes on purpose,
  and a harder one.
- Matching cards: single player, emoji pictures (no licensing), 6/8/10
  pairs, a move counter, no timer.
- Sound effects with a mute button, off by default until the developer
  has heard them.

**Repo set up** (developer's OK, 2026-10-04): `git init` here, public
repo `donpark2000/Web-Games` created and pushed. GitHub Pages not turned
on yet; that is the publish step, done with the developer's OK.

**Next:** the developer gives more details before building starts.

## 2026-10-04: Licence; separate-device play stays parked

The developer: GPL-3.0 is fine (Q2 resolved; `LICENSE` added, README and
`DESIGN.md` say so), and parking play on separate devices is fine (Q1
stays open as a later phase).

## 2026-10-04: Tic-tac-toe: the developer's details; mockup v1

**The developer's details** (2026-10-04), before any building:
- **Avatars instead of X and O:** each player picks a cartoon-like face
  (people or animals) from a list; the face fills each square they take.
- **Win:** no line through the winning squares. The squares that didn't
  win are blurred out (both players'), and the 3 winning squares are
  highlighted.
- **Against the computer:** its avatar is preselected, a little robot
  face.
- **Setup ("new game") screen:** choose "Player vs Computer" or "Two
  players", or maybe just pick two avatars, where picking the robot means
  a one-player game (the developer left this open).
- **Who goes first** is chosen on the setup screen: take turns each
  round, winner goes first, or loser goes first.
- **Game screen controls:** "New game" (back to the setup screen) and
  "Play again" (same avatars, the grid clears).
- **Scorecard below the grid:** games won per avatar; starts at 0-0 on a
  new game.
- **The computer must be beatable:** "not too aggressive".
- Review screen mockups before building.

**Mockup v1** (private Claude artifact, throwaway; nothing in the repo),
clickable on a phone-width page. It shows both setup ideas for the
developer to compare: **A** "Who's playing?" first (Me and the robot / Two
players; the robot is preselected), and **B** just two face pickers, the
robot first in Player 2's list. Claude's proposals in it, for review:
- 18 emoji faces (14 animals, girl, boy, grandma, grandpa); the robot
  only for the computer. A face the other player has is greyed out.
- Each player's squares are tinted their colour (orange / blue), so two
  similar faces still read apart.
- "<face>'s turn" above the grid; the scorecard also outlines whose turn
  it is. A tie gets a "Ties" count between the two scores.
- The robot waits 0.8 s ("is thinking..."), takes a win 75% of the time,
  blocks 55%, likes the centre, otherwise plays at random. One level.
- After a tie, the other player starts the next round (all three
  first-player rules). The first round: player 1 (the child, against the
  robot).
- "Play again" mid-round restarts the round without scoring it; "New
  game" keeps the last picks on the setup screen; scores reset on Play.

## 2026-10-04: Tic-tac-toe mockup v2: setup A, drawn faces

**Developer's review of v1** (2026-10-04):
- **Setup A** ("Who's playing?" first) chosen over B.
- Two players can never pick the same face. (v1 already greyed out the
  other player's face; it becomes a rule in `src/core/` with a test.)
- The score tiles looked too much like the grid; wants clear separation
  between grid, scorecard and the buttons at the bottom.
- "I really like everything else."
- **New idea:** each face has a normal and a smiling version. Picking a
  face and playing show the normal one; when someone wins, the winning
  squares show that face's smiling version.

**Why drawn faces, not emoji:** emoji have no smiling version of most
animals (only cats have one: 😺 😸), and they look different on iPad,
Android and Windows. So v2 draws its own faces as small SVG pictures,
built from shared parts (eyes, mouth, cheeks) so each face gets a normal
and a winner version cheaply: normal = round eyes, small smile; winner =
closed happy eyes, open grin, rosy cheeks. The loser keeps the normal
face (nobody looks sad). 16 faces (bear, cat, dog, bunny, fox, panda,
pig, frog, lion, mouse, monkey, chick, girl, boy, grandma, grandpa) plus
the robot.

**Mockup v2** (same private artifact, version 2): setup A only; the drawn
faces in the pickers, the grid and the "wins!" line; a dark, flat
scoreboard strip under the grid (unlike the white raised squares), more
space above it; outlined pill-shaped buttons at the bottom; a mockup-only
"Show all faces" panel to review every face in both versions.

**Not checked by Claude:** how the faces look. The built-in browser
needs a claude.ai sign-in to open the artifact, and its local preview
started the GP-200 project's server instead (the desktop app still tied
the preview to that project); stopped at once, nothing changed there.
Only a syntax check of the mockup's script was run. The developer
reviews the faces.

## 2026-10-04: Faces approved; status (start here next session)

**Faces:** a faces-only page, [Tic-Tac-Toe Faces](https://claude.ai/artifact/DizY1LaW5xgCiXzBbfWxaa)
(private artifact), shows all 17 faces, normal beside winner. The
developer: "Brilliant." The two winner faces they tried in the mockup
"look great". Agreed design now in `DESIGN.md`, "Tic-tac-toe".

**Known:**
- Repo `donpark2000/Web-Games` (public, GPL-3.0), branch `main`, pushed.
  Docs only; no code, no tests yet. GitHub Pages not turned on.
- Tic-tac-toe design agreed (mockup v2:
  [Tic-Tac-Toe Mockup](https://claude.ai/artifact/Y4LgG7JDqk9KBzH3wngEWY)).
- **The face drawings and the mockup's code live only in those two
  artifacts** (the session's scratchpad is temporary). To reuse them,
  read the artifact (Artifact tool, `action: "read"`): the faces are the
  `FACES`/`ROBOT` functions and the `eyes`/`mouth`/`cheeks` helpers in
  its script. Port them into the repo as the real drawings.
- Matching cards: only the kickoff decisions; the developer may have
  more details.
- Work happens on branches from here; `main` is the publish branch once
  Pages is on (`CLAUDE.md`).

**Next:** the developer chooses: give matching-cards details (and a
mockup) first, or build tic-tac-toe. Build plan when it starts (on a
branch): site skeleton (home page with a button per game, `?dev` log,
`npm test` with Node's test runner); `src/core/` tic-tac-toe rules
(winner/tie, the three first-player rules, no shared face, the robot
with an injectable random source so tests are repeatable); the faces
ported from the artifact; the screens from mockup v2; check on the
developer's tablet and phone.

**Note for the next session:** the desktop app's preview tool started the
GP-200 project's server from this session (the session began in that
repo). In a fresh session started in `Web-Games` this should not happen;
a `.claude/launch.json` here is needed before `preview_start`.

## 2026-10-04: Tic-tac-toe built; status (start here next session)

The developer asked to see the UI on localhost. Nothing in the repo could
run yet (the UI was only the mockup artifact), so tic-tac-toe was built,
on branch `tic-tac-toe`. The developer prefers finishing one game before
starting the next, so matching cards waits.

**What was built:**
- `index.html`: home page, a big picture button per game (matching cards
  shows "Coming soon").
- `tic-tac-toe.html` + `src/ui/tic-tac-toe.js` + `css/`: the setup and
  play screens from mockup v2, same look.
- `src/core/tic-tac-toe.js`: the rules (win/tie, the three first-player
  rules, no shared face, Play again unscored mid-round, the robot with an
  injectable random source). No DOM code.
- `src/ui/faces.js`: the 17 faces ported unchanged from the faces
  artifact (mood renamed 'happy' -> 'winner').
- `src/core/log.js` + `src/ui/debuglog.js`: the `?dev` panel (Save log,
  Clear, Hide), with browser/device details in the saved file; uncaught
  errors are logged. Links keep `?dev`.
- `tools/serve.js`: a no-package local server, port 8123, localhost only,
  refuses paths outside the repo, no caching.
- `npm test`: Node's test runner over `tests/*.test.js`.

**Claude's additions beyond the mockup** (for the developer to OK):
- A 🏠 button on the setup screen, back to the home page (the mockup had
  no way back).
- The robot's pending move is cancelled by "Play again" / "New game". In
  the mockup, pressing "Play again" while the robot was thinking let the
  old move land on the new grid.

**Evidence:**
- `npm test`: 31 tests, 31 pass (faces 4, log 5, server 5, rules 17).
- Each check can fail: 7 deliberately broken copies of the code (in a
  temp folder) were each caught: tie not swapping the starter, a wrong
  diagonal, same face allowed, an unbeatable robot (always wins/blocks),
  the server's folder guard removed, winner faces lost, the log cap
  removed.
- Robot strength, 1000 seeded games against a careful player (always
  wins, blocks, takes the centre), starts alternating: person 557, robot
  80, ties 363. The test asks for person > 300 and robot > 20.
- Clicked through in the built-in browser at phone size (375x812), with
  `?dev`: home -> tic-tac-toe; against the robot to a tie (Ties 1, robot
  starts next, as "Take turns" says); "Play again" pressed twice fast
  while the robot was thinking: the log shows "robot move cancelled" and
  exactly one robot move on the new grid; two players: "Play!" grey with
  "Player 2 needs a face.", the bear greyed in player 2's list; player 1
  won the top row: winner faces on the 3 squares, the rest blurred,
  1-0, next starter the cat. No console errors.
- **Found and fixed:** the floating debug panel covered the bottom of the
  page; a tap meant for "Play!" hit "Save log". The panel now reserves
  its height under the page. (The saved file did not land in Downloads;
  the built-in browser kept it.)
- **Not checked:** a real iPad, iPhone or Android; Safari. That needs the
  developer's devices (and the site on GitHub Pages or the LAN).

**Tooling notes:** `preview_start` with this repo's `launch.json` again
started the GP-200 project's server (port 8000; the session began in that
repo); stopped at once, it only showed the GP-200 start page. The
Terminal panel failed too (its shell integration file is missing). The
server was run as a background process instead and opened by URL.

**Next:** the developer tries it (`node tools/serve.js`, then
http://localhost:8123/) and gives feedback; then a check on the tablet
and phone, which needs either GitHub Pages turned on (publish: merge to
`main`, developer's OK) or the server opened to the home network.

## 2026-10-04: A way back to the home page from every game screen

**The developer** tried the build on localhost ("Its working good"): they
like picking a game on the home page, but once in a game "you can't get
back". The 🏠 button was only on the setup screen.

**Change:** the same 🏠 button now sits top-left on the play screen too,
beside "<face>'s turn"; its style moved to `css/site.css` so every future
game uses the same one. Decision added to `DESIGN.md` ("Structure").
Leaving mid-game drops the scores (a new game starts from the home page).

**Found and fixed while checking:** with the new top row, the play screen
shrank to 280 px wide on a 375 px phone (a grid item with auto margins
sizes to its content). `.app` now has `width: 100%`; measured again: the
grid is full width.

**Checked** in the built-in browser at 375x812: play screen full width;
"is thinking…" fits on one line beside 🏠 (56 px high, no overflow);
tapping 🏠 mid-game opens the home page; no console errors. No rules
changed, so the tests weren't re-run.

## 2026-10-04: Scoreboard: more space above, bigger faces

**The developer:** add space between the grid and the scoreboard, "maybe
the same height as a grid cell", and make the scoreboard faces "the same
size as for game play".

**Change** (`css/tic-tac-toe.css`, CSS only): the scoreboard's top margin
is worked out from the board's width (one square = (board - 2 gaps) / 3),
and its faces from the page width (76% of a square, like a face on the
grid). Tighter padding inside the scoreboard so the score still fits
beside the bigger faces; on very narrow phones the faces may shrink a
little (never below 44 px). `DESIGN.md` updated.

**Measured** in the built-in browser, two-player mode ("Player 1" is the
longest label):

| Size | Square | Space above scoreboard | Face on grid | Face on scoreboard |
|---|---|---|---|---|
| Phone 375x812 | 108 px | 108 px | 82 px | 82 px |
| Tablet 768x1024 | 133 px | 133 px | 101 px | 101 px |

No sideways scrolling (page 375 px wide on the phone).

**Side effect to watch:** the play screen is taller now. On the 375x812
phone the buttons end at about 730 px (read off the screenshot, not measured), so on a real phone (browser bars take
some of the height) "Play again" / "New game" may need a scroll.

## 2026-10-04: Tic-tac-toe done; status (start here next session)

**The developer:** "Perfect." Next is the matching-cards game.

**Known:**
- Branch `tic-tac-toe` (pushed) holds the playable game: home page,
  tic-tac-toe, `?dev` log, local server, 31 tests. Not merged; `main`
  (the publish branch once Pages is on) still has docs only.
- Try it: `node tools/serve.js`, then http://localhost:8123/.
- Changes after the first build, all at the developer's request: a 🏠
  button on every game screen; one grid square of space above the
  scoreboard; scoreboard faces as big as on the grid.
- **To do, not urgent** (developer): a small copyright footer on every
  screen; wording to confirm (open question Q3).
- Not checked: real iPad/iPhone/Android, Safari.
- Tooling: in this session, `preview_start` with this repo's
  `launch.json` started the GP-200 server, and the Terminal panel failed
  (missing shell-integration file). Running `node tools/serve.js` as a
  background process and opening the URL worked. A session started fresh
  in `Web-Games` may not have the first problem.

**Next:** matching cards. Kickoff decisions are in `DESIGN.md`
("Matching cards"): single player, emoji pictures, 6/8/10 pairs, a move
counter, no timer. The developer gives any more details; then a mockup
to review before building (as for tic-tac-toe), on a new branch. Open
question: whether matching cards should reuse the drawn faces instead of
emoji (tic-tac-toe dropped emoji because they differ between devices).
Then: the footer (Q3), a check on real devices, and publishing (merge to
`main`, GitHub Pages) with the developer's OK.

## 2026-10-04: Matching cards: the developer's details

**The developer's details** (2026-10-04), before any mockup:
- A grid of cards face down, all looking the same. Each turn a player
  turns over two. A match stays face up and scores a point; a mismatch
  turns back face down. **Either way, the next player takes a turn.**
- Setup screen like tic-tac-toe's: 1 or 2 players, and faces.
- **Grid size** control: 4x4 by default; also 4x5, 4x6, etc., as long as
  it fits on the screen; maybe 5xN where the width allows. Every grid has
  an even number of cards, so every card has a match.
- More than one pair of the same picture is fine (2 or 4 of a kind).
- **Pictures: our drawn faces**, except the ones the players picked.
- The game ends when the last pair is turned over.
- The "happy face" animation plays on the player's face in the
  scoreboard.

Claude's questions and suggestions went back to the developer (next
entry records the answers).

## 2026-10-04: Matching cards: answers; mockup next

**Claude's questions, the developer's answers** (2026-10-04):
- 1 player means **playing alone** (turns counted), "OK for now": it
  lets us confirm the look and the game play. A robot opponent may come
  later.
- **Happy face:** on the player's scoreboard face **with each point**,
  and again for "<face> wins!" at the end.
- **New from the developer: two scorecards.** One counts this round's
  pairs (who wins this round); the other counts wins over several rounds
  with the same players (like tic-tac-toe's score).

**Claude's proposals, not objected to** (the developer reviews them in
the mockup):
- A match passes the turn too (the developer's rule; the usual rule gives
  another turn).
- A mismatch stays face up about 1.5 s, then turns back by itself.
- Found pairs stay face up, tinted the finder's colour (orange / blue).
- Grid sizes 4x4 (default), 4x5, 4x6, 5x6, 6x6; sizes that don't fit
  the screen are greyed out; cards stay big enough for small fingers.
  Pictures: the 17 drawn faces less the players' picks; 6x6 needs 18
  pairs, so a few faces appear 4 times.
- Who goes first: the same three choices as tic-tac-toe.
- One simple card-back design.
- Playing alone: the second scorecard shows the best (fewest turns) for
  that grid size, reset on "New game".

## 2026-10-04: Matching cards mockup v1

**Mockup v1** (private Claude artifact, throwaway; nothing in the repo):
[Matching Cards Mockup](https://claude.ai/artifact/HNSrgzfwREctAqTTJZ7t4A).
Same look as the site; the drawn faces copied from `src/ui/faces.js`.
- Setup: "Just me" / "Two players", face pickers (two players can't share
  a face), **How many cards?** (3x4, 4x4 default, 4x5, 4x6, 5x6, 6x6;
  sizes whose cards would be under 56 px on this screen are greyed, with
  a note), who goes first (two players only).
- Claude added **3x4 (6 pairs)** as an easier size: the kickoff plan had
  6, 8 and 10 pairs.
- Play: the grid is sized so it fits with the turn line and the "This
  game" card; on small phones "Games won" and the buttons may need a
  scroll. The grid turns sideways when that gives bigger cards.
- One card back (a yellow star on teal-blue dots). A pair shows "A
  match!" for 0.6 s, then stays face up, tinted the finder's colour; a
  mismatch shows "Not a match" for 1.5 s, then turns back. The turn
  passes either way.
- Scorecard 1 "This game" (dark strip): pairs per player; the finder's
  face shows its winner version and wiggles on each pair. Scorecard 2
  "Games won" (light, smaller): wins and ties, reset on New game.
  Just me: pairs found / total and turns; second card "Best for <size>"
  (fewest turns).
- End: "<face> wins!" with the winner face (both for a tie); playing
  alone: "All found in N turns!".
- Pictures: the 17 faces (robot included) less the players' picks; 6x6
  repeats some (4 of a kind).
- A mockup-only "Peek at all cards" button for reviewing.

**Checked by Claude:** a syntax check of the mockup's script only. The
built-in browser can't run a file outside the project folder, and the
artifact needs a claude.ai sign-in there. The developer reviews it.

**Mockup v1, update** (developer: "Almost perfect"): when a round ends,
the winner's scorecard face grows (to 1.8x), smiles and wiggles for about
2.8 s, then goes back to its normal size and normal face (a tie: both
faces). Before, the winner face just stayed on. Claude did the same for
"Just me" at the end. On each pair the finder's face still smiles and
wiggles at normal size. Checked: syntax only (as before).

**Mockup v1, second update.** The developer: at the end, the winner's
scorecard face "did not look like their happy face - it was just a
bigger orange oval"; and the face should be a bit bigger during every
scorecard cheer.
- **Cause** (reproduced in the built-in browser by serving the mockup
  from Claude's scratchpad on port 8124 and freezing the animation
  halfway): the growing face had the class `big`, which is also the
  style of the yellow "Play!" button. The face picked up the button's
  yellow background and 14 px x 40 px padding; the drawing was squeezed
  to 0 px wide. Measured: background rgb(247,185,40), drawing 0 x 50 px.
- **Fix:** classes renamed `cheer-pair` / `cheer-win`. Measured again,
  frozen mid-animation: transparent background, the winner face drawn,
  scaled 1.8x. On each pair the finder's face now grows to 1.35x (the
  developer's second point). Both grow leftward (transform-origin
  85% 50%) so the big face doesn't cover the score: face right edge 372,
  score left edge 373.
- Earlier, "checked: syntax only" missed this. A syntax check can't see
  a style clash; only rendering the frame does.
- The local copy also needed `[hidden]{display:none!important}` (the
  published page gets it from the artifact wrapper); added to the mockup.

## 2026-10-04: Matching cards: mockup approved; rules built; publishing

**The developer:** "Perfect" (mockup v1, version 3). Agreed design now in
`DESIGN.md`, "Matching cards".

**Built so far** (branch `tic-tac-toe`): `src/core/players.js` (faces,
who-goes-first rules, face check; moved out of `tic-tac-toe.js`, which
re-exports them, so its 31 tests are unchanged and pass) and
`src/core/matching.js` (sizes, deck, layout fit, flip/settle, scoring,
best per size). 15 new tests; `npm test`: 46 of 46 pass. One of the new
tests was wrong at first (it picked the matching card for a "miss");
fixed. The screens are not built yet.

**Publishing** (the developer asked: "can we fire up the github hosted
version so I can try it on my phone?", 2026-10-04): branch merged into
`main` and GitHub Pages turned on from `main`, root folder. Live: the
home page and tic-tac-toe; matching cards still says "Coming soon".

**Live:** https://donpark2000.github.io/Web-Games/ (Pages build of
`e9cff16`: "built"). `.nojekyll` added so GitHub serves the files as
they are. Checked: home page, `tic-tac-toe.html` and a module script all
200 (scripts as `application/javascript`); in the built-in browser at
375x812 the live tic-tac-toe shows all 16 faces, Play! enabled, 🏠 goes
to `.../Web-Games/index.html`, no console errors.

**Test weakness found and fixed:** the deliberately broken copies of
`matching.js` were caught, except that one (a card with no partner) made
the tests **loop forever** instead of failing; the stuck test processes
had to be ended by hand. The tests' play-until-the-end loops now have a
limit and throw "a card has no partner" / "round never ended". Run
again with a 60 s cap per run: all 6 broken copies caught (a match keeps
the turn, player faces on cards, a card with no partner, best keeps the
worst, a third card allowed, an odd grid offered). 46 of 46 pass.

**From here:** `main` is the live site. Matching-card screens are built
on the branch and merged only when ready, with the developer's OK.

## 2026-10-04: Live-site feedback: big 🏠, footer, tic-tac-toe cheer, "aww" faces

**The developer** (tic-tac-toe works on the live site; matching cards
still "Coming soon", as expected: its screens aren't built):
1. The 🏠 button should be bigger, "same size as grid tiles". Asked
   (108 px on a phone pushes the grid down); answer: **same as a grid
   square**.
2. Add the matching-cards scorecard animation to tic-tac-toe.
3. The footer was missing (it was parked, Q3). Wording chosen: "©
   2026 Donald Parker · Free software under the GPL-3.0 · Source code".
4. New idea: a **sad face** for the loser during the end-of-round
   scorecard animation. Claude raised the design's "losing is gentle"
   (ages 5-7); answer: a **gentle "aww" face** (worried eyebrows, small
   frown, no tears).

**Done** (CSS shared in `css/site.css` so matching cards reuses it):
- 🏠 = `--home`, set by tic-tac-toe to one grid square
  (`--cell`). The empty right-hand spacer was dropped so the title and
  the turn line keep room: measured at 375x812, 🏠 108x108 (= a square),
  title 227 px wide on one line.
- Footer on both pages, 12 px, muted.
- `src/ui/faces.js`: mood `sad` for all 17 faces (eyebrows with the
  inner ends raised; a small frown; the robot gets its own). Faces test:
  51 drawings, the three versions all differ. Review page updated:
  [Tic-Tac-Toe Faces](https://claude.ai/artifact/DizY1LaW5xgCiXzBbfWxaa)
  (version 2: normal / winner / aww); Claude looked at all 17 rendered.
- Tic-tac-toe: at the end of a round the winner's scorecard face grows
  to 1.4x (115 px) and wiggles; the loser's shows "aww" and droops a
  little; a tie: both cheer; 2.8 s, then normal. Play again / New game
  stop it. Logged as "scorecard cheer".

**Checked** in the built-in browser at 375x812 (two players, `?dev`):
bear won: winner chip `cheer-win`, 115 px, winner face; cat won the next
round: bear `cheer-lose` with the aww face (eyebrows present), cat
cheering; score 1-1. To get a still picture, the 2.8 s timer was
stretched in that test page only and the animation frozen at 1.2 s.
First attempt read the faces after the cheer had already ended (a timed
2.8 s), and a quick "which face" check matched the cat's ears; both
redone. Growing face vs the score number: overlapped by 16 px, fixed
with `transform-origin: 85% 50%` (face right 299, number left 300).
Home page: footer present, link to the repo, no console errors.
`npm test`: 46 of 46 pass.

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ (GitHub Pages from
`main`). Publishing = fast-forward `main` to the working branch and
push, only with the developer's OK.

**Known:**
- Working branch `tic-tac-toe` and `main` (live) are the same commit:
  published at the developer's request before the new session ("I
  prefer github is up to date - all changes committed and the new
  website is published before I start a new session"). Live: tic-tac-toe
  with the big 🏠, the footer, the end-of-round scorecard cheer and the
  "aww" faces (developer: "The new sad faces are great"); matching cards
  still "Coming soon". Also in: the matching-cards rules
  (`src/core/matching.js`, 15 tests). `npm test`: 46 of 46 pass.
- Shared pieces for matching cards to reuse: `src/core/players.js`,
  `src/ui/faces.js` (moods normal / winner / sad), `css/site.css`
  (`--home` 🏠 size, `.cheer-pair` / `.cheer-win` / `.cheer-lose`
  with `--cheer-scale` / `--cheer-pair-scale`, footer, `.top`).
- Matching cards design: `DESIGN.md` "Matching cards"; the approved
  mockup's code is in the artifact
  [Matching Cards Mockup](https://claude.ai/artifact/HNSrgzfwREctAqTTJZ7t4A)
  (version 3; read it with the Artifact tool, `action: "read"`). Its card
  back SVG, layout code and scorecard markup port directly; its rules
  are already in `src/core/matching.js`.
- Not checked: real iPad/iPhone/Android, Safari (the developer has tried
  tic-tac-toe on the live site; device not recorded).
- Tooling in this session: `preview_start` started the GP-200 server
  (session began in that repo) and the Terminal panel failed; running
  `node tools/serve.js 8123` in the background and opening the URL
  worked. For pages outside the repo (mockups), a helper served the
  scratchpad on 8124.

**Next:** build the matching-cards screens: `matching.html`,
`src/ui/matching.js`, `css/matching.css`, the home page button turned
on, `?dev` log lines, 🏠 = one card, scorecard cheers (pair 1.35x, win
1.8x, loser "aww"), footer. Check at phone and tablet size, then ask the
developer's OK to publish.

## 2026-10-04: Matching cards built; footer, 🏠, aww fixes

**The developer** (new session, after trying the live site):
1. Build matching cards.
2. The footer should be at the bottom of the screen, not straight under
   the content (on the home page it was mid-screen).
3. Tic-tac-toe: the 🏠 "did not change size"; it should be "the same
   size as the avatars in the game play grid".
4. At the end of a game, the loser's sad face didn't show on the
   scorecard.
5. "Source code" in the footer should open a new tab, not replace the
   game.

**Findings before changing anything:**
- The live files match the repo (the only difference is line endings:
  GitHub serves LF, the Windows checkout has CRLF). Published 21:31 UTC;
  `Cache-Control: max-age=600`, so a device that loaded the site before
  could show the old files for up to 10 minutes. See Q4.
- Locally at 375x812: 🏠 108x108, a square 108x108; the 🏠 was already
  a grid square (the agreed size; "same as the avatars" taken to mean
  the same: the faces fill the squares). Left as is.
- The aww face was in the code, but only for the 2.8 s cheer.

**Changes:**
- Footer: `body` is a flex column at least the screen's height
  (`100vh`, then `100dvh` where supported); the footer has
  `margin-top: auto`. "Source code" has `target="_blank"
  rel="noopener"`.
- End-of-round faces: new `endMoods(winner, { solo })` in
  `src/core/players.js` (winner smiles, loser aww, tie both smile, alone
  smiles). Tic-tac-toe and matching cards keep those faces until the
  next round; the grow/wiggle/droop still lasts 2.8 s. The chip is
  redrawn only when its face changes, so a running wiggle isn't
  restarted by a re-render. This changes the agreed design ("then both
  back to normal"); `DESIGN.md` updated, with the reason.
- `css/game.css`: the setup panels, pickers, turn line, scorecard sides
  and buttons moved out of `tic-tac-toe.css`, unchanged, so matching
  cards shares them.
- Matching cards: `matching.html`, `src/ui/matching.js`,
  `css/matching.css`, `src/ui/cardback.js` (the card back, drawn without
  an SVG `<pattern>`: a pattern needs an id, and with many cards every
  copy would point at the first). Home page button turned on, with a
  picture (a found pair of frogs among face-down cards). Debug log area
  `cards`: picks, sizes greyed, layout, round started (with the deck),
  each flip, a match / not a match, pair found, round won / tied / all
  found, scorecard faces.
- 🏠 on the play screen = one card: `fitLayout` got `extraRows` so the
  🏠 row (one card tall) is counted when fitting the grid to the
  screen. On the setup screen: one 4x4 card (so it doesn't jump around
  when another size is picked).
- The play screen's column is 680 px (the mockup's), the setup's 520 px.
  Found in testing: the page column (`main`) was 520 px, so a sideways
  6-column grid hung over its edges; `main` is now 680 px on this page.

**Tests:** 8 new (46 before): `tests/players.test.js` (3: endMoods: win, tie, alone, a
bad winner), `fitLayout` with an extra row (1), and `tests/pages.test.js` (4:
(every page has the footer and its link opens a new tab; every local
file a page refers to exists; the home page links to every game; every
game has 🏠 on both screens). `npm test`: **54 of 54 pass**.
Proven to fail, each on a broken copy of the project in a temp folder:
no `target="_blank"` (caught), a misspelt stylesheet (caught, "missing
file: css/matchng.css"), no home button for matching cards (caught),
winner and loser faces swapped (caught), `extraRows` ignored (caught).

**Checked in the built-in browser** (`node tools/serve.js 8123`;
`preview_start` again started the GP-200 server, see the previous
status entry):
- Home, 375x812: both game buttons, footer bottom at 772 = screen height
  less the 40 px bottom padding.
- Matching, 375x812: 6x6 greyed with the note, the rest offered; two
  players 4x4: cards 79 px, 🏠 79 px, grid and "This game" on screen
  (scorecard bottom 537). A miss: "Not a match", cards outlined, back
  down after 1.5 s, turn passes. A match: "A match!", found cards tinted
  the finder's colour, score 1, finder's chip `cheer-pair`, turn passes.
  Played to the end (cat 7, bear 1): "wins!", cat `cheer-win` + winner
  face, bear `cheer-lose` + aww face; 3.2 s later: no animation, **cat
  still smiling, bear still aww**; Games won 0 / 0 / 1; next starter
  cat (take turns). Play again: faces normal, all cards down, cat's turn.
  Just me 3x4: cards 109 px, "Find the pairs!", "of 6 pairs" / "turns";
  one miss then all pairs: "All found in 7 turns!", best "7 turns".
- Matching, 1024x768 (a tablet sideways): no size greyed; 6x6: 84 px
  cards, scorecard bottom 746 (on screen); 4x6 turned sideways: 6
  columns of 106 px in the 680 px column, no overhang.
- Tic-tac-toe, 375x812, two players, cat won: bear aww and cat smiling
  during the cheer and 3 s after; Play again: both normal; 🏠 108 =
  square 108; scorecard face 82 px (as before the CSS move).
- No errors in the debug log on any page.
- Not checked: real devices, Safari.

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ (GitHub Pages from
`main`). Publishing = fast-forward `main` to the working branch and
push, only with the developer's OK. After publishing, devices may show
the old version for up to 10 minutes (reload, or wait).

**Known:**
- Branch `tic-tac-toe` has matching cards built, plus the footer,
  "Source code" new-tab and end-of-round-faces fixes. `npm test`: 54 of
  54 pass. Checked in the built-in browser at phone and tablet sizes
  (entry above).
- Q4 open: confirm on the device that the 🏠 is big and the aww face
  shows (after the publish and the 10-minute cache).
- Not checked: real iPad/iPhone/Android, Safari.

**Published** (developer: "yes, publish it"): `main` fast-forwarded to
`bad3c7a`; Pages build "built bad3c7a"; live `matching.html`, its CSS
and scripts all 200; in the built-in browser at 375x812 the live
matching cards dealt 16 cards (79 px, 🏠 79 px), card backs drawn,
footer link `target="_blank"`, no errors.

**Checked by the developer** on their device: "Its all looking good"
(Q4 resolved).

**Next:** a third game: **Connect Four** (developer's choice, 2026-10-04,
from Claude's suggestions: Connect Four, Simon, spot the odd one out, a
sliding picture puzzle). Design it first (the developer's details, then
a mockup), as with the first two; reuse the faces, the two-players /
robot setup and the scorecard from tic-tac-toe.

**Starting a session:** the Claude desktop app keeps opening new
sessions in the GP-200 Patch Manager folder. If that happens, ask Claude
to move the session to `C:\Users\dpark\Documents\Web-Games` (it can,
with its change-directory tool), then "start".

## 2026-10-04: Connect Four built (no mockup)

**The developer:** accepted Claude's proposal as is ("Sounds good"): 7x6
board, faces as the pieces tinted orange / blue, tap a column and the
piece drops with a short animation, 4 in a row in any direction wins
(winning pieces lit, the rest blurred), full board is a tie, a beatable
robot, and who-goes-first / Play again / New game / scorecard cheer as in
tic-tac-toe. Asked to skip the mockup and go straight to the live site,
since starting and scoring are settled. Claude agreed to skip the mockup
but kept the test suite and a browser check before asking to publish:
the board's look, the dropping piece and the robot were new.

**Built** (branch `connect-four`, from `tic-tac-toe` = `main`):
- `src/core/connect-four.js`: the rules, same shape as tic-tac-toe's
  (`createMatch`, `newRound`, `drop`, `outcome`, `robotMove`). One move
  can finish two lines (or 5 in a row): `outcome` lights up every spot in
  every winning line.
- The robot: takes a win 75%, blocks 55%, avoids "gift" columns (where the
  other player could then win on top) 50%, otherwise a random column
  weighted 1-2-3-4-3-2-1 towards the middle.
- `connect-four.html` (tic-tac-toe's page, with the board and names
  changed), `css/connect-four.css`, `src/ui/connect-four.js`; a home-page
  button whose picture is a 5x4 board where the bear won a diagonal.
- The board is redrawn only when a piece drops or a round starts, so the
  falling piece animates once (later redraws touch only the turn line,
  scoreboard and column locks).

**Tests:** `npm test` 71 of 71 (54 before + 17 in
`tests/connect-four.test.js`; `pages.test.js` now requires all three
games). Each check was shown to fail: in a scratch copy, six deliberate
breaks (no up-right diagonals; pieces land at the top; the robot never
sees a gift; never blocks; only the first winning line lit; the turn
never passes) each turned 1-7 tests red. The first full tie board Claude
wrote by hand had a hidden diagonal 4; the test caught it, and a search
found a real one (`1112111` rows, flipped every two rows).

**Browser check** (built-in browser, local server):
- 375x812 (phone): home shows the third button. A round against the robot:
  the robot won along the bottom row; 4 pieces lit, 6 blurred, "wins!"
  line, the bear's scorecard face "aww", robot smiling; score 0-0-1.
  Board 343 px, a hole 43 px, 🏠 56 px; the page is exactly 812 px tall
  (no scrolling). No console errors.
- The first screenshot caught a piece falling from a whole hole above the
  board, across the turn line; changed to start half a hole above.
- 1024x768 (tablet sideways), two players: with the first height
  allowance (300 px) the buttons ended at 795 px, below the screen.
  Raised to 360 px: board 476 px, 🏠 62 px, buttons end at 739 px.
- Not checked: real devices, Safari.

**Noticed in passing (tic-tac-toe, not changed):** from reading the code,
after a tie the last-placed face "pops" in again when the 2.8 s cheer
ends (the cheer's redraw re-adds the pop class). Small; to fix only if
the developer wants.

## 2026-10-04: Tic-tac-toe tie glitch fixed; Connect Four published

**The developer:** "yes, publish it and fix the tic-tac-toe glitch".

**Glitch, confirmed before fixing** (built-in browser, two players, the
tie 0,4,8,1,7,6,2,5,3): at the end, one `.mark.new` (the last face's
pop); 3 s later, after the cheer's redraw, a *new* element with
`.mark.new` again, so the pop replayed. **Fix:** the cheer-end timer
clears `justPlaced` before redrawing (`src/ui/tic-tac-toe.js`).
**After:** the same tie shows the pop once and 0 `.mark.new` after the
cheer; the next round (a win) still lights 3 squares before and after
the cheer; no console errors. Connect Four doesn't have this problem
(its board is only rebuilt when a piece drops or a round starts). The
screens have no automated tests (the suite covers `src/core/`), so this
browser check is the test.

**Published** (developer: "yes, publish it"): `main` fast-forwarded to
`f7eb083`; Pages build "built f7eb083"; live `/`, `connect-four.html`,
its CSS and scripts and `src/ui/tic-tac-toe.js` all 200, the live
tic-tac-toe script has the fix. In the built-in browser at 375x812 the
live Connect Four played a move and the robot's reply (7 columns, 2
pieces, 🏠 56 px), no console errors.

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with three games:
tic-tac-toe, matching cards, Connect Four. `main` = branch
`connect-four`. Publishing = fast-forward `main` to the working branch
and push, only with the developer's OK; devices may show the old version
for up to 10 minutes.

**Known:** `npm test` 71 of 71. Connect Four checked in the built-in
browser (phone 375x812, tablet sideways 1024x768) and on the live site.

**Not checked:** Connect Four on the developer's devices; real iPad /
iPhone / Android; Safari.

**Next:** the developer tries Connect Four on their device (the robot's
difficulty, the falling piece, the 🏠 at 56 px on a phone). Then the
next game or changes, the developer's choice (other ideas so far: Simon,
spot the odd one out, a sliding picture puzzle).

**Starting a session:** if the desktop app opens the session in the
GP-200 Patch Manager folder, ask Claude to move it to
`C:\Users\dpark\Documents\Web-Games`, then "start". There, the built-in
browser's `preview_start` started the GP-200 server (port 8000); run
`node tools/serve.js 8123` instead.

## 2026-10-04: No scrolling on the play screens; no "You play the robot" panel

**The developer** (iPhone 16, live site): (1) tic-tac-toe, "Me and the
robot": no need for the "You play the robot" section; (2) the play
screen needs scrolling to see the scorecard; the grid pieces and the 🏠
"probably" a bit smaller, goal: no vertical scrolling for the whole
page; same for matching cards; (3) Connect Four's win showed "4 in a row
at some random place". (3) was withdrawn while Claude worked: "4 in a row
is working fine". Nothing changed for it.

**Changed:**
- (1) The player 2 panel is hidden against the robot, in tic-tac-toe and
  Connect Four (it held only the fixed robot face).
- (2) A shared fit: `src/core/fit.js` (`largestFitting`, a halving search
  for the biggest size that fits; 5 tests) and `src/ui/fit.js`
  (`fitPlayScreen`: measures body padding + `main` + footer against
  `innerHeight`). Tic-tac-toe and Connect Four fit their square / hole
  size on Play! and on resize; their board width, scoreboard space and
  scorecard faces were already defined from one square, so they shrink
  together (the developer's "one square" rules kept). Matching cards
  tries both ways round, each fitted to the whole page, and keeps the
  bigger cards; a grid that can't fit with cards of 56 px or more keeps
  its old size and scrolls, so no size is lost. Footer spacing cut from
  32 px above / 40 px below to 16 / 12 (no recorded reason for the old
  values). Connect Four's 🏠 minimum lowered from 56 to 48 px (the
  developer: the 🏠 a bit smaller).
- **Assumed screen:** an iPhone 16 in Safari with its toolbars showing is
  about 393x659 CSS px (its screen is 393x852). Not measured on the
  phone; the fit uses the real `innerHeight`, so it adapts either way.

**Evidence** (built-in browser, local server; scroll = page height less
screen height):

| Screen | Tic-tac-toe square | Connect Four hole | Matching 4x4 card | Scroll |
|---|---|---|---|---|
| 393x659 | 75 (was 113) | 43 (🏠 48) | 64 | 0 |
| 375x812 | 101 | | | 0 |
| 1024x768 | 97 | 60 (board 460) | 90 | 0 |
| 768x1024 | 133 | 68 | | 0 |

Matching at 393x659: 3x4 82 px (turned sideways, 4 columns), 4x4 64,
4x5 64 (sideways, 5 columns), all no scroll; 4x6 68 and 5x6 65 still
scroll (169 and 148 px), as before; 6x6 greyed, as before. The first
try kept the old way-round choice: 3x4 then got 64 px cards and 4x5
scrolled 171 px; trying both ways round fixed both. Two players in
Connect Four still shows the player 2 panel. No console errors.

**Tests:** `npm test` 76 of 76. The fit tests caught 3 of 4 deliberate
breaks in a scratch copy (answer not left applied, search going the
wrong way, "fitted" when nothing fits); the 4th (rounding the middle up)
is still a correct search, so passing it is right.

**Not checked:** on the iPhone itself (the developer).

**Published** (developer: "yes, publish it"): `main` fast-forwarded to
`72233c6`; Pages build "built 72233c6"; the pages and new files all 200.
Live site in the built-in browser at 393x659: tic-tac-toe square 75 px,
Connect Four hole 43 px, matching 4x4 card 64 px, no scroll in any; no
robot panel against the robot in either game; no console errors.

**Status (start here next session):** live = `main` = branch
`connect-four`; `npm test` 76 of 76. Waiting on the developer's check on
the iPhone 16: no scrolling on the play screens, pieces not too small,
the setup screens without the robot panel. Open choice: matching 4x6 and
5x6 still scroll on a phone (smaller cards than 56 px would be needed to
fit). Then the next game or changes, the developer's choice.

**Checked by the developer** on the iPhone 16 (live site): "Spacing looks
good on my phone." A 5x6 matching grid also works; its buttons need a
scroll, "I think that is OK". The open choice is settled: no smaller
cards ("I don't really want to make the icons smaller").

## 2026-10-04: Connect Four checked by the developer

**The developer** tested Connect Four on the live site on their phone and
desktop: "Connect four looks good." Nothing to change. Still not checked:
Safari on an iPad, Android. Next: a fourth game (the last one today).

## 2026-10-04: Count to 9: the developer's game

**The developer** proposed the fourth game instead of Claude's list
(pop-up faces, Simon, odd one out, sliding puzzle): a 3x3 grid of face-down
cards numbered 1 to 9 in a random order; keep turning cards over while
each is the next number; a wrong number flashes red for 1.5 s, the cards
turn back and the next player's turn starts. Variation: the correct
numbers stay up and only the wrong one turns back ("easy" / "hard", open
to ideas). The robot must not use its knowledge of where the numbers are.

**Claude's questions, the developer's answers:** (1) after a miss in easy
mode, does the next player carry on from the next number? "players switch
after a miss"; read as yes, the count is shared (with the counted cards
face up, starting again at 1 would mean nothing). (2) who wins? "the
player that uncovers 9 (in easy or hard mode)". (3) the robot remembers
cards it has seen, 60% of the time; and suggestions 4-9 (star pictures on
Easy / Hard, "<face> find 4" turn line, dots under the numbers, a Just me
mode with a best score, the rest copied from the other games, a "How many
cards?" choice later; no mockup): "Your suggestions are fine."

## 2026-10-04: Count to 9 built (no mockup)

**Built** on branch `count-to-9`: rules `src/core/count-to-9.js` (deck,
flip / settle as in matching cards, easy / hard, solo turns and best per
level, the robot), screens `count-to-9.html`, `src/ui/count-to-9.js`,
`css/count-to-9.css`, number cards `src/ui/numbercard.js` (big number,
die-style dots, in currentColor so a wrong card goes red), a home-page
button (1, 2, 3 found among card backs). Debug log category `count`:
every card turned over (number, who, how many cards the robot remembers),
misses, settles, the robot's choice and reason, the fit, round ends.

**Changed for sharing:** the flipping-card CSS moved from
`css/matching.css` to a new `css/cards.css` (the rules unchanged, moved
as is), loaded by matching cards and Count to 9. Matching cards checked
after the move (393x659, Just me, 4x4): a turned card gets the flip
(`matrix3d(-1, ...)`, read with the transition off: the pane was hidden,
so transitions didn't run), card 67 px, no scroll, no console errors.

**The robot never peeks:** `robotPick` reads a card's number only for
cards in `match.seen`; each card turned over (by anyone) goes in with
chance `ROBOT_TUNING.remember` = 0.6. A test gives it two different decks
with the same random numbers and nothing remembered: it picks the same
card in both (it would pick each deck's 1 if it looked).

**How strong is it** (simulation, scratchpad, 2000 rounds each, the
child modelled as remembering each card it sees with chance p, starts
alternating; child's win rate):

| robot remember | level | child p=0.3 | p=0.6 | p=0.9 |
|---|---|---|---|---|
| 0.6 | easy | 19% | 52% | 76% |
| 0.6 | hard | 11% | 51% | 81% |
| 0.4 | easy | 38% | 69% | 88% |
| 0.4 | hard | 33% | 78% | 94% |
| 0.3 | easy | 51% | 81% | 93% |
| 0.3 | hard | 51% | 88% | 98% |

At 0.6 the robot is an even match for a child who remembers 60% of the
cards; a child who remembers nothing wins about 3% (easy) / 0% (hard).
Kept at the agreed 0.6; 0.4 is the obvious next step if it's too strong.
The model of a child is a guess, not a measurement.

**Tests:** `npm test` 90 of 90 (14 new for Count to 9, the pages test now
expects four games). Six deliberate breaks in a scratch copy were all
caught: the robot peeking (2 tests failed), hard never resetting (1),
easy resetting too (4), the turn passing when alone (1), guesses ignoring
memory (1), always remembering (2).

**Checked in the built-in browser** (local server, `node tools/serve.js
8123`): against the robot at 393x659: easy, 1 and 2 counted (tinted
orange), a wrong 7 flashed red with "Oops!", the robot guessed wrong (a
4), the bear finished and won: smiling bear, robot "aww", 1-0. Just me,
hard: a miss turned all 3 counted cards back, "Find 1", then "1 to 9 in 2
turns!", best (hard) 2 with a 🏆. Two players: Play! greyed with "Player
2 needs a face."; the turn passed on a miss; cards tinted by who counted
them (orange / blue); "take turns" made player 2 start the next round;
Play again mid-round restarted unscored. No console errors.

Card size and page scroll, each after a reload at that size (the pane's
size emulation sends no resize events, so the refit on resize wasn't
exercised here; it's the same code as Connect Four's):

| Screen | Card | Scroll |
|---|---|---|
| 393x659 (iPhone 16 in Safari, assumed) | 82 | 0 |
| 375x812 | 107 | 0 |
| 768x1024 | 140 (the cap) | 0 |
| 1024x768 | 127 | 0 |

The pane's screenshots came back garbled at times (parts drawn twice,
one card missing in one shot while the page said it was face up); the
page's own state was right each time, so taken as a capture problem.

**Not checked:** on the developer's devices; Safari.

**Published** (developer: "yes, publish it"): `main` fast-forwarded to
`2f050b5`; Pages build "built 2f050b5"; the new and changed files all
200. Live site in the built-in browser at 393x659: Count to 9 starts
against the robot, a card turned over is counted ("find 2"), cards 95 px
(82 px locally: there the `?dev` debug panel takes room at the bottom),
no scroll; the home page has the Count to 9 button; no console errors.

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with four games:
tic-tac-toe, matching cards, Connect Four, Count to 9. Working branch
`count-to-9`; `main` = `2f050b5` (the site); this journal entry is on the
branch only (docs, nothing on the site changes). Publishing = fast-forward
`main` to the working branch and push, only with the developer's OK.

**Known:** `npm test` 90 of 90. Count to 9 checked in the built-in
browser (phone and tablet sizes) and on the live site.

**Not checked:** Count to 9 on the developer's devices (the robot's
strength at `remember` 0.6, the red flash, the dots); Safari; Android.

**Next:** the developer tries Count to 9. Possible changes: the robot's
`remember` (0.4 if too strong), a "How many cards?" choice later. Other
game ideas so far: pop-up faces, Simon, spot the odd one out, a sliding
picture puzzle.

**Starting a session:** if the desktop app opens the session in the
GP-200 Patch Manager folder, ask Claude to move it to
`C:\Users\dpark\Documents\Web-Games`, then "start". There,
`preview_start` still started the GP-200 server (port 8000) even with the
session moved; run `node tools/serve.js 8123` in the background instead.

**The developer** (2026-10-04, after playing on the live site): "The game
play looks good. I think robot is a little too good. But Maybe I'm just
too bad." Nothing changed; logged as Q5 (lower `remember` to 0.4?).

## 2026-10-04: Next game candidate: rock paper scissors (developer's design)

**The developer:** a rock-paper-scissors game; the point is two players
deciding at the same time, and a player who stalls would always win, so
"person against robot" only ("I don't see it as a two player game").
Their design: the robot picks first, hidden; a countdown (1, 2, 3) during
which the person can't pick; the picture buttons work only once "3"
shows; the moment the person picks, the robot's earlier pick is shown.
Claude agreed this removes the stalling problem (the robot's pick is fixed
before the person's; waiting gains nothing) and keeps the "at the same
time" feel.

**Claude's suggested defaults, not yet agreed:** about 0.7 s per count;
a game is first to 3 round wins, a tied round shows "Same!" and doesn't
count; the robot picks at random (fair, but no difficulty to tune);
picture buttons 🪨 📄 ✂️ (or drawn), the winning pick acts it out (rock
smashes scissors, paper covers rock, scissors cut paper); faces,
scoreboard, cheers, 🏠 as in the other games; no "who goes first"; a
mockup first. Not started.

**Agreed** (developer, 2026-10-04): "I'm ok with a mockup step. There is
no 'whose playing' option. There is only one option. Other suggestions
sound good." So: no "Who's playing?" panel at all (always you against the
robot; the setup is the face picker); 0.7 s per count, first to 3, "Same!"
ties not counted, random robot, picture buttons, the winning pick acted
out, the usual faces / scoreboard / cheers / 🏠, no "who goes first".
Next: the mockup.
