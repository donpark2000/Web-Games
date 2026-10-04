# Dev journal

A running record of decisions, findings, and open questions, newest at the
bottom. Findings record **evidence**: what was tested, what was observed,
and what it does and doesn't prove.

## Open questions

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

## Resolved

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
phone the buttons end at 742 px, so on a real phone (browser bars take
some of the height) "Play again" / "New game" may need a scroll.
