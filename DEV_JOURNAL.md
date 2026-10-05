# Dev journal

A running record of decisions, findings, and open questions, newest at the
bottom. Findings record **evidence**: what was tested, what was observed,
and what it does and doesn't prove.

## Open questions

(none)

## Resolved

- **Q5. Is the Count to 9 robot too strong?** *Raised 2026-10-04 (entry
  "Count to 9 built").* The developer, after playing it on the live site:
  "The game play looks good. I think robot is a little too good. But
  Maybe I'm just too bad." It remembers each card it sees with chance
  `ROBOT_TUNING.remember` = 0.6 (`src/core/count-to-9.js`); the
  simulation table in that entry puts 0.4 at a child win rate of 38%
  (child remembering 30%) / 69% (60%) in easy mode, against 19% / 52% at
  0.6. To settle: the grandkids' games, or the developer's choice of 0.4.
  **Resolved 2026-10-04:** the developer: "computer is too strong.
  especially in hard mode." Now 0.4 in easy and 0.3 in hard
  (`ROBOT_TUNING.remember` per level), Claude's suggestion, agreed. Child
  remembering 30%: 37% wins in easy, 50% in hard (entry "Home page
  groups; a gentler Count to 9 robot").

- **Q6. Separate one-player and two-player games on the home page?**
  *Raised 2026-10-04 (after "Status (start here next session)").* The
  developer: "we have two types of games now. One player and 2 player
  (even if one of the players is Robot). It is probably worth separating
  them on the home page." An idea for the next session. To settle: some
  games are both: matching cards and Count to 9 have "Just me" and two
  players (Count to 9 also the robot); tic-tac-toe and Connect Four are
  against the robot or two players; rock paper scissors will be against
  the robot only. So: by what counts as one player (just me only, or the
  robot too), and does a game that's both appear in both groups, or get
  a small "1 or 2 players" note instead?
  **Resolved 2026-10-04:** the developer: "any game with an option to
  play 2 players or one vs robot is a two player game. If there is no
  option to play with another person (like rock paper scissors) it is a
  one person game." So each game is in one group: two players
  (tic-tac-toe, matching cards, Connect Four, Count to 9), one player
  (rock paper scissors). Two players first (Claude's default, not
  objected to).

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

## 2026-10-04: Rock paper scissors mockup v1

[Rock Paper Scissors Mockup](https://claude.ai/artifact/KpNrFFah3PDgt3xhs8VgTX)
(private Claude artifact, version 1). Built from the real faces (bear,
robot; normal / winner / sad, exported from `src/ui/faces.js`) and the
matching cards' back.

- **Play screen:** 🏠 + turn line; your card (empty, dashed) "vs" the
  robot's card; three drawn picture buttons (rock, paper, scissors; our
  own SVG, not emoji, as with the faces); "Start" / "Next round"; the dark
  scoreboard with 3 stars each ("First to 3"); Play again / New game.
- **A round:** the robot picks at random and its card stays face down
  ("🤖 has picked!", "Picked! (hidden)"); 1, 2, 3 at 0.7 s each, the
  robot's card bobbing on each number; the buttons are greyed until "3"
  ("Pick one!"); the moment you tap, your pick appears and the robot's
  card turns over (0.25 s). The winning card lunges at the other, which
  shakes and greys out; the turn line says "Rock smashes scissors!" /
  "Paper covers rock!" / "Scissors cut paper!"; a star is added. Same
  picks: "Same! Go again.", no star. At 3 stars: "<face> wins!", the
  winner's scorecard face cheers, the other shows "aww".
- **Setup screen:** the face picker, a "You play the robot. First to 3
  wins!" line, Play!.
- **Mockup only:** a "Robot's pick" menu to try each result.

**Choices in it for the developer to check:** each round starts with a
"Next round" button (the child sets the pace) rather than by itself; the
robot's pick sits on a face-down card (a card back with the star) rather
than a closed fist.

## 2026-10-04: Rock paper scissors mockup v2

**The developer** on v1: "It looks good but there is no tally board for
'play again'. And there are 2 'play again' controls." The yellow button
(Start / Next round / Play again) duplicated the Play again pill; the
next round should start automatically, without a control.

**Changed (v2, same link):** the yellow button is gone. A game starts by
itself ("Ready?" 1 s, then 1, 2, 3); after a round the result shows 2.5 s
(1.5 s after "Same!") and the next countdown starts by itself. At 3 stars
the game stops on "<face> wins!" until **Play again** (a new game, games
won kept; mid-game it restarts the game, not counted) or **New game**
(setup; games won back to 0). A light **Games won** strip (as in matching
cards) under the stars: your face and count, the robot's.

**Checked** (mockup served on localhost, built-in browser, robot forced to
scissors): Play again → "Ready?" → buttons on after 2.5 s (1 s + 3 x 0.7
s); three rocks: stars 1-0, 2-0, then "wins!", games won 1-0, buttons on
again 3.8 s after each round result (2.5 s + the count); 4 s after the
win still waiting; Play again kept games won 1-0; a "Same!" round went on
to the next countdown after 1.3 s (the 1.5 s pause, measured from 0.3 s
after the tap).

**Approved** (developer, 2026-10-04): "Approved." Mockup v2 is the agreed
design; its decisions are in `DESIGN.md` ("Rock paper scissors").

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with four games:
tic-tac-toe, matching cards, Connect Four, Count to 9. `main` = branch
`count-to-9` (published with the developer's OK, this entry included).
Publishing = fast-forward `main` to the working branch and push, only
with the developer's OK.

**Known:** `npm test` 90 of 90. Count to 9 played by the developer on the
live site: "The game play looks good."

**Open:** Q5, the Count to 9 robot maybe too strong (`remember` 0.6 →
0.4?).

**Next:** build rock paper scissors from mockup v2 (`DESIGN.md`, "Rock
paper scissors"; mockup link there) on a new branch from `main`. Reuse:
the faces (`src/ui/faces.js`), card back (`src/ui/cardback.js`), the
flipping-card CSS (`css/cards.css`), setup / turn line / buttons
(`css/game.css`), `endMoods` and the scoreboard cheers, `fitPlayScreen`.
The mockup's drawn rock / paper / scissors SVG can be copied from the
artifact (Artifact tool, action "read").

**Starting a session:** if the desktop app opens the session in the
GP-200 Patch Manager folder, ask Claude to move it to
`C:\Users\dpark\Documents\Web-Games`, then "start". `preview_start`
started the GP-200 server (port 8000) even after the move; run `node
tools/serve.js 8123` in the background instead. The built-in browser's
size emulation sends no resize events: reload at each size to measure.

**Idea for the next session** (developer): separate one-player and
two-player games on the home page; logged as Q6.

## 2026-10-04: Rock paper scissors built (from mockup v2)

**The developer**, after the publish: "I do not see the new game on
github.io. I would like to before we quit." Rock paper scissors was only
the mockup; built in this session after all, on branch
`rock-paper-scissors` (from `main`).

**Built:** rules `src/core/rock-paper-scissors.js` (judge, the robot's
random pick made at `newRound` and fixed, `unlock` when the countdown
shows 3, `choose` refusing 'not-yet' / 'already' / 'game-over', first to
3, games won kept by `newGame`), pictures `src/ui/rpspics.js` (the
mockup's SVG and sayings), screens `rock-paper-scissors.html`,
`src/ui/rock-paper-scissors.js`, `css/rock-paper-scissors.css`, a
home-page button (the bear's rock against the robot's scissors). Timings
as agreed: "Ready?" 1 s, 0.7 s per count, result 2.5 s, "Same!" 1.5 s.
The card size is fitted so the page doesn't scroll (80-150 px); the 🏠
follows it (at least 56 px). Debug log category `rps`: each round's
robot pick, "pick now", your pick and the result, refused taps, the fit,
game ends.

**Tests:** `npm test` 98 of 98 (8 new; the pages test now expects five
games). Seven deliberate breaks in a scratch copy were all caught: judge
reversed (5 failed), picking during the countdown (1), first to 2 (2),
Play again resetting games won (1), changing your pick (1), a robot that
never picks scissors (3), a robot that switches to the winning pick after
yours (3).

**Checked in the built-in browser** (local server, 393x659): 16 faces on
setup; Play! → "Ready?" → "🤖 has picked!", count 2 with the buttons
greyed and "Picked! (hidden)"; a tap during the count ignored; buttons on
at "3" ("Pick one!", 2.4 s after Play!); paper against the robot's
scissors: "Scissors cut paper!", the robot's card lunged, mine shook,
stars 0-1. A full game won 3-1 ("wins!", bear smiling, robot "aww",
games won 1-0, still waiting 3.5 s later); Play again: "Ready?", stars
0-0, games won kept 1-0; a same pick: "Same! Go again." Cards 125 px at
393x659 and 150 px (the cap) at 1024x768, no scroll; the home page has
five buttons; no console errors.

**Not checked:** on the developer's devices; Safari.

**Published** (the developer wanted to see it on github.io before
quitting): `main` fast-forwarded to `e9ef08c`; Pages build "built
e9ef08c"; the new files all 200. Live site in the built-in browser at
393x659: the home page lists five games; rock paper scissors: buttons on
2.4 s after Play!, rock against scissors "Rock smashes scissors!", no
scroll, no console errors.

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with five games:
tic-tac-toe, matching cards, Connect Four, Count to 9, rock paper
scissors. Working branch `rock-paper-scissors`; `main` = that branch
(this entry included). Publishing = fast-forward `main` and push, only
with the developer's OK.

**Known:** `npm test` 98 of 98.

**Open:** Q5 (Count to 9 robot maybe too strong), Q6 (separate one- and
two-player games on the home page). Q6 is the plan for the next session
(developer: "Tomorrow in a new session we can sort the 'one player' vs
'two player' question").

**Not checked:** rock paper scissors on the developer's devices; Safari;
Android.

**Starting a session:** if the desktop app opens the session in the
GP-200 Patch Manager folder, ask Claude to move it to
`C:\Users\dpark\Documents\Web-Games`, then "start". Run `node
tools/serve.js 8123` in the background for the local server
(`preview_start` by name started the GP-200 server); `preview_start` with
the url `http://localhost:8123/...` then opens it. The pane's size
emulation sends no resize events: reload at each size to measure.

## 2026-10-04: Home page groups; a gentler Count to 9 robot

On branch `home-groups` (from `main`).

**Count to 9 robot (Q5):** `ROBOT_TUNING.remember` is now per level,
`{ easy: 0.4, hard: 0.3 }` (was 0.6 for both). The "match started" debug
line now includes `robotRemembers` against the robot. Simulation re-run
(scratchpad script, 4000 rounds each, the child modelled like the robot:
remembers each card turned over with chance p; who starts alternates;
child's win rate). It reproduces the earlier table within 3 points (0.6
easy: 20 / 49 / 76% now against 19 / 52 / 76%):

| robot remember | level | child p=0 | p=0.3 | p=0.6 | p=0.9 |
|---|---|---|---|---|---|
| 0.6 | easy | 3% | 20% | 49% | 76% |
| 0.6 | hard | 0% | 11% | 50% | 79% |
| **0.4** | **easy** | 5% | **37%** | **71%** | 89% |
| 0.4 | hard | 0% | 31% | 77% | 94% |
| 0.3 | easy | 8% | 49% | 81% | 92% |
| **0.3** | **hard** | 0% | **50%** | **90%** | 97% |
| 0.25 | easy | 8% | 58% | 85% | 94% |
| 0.25 | hard | 0% | 62% | 93% | 99% |

A child who remembers nothing still almost never wins: at most 8% in easy
and 0% in hard at every setting tried, down to 0.25. So lowering the
robot's memory further won't help such a child; if that matters, the
next lever is something other than memory (not looked into).

**Home page groups (Q6):** two `<section class="group">`s, "👥 Two
players" (tic-tac-toe, matching cards, Connect Four, Count to 9) then
"👤 One player" (rock paper scissors). On a wide screen a group's only
game is one column (272 px) wide and centred, not the whole row. Debug
log: one "group" line per group listing its games.

**Home picture fix (developer's screenshot, live site):** the Connect
Four picture's 5th column was half outside the yellow board. Measured
at 1024x768: the five columns were 28 px each in a 138 px space (156 px
with the gaps). The Matching Cards picture was wrong too: columns 20,
59, 59 px (two tiny card backs down the left). Cause: `repeat(n, 1fr)`
columns are never narrower than what's in them, and the squares
(aspect-ratio 1, a picture inside) count as wider than intended. Fix:
`repeat(n, minmax(0, 1fr))`. After: Connect Four 5 x 24.4 px, all
3-column pictures 3 x 46 px, nothing outside the frame, at 1024x768 and
393x659. I'd seen this in my own screenshot earlier this session and
wrongly put it down to the pane's screenshots (which were garbled in
the Count to 9 session); the measurements show it was real.

**Tests:** `npm test` 100 of 100 (2 new: the home page groups, the
picture grids use `minmax(0, 1fr)`; the robot memory test now checks
each level's own chance, e.g. a 0.35 draw is remembered in easy and
forgotten in hard). Deliberate breaks, each caught (1 test failed each):
hard using easy's chance, one chance for both levels (0.4), Count to 9
in the one-player group, the groups' order swapped, the rock paper
scissors button outside the groups, the Connect Four picture back to
plain `1fr`.

**Checked in the built-in browser** (local server): home page at
393x659 (each button 361 px wide, no sideways scroll) and 1024x768 (two
columns of 272 px; rock paper scissors centred at 272 px); the debug log
lists both groups; Count to 9, me and the robot on hard: "match started
... robotRemembers: 0.3". No console errors.

**Not checked:** on the developer's devices; Safari. The new robot
strength over real games with the grandkids.

**Published** (developer: "yes, publish it"): `main` fast-forwarded to
`1251913`; Pages build "built 1251913"; the changed files all 200, the
live `count-to-9.js` has `{ easy: 0.4, hard: 0.3 }`. Live home page in
the built-in browser at 1024x768: both groups, Connect Four picture
5 x 24.4 px, matching cards 3 x 46 px, rock paper scissors 272 px; no
console errors.

## 2026-10-04: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with five games,
grouped on the home page: two players (tic-tac-toe, matching cards,
Connect Four, Count to 9), one player (rock paper scissors). Working
branch `home-groups`; `main` = that branch (this entry included).
Publishing = fast-forward `main` and push, only with the developer's OK.

**Known:** `npm test` 100 of 100.

**Open questions:** none.

**Ideas for later** (`DESIGN.md`, "Later"): a difficulty setting for the
rock paper scissors robot; matching cards with the developer's photos;
more games.

**Not checked:** the gentler Count to 9 robot with the grandkids;
rock paper scissors and the new home page on the developer's devices;
Safari; Android.

**Starting a session:** if the desktop app opens the session in the
GP-200 Patch Manager folder, ask Claude to move it to
`C:\Users\dpark\Documents\Web-Games`, then "start". Run `node
tools/serve.js 8123` in the background for the local server, then
`preview_start` with the url `http://localhost:8123/...`. The pane's
size emulation sends no resize events: reload at each size to measure.
Its screenshots are sometimes garbled or time out: measure with
`javascript_tool` before trusting or dismissing what a screenshot shows.

## 2026-10-05: Game ideas; Snakes and Ladders mockup v1

**The developer** (after the publish): "It all looks great. I'll wait till
I get feedback from my grandkids before changing any of the games. Any
ideas for new games?" Claude's list: two players: Snakes and Ladders
(suggested first: all luck, so the robot is never too strong or too
weak; counting practice), hide and seek (a gentle Battleship), Pig
(dice), Dots and Boxes; one player: Simon (suggested first), whack-a-face,
"what comes next?", a sliding picture puzzle. The developer: "I'm
curious to see how snakes and ladders would look."

[Snakes and Ladders Mockup](https://claude.ai/artifact/6zYeLSTePYJ2A295izWTM5)
(private Claude artifact, version 2). Built from the real faces (all 16
on setup; bear, cat, robot in normal / winner / sad, exported from
`src/ui/faces.js`) and Count to 9's die dots (`DOTS` 1-6), by a script in
Claude's scratchpad.

- **Board:** 6 across by 5 up, 1 to 30, snaking from the bottom left; 30
  (top right) has a 🏆. Squares in white and pale yellow, numbers in a
  corner, in a yellow frame like Connect Four's. Drawn ladders (wood,
  rungs) and friendly snakes (green with yellow bands, smiling head).
  **Ladders 3→15, 7→18, 13→25; snakes 17→5, 26→11, 29→21.**
- **A turn:** "<face>'s turn", "Tap [die] to roll!"; the die (one, 1-6,
  ringed in the player's colour, gently nudging while it waits) tumbles
  0.65 s and lands; "<face> rolled 4"; the piece hops one square per dot
  (0.3 s each, the count on the turn line); on a ladder "Up the ladder!"
  (winner face) and it climbs (0.9 s); on a snake "Wheee! Down the
  snake." ("aww" face) and it slides along the snake's body (1.3 s); the
  square it goes to is outlined. The robot "is thinking..." 0.8 s and
  rolls by itself.
- **Pieces:** face discs ringed in the player's colour (orange / blue);
  two on one square shrink and sit side by side.
- **End:** reaching 30 wins, **even with dots to spare** (no exact roll
  needed). "<face> wins!", the winner's piece and scorecard face cheer,
  the other shows "aww". No ties.
- **Below the board:** the dark scoreboard (games won), Play again / New
  game, footer, as in the other games.
- **Setup:** tic-tac-toe's (Me and the robot / Two players, face pickers,
  who goes first).
- **Mockup only:** a "Next roll" menu to try a ladder or a snake.

**Choices in it for the developer to check:** both pieces start on
square 1 (not off the board); no exact roll needed to finish; no extra
turn for a 6; one die; 30 squares (a real board has 100: too long for
5-7); 3 ladders and 3 snakes; the snake wording ("Wheee!", not "Oh
no").

**Checked in the built-in browser** (the mockup file served from the
scratchpad on port 8124, 393x760): a 2 from square 1 → 3 → up the
ladder to 15 (outlined); the robot rolled and climbed by itself; a 2
from 15 → 17 → down the snake to 5; bear moved to 27 by script, a 6 →
stops on 30, "wins!", games won 1-0, robot "aww". Fixed before version
2: two pieces on square 1 were half off the board; pieces a bit big;
snake bodies hid some numbers (now on top, with a white halo). No
console errors.

**For the real game:** the snake slide is drawn frame by frame
(`requestAnimationFrame`), which stalls while the page is hidden (seen
in the pane: the robot stuck mid-snake until a screenshot made it draw).
The real game should finish the move on a timer as well, so a hidden tab
can't stall a turn.

## 2026-10-05: Snakes and Ladders mockup v2

**The developer** on v1: "I like it." Suggestions: after a move the die
should be blank or show whose turn is next; exact roll to reach the end,
extra dots go backwards; sad face after a snake until their next turn,
happy face while climbing; could the board be bigger than 6x5; new
ladder and snake places each game. Then: move the die to the top, beside
the 🏠, keeping the words ("There is plenty of room for both").

**Game length** (simulation, scratchpad, 20,000 two-player games each;
turns per player, median and 90th percentile):

| Board | Reaching the goal is enough | Exact roll, bounce back |
|---|---|---|
| v1's fixed 6x5 | 6 (11) | 10 (23) |
| random 6x5, 3+3 | 7 (10) | 9 (17) |
| random 6x6, 4+4 | 8 (13) | 11 (20) |
| random 6x7, 4+4 | 10 (14) | 13 (21) |

v1's board drags at the end with the exact rule: snakes on 26 and 29 sit
where a bounce lands. Hence "no snakes in the last row" (Claude's
suggestion).

**Changed (v2, same link):**
- **Top row:** 🏠, the words, the die. The separate die row is gone.
- **The die shows whose turn it is** (their face, on their colour; the
  robot's face wiggles while it "thinks"), tumbles to the roll, and **loses
  a dot with each hop** (blank at the end of the move). The winner's happy
  face on it at the end.
- **Exact roll:** extra dots hop back from the goal ("Too many! Back 4",
  the count carrying on). No snakes in the last row, so a bounce only
  lands on plain squares (and ladder tops).
- **Faces:** happy while climbing, normal at the top; "aww" after a snake,
  until that player's next turn.
- **6x6 board** (36 squares, 4 ladders, 4 snakes); a mockup-only switch to
  6x7 (42).
- **A new board every game** (Play again, New game): never on 1 or the
  goal; each spans 1 or 2 rows, no more columns sideways than rows (none
  lie flat); no square used twice; no snakes in the last row; none within
  0.45 of a square of another (none cross).
- The snake slide now runs on a timer, not `requestAnimationFrame` (the
  stall seen in v1's check).

**Checked in the built-in browser** (scratchpad server, 393x659 = iPhone
16 in Safari, assumed): 6x6: the play screen is 627 px tall, squares
56 px: fits with no scrolling. 6x7: 683 px, 24 px too tall; the real game
would shrink the squares to about 52 px (the other games' fit code).
Bounce: from 33 a 5 went 34, 35, 36, back 35, 34; the die 5, 4, 3, 2, 1,
blank. Snake: 15 + 2 → 17 → down to 7, sad through the robot's turn,
normal at the bear's next turn; the robot climbed a ladder happy, normal
at the top. Win: 33 + 3 → 36, "wins!", die and scorecard happy, robot
"aww", games won 1-0. Board maker: 500 boards each for 6x6 and 6x7, every
ladder and snake checked against every rule (8,000): no breaks, under 1 ms
a board. Fixed on the way: the turn line put the face on its own line;
some ladders lay nearly flat (2 columns over for 1 row up). No console
errors. (The pane only draws when screenshotted, so pieces sometimes
show mid-move in screenshots; positions were checked by script.)

**Still to choose:** 6x6 or 6x7.

## 2026-10-05: Snakes and Ladders mockup v3

**The developer** on v2: should ladder gains equal snake losses ("the
snakes looked a lot longer")? And with the player's face on the die "it
is not obvious it is actually a die": show a 3D cube with no face toward
you until someone rolls, then one face until the turn is over.

**Measured** (v2's board maker, 2000 boards, 6x6): ladders gave 35.2
squares on average, snakes took 29.8; but on **614 of 2000 boards (31%)
the snakes took more** than the ladders gave; snake loss / ladder gain:
median 0.84, 10% of boards under 0.50, 10% over 1.36. (A first count was
wrong: square numbers read as text were glued together, not added;
caught by the absurd ratios, fixed, re-run.)

**Changed (v3, same link):**
- **The die:** a 3D cube seen corner-on (1, 2 and 3 dots on its three
  faces, outlined in the colour of whose turn it is; the robot's wiggles
  while it "thinks"). Tap: it tumbles, then shows one flat face with the
  roll, losing a dot each hop, until the turn is over; then a cube again
  for the next player. No faces on the die (the turn line keeps "<face>'s
  turn. Tap the die!").
- **Fairer boards:** the snakes together take away 60-90% of what the
  ladders give (Claude's suggestion: never meaner than kind), and every
  ladder and snake moves you at least 5 squares (v2 had a ladder gaining
  only 3: one row up can be +1 on a winding board).

**Checked in the built-in browser** (393x659): the cube reads as a die;
a roll showed one flat face (4 dots one hop in), the robot's turn a blue
cube, then the bear's an orange one. Board maker, 500 boards each for
6x6 and 6x7, every rule checked (1 / goal, reuse, rows, at least 5
squares, flat, no snake in the last row, crossing, 60-90% balance): none
broken; under 0.5 ms a board. Game length on those boards (20 games
each, exact roll): **6x6 median 10 turns each, 90% within 16**; 6x7 12
and 19 (v2's unbalanced boards: 11 and 20 on 6x6). No console errors.

**Still to choose:** 6x6 or 6x7.

## 2026-10-05: Snakes and Ladders built (from mockup v3)

**The developer** on v3: "Perfect. Please build the game, commit
everything to github and push the new game to github.io web site." Board
size never picked: built at 6x6, Claude's recommendation (DESIGN.md).

**Built** on branch `home-groups`: rules `src/core/snakes-ladders.js`
(squares, the board maker and its `BOARD_RULES`, `checkBoard` listing any
broken rule, `move` returning the hop path, bounce, ladder or snake jump
and result; match / round as in Connect Four), drawings
`src/ui/snlart.js` (ladders, snakes, the snake's path for the slide, the
cube die, die faces; shared with the home page), screens
`snakes-ladders.html`, `src/ui/snakes-ladders.js`,
`css/snakes-ladders.css`, a home-page button in the two-player group (a
board corner: the bear at the top of a ladder, the robot at its foot).
The screen moves pieces through the path the rules worked out, so what's
shown always matches the match state. Every pending step is a tracked
timer (the snake slide too, not `requestAnimationFrame`), and Play again /
New game cancel them. Debug log category `snl`: each board (ladders,
snakes, gain, loss, tries), each roll (who, from, path, bounce, jump,
where), refused die taps, cancelled steps, the fit, round ends.

**Tests:** `npm test` 113 of 113 (13 new; the pages test now expects six
games, Snakes and Ladders in the two-player group). The rule checker is
fed a broken board for each rule (count, square 1, the goal, a square used
twice, moves only 4, 5 rows, flat, snake head in the last row, too close,
too mean, too kind): each caught. 500 seeded boards all pass every rule;
400 whole games all finish (median and 90th percentile of turns within
the agreed range). Seven deliberate breaks in a scratch copy, all caught:
no bounce (1 test failed), snakes ignored (1), snakes allowed in the last
row (2), balance not enforced (2), turn not passing (3), a die that never
rolls 6 (1), the crossing check off (2).

**Checked in the built-in browser** (local server): home page: the new
button in the two-player group, no console errors. A whole game against
the robot (a script tapping the die when it was the bear's turn): 30
moves, a snake 9 → 4, a ladder 12 → 24, bounces off 36 ("from 35, rolled
3: 36, 35, 34"), the robot won on an exact 2 from 34; the scorecard cheer
(robot happy, bear "aww"). Fit: 393x659: squares 56 px, the page exactly
the screen (659); 1024x768: 72 px, no scroll; with `?dev` (the panel takes
room) 42 px. Two players: "Player 1" / "Player 2", the cat. Play again
during a move: the pending step cancelled, a new board, both pieces on 1,
nothing moving 3.5 s later; New game: back to setup. No console errors.

**Not checked:** on the developer's devices; Safari.

**Published** (developer: "push the new game to github.io"): `main`
fast-forwarded to `3b32e82`; Pages build "built 3b32e82"; the new and
changed files all 200. Live site in the built-in browser at 393x659: the
home page's two-player group ends with Snakes and Ladders; the game:
squares 56 px, the page exactly the screen, a roll of 3 hopped the bear
to 4; no console errors.

## 2026-10-05: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with six games:
two players (tic-tac-toe, matching cards, Connect Four, Count to 9,
Snakes and Ladders), one player (rock paper scissors). Working branch
`home-groups`; `main` = that branch (this entry included). Publishing =
fast-forward `main` and push, only with the developer's OK.

**Known:** `npm test` 113 of 113.

**Open questions:** none. The developer is waiting for the grandkids'
feedback before changing any games (2026-10-04).

**Ideas for later** (`DESIGN.md`, "Later"; game ideas in "Game ideas;
Snakes and Ladders mockup v1"): a difficulty setting for the rock paper
scissors robot; Simon (one player, Claude's first pick); hide and seek,
Pig, Dots and Boxes; whack-a-face, "what comes next?", a sliding puzzle;
matching cards with the developer's photos.

**Not checked:** Snakes and Ladders, rock paper scissors and the gentler
Count to 9 robot on the developer's devices and with the grandkids;
Safari; Android.

**Caching** (the developer asked whether the grandkids see a new game by
tapping 🏠): GitHub Pages sends `Cache-Control: max-age=600`, so a device
may show its saved copy for up to 10 minutes after a publish; after that
any page load (🏠 included) gets the new one.

**Starting a session:** if the desktop app opens the session in the
GP-200 Patch Manager folder, ask Claude to move it to
`C:\Users\dpark\Documents\Web-Games`, then "start". Run `node
tools/serve.js 8123` in the background, then `preview_start` with the url
`http://localhost:8123/...`. The pane's size emulation sends no resize
events: reload at each size to measure. It only draws when screenshotted
or visible, so animations and timers can lag: check positions and state
by script before trusting (or dismissing) a screenshot. Claude's mockups
are built by a script in its scratchpad from the real faces; the pane
can't open claude.ai artifacts (not signed in), so a mockup is served
from the scratchpad on another port to check it.
