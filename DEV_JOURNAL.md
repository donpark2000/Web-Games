# Dev journal

A running record of decisions, findings, and open questions, newest at the
bottom. Findings record **evidence**: what was tested, what was observed,
and what it does and doesn't prove.

## Open questions

Raised 2026-10-15 by the developer after the publish of de21c8c ("Maybe
we tried to do too many different things at once"), to take one at a
time, each tried before publishing:

- **Q22. Restarting the app should be a clean slate.** "If I completely
  stop and restart the app, I would expect it to go to the home page,
  clean slate, and be able to start any new game. But any game I pick
  goes back to where it left off." Q20's rule keeps every game until
  it's finished or New game; switching apps should still come back as
  it was. Unknown: whether the iPhone's app can tell a restart by the
  person from iOS closing it in the background (both open fresh at
  `start_url`); `sessionStorage` might, to be measured on the device.
  *Developer's answers, 2026-10-15:* no rollback yet ("diagnose and
  test fixes before back tracking"; no one else plays Find the Stars).
  "A restart should always start clean. In fact I would suggest that
  starting any new game clears out any in-progress games. It is one
  app." And "clicking Home should also wipe out current state of any
  one game." So at most one game in progress at a time, and only until
  🏠, another game, or a restart.
- **Q23. No way out of a Find the Stars puzzle.** The play screen has
  only Undo, Hint and Show until the end, and with resume, 🏠 and back
  carries on the same puzzle. The developer tapped every square and
  "could not figure out a way to get out of it". Follow Me has no
  buttons mid-game either (only on Game over), to check.
  *Developer's answers, 2026-10-15:* "Every game should have a 'give up'
  or 'start again' option", and 🏠 wipes the game (Q22). Also: "with
  Find the Stars I was surprised that filling the grid did not just end
  the game with 'you lose' or something semantically equivalent." (The
  other seven games show Play again / New game all through a game; only
  Follow Me and Find the Stars hide them until the end.)
- **Q24. The home page wouldn't scroll to the footer** once: it stopped
  "part way through the last game". Device, app or Safari, and what came
  before not yet known. *Developer, 2026-10-15:* on the iPhone, seen
  once, not since; the log page couldn't be reached, as its link (the
  version line) is at the bottom, where the page wouldn't scroll.
- **Q25. The hint mechanism to be prototyped before publishing again.**
  The developer likes the white hint ✕s but isn't "sure the whole hint
  mechanism is working smoothly". What feels off not yet known.
  *Developer, 2026-10-15:* not sure, as not being able to start fresh
  threw everything off; fix Q22-Q24 first, then prototype the hints.

## Proposed additions to the standards skill

None waiting. (2026-10-14: "A style loaded on every page needs a name
nothing else uses" (from "Find the Stars; one 🏠; Nim's picture fixed")
dropped by the developer: sharing a class name is sometimes right, and
the skill should stay "simple and generic and only add complexity when
it seems re-usable". A CSS-specific case; the lesson stays here, and
`tests/css.test.js` with its list of names meant to be shared keeps
guarding it. Claude's offered one-line addition to the skill's section
8 ("a new principle, or a case of one already here?"): no, for the same
reason.)

Earlier: (2026-10-13: "Time one run before looping over many"
(from "Hidden Faces built") approved by the developer and added to the
skill, section 4; ai-dev-practices commit 4e545f1, zip rebuilt for the
developer to upload.) (2026-10-11: "Derived files come from a tool, and a test
fails when they're stale" (from "The offline app, built") and "Don't
trust a platform's status flag at startup" (from "navigator.onLine at
launch") approved by the developer and added to the skill, sections 3
and 4; ai-dev-practices commit c06e60b. See "The version line always
shows the version".)

Older: (2026-10-09, "Tune by steps big enough to notice": dropped
by the developer, "likely to be very game dependent rather than an
overarching generic rule"; see "Follow Me's home picture on light
tints".)

(The two from 2026-10-07 and 2026-10-08 were approved by the developer
on 2026-10-08; see "Sound sampler v1; face names agreed".)

## Resolved

- **Q21. Find the Stars levels: easier, harder, or both?** *Raised
  2026-10-15* by the developer: what level is it now, and would harder
  mean fewer hints or a harder puzzle? **Measured** (the stock's 200
  per size, solved with the stock's rules, a scratchpad script, 0.7 s):

  | Size | Steps | Single | Inside | Touch | Group | Needing group |
  |---|---|---|---|---|---|---|
  | 6 x 6 | 13.1 | 6.0 | 3.2 | 3.9 | 0.1 | 6% |
  | 7 x 7 | 15.4 | 7.0 | 3.7 | 4.5 | 0.2 | 16% |
  | 8 x 8 | 16.6 | 8.0 | 3.9 | 4.5 | 0.2 | 19% |
  | 9 x 9 | 19.6 | 9.0 | 3.9 | 6.2 | 0.6 | 43% |
  | 10 x 10 | 21.2 | 10.0 | 4.0 | 6.5 | 0.7 | 53% |

  (Averages per puzzle. Every star is placed by a "single" step; the
  rest are steps that rule squares out.) Steps beyond "single" per
  puzzle range 4 to 30 within a size, so puzzle 1 and puzzle 2 of one
  size can differ a lot. **No puzzle needs "try it"** (a star here,
  follow the simple rules, something runs out); the solver has it for
  hints only, and Why? has no picture for it yet. So today is one middle
  level, and size is the only dial. Claude's view: levels should change
  the puzzle, not the help (hints and hearts are how you learn and
  recover; a few fewer is a small change in feel, not in thinking).
  *Resolved 2026-10-15:* no levels for now. The developer: "I don't
  think I need a hard level. I don't want any puzzle that requires a
  guess." Hard would have meant puzzles needing "try it", which plays
  like a guess, so it's out. Today's stock already holds to that:
  `problems()` checks each stock puzzle with the stock's rules
  (`MAKE_LEVEL` 3, no "try it"), and the stock test runs it on all 1000.
  Easy not asked for.

- **Q20. Back on the home page after switching apps: avoidable?**
  *Raised 2026-10-15:* in the installed app on the developer's phone,
  switching to another app and back sometimes lands on the home page,
  even from the middle of a game. Claude's reading (not yet confirmed
  on the device): the phone closed the backgrounded app to free memory,
  and an installed app reopens at its start page (`start_url: "./"` in
  `manifest.webmanifest`); nothing in our code goes back home
  (`src/ui/offline.js` logs a new version taking over but never
  reloads). Evidence to get: the debug log just after it happens, where
  a fresh home-page heading at the return time means a relaunch. Not
  inevitable, two separate fixes: reopen the last page (remembered on
  the device), and resume the game itself (each game saves its state as
  it goes; none does now; Find the Stars keeps only the next puzzle and
  best times).
  *2026-10-15, the developer on the iPhone:* the log "does seem" to show
  a restart (hard to read: "a lot of stuff there"). **What brings it
  back decides it:** chosen from the app switcher (swipe up from the
  bottom), the game is where it was left; tapped on its home-screen
  icon, it starts over on the home page. So the phone hadn't closed it
  for memory (Claude's first reading, wrong): a tap on the icon opens
  the start page, which our page can't stop. The fix is still the two
  above; reopening the last page alone would land on that game's setup
  screen, since the icon's tap reloads.
  *2026-10-15, the developer:* both fixes, **for all the games**: "To
  do otherwise is an unusual experience compared to other apps on a
  phone. If you do not explicitly close them, you always come back to
  where you left off."
  *2026-10-15:* built for all ten games and checked in the browser (see
  "Coming back to a game, built"); to try on the iPhone once published.
  *Resolved 2026-10-15:* on the iPhone after the publish, the developer:
  "It looks good on my phone." (Claude's note on the version line was
  wrong: it shows the version's first 6 characters, "45db80", as
  designed, not all 12.)

- **Q19. Which deeper explanation for a hint?** *Raised 2026-10-14:*
  the developer found the reasoning of some hints hard to follow ("it
  would rule out the last options for a row or column" when other
  squares looked left). *Resolved 2026-10-14:* both a picture on the
  board and a line of words ("Do both ... Make a mockup first"); mockup
  v1 agreed ("This is good. Build and publish."). See "Why? built".

- **Q18. Which other emoji does Chrome on the Linux VM draw wrong?**
  *Raised 2026-10-14:* the 🏠 drew as a purple building and 🔊 as an
  outline (no colour emoji font). *Resolved 2026-10-14:* after the 🏠
  became a picture and the publish, the developer tested on the VM with
  no emoji font installed: "they all look good now". No other change.
  (Not explained: why the other emoji drew well while the 🏠 didn't;
  not chased, as nothing the developer sees is wrong.)

- **Q17. Matching's 5 x 6 on a phone, with the 80 px 🏠?** *Raised
  2026-10-14:* in the built-in browser at 393 x 760 the 5 x 6 grid fit
  with 59 px cards while the 🏠 was one card; with the 🏠 at 80 px even
  the smallest cards (56 px) didn't fit, and the page scrolled a little.
  *Resolved 2026-10-14:* on the developer's phone it doesn't scroll ("I
  do not see any scrolling on my phone"). The emulated 393 x 760 is not
  the phone's real page height; no change.

- **Q16. "Replay" after running out of hearts?** *Raised 2026-10-13:*
  the developer suggested a "replay" button instead of forcing a new
  game. *Resolved 2026-10-13:* the out-of-hearts end already has **Try
  again** (the same puzzle from an empty board); the developer: "Try
  again is what I meant, I missed it." No change.

- **Q15. Should Undo work after a slip ends the game?** *Raised
  2026-10-13:* the third wrong look ends the puzzle and the end screen
  has no Undo, so a slow slip on the last heart can't be taken back (a
  double tap no longer can cause it). *Resolved 2026-10-13:* the
  developer: "OK as it is." Losing on the third mistake stays; a
  "replay" idea followed (Q16).

- **Q14. Does the double-tap zoom fix work on the iPhone?** *Raised
  2026-10-13:* Hidden Faces zoomed in on two quick taps; fixed by
  cancelling `touchend` on the board (see "Hidden Faces: no zoom on two
  quick taps"). Only a real iPhone can show it; the developer checks
  after it's published.
  *Resolved 2026-10-13 (developer, on the iPhone, live site with
  be4b75e):* "I am no longer seeing zooming."
- **Q13. Play offline, as an installable app?** *Raised 2026-10-10
  (developer):* the kids' phones have no cellular plan, only home wifi;
  could they play in the car? Opening `index.html` from disk doesn't work:
  the pages load their code as ES modules, which Chrome and Edge refuse
  from `file://` (and Five Dice's `fetch` of its 1 MB data file too).
  Options laid out in chat: one standalone file per game (fine on
  computers, not on iPhone/iPad) or an installable web app (PWA: a
  manifest plus a service worker that saves every game on the first visit
  with a connection). Developer chose to explore the PWA. Facts given:
  no Apple or Google developer account or fee; installed from the browser
  (iPhone: Safari, Share, Add to Home Screen; Android, Windows, Mac,
  Linux: the browser's install button); works offline on all of them;
  installed apps keep their own storage (sound setting, log) apart from
  the browser's; offline plays aren't counted in the stats.
  2026-10-10, developer: the app's name "Let's Play!" or "Game Corner"
  ("Web Games" is dull); no idea for the icon, wants suggestions. Icon
  mockup: see "App icon ideas". 2026-10-10, developer: "happy bear icon
  with Let's Play!". Built on branch `offline-app` ("The offline app,
  built"). Published 2026-10-10 (developer: "Publish and I will phone
  check"); checked by the developer on an iPhone (see "The offline app
  on the developer's iPhone"): installs, plays offline, updates itself
  (version line, 2026-10-11); iOS's airplane-mode alert at launch is
  its own and stays (see "The alert is iOS's own"). **Resolved
  2026-10-11:** the developer's Samsung Galaxy Tab (Android): "it works
  good", the install went well, no errors starting with wifi off.

- **Q12. Track how the sites are used?** *Raised 2026-10-10
  (developer):* which games are played and from where (totals, a chart
  over time); for GP-200 Patch Manager Web, which features are used.
  Both sites' DESIGN.md say nothing is loaded from other sites, and the
  games' also "no tracking", so any counter changes an agreed decision.
  Options laid out in chat: GitHub's own (nothing for Pages sites), the
  games' on-device log (no change), a cookieless counter (GoatCounter or
  similar), our own counter on a free serverless host, Google Analytics
  (not recommended: cookies and a children's site).
  2026-10-10, developer: one stats page per site is fine, linked from
  each footer; no paid service. Checked: goatcounter.com is "offered for
  free for reasonable public usage" (donation-supported, no paid plans,
  no cookies); its "Dashboard viewable by" setting includes "logged in
  users or with secret token" (help page "Embed GoatCounter in a frame").
  Proposed: our own few lines send the count (no outside script), the
  footer links to the GoatCounter dashboard. *Resolved 2026-10-10
  (developer):* "Yes, go ahead with GoatCounter; make the stats public."
  One account; a separate site for each website. Built for the games:
  see "Stats with GoatCounter".
- **Q11. Sound in all the games?** *Raised 2026-10-08 (developer):* no
  game has sound for turns, wins or losses; add it everywhere, with a way
  to turn it off and on? Sampler v1 heard and picked (2026-10-09); built
  on branch `sound` ("Sound in all eight games", 2026-10-09). **Resolved
  2026-10-09:** published, and the developer, having heard it: "Sounds
  are good".
- **Q10. Names for the faces?** *Raised 2026-10-08 (developer, while Nim
  was being built):* only the robot has a name; give each face one?
  Either a fixed name that fits the face ("Froggy"), or names people
  type for the faces they pick (nice, but more tedious to start a game).
  Across all the games, so a separate change after Nim. **Settled
  2026-10-08 (developer):** "faces should have names", **fixed** ones, and
  no renaming ("not sure optional rename is worth the complexity"). The
  list is Claude's draft in "Sound sampler v1; face names agreed"; the
  girl and boy faces' names still to choose.

- **Q9. Two tabs at once overwrite each other's log lines.** *Raised
  2026-10-07 (the developer asked whether logs are separate per
  computer).* Each tab saved its whole copy of the log, so with two tabs
  of the site open in one browser the last to save won and the other's
  newest lines were lost (read from the code, then shown by a test). Also
  asked: automatic clearing. **Resolved 2026-10-07:** the developer: fix
  the two tabs ("unlikely ... but worth doing to avoid any confusion");
  clearing: "leave it" (3000 lines, no clearing by age). Entry "Two tabs
  share the log".

- **Q8. The debug log off the game screen?** *Raised 2026-10-07 (entry
  "Status", after the score cards).* The developer didn't know about
  `?dev`; the panel doesn't belong on the screen, maybe a "log" concept
  instead. Claude proposed: keep the log on the device, a separate page
  to view and save it, no panel on the games. **Resolved 2026-10-07:**
  the developer: "Yes, build it, address only" (entry "The debug log
  moves to a log page").

- **Q7. The name of the Yahtzee-style game.** *Raised 2026-10-06 (entry
  "All games checked; next game idea: Yahtzee").* Not "Yahtzee" (Hasbro's
  trademark). "Five Dice" is Claude's working name, used in the mockups;
  the developer hasn't said yes or no. To settle: the developer's pick
  (it's the page title, the home-page button and `five-dice.html`).
  **Resolved 2026-10-06:** the developer: "Five Dice is fine for the
  name".

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

## 2026-10-06: All games checked; next game idea: Yahtzee

**Checked by the developer:** "All games tried an working" (2026-10-06):
Snakes and Ladders, rock paper scissors and the gentler Count to 9 robot
included. Not recorded: which devices and browsers (Safari, Android).

**Next game idea (developer):** Yahtzee, "it seems like it could be a
good fit". Claude's first thoughts, for the developer to decide:

- A good fit for the site: five dice reuse Snakes and Ladders' die, and
  the setup (Me and the robot / Two players / Just me), faces, scoreboard
  and cheers carry over. It would go in 👥 Two players.
- The full game is a lot for ages 5-7: 13 boxes with names to read,
  adding up dice, and choosing where to score. Simpler: the screen does
  all the adding; each empty box shows what this roll would score there;
  pictures instead of names; maybe a shorter game.
- A full scorecard for two players has 13+ rows: hard to fit on a phone
  with no scrolling, so a mockup first.
- "Yahtzee" is Hasbro's trademark; the site should use its own name
  (e.g. "Five Dice"), a free name for the same game.

## 2026-10-06: Five Dice (Yahtzee-style) mockup v1

**The developer:** a Yahtzee-style game; on Claude's three choices (full
13 boxes, a short 7-box game, or both as a choice like Count to 9's "How
hard?"): "If it fits, it is worth trying" (both).

[Five Dice Mockup](https://claude.ai/artifact/JJKuS2fc4kpTo7YDdDDWKk)
(private Claude artifact, version 1). Built from the real faces, the
Snakes and Ladders cube die and the site's CSS (`site.css`, `game.css`)
by a script in Claude's scratchpad.

- **Setup:** Count to 9's (Just me / Me and the robot / Two players, face
  pickers, who goes first), with **How long?**: 🎲 Short (7 boxes,
  default) or 🎲🎲🎲 Long (13 boxes).
- **Play screen**, top to bottom: 🏠 and the words; five dice and a
  yellow **Roll** button (three dots: rolls left); the score sheet; the
  dark scoreboard (points this game, games won); Play again / New game.
- **A turn:** the dice wait as cubes in the player's colour; up to 3
  rolls; tap a die to keep it (it lifts, tinted the player's colour).
  After each roll, every empty box in that player's column shows what it
  would score (faded, outlined); **tap once** to see "25 here? Tap
  again", **tap again** to put it there. Five the same: the dice wiggle.
- **The screen does all the adding**; no words on the sheet, pictures
  only: a die for 1s-6s; 3 dice for 3 the same, 4 for 4 the same; 3 + 2
  dice under a roof for a full house; dice as stairs for 4 and 5 in a
  row; 5 dice and a star for 5 the same (50); a "?" die for anything.
  Tapping a picture says what it is on the turn line.
- **Short:** 1s-6s and 5 the same, in one panel. **Long:** two panels
  side by side, 1s-6s plus a bonus row (a bar filling towards 63, then
  ⭐35) on the left, the other 7 on the right.
- **Just me:** points and the best per length (🏆), "101 points! Your
  best!".
- **The robot:** keeps its most common number (or a run, if a run box is
  open), stops early for a big box, puts a roll where it scores most for
  the least waste; 20% of the time keeps a random number or takes its
  second choice, so it's beatable.
- **Left out:** extra 5-the-same bonuses and "joker" rules.
- **Mockup only:** a "Next roll" menu (five the same, runs, full house,
  4 the same) and "Skip to the last box".

**Checked in the built-in browser** (the scratchpad copy on port 8124):
393x659 (iPhone 16 in Safari, assumed): short and long both fit with
no scrolling (rows 40 px, dice 48 px, page bottom 644-647 of 659);
1024x768: rows 53, dice 64, bottom 749 of 768. A whole short game against
the robot (a script playing the bear): every box filled, 48-40, "wins!",
the bear's scorecard cheering, the robot "aww", games won 1-0. Forced full
house: kept dice 1 and 3, "25 here? Tap again", the second tap scored 25,
then the robot's turn. Long, Just me, skipped to the last box, forced
five the same: only "anything" open, 20 points, "101 points! Your best!",
best 101; the bonus bar at 37 of 63. Fixed on the way: the page was too
tall (the sizing ran before the sheet was drawn); dice drawn blank (a
padding of 7% is of the tray's width, not the die's: 50 px of padding on
a 48 px die); scores not centred in filled boxes. No console errors.

**For the developer to check:** the two taps to score; pictures instead
of words; the bonus row in the long game only; short as the default; the
name ("Yahtzee" is Hasbro's trademark; "Five Dice" for now).

## 2026-10-06: Five Dice mockup v2

**The developer** on v1: (1) "I picked 'short' but the game play mockup
still showed 13 slots to score"; (2) after the first roll it wasn't clear
whether tapping a die meant "keep" or "roll again": "selecting the die to
roll again is more intuitive ... if you were playing with physical dice,
the ones you roll again are the ones you pick up"; (3) "who goes first"
isn't relevant to this game.

**(1) Not reproduced.** In the scratchpad copy, Short gave 7 picture rows
(and 14 boxes against the robot: 7 per player) every way tried: Short
straight away; Long, then New game, then Short; Play again; Two players.
Long gave 14 rows (13 boxes + the bonus row). A first try with real
clicks went wrong because of the test, not the page: the click meant for
Short landed on "Winner goes first" after the page scrolled. Asked the
developer what they saw. Meanwhile the scoreboard now says "Short" or
"Long" under "Points".

**Changed (v2, same link):**
- **Tap a die to pick it up and roll it again** (it lifts off the
  table, tilts, and turns the player's colour; tap again to put it back).
  Dice not tapped stay where they are. The first roll rolls all five;
  after that **Roll** is greyed until at least one die is picked up. The
  words: "Pick a box, or tap dice to roll again", then "Roll those 2?".
  The robot shows the dice it picks up ("Rolls 3 again") before rolling.
- **No "Who goes first?"**: players take turns starting each game, with
  player 1 starting the first.
- **The robot played badly in a test game** (zeros in five of its seven
  boxes): it kept its most common number even when that number's box was
  already filled. Now it keeps a number whose box is still open (any
  number, for 3/4/5 the same). Its choice is now a function apart from
  the screen (`robotPlan`), so it could be simulated: 2000 games each
  against a simple player (keep the most common number, take the biggest
  score):

  | Game | Robot, mean (10%-90%) | Simple player | Robot wins |
  |---|---|---|---|
  | Short, sloppy 20% | 56 (36-97) | 58 (33-97) | 49% |
  | Long, sloppy 20% | 177 (127-229) | 145 (99-192) | 73% |
  | Long, sloppy 35% | 159 | | 60% |
  | Long, sloppy 50% | 141 | | 48% |
  | Long, sloppy 70% | 116 | | 29% |

  ("Sloppy": how often it keeps a random number or takes its second-best
  box.) Now 20% in the short game and 50% in the long one.

**Checked in the built-in browser** (393x659): first roll all five;
Roll greyed with nothing picked up (a tap left the rolls at 1); dice 2 and
4 picked up, "Roll those 2?", the second roll changed only those two (the
other three the same); a whole short game against the robot (a script
playing the bear) with the robot picking up dice ([true, true, false,
false, true] seen) and finishing; long game skipped to the last box,
finished, Play again → the robot starts ("is thinking..."); the setup
screen's panels: Who's playing?, faces, How long?; page bottom 644 of
659. No console errors.

## 2026-10-06: Five Dice mockup v3

**The developer** on v2: tapping a box twice "feels tedious"; Roll with
nothing picked up could roll all five; "both changes could allow
accidental mistakes ... we could add an undo. Thoughts?" Claude: Undo for
scoring (it changes no dice, so it can't be used to cheat), but not for a
roll (undoing a roll after seeing the new dice is a free extra roll);
instead Roll with nothing picked up lifts all five and asks. The
developer: "I like both suggestions", and: the robot "makes decisions too
fast. A bit more of a pause and making visible robot's selections for
re-roll would make it more human like".

**Changed (v3, same link):**
- **One tap scores.** For 3 s (`UNDO_MS`) the Roll button becomes
  **↩ Undo**, with a bar along its bottom running out; Undo takes the
  score back out and the turn carries on; otherwise the turn passes.
- **Roll with nothing picked up** lifts all five ("Roll them all?"); a
  second Roll rolls them; tapping a die first puts it back.
- **A slower robot** (`ROBOT.wait`): 1.2 s before its first roll, 1.6 s
  looking at each roll, then **picks up its dice one at a time** (0.5 s
  apart, "Rolls 2 again"), 0.9 s, rolls; shows its box pulsing for 1.6 s
  ("8 here") before scoring; 1.5 s before the next turn.

**Checked in the built-in browser** (393x659): first Roll rolled all;
Roll with none up: all five lifted, "Roll them all?", rolls still 1; die
1 put back, Roll: die 1 unchanged (5 → 5); one tap on a box scored it
("Zero this time"), Undo shown; Undo: the box empty again, Roll back,
"Pick a box, or tap dice to roll again"; scoring again without Undo: the
robot's turn 3.4 s later. A robot turn, timed by script (the pane hidden,
so timers may run late): roll 2 at 0.2 s, "is thinking..." to 2.5 s,
dice lifted at 2.5 s and 2.9 s, rolled at 3.9 s, thinking to 6.0 s, box
shown "8 here", scored at 7.7 s. No console errors.

## 2026-10-06: Five Dice mockup v4

**The developer** on v3: "Short game is great. Long game, some of the
symbols for scoring are confusing. Maybe make the icons themselves
clickable and they pop up a short explanation of what they mean?" (v3
already put a line of text on the turn line when a picture was tapped:
easy to miss, and it replaced the turn's words.)

**Changed (v4, same link):** tapping a picture opens a **pop-up** under
its row (above it when there's no room below): the picture bigger, a
title ("Full house"), the rule in a few words ("3 the same and 2 the
same. Always 25."), an example roll in dice with its score ("= 25"), and,
on your turn after a roll, **"Your dice now: 25"**. The bonus shows each
player's 1s-6s total "of 63". While it's open, a tap anywhere only closes
it (it can't also score a box or roll); a tap on another picture shows
that one; a new turn closes it.

**Checked in the built-in browser** (393x659, long game): full house
after a forced full house: "Full house | 3 the same and 2 the same.
Always 25. | = 25 | Your dice now: 25"; "5 in a row" (row 5) shown above
its row, "anything" (row 7) above; with the pop-up open, a tap on a box
closed it and scored nothing, a tap on Roll closed it and lifted no dice;
bonus: "0 of 63" for each player. No console errors. Fixed on the way:
the pop-up was centred with a CSS transform, which its pop-in animation
replaced, shifting it right. (Measuring the pop-up by script gave 186 px
wide, not 310: the pane doesn't run CSS animations while hidden, so it
stayed at the animation's starting 60% size; the screenshot showed it at
full size. A finding about the pane, not the page.)

## 2026-10-06: Five Dice mockup v5

**The developer** on v4: "a tap anywhere does not close the pop-up. It
has to be a tap inside the pop-up." Either make "anywhere" true, or add a
close button.

**Likely cause (not confirmed):** the developer's device wasn't recorded.
v4 closed the pop-up on `click`. iOS Safari doesn't send a click for a
tap on a plain part of the page (one with no click handler and no
pointer cursor), so only taps on buttons would close it. On a computer,
a click on the empty page did close it (checked in the pane before the
change). Asked the developer which device it was.

**Changed (v5, same link):** the pop-up closes on `pointerdown` (sent for
a touch anywhere, iOS included), and the click that follows is swallowed,
so the tap that closes it does nothing else. Plus a round **✕** button in
its top-right corner.

**Checked in the built-in browser** (393x659, simulated touches:
pointerdown, then click): a touch on the bare page closed it; a tap on a
box closed it and scored nothing; ✕ closed it; a tap inside closed it; a
tap on another picture switched to it ("4 in a row"); with it closed, a
tap on a box scored. A real click on the empty bottom-right corner
(BODY) closed it. Not checked: an iPhone or iPad (the pane is Chrome).
No console errors.

## 2026-10-06: Mockup agreed; v5's "likely cause" was wrong

**The developer:** "I was just clicking your sim inside the Claude app
on my computer. I was not even in a browser. Maybe best to push the game
and I'll test in a browser on my computer and phone." So the pop-up that
only closed from inside was in the Claude desktop app's artifact viewer
(the page in a frame of the app's), **not iOS Safari**, as the v5 entry
guessed. Why a click on the empty page didn't reach the page's handler
there is unknown: in the built-in browser (Chrome) it did. v5 closes on
`pointerdown` anyway; the real game is to be checked in the developer's
browsers, computer and phone.

**Agreed:** mockup v5 is the design (the developer: build it and publish
it for testing on their computer and phone). Written up in `DESIGN.md`,
"Five Dice".

## 2026-10-06: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with six games,
unchanged today. Working branch `home-groups`; `main` is at `6c6f602`
(the last publish); this branch has only journal and `DESIGN.md` commits
since.

**Known:** `npm test` 113 of 113 (not re-run today: no code changed).
The developer has played all six games: "All games tried and working".

**Next: build Five Dice** from `DESIGN.md` "Five Dice" (mockup v5),
then publish it: the developer asked for it to be pushed to the live
site so they can test it in a browser on their computer and phone
("Maybe best to push the game and I'll test"). As before: rules in
`src/core/five-dice.js` (the boxes and their scores, the bonus, a turn's
rolls and picked-up dice, the round and match, the robot's choice as a
pure function, `ROBOT` tuning), screens `five-dice.html`,
`src/ui/five-dice.js`, `css/five-dice.css` (dice drawn with
`dotsSvg`/`cubeSvg` from `src/ui/snlart.js`), a home-page button in
the two-player group, tests (scores per box with edge cases, the bonus at
62/63, rolls left, the robot never picking a filled box, whole simulated
games finishing, the robot's win rate against the simple player in its
agreed range), debug log category, every pending step a tracked timer.

**The mockup's code** is the best reference for the screen: its
scratchpad builder is gone with this session, but the published page can
be read with the Artifact tool (`action: "read"`,
https://claude.ai/artifact/JJKuS2fc4kpTo7YDdDDWKk). It's a mockup:
one file, no debug log, no tests; it has a "Mockup only" strip to leave
out.

**Open questions:** none. Q7 (the name) resolved: "Five Dice".

**Testing notes:** the built-in browser runs no CSS animations and slows
timers while its pane is hidden: an element measured mid-animation (the
pop-up at 60% of its size) or a robot turn taking longer is the pane,
not the page; check by screenshot, or by state rather than timing.

## 2026-10-06: Five Dice built (from mockup v5)

**Built** from `DESIGN.md` "Five Dice" and the mockup's code (read back
from the artifact). Rules in `src/core/five-dice.js` (scoring, the bonus,
a turn's rolls and picked-up dice, scoring with Undo, the end of a game,
the robot's choice `robotPlan` as a pure function, `ROBOT_TUNING`);
screens `five-dice.html`, `src/ui/five-dice.js`, `css/five-dice.css`;
the box pictures and pop-up words in `src/ui/fivedice-pics.js` (shared
with the home page); dice from `dotsSvg`/`cubeSvg` (`src/ui/snlart.js`).
Home page: a button in 👥 Two players, after Snakes and Ladders (a full
house of dice and the smiling bear). Debug log category `dice`; every
pending step is a tracked timer (Play again / New game cancel them).

**Changes from the mockup, and why:**
- **Names:** the mockup's `ROBOT` object is split: `ROBOT_TUNING.sloppy`
  in the rules (as in Connect Four and Count to 9; `ROBOT` is already the
  robot's face name in `players.js`) and `ROBOT_WAIT` (the robot's pauses)
  in the screen code, since timing is the screen's job. Same values.
- **Undo is in the rules**: after scoring, the turn waits
  (`match.scored`) until the screen calls `endTurn` after 3 s; `undo`
  takes the box back out. So "one box a turn" and "no roll after
  scoring" are tested, not only drawn.
- **Shared CSS:** the three-way "Who's playing?" and the two-choice
  panel (`.modes.three`, `.levels`) moved from `count-to-9.css` to
  `game.css`, now that two games use them (unchanged rules; Count to 9's
  setup checked after: 3 equal columns, 2 equal columns, the yellow
  border on the picked level).

**Tests:** `tests/five-dice.test.js`, 16 tests: each box's score with
edge cases (a repeat inside a run, 5 the same isn't a full house, 4 the
same is also 3 the same), the bonus at 62/63 and long only, a turn's
rolls (first roll all five, then only the picked-up dice; none picked up
refused; 3 rolls is all), one box a turn, Undo, the turn passing, whole
games finishing (200 short and 200 long, every box filled, points add
up, starters 1, 2, 1, 2), a tie, Just me and the best, Play again
mid-game, the robot never picking a filled box or rolling nothing (5000
random states), and its win rate. `tests/pages.test.js` now expects
`five-dice.html` and its place on the home page. Suite: **129 of 129**
(113 before).

**The robot's win rate**, against the simple player (keep the most
common number, the higher on a tie; use all 3 rolls; take the biggest
score), 2000 games each, measured by a scratchpad script with the same
code as the test:

| Robot | Short: robot wins | Long: robot wins | Means (robot / simple) |
|---|---|---|---|
| Agreed (sloppy 0.2 / 0.5) | 50.4% | 46.5% | 54/57 short, 141/144 long |
| Never sloppy | 68.0% | 87.1% | 68/58, 208/146 |
| Always sloppy | 1.8% | 4.3% | 18/56, 79/145 |

Close to the mockup's 49% / 48%. The test's range, 38-62%, fails for
both broken tunings, so the check can fail. Ties: 2.3% (short), 0.8%
(long).

**Checks can fail:** before the home-page button was added, the pages
test failed twice ("home has no button for five-dice.html", and the
groups), with `five-dice.html` already in the folder.

**Checked in the built-in browser** (`npm run serve`, port 8123; by
script, the pane was hidden so no screenshots):
- 393x659 (iPhone 16 in Safari, as for the mockup): long game, rows 40
  px and dice 48 px, page height 659 of 659 (no scrolling); short game
  with two players the same sizes and height. Same as the mockup.
- Me and the robot, short: first Roll rolled all five; 2 dice picked up
  ("Roll those 2?"), the second roll changed only those (the other three
  the same); Roll with none up: all five lifted, "Roll them all?", rolls
  still 2; one put back ("Roll those 4?"); one tap scored ("Zero this
  time"), Undo shown; Undo emptied the box, Roll back; scored 12 in the
  6s; 3 s later the robot's turn. The robot (debug log): rolled
  [2,5,4,6,5], kept the 5s, rolled 3 dice, kept the 5s again, scored 15
  in the 5s after its third roll, turn back to the bear.
- The pop-up (pointerdown, then click, as a touch sends): opened on "5
  the same" with "Your dice now: 0"; another picture switched it; a tap
  on a box closed it and scored nothing; a tap on Roll closed it, no
  roll, no dice lifted; ✕, the bare page, and inside it each closed it;
  with it closed, a box scored.
- Just me, long, a whole game: 66 points, "best 66", 14 rows in two
  panels with the bonus row; Play again: a fresh game keeping the best.
- Me and the robot, a whole short game (a script playing the bear badly):
  robot 50, bear 25, "wins!", the robot's scorecard face cheering and the
  bear's "aww"; after the cheer the faces stayed so; games won 1; dice and
  Roll disabled; nobody outlined.
- Two players: "Player 2 needs a face." until picked; the turn passes to
  player 2 (blue).
- No console errors on the home page or the game.

**Not checked:** a real phone or tablet, Safari (the pane is Chrome),
and how it looks (no screenshot while the pane was hidden). The
developer asked to test it on their computer and phone once published.

**Published** (developer: "yes, publish it"): `main` fast-forwarded to
`2fabc68`; Pages build "built 2fabc68"; the new and changed files all
200, and the home page links to `five-dice.html`. Live site in the
built-in browser at 393x659: Play!, Roll: five dice, 7 boxes offered,
rows 40 px, dice 48 px, page height 659 of 659; no console errors.

## 2026-10-06: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with seven games,
Five Dice included (published 2026-10-06, `main` at `2fabc68`).
Working branch `home-groups`, level with `main` but for this journal
entry.

**Known:** `npm test` 129 of 129. Five Dice checked in the built-in
browser, locally and live (entries above), not on a phone or in Safari.

**Next:** the developer tests Five Dice on the live site, on their
computer and phone, and brings the feedback to a new session. Read
"Five Dice built (from mockup v5)" for what was checked and how.

**Open questions:** none.

**Testing notes:** the built-in browser runs no CSS animations, slows
timers and can't take screenshots while its pane is hidden; check by
script (state, not timing). Its viewport size isn't applied until a page
loads after resize_window (a check right after showed 1280x720). The
browser tool gives up after 45 s, but a page script keeps running: start
a long check (a whole game) without waiting, then read the result.

## 2026-10-06: Five Dice: the robot plays its best; pop-up closes with ✕ only

**The developer's feedback** (live site, computer and phone): "looks
pretty good". Two things:
1. The robot made silly moves: with five 3s it took 15 in the 3s, not 50
   in 5 the same. The developer: the robot should make the best move;
   most of the game is luck, and better robot play helps teach strategy.
2. The pop-ups say "Tap anywhere to close", but for the developer they
   only closed on a tap on the pop-up itself. The developer: drop the
   words, keep only the ✕.

**1. Why the 15:** not a bug, the agreed tuning. `ROBOT_TUNING.sloppy`
had the robot take its second-best box 20% (short) / 50% (long) of the
time. Measured: `robotPlan([3,3,3,3,3], 1, ['3','five'], ...)` took the
3s in 202 of 1000 calls (short) and 491 of 1000 (long).

**The fix: the best play, worked out exactly**
(`src/core/five-dice-best.js`, replacing `robotPlan`, `ROBOT_TUNING` and
`waste` in `src/core/five-dice.js`). "Best" = the most points on average
over the rest of the game. Going backwards from a full card, each card's
value (boxes filled; in the long game, the 1s-6s total capped at 63 for
the bonus) is worked out from the cards after it. A turn's choices
(which dice to keep, which box) then come from a small calculation over
the 252 rolls of five dice. Short game: 128 cards, 16 ms, worked out on
the spot. Long game: 8192 x 64 cards, 19.5 s in Node, so
`tools/five-dice-table.js` saves them once as `data/five-dice-long.bin`
(16-bit hundredths, 1 MB; 444 KB gzipped). The screen loads it when a
long game against the robot starts: 184 ms locally. Until it's loaded the
robot waits; if the load fails it plays for the most points each turn
(logged).

**Checked against the real thing:** James Glenn's published average for
the best play without the extra-Yahtzee bonus is 245.87 (found by web
search, 2026-10-06: Glenn, "Computer Strategies for Solitaire Yahtzee",
2007). Our long game (the same rules: no extra-5-the-same bonus, no joker
rules) gives 245.8708. Short game: 70.41 (no published figure; checked by
simulation below).

**Tests** (`tests/five-dice-best.test.js`, 8 tests): 3000 short games
average 70.41 within 3 standard errors, and 1000 long games average
245.87 within 3 standard errors. The saved file is checked against the
rules: 300 random cards, each saved value against one worked out again
from the saved values after it (within 0.011). The check fails on a value
nudged by 0.05. Five 3s go in 5 the same, on every roll and in both
lengths. It never picks a filled box or rolls nothing, and refuses bad
input. The stand-in is used before the long values load. It beats a
simple player more often than not. The three old robot tests are gone.
`npm test`: 134 of 134.

**What the best play means for the kids (measured, 1000 games each,
against the "simple player": keep the most common number, use all 3
rolls, take the biggest score):**

| | Robot average | Simple player average | Robot wins |
|---|---|---|---|
| Short | 71.3 | 58.2 | 69% (ties 1%) |
| Long | 244.0 | 151.5 | 93% |

The old robot was tuned to about 50% against this player. In the short
game luck still counts for a lot. In the long game play counts for most
of it: a child playing like the simple player would win about 1 game in
14. (The test run's own seed gave 72% and 96%.)

**Checked in the built-in browser** (local, `?dev`). In a long game the
log shows `robot values loaded {"bytes":1048576,"ms":184,"gameWorth":
"245.87"}`. The robot's first turn: it kept the 4s twice and scored
4 4 4 5 4 as 16 in the 4s (the plan's `worth` is in the log). No console
errors.

**2. The pop-up:** couldn't reproduce the problem first. In the built-in
browser (local, and the live site's `five-dice.js`, fetched: byte for
byte the same), a real click on the empty page closed the pop-up
(`pop-up closed {"why":"tap"}`). So why it didn't close for the
developer is unknown. It no longer matters: as the developer asked, the
"Tap anywhere to close" line and the page-wide tap handler are gone, and
the ✕ closes it. Checked: a click beside the pop-up leaves it open; the ✕
closes it (`pop-up closed {"why":"✕"}`); the words are gone.

**The developer, after the fix:** the two kinds of silly move they saw
(the fewest points for a roll; rolling all five with three 4s) "seem like
bugs or throwing the game", and should never happen; subtler mistakes
that lower the average would be fine. Both came from the old `sloppy`
randomness, now gone. The best play does sometimes look similar but is
right. Measured over 500 solo games each (scratch script):
- **All five rolled again with 3+ the same:** short 30 of 6934 re-rolls,
  long 58 of 12083 (0.5%), only when no open box wants that number. For
  example 2 2 2 4 4 with only 5s, 6s, 4 in a row and 5 in a row open.
- **Fewer points than the most available:** short 667 of 3500 boxes,
  long 2599 of 6500. For example 6 6 6 3 6 at the start of a long game:
  24 in the 6s, not 27 in 3 the same (towards the bonus). Or 5 6 5 2 1 in
  the short game: 1 in the 1s, not 10 in the 5s (the 1s box is the
  cheapest place for a poor roll).
Robot strength stays at its best (developer: "Commit the changes and
publish"). If the long game proves too hard, weaken it with close
second-best choices only, never obvious ones.

**Published** 2026-10-06 (developer's OK): `main` fast-forwarded to
`c4eb5a9`. Live check (built-in browser, the live site with `?dev`): the
new `five-dice.js` was served within a few seconds. `data/five-dice-long.bin`
gives 200, 1048576 bytes, first value 24587. In a long game against the
robot, `robot values loaded {"ms":184,"gameWorth":"245.87"}`; the robot
kept 5 5 over two re-rolls and scored 5 6 5 5 1 as 15 in the 5s.

## 2026-10-06: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with seven games.
Five Dice's robot plays its best and its pop-up closes with the ✕ only
(published 2026-10-06). Working branch `home-groups`, level with `main`
but for this entry.

**Known:** `npm test` 134 of 134. The best play is checked against
Glenn's 245.87. Against a simple player the robot wins about 70% of
short games and 93% of long ones (entry above).

**Next:** the developer tests Five Dice again on the live site and brings
the feedback. Watch for whether the long game is too hard for the
grandkids. If it is, weaken the robot with close second-best choices
only, never obvious ones (developer). If the developer reports an
odd-looking robot move, ask for the `?dev` log: each `robot plan` line
has the dice, open boxes and choice, so it can be checked against the
best play.

**Open questions:** none. (Why "tap anywhere to close" didn't work for
the developer was never found; the feature is gone.)

**Testing notes:** GitHub Pages serves files with `Cache-Control:
max-age=600`, so for up to 10 minutes after publishing a browser can
keep the old version (2026-10-06: the developer still saw "Tap anywhere
to close" right after publishing; the live `five-dice.js` was already
new, checked with curl). After each publish, tell the developer: Ctrl+F5
on a computer; on a phone wait 10 minutes, then close the tab and reopen.

## 2026-10-06: Five Dice: the robot lifts all five at once

**The developer** (live site, after the fix): the robot plays much
better and the pop-ups are fixed. One detail: a person rolling all five
again sees them lift at once, but the robot lifted them one at a time.
Make the two look the same.

**Done:** when the robot's plan is all five, it picks them all up at
once (`pickUpAll`, as a person's Roll with none picked up) and rolls
0.9 s later (`ROBOT_WAIT.roll`). Fewer than five are still lifted one at
a time, 0.5 s apart.

**Checked** in the built-in browser (local, `?dev`). A script played my
side and restarted games, and a MutationObserver recorded the number of
lifted dice. It ran until the robot re-rolled all five (about 1 robot
turn in 12 in the short game, measured by simulation: 172 of 2100
turns). The log showed `robot plan {"dice":[3,5,4,5,1],"rolls":1,"plan":
{"up":[true,true,true,true,true]}}`. The observer saw lifted dice go
0 → 5 in one step, back to 0 at the roll 0.9 s later, twice in that
turn. Three-dice re-rolls: 1, 2, 3 about 0.5 s apart, as before.
`npm test` 134 of 134 (the screen's timing has no unit tests; the rules'
`pickUpAll` does).

**Published** 2026-10-06 (developer's OK): `main` at `1006ba2`; the live
`five-dice.js` had the change about 27 s after the push (curl).

## 2026-10-06: Five Dice checked again; rolls-left words not wanted

**The developer** (live site): "Everything is good." They asked whether
to show which roll it is or how many are left. The Roll button's three
dots already do (one greys per roll used); the developer hadn't noticed
them. Proposed: words in the turn line ("2 more rolls…"), or a number on
the button. The developer: "fine the way it is" (no change). They also
asked whether scoring before the third roll passes the turn: yes, after
the 3 s Undo (`endTurn`), and unused rolls are lost. Playing alone, a
new turn starts.

## 2026-10-07: Five Dice: one score card at a time

**The developer:** the play is good, but on a phone the long game's score
sheet is hard to see and tap, and it's confusing which column is whose.
Two ideas: show only the card of whoever is rolling (switching at the
next player's first roll), both side by side at the end; or grey out the
other player's column.

**Why it was hard** (from the stylesheet): the long game has two panels,
each with a picture column and two player columns, so a box was about
50 px wide on a phone. The columns had no heading; only the orange/blue
tint said whose they were.

**Agreed** (Claude's suggestion, developer's OK, no mockup): one card at
a time, a face heading each column, switching **when the turn passes**,
not at the next first roll (the player who just scored still sees it
during the Undo; then the dice and words already show the next player,
and that player can look at their open boxes before rolling). Both cards
at the end. The short game too (developer: the same look in both).
Greying out was dropped: it helped the confusion, not the size.

**Done:** `cardsShown(match)` in `src/core/five-dice.js` (whose turn it
is; everyone once the game is over); the sheet draws those columns under
a row of faces (0.7 of a row high, the player's colour), with bigger
numbers in a single column (0.58 of a row, was 0.46). The debug log says
`score card shown {"cards":"bear"}` on each switch.

**Checked:** `npm test` 135 of 135 (the new test: player 1's card first,
still during Undo, the robot's after the turn passes, both at the end of
short and long games, the starter's on the next game, Just me always
one). With `cardsShown` changed back to everyone's, the test fails
("player 1 starts"). In the built-in browser at 393x852 (iPhone 16 size,
no browser bars), without `?dev`: long and short games both get 60 px
rows, the footer ends at 840 px of 852 (no scrolling). A box is 106 px
wide in the long game (was about 50) and 259 px in the short game. Played
a whole two-player long game: the headings read the bear's during the
Undo, the cat's once the turn passed, both at "wins!". Against the robot,
its card showed on its turn. No console errors.

**Finding (not new):** with `?dev`, the open debug panel adds room under
the page (`body` padding, `debuglog.js`), up to 30% of the screen, and
the fit shrinks the rows to keep the page on screen: 47 px, once 28 px,
where the page without `?dev` gets 60 px. It stays at 106 px even with the
panel hidden. So row sizes in a `?dev` log are smaller than what the
children see; don't read them as a fit problem.

**Published** 2026-10-07 (developer's OK): `main` at `a5009b7`; the live
`five-dice.js` (core) had `cardsShown` about 21 s after the push (curl).

## 2026-10-07: One face across the long game's card

**The developer** (phone, live site): "Much better. It solves both the
visibility problem and the interaction problem." One change for the long
game: one face in the middle instead of one on each of the two panels,
to show that both halves are one player's, one turn.

**Done:** during a long game the face is one heading across the whole
sheet (`hd across`, 0.7 of a row high, as before), centred on the
player's colour; the panels have no heading row of their own (`nohd`).
At the end of the game each column keeps its own face (each panel then
holds both players' columns). The short game is unchanged (one panel,
one face already).

**Checked** in the built-in browser at 393x852, without `?dev`: long,
one heading 349 px wide (the sheet's width), the bear's, the cat's once
the turn passed; a whole two-player long game played to "wins!": four
face headings (bear, cat, bear, cat). Rows 60 px and the footer at 840 px
of 852 in all three cases, as before the change (the heading takes the
same height). Short: one face over its column, as before. No console
errors. `npm test` 135 of 135 (the change is drawing only).

**Published** 2026-10-07 (developer's OK): `main` at `1c355d6`; the live
`five-dice.css` had the change about 31 s after the push (curl).

**The developer** (phone): "All good."

## 2026-10-07: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with seven games.
Five Dice shows one score card at a time (whose turn it is, switching when
the turn passes; both at the end), one face across the long game's card;
checked on the developer's phone. Working branch `home-groups`, level
with `main` but for this entry.

**Known:** `npm test` 135 of 135. Row sizes in a `?dev` log are smaller
than without `?dev` (the debug panel's room; entry "one score card at a
time").

**Next:** nothing waiting. Ideas from DESIGN.md "Later": matching cards
with the developer's photos, a rock paper scissors difficulty setting,
sound (off until heard), more games; watch whether the long Five Dice
game is too hard for the grandkids.

**Open questions:** none. **Proposed skill additions:** one (debug output
changing what it measures), to review with the developer.

## 2026-10-07: The debug log moves to a log page

**The developer** hadn't known about `?dev`: a good idea during
development, but the panel doesn't belong on the screen; maybe a "log"
concept. Claude proposed keeping the log on the device and a separate
page to look at it, reached by its address or a footer link; the
developer: "Yes, build it, address only". Claude's view on the proposed
skill addition (debug output changing what it measures): keep it in the
journal for now, since this change removes the cause here.

**Done:**
- `src/core/log.js`: the log can be given a storage (the browser's
  localStorage, key `web-games-log`): it starts with the lines kept by
  earlier pages, `save()` writes them (false if the storage refuses),
  `clear()` removes them, `begin(title)` writes a page's heading
  (`=== 2026-10-07 12:50:59 five-dice.html, 393x852 ===`). The newest
  3000 lines (`LOG_MAX`); a long Five Dice game logs about 150-200. A
  storage that throws or holds something unreadable gives an empty log
  that still works in memory.
- `src/ui/debuglog.js`: the heading as soon as a page loads (some pages
  log before `startLog`), then `startLog(page)` (was `installDebugPanel`)
  saves 0.5 s after a line and when the page is left or hidden. The
  panel, `?dev`, `devMode` and `withDev` (which kept `?dev` on links) are
  gone from every page.
- `log.html` (`src/ui/logpage.js`, `css/log.css`): the lines, newest at
  the bottom; Save log (the file as before: browser and device details,
  then the lines), Copy (if the browser won't, it selects the lines) and
  Clear (asks first). It reads the log; it doesn't add to it. `noindex`,
  🏠 and the footer like the other pages; nothing links to it.
- README, `tools/serve.js`'s start-up line and CLAUDE.md's working
  standards point at `log.html` instead of `?dev`.

**Checked:** `npm test` 140 of 140: four new log tests (kept across
pages; the newest lines only, across pages; clear, and unreadable
records; a storage that refuses) and a page test (log.html exists, no
page links to it, no `installDebugPanel`, `withDev` or `?dev` left in
`src/ui` or the pages; 25+ files checked). Breaking the reading-back
(`let lines = []`) failed three log tests; a link to log.html on the home
page failed the page test; both put back. In the built-in browser: a
roll and a score in Five Dice, 🏠, then log.html showed 19 lines under
three headings (home, five-dice, home); no panel, no padding added under
the page; at 393x852 Five Dice's rows are 60 px (the footer at 840 of
852). All eight pages load and log "loaded"; no console errors. Clear:
answering No kept the 19 lines, Yes emptied the storage and greyed the
buttons. Copy fell back to selecting the lines in the built-in browser,
by a script and by a real click: probably the pane being hidden (the
clipboard needs a focused page); **not yet seen on a phone**. Save log
not clicked (it downloads a file); its code is the old panel's.

**Published** 2026-10-07 (developer's OK): `main` at `41f9a5f`; the live
`log.html` answered 200 and `debuglog.js` had `startLog` about 32 s after
the push (curl). Next: the developer tries log.html and Copy on the phone.

**The developer** (phone, live site): "It works great." Asked when the
log gets cleared: only by Clear; otherwise the oldest lines go once there
are 3000; the browser also deletes it when the site's data is cleared,
at the end of a private tab, and Safari after 7 days without a visit to
the site (its limit on what pages store).

## 2026-10-07: Two tabs share the log

**The developer** asked whether two people on different computers have
separate logs (yes: per device and per browser), whether to clear the log
automatically (Claude: not needed, it stops at 3000 lines, an estimated
well under 1 MB of the about 5 MB a site may keep; the developer: "leave
it"), and where it's stored (the browser's localStorage for
`donpark2000.github.io`, shared with any other GitHub Pages site of the
developer's there; key `web-games-log`). Claude found Q9 while answering:
two tabs open at once overwrote each other's lines.

**Done** (`src/core/log.js`): a save reads what's on the device and adds
only this page's new lines (`unsaved`). If another tab wrote there (or
cleared it) since this page last read or wrote, the block starts with
`=== <time> <page> (continued) ===`, so its lines don't read as the other
tab's. A refused save keeps the lines for the next one; with nothing new
nothing is written.

**Checked:** `npm test` 143 of 143 (three new: two tabs interleaved keep
both, with "(continued)" headings; a Clear in another tab stays cleared;
a refused save is retried, and an empty save writes nothing). With the
old save put back (`lines.slice(-max)`), the first two failed; restored.
In the built-in browser, Five Dice in one tab and Connect Four in
another, played in turn: the log kept all 15 lines, five blocks, each
under its own page's heading (three "continued").

**Published** 2026-10-07 (developer's OK): `main` at `3e8c1d3`; the live
`log.js` had the change about 21 s after the push (curl).

## 2026-10-07: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with seven games.
Today: Five Dice shows one score card at a time (one face across the long
game's card), checked on the developer's phone. The debug log is no
longer on screen: every page keeps it on the device (newest 3000 lines;
two tabs add to it, not over it) and
https://donpark2000.github.io/Web-Games/log.html shows it, with Save
log, Copy and Clear; reached by its address only. Log page checked on
the developer's phone ("It works great"). Working branch `home-groups`,
level with `main` but for this entry.

**Known:** `npm test` 143 of 143. To ask the developer for a log: play,
then open log.html and tap Copy (it worked on the phone; in the built-in
browser it falls back to selecting the lines). Testing in the built-in
browser: there's no `?dev` any more; read the log from
`localStorage['web-games-log']` or open log.html; the game screens are
now the size the children see.

**Next:** nothing waiting; the developer will bring changes to a new
session. Ideas from DESIGN.md "Later": matching cards with the
developer's photos, a rock paper scissors difficulty setting, sound (off
until heard), more games; watch whether the long Five Dice game is too
hard for the grandkids.

**Open questions:** none. **Proposed skill additions:** one (debug output
changing what it measures), kept in the journal for now (Claude's view:
this project removed the cause); to review with the developer.

## 2026-10-08: Nim: the developer's game

**The developer** proposed the eighth game: Nim. Three rows of matchsticks
(3, 5 and 7); on your turn take as many as you like from **one** row (the
whole row too); whoever takes the last match wins (or loses: both work,
and changing the rule partway through can be fun).

**Claude's questions, the developer's answers:**

1. Who's playing? **Me and the robot (preselected) or Two players**; no
   Just me.
2. The robot's strength? Claude: from 3-5-7 whoever goes first can always
   win with the exact method (the "nim-sum", XOR of the rows, 3^5^7 = 1),
   so a robot that always plays its best can't be beaten once it's ahead.
   The developer: "A perfect robot would lose every time against a
   perfect human who went first, right? ... the robot playing his best
   helps with learning." Claude: yes; offered **How hard?** with Easy and
   Hard. The developer: OK, **"but easy should not be stupid or random"**.
3. Changing the rule mid-game? **Left out for now** (developer: "might
   just make it more confusing (or frustrating, when you realize a perfect
   player can force either)"). **Taking the last match wins**; no setup
   choice for the rule.
4. Tokens: **drawn matchsticks**.
5. Taking: **tap each match, then a separate Take button**.
6. Name "Nim" (no trademark) and the three "Who goes first?" choices:
   Claude's suggestions, not objected to.

**Easy robot, measured** (a scratchpad simulation, 4000 games per line,
3-5-7, last match wins; "sensible" player = takes a win when it can and
never leaves just one row, otherwise any move; robot's win rate, same
whether it goes first or second unless noted):

| Robot | vs random taps | vs sensible | vs perfect (going first) |
|---|---|---|---|
| Looks 1 move ahead (takes a win, never leaves one row) | 80% | 50% | 0% |
| Looks 3 moves ahead | 90% | 72% | 0% |
| Looks 5 moves ahead | 97% | 91% | 0% |
| Best move half the time, else "1 ahead" | 89% | 72% | 0% |
| Best always (Hard) | 100% | 99-100% | 0% (robot first: 100%) |

Claude's proposal for Easy: **looks one move ahead**: always takes the
win when it can, never hands you an easy win, otherwise plays a move a
person who doesn't know the trick might. No dice-roll between "good" and
"bad" moves, so it never does something silly; a child who plays sensibly
wins about half the time. Tunable (how far it looks).

## 2026-10-08: Nim mockup v1

[Nim Mockup](https://claude.ai/artifact/3sRohn5n7h6VaGBU394722) (private
Claude artifact, version 1). Built from the site's own `site.css` and
`game.css` and the real faces (`src/ui/faces.js`), by a script in Claude's
scratchpad.

- **Setup:** a rules panel (a small 3-5-7 picture; "Take 1 or more
  matches from one row. Take the last match to win!"), Who's playing?
  (Me and the robot, preselected / Two players), face pickers, **How
  hard?** (⭐ Easy "The robot doesn't know the trick" / ⭐⭐⭐ Hard "The
  robot plays its best"; only against the robot), Who goes first?, Play!.
- **Play:** 🏠 and the turn line; a wooden tray with the three rows of
  drawn matchsticks, centred (3, 5, 7); a yellow **Take** button (greyed
  until a match is picked, then "Take 2"); the dark scoreboard (games
  won; no ties possible); Play again / New game.
- **Picking:** tap a match: it lifts and tilts, on the player's colour,
  and its row lights up; tap again to put it back. A tap in another row
  drops the first row's picks and says "One row at a time!". Take: the
  matches fly off; the turn passes.
- **Robot:** "is thinking..." 0.8 s, lifts its matches one at a time
  (0.45 s each), 0.7 s, takes. Easy = looks one move ahead; Hard = the
  exact method (Easy's move when it's losing).
- **End:** the last match(es) stay, in the winner's colour, and wiggle;
  "<face> wins!"; scorecard cheer and "aww" face as in the other games.

**Checked** (served on localhost from the scratchpad, built-in browser,
393x760): setup and play fit with no scrolling (matches 43 px wide);
picking 2 in row 3 then 1 in row 1: "Take 1", the hint, one match picked;
Take passed the turn to the robot, which took 3 from row 3 (3-5-2); a game
played to the end: robot won, games won 0-1, two last matches kept; no
console errors. Not yet checked in the desktop app's viewer.

**Approved** (developer, 2026-10-08): "Looks good. Any questions before
publishing?" Mockup v1 is the agreed design, with Claude's three choices
in it (the rules panel on setup; no row numbers or counts; taken matches
disappear rather than piling up). Its decisions are in `DESIGN.md`
("Nim"). Nim goes in the 👥 Two players group, after Five Dice.

## 2026-10-08: Nim built (from mockup v1)

**Done** (branch `nim`): `src/core/nim.js` (rules and robot, no DOM),
`src/ui/nim.js` (screens), `nim.html`, `css/nim.css`,
`src/ui/matchstick.js` (the drawn match, shared with the home page), a
button in the 👥 Two players group after Five Dice (the three rows on a
wooden tray, two matches picked up in the bear's colour). Debug log
(`[nim]`): picks, mode, level, first rule, match/round started or
restarted, fit, picks dropped for another row, every take (row, count,
what's left, the nim-sum, person or robot), the robot's choice and its
reason (`win` / `safe` / `stuck` / `best`), round won, scorecard cheer,
pending robot steps cancelled.

**Changed from the mockup, for the phone** (Claude; to confirm with the
developer): at the assumed iPhone 16 Safari size (393x659) the mockup's
layout fitted only **32 px** matches. Matches are now 1.6x as tall as
wide (were 2.1x), and "One row at a time!" shows **in the turn line for
2 s** instead of on a line of its own under Take: now **43 px** (the full
width) with no scrolling.

**Found while checking:** the tray stuck out 3 px past the page on a
393 px screen. Cause: the CSS default match size (44 px) made the tray
364 px in a 361 px column, which stretched the play screen, and the fit
measured the stretched width (fit log: `size 44, tries 1`). Fixed: the
default comes from the screen width, and the fit measures the page column
(`main`): 43 px, tray 361 px. Also: "pending steps cancelled" counted
steps that had already run (14); now only those still waiting (2, for a
one-match move cancelled before its lift).

**Checked:** `npm test` 154 of 154 (11 new in `tests/nim.test.js`:
takes and every refusal, the last match wins and is scored, next
starter, Play again mid-round; over all 191 positions, Hard always
leaves a nim-sum of 0 when it can and Easy always takes a win and never
leaves one row (exact counts 15 / 173 / 3); whole games: Easy vs a
sensible player 35-65%, Hard over 90%, a perfect player going first
beats both, Hard going first always wins; `pages.test.js` has nim.html
in the Two players group). Three deliberate breaks (Hard never plays
best; Easy may leave one row; the last take doesn't win) each failed two
tests; restored. Built-in browser on localhost: 393x659 (above), 393x760
43 px, 820x1180 64 px, 320x568 and 844x390 at the 30 px minimum (the page
scrolls, as in the other games); no sideways scroll at any size. Played:
picks, put back, another row (hint, then "your turn" after 2.2 s), Take,
taps ignored on the robot's turn; Easy and Hard games to the end (cheer,
last matches kept, games won); Hard after a person's move left [2,5,7]
(nim-sum 0) and went first with 3-5-7 → 2-5-7; Play again during the
robot's move restarted unscored; New game during it; two players with
"Winner goes first". No console errors, no `[error]` lines in the log.

**Q10 (names for the faces), Claude's view:** a fixed, friendly name per
face (Froggy, Kitty, Grandma...), shown with the face on the scoreboard
(instead of "You" / "Player 1") and maybe in the turn line; no setup
cost, and reading practice for the ones who can. Typed names only as an
optional rename (e.g. Grandma → "Nana"), remembered on the device, never
needed to start. All eight games, so a separate change after Nim.

## 2026-10-08: Sound: proposal

**The developer** asked about sound for turns and events like winning or
losing, in every game, with a way to turn it off and on (Q11). Claude's
proposal: sounds made in the browser (Web Audio, our own code: no sound
files, nothing from other sites); a small shared set (tap/pick, a move
landing, a card flip, a dice rattle, a cheerful win, a gentle "aww" for
losing, maybe a tie); a 🔊/🔇 button top-right on every game screen,
remembered on the device for all the games; a sound sampler artifact
first, so the developer can hear and pick them before any game changes;
then the default (on or off) decided after hearing. To check on the
developer's iPhone: the silent switch and volume.

## 2026-10-08: Nim published

**Published** 2026-10-08 (developer's OK, "2" = Claude publishes): `main`
fast-forwarded to `nim` at `bf8b352` and pushed. (A first try was
blocked by Claude Code's automatic permission check as a "production
deploy"; it went through when the developer said to go ahead again.)
The live `nim.html` and the home page's Nim button were there about 30 s
after the push (curl). Live site in the built-in browser at 393x659:
43 px matches, no scrolling; one take, the robot took the whole middle
row, back to "your turn".

## 2026-10-08: Nim checked; Easy and Hard without their lines

**The developer** (live site): "It looks great and game play is great
but I would remove the text from easy mode and hard mode. I don't think
'robot does not know the trick' is going to inspire anyone to play."

**Done:** "How hard?" is now just ⭐ Easy and ⭐⭐⭐ Hard (`nim.html`). The
robots themselves are unchanged. **Checked:** `npm test` 155 of 155 (one
new in `pages.test.js`: Nim's level buttons hold only the stars and the
word; with the old `nim.html` put back it failed; restored). Setup screen
at 393x760 in the built-in browser: two plain buttons, same size as
before. Not published yet (waiting for the developer's OK).

**Published** 2026-10-08 (developer: "1 and 2", i.e. publish, and make
the sound sampler next): `main` at `9a986b1`; the live `nim.html` had
the plain Easy / Hard about 30 s after the push (curl).

## 2026-10-08: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with eight games.
Today: **Nim** (3-5-7 matchsticks, take from one row, last match wins;
Me and the robot / Two players; Easy looks one move ahead, Hard plays
the exact method), checked by the developer on the live site ("game
play is great"); Easy / Hard then lost their explaining lines.
Working branch `nim`, level with `main` but for this entry.

**Known:** `npm test` 155 of 155. Publishing: the first `git push origin
main` of the session may be blocked by Claude Code's automatic
permission check ("production deploy") even after the developer's OK;
it went through when the developer said to go ahead again. Mockups are
built by a script in Claude's scratchpad from the real CSS and faces;
to try one in the built-in browser, a temporary `mockup` entry in
`.claude/launch.json` serving the scratchpad (with `tools/serve.js`'s
`createServer`) worked; it was removed afterwards (not committed).

**Next: sound (Q11).** The developer said yes to a **sound sampler**
artifact: a button per sound (a couple of versions each), made in the
browser (Web Audio, our own code, no files): tap/pick, a move landing,
card flip, dice rattle, a cheerful win, a gentle "aww" for losing, maybe
a tie. Then: which sounds, on or off by default, a 🔊/🔇 button top-right
on every game screen remembered for all games; check the iPhone's silent
switch. Proposal in "Sound: proposal" (2026-10-08).

**Open questions:** Q10 (names for the faces; Claude's view in "Nim
built"), Q11 (sound). **Proposed skill additions:** two (debug output
changing what it measures; a measurement must not depend on what it
sets), to review with the developer.

## 2026-10-08: Sound sampler v1; face names agreed

**Face names (Q10, resolved):** the developer wants fixed names, no
renaming. Claude's draft list (not yet confirmed): bear Teddy, cat Kitty,
dog Buddy, bunny Hoppy, fox Foxy, panda Ping, pig Piggy, frog Froggy,
lion Leo, mouse Squeak, monkey Coco, chick Peep, grandma Grandma,
grandpa Grandpa, robot Robot; girl and boy to choose (a child often
picks them to be themselves, so maybe just "Girl" / "Boy"). Shown under
each face in the pickers, on the scoreboard instead of "You" / "Player
1", and in the turn line. **Order** (developer): one thing at a time,
sound first, names after.

**Sound sampler v1:** [Game Sound Sampler](https://claude.ai/artifact/TfxCqWQnvPEfxg4iwX5d8c)
(private Claude artifact). Made with Web Audio in the page (oscillators
and filtered noise, no sound files), in the site's colours and font. For
every game: tap/pick (Soft pop, Bubble, Wood tick), a move lands (Thud,
Plunk, Clack), a win (Ta-da, Sparkle, Fanfare), a gentle "aww" (Aww, Two
notes down, Wobble down), a tie (Ding ding, Even chord). For some games,
maybe: card flip, dice rolling, "Got one!", oops, up the ladder, down
the snake, your turn (two or three versions each). A volume slider; ♡ on
each version, the picks listed at the bottom with Copy. Checked: the
script parses (`node --check`); the sounds themselves only by ear, which
is the developer's. To check later on the iPhone: Web Audio follows the
silent switch on iOS (Safari can be told to play anyway with
`navigator.audioSession`; whether it should is a question for then).

**Skill additions approved** (developer: "add both"): "Debug output can
change what it measures" (§1) and "A measurement must not depend on what
it sets" (§4), each with one line of evidence; the intro now names this
project too. New `SKILL.md` and a zip for upload in
`Web-Games-testing\2026-10-08_skill-update\`; the developer installs it.

## 2026-10-09: Sounds picked from sampler v1

**The developer's picks:** tap/pick C (Wood tick); a move lands A
(Thud); a win B (Sparkle); a gentle "aww" C (Wobble down); card flip A
(Swish); dice rolling B (Soft shake); "Got one!" A (Ding); oops B
(Uh-oh); up the ladder A (Climb); down the snake A (Wheee); your turn A
(Ping). **No tie sound picked.** Every "maybe" sound was kept. Still to
settle before building: the tie, on or off by default, which end-of-round
sound plays in a two-player game, the iPhone's silent switch, and which
moment in each game gets which sound (Claude's proposal in chat).

## 2026-10-09: Sound in all eight games

**Settled first (developer):** the table of which moment gets which
sound ("OK"), the tie is "Ding ding", sound **on** by default, and on
the iPhone the sounds **follow the silent switch**. Now in `DESIGN.md`
"Sound".

**Built** (branch `sound`): `src/ui/sounds.js` makes the twelve sounds
(the sampler's recipes, unchanged, at the sampler's default volume) and
keeps on/off (`web-games-sound` in localStorage, on when nothing is
kept); it has no DOM code and takes its audio context, storage and log
from the caller, so the tests run it with fakes. `src/ui/sound.js` wires
it to the page: the 🔊/🔇 button in each screen's top row, a tick for
every setup choice (one click listener on `#setup`), sound allowed to
start on any tap, `navigator.audioSession.type = 'ambient'` where Safari
has it (follows the silent switch, leaves music playing), and other tabs'
on/off followed. Each game plays its moments with `sound.play(name,
delay)`; the end of a round uses `endSound()` in `src/core/players.js`.
Connect Four's thud waits for the disc to reach its hole (78% of its
fall). The debug log has a `[sound]` line per sound, with the audio
state when it isn't running (a suspended context plays nothing).

**Checked:** `npm test` 166 of 166 (11 new: the sounds with a fake audio
context that, like the real one, refuses a ramp to 0 and a stop before
the start; on/off kept; blocked storage; no Web Audio; an unknown name;
resuming; `endSound`; and each game's sounds read from its screen file
against the agreed table, 27 in all). Each new check was seen to fail
once, in a throwaway copy: a misspelled sound in Nim ("plays 'thudd',
which isn't a sound"), Five Dice without its ping ("five-dice: sounds"),
a sound ramping to 0 ("bad ramp 0"). In the built-in browser at 393x659:
Nim against the robot logged tick (Play!), tick, tick, thud, the robot's
five ticks, thud, ping, all with the audio running; Matching logged
swish, swish, uh-oh on a miss; Snakes and Ladders shake, a tick per hop,
the robot's turn, ping. Turned off on Snakes and Ladders: the next roll
logged no sound, both buttons showed 🔇, `off` was kept, and tic-tac-toe
then opened with 🔇. **The fit is unchanged:** each play screen's fitted
size and page height were the same with and without the sound changes
(`git stash`): tic-tac-toe 75, Connect Four 43, Count to 9 95, Snakes
and Ladders 56, Five Dice 36 (dice 43), Nim 43, Rock paper scissors 125
(Matching measured separately: 4x4 cards 64 px, whole page fits). Not
checked: the sounds by ear in the games (Claude can't hear), and the
iPhone.

**On tic-tac-toe's setup screen** the 🏠 is one grid square (about 115
px at 393 px wide) and the 🔊 48 px, so the title sits a little right of
centre; the other setup screens have a 48 px 🏠 and a centred title.

**Skill update installed** (the developer asked to confirm): the skill
file this app loads was updated 2026-10-09 11:08 and is byte for byte
the new version (`diff`), the only copy found. The skill-update folder
`Web-Games-testing\2026-10-08_skill-update\` can be purged.

## 2026-10-09: Sound published

**Published** 2026-10-09 (developer: "publish"): `main` fast-forwarded to
`sound` at `87c924c` and pushed (no permission-check block this time).
The live `src/ui/sounds.js` was there about 30 s after the push (curl); the
live `nim.js` has its 5 `sound.play` calls, `site.css` the button's style,
`sound.js` the silent-switch setting.

**Purged** (developer's OK): `Web-Games-testing\2026-10-08_skill-update\`
sent to the Recycle Bin (the skill files, now installed).

## 2026-10-09: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with eight games, now
**with sound** (on by default; 🔊/🔇 top-right on every game screen,
remembered for all the games). Working branch `sound`, level with `main`
but for the journal.

**Known:** `npm test` 166 of 166. The sounds are the developer's picks
from the [Game Sound Sampler](https://claude.ai/artifact/TfxCqWQnvPEfxg4iwX5d8c);
the code is `src/ui/sounds.js` (the sounds, testable with fakes) and
`src/ui/sound.js` (the button, setup ticks, unlocking on a tap). Not yet
heard by the developer in the games or on the iPhone: Q11 stays open
until then (silent switch on and off; the volume of each sound against
the others). The standards skill now has the two rules from this project
(installed and confirmed 2026-10-09).

**Next: face names** (Q10, resolved as fixed names, no renaming). The
draft list is in "Sound sampler v1; face names agreed" (2026-10-08);
still to settle with the developer: the list itself, and the girl and
boy faces (names, or just "Girl" / "Boy"). Then: names under the faces
in the pickers, on the scoreboard instead of "You" / "Player 1", and in
the turn line, in all eight games.

**Open questions:** Q11 (sound, until heard on the devices).
**Proposed skill additions:** none waiting.

## 2026-10-09: Face names; girl and boy dropped

**Q11 resolved:** the developer: "Sounds are good" (sound live since
earlier today).

**Girl and boy dropped** (developer: "Maybe we should drop girl/boy"):
two problems with them. A fixed name can't fit a real child, so they
would have needed typed names (renaming was already turned down); and
two players never share a face, so one of two brothers couldn't be "the
boy". Claude agreed: everyone picks an animal, and the names keep the
two apart. Grandma and Grandpa stay (the name fits whoever plays). Two
players still never share a face (two Leos would make "Leo's turn"
ambiguous). The names as drafted, agreed ("Yes, drop them and use those
names"). Branch `face-names`, from `sound`.

**Built:**
- `src/core/players.js`: `FACE_NAMES` without girl and boy (14 faces);
  `NAMES` and `nameOf(face)` (an unknown face throws, rather than showing
  a blank name); `twoPlayerFaces(p1, p2)` for the "Two players" button's
  two faces (it showed the girl and boy before a pick; now bear and cat,
  never the same two). The 7 copies of that line in the screens now call
  it.
- `src/ui/faces.js`: the girl and boy drawings removed; `pickerFace(f)`,
  the face with its name under it. `css/game.css`: the picker buttons
  are no longer square (face, then the name in 12 px).
- All eight screens: names in the pickers (and their aria-labels), on
  the scoreboards instead of You / Player 1 / Player 2 / Robot (Matching
  cards and Five Dice keep their pairs / points labels), under your card
  in Rock paper scissors, and in the turn lines (DESIGN.md "Face
  names"). Against the robot the turn line now says "Leo's turn", not
  "your turn", as with two players.
- Debug log: no new lines. The log already records every face by its id
  ("p1 picked", "match started", ...), and a name follows from the id.

**Matching cards:** with two fewer faces, 13 pictures are left after two
players' picks (was 15). A 4x6 grid (12 pairs) still has no repeats; 5x6
now has 2 pictures 4 times (was none), 6x6 has 5 (was 3).

**Tests:** `npm test` 170 of 170 (was 166): names for every face and the
robot, all different; girl and boy gone (not pickable, no name, no
drawing); `twoPlayerFaces` never shows the same face twice (every pair of
picks); `pickerFace`; the face and picture counts updated (16 to 14
faces, 51 to 45 drawings, Matching's repeats). Shown to fail: with the
panda renamed "Teddy", the names test fails.

**Checked in the browser** (375 x 812, the local server): the picker
shows the 14 faces with names, 4 a row. Every game in each mode, with
the longest name (Grandpa, and Grandma as player 2): the turn line and
scoreboard show the names, and **the play screen still fits with no
scrolling** (scrollHeight minus window height 0 on all 15). Snakes and
Ladders' "Grandpa's turn. Tap the die!" takes three lines beside the
die, but fits. No console errors.

**Correction:** Claude told the developer a device with "girl" or "boy" saved
as a last pick would just go back to empty. In fact the picks aren't
saved on the device at all (only in the page while it's open), so
there is nothing to clear.

## 2026-10-09: Names on the score cards too

**Developer, trying the branch locally:** in Five Dice the name didn't
show at the top of the score card (just the face), nor on the points
scoreboard; the same in Matching cards and Rock paper scissors. Those
were the places Claude had left with faces only (DESIGN.md said so, but
the developer hadn't been told plainly).

**Built:**
- **Five Dice:** the name beside the face at the top of the score card;
  the scoreboard shows the name, then "won N" (Just me: "points").
  Where a column is under 90 px the name is left out (a CSS container
  query): that is only both long cards at the end of a game, 48 px
  columns on a 375 px phone (measured), where the scoreboard below shows
  the names. The short game's two end columns are 123 px: names shown.
- **Matching cards:** the name above "pairs" (Just me: above "of 8
  pairs"); names on the "Games won" strip.
- **Rock paper scissors:** the name under each face on the stars
  scoreboard; names on the "Games won" strip.
- With names, Matching's "Games won" strip wrapped to two rows at 375 px
  (86 px tall instead of 46); "Games won" on two lines keeps it one row
  (46 px). The same done in Rock paper scissors for a matching look (it
  fitted, but wrapped at 320 px).

**Checked** (375 x 812, local server, Grandpa and Grandma, the longest
names): Five Dice long two players, Matching two players and alone,
Rock paper scissors: the names show; no page scrolls (scrollHeight
minus window height 0; width 375 of 375). At 320 px the "Games won"
strips still wrap to two rows, but the page still fits. No console
errors. `npm test` 170 of 170 (screen layout only; nothing new for the
Node tests to check). The browser pane's screenshot of Matching came out
tiled and cut off twice, while the page measured 375 px wide with no
scrolling: a capture problem, not the page.

## 2026-10-09: Face names published

**Published** 2026-10-09 (developer, after trying it locally: "Looks
good. Publish"): `main` fast-forwarded to `face-names` at `f01ec63` and
pushed. Live about 30 s after the push (curl): `players.js` has
`nameOf` and no 'girl', `five-dice.js` the name in the card header,
`rock-paper-scissors.html` the scoreboard name, `matching.css` the
"Games won" names.

## 2026-10-09: One-player game ideas; Follow Me mockup v1

**Ideas** (developer: "Any ideas for more one player games?"), Claude's
five, in order: **Follow Me** (Simon-style: repeat the robot's sequence
of faces), **Spell the animal** (CAT, DOG, PIG from letter tiles),
**Maze** (lead a face to the 🏠 with a finger), **Sliding puzzle** (a
face cut into tiles), **Higher or lower** (Count to 9's number cards).
Claude recommended Follow Me (no words to read, quick to learn, uses the
new sound). The developer: "Mock up Follow Me".

**Mockup v1:** [Follow Me Mockup](https://claude.ai/artifact/CYBaCqBjipGMo88xYWr8tJ)
(private Claude artifact, version 1). Built from the site's own
`site.css`, `game.css`, faces, names and sounds by a script in Claude's
scratchpad. Claude's choices, all open:
- **Setup:** a rules panel (the four pads in small; "Watch the robot.
  Then tap the same faces in the same order!"), Pick your face, **How
  hard?** (⭐ Easy ❤️❤️❤️ / ⭐⭐⭐ Hard ❤️: hearts, not words), Play!.
- **Play:** 🏠, the turn line, 🔊; four big pads, 2 x 2: Froggy (green),
  Peep (yellow), Piggy (pink), Hoppy (blue), each with its own note (G4,
  C5, E5, G5: any order sounds pleasant). A row of dots, one per step.
  The dark scoreboard: your face, steps in a row this game; the hearts
  and the level; 🏆 the best per level. Play again / New game.
- **A round:** "Ready?" 1 s; the robot: "Watch me!", each pad lights
  (bright colour, smiling face, its note); then a ping and "Leo's turn!".
  Each tap lights the pad and plays its note; a dot fills. All right:
  a ding, "Yes! 3!", and the robot shows the sequence again with one
  more step. Never the same pad three times running. No time limit.
- **A miss:** "uh-oh", the tapped pad shakes, the right one blinks
  twice. Easy: a heart is lost and the robot shows the same sequence
  again ("Oops! Watch again."). No hearts left (Hard: the first miss):
  the game ends: "Leo got 5! New best!" with the sparkle and the
  scorecard cheer (a game that ends at 0: "Try again!", no sparkle).
- **Speed:** Easy, each step lit 0.65 s with 0.28 s between, the same
  all game; Hard, 0.45 s and 0.17 s, 6% quicker each round, down to
  0.26 s.
- **Sized to the screen:** the pads are the biggest that let the page fit
  with no scrolling (173 px at 393 x 760, at most 200 px).

**Checked** (served on localhost from the scratchpad, built-in browser,
393 x 760; a temporary entry in `.claude/launch.json`, removed after):
setup fits; a game in Easy: 3 rounds right (sequence 2, 22, 223; "Yes!
1!" to "Yes! 3!", dots filling), a tap while the robot showed was
ignored; a miss: hearts 3 to 2, the hint blink, the same 4 steps shown
again; two more misses: "Teddy got 3! New best!", best 3. Hard: one miss
ended it (then "Leo got 0!", reworded to "Try again!"). No page
scrolling, no console errors. The pad notes and sounds only by ear,
which is the developer's. Not yet checked in the desktop app's viewer.

## 2026-10-09: Follow Me mockup v2

**Developer, trying v1:** liked it, but after the robot's sequence one
more sound (the "your turn" ping) came before the player's turn, "which
is a bit confusing since you count 1 more sound than faces in the
pattern". **v2** (same artifact, version 2): the ping is gone; the turn
line changing to "Leo's turn!" is the only cue; nothing sounds between
the robot's last note and the child's first tap. Checked:
the script parses (`node --check`), no `ping` left in the page.

**Lesson for the other games (project):** the "your turn" ping after the
robot (DESIGN.md "Sound") is fine where the robot's turn isn't a pattern
to count; in Follow Me the sounds *are* the content, so nothing may be
added to them.

## 2026-10-09: Follow Me: how many faces? (for mockup v3)

**Easy vs Hard** (developer asked): Easy, 3 hearts (a miss replays the
same pattern) and slow, the same speed all game (0.65 s lit, 0.28 s
gap); Hard, 1 heart and faster, 6% quicker each round (0.45 s / 0.17 s,
down to 0.26 s lit). Otherwise the same. The setup shows only the
hearts; whether Hard should also say "faster" was left to the developer
(no answer yet; Nim's levels have no lines under them).

**Grid size** (developer: "maybe add 3x2 and 3x3 choices?"). Agreed
("OK. Add it to the notes"), for **mockup v3**, as Claude proposed:
- A separate **"How many faces?"** choice beside How hard?: **4** (2x2,
  preselected), **6** and **9** (3x3), each button a small grid. How
  hard? still sets the hearts and the speed.
- Every pad its own colour, animal and note; the notes from one
  pentatonic scale (any order sounds pleasant; 9 still easy to tell
  apart).
- **6 on an upright phone: 2 across, 3 down** (bigger pads than 3
  across); 3x2 when wide. 9: 3x3, about 105 px pads on a 375 px phone.
  The pads the biggest that fit with no scrolling, as now.
- **Best kept per size and level** (7 on 9 faces is much harder than 7
  on 4); the scoreboard shows the current one, e.g. "best (9, Hard)".
- 4 faces on Easy stays the default; 9 on Hard is the top challenge.

## 2026-10-09: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with eight games,
sound, and **face names** (published 2026-10-09; girl and boy dropped).
Working branch `face-names`, level with `main` but for the journal.
`npm test` 170 of 170.

**Next: Follow Me mockup v3**, adding "How many faces?" (4 / 6 / 9) as
agreed in "Follow Me: how many faces? (for mockup v3)". The mockup is
[Follow Me Mockup](https://claude.ai/artifact/CYBaCqBjipGMo88xYWr8tJ)
(version 2: no ping before your turn; v1's design in "One-player game
ideas; Follow Me mockup v1"). Its build script and template were in
Claude's scratchpad, which a new session won't have: start from the
published page (the Artifact tool's read gives its full HTML) or write
a new script the same way (the site's `site.css`, `game.css`, faces,
names and `sounds.js` put into one page). To test it in the built-in
browser, serve it with `tools/serve.js`'s `createServer` (a
`.claude/launch.json` entry for that session only, not committed).
Then building it: Follow Me goes in the 👤 One player group, beside
Rock paper scissors.

**Still to ask the developer:** should Hard also say "faster" on the
setup screen?

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-09: Follow Me built (no mockup v3)

**Developer:** no "faster" on the Hard button ("No need to say
'faster'"), and skip mockup v3: "I think we can go straight to publish".
Built on branch `follow-me` from mockup v2 plus the agreed "How many
faces?" (4 / 6 / 9). DESIGN.md "Follow Me" has the result. Claude's
choices beyond the mockup, all open to change:
- **The pads never show your own face**: the first 4, 6 or 9 of a fixed
  list (frog, chick, pig, bunny, fox, panda, lion, mouse, monkey, cat),
  skipping yours, so the face on the scoreboard is never a pad.
- **Best per size and level, kept for the visit** (across New game).
  The other games keep their bests in the match, so New game resets
  them; here a best per size and level only makes sense if it survives
  changing the size. Not kept on the device (as in the other games).
- **Taps act as the finger lands** (pointerdown), as in the mockup.
- **Dots on one line**, shrinking for a long order (45 steps: 4 px dots),
  so the fitted page never grows.
- **6 pads on a phone held sideways** (844 x 390): nothing fits even at
  56 px, so the page scrolls; the 3x2 layout is used there (scroll 446 px
  of 390, against 514 for 2x3).
- New: `sound.note(freq, seconds)` in `src/ui/sounds.js` for the pads'
  notes (the mockup's recipe: a triangle tone and a soft octave).
- Home page: a 👤 One player button with the four pads, the frog lit.

**Tests:** `npm test` 182 of 182 (170 before): 11 in
`tests/follow-me.test.js` (pads: count, distinct faces/colours/notes,
never your face; layouts; speed; never three in a row over 3000 steps
per size and at the edges of `rand`; setup checks; right orders;
refused taps; Easy misses and replay; Hard; best per size and level,
equal not a new best, 0 not kept; Play again), `sound.note` in
`tests/sound.test.js`, and the pages test (nine games, two in One
player). **Shown to fail:** allowing three in a row ("three 0s at 4")
and counting an equal score as a new best (2 tests) each failed, then
restored.

**Checked in the built-in browser** (served on port 8124: another
chat's server had 8123; a launch.json entry for this session, removed):
- 393 x 760: home page button; setup (the mini pads, the size grids,
  hearts). Easy, 4: rounds 1-5 right ("Yes! 1!" to "Yes! 5!", dots 2-5,
  orders 21, 213, 2131, 21311); a miss: hearts 3 to 2, the tapped pad
  shook, the right one blinked, "Oops! Watch again.", the same 6 steps
  shown again (213110); two more misses: "Teddy got 5! New best!", cheer,
  🏆 bounce, best 5. Froggy, 9, Hard: no frog pad (Peep ... Kitty), one
  heart, a miss: "Try again!", best stays 0. Page 760 high, 393 wide.
- Pad sizes: 393 x 760: 4 at 174 px, 6 at 132 (2x3), 9 at 112. 375 x 667:
  154, 106 (3x2: bigger there), 101; no scrolling. iPad 1180 x 820: 6 at
  165 (3x2), no scrolling. No console errors.
- Fixed while checking: "best (4, Easy)" wrapped mid-label; now "best"
  above "(4, Easy)".
- Not checked: the notes and sounds by ear (the developer's), a real
  phone.

My test script's first two tries read the robot's order wrongly (it
started watching mid-show); that was the script, not the game: the
third try watched from "Watch me!".


## 2026-10-09: Follow Me published

**Published** 2026-10-09 (developer: "go straight to publish", then
"Please push and publish"): `main` fast-forwarded to `follow-me` at
`96cf14a` and pushed. The first try was blocked by the session's
auto-mode permission check (a push to `main` counts as a production
deploy); it went through once the developer asked again in chat. Live
within about 10 s (Invoke-WebRequest): the home page links
`follow-me.html`; `follow-me.html`, both `follow-me.js` files,
`fmpads.js` and `follow-me.css` are served; `sounds.js` has `note`.
Not yet tried by the developer.

## 2026-10-09: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with nine games (Follow
Me added 2026-10-09, in 👤 One player), sound and face names. Working
branch `follow-me`, level with `main` but for the journal. `npm test`
182 of 182.

**Next:** the developer tries Follow Me (the notes and sounds by ear,
4 / 6 / 9 faces, Easy and Hard, on a phone or tablet), and says whether
Claude's open choices stand ("Follow Me built (no mockup v3)"): pads
never your own face; best kept for the visit per size and level; dots
shrinking on one line. Other ideas waiting: Spell the animal, Maze,
Sliding puzzle, Higher or lower ("One-player game ideas").

**Open questions:** none. **Proposed skill additions:** none waiting.


## 2026-10-09: README lists the nine games

The developer: "Yes, fix the README too". Its first line named only
tic-tac-toe, matching cards and Connect Four; it now lists all nine in the
home page's two groups.

## 2026-10-09: Follow Me: no ding for a right order; 2 s of quiet

**Developer, after trying Follow Me on a phone and a desktop:** "It all
works as planned", but there was "still an extra sound when the person's
turn is over"; suggested silence and a slightly longer pause before the
robot's next order, or maybe a control to start it. "Sounds are very
much a part of this game. Much more so than the other games. And extra
sounds are potentially distracting."

**Claude:** the sound was the ding for a right order (`sound.play('ding',
0.25)` on the last tap), which also covered that tap's note. Proposed:
no ding ("Yes! 3!", the smiling face and the full dots already say it),
the pause from 1.6 s to about 2 s, and no "go" button for now (a tap
more each round, easy for a 5-year-old to miss, breaks the watch-repeat
rhythm). **Developer:** "Yes, remove the ding and make it 2 s".

**Change** (`src/ui/follow-me.js`): no ding; `YES_MS` 1100 -> 1500, so
with `LEAD_MS` (500) 2 s from your last note to the robot's first. The
"uh-oh" for a miss and the end-of-game sound stay. Claude's three open
choices from "Follow Me built" stand (the developer: works as planned).

**Tests:** `npm test` 183 of 183 (182 before). `tests/sound.test.js`:
Follow Me's sounds now just `uhoh` (the count 29 -> 28); new: YES_MS +
LEAD_MS is 2000, and both are where the code waits. **Shown to fail:**
the sound check failed on the change before the test was updated
("follow-me: sounds"); YES_MS back at 1100 failed the new check ("YES_MS
1100 + LEAD_MS 500"), then restored.

**Checked in the built-in browser** (port 8124, a temporary launch.json
entry, removed), 393 x 760, 4 faces, Easy: a right order logged "order
right" with no ding; the robot's first note came 2.03 s after the last
tap (37.143 s -> 39.172 s in the debug log; the developer's earlier
session, with the old code: ding on the last tap, 1.63 s). A miss still
plays "uh-oh". (My script then tapped a wrong order in round 2: it
counted its own tap as part of the robot's order; the script, not the
game.) Not checked by ear (the developer's).

**Published** 2026-10-09 (developer: "Yes, publish"): `main`
fast-forwarded to `follow-me` at `8fd7e7d` and pushed. Live within about
30 s: the served `src/ui/follow-me.js` has `YES_MS = 1500` and no
`play('ding'`. Not yet heard by the developer.

## 2026-10-09: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with nine games, sound
and face names; Follow Me with no ding for a right order and 2 s of quiet
before the robot. Working branch `follow-me`, level with `main` but for
the journal. `npm test` 183 of 183.

**Next:** the developer listens to Follow Me's new pause on a phone. Then
maybe a new game: Spell the animal, Maze, Sliding puzzle, Higher or lower
("One-player game ideas"). A "go" button between rounds is on hold (only
if the grandkids want breaks).

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-09: Easy at Hard's starting pace; Follow Me mockup v3 (Game over banner)

**Developer, after trying the 2 s pause** ("all working as planned"):
Easy, the slower pace, "seems harder to remember to me than the hard
mode with the faster pace", and after the last heart "some better
indication that the only options ... is to play again (or new game or
home). Maybe a 'Game Over' flag over the grid?"

**Easy's pace.** Claude: we hold a short order mostly as a tune; at
Easy's 0.93 s a step (650 ms lit + 280 gap) 6 steps take about 5.5 s, the
start fades before the end, and the notes stop sounding like a tune.
Proposed: Easy at Hard's starting pace (450 / 170, 0.62 s a step) all
game; Easy keeps 3 hearts and no speed-up, Hard 1 heart and 6% quicker a
round. **Developer: yes.** `LEVELS.easy` in `src/core/follow-me.js`
(was 650 / 280). The gap's floor is now never above its start
(`min(gap, minOn * 0.4)`), or Easy's gap would have been 180, not 170;
Hard's numbers are unchanged (its round 40 still 260 / 104). Test: the
speed test wants Easy 450 / 170 in rounds 1 and 20, equal to Hard's
round 1; **shown to fail** on the old code ("on: 650, gap: 280").
`npm test` 183 of 183.

**The end of a game.** Before: the pads looked as in play, only the turn
line said it was over. Claude proposed dimming the pads and a "Game over"
banner with a big Play again in it. The developer: a second Play again
"would be confusing"; instead remove Play again and New game from the
screen, and show them only in the banner. Claude agreed: a stray tap
can't restart a game; the cost is no way back to setup mid-game but 🏠
(games are short). The developer wanted a mockup first.

**Mockup v3** ([Follow Me Mockup](https://claude.ai/artifact/CYBaCqBjipGMo88xYWr8tJ),
version 3), made from the real code this time, not by hand: the change
is in the working copy (not committed until agreed): `follow-me.html`
(a `.board` holding the pads and a hidden `#over` banner with the
buttons; the `.controls` row gone), `css/follow-me.css` (dimmed pads
`.pads.done`, the banner over the pads, out of the page's flow, so the
fit is the same), `src/ui/follow-me.js` (`showBanner` 2 s after the last
miss, after the right pad's blink, Play again focused; hidden on Play
again / New game; logged "game over banner"). A one-off script in
Claude's scratchpad bundles the page, its CSS and its 11 modules into
the one-file mockup, each module in its own scope.

Checked on the real page (built-in browser, port 8124, temporary entry,
removed), 393 x 760, 4 faces, Hard: during play the only buttons are the
pads and 🔊; page 760 of 760 high. A wrong tap: "Teddy got 1! New best!",
then the pads dimmed, the banner (Game over, Play again, New game),
Play again focused, no scrolling. Play again: banner gone, "Ready?", the
heart back. The pads stay 174 px here (limited by the width, not the
height, so no bigger without the buttons). The mockup bundle: its script
parses (`node --check`); the pane shows local files outside the project
only as static pages, so the bundle itself wasn't run before publishing.

## 2026-10-09: Game over banner agreed; a 3 s pause

**Developer, on mockup v3:** "Game Over banner looks good." Asked
whether the 🏠 works on the real game with the banner up ("I think it
should"); in the mockup it did nothing (Claude had pointed it at "#":
no home page there). It does: the banner covers only the pads. And the
pause before the robot's next order "still seems fast". Claude: it went
from 1.6 to 2.0 s, only 0.4 s more, easy to miss with Easy now quicker;
proposed 3 s: "Yes! 3!" 2 s, then "Watch me!" 1 s (a clear "get ready",
also before the first round and after "Oops! Watch again."). **Developer:
"Yes, make it 3 s".**

**Change:** the banner (as in mockup v3) committed; `YES_MS` 1500 ->
2000, `LEAD_MS` 500 -> 1000 (`src/ui/follow-me.js`).

**Tests:** `npm test` 184 of 184 (183 before). `tests/sound.test.js`:
the pause test now wants YES_MS 2000 and LEAD_MS 1000. New in
`tests/pages.test.js`: Follow Me's only buttons on the play screen are
Play again and New game, both in a `#over` banner that starts hidden,
inside a `.board` with the pads; no `.controls` row; the 🏠 above the
board, not in it; the screen shows the banner (`showBanner`) and hides
it on Play again and New game; the banner sits over the pads out of the
page's flow. **Shown to fail:** both on the code before the change ("no
.board around the pads and the banner"; "YES_MS: 1500"), and the banner
left showing (no `hidden`): "the banner shows during a game"; restored.
(My first try at the banner test had backspace characters for ``,
written by my edit script; fixed.)

**Checked in the built-in browser** (port 8124, temporary entry,
removed), 393 x 760: Easy, 4 faces: last right tap 2.656 s, "Watch me!"
4.677 s (2.02 s later), first robot note 5.673 s (1.00 s later): 3.0 s.
Hard, a wrong first tap: "Try again!", the banner up 2.3 s later (a
score of 0 gets it too); the top element at the 🏠's centre is the 🏠
link; a real click on it opened `index.html`. No console errors. (My
timing script mis-tapped round 2: it counted each lit pad twice; the
script, not the game.)

**Published** 2026-10-09 (developer: "Yes, publish"): `main`
fast-forwarded to `follow-me` at `ee495ed` and pushed. Live within about
40 s: the served `src/ui/follow-me.js` has `YES_MS = 2000` and
`showBanner`, `follow-me.html` the hidden `#over` banner,
`src/core/follow-me.js` Easy at 450 ms. Local servers then stopped (the
new CLAUDE.md rule): none were left running (Claude's 8124 stopped after
each check; the developer's 8123 stopped earlier this session). Not yet
tried by the developer.

## 2026-10-09: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with nine games, sound
and face names. Follow Me today: no ding for a right order; Easy at Hard's
starting pace (0.45 s lit, 0.17 s gap), steady; 3 s of quiet before the
robot's next order ("Yes! 3!" 2 s, "Watch me!" 1 s); at the end the pads
dim under a "Game over" banner holding the only Play again / New game.
Working branch `follow-me`, level with `main` but for the journal. `npm
test` 184 of 184.

**Next:** the developer tries the new Follow Me (the 3 s pause, Easy's
pace, the banner). Then more on this game or a new one: Spell the animal,
Maze, Sliding puzzle, Higher or lower ("One-player game ideas"). On hold:
a "go" button between rounds (only if the grandkids want breaks).

**New rule** (CLAUDE.md, 2026-10-09): once a publish is live, stop the
localhost servers. **Mockups** can now be made from the real code: a
one-off bundling script in Claude's scratchpad (not kept in the repo;
"Easy at Hard's starting pace; Follow Me mockup v3") turns a game page
and its modules into one self-contained file.

**Open questions:** none. **Proposed skill additions:** one waiting ("Tune by steps big enough to
notice"), to review together.


## 2026-10-09: Follow Me's home picture on light tints

**Developer, after trying the new Follow Me:** "New game is good." But
on the home page the Follow Me picture's tile "used color almost the same
as the color of the face"; the other games use a much lighter colour.
**Seen** (built-in browser, 393 x 760): the lit frog sat on its pad's
bright green (`--c`, #4FB264) under a #6CC24A frog; the other three pads
were already on their soft colours (`--soft`).

**Change** (`css/site.css`): the lit pad keeps its soft colour too
(#DDF1DF) and is marked by a 4 px ring in its bright colour inside the
tile, with the smiling face as before; the way Nim's picture shows the
picked matches (soft tint plus a ring). The play screen is unchanged
(there a lit pad flashes bright: the signal to watch).

**Tests:** `npm test` 185 of 185 (184 before). New in
`tests/pages.test.js`: the Follow Me picture's only pad background is
`var(--soft)`, and the lit pad has an inset ring in `var(--c)`. **Shown
to fail:** on the old CSS ("a pad background other than var(--soft)")
and with the ring removed ("the lit pad has no ring in its bright
colour"); restored. (My first try picked the whole match instead of its
selector and failed on the new CSS too: the test, not the page; fixed.)

**Checked in the built-in browser** (port 8123): computed backgrounds
#DDF1DF, #FFF0C4, #FDE1EB, #D8EBF9 (all soft); the frog's tile ringed
in #4FB264. No console errors. Screenshots before and after in
`Web-Games-testing\2026-10-09_fm-home-picture\`.

**Published** 2026-10-09 (developer: "Yes, publish"): `main`
fast-forwarded to `follow-me` at `9c8f1f1` and pushed. Live about 15 s
later (the served `css/site.css` has the lit pad's ring). Claude's local
server (8123) stopped; nothing left listening on 8123 or 8124. **Skill
addition dropped** (developer: tuning "is likely to be very game
dependent rather than an overarching generic rule"). **Purged** (developer's OK): `Web-Games-testing\2026-10-09_fm-home-picture\`
(the two screenshots) sent to the Recycle Bin.

## 2026-10-09: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with nine games, sound
and face names. The developer tried the new Follow Me: "New game is
good." Its home picture is now on light tints like the others. Working
branch `follow-me`, level with `main` but for the journal. `npm test`
185 of 185.

**Next:** a new one-player game, or more on an existing one. Ideas
("One-player game ideas"): Spell the animal, Maze, Sliding puzzle,
Higher or lower. On hold: a "go" button between Follow Me rounds (only if
the grandkids want breaks).

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-10: Stats with GoatCounter

**Developer:** wants to see which games are played, from where, totals
and over time; for GP-200 Patch Manager Web, which features are used.
One stats page per site, linked from each footer; nothing paid. After
the options (Q12): "Yes, go ahead with GoatCounter; make the stats
public." Signing up, the developer asked whether two accounts are needed:
no, GoatCounter's help ("Track multiple domains/sites") says one login
can hold a site per website. Self-hosting (the other way GoatCounter
offers) needs an always-on server: no. The site's domain at sign-up:
donpark2000.github.io (the pages' paths then link to the real pages).

**Checked first** (goatcounter.com): "offered for free for reasonable
public usage", donation-supported, no paid plans, no cookies; counting
without its script: GET `https://<code>.goatcounter.com/count` with `p`
(page, or event name, which can't start with '/'), `t` title, `r`
referrer, `s` screen, `e` event, `rnd` cache buster (help page
"Tracking pixel"); the dashboard's "Dashboard viewable by" setting.

**Built:** `src/core/stats.js` (no DOM: the site code `donpark-games`,
only the live host counts, page paths, `play-<game>` events, the
referrer only from another site, the count address) and
`src/ui/stats.js` (sends one count when a page opens and one on each
Play! / Play again, as an image request; logs each as "stats": "counted",
"not counted (localhost)", or "count not sent (blocked or offline)").
Loaded by every page but log.html; every footer gets "· Stats" (the
dashboard, new tab). Not counted: localhost, an automated browser
(`navigator.webdriver`). DESIGN.md: "Stats", the Platform rule and the
footer; CLAUDE.md's project rule.

**Tests:** `npm test` 193 of 193 (185 before). New `tests/stats.test.js`
(7): live host only (localhost, '', a look-alike host, webdriver: not),
page paths (index.html is its folder), event names (the home page
refused), the referrer, the count address (every parameter, an event with
only what was given), bad counts refused, the dashboard address. In
`tests/pages.test.js`: every footer has the Stats link (new tab), every
page but log.html loads `src/ui/stats.js`. **Shown to fail**, one at a
time: counting on any host ("localhost"), the home page as index.html
(2 failures), Nim without the script ("nim.html: no counts"), log.html
with it ("log.html: counts"), log.html without the link ("no Stats
link"); restored, 193 of 193.

**Checked in the built-in browser** (port 8123), 393 x 760, Nim: the log
has "not counted (localhost)" for the home page, nim.html, and
`play-nim` for Play! and again for Play again; no request to
goatcounter.com; the play screen still fits (page 760 px high in 760);
the footer still two lines (52 px), "Stats" after "code". No console
errors.

**Not yet:** a count from the live site (only after publishing; the site
code must match the one the developer signed up with).

**Site code** (developer, signed up and confirmed): `donpark2000`, not
the `donpark-games` built first; changed in `src/core/stats.js`, every
footer, DESIGN.md and the test. GoatCounter's sign-up page offered its
script tag (`count.js` from gc.zgo.at): not used, as it loads a script
from another site; our lines send the same count to the same
`https://donpark2000.goatcounter.com/count`. `npm test` 193 of 193. The
dashboard isn't public yet: `https://donpark2000.goatcounter.com/`
answers 303 to `/user/new` (sign in) without a login.

**Dashboard public** (developer: "Dashboard viewable by" set to "Anyone", under "Site settings" at /settings/main; the developer first could not find it). Checked: at first the dashboard still answered 303 to the sign-in page (the change wasn't saved yet: the developer had forgotten Save, not a cache); after the save, 200, title "donpark2000 – GoatCounter", without a login.

**Published** 2026-10-10 (developer: "Yes, publish"): `main`
fast-forwarded to `follow-me` at `8a83d05` and pushed; live about 25 s
later (the served `src/core/stats.js` has `donpark2000`, `nim.html`
loads `src/ui/stats.js`). **Checked on the live site** (built-in
browser; `navigator.webdriver` false, so it counts): the home page, Nim
and Play! logged "counted" for `/Web-Games/`, `/Web-Games/nim.html` and
`play-nim`; the requests went to `donpark2000.goatcounter.com/count`
(the home page's took 665 ms; no "not sent"). On the public dashboard
about 40 s later: `/Web-Games/nim.html` and `play-nim`, and the home
page as **`/Web-Games`** (GoatCounter drops the trailing slash; my first
search for `/Web-Games/` missed it: the search, not the count). So the
dashboard has a few visits of Claude's from this check. The built-in
browser reported its screen as 0 x 0 (`s=0,0,1`): the pane, not the
site. Claude's local server (8123) stopped; nothing left on 8123 or 8124.

## 2026-10-10: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with nine games, sound,
face names, and now **stats**: each page opened and each game started
(Play! / Play again) counted on GoatCounter, public at
https://donpark2000.goatcounter.com/ ("Stats" in every footer). Working
branch `follow-me`, level with `main` but for the journal. `npm test`
193 of 193.

**Next:** the same for **GP-200 Patch Manager Web** (Q12: which features
are used), in a session in that repo: the developer adds a second site
under the same GoatCounter login (Settings, Sites; its own code, e.g.
`donpark-gp200`; "Dashboard viewable by: Anyone", then Save); that
site's DESIGN.md also says nothing is loaded from other sites, so the
same approach (our own lines, no count.js). Then games: a new one-player
game (Spell the animal, Maze, Sliding puzzle, Higher or lower) or more on
an existing one.

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-10: App icon ideas

Q13 (play offline, installable app): the developer wants the icon
suggested. **Icon mockup v1** (private Claude artifact, throwaway:
[App Icon Ideas](https://claude.ai/artifact/EWvwWoB58C7JbtrV8z9btH)),
built by a scratchpad script from the site's own drawings
(`src/ui/faces.js`, `snlart.js` `cubeSvg`, `cardback.js`, `fmpads.js`), so
the icons match the games. Six ideas: A happy bear on yellow, B bear and
robot, C four in a row, D big die, E four friends (Follow Me pads), F card
flip. The page shows them large, on a mock phone home screen at real size
(60 px) with stand-in apps, at 32 and 24 px, with toggles for the name
("Let's Play!" / "Game Corner"), the shape (iPhone rounded square /
Android circle) and the wallpaper. Each keeps its picture inside the
middle circle (radius 40 of 100) so Android's circle cut loses nothing.
Not checked: the page wasn't looked at before publishing (the built-in
browser can't act on a local file outside the project).

## 2026-10-10: The offline app, built

Q13; DESIGN.md "Offline app". On branch `offline-app` (from
`follow-me`).

**What was built:** `manifest.webmanifest` ("Let's Play!", standalone,
sky-coloured bars, icons); `icons/` from `tools/make-icons.js` (the
happy bear from `faces.js`; PNGs drawn by headless Edge); `sw.js`
(saves all 68 site files on install, serves them first; network first on
localhost only); `tools/offline.js` (writes `sw.js`'s list and a
content version); `src/ui/offline.js` on every page (registers, logs
"offline"); every page's head links the manifest and icons; the home
page's title is now "Let's Play!"; `tools/serve.js` serves
`.webmanifest` as `application/manifest+json`.

**Findings on the way:**
- Headless Edge won't make a window narrower than about 500 px: the
  192 px and 180 px icons came out as the left edge of the picture only
  (seen: icon-192.png 1281 bytes, flat yellow and a sliver of circle).
  Fixed by drawing every size in a 512 px window, scaled with
  `--force-device-scale-factor`. The scaled 180 px one then had a faint
  light line on its right and bottom edges (rounding); the page behind
  the icon is now the same yellow, and it's gone (looked at, 192 and 180).
- git here turns LF into CRLF on checkout (warning on this repo), so the
  content version counts text files with LF; a test checks that CRLF
  gives the same version and that binary files aren't touched.

**Tests:** `tests/offline.test.js`, 15 checks, `npm test` 208 of 208.
`sw.js` runs in a Node `vm` with a fake cache and network: install
saves every file with `cache: 'reload'` and fails whole if one file
404s; activate deletes older `lets-play-` caches only; the live site
serves saved files with the network down (folder -> index.html, ?query
ignored), sends unsaved files to the network, leaves other sites and
POST alone; localhost fetches first and falls back to the saved copy.
Shown to fail: with `FRESH_FIRST = true` and the ?query kept, 2 tests
failed (the live-site one and the version message); a changed, added and
removed file are each reported by `check()` on a temp site.

**In the built-in browser** (Chromium), at http://127.0.0.1:8123/ (the
live-site behaviour):
- First visit: registered, installed and took over in 0.19 s; one cache,
  `lets-play-19e2c03b21a3`, 68 files; the log shows each step.
- **Server stopped** (a fetch of an unsaved file then failed: "Failed to
  fetch"): the home page (9 pictures drawn), all nine games (Play! shows
  the play screen; Matching Cards after picking player 2's face, 16
  cards), and log.html all loaded and ran. Five Dice, robot, long game:
  "robot values loaded" (1048576 bytes, 155 ms) with no server. The only
  console error was that probe fetch.
- **Update:** a comment added to css/site.css, `node tools/offline.js`
  (new version f62ec5a8f3b0), server restarted, home page opened: "a new
  version took over" after 1.7 s; the next page (nim.html) got the new
  CSS; the old cache was gone soon after (still listed at 2.5 s: with
  `skipWaiting` the page switches before activate finishes deleting).
  The change was then undone and the version restored.
- **localhost:** a CSS edit showed with no new version (network first).

**Not checked:** installing ("Add to Home Screen" / Install) on any
device; Safari (iPhone, iPad, Mac); Android; Firefox. The live site
(https) until it's published.

## 2026-10-10: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/ with nine games,
sound, face names, stats, and now the **offline app**: "Let's Play!"
with the happy bear icon, installable, every game playable with no
connection. Published 2026-10-10 (developer's OK): `main` fast-forwarded
to `offline-app` at `f53decf` and pushed; GitHub Pages served the new
`sw.js` about 20 s later. Checked live in the built-in browser: the
manifest is served as `application/manifest+json`; the home page's
title is "Let's Play!"; the service worker took over and saved 68 files
(`lets-play-19e2c03b21a3`); the four manifest icons answer 200. Local
servers stopped. Working branch `offline-app`; `npm test` 208 of 208.

**Next:** the developer's phone check, in a new session: on an iPhone
or iPad (Safari, Share, Add to Home Screen) and an Android phone
(Install), open once on wifi, then airplane mode and play each game from
the icon; do the icon and name look right? Then deal with anything
found, close Q13, and on to GP-200 stats (see the 2026-10-10 status
entry before "App icon ideas").

**Remember:** after any change to the site, `node tools/offline.js`
(the tests say so). On localhost edits show on a reload; 127.0.0.1
behaves like the live site.

**Open questions:** Q13 (until checked on devices). **Proposed skill
additions:** one (derived files from a tool, stale-checked by a test).

## 2026-10-11: The offline app on the developer's iPhone

The developer's report (2026-10-10 evening, in chat):

- **Finding the install button:** the page itself shows nothing to
  install (only the tab title and icon changed); Claude hadn't said so
  plainly, and the developer looked on the page. On the **Windows
  desktop**, Edge's "App available" icon in the address bar: "it
  installed fine". On the **iPhone** (Safari and Edge "look the same")
  the Share button wasn't found at first (newer Safari shrinks its
  toolbar); then "I found it. It works."
- **First launch in airplane mode: an error.** Expected: on iOS the
  installed app has its own storage, apart from Safari's, so the files
  Safari saved weren't the app's; it needs one launch online. With
  airplane mode off it played; airplane mode back on, it kept working.
- **Every launch in airplane mode shows an error message, but the game
  plays fine if it's ignored.** The message (developer, 2026-10-11):
  "Turn off Airplane Mode or use Wi-Fi to access data", one button,
  "Open Settings": iOS's own alert, shown when an app tries
  the network: on the live site `src/ui/stats.js` sends the page-open
  count at every launch, and WebKit checks `sw.js` for updates. Fix
  to try: no count sent when `navigator.onLine` is false; then see
  whether the alert remains (if so, it's the update check).

**Ideas from this** (proposed to the developer, to decide in the next
session): a **"Play without internet"** button on the home page (Chrome
and Edge: installs directly; iPhone/iPad: shows the steps with a
picture; hidden once installed); the steps to say "open it once from
the new icon on wifi" and why. Also: `log.html` can't be reached inside
the installed app (no address bar, nothing links to it), so a device's
offline log can only be read in the browser.

**Next session:** the stats fix (then check whether the alert remains); the
"Play without internet" button (mockup first); Android check.

## 2026-10-11: No counts offline; a version line on the home page

The developer (chat): go ahead with the stats fix; also wants to test
that the app updates itself to new versions, and asked for a version on
the home page ("I do not see any version info on my phone"). On the
update check: "if it is an iOS thing, it seems silly for it to try when
there is no data service."

**What was built** (branch `offline-app`):

- **Stats:** `whyNotCounted()` in `src/core/stats.js` (`shouldCount` now
  uses it) adds "no connection" when `navigator.onLine` is false; the
  page asks at each count, since the connection can come and go during a
  visit. The log says why: "not counted (no connection)".
- **Update check:** `src/ui/offline.js` doesn't call
  `navigator.serviceWorker.register('sw.js')` when offline (logged: "no
  connection: not registering (no check for a new version)"); it asks the
  running `sw.js` for its version instead. Told the developer plainly:
  the browser itself (WebKit) also checks for a new `sw.js` when a page
  opens (the service worker standard's update on navigation); a page
  can't turn that off. So if the alert remains after this, that check is
  the likely cause (or iOS alerts for any web app opened offline);
  measure before designing around it.
- **Version line:** `tools/offline.js` now also writes `MADE` (the day,
  YYYY-MM-DD) into `sw.js`, kept while the version is unchanged, today's
  date for a new one (`madeDay`); `sw.js` returns it with the version;
  `src/core/appversion.js` words the line; `#appVersion` under the home
  page's footer. Why a day as well as the content version: the developer
  can tell "new" at a glance, without knowing the hash.

**Evidence:** `npm test` 211 of 211 (208 + 3: offline counts and their
reasons; the version's day kept or renewed, a bad or missing day
refused/reported; the line's wording, incl. no day from an older
`sw.js`). Built-in browser on 127.0.0.1:8123 (behaves like the live
site): the first load was still an older saved copy (no `#appVersion`);
the log showed "a new version took over" 1.8 s after opening
(f62ec5a8f3b0 to 44603965c635), and the reload showed "Version Oct 11,
2026 · 446039". With `navigator.onLine` faked false and
`src/ui/offline.js` loaded again: `register` called 0 times, the log
line above, the version still shown. With a temporary CSS edit (new
version afd089fdc74e, then undone): reloaded, the line read "Version Oct
11, 2026 · 446039 (new version next time: Oct 11, 2026 · afd089)" within
4 s. At 375 px wide it wraps to two lines, no sideways scroll. Not
shown: the "not counted (no connection)" line in a browser (127.0.0.1
isn't the live site, which is checked first); the unit test covers it.

**To check on the iPhone, after publishing:** open the app once on wifi
(it fetches the new version in the background: the line shows the old
version, then "new version next time"); open it again: the new version.
Then airplane mode: does iOS's alert still show?


## 2026-10-11: Published; the version line checked live

The developer had opened the app on wifi before this was published and
saw no change (it was only pushed to the branch; Claude hadn't said
plainly that publishing waits for the OK). Published with the
developer's OK ("Yes, publish it"): `main` fast-forwarded to
`offline-app` at `27ab3c8` and pushed; GitHub Pages served the new
`sw.js` (version 44603965c635) about 20-30 s later. Checked live in the
built-in browser: the first open showed the old saved page (no version
line) while the new version was saved (`lets-play-44603965c635`); the
next open showed "Version Oct 11, 2026 · 446039". Local server stopped.

## 2026-10-11: The update seen on the iPhone; the alert remains

The developer (iPhone, installed app):

- **The update works, silently:** first open on wifi showed the old
  version; after opening a game and going back to 🏠 the version line
  appeared ("Version Oct 11, 2026 · 446039"). No message that a new
  version was downloaded. As designed.
- **The airplane-mode alert remains:** fully closed, then opened in
  airplane mode: iOS's "Turn off Airplane Mode or use Wi-Fi to access
  data" still shows. The game plays. Developer: "Not a big deal ...
  more of a cosmetic thing. But it would be nice to suppress it if
  possible."

**What this shows:** with this version the page sends no count and
doesn't register `sw.js` when offline (both tested in the browser, see
"No counts offline"), so the attempt comes from iOS/WebKit itself, not
the page: its own check for a new `sw.js` as the app opens, or the
launch itself. Not proven on the phone: the installed app has no way to
reach `log.html`, so its log can't be read there.

**Outside evidence** (web search, 2026-10-11): WebKit bug 182874 (2018),
a home-screen web app with a service worker in airplane mode; a reporter
there says a test site "sort of works" but still brings up the "turn off
airplane mode" dialog. No setting found that a page can use to stop it.
Conclusion: leave it; it's cosmetic. Measured, not designed around.

## 2026-10-11: The version line opens the log page

The developer: "we could add a link to the footer (a new link or attach
it to the version text to make it 'sort of hidden')". Claude took the
version text: it stays plain-looking (same colour as the footer, no
underline), and kids are unlikely to tap it. This replaces the
2026-10-07 rule "nothing links to the log page" (it was reachable only
by its address, which the installed app doesn't have). `log.html`
already has a 🏠 back to the games.

**Evidence:** `npm test` 211 of 211; the pages test now allows exactly
one link to `log.html`, the home page's version line. Shown to fail: a
temporary `<a href="log.html">` in nim.html gave "nim.html: links to the
log page" (then removed). Built-in browser on localhost: the line's
colour is the footer's (rgb(91, 113, 128)), no underline; a tap opened
`log.html`.

**Also discussed:** the developer didn't see the point of a "Play
without internet" button. Its point would be finding the install step
(the page itself shows nothing to install); if the developer installs
the app on the kids' devices themselves, it isn't needed. Developer will
check Android.


## 2026-10-11: The log link published; an update watched live

Published with the developer's OK ("Yes, publish it"): `main`
fast-forwarded to `offline-app` at `f0549fc`; GitHub Pages served `sw.js`
5b27e82150d1 about 30-40 s later. Checked live in the built-in browser,
which had 446039 saved: the first open showed "Version Oct 11, 2026 ·
446039" (no link: the old page); about 7 s later the line read "...
(new version next time: Oct 11, 2026 · 5b27e8)", and the old copy was
gone (`lets-play-5b27e82150d1` only); the next open showed "Version Oct
11, 2026 · 5b27e8" as a link to `log.html`. Local server stopped.

## 2026-10-11: navigator.onLine at launch

The developer's iPhone log (Copy on log.html, pasted in chat; iPhone
OS 18_7 in the user agent, Safari 27.0.1): cleared, then the app fully
closed and opened in airplane mode, version 5b27e82150d1:

    === 2026-10-11 12:14:49 index.html, 393x793 ===
    +0.007s [stats] counted {"what":"/Web-Games/"}
    +0.008s [offline] opened as the installed app {"online":true}
    +0.008s [offline] registered {...,"running":true,"installing":false}
    +0.008s [offline] saved for offline {"version":"5b27e82150d1",...}
    +0.012s [stats] count not sent (blocked or offline) {"what":"/Web-Games/"}

**What it shows:** in airplane mode, as it opened, the installed app
said `navigator.onLine` **true**, so neither check from "No counts
offline" applied: the page count was tried (and failed 5 ms later) and
`sw.js` was registered. So the alert may be the page's own doing after
all; "The update seen on the iPhone; the alert remains" concluded too
soon that it was iOS's. Corrected here. (A line the developer quoted
earlier, `opened as the installed app {"online":false}`, was from
another open, probably later after launch, so `onLine` likely becomes
right after a moment. Not yet measured.)

**Change:** `src/core/net.js` (`createNet`; `src/ui/net.js` the page's
copy): the page count and `sw.js` registration wait `SETTLE_MS` (2 s)
and use `navigator.onLine` then; the version line is still asked of the
running `sw.js` at once (no network). The log gets `navigator.onLine` at
0.5, 1, 2 and 4 s and each online/offline event ("net"), to see when iOS
gets it right. Cost: a home page left within 2 s isn't counted (the
game page it leads to is).

**Evidence:** `npm test` 214 of 214 (+3 in `tests/net.test.js`: online
at opening, offline by 2 s, gives offline; nothing before 2 s; the log
lines and events). Built-in browser, 127.0.0.1: version 6b971e50ac17;
"saved for offline" at 0.021 s, net samples at 0.5/1/2/4 s, "not
counted" and "registered" at 2.02 s.

**Next, on the iPhone:** clear the log, airplane-mode launch, copy the
log. Expected: "net after ... s" lines show when `onLine` turns false;
if by 2 s, no count tried and "no connection: not registering". Then:
does the alert still show?


Published with the developer's OK ("Yes, publish it"): `main`
fast-forwarded to `offline-app` at `e9b0801`; GitHub Pages served `sw.js`
6b971e50ac17 about 20-30 s later. Checked live in the built-in browser
(online): "Version Oct 11, 2026 · 6b971e"; net samples at 0.5/1/2/4 s,
"[stats] counted" at 2.011 s and "registered" at 2.020 s. Local server
stopped.

## 2026-10-11: The alert is iOS's own

The developer's iPhone log, version 6b971e50ac17 (cleared, app fully
closed, opened in airplane mode, log copied about 20 s later), and "I
still see the airplane mode error":

    === 2026-10-11 12:21:37 index.html, 393x793 ===
    +0.013s [offline] opened as the installed app {"online":true}
    +0.014s [offline] saved for offline {"version":"6b971e50ac17",...}
    +0.513s [net] after 0.5 s {"online":true}
    +1.014s [net] after 1 s {"online":true}
    +1.814s [net] offline event {"online":false}
    +2.014s [net] after 2 s {"online":false}
    +2.015s [stats] not counted (no connection) {"what":"/Web-Games/"}
    +2.015s [offline] no connection: not registering (no check for a new version) {"running":true}
    +4.014s [net] after 4 s {"online":false}

**What it shows:** iOS says the installed app is online for about 1.8 s
after it opens in airplane mode, then sends an offline event. With the
2 s wait, the page tried no network at all (no count, no registration),
and the alert still showed. So it comes from iOS/WebKit itself: most
likely its own check for a new `sw.js` as the app opens (the service
worker standard's update on navigation), which a page can't turn off,
or the launch itself. The 1.8 s turn may be that check failing.
Earlier conclusion ("The update seen on the iPhone; the alert remains")
now has the evidence it lacked.

**Decision:** leave the alert (developer: cosmetic, the games play).
Keep the 2 s wait: it stops the page's own attempts and costs only a
home page count left within 2 s. Keep the "net" log lines for now; trim
once Android is checked.

## 2026-10-11: Status (start here next session)

**Live:** https://donpark2000.github.io/Web-Games/, version
6b971e50ac17 ("Version Oct 11, 2026 · 6b971e" under the home page's
footer). Published today, each with the developer's OK: no counts sent
offline; the version line (tapping it opens the log page, the only way
there in the installed app); a 2 s wait before the page count and
`sw.js` registration, with `navigator.onLine` logged after opening.
Branch `offline-app` = `main` plus journal commits; `npm test` 214 of
214. Local servers stopped.

**iPhone (done):** the app installs, plays offline, and updates itself
silently (old version on the first open, new on the next page opened).
iOS's airplane-mode alert at launch stays: it's iOS's own (see "The
alert is iOS's own"); the developer is fine with it.

**Next:** the developer's **Android check** (Chrome, ⋮ menu, Install
app; open from the icon, a game and back so the version line shows;
airplane mode, play; icon and name right?). Then close Q13, trim the
"net" log lines if not needed, and on to GP-200 stats (see the
2026-10-10 status entry before "App icon ideas"). The "Play without
internet" button: dropped for now (the developer installs the app).

**Remember:** after any change to the site, `node tools/offline.js`
(the tests say so). The version line shows the day `tools/offline.js`
made the version.

**Open questions:** Q13 (Android). **Proposed skill additions:** two
(derived files stale-checked by a test; don't trust a status flag at
startup).

## 2026-10-11: Android checked; Q13 closed

The developer, on a Samsung Galaxy Tab: "it works good"; the install
worked well and there were no errors starting with wifi off (no alert
like the iPhone's). Q13 moved to Resolved. Nothing in this project is
waiting; the developer asked what's next and whether a new session is
needed (see the reply in chat: the "Later" list in DESIGN.md, and GP-200
stats in that repo).

**Open questions:** none.


## 2026-10-11: The version line always shows the version

**What the developer saw:** the live home page, opened with Ctrl+F5 in
a browser, said "Not saved for offline yet" under the footer instead of
the version. The developer: "The version should always be the version",
and asked how a site could know it wasn't installed as an app ("reading
data from my system that is not authorised or controlled by me").

**Why:** the line asked the running `sw.js` for its version
(`navigator.serviceWorker.controller.postMessage('version')`). Ctrl+F5
(a hard reload) loads the page past `sw.js`, so the page has no
controller, nobody answers, and the line fell back to "Not saved for
offline yet", though the site was saved. (A first visit looks the same.)
So the message was wrong as well as unwanted: it didn't mean "not
saved" or "not installed".

**What the page can and can't see** (the reply in chat, for the record):
it never knew whether the app was installed for that line. It asked only
whether this page came through this site's own `sw.js`. The site can
see two things about itself, both standard and both only for its own
address (donpark2000.github.io): its own `sw.js` and the files it saved
(Cache Storage, in the browser's own storage for that site), and
whether it's open in an app window or a browser tab (the CSS media query
`display-mode: standalone`, written in the debug log only, kept on the
device). It can't see other sites, files, or which apps are installed.
The developer controls both: the browser's site settings for
donpark2000.github.io (clear data removes the saved copy and the debug
log), and uninstalling the app.

**Fix:** `tools/offline.js` now also writes `src/core/version.js`
(`VERSION`, `MADE`), which `src/ui/offline.js` imports, so the line
shows the page's own files' version however it was loaded. That file is
in the saved list but left out of the version's hash (it holds the hash).
"(new version next time: …)" now shows only after a version takes over
while the page is open (`controllerchange`), not on the first answer
from `sw.js`. The log gains "this page is not from the saved copy (not
saved yet, or a hard reload)". `check()` reports a missing or stale
`src/core/version.js`; the new `update()` does what the command did, and
the tests' small site is made with it.

**The "net" log lines trimmed:** `navigator.onLine` at 0.5/1/2/4 s
answered its question ("navigator.onLine at launch") and the iPhone and
Android are checked; removed (`SAMPLES_MS`). The 2 s wait stays; each
online/offline event is still logged.

**Evidence:** `npm test` 215 of 215 (net: a test that the log has only
the events, nothing on a timer; offline: version.js matches and its day,
a stale, missing or CRLF one, left out of the hash, a new version
rewriting both). In Claude's browser at http://127.0.0.1:8123/ (behaves
like the live site): with `sw.js` unregistered and the saved files
deleted, the home page loaded with no controller and nothing saved and
showed "Version Oct 11, 2026 · 60d967" at once. Update path: a throwaway
line added to `css/log.css` and `node tools/offline.js` (c5a487); the
next load showed "Version … 60d967", 4 s later "(new version next time:
Oct 11, 2026 · c5a487)", and the next page "Version … c5a487". The
throwaway line was undone (back to 60d967).

**Also:** DESIGN.md's status line still said the version line was "not
yet published"; fixed. The two proposed skill additions approved by the
developer and added (see "Proposed additions").

**Open questions:** none.

## 2026-10-11: Status (start here next session)

**Branch `version-line`** (from `offline-app`): the version line from
the page's own files, the "net" log trim, DESIGN.md brought up to date.
`npm test` 215 of 215. **Not published**; needs the developer's OK.
After publishing: on the live site, Ctrl+F5 on the home page should show
"Version Oct 11, 2026 · <new version>", never "Not saved for offline
yet"; the iPhone's app shows the new version on its second opening.

**The skill:** two additions committed and pushed in ai-dev-practices
(c06e60b); the developer uploads the new zip (`software-project-
standards.zip` in that repo, rebuilt).

**Next:** GP-200 stats (that repo), or the DESIGN.md "Later" list.

**Open questions:** none.

## 2026-10-11: The version line published and checked live

Published with the developer's OK ("You go ahead"): `main` fast-forwarded
to `version-line` (e9b0801..8ec19a0); the Pages build for 8ec19a0
succeeded, and the live `src/core/version.js` says 60d967d73c47
(2026-10-11). (An earlier "I pushed it" turned out not to be: `main` was
still e9b0801, the local reflog showed no merge; the developer: "I did
not push".)

**Checked in Claude's browser on the live site:** a plain load showed
"Version Oct 11, 2026 · 60d967", saved as `lets-play-60d967d73c47`. Then,
with `sw.js` unregistered and the saved files deleted (what Ctrl+F5
gives: no controller), the next load showed "Version Oct 11, 2026 ·
60d967" at once (controller none, nothing saved). Before this change
that case showed "Not saved for offline yet".

The developer uploaded the new skill zip. Local servers stopped (Claude's
preview; no other `tools/serve.js` running).

**Open questions:** none.

## 2026-10-13: A puzzle for grown-ups; Hidden Faces mockup v1

**The idea** (developer): phone games like "Zoodoko" and "Meowdoku": an
N x N grid in N joined colour regions hides N animal faces, one per row,
column and colour. Tap once for ✕, twice to look; a wrong look is a red
✕, too many and you lose; a few hints and "show me one face"; sizes
6 x 6 up to 10 x 10. Claude: the puzzle is Star Battle with one star
(LinkedIn's "Queens" is the best known), usually with a fourth rule, no
two faces touching, not even at a corner. The rules can be copied, not
those games' names or art.

**Decided (developer):**
- **For the developer, not the kids** ("I wanted it for me").
- **On this site, kept apart** ("I lean towards keeping them together"):
  Claude proposed a third home-page group under the other two.
- **No-touching rule in** ("Yes definitely - no touching rule. That is a
  key part to the logic in some scenarios").

**Puzzle maker and solver** (scratchpad for now; to `src/core/` when
built): the solver uses only steps a person can see, each with its rule
and reason, so the same steps are the hints. Rules, easiest first: a
row/column/colour with one square left (single); a unit's squares all
inside another unit, so the rest of that one is out (inside); a square
whose face would rule out every square left for some unit (touch); k
colours confined to k rows or columns, or the other way (group); and a
one-level "try it and something runs out" (tryit, for hints only). A
puzzle the solver finishes has exactly one answer. The maker places
faces at random (none touching), grows a colour out of each, then moves
single squares between neighbouring colours while the solver gets
further (rules up to "group"). **Measured:** 6 x 6 to 10 x 10 each
made in 0 ms to 2.3 s (1 to 3 tries). **Too easy as they come:** 4 of
15 needed only "single" steps; for the mockup Claude kept puzzles needing
"inside", "touch" or "group" in at least 60% as many steps as the size
(3 per size, from seeds n*10000 on). Difficulty levels still to design.

**Mockup v1:** [Hidden Faces Mockup](https://claude.ai/artifact/HiQ1FiMsGUMRxGfoYfNXRs)
(private Claude artifact, version 1). Built from the site's own
`site.css`, `game.css`, faces and names by a script in Claude's
scratchpad; the solver runs in the page for the hints. Claude's choices,
all open:
- **Name "Hidden Faces"**; home group **🧩 Puzzles for grown-ups**, a
  tile with a 5 x 5 puzzle under way.
- **Setup:** the rules with a solved 5 x 5; **Who's hiding?** (the
  site's 14 faces; one face hides everywhere); **Size** 6 x 6 to
  10 x 10; **When you find a face:** Auto ✕ (its row, column, colour and
  neighbours get ✕s; default) or I'll do it.
- **Play:** 🏠, "<face> 8×8 · puzzle 1", 🔊; hearts ❤️❤️❤️, "3 of 8
  found", a clock; the board as big as fits (thick lines between
  colours); a hint bar always 3 lines high (so a hint never moves the
  board); Undo, 💡 Hint (3 per puzzle), 👁 Show (1 per puzzle).
- **Taps:** empty to ✕; a ✕ to look. A face pops in; a wrong look is a
  red ✕ that stays, shakes, and costs a heart (3 hearts: the third
  wrong look ends it). Drag from an empty square to ✕ every square
  passed; drag from a ✕ to rub ✕s out. Undo takes back ✕s and rub-outs,
  never a look.
- **Hints:** first a wrong ✕ ("This ✕ is wrong: there's a face under
  it"), then ✕s a found face already implies (with I'll do it), then the
  solver's next step in words, the reason squares ringed in yellow, the
  squares to cross out blinking, or a blue ring where a face must be. A
  hint never changes the board; the player acts on it.
- **The end:** the result in the hint bar and Next / Same size (or Try
  again / Another) / New game in place of the tools, so the board stays
  in view. Win: the faces smile and wiggle; "Solved! 4:12 · 1 mistake ·
  0 hints", best time per size. Out of hearts: the faces not found show
  pale and sad. Next goes one size up, to 10 x 10.
- No sound in the mockup.

**Checked** (served on localhost from the scratchpad, built-in browser,
393 x 760; a temporary `.claude/launch.json` entry, removed after): 6 x 6
fits with 59 px squares, 10 x 10 with 35 px, no page scrolling either
way; a drag marked 4 squares; a wrong look cost a heart; a right look
with Auto ✕ filled its row, column, colour and neighbours; hints gave
"inside" ("All the squares left for row 1 are in Yellow...") and a
mid-game "inside" on Blue/column 4 with the right squares blinking; a
win and a loss each showed their result and buttons; Try again restarted
with 3 hearts. **Found and fixed while checking:** found faces had the
face picker's grey-blue background (a shared `.face` class name); the
first end banner covered the board, hiding where the faces were (moved
below it); looks still worked after a loss. Not yet tried in the
desktop app's viewer.

**Open questions:** none yet; the mockup choices above are for the
developer.

## 2026-10-13: Mockup v2: hints easier to see

**Developer** (after playing v1): "It is working really well. I find the
hints visually hard to see sometimes. Like 'if you see a face here' sort
of hint but it is not clear where 'here' is." **Why:** in v1 the square a
"touch" hint means was marked only by a thin blinking blue ✕, and the
reason squares by a yellow ring that vanished on a Yellow region.

**v2** ([Hidden Faces Mockup](https://claude.ai/artifact/HiQ1FiMsGUMRxGfoYfNXRs),
version 2):
- **Spotlight:** while a hint shows, every square it isn't about fades
  (35% opacity, mostly grey); the ones it is about keep their colour
  and get a dark edge. Works on any region colour.
- **The square a hint means** (a face must be there, a face can't be
  there, or a wrong ✕) gets a thick black ring inside a white one,
  pulsing; the text names it: "the ringed square (row 3, column 1)".
- **Squares to cross out:** a dark ✕ with a white edge, blinking.
- Texts shortened to fit the 3-line hint bar at 393 px wide, e.g. "A face
  on the ringed square (row 3, column 1) would rule out the lit squares,
  the last ones for column 2. So cross it out."

**Checked** (built-in browser, 393 x 760, the scratchpad server again,
its `.claude/launch.json` entry removed after): a hint of each kind,
reached by running the solver up to that kind of step (inside on 6 x 6,
touch on 6 x 6 and 10 x 10, group on 7 x 7 and 9 x 9, single on 8 x 8):
none overflowed the bar; the spotlight dimmed the rest (opacity 0.35);
the ring and ✕s show on tan, grey and purple squares. (Found on the way:
an apostrophe in a quoted string broke the whole script; caught before
publishing.)

## 2026-10-13: Hidden Faces agreed

**Developer:** "Hints are much better now. The name is fine. hearts and
hint counts are fine, auto X on by default is fine." Rubbing out
(explained: a drag that starts on a ✕ removes the ✕s it passes; a
plain tap on a ✕ looks): "Yes keep it". Then: "go ahead and build it.
And push and commit and publish." Recorded in DESIGN.md, "Hidden Faces".

## 2026-10-13: Status (start here next session)

**Branch `star-battle`** (from `version-line`; `main` is 8ec19a0, behind
only by journal commits): journal and DESIGN.md only, no code yet.
`npm test` not run this session (nothing in the repo changed but docs).

**Next: build Hidden Faces** as agreed (DESIGN.md "Hidden Faces"), then
**publish** (developer's OK given: "go ahead and build it. And push and
commit and publish"); check it on the live site after, and stop the
local servers.

**The prototype code is inside mockup v2** (the scratchpad it was built
in belongs to this session): read
https://claude.ai/artifact/HiQ1FiMsGUMRxGfoYfNXRs with the Artifact
tool's `read` action. Its one `<script>` holds, in order: `players.js`
and `faces.js` (copies of the repo's), then `const HF = (() => {...})()`
(the solver and puzzle maker: `mulberry32`, `seenBy`, `newState`,
`place`, `nextStep`, `solve`, `generate`; meant for
`src/core/hidden-faces.js`, already free of DOM code), `const PUZ` (the
mockup's 15 puzzles), then the screens (hints in `findHint`, drags in
the pointer handlers, the fit in `fit`). Its `<style>` ends with the
game's own CSS (after `site.css` and `game.css`), from the comment
"Hidden Faces mockup v1".

**Plan** (standards: debug log, a test with each part, `npm test`):
1. `src/core/hidden-faces.js` from `HF`, with tests: the solver on known
   puzzles (each rule, a puzzle it can't finish, one that is broken),
   `generate` gives one answer with no touching faces, every region
   joined; hint wording can stay in the UI.
2. A tool (`tools/hidden-faces-puzzles.js`) that writes the puzzle stock
   to `data/`, and a test that the stock is valid (each solves to its
   stored answer). Choose difficulty: the mockup kept puzzles needing
   inside/touch/group steps in at least 60% as many steps as the size;
   about 4 in 15 come out with "single" steps only. How many per size:
   to decide (a few hundred is still small).
3. `hidden-faces.html`, `css/hidden-faces.css`, `src/ui/hidden-faces.js`
   from the mockup (drop the mockup bar and its home view); the home
   page's third group and picture; sounds from `src/ui/sounds.js`
   (tick, ding, uhoh, win, aww exist); `stats.js`, `offline.js`; the
   offline file list (`node tools/offline.js`; a test fails while it's
   stale); `pages.test.js` and README's list of games.
4. Check in the built-in browser at 393 x 760 and on a wide screen, then
   publish with the OK above.

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-13: Hidden Faces built

Built as agreed (DESIGN.md "Hidden Faces"), from mockup v2's code.

**Files:** `src/core/hidden-faces.js` (solver, puzzle maker, colours,
the game: taps, drags, undo, Show, hints with their words, progress),
`src/ui/hidden-faces.js` (screens), `src/ui/hfboard.js` (board lines and
the small pictures), `hidden-faces.html`, `css/hidden-faces.css`,
`tools/hidden-faces-puzzles.js`, `data/hidden-faces.json`; the home
page's third group "🧩 Puzzles for grown-ups"; tests
`hidden-faces.test.js` (17), `hidden-faces-stock.test.js` (2), and
`pages.test.js` (ten games, three groups, the end buttons).

**Changed from the mockup's code, and why:**
- **Shuffles** were `sort(() => rnd() - 0.5)`, which depends on the
  browser's sort; now Fisher-Yates, so a seed makes the same puzzle and
  colours everywhere. The puzzles therefore differ from the mockup's.
  The 5 x 5 picture is now `generate(5, 50001)` (needs "inside" and
  "touch").
- **Hint words moved into `src/core/`** (no DOM in them), so the tests
  can follow the hints.
- **A win didn't make the faces smile** (the mockup had the same gap):
  `draw()` only redrew a square whose mark changed, never one whose mood
  did. Found in the browser (winner faces looked normal); fixed by
  keeping the mood on each square. Same fix makes all faces sad at a loss.
- **Kept on the device** (not in the mockup; Claude's choice): the next
  puzzle per size and the best time per size (`web-games-hidden-faces`).
  Otherwise every visit would start at "puzzle 1". **The clock stops**
  while the page is hidden.
- **Stats:** "Same size" and "Another" also start a new puzzle, so
  `src/ui/stats.js` now counts any button marked `data-play` too (the
  main end button is `#againBtn`, counted already).

**The stock** (the plan's open choices, defaults given at session start;
no objection): one difficulty, 200 per size. Measured before choosing
(15 seeds per size, one core): make time average / max 12 / 27 ms
(6 x 6), 46 / 149 (7), 190 / 680 (8), 834 / 2803 (9), 3906 / 12771 ms
(10); kept by the bar 4, 6, 4, 5, 5 of 15. So the tool spreads seeds over
15 worker threads and keeps the first 200 passing seeds in seed order
(deterministic). Full run: 324 s; seeds tried 606, 594, 497, 553, 427;
file 103 KB. **A stall on the way:** a first measuring script printed
nothing for 10 minutes: it looked for a 5 x 5 seed with the default 60
tries x 400 moves, and a 5 x 5 seed that fails runs all 24,000 solves.
Timing one make at a time showed it.

**Tests and how they were shown to fail:**
- Every solver step on 6 test puzzles is right for the real answer
  (placed faces in it, ruled-out squares not), and every rule is used.
  It first failed: no test puzzle needed "group"; added `generate(6,
  60023)`, and one needing "try it" (`generate(6, 172, { maxLevel: 4 })`,
  which the stock's rules can't finish).
- Following only the hints solves each test puzzle with no wrong look.
- `problems()` reports each kind of broken puzzle (wrong size, a colour
  outside 0..n-1, a colour in two pieces, a face missing, two in a row,
  touching, another answer).
- **Mutation:** the "touch" rule changed to rule out its reason squares
  (in a scratch copy): 4 tests failed.
- **Stock:** all 1000 puzzles pass `problems()` and the bar (1 s); the
  first puzzles of 6, 7 and 8 are remade from their seeds (3.5 s; with 9
  and 10 it took 36 s, too slow for every run). One region digit changed
  in the file: both stock tests failed; file restored, checked with
  `cmp`.
- `npm test`: 235 pass, 0 fail, 12.7 s.

**Checked in the built-in browser** (localhost, `.claude/launch.json`
"web-games"):
- 393 x 760: home page shows the third group and its 5 x 5 picture;
  setup loads the puzzles (Play! enabled); 10 x 10 fits at 35 px
  squares, 6 x 6 at 59 px (as the mockup), page height 760 = screen, no
  sideways scroll.
- Real clicks: a tap put a ✕, a second tap looked (a red ✕, a heart
  lost); a drag over 4 squares ✕ed them, a drag from a ✕ rubbed out 2,
  Undo put them back; a hint ("The lit squares, all that's left for
  row 1, are all in Brown...") with the spotlight.
- With pointer events from a script: a 10 x 10 and a 6 x 6 solved
  ("Solved! 0:45 · 1 mistake · 1 hint. Your best for this size!", Next /
  Same size / New game, faces smiling after the fix); Same size gave
  puzzle 2; Show found 1 and greyed; three wrong looks: "Out of
  hearts", 5 pale sad faces (the one shown stays), taps refused; Try
  again: same puzzle, 3 hearts; Another: puzzle 3, kept on the device.
- 1280 x 800: 6 x 6 at 81 px, 10 x 10 at 48 px, no scrolling. (The
  emulated resize sent no `resize` event, so the board kept 59 px until
  one was sent; a real window sends it.)
- No console errors; 54 "hidden-faces" lines in the debug log. My test
  progress removed from the browser's storage after.

**Open questions:** none.

## 2026-10-13: Hidden Faces published

Published with the developer's OK ("publish"; a first try was blocked by
Claude Code's permission check, and the developer then said "publish"):
`main` fast-forwarded to cde3ea5 and pushed; the Pages build for cde3ea5
was "built" after about 40 s. **Checked live** (built-in browser,
393 x 760): `hidden-faces.html` loads version 3cd033e894d5 (2026-10-13),
the puzzles load from the site, 8 x 8 fits at 44 px with no scrolling,
no console errors; the home page shows the three groups, the 5 x 5
picture (25 squares) and "Version Oct 13, 2026 · 3cd033". Claude's local
server stopped; no other `serve.js` running.

## 2026-10-13: Status (start here next session)

**Branch `star-battle`**, `main` = cde3ea5 plus journal-only commits
after it. Hidden Faces is live. `npm test`: 235 of 235.

**The skill:** "Time one run before looping over many" added
(ai-dev-practices 4e545f1); the developer uploads the rebuilt zip.

**Next (developer's choice):** play Hidden Faces on the phone and say
what to change; difficulty levels for it (the stock tool can keep more
than one bar); or the DESIGN.md "Later" list.

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-13: Hidden Faces: no zoom on two quick taps

**Report (developer, on the phone):** tapping a square twice (✕, then
look) uncovered a face and the page zoomed in on that part of the board;
the rest of the board was out of view and there was no obvious way to
zoom back out.

**What it is:** the iPhone's own double-tap zoom. The board already had
`touch-action: none` (for the drags) and `preventDefault()` on
`pointerdown`, which should stop it, and on the phone didn't. Why not is
unknown (no iPhone here to look into it). The other nine games don't
have the problem: their tap targets are all `<button>`s, which get
`touch-action: manipulation` from `css/site.css`; Hidden Faces' squares
are `<div>`s inside the board (checked by grepping `src/ui/` for tap
handlers: the board's are the only ones not on a button).

**Fix:** the board cancels each touch's end (`touchend`,
`preventDefault()`, a listener with `{ passive: false }`), the usual way
to stop the iPhone's double-tap zoom; the taps and drags run on pointer
events, which still come. The play screen also has
`touch-action: manipulation`, so a double tap just outside the board
(the hint bar, the status line) doesn't zoom either. Pinch zoom is left
alone. Debug output: "quick second tap: zoom blocked {ms}" when two
touches end on the board within 400 ms.

**Evidence:**
- `npm test`: 236 of 236 (one new: "Hidden Faces' board blocks the
  iPhone's double-tap zoom", reading the JS and CSS). Shown to fail three
  ways: the listener passive, no `preventDefault()`, no `manipulation`
  on the play screen; each reported, and it passes once restored.
- Built-in browser, 393 x 760 with touch emulated, localhost: a tap
  made a ✕ and a second found the bear (Auto ✕ around it); a drag ✕-ed
  the bottom row; two synthetic `touchend`s on the board both came back
  `defaultPrevented: true`, the second logged "quick second tap: zoom
  blocked"; computed `touch-action` none on the board, manipulation on
  the play screen; no console errors.
- **Not shown:** that the iPhone no longer zooms. The built-in browser
  sends mouse clicks and has no double-tap zoom. Q14 stays open until
  the developer tries it on the live site.

`tools/offline.js` run: version 7a02753c1849.

## 2026-10-13: No-zoom fix published

Published with the developer's OK ("publish"): `main` fast-forwarded to
be4b75e and pushed; the Pages build for be4b75e was "built". **Checked
live** (built-in browser): the server sends version 7a02753c1849 and the
new `#play` rule and `touchend` listener (curl). The browser first
showed the old version (3cd033e894d5) from its offline copy of the last
check; after one reload the new one had taken over (computed
`touch-action`: manipulation on the play screen, none on the board), as
DESIGN.md "Offline app" says. At 393 x 760: a tap made a ✕ and a second
found the bear; two synthetic `touchend`s on the board were both
cancelled and "quick second tap: zoom blocked" was logged; no console
errors. Claude's local server stopped; no other `serve.js` running.

Q14 stays open: the developer tries two quick taps on the iPhone (the
installed app picks up the new version on its second opening with a
connection).

## 2026-10-13: Status (start here next session)

**Branch `star-battle`**, `main` = be4b75e plus journal-only commits
after it. Hidden Faces' no-zoom fix is live. `npm test`: 236 of 236.

**Next (developer's choice):** check Q14 on the iPhone (two quick taps
on a Hidden Faces square: no zoom); then, as before, more Hidden Faces
feedback, difficulty levels for it, or the DESIGN.md "Later" list.

**Open questions:** Q14. **Proposed skill additions:** none waiting.

## 2026-10-13: Q14 closed; the hint bar empty between hints

**Q14:** the developer, on the iPhone: "I am no longer seeing zooming."
Moved to Resolved.

**Report (developer):** after the 3 hints were used, the hint bar still
said "Tap 💡 for the next step, explained.", which was confusing with
nothing left to tap; and not needed at all, since the button has a 💡
and the word "Hint".

**Change:** between hints the bar has no words and is hidden
(`visibility: hidden`), but **keeps its 3-line space**, so a hint (or
the end's result, which uses the same place) still never moves the board
(DESIGN.md: "a hint never moves the board"). `display: none` would have
given the space up and moved the tools on every hint. (Claude's choice
of an empty space over an empty white box: an empty box looks like
something is missing.)

**Evidence:**
- `npm test`: 237 of 237 (one new: "Hidden Faces' hint bar is empty and
  hidden between hints, its space kept"). Shown to fail with words put
  back in `clearHint()` and with `display: none`; passes once restored.
- Built-in browser, 393 x 760, localhost: board top 110, hint bar top 480
  and 83 px high, tools top 573 at the start (bar empty, hidden), after
  each of 3 hints (bar showing) and after a tap with no hints left (bar
  empty, hidden, 💡 Hint greyed): no movement, no scrolling. Lost on
  purpose (3 wrong looks): "Out of hearts. The pale faces show where
  they were." shows in the bar; Try again empties and hides it again. No
  console errors.

`tools/offline.js` run: version 0bb49faa688f.

## 2026-10-13: Empty hint bar published

Published with the developer's OK ("publish"): `main` fast-forwarded to
8ff36cf and pushed; the Pages build for 8ff36cf was "built", and the
server sends version 0bb49faa688f and `.hintbar.idle { visibility:
hidden; }` (curl). **Checked live** (built-in browser, 393 x 760, after
one reload for the offline copy): the bar empty and hidden at the start,
a hint showing in it, empty and hidden again after a tap; board top 110
and tools top 573 throughout; no console errors. Claude's local server
stopped; no other `serve.js` running.

## 2026-10-13: Status (start here next session)

**Branch `star-battle`**, `main` = 8ff36cf plus journal-only commits
after it. Live today: Hidden Faces' no-zoom fix (checked on the iPhone
by the developer) and the empty hint bar. `npm test`: 237 of 237.

**Next (developer's choice):** more Hidden Faces feedback from play;
difficulty levels for it; or the DESIGN.md "Later" list.

**Open questions:** none. **Proposed skill additions:** none waiting.

## 2026-10-13: Hidden Faces: undo a wrong look

The developer: an accidental double tap on an empty square made a red ✕
(a wrong look, a heart lost) and Undo couldn't take it back; "Being able
to undo errors is kind of the whole point of undo, isn't it?"

**Why:** a tap on an empty square puts a ✕, a tap on a ✕ looks under it,
so two quick taps are ✕-then-look. Undo was built to take back ✕s and
rub-outs, never a look (mockup v1: undoing a wrong look gives the heart
back, so looking would be free). **A second fault found in the code:**
after the slip, Undo popped the ✕ tap's step, whose square was now a red
✕, so it changed 0 squares: a press that did nothing, with no sign why.

Offered three options (ignore a quick second tap; Undo takes back a
wrong look, the mistake still counted; both). **The developer chose
both:** "I get the whole 'cheating' aspect but it is a game you are
playing on your own. What's the point of cheating?"

**Built** (`src/core/hidden-faces.js`):
- A wrong look is its own undo step (`{ look: square }`): undone, the red
  ✕ is a ✕ again and `hearts` goes back up; `mistakes` stays, so the
  result line still says "1 mistake". A found face is never undone. The
  look that ends the game can't be (the game is over; Q15).
- `undo` skips steps that would change nothing (every square since
  became a face, or is already what it was), and `canUndo` (the Undo
  button) is false when no step would change anything. A step's squares
  now count only if they really change (`marks[i] !== before`).
- `tap(g, i, now)`: a tap on a ✕ within `QUICK_MS` (400 ms) of the tap
  that put it is `{ ok: false, why: 'quick' }`, and each slip restarts the
  wait, so a quick triple tap doesn't look either. Only two taps on the
  same square: a tap elsewhere in between ends it. No `now` (the tests'
  older calls), no slips. The screen passes the pointer event's
  `timeStamp`.
- Debug log: "quick second tap on a new ✕: a slip, not a look"
  {square}; "undo: a wrong look taken back, the heart back" {squares,
  hearts}; "undo" now also logs hearts.

**Tests:** three new ones in `tests/hidden-faces.test.js` (a wrong look
undone, then the ✕, then nothing; a wrong look on a dragged ✕ undone
before the drag; the game-ending look not undoable; no-op steps skipped,
including a rub-out a face's Auto ✕ has put back; quick taps: slip,
slip again, look after a pause, another square not held back, no time
no slip). **Shown to fail first**: run against the old rules (with only
`QUICK_MS` and a naive `canUndo` stubbed in), all three failed, the
first exactly on the developer's bug (`undo` returned 0, expected 1).
One of Claude's own expectations was wrong (a quick tap back on square A
after a ✕ on B, expected a slip; it's a look, and should be) and was
fixed in the test, not the rule. `npm test`: 240 of 240.
`tools/offline.js`: version dd76ea56d345.

**Checked in the built-in browser** (localhost:8123, 393 x 760, 6 x 6
puzzle 1): a double click on row 1, column 1 (next to the one-square
brown colour, so no face): the log shows the ✕ (tick at 10.664 s) and
"a slip, not a look" 9 ms later. A zoom taken just after showed the
square empty; the log and the next step (the square was a ✕) show that
was the screenshot taken before the redraw, not the game. A tap 1 s
later: red ✕, 2 hearts. Undo: a plain ✕, 3 hearts, "undo: a wrong look
taken back". Undo again: the square empty, Undo greyed. No console
errors.

## 2026-10-13: Undo for a wrong look published

Published with the developer's OK ("publish"): `main` fast-forwarded to
9e81a1b and pushed; the Pages build for 9e81a1b was "built", and the
server sends version dd76ea56d345 and a `hidden-faces.js` with
`QUICK_MS` (curl). **Checked live** (built-in browser, 393 x 760, after
a reload, 6 x 6 puzzle 1): a double click on row 1, column 1 logged "a
slip, not a look"; a tap 1 s later, "look: no face", 2 hearts; Undo,
"a wrong look taken back, the heart back", a plain ✕ and 3 hearts on
screen. No console errors. Claude's local server stopped; no other
`serve.js` running. Q15 closed ("OK as it is"); Q16 raised.

## 2026-10-13: Status (start here next session)

**Branch `star-battle`**, `main` = 9e81a1b plus journal-only commits
after it. Live today: Hidden Faces' Undo for a wrong look (heart back,
mistake still counted), a quick double tap only a ✕, and Undo never a
press that does nothing (checked live). `npm test`: 240 of 240.

**Next (developer's choice):** more Hidden Faces feedback from play;
difficulty levels for it; or the DESIGN.md "Later" list.

**Open questions:** none (Q15, Q16 closed). **Proposed skill
additions:** none waiting.

## 2026-10-14: Find the Stars; one 🏠; Nim's picture fixed

The developer, from playing (Hidden Faces on a small phone, and the site
in Chrome on a Linux VM):
1. The quick-tap wait (0.4 s) is too long; Undo already takes back a
   wrong look, so drop it. Asked: a double tap on the last heart then
   ends the game (Undo can't take back the game-ending look): **"yes"**,
   OK.
2. ✕s are hard to see on a small phone at 10 x 10: bigger and bolder.
3. Coloured faces can hide their square's colour, which the logic needs;
   the white ones (Hoppy, Ping) work best. Claude offered "only Hoppy and
   Ping". **The developer:** for a grown-ups' game the cute faces matter
   less; a fixed symbol, unambiguous from ✕ at any size, in a colour no
   square has. Claude: a white star with a dark edge (white is no square's
   colour; a gold one would clash with Yellow). Name: **Find the Stars**
   (developer). Claude kept the file names and storage key: renaming the
   page would break bookmarks and installed copies, reset its stats and
   lose the kept progress.
4. Winning faces smiling and wiggling are hard to see on a big board:
   instead one big animation with the result where the hints go. No
   mockup (developer).
5. The 🏠 changes size a lot between games: one size, the bigger one of
   tic-tac-toe and matching cards. Measured on the live site at 393 x
   760: 48 px (Connect Four, Nim, Hidden Faces), 52 (Five Dice), 57
   (Snakes), 64 (Rock Paper Scissors), about 83 (Matching setup), 92
   (tic-tac-toe; 112 on its setup), 112 (Count to 9). Agreed: **80 px**.
6. Linux Chrome (developer's screenshot): **the 🏠 drew as a purple
   building**, and **Nim's 3-5-7 setup picture was one row of matches in
   a tall black-edged box**.

**Nim was not a Linux problem: Claude broke it on 2026-10-13.** Hidden
Faces' small board picture was styled in `css/site.css` (loaded on
every page) as `.mini`; Nim, Matching and Five Dice already had their
own `.mini`. Measured on the live site (393 x 760): Nim's `#mini` was
a 5-column grid, 314 x 314 px, 2 px black border, its three rows all at
top 92 px; Matching's size pictures got the black border too. **Fix:**
renamed to `.hfmini`. **Test** (`tests/css.test.js`): a class styled
in a shared sheet (site.css, game.css) and again in a game's sheet must
be in a list of names meant to be shared; with `.mini` put back it
fails naming five-dice.css, matching.css and nim.css. It then caught a
new clash of Claude's own (`.won`, game.css's turn-line bounce),
renamed `.solved`. Proposed as a skill addition.

**The 🏠 is an emoji the device draws.** No colour emoji font on the VM,
so Chrome fell back to a font with a different picture. The developer
would rather not depend on installing one, so the house is now an SVG
picture in `site.css` (a data URL: no extra file), and the buttons
have no text (aria-label "All games"). **80 px everywhere** via
`--homebtn`; every game's own `--home` setting went (9 files),
except Five Dice and Snakes, where the same size also set the turn
line's height and the die: renamed `--topsq`, unchanged. Matching's
size greying assumed the 🏠 row is one card tall; it now uses the 🏠's
size.

**Fit with the 80 px 🏠, 393 x 760** (play screens, before → after):
every page still fits with no scrolling; tic-tac-toe squares 92 → 94
px, Five Dice rows 46 → 43, the others unchanged (Connect Four 45, Count
to 9 112, Follow Me 172, Nim 43, Rock Paper Scissors 142, Snakes 57,
Hidden Faces 10 x 10 35). **Matching 5 x 6 now scrolls** (before: 59 px
cards, fit exactly; at 375 x 667 it already scrolled): Q17.

**Find the Stars, built:**
- `src/ui/hfboard.js`: `STAR` (white, dark edge) and `XMARK` (two
  lines in the text colour, so every device draws it the same) as SVG;
  `miniBoard(p, stars, xs)`.
- Setup: no face picker; "Find the hidden stars...", "When you find a
  star". Home page: "Find the Stars", its picture with stars and drawn
  ✕s.
- Board: ✕ 58% of a square, nearly black (was a 40% character, `#2B2B3388`);
  red ✕ 84%; stars 88%. The turn line is one line beside the 80 px 🏠
  (it wrapped to "puzzle / 1" at 22 px; now 20 px, the star 36 px).
- Hint words say "star" (`src/core/hidden-faces.js`).
- `tap(g, i)` takes no time: `QUICK_MS` and `lastX` removed.
- The end: in the hint bar (same height, so the board doesn't move) one
  big star beside "Solved in 0:00!" / "0 mistakes · 0 hints · New best!"
  (or "Best 3:50"); the bar pale yellow, the star gold, popping in,
  bobbing 3 times, 6 small stars flying out twice. Nothing on the board
  smiles or wiggles. Out of hearts: a grey star, "Out of hearts" / "The
  pale stars show where they were".
- Debug log: "look: star" / "look: no star" (were "face"); the quick-tap
  line gone.

**Tests:** `npm test` 244 of 244. New: css.test.js (2); pages.test.js
"Find the Stars: its name, no face picker, no wait on a quick second
tap" (the screen calls `tap(G, d.start)` with no time) and "every 🏠
button is the site's picture, one size in every game"; the quick-tap
test in hidden-faces.test.js replaced by "a second tap on a new ✕ looks
at once; Undo takes a wrong one back". **Shown to fail:** the new tests
run against a copy of the last commit (`git archive HEAD`): all four
new or changed checks failed (the title, "already has its star", the
🏠 emoji text in connect-four.html, the `.mini` clash), and the old
screen's call reads `tap(G, d.start, e.timeStamp)`, which the tap check
rejects. The replaced core test alone would also pass on the old core
(with no time given it looked too); the change is the screen's call.
`tools/offline.js`: version d28220d46162.

**Checked in the built-in browser** (localhost:8123, 393 x 760):
setup shows the rules picture with stars, no picker, the house; 10 x 10
at 35 px squares, real clicks: two single taps and a drag gave dark ✕s,
a double click gave the red ✕ at once and 2 hearts; a 10 x 10 and a
6 x 6 solved by script (pointer events on the stock's answer): the gold
star and "Solved in 0:01! 0 mistakes · 0 hints · New best!", Next:
7×7 / Same size / New game, page height 760 (no scrolling); three wrong
looks: grey star, pale stars on the board, Try again. The pane wasn't
drawing, so animations stood still (`currentTime` 0); paused at a set
time they show (sparkles were small; made 1.4em, flying 3em). Nim's
setup picture: three rows again. Home page: "Find the Stars", 2 stars
and 12 ✕s. No console errors. Test progress removed from the browser's
storage after.

## 2026-10-14: Find the Stars published

Published with the developer's OK ("publish"): `main` fast-forwarded to
df5e726 and pushed; the Pages build for df5e726 was "built", and the
server sends version d28220d46162, a `hidden-faces.html` titled "Find
the Stars" and a `site.css` with `--homebtn: 80px` (curl). **Checked
live** (built-in browser, 393 x 760): the first look still showed the old
pages (the offline app's cached copies, as expected); after a reload:
the home page says "Find the Stars"; Nim's 3-5-7 picture has its rows
at 122, 152, 182 px (were all at 92); the 🏠 is 80 px and the drawn
house, with no text, in Nim, Find the Stars and tic-tac-toe; Find the
Stars has no face picker and 5 stars in its rules picture. Claude's
local server stopped; no other `serve.js` running.

## 2026-10-14: Status (start here next session)

**Branch `star-battle`**, published (`main` = df5e726, checked live):
Find the Stars (was Hidden Faces), the 80 px drawn 🏠 in every game,
Nim's and Matching's setup pictures fixed. `npm test`: 244 of 244.

**Next:** the developer tests on the Linux VM (before installing an
emoji font); then decide Q17 (Matching 5 x 6 scrolls on a phone) and
Q18 (which other emoji to draw).

**Open questions:** Q17, Q18. **Proposed skill additions:** one (a
style loaded on every page needs a unique name).

## 2026-10-14: Undo takes back one square of a drag at a time

The developer, after testing the publish on the phone and the Linux VM
("All problems have been addressed"): a long drag easily goes a square
too far, and Undo took back everything the drag ✕ed. "Undo should
always just undo the last cell that changed." Claude agreed and
offered, as an extra, un-✕ing by dragging back before letting go; the
developer: Undo change only.

**Built** (`src/core/hidden-faces.js`): `endStroke` puts one undo step
per square passed (`[[square, before]]`), in the order passed, so Undo
takes back the last square first. Rub-out drags the same. Unchanged: a
tap's ✕ is one step, a wrong look one step (heart back), a found star
and its Auto ✕s never undone, steps that would change nothing skipped.
The cost, said to the developer: undoing a whole unwanted drag takes
one press per square.

**Tests** (`tests/hidden-faces.test.js`): the drag test now undoes a
rub-out of 2 squares in two presses (last first), and a 4-square drag
with a star found on it square by square, last first, skipping the
star; the wrong-look test undoes a 6-square drag in 6 presses. **Shown
to fail:** with the old `endStroke` (git stash), both tests failed;
restored, 20 of 20. `npm test`: 244 of 244. `tools/offline.js`:
version 6c5aa9b8dd60.

**Checked in the built-in browser** (localhost:8123, 393 x 760, 10 x
10): a real drag across row 5 from column 1 to 7 put 7 ✕s; Undo: 6, Undo
again: 5, from the end of the drag. Test progress removed from the
browser's storage; Claude's server stopped.

Q17 and Q18 closed (see "Resolved").

## 2026-10-14: Per-square Undo published

Published with the developer's OK ("publish"): `main` fast-forwarded to
be79583 and pushed; the Pages build for be79583 was "built", and the
server sends version 6c5aa9b8dd60 and a `hidden-faces.js` whose
`endStroke` pushes one step per square (curl). **Checked live**
(built-in browser): after the first reload the page still ran
d28220d46162 while the new cache (`lets-play-6c5aa9b8dd60`) was already
installed, so one Undo took back all 5 ✕s of a drag (the old rule);
after a second reload the page ran 6c5aa9b8dd60, and a 5-square drag
went 5 → 4 → 3 ✕s with two Undos. That is the offline app's usual
update: a page loaded while the new version installs runs the old one
until the next load. The browser's saved progress put back as it was.
No local server running.

## 2026-10-14: Status (start here next session)

**Branch `star-battle`**, published (`main` = be79583, checked live):
Find the Stars (was Hidden Faces), the drawn 80 px 🏠 in every game,
Nim's picture fixed, Undo one square of a drag at a time. `npm test`:
244 of 244.

**Next (developer's choice):** more Find the Stars feedback, difficulty
levels for it, or the DESIGN.md "Later" list.

**Open questions:** none. **Proposed skill additions:** one waiting (a
style loaded on every page needs a unique name), for the developer to
review.

## 2026-10-14: Hints: the reasoning is hard to follow

The developer: where a hint says to put a star or a ✕ is clear, but not
always why; e.g. "it would rule out the last options for a row or
column" when they can see other squares left there. They asked for an
option to see a deeper explanation of why the other squares are ruled
out.

**Checked first: are the hints wrong?** A scratch script (Claude's
scratchpad) played puzzles 1-40 of 6 x 6, 8 x 8 and 10 x 10 by
following every hint, with Auto ✕: 2,072 hints, of them 960 "only one
left", 445 "all inside", 621 "a star here would rule out" (`touch`)
and 46 "k colours in k rows". **In every `touch` hint, every unmarked
square of the named row, column or colour was lit** (0 of 621 with one
left out), so the words are true of the board. "Try it" never came up,
as expected: the stock needs at most "k colours in k rows", and the
player's correct ✕s only add to what the solver knows.

**Why it can still look wrong:** the hint names the unit but not why
each lit square goes. In those 621 `touch` hints, only 360 (58%) had
every lit square touching the ringed one; 131 had one in the ringed
square's row or column, and **152 (24%) had one ruled out only by being
the ringed square's colour**, often far from it. The unit is also often
not the ringed square's own row or column (223 columns, 237 rows, 161
colours), so its other open squares in its own row or column are not
the point. Not yet seen: the developer's own example; the debug log
records each hint's kind and square, not its words.

**Proposed** (to the developer): a **Why?** under a hint, free (not a
hint used), that shows the reason on the board: for "would rule out", a
pale pretend star on the ringed square with a label on each lit square
(touches it / its row / its column / its colour) and the named unit
outlined, "nothing left for column 4"; for the other kinds, the same
idea in words. Waiting for the developer's choice (Q19).

## 2026-10-14: Why? mockup v1

**Developer** (Q19): "Do both: the pretend star and labels on the
board, plus a line of words. Make a mockup first."

**Mockup v1:** [Why Hint Mockup](https://claude.ai/artifact/1ogeXejM7WRrnBtGFKqXq5)
(private Claude artifact, version 1). The real game, copied into
Claude's scratchpad with Why? added there, then packed into one page by
a scratch script (the CSS and the 1,000 puzzles inline, each module
wrapped in a function). Nothing in the repo changed. Claude's choices,
all open:
- **Where:** while a hint shows, the **💡 Hint** button becomes **❓ Why?**
  (free; no hint used); in the Why? it reads **💡 The hint** and goes
  back. A tap on the board ends both, as now. (Today a second 💡 tap
  while a hint shows spends another hint on the same step; this also
  ends that.)
- **"Would rule out" (`touch`):** a pale pretend star in the ring (the
  blinking ✕ hidden), a dark label on each lit square saying why it
  would go (**touch**, **row**, **col**, **colour**), a red dashed
  outline round the row, column or colour that runs out, and a dotted
  outline round the pretend star's colour when a square goes for being
  that colour. Words, e.g.: "If the ringed square had a star, row 6
  would lose its last 4 squares (lit): 3 touch the star, 1 is Pink,
  like the star. No star left for row 6!"
- **"All inside":** blue outlines, solid round the unit whose squares
  are left, dashed round the one they're all in: "Row 1's star is on a
  lit square, and they're all in Brown. So Brown's one star is row 1's:
  no star in the rest of Brown."
- **"k in k rows" (`group`):** the colours solid, the rows dashed:
  "Orange, Purple and Pink's 3 stars are on lit squares, in rows 8, 9
  and 10. Those 3 rows have just 3 stars, so no star in the rest of
  them."
- **"Only one left":** the unit outlined: "Column 3 needs a star, and
  the rest of it is crossed out. So the star is on the ringed square."
- No Why? for a wrong ✕ or ✕s a found star implies (their words are the
  reason already).
- **Debug log:** each hint now logs its words too (`text`), and Why?
  logs `why` with the hint's kind and the labels shown, so a confusing
  hint can be read back from `log.html`.
- **Mockup only:** 99 hints, and four buttons under the board that
  follow the hints to the next one of a kind (a colour reason, all
  touching, all inside, 2 in 2) and show it.

**Checked** (built-in browser, 393 x 760, the scratch copy served by a
temporary `.claude/launch.json` entry, removed after; then the packed
page the same way): one of each kind on 7 x 7, 8 x 8 and 10 x 10; every
Why? text fills the 3-line bar exactly (scrollHeight 83 = clientHeight
83); labels readable at 10 x 10 ("touch" in 35 px squares); no console
errors but one 404 (most likely the browser asking for a favicon).
**Found and fixed while checking:** the outlines didn't
show (an `<svg>` has no `.hidden` property, so the attribute stayed),
then were drawn one board-offset too far right (the squares' offsets are
from the board's frame); the first texts ran to 4 lines; the hint's
blinking ✕ hid the pretend star; switching to the Why? made the
spotlight flash off and on (now kept). Not yet tried in the desktop
app's viewer.

## 2026-10-14: Why? built

**Developer** (after mockup v1): "This is good. Build and publish. I
will need to play a few real games to see if there are any other
problems."

**Built** from the mockup's scratch copy, without its mockup-only parts
(99 hints, the jump buttons): `explainHint` in `src/core/hidden-faces.js`
(no DOM); in `src/ui/hidden-faces.js` the 💡 Hint button turns into ❓
Why? while a hint with one shows, the pretend star, labels and an
`<svg id="rings">` of outlines over the board (`hidden-faces.html`), and
the styles in `css/hidden-faces.css` (new class names `pretend`,
`pretending`, `tag`, `rings`, `ring`, `ring-*`, `pressed`: none in the
shared sheets). DESIGN.md "Find the Stars" has a Why? item.

**One change from the mockup: shorter "would rule out" words.** Over
all 1,000 stock puzzles, followed by their hints (scratch script), the
mockup's wording ran past the bar's 3 lines (about 140 characters) in
2,000 of 5,110 "would rule out" Why?s, up to 173 characters. Now "A star
on the ringed square would rule out Purple's last 5 squares (lit): 3
touching it, 1 in its row, 1 in its column. No star left for Purple!":
26 of 5,110 over 140 (longest 144), and 13 of 355 "k in k" (4 colours
in 4 columns, up to 153); those scroll in the bar. "All inside" up to
134, "only one left" up to 95.

**Tests** (`tests/hidden-faces.test.js`, 2 new): following the hints on
the 7 test puzzles, every Why? leaves the board as it was; none for a
wrong ✕, implied ✕s or "try it"; for each "would rule out", every lit
square has a label, each label is the true reason (touching, then the
star's row, column, colour) and a star there really would rule it out,
the red outline is the named unit, the dotted one the star's colour
exactly when a square goes for its colour; the longest text ≤ 160.
Made-up hints check the one-square and "both" wordings and a real
"group" Why? on the GROUP puzzle. **Shown to fail:** row and column
labels swapped, the colour outline left out, and "both" left out each
failed a test; restored, 22 of 22. `npm test`: 246 of 246.
`tools/offline.js`: version ed48dd343284.

**Checked on the real page** (built-in browser, localhost:8123, 8 x 8):
the first hint ("all inside") turned 💡 Hint into ❓ Why?; Why? showed its
words and 2 outlines and the button read 💡 The hint; back and forth
again; a tap on the board cleared the bar, labels and outlines, and the
button read 💡 Hint 2 (Why? used no hint); the next hint, a wrong ✕, had
no Why? (💡 Hint 1). The debug log shows `hint` with its words, `why`
and `why: back to the hint`. No console errors. "Would rule out" on the
board was checked in the mockup (same UI code). The browser's saved
progress was empty before and was removed after; Claude's server
stopped.

## 2026-10-14: Why? published

Published with the developer's OK ("Build and publish"): `main`
fast-forwarded to 117e3a0 and pushed; the Pages build for 117e3a0 was
"built", and the server sends version ed48dd343284 and a
`hidden-faces.js` with `explainHint` (curl). **Checked live** (built-in
browser, after one reload): version ed48dd343284; on 6 x 6 the first hint
("Brown is just one square") turned 💡 Hint into ❓ Why?, and Why? showed
"Brown needs a star, like every colour, and it's just this one square."
with its outline, the button reading 💡 The hint. The browser's saved
progress was empty before and removed after. No local servers running.

## 2026-10-14: Status (start here next session)

**Branch `star-battle`**, published (`main` = 117e3a0, checked live):
Find the Stars has ❓ Why? under a hint (a pretend star, labels and
outlines on the board, a line of words). `npm test`: 246 of 246.

**Next:** the developer is playing a few real games to look for other
problems. A confusing hint can now be read back from the debug log
(`log.html`), which keeps each hint's words. Then: more Find the Stars
feedback, difficulty levels for it, or the DESIGN.md "Later" list.

**Open questions:** none. **Proposed skill additions:** one waiting (a
style loaded on every page needs a unique name), for the developer to
review (since dropped: see below).

## 2026-10-14: The class-name proposal dropped

The developer, on the waiting skill proposal: "Maybe sometimes that is
appropriate" (sharing a class name). Claude agreed the title overstated
it (the shared sheets share 28 names on purpose, `MEANT_SHARED`) and
offered a reworded version; the developer: rules that try to cover
every case get harder to keep and to apply; better a few basic rules
and judgment case by case. Claude recommended dropping it from the
skill (a web/CSS case, already guarded by the repo's test), and the
developer agreed; no to adding a "principle or case?" line to the
skill. **Proposed skill additions:** none waiting.

## 2026-10-15: Coming back to a game, built

Q20's two fixes, for all ten games (developer: "For all apps"; "I do want
the resume feature to work"), with the defaults Claude listed and the
developer didn't change. DESIGN.md "Coming back to a game" has the rules.

**How it works:**
- `src/core/resume.js` (no DOM): `returnTo()` decides whether the home
  page goes back to a game (only as the installed app, not after back
  or a link on the site, and only to one of `GAME_PAGES`); `pack` /
  `unpack` store a game's state with a format number, so an older copy
  after an update is left alone, not misread; `mergeSetup` takes the kept
  setup picks by the page's own keys and kinds; `createResume` keeps and
  reads one game's entry and logs it.
- `src/ui/resume.js`: `resumable(game, format, snapshot)` marks the page
  as the last one (🏠 taps mark the home page), keeps the snapshot on
  `pagehide` and when the page is hidden, and gives the page `keep()`;
  `backToGame()` on the home page (the icon's start page) goes back with
  `location.replace`. The home page's script stops there (an `await` that
  never ends) so nothing else runs or is counted.
- Each game: `keep()` at the end of its setup and play drawing (so after
  every move), and a `restore()` that picks up the kept screen and game.
  The match objects were already plain data (checked: a test stores
  each game's match as JSON after some play and finds it the same, and
  playing on the same). What was moving is finished or done again (the
  list in DESIGN.md). Find the Stars keeps its game through new
  `snapshotGame` / `restoreGame` in `src/core/hidden-faces.js` (its game
  holds a Set); `restoreGame` refuses a kept game that isn't this
  puzzle's (a star where the puzzle has none, another size) or isn't
  whole. Its end (`G.end`) is now data, shown by `showEnd()`, so a
  finished puzzle can be shown again without recording the time twice.
- Any error while picking up: logged ("resume failed: a new game"), the
  kept entry dropped, the setup screen shown.

**Tests:** `tests/resume.test.js` (7: when the home page goes back and
the seven cases where it stays; pack/unpack with other formats and junk;
mergeSetup; keeping and finding; refused storage logged once),
`tests/resume-games.test.js` (every game's match through JSON and
playing on), two in `tests/hidden-faces.test.js` (a kept game comes back
and plays on, Undo giving the heart back; 11 kinds of bad kept game
refused). **Shown to fail:** a Set put in tic-tac-toe's match: "not the
same after JSON"; restoreGame's star check removed: 1 failed; unpack
using an old format's data: 2 failed. (The first try at the star check's
break changed nothing: the pattern didn't match the source's `hasn\'t`,
and the test passed. Checked with `cmp`, then broken properly.)
`npm test`: 256 pass, 0 fail. `tools/offline.js`: version 45db805c0b9f,
80 files.

**Checked in the built-in browser** (localhost), each game played a
little and reloaded (a reload loads the page again, as the icon does):
- Tic-tac-toe: the board and turn back. Connect Four: reloaded while the
  robot was thinking; it moved after.
- Matching (alone): reloaded with a miss showing; it turned back, turns 1.
- Count to 9: reloaded on a wrong card ("Oops!"); it turned back, the
  robot played on.
- Snakes and Ladders: reloaded mid-hop; the move was kept (by the
  `pagehide` keep, not yet the drawing's), the robot rolled next.
- Five Dice: reloaded with a die picked up ("Roll that one?" and it
  still up); scored a box and reloaded inside the Undo: Undo showed,
  the turn passed after 3 s, the robot played.
- Nim: two matches picked up, reloaded: "Take 2" with both up; took them,
  the robot answered.
- Rock paper scissors: a star won, reloaded: the star kept, the next
  round counted down.
- Follow Me: reloaded while the robot showed a 2-step order: "Ready?",
  the same order shown again, score 1 kept.
- Find the Stars: a ✕ and a hint's Why? showing, reloaded: both back,
  the clock on from 0:02. Out of hearts, reloaded: the result, the 5 pale
  stars and Try again / Another back; Try again started it fresh.
- 🏠 marked the home page as the last one, and the home page stayed
  ("app": false, "fromSite": true). With `matchMedia` made to say
  "installed" and the last page Nim, the home page opened with no
  referrer went to nim.html, which picked up its game.
- No console errors. The test keys removed from the browser afterwards.

**Not checked:** the real iPhone app's icon (only reloads and a faked
"installed" here). Q20 stays open until the developer has tried it.

## 2026-10-15: Coming back to a game, published

Published with the developer's OK ("Publish."): `main` fast-forwarded
to a2aed32 and pushed; the Pages build for a2aed32 was "built", and the
server sends version 45db805c0b9f and `src/ui/resume.js` (curl, 200).
**Checked live** (built-in browser): the page's version 45db805c0b9f;
tic-tac-toe played (a move and the robot's), reloaded: the same board
back. The browser's kept game and last page removed afterwards. The
local server stopped; no other `serve.js` running.

**For the developer to try on the iPhone** (Q20): open the app once
with wifi so it gets the new version (the version line says
45db805c0b9f), start a game, switch to another app, then tap the
app's icon: the game should be there as left.

## 2026-10-15: Status (start here next session)

**Branch `star-battle`**, published (`main` = a2aed32): every game
carries on where it was left, and the installed app's icon goes back to
the game left (DESIGN.md "Coming back to a game"). `npm test`: 256 of 256.

**Next:** the developer tries it on the iPhone (above); then close Q20,
or fix what the phone shows. Then: more Find the Stars feedback (no
levels: Q21), or the DESIGN.md "Later" list.

**Open questions:** Q20 (until the iPhone check). **Proposed skill
additions:** none. (The mutation that didn't take, in "Coming back to a
game, built", is a case of the skill's "Prove every check can fail",
not a new rule.)

## 2026-10-15: Checked on the iPhone; Q20 closed

The developer tried the published app on their iPhone: "It looks good
on my phone." Q20 moved to Resolved, with Q21 (resolved earlier today
but left in the open list). Claude's instruction to look for version
"45db805c0b9f" was wrong: the version line shows the first 6 characters
("45db80"), as DESIGN.md "Offline app" says. **Open questions:** none.

## 2026-10-15: Find the Stars: free looks where no star can be; the hint's words stay

The developer, playing: after a hint, they often double-tap a square the
hint says to cross out (✕, then a look): a red ✕, a heart, and a mistake
Undo doesn't take back ("I guess that makes sense otherwise it is like
endless free guesses, but I did find it annoying"). And: "sometimes I
wish the text of the hint stayed visible after following its
suggestion". Claude proposed both; agreed as proposed, "including the
squares a found star rules out".

**Built** (DESIGN.md "Find the Stars", Taps and Hints):
- `knownEmpty(g, i)` in `src/core/hidden-faces.js`: the reason in words
  when a found star rules square i out (touch, row, column, colour) or a
  hint said to cross it out, else null; never for a star's square.
  `look()` checks it after the star check, so a look can never be
  stopped from finding a star, and changes nothing when it applies
  (`{ known: words }`). The squares a used hint crosses out go in
  `g.told` (`useHint`, not `findHint`), kept by `snapshotGame` as
  `told`; a kept game from before has none and still restores; a `told`
  square that is a star, or not a square, is refused.
- The screen: such a look wiggles the ✕ (`.cell.nope`), ticks, and the
  hint bar says why for 2.5 s (`showNote`, class `notice`: `.note` was
  already a shared class in `site.css`, which `tests/css.test.js`
  caught). A touch on the board and Undo now call `dimHint()` (off the
  board, words greyed, `.hintbar.past`, `role="button"`) instead of
  `clearHint()`; a tap on the greyed words lights the hint again. The
  next hint, Show, the end and a new puzzle still clear it. The kept
  hint has `lit`; one kept before comes back lit, as it was. Logged
  ("hidden-faces"): "look: known to be empty, not counted" with the
  square and words, "hint put out, its words kept", "hint lit again".

**Tests** (`npm test`: 259 of 259, 3 new): every square each star of the
three test puzzles rules out, looked under with Auto ✕ off, gives
exactly its words and changes no heart, mistake or undo step (all four
kinds seen), and a square nothing rules out still costs a heart; Auto
✕'s own ✕s alike; a hint's crossed-out squares, looked under, change
nothing, still after Undo; `findHint` alone remembers nothing; `told`
kept and restored, older kept games without it, bad `told` refused; the
screen code (pages test) dims rather than clears on a touch and Undo,
relights on a tap, handles a known look first with no "uh-oh".
**Each check shown to fail**: with the free look removed, hints not
remembered, `told` not kept, and the row reason off, the tests meant
for each failed (2, 2, 1, 1 failing). The first try at this was
PowerShell's `Set-Content -NoNewline`, which this shell refused, so the
file never changed and every run said "fail 0": a case of the skill's
"Prove every check can fail", caught because the error showed; redone
with `sed`, checking the file differed before each run.

**Checked in the built-in browser** (localhost:8123, 6 x 6 puzzle 1):
the first hint, then a touch on the board: words kept, class `past`,
no spotlight, the button "💡 Hint 2". A wrong look on a square nothing
ruled out cost a heart (as before); Undo gave it back. The star found
(11 Auto ✕s), its neighbour looked under: "No star here: it touches a
star.", 3 hearts, the ✕ wiggling; 2.5 s later the greyed hint back. A
tap on the greyed words lit it again (spotlight, ring), and ❓ Why?
worked. An "inside" hint crossing out 3 squares; one double-tapped:
"No star here: a hint crossed it out.", 3 hearts, still a ✕. Reloaded:
the hint back greyed, no spotlight. No console errors. The browser's
kept game and last page removed afterwards. (The pane's screenshots
twice showed an older, smaller frame than the page held; the page's
own state, read by script, was used for each check.)

## 2026-10-15: Status (start here next session)

**Branch `star-battle`**, not published (`main` = a2aed32): Find the
Stars' free looks where no star can be and the last hint's words kept,
greyed (above). `npm test`: 259 of 259. The local server is running
(port 8123) for the developer to try it.

**Next:** the developer tries it (locally or after publishing), then
publish on their OK. Then: the DESIGN.md "Later" list.

**Open questions:** none. **Proposed skill additions:** none (the
mutation that didn't apply is a case of "Prove every check can fail").

## 2026-10-15: Hints that do their own step; hint colour mockup v1

Before trying the build above, the developer had another idea: a hint
puts its ✕s on the board itself, in a colour of its own, with the words
explaining it ("It seems unlikely that if one asks for a hint they
would chose to ignore it"). Claude confirmed first that hints don't only
give ✕s: "only one left" (often: about 6 of a 6 x 6's 13 steps, Q21's
measurements) and a wrong ✕ both point at a star.

**Agreed:**
1. A hint that points at a star **places the star**, and its ✕s go on
   **in the hint colour** (Claude's reading: whether Auto ✕ is on or
   not, since the developer said "place the star and add Xs").
2. **Undo never takes back a hint**, and a drag can't rub its ✕s out
   (they're certain, like a found star).
3. **The colour from a mockup**, as ✕ visibility was a problem before
   (2026-10-14).

Kept from the build above: the lit squares and the words show until the
next touch, then the words stay greyed (the reasoning still needs the
lit squares); a tap on a hint ✕ is a free look.

**Mockup v1**: [Hint Colour Mockup](https://claude.ai/artifact/UHCmnZzkkCyGmscpWyDNxK)
(private Claude artifact, version 1). A real 10 x 10 puzzle (seed
100022) at phone size (35 px squares, with a 56 px switch): two found
stars with their Auto ✕s, your ✕s, a wrong look, a star a hint placed
with its ✕s, and hint ✕s on all ten square colours (two of them made
from ✕s, as the found stars had already crossed those colours out).
Three options: **A Blue** (#1F5FD1, the Why?'s outline blue), **B White
with a dark edge** (like the star; its hint star then looks like any
found star), **C Purple** (#6A1B9A); a hint star has a thicker edge in
the hint colour. Below the board, each mark on every colour in a row.

## 2026-10-15: Status (start here next session)

**Branch `star-battle`**, not published (`main` = a2aed32): Find the
Stars' free looks where no star can be and the last hint's words kept
greyed, built and committed (1852006), not yet tried by the developer.

**Next:** the developer picks a colour from the hint colour mockup v1;
then build hints that do their own step (above), on top of 1852006.
Then publish both on the developer's OK. The local server is running
(port 8123).

**Open questions:** none. **Proposed skill additions:** none.

## 2026-10-15: Hint colour: B, white with a dark edge

The developer picked **option B** from the hint colour mockup v1: a
hint's ✕s are white with a dark edge (in the mockup: the ✕'s two lines
drawn dark at stroke 23, then white at 13, over the same path as the
player's ✕). As the mockup says, a star a hint places then looks like
any found star (no edge colour of its own). **Next:** build hints that
do their own step (the entry before this one) with this ✕, on top of
1852006; then the developer tries both, and publish on their OK.

## 2026-10-15: Hints that do their own step, built

Built as agreed in the two entries above, on top of 1852006 (DESIGN.md
"Find the Stars": ✕s, Taps, Hints).

**Built:**
- `useHint()` (`src/core/hidden-faces.js`) works the hint out first
  (`findHint`, unchanged: it still never changes the board), then takes
  its step. "single" and "wrong" place the star (a wrong ✕ becomes the
  star) and put **hint ✕s**, a new mark `'hx'`, on the empty squares the
  star rules out, Auto ✕ or not; every other kind (implied, inside,
  touch, group, tryit) puts `'hx'` on its `out` squares (all empty: the
  solver's are candidates, "implied" picks empty ones). The player's own
  ✕s are left as they are. It returns `star`, `hx` and `won`; a hint's
  last star wins (`g.result = 'won'`), and the screen runs the normal
  win. The `hx` squares also go in `g.told`, as before.
- Hint ✕s are fixed: no undo step is added, and `undoes()` already only
  sets back '' or 'x' squares, so a player's ✕-then-rub-out on a square
  a hint later crossed out is skipped; `startStroke` from one does
  nothing and `strokeTo` only marks '' and rubs out 'x'. A tap on one is
  a look (`tap`), which `knownEmpty` makes free (a found star's words
  first, else "No star here: a hint crossed it out.", also for an 'hx'
  missing from `told`). `stateOf` counts 'hx' as no star. `MARKS`
  accepts 'hx'; `restoreGame` refuses one on a star. Lost games' pale
  stars are unaffected ('hx' is never on a star).
- The wrong-✕ hint now reads "The ringed ✕ (...) **was** wrong: there's
  a star under it.", as the star is there by the time it's read. The
  other words read fine after the step ("So cross it out." etc.), so
  they're unchanged.
- **Why?** (`explainHint`) reads only the hint and the puzzle (units,
  lit squares, ring, colours), never the marks, so it reads the same
  computed after the step, and for a kept hint after a reload; the test
  checks both (deepEqual before / after / after a JSON round trip, every
  hint of 7 puzzles).
- The screen (`src/ui/hidden-faces.js`): draws 'hx' with `HXMARK`
  (`src/ui/hfboard.js`: XMARK's path, #2B2B33 at 23 under #fff at 13;
  css `.mk-hx svg` 58%, as the player's ✕); a hint star pops in; on a
  win, the hint comes off and `win()` runs. Logged: "hint applied" with
  kind, star (and its row and column), hintX count, squares, found, won.
- **The blinking "to cross out" ✕ is dropped** (`.cell.out::after` and
  its `blink` keyframes): those squares carry real hint ✕s now, and in
  the browser the lit squares (dark edge, unfaded, hint ✕) read clearly
  without it. In a Why? the pretend star now hides the square's mark
  (`.cell.pretending .mk { visibility: hidden }`) instead of the blink.
  The spotlight, ring, lit squares and words are as before, put out by
  the next touch with the words kept greyed.

**Tests** (`npm test`: 262 of 262; 3 new, 4 changed): following the
hints alone (`useHint`, Auto ✕ off) solves all 7 test puzzles with the
board after each hint exactly its step (single, inside, touch, group,
tryit all seen; 40+ hints), no plain ✕ left, the last star a hint's win;
an "implied" hint's ✕s; a wrong-✕ hint with Auto ✕ off and on (the star,
hint ✕s around it, the player's ✕ there kept, Undo taking back only
that); a "single" hint with Auto ✕ on giving hint ✕s, not Auto ✕'s; a
hint's star winning; hint ✕s fixed (Undo after a ✕ and a rub-out on one
of the hint's squares, a drag from one, ✕ and rub-out drags across them,
taps on them: free looks); 'hx' kept and restored, refused on a star;
the screen (pages test): HXMARK's two paths, the 'hx' drawing, the log
line, the win, the CSS sizes, no blinking ✕, the pretend star hiding the
mark. **Each check shown to fail**: 13 mutations, each applied with
`sed`, the file compared with its backup (`cmp`) before running, then
restored from the backup (the working diff compared after): undo taking
'hx', rub-out taking 'hx', erase from 'hx', tap on 'hx' not a look,
`stateOf` ignoring 'hx', Auto ✕ giving a star hint plain ✕s, a wrong ✕
hint placing no star, a hint star never winning, restore taking 'hx' on
a star, restore refusing 'hx', the screen's win removed, the hint ✕'s
edge 19, the blinking ✕ back: 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1
failing, each the test meant for it.

**Checked in the built-in browser** (localhost:8123, 6 x 6 puzzle 1,
Auto ✕ on; the page's state read by script, clicks by the screenshot's
coordinates): the first hint, "Brown is just one square", placed the
star on row 2, column 1 with 11 hint ✕s (white, dark edge), Undo greyed.
My ✕ on row 4, column 6; a tap on the hint ✕ at row 1, column 1: "No
star here: it touches a star.", 3 hearts; Undo took back only my ✕. An
"inside" hint put hint ✕s on squares 3, 19 and 33, lit with a dark edge
(screenshot: clear without the blink); a tap on one: "No star here: a
hint crossed it out."; a ✕ drag along row 1 across it marked only the
two empty squares, a rub-out drag across it rubbed out only mine; Undo
(3 steps) took back only mine, then greyed. The hint lit again, Why?,
reload: the hint ✕s back, the Why? showing with its 2 outlines. Another
"inside" hint: 1 hint ✕. Then a fresh puzzle 1: 5 stars found by double
taps, then 💡: "The ringed square (row 6, column 5) is the only one left
for row 6", the star placed, "Solved in 0:11! 0 mistakes · 1 hint · New
best!", the end buttons, the kept game "won". Log lines as above. No
console errors. **Not checked in the browser:** a "touch" hint's Why?
(the pretend star over a hint ✕); covered by the CSS check only.

**Cleanup finding:** the earlier session's kept game was still in the
browser (its marks, `told` [3, 19, 33] and the mistake matched that
entry's check), though that entry says it was removed. Removing the key
on the game page and then reloading doesn't clear it: the page keeps
the game again as it unloads. This time the keys were removed from a
page with no game script (`data/hidden-faces.json`): the kept game, the
last page and the best time this check's win made; the debug log left.
A case of the skill's "Check the end state" (a cleanup checked right
after it, not after the page had moved on); no new skill rule.

## 2026-10-15: Status (start here next session)

**Branch `star-battle`**, not published (`main` = a2aed32): two Find the
Stars changes for the developer to try: 1852006 (free looks where no
star can be; the last hint's words kept greyed) and hints that do their
own step (above). `npm test`: 262 of 262. The local server is running
(port 8123).

**Next:** the developer tries both, then publish on their OK. Then: the
DESIGN.md "Later" list.

**Open questions:** none. **Proposed skill additions:** none.

## 2026-10-15: Free looks, kept hint words and hints that do their own step, published

Published with the developer's OK ("Publish."), without trying it on
the local server first: `main` fast-forwarded a2aed32..de21c8c and
pushed. The Pages build for de21c8c was "built" at 18:04:33 (about
40 s); the server sends version d4d04dca9b09 and `src/ui/hfboard.js`
(curl, 200). **Checked live** (built-in browser): the home page's
version line "Oct 15, 2026 · d4d04d"; Find the Stars 6 x 6 puzzle 1,
💡 Hint: "Brown is just one square", the star placed (1 of 6 found)
with 12 hint ✕s, each the two-path white ✕ with a dark edge
(screenshot), the button ❓ Why?; no console errors. The browser's kept
game and last page removed from a page with no game script
(`data/hidden-faces.json`), and checked again after a reload: only the
debug log left. The local server (port 8123, the build session's)
stopped; no `serve.js` left running.

**For the developer to try on the iPhone:** open the app once with wifi
(the version line says d4d04d), then a Find the Stars puzzle: a hint
puts its own ✕s and star; a double tap on a hint ✕ costs nothing; after
a touch the hint's words stay greyed, and a tap on them lights it again.

## 2026-10-15: Status (start here next session)

**Branch `star-battle`**, published (`main` = de21c8c): Find the Stars'
free looks where no star can be, the last hint's words kept greyed, and
hints that do their own step (white hint ✕s, fixed). `npm test`: 262 of
262.

**Next:** the developer's feedback from playing it. Then: the DESIGN.md
"Later" list.

**Open questions:** none. **Proposed skill additions:** none.

## 2026-10-15: Q22-Q24: the fix agreed

From the developer's answers (recorded under Q22-Q25 above) and two
more: **(1)** "OK" to Find the Stars ending once every square is crossed
out with stars still hidden, like running out of hearts ("No squares
left / The pale stars show where they were", Try again / Another / New
game), and not sooner (a row, column or colour all crossed out can still
be fixed with Undo or a rub-out). **(2)** Follow Me and Find the Stars
get a way out mid-game that asks first: "A Give Up This Game or
equivalent is appropriate."

**The plan** (to build in a fresh session, tried on the local server
before publishing):
- At most one game in progress, kept only for a reload or a trip to
  another app: cleared by 🏠 (and back to the home page), by opening a
  different game, and by a restart. Kept in the browser's per-session
  storage, not the device's; the app's icon no longer goes back into a
  game. Find the Stars' next puzzle number and best times stay. Whether
  iOS closing the app in the background keeps the game: to measure on
  the iPhone later (either fits the developer's rule).
- Give up in Follow Me and Find the Stars, asking first; the other seven
  games already show Play again / New game all through a game.
- Find the Stars ends when the grid is full (above).
- Q24: debug output on the home page (its height, the screen's, how far
  it can scroll) when it opens, changes size or comes back, so the next
  time it happens the log has it.
- Then Q25: prototype the hint flow.
