# Dev journal

A running record of decisions, findings, and open questions, newest at the
bottom. Findings record **evidence**: what was tested, what was observed,
and what it does and doesn't prove.

## Open questions

Raised 2026-10-15 by the developer after the publish of de21c8c ("Maybe
we tried to do too many different things at once"), to take one at a
time, each tried before publishing:

- **Q32. Laser Lab on the phone.** Built 2026-10-22 from mockup v7 as
  it stood (see "Laser Lab built"); to judge on the developer's phone
  once published (3.0): Claude's choices (DESIGN.md "Laser Lab": the
  budget = cheapest + 3, cost floors 6/7/8, no Try again, the end's
  words, the laser drawing), and the build's: a puzzle left unfinished
  waits in its run, the status stacking on narrow phones, purple gems in
  about 1 in 7 two-laser puzzles (3 of 50 at 8×8; *2026-10-22:* the
  developer: keep them, about 1 in 3, spread through each run: release
  3.3, see "Purple gems spread"), 50 puzzles for 8×8 with two lasers,
  and how long the first hint takes (the log's "cheapest ways worked
  out"). *2026-10-22:* 3.2 adds a budget row and a second tools row,
  so the board is smaller (6×6 at 393 × 760: 40 px squares, 3.0 47 px;
  see "Laser Lab 3.2 built"): to judge on the phone. *2026-10-22,
  developer:* "ok" (taken as: nothing to change for now); stays open
  until 3.3's purple gems have been played.

- **Q34. Which Claude model for which work?** (2026-10-23, developer:
  "I have been using your opus model for everything ... Could you tell
  me if a different model was better suited".) Claude's view, not yet
  tested here: Opus 5.5 for design, mockups and hard bugs (as now);
  Sonnet 5.5 (about half Opus's price) likely enough for routine
  fix-and-publish sessions; Haiku 5.5 for mechanical look-ups only;
  Fable 5.1 (about 2.5 times Opus) for the hardest puzzle-logic work.
  A session can't switch its own model (the developer picks it in the
  app's model menu); Claude can set one for a session or helper it
  starts. To try: one routine session on Sonnet 5.5, compared; a
  standards-skill line only once that shows something general.
  *2026-10-23, developer:* "Can you add the skill to suggest model
  changes when appropriate": added to the skill, section 7, "Match the
  model to the work" (see "Proposed additions"). Stays open for the
  Sonnet 5.5 trial.
- **Q35. Which new rule makes Laser Lab harder, not easier?**
  (2026-10-23, developer: "I like the concept of the color mirror. But
  would it make things easier or harder? I don't want to add features
  that make the game easier. It is already fairly easy." The same for
  more lasers, or placing them.) Claude's reasoning, not measured: any
  way within the budget wins, so a new piece or a free choice mostly
  gives the player more ways to win (easier) unless the puzzles are
  made to need it; more lasers add rules that pull against each other
  (likely harder); placing the lasers removes the beam's known start
  but adds many ways in (unclear). The budget (cheapest + 3) is the
  plainest lever. To measure with the maker and solver before building:
  how many ways fit the budget, per variant. *2026-10-23:* measured
  (see "Q35 measured"): the budget's margin matters most; a colour
  mirror makes it harder only in puzzles made to need it; more lasers
  add a little at 6×6. Open until the developer chooses.

## Proposed additions to the standards skill

None waiting. (2026-10-23, later: "Match the model to the work"
added to the skill's section 7 at the developer's request (Q34), before
any evidence from this project; ai-dev-practices commit 4f10dc2, zip
rebuilt, holding it and the two below, for the developer to upload.)

Earlier: (2026-10-23: "Tie an effect to the event it follows, not
a timer that guesses it" (from "3.5 on the phone; release 3.6") and
"Check a screen after every way into it" (from "3.0 on the phone;
release 3.1" and "Laser Lab 3.2 built") approved by the developer ("We
can add the skills") and added to the skill, sections 4 and 3;
ai-dev-practices commit 2e527f2, zip rebuilt for the developer to
upload.)

Earlier: none waiting. (2026-10-16: "Measure fit on the target's fonts, or fit at
run time" (from "The play screen pushed right on the iPhone") dropped by
the developer: "Drop it: keep the lesson in the journal only." Claude's
view, asked how general it is: a web case as written; the general part
(a stand-in checked in place of the target) is mostly
"Trust running the real thing over reading about it" and "Build fakes
... from the real thing" already.) (2026-10-14: "A style loaded on every page needs a name
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

- **Q33. Does 3.6 stop the zoom on the iPhone?** (2026-10-23) 3.5's
  pinch block didn't hold there: the page zoomed ("not sure what I
  did") and the developer pinched it back out. 3.6 blocks only zooming
  in, stops double-tap zoom on the whole page, and logs every change of
  zoom with the touches before it. To check on the phone; if it still
  zooms, the log says how (see "3.5 on the phone; release 3.6").
  *2026-10-23, developer:* "3.6 still zooms. It seems to happen when I
  double tap a piece to change its direction sometimes but not all the
  time." Cause found (a tap redraws the piece's picture, so its touch's
  end reaches no handler) and fixed in 3.7, with Colour Sudoku's same
  case: see "3.6 on the phone; release 3.7". Stays open until 3.7 has
  been played on the iPhone. **Closed 2026-10-23** (developer, after playing 3.7: "The zooming problem
  seems to be gone. Since it was intermittent, I'm not 100% sure, but I
  think we can assume it is fixed for now, and I'll raise the issue
  again if I ever see it reappear."). nozoom still logs every change of
  zoom with `touchedRedrawn` and `touched`, so a log can reopen it.

- **Q24. The home page wouldn't scroll to the footer** once: it stopped
  "part way through the last game". Device, app or Safari, and what came
  before not yet known. *Developer, 2026-10-15:* on the iPhone, seen
  once, not since; the log page couldn't be reached, as its link (the
  version line) is at the bottom, where the page wouldn't scroll.
  *Debug output built 2026-10-15 (see "Q22-Q24 built"): the home page
  logs its scroll room. Stays open until it happens again and the log
  shows why.* **Closed 2026-10-22** (developer: "OK to close Q24 and Q27
  and Q30"): seen once, not since; the home page still logs its scroll
  room, so it can be reopened from a log if it comes back.

- **Q27. Find the Stars' turn line is cut at 320 px wide.** Seen
  2026-10-18 (see "Show me how built"): "10×10 · puzzle 1" beside the
  🏠 loses the end of "puzzle 1" at 320 px in the built-in browser. Not
  yet checked whether it matters on a real phone, or since when.
  *2026-10-19:* Colour Sudoku had the same problem and fits its line at
  run time (`fitInfo`, see "Colour Sudoku built"); the same would fix
  this one, if it matters. **Closed 2026-10-22** (developer: "OK to
  close Q24 and Q27 and Q30"): only at 320 px wide; the developer's
  iPhone is 393 px. Reopen if seen on a phone in use.

- **Q30. Colour Sudoku on the phone.** Built from mockup v3.1 as it
  stood (2026-10-19); to judge on the developer's phone once published:
  N2 notes (white edge) against N1 (DESIGN.md: "We can start with N2"),
  and Claude's choices from the mockup (DESIGN.md "Colour Sudoku", "As
  built"), e.g. a thud per right digit, Next / Try again / New game at
  every end, the turn line and status as small as 12 px on a 320 px
  phone. *2026-10-19:* first report: the selected square's band hid its
  notes; fixed with a ring outside (see "the selected square's ring").
  **Closed 2026-10-22** (developer: "OK to close Q24 and Q27 and Q30"):
  nothing on the phone has bothered the developer; the choices listed
  stay as built.

- **Q31. Should Easy start with more digits?** Raised 2026-10-19 by the
  developer: in other Sudoku games the level mostly sets how many digits
  are filled in at the start. Ours differ by the steps needed; Easy
  starts with 13-20 (median 17), Harder 12-20 (median 16). Digits added
  from the answer keep one answer and only make a puzzle easier, so Easy
  could start with about 30. *Developer:* "Maybe just change the words
  for now. I'll play it a bit and see if it feels too hard." Open until
  the developer has played it. *2026-10-22, developer:* "yess" (Easy
  should start with more digits): to build (digits added from the
  answer, about 30 at the start), then close. **Resolved 2026-10-22:**
  Easy starts with 30 digits, added from the answer and spread over the
  boxes; Harder unchanged; the How hard? words say so (see "Easy starts
  with 30 digits", release 3.4).

- **Q29. Which coloured-region Sudoku the developer means.** Raised
  2026-10-19 (see "A Sudoku with colours: which one?"): the usual rules
  (1-9 once in every row, column and 3 x 3 box) plus coloured shapes
  across rows and columns, not bound by the boxes, each colour's digits
  also all different. Candidates: (1) Killer Sudoku (cages with sums),
  (2) Extra Regions / "Color Sudoku" (nine coloured 9-square shapes,
  each also 1-9 once), (3) Disjoint Groups (colour by place in the box).
  Claude's guess: (2). **Resolved 2026-10-19:** (2), Extra Regions
  (developer: "It's 2, Extra Regions: nine coloured shapes, each also
  1-9 once.").

- **Q28. Find the Stars seems to repeat puzzles, "especially when I get
  up to 10x10"** (developer, 2026-10-19). Checked in the code: no random
  pick. Each size plays its 200 puzzles in a fixed order (the same on
  every device; `startGame(n, prog.next[n])`), and the puzzle number
  moves on only after a win or "Another" (`win`, `showEnd` in
  `src/ui/hidden-faces.js`). Try again, out of hearts, Give up, Show me
  how and 🏠 mid-puzzle all leave it, so the next Play brings the same
  puzzle back. The stock itself doesn't repeat: `data/hidden-faces.json`
  has 200 different region shapes per size (labels renumbered in order),
  and at 10x10 200 different answers (6x6: 75, so some 6x6s share an
  answer under different colours). *Resolved 2026-10-19* (developer: "It
  is less interesting t[o] have to keep going through the same puzzles
  before getting to something new"; loop back after 200, no reshuffle;
  shuffle the existing order once): built and published as release 1.2,
  see "Q28: a puzzle used as it starts; the stock shuffled once".

- **Q26. log.html's Clear asks with the browser's `confirm()`.** The
  games' Give up asks in the page itself (as the brief asked: "no
  browser confirm()"), but the log page's Clear, given as the model,
  uses `confirm()` (`src/ui/logpage.js`). Make Clear ask in the page
  too, or leave it (it's for the developer, not the games)? Raised
  2026-10-15.
  *Resolved 2026-10-18: left as it is.* The developer: "Everything
  seems to work as it is. Why would I change it?" Claude: nothing is
  broken; the only reasons are looks and a browser's rarely used "stop
  this page's pop-ups" box (Clear would then clear without asking),
  neither of which matters on a page only the developer uses. The
  developer: "close it."

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
  *Built 2026-10-15 (see "Q22-Q24 built"), on `star-battle`, not
  published; to resolve once the developer has tried it.*
  *Tried by the developer 2026-10-16 on the local server (desktop):
  works (see "Q22-Q24 tried on the desktop"). The iPhone after the
  publish closes it.*
  *Published 2026-10-16 (8f751b4); the iPhone to try.*
  *Resolved 2026-10-16:* on the iPhone after the publish of 8f751b4
  (and 8fa77c9), the developer: "It all works", then "It looks good";
  on the desktop first, 🏠 and the home page wiping the game was "what
  I wanted". Built as "Q22-Q24 built". Still to measure, either fitting
  the rule: whether iOS closing the app in the background keeps the
  game (the log's "kept game found" says).
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
  *Built 2026-10-15 (see "Q22-Q24 built"), on `star-battle`, not
  published; to resolve once the developer has tried it.*
  *Tried by the developer 2026-10-16 on the local server (desktop):
  works (see "Q22-Q24 tried on the desktop"). The iPhone after the
  publish closes it.*
  *Published 2026-10-16 (8f751b4); the iPhone to try.*
  *Resolved 2026-10-16:* Give up in Follow Me and Find the Stars, and
  Find the Stars ending on a full grid, "works (yes and no)" on the
  desktop and "It all works" on the iPhone (developer). The tools row
  first pushed the play screen right on the iPhone: fixed in 8fa77c9
  ("The play screen pushed right on the iPhone"); "It looks good".
- **Q25. The hint mechanism to be prototyped before publishing again.**
  The developer likes the white hint ✕s but isn't "sure the whole hint
  mechanism is working smoothly". What feels off not yet known.
  *Developer, 2026-10-15:* not sure, as not being able to start fresh
  threw everything off; fix Q22-Q24 first, then prototype the hints.
  *Developer, 2026-10-16* (after trying Q22-Q24 on the local server):
  "The new hint scheme seems to be working well. Two things caught my
  eye": **(a)** when the hint's words speak of "lit squares", the words
  stay after the hint is accepted but no squares are lit any more ("Not
  sure how to avoid that"); **(b)** when a hint first shows, "it is not
  clear how to accept it and get back to game play. It seems clicking
  on the grid does that, but there was no obvious sign that it would."
  (Checked: the words that point at the board are "the lit squares",
  "(lit)", "the ringed square" and "ringed ✕", in `findHint` and
  `explainHint`, `src/core/hidden-faces.js`.) *(a) and (b) built
  2026-10-16, see "Q25: Got it, and how to light a hint again", then
  changed with the developer to a blank line and a centred "(tap to
  light this hint again)" at the words' size; tried on the local server
  ("Almost perfect", then the font size changed) and published
  2026-10-16 (8f751b4); the iPhone to try.*
  *Resolved 2026-10-16:* the hint flow changed with the developer (the
  ❓ Why? / ✓ Got it row; a greyed hint's blank line and centred "(tap to
  light this hint again)" at the words' size): "The function is great",
  "Almost perfect" before the font change; on the iPhone "It all works"
  and "It looks good".
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

## 2026-10-15: Q22-Q24 built

The plan in "Q22-Q24: the fix agreed", on `star-battle`, one problem at
a time. DESIGN.md "Coming back to a game", Follow Me and Find the Stars
have the rules.

**Q22, one game in progress at most.**
- `src/core/resume.js`: `GAMES` (from `GAME_PAGES`), `clearGames(storage,
  keep)` (every game's kept state but `keep`'s; null: all) and
  `forgetOld(storage)` (the old `web-games-resume-*` and
  `web-games-last-page` keys). `returnTo` and `LAST_KEY` are gone.
- `src/ui/resume.js`: games keep to `sessionStorage`; opening a game
  clears the others ("another game’s kept state cleared"); 🏠 clears
  the game and nothing is kept after it ("🏠: the game cleared"); a game
  page shown again from the browser's memory after its state was cleared
  reloads ("back to a cleared game: starting fresh"). `homePage()` (on
  the home page, in place of `backToGame()`): clears every game as it
  opens and when shown again from memory ("home page" with what it
  cleared). On load, `forgetOld(localStorage)` once ("old kept games
  removed from the device").
- The games themselves are unchanged (same `resumable()` API).

**Q23, Give up.** Find the Stars: a fourth tool, 🏳 Give up; it asks in
the tools' place ("Give up this game?" Yes / No; a touch on the board is
No). Yes: `endGame(g, 'gaveup')` (core), then the out-of-hearts end
with "You gave up". Follow Me: 🏳 Give up under the scoreboard; it asks
in a card over the dimmed pads, with the robot stopped; Yes: `giveUp`
(core: the end of the last miss, score and best kept, `gaveUp: true`),
then the Game over banner; No: "Ready?" and the order shown again
(`carryOn()`, shared with picking a game up). No `confirm()` anywhere in
the games. (log.html's Clear, which the brief pointed to as the way to
ask, uses the browser's `confirm()`: Q26.)

**Full grid.** `isFull(g)` in `src/core/hidden-faces.js`: no game result,
no empty square (hint ✕s count as filled), fewer stars found than the
size. `endGame(g, 'full')` only when full. The screen ends it 0.4 s after
the board becomes full (Claude's choice: the second tap of a double tap
on the last square, a look, still comes first; a drag still going
waits), "No squares left / The pale stars show where they were", Try
again / Another / New game. `restoreGame` takes the results 'full' and
'gaveup'; a full grid kept in the 0.4 s ends when picked up.

**Q24, debug output only.** `scrollRoom()` in `src/core/fit.js` (heights
rounded, `maxScroll`, `atEnd` within 2 px) and `src/ui/scrolllog.js`:
the home page logs "scroll room" (docH, innerH, vvH, maxScroll, scrollY,
atEnd) when it opens, on resize and turning (settled 250 ms, repeats
skipped), when shown again from memory, and when a scroll stops at its
end.

**Tests** (270, was 262): `tests/resume.test.js` (opening a game clears
the others, the home page all; the old keys removed once, Find the
Stars' progress kept; games keep to sessionStorage and the home page has
no jump back), `tests/hidden-faces.test.js` (+3: the full-grid end and
not sooner, a whole row crossed out, one square left, Undo, kept and
picked up; hint ✕s count and a full board of found stars is a win;
Give up once, the end kept), `tests/follow-me.test.js` (+1: Give up part
way, the score and best, refused after; at 0 no best),
`tests/pages.test.js` (the four tools, the hidden question rows, no
`confirm()`, Follow Me's buttons and Give up's place),
`tests/fit.test.js` (+2: scrollRoom, the home page calls it). **Each
new check shown to fail** (mutated, `cmp` confirmed the file changed,
run, restored): clearGames keeping nothing back: 1 failed; forgetOld
missing the last-page key: 1; localStorage for games: 1; `homePage()`
removed: 1; isFull with one empty square allowed: 1; isFull ignoring
the result: 2; restoreGame refusing 'full'/'gaveup': 2; endGame 'full'
without the check: 1; Follow Me giveUp twice: 1; giveUp not keeping the
best: 2; Give up button removed: 1; the question row not hidden: 1 (Find
the Stars) and 1 (Follow Me); a `confirm()` put in: 1; Follow Me's
button not hidden at the end: 1; atEnd at 3 px: 1; maxScroll below 0: 1;
`logScrollRoom` removed: 1. (One catch on the way: `tests/css.test.js`
failed on a class `.off` that site.css already has; renamed `.ended`.)
`npm test`: 270 pass, 0 fail. `tools/offline.js`: version b1a3d9e3d733,
81 files.

**Checked in the built-in browser** (localhost:8123; state read by
script, not screenshots):
- Old keys: with `web-games-resume-nim`, `web-games-last-page` and Find
  the Stars' progress set, a reload of the home page left only the
  progress and the log; "old kept games removed from the device
  {keys: [web-games-resume-nim, web-games-last-page]}".
- Tic-tac-toe started (a move and the robot's), reloaded: "resumed",
  board 100020000. Then Nim opened: "another game’s kept state cleared
  {opened: nim, cleared: [tic-tac-toe]}", one entry. 🏠 from Nim's play
  screen: "🏠: the game cleared", nothing kept; Back to Nim: its setup
  screen, fresh. Follow Me played, then Back to the home page: "home
  page {how: opened, cleared: [follow-me]}".
- Every game played and reloaded, all ten "resumed" on the play screen
  with only their own entry (Matching needed "Just me" or a second face
  first: the test's mistake, not the page's).
- Follow Me: one order right ("Yes! 1!"), Give up while the robot showed
  the next: the card up, the pads dimmed; 2.5 s later nothing lit (the
  robot stopped). No: "Ready?", the order shown again. Give up, Yes:
  "Teddy got 1! New best!", Game over banner, Give up hidden, kept
  result `{score: 1, newBest: true, gaveUp: true}`.
- Find the Stars: Give up asked in the tools' place; No kept the ✕;
  Yes: "You gave up / The pale stars show where they were", 6 pale
  stars, Try again / Another / New game; after a reload the same end.
  Every square but one ✕ed: the game went on; the last: "No squares
  left" 0.4 s later. A double tap on the last empty square (a star
  under it): the star found, then "No squares left" (the look counted).
  Every square ✕ed and reloaded at once: "resumed" with no result, then
  "no squares left" at +0.43 s.
- Fit (pane sizes emulated): the four tools needed 362 px at first, more
  than a 375 px phone's row (343: the screen less 32 px), so their words
  shrink by width: 354 px at 14px from 386 px wide (393 x 760: row 361,
  the 10 x 10 page exactly the screen's height), 298 px at 12.5px (360
  and 375 wide: rows 328 and 343), 272 px at 11.5px under 330 (320
  wide: row 288). No sideways scroll at any. Follow Me at 393 x 760: pads
  174 px (4), 129 (6, was 132), 112 (9), no scrolling.
- Q24: "scroll room" logged as the home page opened. The pane was hidden
  (0 animation frames in 0.5 s), so no real scroll events came at all;
  a script-sent scroll at the bottom logged "scroll stopped at its end
  {docH 1679, innerH 768, maxScroll 911, scrollY 911, atEnd true}" once,
  its repeat skipped.
- No console errors. Test state cleared from `data/hidden-faces.json`
  (sessionStorage, and localStorage but the log); after a reload only
  `web-games-log`.

**Not checked:** the iPhone (the app's restart, iOS closing it in the
background, real scrolls on the home page); a real 320 px phone.

**Open questions:** Q22-Q24 built, to try (below); Q26 raised.

## 2026-10-15: Status (start here next session)

**Branch `star-battle`**, ahead of `main` (= de21c8c, live): Q22-Q24
built, not published: one game in progress at most (sessionStorage;
cleared by 🏠, the home page and opening another game; no jump back from
the app's icon; the old device keys removed once), Give up in Follow Me
and Find the Stars (asking in the page), Find the Stars ending on a full
grid, and the home page's scroll-room log lines. `npm test`: 270 of 270.

**Next:** the developer tries it on the local server (the list in the
build session's report); then publish only with their OK, then on the
iPhone: a restart starts clean; whether iOS closing the app in the
background keeps the game (to measure); Give up and the full grid. Then
Q25 (prototype the hint flow).

**Open questions:** Q22-Q24 (built, to try), Q25, Q26 (new: log.html's
Clear uses `confirm()`). **Proposed skill additions:** none.

## 2026-10-16: Q22-Q24 tried on the desktop

The local server had stopped overnight (it is the app's preview server
for the build session; most likely the computer slept or the app
closed); restarted, serving b1a3d9e3d733. The developer, on the desktop:
(1) one game at a time "works"; (2) 🏠 wipes "works. In fact I do not
even have to start a new game. Just going to the home page and back to
the previous game makes it start fresh. Which is what I wanted." (the
home page clears every game, as built); (3) Give up "works (yes and
no)"; (4) the full grid "works"; (5) the tools row "Looks fine on my
desktop". Not yet on the phone: that needs a publish (the restart, iOS
closing the app in the background, the tools row at the phone's width,
Q24's real scrolls).

**Next:** the developer asked whether to test the new hints model (Q25)
before publishing. Claude suggested publishing Q22-Q24 first (this build
doesn't touch hints; the phone checks need a publish; one change at a
time). The developer: "Wait: do the hint prototype (Q25) first, then
publish both."

## 2026-10-16: Status (start here next session)

**Branch `star-battle`**, ahead of `main` (= de21c8c, live): Q22-Q24
built and tried by the developer on the desktop (all five checks work),
**not published, on purpose**: the developer wants the hint prototype
(Q25) done first, then both published together.

**Next: Q25.** What feels off in the hint flow is not yet known: start
by asking the developer what to look at (play a puzzle on the local
server with hints, or a mockup), then prototype, try on the local
server, and only then publish Q22-Q25 together with the developer's OK.
After the publish, on the iPhone: a restart starts clean; whether iOS
closing the app in the background keeps the game; Give up; the full
grid; the tools row at the phone's width.

**Open questions:** Q22-Q24 (built, tried on the desktop, the iPhone
after the publish), Q25, Q26. **Proposed skill additions:** none.

## 2026-10-16: Q25: Got it, and how to light a hint again

The developer chose to skip a mockup ("build both fixes on star-battle
so I can try them on the local server"). Claude had proposed a ✓ Got it
button in the hint bar's corner and the lead-in "Tap to show this hint
again:" on the greyed words. **Changed before building, on a
measurement** (built-in browser, 375 x 667, the bar 337 px wide, 83 px
high): the bar's 3 lines hold about 130 characters at 15px. The longest
hint ("Columns 1, 2 and 3 only have squares left in ...", 155
characters) already scrolls inside the bar; with a corner button, or
with the lead-in, hints of 122 and 129 characters scroll too (and at
13px the lead-in still made 145 scroll). So, using space already there:
- **(b)** While a hint is lit, the tools row gives way to its own:
  `#hintTools`, **❓ Why?** (only for a hint with one; 💡 The hint in the
  Why?) and **✓ Got it** (`dimHint('Got it')`). `hintTool()` swaps the
  rows; the end and Give up's question hide it. The 💡 Hint button only
  gives hints now.
- **(a)** `dimHint(by)` (Got it, a board touch, Undo) shows a 2.5 s note,
  "↻ Tap here to light this hint again.", then the greyed words, which
  start with ↻ instead of 💡. A tap on the bar (the note or the words)
  lights the hint again, as before. The words themselves are unchanged
  ("the lit squares" is what a tap lights).
- Logged: "hint put out, its words kept" with `by` (Got it, the board).

**Tests:** `tests/pages.test.js` +1 (the hidden row with Why? and Got it;
Got it puts the hint out; `hintTool` swaps the rows and hides Why? for a
hint without one; the note's words; ↻ on the greyed words; the end hides
the row), and the earlier check on `dimHint` now looks for the note.
**Shown to fail:** Got it doing nothing; the tools not giving way;
`dimHint` without the note; 💡 kept on the greyed words; the row not
hidden in the HTML; the end not hiding it: 1 failed each. `npm test`:
271 pass, 0 fail. `tools/offline.js`: version a266759938a8.

**Checked in the built-in browser** (375 x 667, read by script): a hint
("Brown is just one square ..."): the tools hidden, the row ❓ Why? / ✓
Got it, 45 px high like the tools; Why?: "💡 The hint" and the Why?
words, and back. Got it: the board unlit, the tools back, the bar
"↻ Tap here to light this hint again."; 2.7 s later "↻ Brown is just one
square ...", greyed. A tap on the bar: lit again, the row back. Reloaded
while lit: lit, with the row. A touch on an empty square while lit: a ✕,
the hint put out, the note. A wrong-✕ hint (no Why?): Got it alone, the
whole row (343 px; it was a third of the row at first, the shared
`.tools` 3 columns, fixed with `grid-template-columns: none`); with a
Why?, 168 px each. The page 667 px high on the 667 px screen; no errors.
Test state cleared from `data/hidden-faces.json` and checked after a
reload: only the log.

**For the developer to try** on the local server: a hint, then ✓ Got it;
the note, then the greyed words with ↻; a tap on them; Why? and back.

## 2026-10-16: The greyed hint's "(tap to light this hint again)"

The developer tried the Got it row and the note: "It works very well.
One suggested change. The text that momentarily appears ... disappear in
a second and there is a web browser 'refresh symbol' that is not doing a
refresh function. How about this instead ... remove the refresh symbol
and just add the text below the original hint '(click to light this
hint again)'." Claude measured first (built-in browser, 375 x 667): with
the line inside the 3-line bar, every hint over about 120 characters
(even at 13px) would scroll; so the bar grows by one small line
(`calc(3 * 1.4em + 20px + 1.3 * 12px + 2px)`, 83 to 101 px). At 393 x 760
the board kept its size at 6, 8 and 10 (59, 44 and 35 px: limited by the
screen's width there). "tap", not "click", as the game's other words.
The developer: "Yes: build it that way (tap, the bar one small line
taller, no note or refresh mark)."

**Built:** `paintBar()` adds `<span class="relight">(tap to light this
hint again)</span>` under the greyed words (12px, its own line); the
words start with 💡 again; `dimHint()` paints the bar straight away (no
note, no ↻ anywhere in the page's code). The note for a look known to be
empty is unchanged.

**How long real hints are** (a scratch script, not kept: the first 40
puzzles of each size solved by hints alone): 3,474 hints, the longest
157 characters; 258 over 129, nearly all "all inside" (at most 135); 5
over 135, all "k in k rows" (group) hints. **In the greyed bar with the
line** (real texts): the "all inside" ones of 134 and 135 fit at 375 and
393 px wide; a group hint of 142 scrolls by one line at 375 (fits at
393), the 157 one at both. **Correction:** Claude told the developer the
extra room would stop the longest lit hint (155) scrolling; it doesn't
(the 17 px is less than a line; 145 and 155 still scroll when lit, as
before).

**Tests:** `tests/pages.test.js`: the bar's height (3 lines and a small
one), the line under the greyed words and its size, no ↻ in the code,
`dimHint` painting the bar. **Shown to fail:** the line not added; ↻
back; the old height; the line at 15px; `dimHint` not painting the bar:
1 failed each. `npm test`: 271 pass, 0 fail. `tools/offline.js`:
version bb780d361efe.

**Checked in the built-in browser:** at 393 x 760 on a 10 x 10, a hint
then Got it: the bar 101 px, "💡 The lit squares, all that's left for
..." greyed, the line "(tap to light this hint again)" under it, no
scrolling; the page 760 px on the 760 px screen. At 375 x 667 (after a
reload): 10 x 10 squares 30 px, the page 667. No console errors. Test
state cleared from `data/hidden-faces.json`; after a reload only the
log.

## 2026-10-16: A blank line, and the tap line centred

The developer: "The function is great. I would suggest 2 formatting
changes. Add a blank line between (tap to light this hint again) and
the hint itself, and center justify it." **Measured first** (built-in
browser, the bar 8 or 16 px taller, the fit run again): at 393 x 760 the
squares stayed 59, 44 and 35 px (6, 8 and 10: the screen's width limits
them); at 375 x 667 they went 50 to 47, 37 to 35 and 30 to 28 (the
smallest the game allows) with 16 px.

**Built:** `.hintbar .relight` gets `margin-top: 1.3em` (a blank line at
its own 12px size, 16 px) and `text-align: center`; the bar is
`calc(3 * 1.4em + 20px + 2 * 1.3 * 12px)` (101 to 114 px). Hints of up
to 3 lines still fit with the blank line and the tap line.

**Tests:** `tests/pages.test.js`: the bar's height and the line's blank
line and centring. **Shown to fail:** the blank line removed; not
centred; the old height: 1 failed each. `npm test`: 271 pass, 0 fail.
`tools/offline.js`: version 5cb8670a591a.

**Checked in the built-in browser** (393 x 760, a 10 x 10, a real hint
put out with Got it): the bar 114 px, the line "(tap to light this hint
again)" 16 px below the words, centred (its middle 200 px, the bar's 197:
the bar's 6 px left edge), no scrolling; the longest "all inside" words
(135 characters) fit too; the squares 35 px, the page 760 px on the
760 px screen. Test state cleared from `data/hidden-faces.json`.

## 2026-10-16: The tap line at the words' size

The developer: "Almost perfect. The bank line and centre justifaction is
good. But you use a smaller font that I suspect will be hard to read on
a phone. I suggest keeping the same font size as the hint text. If you
agree and have no questions, go ahead and publish so I can try on my
phone." Claude agreed.

**Built:** `.hintbar .relight` takes the words' size (15px, line height
1.4: no size of its own), a blank line of `1.4em` (21 px) above it; the
bar is `calc(5 * 1.4em + 20px)` (114 to 125 px). **Tests:** the bar's
height, the blank line, no smaller size. **Shown to fail:** 12px put
back; 4 lines high; no blank line: 1 failed each. `npm test`: 271 pass,
0 fail. `tools/offline.js`: version fca8e7ca327f.

**Checked in the built-in browser:** at 393 x 760, a real hint put out
with Got it on 6, 8 and 10: the bar 125 px, the line 15px like the
words, the gap 21 px, no scrolling; the squares 59, 44 and 35 px as
before, the page 760 px on the 760 px screen; the longest "all inside"
words (135 characters) fit with both lines. At 375 x 667: the squares
46, 34 and 28 px (were 50, 37, 30 before today's bar changes); the 10 x
10 page is 671 px on the 667 px screen (its squares at the 28 px
minimum): a 4 px scroll on that size, not the developer's phone. Test
state cleared from `data/hidden-faces.json`.

## 2026-10-16: Q22-Q25 published

Published with the developer's OK ("If you agree and have no questions,
go ahead and publish so I can try on my phone"; Claude agreed with the
font change and had no questions: the 4 px scroll of a 10 x 10 on a
375 x 667 phone is not the developer's phone, and is recorded above).
`main` fast-forwarded de21c8c..8f751b4 (from star-battle, without
switching branches: `git fetch . star-battle:main`) and pushed at
12:21. The Pages build for 8f751b4 was "built" at 19:21:57Z (about
22 s); the server sends version fca8e7ca327f and `src/ui/scrolllog.js`
(curl, 200).

**Checked live** (built-in browser): the pane first showed its older
offline copy (d4d04d); the next load saved fca8e7 and the one after
showed "Version Oct 16, 2026 · fca8e7" (the update path as designed).
That first new load removed the pane's real old keys: "old kept games
removed from the device {keys: [web-games-last-page,
web-games-resume-hidden-faces]}". The home page logged "home page
{how: opened, cleared: []}" and its scroll room. Find the Stars: the
tools Undo, 💡 Hint 3, 👁 Show 1, 🏳 Give up; a hint: the row ❓ Why? /
✓ Got it, the tools hidden; Got it: "💡 Brown is just one square ..."
greyed, then "(tap to light this hint again)" centred at 15px, the bar
125 px. No console errors. The browser's test state removed from a page
with no game script (`data/hidden-faces.json`) and checked after a
reload: only the debug log. The local server (port 8123, this
session's) stopped; no `serve.js` running, nothing listening on 8123.

**For the developer to try on the iPhone** (open the app once with wifi
so it gets the new version: the version line says fca8e7):
1. Start a game, switch to another app and back: the game is there.
2. Close the app completely (swipe it away) and open it: the home page,
   and every game starts fresh.
3. 🏠 in a game, then the same game: it starts fresh.
4. Give up in Follow Me and in Find the Stars (No, then Yes).
5. Find the Stars: ✕ every square: "No squares left".
6. Find the Stars' tools row (four buttons) fits the screen.
7. A hint: ❓ Why? / ✓ Got it; Got it: the greyed words with "(tap to
   light this hint again)"; a tap on them.
8. To measure (Q22): leave a game, use other apps for a long while (so
   iOS may close the app on its own), then open it: whether the game is
   kept. Either fits the rule; the log says which ("kept game found" or
   not).

## 2026-10-16: Status (start here next session)

**Published** (`main` = 8f751b4, version fca8e7ca327f): Q22-Q24 (one
game in progress at most, Give up, the full-grid end, the home page's
scroll-room log lines) and Q25's hint changes (the Why? / Got it row; a
greyed hint's blank line and "(tap to light this hint again)"). Branch
`star-battle` = `main` plus this journal entry. `npm test`: 271 of 271.

**Next:** the developer tries it on the iPhone (the list above); then
close Q22-Q25 with the evidence, or fix what the phone shows. Q24 stays
open until the home page fails to scroll again and its log is read.

**Open questions:** Q22-Q25 (published, the iPhone to try), Q26
(log.html's Clear uses `confirm()`). **Proposed skill additions:** none.

## 2026-10-16: The play screen pushed right on the iPhone

The developer, on the iPhone after the publish of 8f751b4: "It all
works. And while the buttons and grid fit my phone scree, they are not
centered on my phone screen. All are closer to the right than the left.
The whole grid is visible, but the right edge of the give up botton is
off screen and the second counter above the grid is cut in half"; "Its
like the whole screen should be shifted a bit left."

**Cause, reproduced** (built-in browser, 393 x 760): the play screen is a
grid column, and a grid item's text sets its smallest width, so the
tools row (four buttons, `white-space: nowrap`, auto columns) widens the
whole column when its words need more than the row has. In Chromium they
need 354 px of 361 (measured 2026-10-15), so it fit here; Safari's fonts
and emoji are wider. With the labels 1.2 px letter-spaced (9 px wider
in all) the play screen went 361 to 370 px: the board's left edge 17 to
21 px, the clock and Give up's right edges 377 to 386. On the iPhone
more than that: past the screen's edge. (The 2026-10-15 fit check
measured Chromium's fonts only: a lesson below.)

**Fix:**
- No row of buttons can widen the page: `.tools { min-width: 0 }` and
  `.tools > .tool { min-width: 0; overflow: hidden }` (a button too wide
  is cut instead).
- `fitTools()` (`src/ui/hidden-faces.js`): the tools' words from the
  CSS's size (`--tf0`: 14px, 12.5px under 386 px, 11.5px under 330) down
  to 10px in half pixels (`largestFitting` from `src/core/fit.js`) until
  no button is cut; once per screen width, when the tools show (the
  fit, Give up's question going, a hint going out). Logged: "tools fit"
  (font, base, the buttons cut at the base size, the row, the screen);
  the "fit" line now has `mainW` and `playW` (they must match).

**Tests:** `tests/pages.test.js` +1 (the two CSS rules, the size by
variable, the fit loop, its log, called from the fit, Give up's question
and the hint going out, the widths in the fit log). **Shown to fail:**
the buttons' `min-width: 0` gone; the row's gone; `fitTools()` not
called from the fit; the fit loop not checking for cut buttons: 1
failed each. `npm test`: 272 pass, 0 fail. `tools/offline.js`: version
f4c8e57d3a6d.

**Checked in the built-in browser** (393 x 760, local server): as built,
14px, nothing cut, "tools fit {font 14, cutAtBase []}", the play screen
361 = the page column, the board 17 px from each side. The labels made
wider by a style added in the page (before any refit): the play screen
stayed 361, the board centred (17 | 17), the clock and Give up at 377;
Hint, Show and Give up cut (the safety net). The same wider labels in
the stylesheet for one load (then removed: `cmp` with the saved copy,
no test line left): "tools fit {font 12.5, base 14, cutAtBase [hintBtn,
showBtn, giveUpBtn]}", nothing cut, the board 17 | 17, all four labels
whole. Not checked: Safari's own fonts (the iPhone, after a publish).
Test state cleared from `data/hidden-faces.json`.

**Proposed skill addition** (for the developer at a checkpoint):
"Measure fit on the target browser's fonts, or design for them. A fit
measured in one browser's fonts can fail in another's; leave margin, or
fit at run time. *Evidence:* a row of four buttons measured to fit with
7 px to spare in Chromium pushed the play screen past the iPhone's edge
in Safari." Added to "Proposed additions to the standards skill".

## 2026-10-16: The tools fit published

Published with the developer's OK ("Publish."): `main` fast-forwarded
8f751b4..8fa77c9 and pushed at 12:33:48. The Pages build for 8fa77c9 was
"built" at 19:34:23Z (about 34 s); the server sends version
f4c8e57d3a6d and `src/ui/hidden-faces.js` with `fitTools` (curl).
**Checked live** (built-in browser, 393 x 760): the first load still
showed the pane's offline copy (fca8e7), the next "Version Oct 16, 2026
· f4c8e5". Find the Stars: "tools fit {font 14, base 14, cutAtBase []}"
and "fit {..., mainW 361, playW 361}"; the board 17 px from each side,
the clock and Give up at 377 (the page column's edge); nothing cut; no
console errors. (Chromium's fonts: the iPhone is the real check.) Test
state cleared from `data/hidden-faces.json`; only the log. The local
server stopped; no `serve.js` running, nothing on port 8123.

**For the developer to try on the iPhone** (open the app with wifi
until the version line says f4c8e5): Find the Stars' play screen
centred, the clock and 🏳 Give up whole; the four tool labels whole
(perhaps a little smaller). If anything is still off: the log page has
"tools fit" (the size used, the buttons cut at the start size) and the
"fit" line's `mainW` and `playW`.

## 2026-10-16: Status (start here next session)

**Published** (`main` = 8fa77c9, version f4c8e57d3a6d): Q22-Q25, and
the tools row that can't widen Find the Stars' play screen. Branch
`star-battle` = `main` plus this journal entry. `npm test`: 272 of 272.

**Next:** the developer checks Find the Stars on the iPhone (centred,
nothing cut); then close Q22, Q23 and Q25 with the evidence (the
developer: "It all works" on the iPhone after the 8f751b4 publish, but
for the screen shifted right). Q24 stays open until the home page fails
to scroll again and its log is read. Review the proposed skill addition
(fit on the target's fonts) with the developer.

**Open questions:** Q22, Q23, Q25 (to close after the iPhone check),
Q24, Q26. **Proposed skill additions:** one (above).

## 2026-10-16: Q22, Q23 and Q25 closed; the two version numbers

The developer, on the iPhone at f4c8e5: "It looks good." Q22, Q23 and
Q25 moved to Resolved with the evidence. Q24 stays open (the home page's
scroll-room log lines wait for it to happen again); Q26 stays open.

The developer asked why the version line says f4c8e5, not 8fa77c9, and
where the numbers come from ("They seem to be random"). Explained: two
different fingerprints. 8fa77c9 is git's commit id (made from the
commit: its files, message, parent, author and time). f4c8e5 is the
site's version, made by `tools/offline.js` from the contents of the 81
files the site saves for offline (SHA-256, the first 12 hex digits;
the version line shows 6): the same files give the same number, so it
changes exactly when the site changes (a journal-only commit makes a
new commit id but not a new version), and devices fetch a new copy when
it changes.

## 2026-10-16: Release numbers and release notes

The developer, after the version-number explanation: "Should we
consider a more 'human meaningful' version number? Like 1.0 (and 1.1
for bug fixes on versiono 1) and 2.0 for new games?" Claude proposed it
in front of the fingerprint, set by hand at each publish, starting at
1.0. The developer: "Yes - build it. No need for the 'whats new' info in
the app. But we should probably make the human friendly release numbers
visible on github, and the 'changes in this release' or 'release notes'
seems like a good thing to have."

**Built** (DESIGN.md "Releases"; CLAUDE.md's publish steps):
- `src/core/release.js`: `RELEASE = '1.0'`, set by hand. The version line:
  "Version 1.0 · Oct 16, 2026 · 720f74" (`versionLabel` puts the release
  first; an older `sw.js` without one shows as before).
- `tools/offline.js` copies the release into `sw.js` (`const RELEASE`),
  and `check()` reports a `sw.js` with another; `sw.js` tells pages its
  release with the version. `src/ui/offline.js` logs it ("opened ...
  {release, version, made}").
- `RELEASES.md`: notes, newest first; 1.0's: everything on the site so
  far (nine games for young kids, Find the Stars, offline, one game in
  progress, Give up).
- `tools/release.js`: `node tools/release.js` says "ready" or what's
  missing (the number's form, newer than the last `vX.Y` tag and not
  one already made, `RELEASES.md`'s newest being it with notes and the
  site's current version, `tools/offline.js` up to date);
  `node tools/release.js notes` prints the notes for the GitHub release.
  Now: "Release 1.0 is ready: version 720f7406cc4a; tag v1.0 not made
  yet." No tags in the repository yet.
- README: a Releases section; and "Hidden Faces" in its first lines
  corrected to Find the Stars (renamed 2026-10-14).

**Correction:** Claude told the developer "Everything that's live now,
eleven games": it's ten (nine for young kids and Find the Stars).

**Tests:** `tests/release.test.js` (5: RELEASES.md read with either line
ends, a bad heading; x.y numbers compared by part, 1.10 after 1.9; ready
cases, the first release too; each problem reported alone: a tag already
made, not after the last, another version, no notes, a bad heading, no
releases, a number not RELEASES.md's newest, not x.y, offline problems;
the repository's number and newest notes agree), `tests/offline.test.js`
+1 (no release file: none; a new number reported until `tools/offline.js`
runs, then in `sw.js`; the version line with a release, a next one, and
an older `sw.js` without), and the worker test now expects the release
in its reply. **Shown to fail:** a tag already made not caught; numbers
compared as strings; the version check gone; `sw.js`'s release not
checked; the release left off the version line; RELEASES.md's newest
0.9: 1 failed each (2 for the version line: changing a site file also
made the version stale). `npm test`: 278 pass, 0 fail.
`tools/offline.js`: release 1.0, version 720f7406cc4a, 82 files.

**Checked in the built-in browser** (local server): the home page
"Version 1.0 · Oct 16, 2026 · 720f74"; the log "opened in the browser
{release: 1.0, version: 720f7406cc4a, ...}" and "saved for offline
{release: 1.0, ...}"; no console errors.

**Not done yet:** publishing 1.0 (the merge, the tag `v1.0` and the
GitHub release), which waits for the developer's OK.

## 2026-10-16: Release 1.0 published

Published with the developer's OK ("Publish as 1.0, with the tag and the
GitHub release."). `node tools/release.js`: "Release 1.0 is ready:
version 720f7406cc4a; tag v1.0 not made yet"; `npm test` 278 pass. `main`
fast-forwarded 8fa77c9..16bb72e and pushed; tag `v1.0` (annotated, on
16bb72e) pushed; GitHub release "1.0" made from the notes
(https://github.com/donpark2000/Web-Games/releases/tag/v1.0: "Latest",
not a draft). The Pages build for 16bb72e was "built" at 19:53:20Z
(about 37 s); the server sends `src/core/release.js` with
`RELEASE = '1.0'` and version 720f7406cc4a. Afterwards
`node tools/release.js` says "v1.0 is already a release: every publish
needs a new number" (exit 1): the guard works.

**Checked live** (built-in browser): the first loads showed the pane's
older copy, the second with "(new version next time: Oct 16, 2026 ·
720f74)" (the old page's code has no release on that line), the third
"Version 1.0 · Oct 16, 2026 · 720f74"; the log "opened in the browser
{release: 1.0, version: 720f7406cc4a, ...}"; no console errors.

**The GitHub release's text broke mid-sentence:** GitHub shows every line
break in a release's text (10 `<br>` in the notes' list items, read from
the page). `tools/release.js notes` now joins each paragraph and list
item onto one line (`unwrap`: blank lines, headings and new list items
kept; test +1 in `tests/release.test.js`, shown to fail with list items
not kept apart and with a line joined onto a heading; `npm test` 279
pass). The release's text replaced with the joined notes (`gh release
edit v1.0 --notes-file`: the same words): 0 `<br>`, 6 list items. (The
first try at the join put a line after a heading onto the heading; the
test caught it.) `tools/` isn't part of the site, so this is on
`star-battle` only, for the next release.

The local server (port 8123, this session's) stopped.

## 2026-10-16: Status (start here next session)

**Published: release 1.0** (`main` = 16bb72e, tag `v1.0`, GitHub release
1.0, site version 720f7406cc4a). Branch `star-battle` = `main` plus
`tools/release.js`'s joined notes and the journal. `npm test`: 279 of
279.

**Publishing from now on** (CLAUDE.md): propose the release number when
asking to publish; `src/core/release.js`, `node tools/offline.js`, the
notes in `RELEASES.md` with the site's version, `node tools/release.js`
says ready; after the merge, tag `vX.Y`, push it, `gh release create vX.Y
--title X.Y --notes-file` with `node tools/release.js notes`.

**Next:** the developer's next request. Open: Q24 (the home page's
scroll, waiting for it to happen again), Q26 (log.html's Clear uses
`confirm()`); the proposed skill addition (fit on the target's fonts) to
review.

## 2026-10-16: 1.0 on the iPhone; the skill proposal dropped

The developer, on the iPhone at release 1.0: "It all looks good on my
phone now." So Find the Stars' play screen is centred with the tools
fit (8fa77c9's fix), checked on the real target.

Asked "How gnereral and reusable would this be?" about the proposed skill
addition (fit on the target's fonts), Claude: as written a web case; the
general part, a stand-in (Chromium on Windows) checked in place of the
target (Safari on the iPhone), is mostly in the skill already ("Trust
running the real thing over reading about it", "Build fakes ... from the
real thing"); options: drop it, or widen the first rule to "over a
stand-in or reading about it"; Claude's pick: drop it. The developer:
"Drop it: keep the lesson in the journal only." The lesson stays here,
in "The play screen pushed right on the iPhone".

**Status:** as in the last status entry (release 1.0 live), with no
skill additions waiting. Open: Q24, Q26.

## 2026-10-18: Q26 closed; Give up "Show me how": mockup v1

Q26 closed: log.html's Clear stays as it is (see Resolved).

**The developer's idea:** on a 10 x 10 they couldn't solve even after 3
hints and the Show, Give up was the only way out, "very unsatisfying
since I learn nothing from it". Give up could have two modes: the
current one, and one "more like a tutorial", stepping through the rest
of the puzzle with hint-like words for each step, waiting for a confirm
before the next.

**Claude's five proposals, agreed for a mockup ("Yes, make a mockup with
those five proposals."):**
1. Give up asks how: **Show me how**, **Just end it** (as now), **No**.
2. The walk-through starts from the player's board (the first step is
   the one they were stuck on); their ✕s count, a wrong ✕ is pointed out
   first, as hints do.
3. Each step looks like a hint: words in the bar, the squares lit, ❓ Why?
   where there's a deeper reason, **Next ▸**, and **⏩ The rest** to finish
   at once.
4. ✕s a found star implies aren't steps of their own: they go on with the
   star.
5. The end counts as given up (no best time).

**Mockup v1:** [Give Up Walkthrough Mockup](https://claude.ai/artifact/PmNc95i5mPVZVPmtnUkDEH)
(private Claude artifact, version 1). The real game copied into Claude's
scratchpad with the walk-through added there, published with its own
files (page, CSS, modules, puzzles); nothing in the repo changed. In the
scratch core, `walkStep` takes the next hint's step as `useHint` does,
with no hint used (and a found star's implied ✕s folded in);
`walkLength` counts the steps on a copy. Claude's choices, all open:
- **Each step is taken as it's shown** (as hints have done since
  2026-10-15): its star or white hint ✕s are on the board while its words
  and lit squares show. Next goes to the following step; on the last,
  "Finish ▸".
- "3 of 10 found" reads **"Step 3 of 18"** during the walk-through; the
  clock stops when it starts; the board takes no taps.
- The end: "Shown step by step / 18 steps · you found 3 of 10" beside the
  star, the bar edged blue; the buttons **Try again / Another / New
  game**, as after giving up (proposal 5 said Next / Same size; changed
  because Try again lets you solve the same puzzle yourself, now that
  you've seen how).
- The ask row reads "Give up?" (shorter than "Give up this game?", to fit
  three buttons on a phone).
- **Mockup only:** a "A stuck 10×10" button on the setup screen: puzzle 17
  (seed index 16) with its first 5 solver steps done as the player's own ✕s
  and stars (3 found), hints and the Show used, 14:32 on the clock; its
  next step is a "would rule out". 🏠 goes back to the setup screen.

**Measured** (`pick-stuck.mjs` in the scratchpad, the first 40 10 x 10
puzzles; each walk-through 3-28 ms): a whole 10 x 10 takes 16-34 steps;
none needed "try a star", so every step had a Why? in the stuck game.
Puzzle 17 from the stuck point: 18 steps (7 "would rule out", 3 "all
inside", 1 "k in k", 7 "only one left"); from blank, 23.

**Checked** (built-in browser, the scratch copy served by a temporary
`.claude/launch.json` entry, removed after): all 18 steps with Next at
393 x 760: every step's words and its Why? fit the bar (none over its
height), Why? on all 18, "Finish ▸" on the last, the end as above; ⏩ The
rest from a blank board (23 steps) and Try again (back to 0 of 10, the
tools back); Give up then No (the tools back). Rows at 320, 375 and 393
px wide: none of the new buttons cut, the page no wider than the screen
(narrow-phone sizes added after "Show me how" and "⏩ The rest" were cut
at 320). Found and fixed: after Try again the hint bar kept the end's
blue edge (`paintBar` didn't remove the new class). The published copy
not opened by Claude (the built-in browser isn't signed in to claude.ai).

**Noticed, for the developer:** the walk-through often ends with a run of
"only one left" steps (puzzle 17: the last 6), each one tap. Fold the
easy ones into the step before, or keep every star its own step?

## 2026-10-18: Mockup v2: how the other squares fade

**Developer** on v1: "The mockup is working well." The squares a step
isn't about are "a bit too dim. In particular, white X cells from
previous hints are hard to see. Being able to see the whole grid is
important to understanding." Dim them less, or make the lit squares a
little bigger, or both?

**Why the white ✕s vanish:** the spotlight fades each whole square
(`opacity: .35; filter: grayscale(.7)` in `css/hidden-faces.css`), so its
marks and the lines between colours fade with it; a white ✕ at 35% on a
pale page is nearly gone. **Claude's view:** fade only the colour and
keep the marks; making lit squares bigger would cover the neighbours'
edges (on a 10 x 10 the squares are about 35 px and touch), including
the thick lines between colours the reasoning needs, so a shadow that
lifts them at the same size instead. The same spotlight is the 💡 hints'
too, so the choice changes both.

**Mockup v2** (the same artifact, version 2): a **Fade** switch, bottom
right, remembered on the device: **A** as now; **B** only the colour
fades (half way to a pale grey, `color-mix(in srgb, var(--rc) 50%,
#F1F3F3)`), marks and lines at full strength; **C** B, and the lit
squares lifted by a shadow. (B was first a 35% mix: the colours were
nearly lost, and the colours matter to the logic; 50% after one look.)

**Checked** (built-in browser, 393 x 760, the scratch copy served as
before, the temporary launch entry removed after): each fade's computed
styles on step 5 of the stuck 10 x 10 (B and C: the other squares at
full opacity, no filter, their colour mixed; C: the lit squares' shadow,
above their neighbours). Screenshots weren't reliable with the browser
pane hidden (frames a click behind, the fade's 0.2 s transition not run),
so only one full screenshot of B was used to judge it: every ✕, white
ones too, and every colour's outline readable.

## 2026-10-18: Mockup v3: fade D, A's dimming with the marks kept

**Developer:** "What would A look like if you kept the dimming of the
background cell color but kept the X's and Stars at full brightness?"

**Mockup v3** (the same artifact, version 3): a fourth Fade, **D**: the
square's colour as A shows it, worked out instead of faded with opacity
(`color-mix(in srgb, oklch(from var(--rc) l calc(c * .3) h) 35%,
var(--sky))`: the colour at 30% of its chroma, standing in for A's
`grayscale(.7)`, then 35% of it over the page's sky), with the ✕s, stars
**and the lines between colours** at full strength (in A the lines fade
too; Claude kept them, as they're drawn as the squares' borders and
the shapes of the colours matter to the reasoning; to say if they should
fade).

**Checked** (built-in browser, 393 x 760, the pane shown this time): on
step 5 of the stuck 10 x 10, a tan square (#CFAE86) dimmed is
rgb(214, 219, 213) in D; A's, worked out from its opacity and greyscale
over the sky (228, 241, 238), is (214, 219, 212): the same colour. Side
by side, D's ✕s and stars dark and crisp, A's faint. The relative colour
syntax (`oklch(from ...)`) needs Safari 16.4 or later; a build could
work the colours out in the script instead.

## 2026-10-18: Mockup v4: fade E, D's squares with C's lift

**Developer** on v3: "I like the way the lit cells look in C. But I
prefer the way the non-lit cells look in D."

**Mockup v4** (the same artifact, version 4): a fifth Fade, **E**: the
squares a step isn't about as in D (A's dimmed colour, the ✕s, stars and
lines at full strength), the lit squares as in C (lifted by a shadow,
`0 2px 8px 1px` at 55% black, above their neighbours). E is what the
mockup shows first (remembered under a new key, so an earlier pick on
the device doesn't hide it).

**Checked** (built-in browser, 393 x 760): on step 5 of the stuck
10 x 10 with E: a faded square rgb(214, 219, 213), the same as D's; the
lit squares their full colour with the dark edge and the shadow, above
their neighbours; the page no wider than the screen; a screenshot shows
the lit column standing out with every ✕ and star readable.

Open from v3: whether the lines between colours should stay at full
strength (as in D and E) or fade (as in A).

## 2026-10-18: Mockup v5: the white ✕'s edge

**Developer** on v4: "Very good. Would it be possible to make the black
outline of the white X's darker or perhaps a little thicker?"

**Now:** `HXMARK` (`src/ui/hfboard.js`) draws the white line (stroke 13)
over a dark one (stroke 23, #2B2B33) in a 100-unit box, so the edge is 5
units each side; the ✕ is 58% of a square, so on a 10 x 10's 35 px
squares the edge is about 1 px. It's already nearly black, so a darker
edge alone changes little; thicker is what shows.

**Mockup v5** (the same artifact, version 5): a **✕ edge** switch,
bottom left (the Fade switch bottom right): **1** as now; **2** black,
8 units each side (stroke 29, about 1.6 px on a 10 x 10); **3** black,
10 units (stroke 33, about 2 px). The white line stays 13. Opens on 1;
remembered on the device. (The star's edge is 7 units of a 100-unit box
at 88% of a square: about 2.2 px on a 10 x 10, close to 3.)

**Checked** (built-in browser, 393 x 760): each setting's computed
stroke and width on a white ✕ (rgb(43, 43, 51) 23; black 29; black 33);
the two switches side by side, clear of each other and of the buttons
above; the page no wider than the screen.

## 2026-10-18: Show me how agreed; status (start here next session)

**Developer:** fade **E**, white ✕ edge **3** ("3"), after "E looks
right" was offered with two defaults that weren't changed: the lines
between colours stay at full strength, and each "only one left" step
stays its own step.

**Agreed, to build** (from mockups v1-v5 above,
[Give Up Walkthrough Mockup](https://claude.ai/artifact/PmNc95i5mPVZVPmtnUkDEH),
version 5):
1. **Give up asks how:** "Give up?" **Show me how** / **Just end it** /
   **No** (Just end it = today's Yes; a touch on the board = No).
2. **Show me how** walks through the rest from the player's board, one
   step at a time, each shown and taken as a hint is (words, lit squares,
   ❓ Why?, its star or white hint ✕s), with no hint used; ✕s a found star
   implies go on with the star, not as steps. Buttons: **❓ Why?** /
   **⏩ The rest** / **Next ▸** ("Finish ▸" on the last). "Step 3 of 18"
   in place of "3 of 10 found"; the clock stops; the board takes no taps.
3. **The end:** "Shown step by step / 18 steps · you found 3 of 10",
   the bar edged blue; **Try again / Another / New game**; counts as
   given up (no best time, the puzzle not moved on).
4. **Fade E, for hints too** (the same spotlight): the squares a step
   isn't about keep their marks and lines at full strength, their colour
   as A dimmed it (35% of the colour at 30% chroma over the sky); the lit
   squares lifted by a shadow.
5. **White ✕ edge 3:** black, stroke 33 under the white 13 (was #2B2B33,
   23), wherever a hint ✕ is drawn.

**For the build** (not in the mockup): kept with the game for a reload
(resume: the walk-through's step, what's lit); its debug lines as the
mockup's ("give up: show me how", "show me how: step" with kind and
words, "the rest", "done"); tests in `tests/` for `walkStep` and
`walkLength` (the normal case, a wrong ✕ first, implied ✕s folded in,
the fallback when no step can be explained) and the new end; DESIGN.md
("Find the Stars": Give up, hints' spotlight and hint ✕); the narrow
phone sizes of the two new rows (mockup: 385 px and 345 px). Fade D/E's
`oklch(from ...)` needs Safari 16.4+: check the iPhone, or work the
colours out in the script. The mockup's code is Claude's scratch copy
(`patch-mock.mjs` and the files in the artifact; read them with the
Artifact tool, `path`, if the scratchpad is gone); the repo is untouched.

**Status:** `star-battle` = `main` + `tools/release.js`'s joined notes +
journal; nothing built yet; `npm test` not run this session (no code
changed). The next publish will be a release: propose **1.1** (a change,
not a new game). **Next:** build the above, try it on the local server,
then the developer's OK to publish. Open: Q24.

## 2026-10-18: Show me how built

Built on `star-battle` what "Show me how agreed" above lists, from the
mockup's code (read back from the artifact, version 5, with the Artifact
tool), less its mockup-only parts (the stuck 10 x 10 button, the Fade
and ✕ edge switches).

**What changed:**
- `src/core/hidden-faces.js`: `walkStep` and `walkLength` as in the
  mockup, with one change: `findHint`, `walkStep` and `walkLength` take
  the hardest rule allowed (`maxLevel`, 4 by default), so a test can
  reach the fallback ("No step to explain here: the next star is ...",
  kind `shown`) with no rules; it can't be reached with all of them.
  `walkLength` caps at n² steps (the mockup: 500). A new end,
  `endGame(g, 'shown')`, only once every star is found, and kept and
  picked up like the others (`restoreGame` accepts it). Claude's choice:
  a result of its own rather than the mockup's screen-only
  `G.result = 'shown'`, so a reload at the end comes back to it.
- `fadedColor(hex, under)`: fade E's colour worked out in the script
  (OKLab/OKLCH maths, then the sRGB mix), not with CSS's
  `oklch(from ...)`. **Why:** relative colours need Safari 16.4+, and
  the iPhone's version wasn't checked; worked out in the script, every
  browser that ran the game before shows it. The screen gives each
  square its faded colour as `--fc`; the spotlight's CSS just uses it.
- The screen (`src/ui/hidden-faces.js`, `hidden-faces.html`): the ask
  row "Give up?" Show me how / Just end it / No (Just end it keeps
  Yes's id, `giveUpYes`); the walk-through's row; "Step N of M"; the
  clock stopped (the walk keeps the time it stopped at); no board taps;
  the end "Shown step by step / N steps · you found K of n", the bar
  edged blue, Try again / Another / New game; kept for a reload (the
  walk's step and stars found at the start; the step on show is kept as
  the hint; its total worked out again from the board). Debug lines:
  "give up: show me how", "show me how: step" (step, of, kind, star,
  hint ✕s, implied, words), "show me how: the rest" (kinds), "show me
  how: done", "kept walk-through not shown" (a kept walk that can't be
  shown: the game plays on), "give up: just end it" (was "give up:
  yes"); Why?'s line says the step.
- CSS: fade E for hints and steps (the old opacity/greyscale fade and
  the squares' transition gone); the lit squares' shadow; the blue end
  edge; the two rows' sizes on narrow phones (385 px and 345 px, the
  mockup's). `HXMARK` (`src/ui/hfboard.js`): black, stroke 33 under the
  white 13.
- DESIGN.md: Give up, the hint ✕, the spotlight, Show me how, the end.

**Tests** (`npm test`: 285 pass, 0 fail; 5 new in
`tests/hidden-faces.test.js`, 1 new and 2 changed in
`tests/pages.test.js`): the walk-through from a player's star to the
end on 7 puzzles (each step right, the count the same as `walkLength`
said, no win, hints and hearts untouched); a wrong ✕ first; a found
star's ✕s folded into the next step (and the same count with Auto ✕ on
or off); the fallback; the 'shown' end only with every star found,
surviving keeping, and a kept half-way game walking on to the same
count; `fadedColor('#CFAE86', '#E4F1EE')` is **#D6DBD5 = rgb(214, 219,
213)**, what Chromium drew for mockup v3's CSS (above). **Each new check
shown to fail** (a scratch copy, one change at a time): no folding,
walkLength one too many, chroma .35, the end allowed early, the
fallback's star not the first, `restoreGame` refusing 'shown': each
failed the test meant for it.

**Tried** (built-in browser, `tools/serve.js` on 8123, 393 x 760, then
320, 360 and 375 wide):
- 10 x 10, I'll do it, 👁 Show (a star found, its ✕s not marked), Give
  up: the row "Give up? / Show me how / Just end it / No", none cut.
  Show me how: "Step 1 of 16", the clock stopped, the tools gone for
  ❓ Why? / ⏩ The rest / Next ▸; the log's step 1: an "inside" step with
  **24 implied ✕s folded in** (white ✕s round the found star in the
  screenshot). A faded Brown square **rgb(214, 219, 213)** (its `--fc`
  #D6DBD5), opacity 1, no filter: the same as the mockup's D/E; a lit
  square its full colour with the inset edge and the shadow
  (0 2px 8px 1px at 55% black), z-index 3; a hint ✕'s edge #000 at 33.
- A tap on the board: nothing changed. Next, then Why?: its words, the
  outlines, the button "💡 The step". **A reload:** back on "Step 2 of
  16" with the Why? showing (log: "resumed ... walk: 2").
- Next twice, ⏩ The rest: 12 steps at once (log: "touch touch touch
  single x 9"), 4 + 12 = the 16 counted at the start; the end "Shown
  step by step / 16 steps · you found 1 of 10", the bar's edge
  rgb(31, 95, 209), 10 stars. Try again: "0 of 10 found", the bar idle
  (no blue edge left), the tools back.
- With 3 s on the clock: Show me how, the clock "0:03" before and 2.2 s
  after; Next 27 times: "Step 27 of 27", "Finish ▸", The rest greyed;
  the end "27 steps · you found 0 of 10", the clock still 0:03, nothing
  kept as progress (`web-games-hidden-faces` absent: no best time, the
  puzzle not moved on). A reload at the end: the same end.
- 320 x 640: the ask row (13px / 12px) and the walk row (12.5px), none
  cut, the page 320 wide; No: the tools back; a 💡 hint's spotlight
  fades the same way (a square's colour its `--fc`, opacity 1); Just
  end it: "You gave up", 10 pale stars, as before. 360 and 375 wide:
  both rows at 13.5px, none cut, the page no wider than the screen. No
  errors in the console.

**Noticed (not changed):** at 320 px wide the turn line "10×10 · puzzle
1" is cut at its right edge beside the 🏠 (the screenshot shows
"puzzle" cut off). This change doesn't touch that line; whether it was
cut before wasn't checked. Raised as Q27.

**Not checked:** the iPhone (Safari's fonts may be wider; the rows are
cut, not pushed out, if so), and sound.

## 2026-10-18: Status (start here next session)

**Built** on `star-battle` (above), with tests, tried on the local
server; not published. **Next:** the developer tries it (the local
server, or the iPhone after a publish), then the OK to publish as
**release 1.1** (a change, not a new game): set it in
`src/core/release.js`, `node tools/offline.js`, notes in `RELEASES.md`,
`node tools/release.js` ready, merge, tag `v1.1`, the GitHub release.
Open: Q24, Q27 (the turn line cut at 320 px).

## 2026-10-18: Release 1.1 published

Published with the developer's OK ("Please publish. It looks great on my
local server. Next step will be a phone test."), as **1.1**, the number
proposed in the status entry (a change, not a new game).
`src/core/release.js` 1.1; `node tools/offline.js`: "release 1.1,
version a13d7c8f2673 (2026-10-18), 82 files"; notes in `RELEASES.md`;
`npm test` 285 pass; `node tools/release.js`: "Release 1.1 is ready:
version a13d7c8f2673; tag v1.1 not made yet". `main` fast-forwarded
16bb72e..d7c27ee and pushed; tag `v1.1` (annotated) pushed; GitHub
release "1.1" from `node tools/release.js notes`
(https://github.com/donpark2000/Web-Games/releases/tag/v1.1: not a
draft; 5 lines of text, each a paragraph or list item, so no breaks
mid-sentence). The Pages build for d7c27ee "built" at 20:48:13Z; the
server then sends `RELEASE = '1.1'` and version a13d7c8f2673.

Local servers stopped: the developer's (`tools/serve.js 8123`, process
25312); Claude's mockup server was already stopped. None left running.

**Next:** the developer's phone test of Show me how, fade E and the
hint ✕ edge (Safari's fonts in the two new rows; `oklch(from ...)` if
the build kept it). Open: Q24, Q27.

## 2026-10-18: 1.1 on the phone; status (start here next session)

The developer, after the phone test of release 1.1: "Looks great. No
further changes at this time." So Show me how, fade E and the thicker
hint ✕ edge are checked on the real target (the iPhone's Safari,
including the two new button rows and the faded squares' colours).

**Status:** release 1.1 live (`main` = d7c27ee, tag `v1.1`, site version
a13d7c8f2673); `star-battle` = `main` + the journal. Nothing in
progress. **Next:** the developer's next request, in a new session.
Open: Q24 (the home page's scroll, waiting for it to happen again), Q27
(the turn line cut at 320 px wide).

## 2026-10-19: Q28: a puzzle used as it starts; the stock shuffled once

The developer's question ("I keep seeing the same games in the same
order - especially when I get up to 10x10") answered from the code (Q28,
above): a fixed order, moved on only by a win or Another. Claude
proposed counting a puzzle as used as it starts and a new shuffle after
each 200; the developer: loop back after 200 ("By the time I get to the
200th puzzle I will have long forgotten what came first"), and "shuffle
the existing order once so I start off seeing new puzzles"; build and
publish, no mockup or local server test.

**Built** (DESIGN.md "Find the Stars", "Puzzles" and "Kept on the
device"):
- `takeNext(prog, n)` (core): the number to start, counted at once.
  `startNext(n)` (screen) uses it for Play, Next, Same size and Another,
  saves the progress and logs **"puzzle used"** (size, puzzle, of, round,
  next); Try again is still `startGame(n, k)`. A win no longer moves the
  number on. "game started" logs `stock` too (the place in the 200).
- `stockAt(list, k)`: `list[k % list.length]`, as before, now named and
  tested; after the 200th the first again, the turn line counting on
  ("puzzle 201").
- `stockOrder(n, list)`: the kept puzzles in seed order, shuffled with
  `mulberry32(n*10000 + 1)`; the old first 50 (`SEEN_BEFORE`) shuffled
  last. **No progress reset**: a device keeps its puzzle number, and
  since every device played the old order from puzzle 1, any number up
  to 150 now brings a puzzle it hasn't had (assumes no device has played
  more than 50 of one size; the game has been out since 2026-10-13).
  A game kept in the same browser session over the update is dropped
  (its seed isn't at its number any more: "resume failed", logged), as
  for any changed stock.
- `tools/hidden-faces-puzzles.js` writes `stockOrder`'s order. **Full
  run: 298 s**; seeds tried 613, 590, 499, 550, 428 (2026-10-13: 606,
  594, 497, 553, 427; the workers overshoot a little differently each
  run, the kept set doesn't depend on it). **Checked against the old
  file** (a copy in Claude's scratchpad): every size the same 200
  puzzles; none of the old first 50 among the new first 150; 0-1 per
  size in its old place; the new puzzle 1 was the old 142, 174, 168, 86,
  181 (6x6 to 10x10).

**Tests** (288 pass, 285 before): progress, each start takes the next
puzzle, the 200th then the first, the third time round; the stock
order, the same twice, nothing lost or doubled, the old first 50 last,
shuffled (under 10 in place), sizes differ; the stock file in
`stockOrder`'s order (`hidden-faces-stock.test.js`, its remake check now
by seed); the screen: Play, Next, Same size, Another use `startNext`,
Try again `startGame(n, k)`, nothing else moves `prog.next`, four
`startGame(` calls. **Each shown to fail:** Another back to
`startGame(n, k + 1)`, `stockAt` without `%`, `stockOrder` a plain
shuffle: the three new tests failed, naming the check ("6 x 6: an old
first-50 puzzle before the last 50", "Try again / Another"). No local
server test (the developer's call); `node --check` on the screen file
and its 29 imports all found in the core.

## 2026-10-19: Release 1.2 published; status (start here next session)

Published with the developer's OK ("go ahead and build, and publish. No
need for a mockup or a local server test"), as **1.2**, the number
given in the proposal (a change, not a new game). `node tools/offline.js`:
"release 1.2, version 88b43a849f0b (2026-10-19), 82 files"; `npm test`
288 pass; `node tools/release.js`: "Release 1.2 is ready". `main`
fast-forwarded d7c27ee..7e3b519 and pushed; tag `v1.2` (annotated)
pushed; GitHub release "1.2" from `node tools/release.js notes`
(https://github.com/donpark2000/Web-Games/releases/tag/v1.2, not a
draft). The Pages build for 7e3b519 "built" at 16:47:08Z; the live site
then sent `RELEASE = '1.2'`, version 88b43a849f0b, and a
`data/hidden-faces.json` identical to the repo's (10x10 puzzle 1: seed
100349). No local servers were running (no node processes).

**Status:** release 1.2 live (`main` = 7e3b519, tag `v1.2`);
`star-battle` = `main` + the journal. **Next:** the developer plays on;
on the phone the version line should say 1.2 (the app fetches it in the
background, so maybe after one more open). Worth a look in `log.html`
then: "puzzle used" lines, the puzzle number going up on each start.
Open: Q24, Q27. **Proposed skill additions:** none (a derived file's
order changed in its tool and checked against the old file is §3's
"Derived files come from a tool" already).

## 2026-10-19: No Same size after a 10 x 10 win

The developer, after 1.2 ("Nive to see new games"): "When I get to
10x10 is there any difference between next and same size buttons?" None:
since 1.2 both are `startNext(10)` (before 1.2 both were
`startGame(10, prog.next[10])`, the same too). The developer: "leave the
next button and remove the same size button".

**Built:** `showEnd` passes no Same size after a 10 x 10 win; `ending`
hides `#sameBtn` and gives `#endTools` the class `two` (two columns,
Claude's choice: Next and New game each half the row, as ❓ Why? and ✓
Got it share theirs, rather than a gap on the right). Logged: **"end
buttons"** (size and the buttons shown) at every end. Every other end
keeps its three buttons.

**Tests** (289 pass): `ending` hides Same size and halves the row, gives
it no job without words, logs; the CSS rule; Try again / Another
unchanged. Shown to fail: without the `toggle('two', ...)` line, "Same
size not hidden, or the row not halved".

**Tried in the built-in browser** (local server, 375 x 812): a 10 x 10
made solved in the kept state (edited from log.html, since the game
keeps its own state as it unloads and overwrote an edit made on its own
page): "Next" 168 px and "New game" 168 px, Same size hidden, no
sideways scroll (375); Next started puzzle 2 ("puzzle used" 2, next 3);
Give up there, Just end it: Try again / Another / New game, the row of
three. Not Q27 evidence: one half-size screenshot showed a stray "·"
after "puzzle 1", the next showed the line whole (the turn line is only
"10×10 · puzzle N"); left as is. Local server stopped after.

## 2026-10-19: Release 1.3 published; status (start here next session)

Published with the developer's OK ("Yes, publish as 1.3."): no Same
size after a 10 x 10 win. `src/core/release.js` 1.3;
`node tools/offline.js`: "release 1.3, version 9a99095f131b
(2026-10-19), 82 files"; notes in `RELEASES.md`; `npm test` 289 pass;
`node tools/release.js`: "Release 1.3 is ready". `main` fast-forwarded
to b858d8b and pushed; tag `v1.3` (annotated) pushed; GitHub release
"1.3" from `node tools/release.js notes`
(https://github.com/donpark2000/Web-Games/releases/tag/v1.3, not a
draft). The Pages build for b858d8b "built" at 19:04:21Z; the live site
then sent `RELEASE = '1.3'`, version 9a99095f131b, and the CSS with
`#endTools.two`. No local servers running (Claude's preview server was
stopped after its check; no node processes).

**Status:** release 1.3 live (`main` = b858d8b, tag `v1.3`);
`star-battle` = `main` + the journal. Nothing in progress. **Next:** the
developer plays on the phone (version line 1.3). Open: Q24, Q27.
**Proposed skill additions:** none.

## 2026-10-19: A Sudoku with colours: which one?

**The idea** (developer, relayed by the session that started this one):
a new grown-ups' puzzle after Find the Stars ("a polished and
professional experience"). A Sudoku remembered as: the usual rules (each
row, column and 3 x 3 box holds 1-9 once) plus an overlay of colours
spanning rows and columns, not bound by the boxes, where each colour's
digits must also all be different.

**Claude: it's real, and probably one of three variants** (rules can be
copied, not other games' names or art):
1. **Killer Sudoku:** small cages (2-5 squares, dashed outline or a
   colour each) that cross box lines; no repeats in a cage, and **each
   cage shows its sum**. The developer didn't mention sums.
2. **Extra Regions** (sold as "Color Sudoku", "Jigsaw overlay"): **nine
   coloured shapes of 9 squares each**, wandering over rows, columns and
   boxes; each colour also holds 1-9 once. No numbers beyond the givens.
   Claude's best guess, as it matches "each colour must have unique
   digits" with nothing else added.
3. **Disjoint Groups** ("Color Sudoku" in some books): every square
   coloured by its place in its box (all top-left corners one colour,
   and so on), so each colour is 9 squares spread one per box, also 1-9
   once. The colours form a regular pattern, not shapes.

Recorded as **Q29** until the developer picks. Shown to the developer as
three small pictures side by side.

**What carries over from Find the Stars** (once the variant is known):
coloured regions with thick borders (`src/ui/hfboard.js`); a solver
using only steps a person can see, making puzzles ahead of time with one
answer each (`src/core/hidden-faces.js`, `tools/hidden-faces-puzzles.js`);
hints that take their own step, with the spotlight and ❓ Why?; Give
up's Show me how; progress kept on the device; the game-state keeping
of "Coming back to a game". **New:** entering digits on a phone (a 1-9
keypad, perhaps pencil marks) and a new set of solver steps (singles,
pairs, box/line, and the extra region's own interactions).

**Next:** the developer picks the variant (Q29); then a mockup, clicked
in the Claude desktop app viewer; the agreed choices go in DESIGN.md;
then build on a branch with debug output and tests. Publishing as
release 2.0 only with the developer's OK.

## 2026-10-19: Extra Regions chosen; Colour Sudoku mockup v1

**Developer:** "It's 2, Extra Regions: nine coloured shapes, each also
1-9 once." (Q29 resolved.)

**Puzzle maker** (scratchpad for now, `cs-core.js`; meant for
`src/core/` when built; free of DOM code). What was tried, in order:
1. *Colours wandered over a filled grid, starting from the rows*
   (swap two squares with the same digit between neighbouring colours,
   keeping both joined): almost no swap is legal from rows (taking a
   middle square splits a row), so the rows stayed rows.
2. *Shapes first, digits after:* shapes are easy (from the boxes,
   swapping squares freely: good spread in 0.2 s), but a grid that
   fits rows, columns, boxes and colours was found for none of 10
   layouts (20,000-300,000 tries each, 1.6-8 s). Likely most random
   layouts have no answer at all: four sets of rules on 81 squares.
3. *Grown around a filled grid* (each colour takes a neighbouring square
   whose digit it lacks): about 1 in 200 attempts completes (0.5 s per
   grid), but the colours stay box-like.
4. **What works:** grow as in 3, then anneal (simulated annealing) with
   same-digit swaps, a split colour allowed on the way but costed, aiming
   for a boundary of about 56 lines (boxes have 36, rows 72) and every
   colour over 2+ rows, columns and boxes with at most 7 in any one. The
   stricter aim (3+ of each, at most 5 in one) failed in 23 of 23 runs.
   A puzzle is then a solution with givens taken out one at a time
   while the step solver still finishes it, so it has one answer.
   **Measured:** 14 makes, 0.2-2.2 s each, 14-19 givens. Easy (only
   "the only place a digit can go" and "the only digit left"): 4 of 4.
   Harder (also "all inside": a unit's digit confined to another unit):
   10 of 10 needed it, 6 to 33 times.

A slip on the way: one loop (4 settings x 40 grids) ran past 2 minutes
with no output before a single run was timed, the case the skill's
"Time one run before looping over many" covers. No new lesson.

**Mockup v1:** [Colour Sudoku Mockup](https://claude.ai/artifact/D53EsTrxeFeaFpFKwzr7wF)
(private Claude artifact, version 1). Built from the site's `site.css`,
`game.css` and `hidden-faces.css` by a script in Claude's scratchpad;
the solver runs in the page for hints; 4 easy and 4 harder puzzles. A
mockup bar on top: "Fill all but 3" (to reach the end) and "A harder
one". Claude's choices, all open:
- **Name "Colour Sudoku"**; in 🧩 Puzzles for grown-ups (no home page
  in the mockup).
- **Setup:** the rules beside a solved puzzle; **How hard?** Easy /
  Harder; **Your notes:** Auto tidy (a digit placed comes out of the
  notes it rules out; default) / I'll do it; Play!.
- **Play:** 🏠 and "Easy · puzzle 1"; hearts, "63 to go", a clock; the
  board (colour fills, thick box lines, thin lines between squares);
  the hint bar (3 lines); **a row of digits 1-9** (a digit is greyed
  once all nine are placed); Undo, ✏️ Notes, 💡 Hint (3), 🏳 Give up.
- **Entering:** tap a square, then a digit. The square is ringed; every
  square with the same digit gets a white disc (and that digit in
  notes). ✏️ Notes on: digits toggle small notes instead. A wrong digit
  shows red, shakes and costs a heart (three ends it); it stays until
  replaced; **Undo** takes back notes and wrong digits (the heart comes
  back, the mistake counts), never a right digit (they're certain, as a
  found star). Digits typed on a keyboard work too.
- **Hints, as Find the Stars:** a red digit first (the hint takes it
  out); else the solver's next placement, with any "all inside" step it
  needs first (those squares dashed). It takes its step: the digit goes
  in, white with a black edge (like the hint ✕). Spotlight; the square
  ringed and named. **While a hint is lit, its words take the digits'
  row too** (so the bar can be 3 lines, the board never moves, and a
  harder hint's 4 lines fit). ❓ Why?: each other empty square of the
  unit labelled with what rules the digit out (row, col, box or the
  colour's name), the digits doing it ringed in red dots; for "the only
  digit left", the digits its row, column, box and colour have. ✓ Got
  it; the last hint stays greyed, "(tap to light it again)".
- **Give up:** Show me how / Just end it / No; Show me how walks the
  rest a step at a time ("Step 3 of 63"), with ❓ Why?, ⏩ The rest,
  Next ▸.
- **The end:** as Find the Stars (the big star and the result in the
  bar); Next / Try again / New game. Out of hearts or given up: the rest
  of the answer pale.
- No sound, nothing kept on the device, no debug log (a mockup).

**Checked** (scratchpad served on localhost 8130 through the repo's
`tools/serve.js` `createServer`, built-in browser at 393 x 760; a
temporary `.claude/launch.json` entry, removed after): the board fits
with 34 px squares, no page scrolling; an easy hint ("The ringed square
(row 2, column 2) is the only place for 8 in the top-left box...") and
its Why? (labels and the 8s ringed); a harder hint with "all inside"
(dashed squares in Orange) fits the bar with the digits' row, the board
not moving (its top at 180 px before and after); notes 1, 4, 5 on a
square; a wrong digit took a heart and Undo gave it back; Show me how
reached step 3; "Fill all but 3" then the right digits gave "Solved".
**Found and fixed while checking:** "a 8"; the 4-line hint bar left
32 px squares and a harder hint still overflowed it (now 3 lines plus
the digits' row while lit); the dashed squares weren't lit; the clock
kept the last game's time; same-digit discs stayed on after a win.

**Open questions:** none yet; the mockup choices above are for the
developer.

## 2026-10-19: Colour Sudoku mockup v2: notes, a notes row, same digits

**Developer** (after v1): "Good start." The notes are "quite small and
light", could be bolder and/or bigger; "We have enough room for a row of
both 'notes' digits and 'solid' digits, so we don't need the button to
toggle"; the white disc behind digits the same as the selected one is
"almost the same diameter [as] the cell height, possibly obscuring the
color. So a slightly smaller circle would be better. Or no circle - just
a number. Thoughts?"

**v2** ([Colour Sudoku Mockup](https://claude.ai/artifact/D53EsTrxeFeaFpFKwzr7wF),
version 2):
- **Notes:** 33% of a square (was 26%), the heaviest weight, the page's
  ink (was 80% ink, a lighter weight): 11.5 px on a 35 px square (was
  9 px).
- **Two rows of digits:** big digits, and under them a row of smaller
  dashed buttons, the digit in a corner like a note, which write notes.
  ✏️ Notes is gone; the tools are Undo, Hint, Give up. Shift+digit on a
  keyboard writes a note. A lit hint's words take both rows' place.
- **Same digits, three to compare** (the mockup bar): **A** a disc 66%
  of the square (23 px of 35; v1's was about the square's height), **B**
  a ring only, so the square's colour shows inside it, **C** no mark.
  The same mark on matching notes. Claude's view: B keeps the colour,
  which the puzzle needs, and still stands out; C leaves the same digits
  hard to pick out at a glance.
- **The mockup bar moved under the footer** (scroll down for it), so the
  screen above is the real fit: with it on top (two lines once it held
  the A/B/C buttons) the squares fell to 26 px.

**Checked** (built-in browser, 393 x 760, the same temporary server and
`.claude/launch.json` entry, removed after): 35 px squares with both
digit rows (v1 had 34 px with the bar on top and one row), no sideways
scroll (page 393 px wide); notes 11.55 px, weight 900; the disc 23 px;
notes 1 4 7 8 and 2 3 5 6 9 written from the notes row; a right digit
from the big row. The built-in browser's pane was too small for a sharp
screenshot, so how A, B and C look is for the developer to judge in the
viewer.

## 2026-10-19: Colour Sudoku mockup v3: the ring; notes bigger again

**Developer** (after v2): "The ring shows up better on light colors like
yellow." The two rows of digits "is good (I always found online games
that have the toggle feature annoying)". Not sure what "A harder one
(needs 'all inside')" meant. "I still find the notes hard to see."

**Decided:** same digits get **the ring** (B); **two rows of digits**,
no Notes toggle.

**"A harder one"** was a mockup-bar shortcut to a Harder puzzle, named
after the step only Harder puzzles need ("all inside": all the squares
where one unit's digit can go are inside another unit, so that other
unit has its digit there and nowhere else). Now "Play a Harder puzzle".

**v3** ([Colour Sudoku Mockup](https://claude.ai/artifact/D53EsTrxeFeaFpFKwzr7wF),
version 3):
- **Bigger squares:** hearts, "to go" and the clock moved beside the 🏠,
  under "Easy · puzzle 1", giving their row to the board: 38 px squares
  at 393 x 760 (v2 35 px; 39 px is the most the width allows).
- **Notes:** 37% of a square, nearly black (#10202C), heaviest weight:
  14 px on a 38 px square (v2 11.5 px, v1 9 px). The 3 x 3 places limit
  them: at 40% (15.2 px) the rows overflowed the square (each place is
  11.7 px). Two to compare in the mockup bar: **N1** as is, **N2** with
  a white edge round each note, to stand off darker colours.

**Checked** (built-in browser, 393 x 760, the temporary server again,
`.claude/launch.json` restored after): 38 px squares, the status row
273 px wide with nothing cut, the page 393 px wide; all nine notes on one
square stay inside it (the last place ends 36 px down a 38 px square).

## 2026-10-19: Mockup v3.1: rings only on notes that are there; DESIGN.md

**Developer** (after v3): "After adding a note and then moving on to
the next number, I see empty circles showing up in cells. ... It feels
confusing." **Cause:** with a square selected, every note place for its
digit got the ring, written or not (`render` in the mockup marked the
place, not the note). **Fixed:** only a note that is there is ringed.
**Checked** (built-in browser, the temporary server again,
`.claude/launch.json` restored after): with notes 2, 5 and 3 written and
a 7 selected, no empty place was ringed (0); after a note 7, one ring,
on it.

N1 or N2: "I think I need to see it on a phone. We can start with N2."
N2 is now first and the default.

**Puzzles not repeating** (developer: "for however many unique puzzles
we have, we should rotate through them so every time I start the game I
don't repeat the same puzzles"): Find the Stars' rule since Q28, for
each level. In DESIGN.md with the other decisions so far, under "Colour
Sudoku (being designed)".

**Mockup v3.1** = [Colour Sudoku Mockup](https://claude.ai/artifact/D53EsTrxeFeaFpFKwzr7wF)
version 4.

## 2026-10-19: Colour Sudoku: build next; status (start here next session)

**Developer:** "I can't try it on my phone until you build and publish
it. Right now it is all on my desktop." So the next step is the build,
as mockup v3.1 stands; N1 against N2 (and anything else) is judged on
the phone after it's published.

**Branch `star-battle`** = `main` (release 1.3) + journal and DESIGN.md
commits; no code changed this session. `npm test` not run (docs only).
No local servers running.

**The prototype** (Claude's scratchpad belongs to this session): copied
to the session notes folder
`C:\Users\dpark\AppData\Roaming\Claude\side-session-notes\local_aeff828a-3e04-405f-a08a-efa7ebc2a94b\colour-sudoku-prototype\`
(`cs-core.js`, `ui.js`, `template.html`, `build.js`, `gen.js`,
`puzzles.json`, a README). The same code is inside the published mockup
(https://claude.ai/artifact/D53EsTrxeFeaFpFKwzr7wF, version 4): read it
with the Artifact tool's `read` action.

**Plan** (standards: debug log, a test with each part, `npm test`), on a
new branch `colour-sudoku` from `star-battle`:
1. `src/core/colour-sudoku.js` from `cs-core.js`: the maker
   (`randomSolution`, `growRegions`, `makeRegions`, `generate`), the step
   solver (`nextStep`: hidden single, naked single, "all inside", pair),
   `hintFor`, `blockers`. Tests: each step kind on a known grid; a
   generated puzzle's colours joined, spread (`regionsOk`), holding 1-9;
   the solver reaching the stored answer; a puzzle missing too many
   givens not finished (one answer only); a broken stock entry caught.
2. `tools/colour-sudoku-puzzles.js` writing `data/colour-sudoku.json`:
   200 per level (Easy: singles only; Harder: needs "all inside" at
   least once), from fixed seeds, so the tool always makes the same
   file; one line per make and a per-make cap (time one make first:
   0.2-2.2 s each here). A test that the stock is valid. Played in a
   shuffled order per level (as Find the Stars' `stockOrder`), each
   counting as used as it starts, the next per level kept on the device
   (DESIGN.md "Colour Sudoku").
3. `colour-sudoku.html`, `css/colour-sudoku.css`, `src/ui/colour-sudoku.js`
   from the mockup (drop the mockup bar; keep N2 notes); logging into the
   site's debug log (taps, digits, notes, hints, ends, the fit); "Coming
   back to a game" (sessionStorage); best time per level; sounds from
   `src/ui/sounds.js`; the home page tile in 🧩 Puzzles for grown-ups;
   `node tools/offline.js`; stats.
4. Check at 393 x 760 and 320 px wide in the built-in browser; `npm
   test`; then ask to publish as **release 2.0** (a new game) with the
   release steps in CLAUDE.md.

**Open:** Q24, Q27 (unrelated). **Proposed skill additions:** none.

## 2026-10-19: Colour Sudoku built

Built on the branch `colour-sudoku` (from `star-battle`) by a session
started from the design session, following the plan in "Colour Sudoku:
build next".

**1. The core** (`src/core/colour-sudoku.js`, no DOM): the mockup's
`cs-core.js` as an ES module (Find the Stars' `mulberry32`, `colorsFor`,
`fadedColor` and `clock` reused), plus the game's rules moved out of the
mockup's screen code so they can be tested: `enter`, `toggleNote`,
`undo`, `findHint` (plain data, kept with the game), `useHint`,
`walkStep`, `fillRest`, `endGame`, snapshot/restore, progress per level.
**The port makes the same puzzles:** `generate` on seeds 100 (Easy), 200
and 201 (Harder) gave byte-identical colours, givens and answers to the
mockup's core, run side by side (0.36 s, 1.4 s, 1.8 s each).
**Fixed on the way** (mockup behaviour):
- A hint that took out a wrong digit left that digit's Undo step, so
  Undo afterwards gave the heart back for free. Now the hint drops it.
- Every redraw re-shook every red digit on the board; now only the one
  just entered shakes.
- The same wrong digit entered again on its square cost another heart;
  now it does nothing.

**2. The stock** (`tools/colour-sudoku-puzzles.js` ->
`data/colour-sudoku.json`, 71 KB). Timed one make first (above), then a
trial of 3 per level (8 s), then the whole: 55 s on 15 worker threads,
one line per make, a 60 s cap per make. Easy: seeds 100000-100199, every
one kept (13-20 givens). Harder: 200000-200211, 12 not kept (no step
needed "all inside"), 12-20 givens. Slowest make 7.1 s, median 0.76 s.
Shuffled once per level (`stockOrder`, seed firstSeed + 1).

**3. The page** (`colour-sudoku.html`, `css/colour-sudoku.css`,
`src/ui/colour-sudoku.js`, `src/ui/csboard.js`): the mockup's screens
without the mockup bar, N2 notes, the ring, the two digit rows; it loads
`css/hidden-faces.css` before its own sheet, as the mockup did (the
rules box, status, hint bar, tools and end are Find the Stars'). Hooked
into the debug log ("colour-sudoku": puzzle used, game started, digit,
wrong digit, note, undo, hint, why, give up, Show me how steps, ends,
fit, turn line fit, tools fit, resumed, clock paused), "Coming back to a
game" (`resumable('colour-sudoku', 1, ...)`), progress and best times
(`web-games-colour-sudoku`), sounds, stats (Next is `data-play`), the
home tile in 🧩 Puzzles for grown-ups (a puzzle under way, from
`DEMO` = stock Easy seed 100003), `GAME_PAGES`, and `node tools/offline.js`
(88 files). Taps on the board and digits use pointer events, and the
touch's end is cancelled there (Find the Stars' double-tap zoom fix).

**Tests:** `tests/colour-sudoku.test.js` (16: units; made puzzles' colours
joined and spread, answers fitting; every solver step right against the
answer, hidden/naked/inside all used; a hand-built pair; no given can go;
`problems` catching a changed given, a removed one, a colour of 10, a
short row, five neighbour swaps, a Harder that doesn't need "inside",
another answer; stock order; colours; the game: digits, tidy, notes,
Undo, losing, hints, Show me how to the answer, keeping; progress),
`tests/colour-sudoku-stock.test.js` (2: all 400 sound, order, seeds,
none twice; the first 2 per level remade, 1.2 s), and
`tests/colour-sudoku-page.test.js` (5: the decisions and the wiring, as
files). **Shown to fail:** three bugs put in the core one at a time
(Undo not giving the heart back; "all inside" ruling out its own squares;
a right digit keeping its Undo steps) each failed 1-3 tests; a given
taken out of a stock puzzle failed the stock test ("can't finish"); a
log line renamed and the N2 edge removed each failed the page test. Two
page-test failures on the first run were the test's own patterns
("Mockup v" matched the comments crediting the mockup; Undo logs
"undo: ..."), fixed in the test. `npm test`: 312 pass. **Clean room:**
the repo copied to the scratchpad, the suite run twice (312/312 both),
the file listing before and after identical (135 files), 25 s.

**Checked in the built-in browser** (`tools/serve.js` on 8123):
- **393 x 760:** 38 px squares (as mockup v3), the page exactly the
  screen (fit: page 755 of 760); setup as the mockup.
- **Play:** notes 1 and 7 written; a right 1 tidied the 1 out (Auto
  tidy); same digits ringed (2). A wrong 6 cost a heart and Undo gave it
  back. A given square then a digit: "That square is done...".
- **A hint:** "The ringed square (row 3, column 2) is the only place for
  6 in the top-left box...", 11 squares lit, the dock lit (178 px), the
  page still 760. Its Why?: 5 labels, 2 red-dot rings. Got it greyed the
  words; a tap lit it again.
- **Reload:** picked up the game with the hint lit, hearts and the clock
  (paused at 0:28 while hidden). Show me how: "Step 1 of 62", Why?, the
  board taking no taps, ⏩ The rest: "Shown step by step / 62 steps".
  Try again: the same puzzle at 0:00.
- **The ends:** every digit entered gave "Solved in 0:09! / 0 mistakes ·
  0 hints · New best!" with 6 sparkles, the best kept on the device;
  Next brought puzzle 2; three wrong digits gave "Out of hearts", the
  answer pale. No console errors.
- **Home:** the tile at 150 px with 44 digits shown; the kept game
  cleared.
- **320 px wide: found and fixed.** The column beside the 🏠 is 144 px
  there, and "Harder · puzzle 200" (187 px at 20 px) ran under the 🔊,
  as did the status (hearts, "64 to go", the clock). The fix,
  `fitInfo`, is the same idea as Find the Stars' `fitTools`: the line
  and status shrink in half pixels until nothing is cut, measured with
  the widest status the game will show ("Step 64 of 64" in Show me how).
  Now nothing is cut and the page is 320 px wide: 12.5 px words (status
  10.6 px) for "Harder · puzzle 200" at 320; at 393 they stay at
  19.5 px (16.5 px in Show me how). The ask, walk and end rows had
  nothing cut at 320. At 320 x 640 the squares stop at the 24 px floor
  and the page scrolls 3 px (6 px while a hint is lit: the hint's row of
  buttons is 3 px taller than the tools at the small font); a short
  screen scrolls, as Find the Stars' 10 x 10 does.

**Claude's choices** (in DESIGN.md "As built", all for the phone, Q30):
sounds (thud per right digit, ding for the last); Next / Try again /
New game at every end, as the mockup had; "0 to go" after a loss. A
slip: a shell heredoc misfired, so three registration edits ran twice.
The duplicate lines were caught by counting, the three files restored
from git (they were clean before) and the edits applied once, by a
script that refuses to run twice.

**Open questions:** Q30 (new). **Proposed skill additions:** none.

## 2026-10-19: Colour Sudoku: publish next; status (start here next session)

**Branch `colour-sudoku`** = `star-battle` + Colour Sudoku (core, stock,
page, tests, DESIGN.md, this journal), pushed. `npm test` 312 pass.
Release still 1.3 in `src/core/release.js`; nothing merged to `main`.

**Next:** the developer's OK to publish as **release 2.0** (a new game).
Then, by CLAUDE.md: set 2.0 in `src/core/release.js`, `node
tools/offline.js`, notes in `RELEASES.md`, `node tools/release.js` says
ready, merge to `main`, tag `v2.0`, push the tag, the GitHub release
with `node tools/release.js notes`; once live, stop the localhost
servers. Then the developer judges it on the phone (Q30).

**Open:** Q24, Q27 (unrelated), Q30. **Proposed skill additions:** none.

## 2026-10-19: Release 2.0 published; status (start here next session)

Published with the developer's OK ("Yes, publish Colour Sudoku as
release 2.0."): Colour Sudoku, a new game. `src/core/release.js` 2.0;
`node tools/offline.js`: "release 2.0, version cfd968c6a9f1
(2026-10-19), 88 files"; notes in `RELEASES.md`; `npm test` 312 pass;
`node tools/release.js`: "Release 2.0 is ready". `main` fast-forwarded
b858d8b..6be4477 (`colour-sudoku` = `star-battle` + the game + the
release commit) and pushed; tag `v2.0` (annotated) pushed; GitHub
release "2.0" from `node tools/release.js notes`
(https://github.com/donpark2000/Web-Games/releases/tag/v2.0). The Pages
build for 6be4477 "built" at 22:36:04Z; the live site then sent
`RELEASE = '2.0'`, version cfd968c6a9f1, `colour-sudoku.html` (200),
the home page with the tile, and a `data/colour-sudoku.json` identical
to the committed one (a first compare against the working copy differed
only by its Windows line endings). No local servers running (no node
processes).

**Status:** release 2.0 live (`main` = 6be4477, tag `v2.0`);
`colour-sudoku` = `main` + this entry. **Next:** the developer plays
Colour Sudoku on the phone (version line 2.0; the app fetches it in the
background, so maybe after one more open) and judges Q30: N2 notes
against N1, and Claude's choices in DESIGN.md "As built". Open: Q24,
Q27, Q30. **Proposed skill additions:** none.

## 2026-10-19: Colour Sudoku on the phone: the selected square's ring

**Developer, after 2.0 on the phone (Q30):** "Once a note is made in a
cell its visibility is good when the cell is not selected. But when a
cell is selected that extra black and white outline around the selected
cell obscures the note."

**Seen in the built-in browser** (393 x 760, 38 px squares): with notes
1-9 in a square, selecting it put the band (3 px ink, then 2 px white,
1 px in from the edge, drawn over the notes) across the eight outer
notes; only the 5 stayed clear.

**Four shown** (an inline mockup in the chat, squares in five colours at
38 px and twice that, tap to move the selection): now; A, the same band
under the notes; B, a 2.5 px dark edge only, notes on top; C, a ring
outside the square, over the lines round it. **Developer: "I like C."**

**Built:** `.sq.sel::after` at `inset: -3px` (3 px ink, a 1.5 px white
edge outside it) in `css/colour-sudoku.css`. Checked at 393 x 760 and
320 x 640: every note of the selected square shows, at the board's edge
too (the frame takes that side of the ring); the notes of the squares
beside it stay readable; a given 7 selected rings its square and the
other 7s as before. **Test:** `tests/colour-sudoku-page.test.js`, "the
selected square ringed outside it"; shown to fail on the old rule ("the
ring is not outside the square"). `node tools/offline.js`: version
951b39d94338. `npm test` 313 pass.

Seen on the way, not followed up: right after the browser's viewport
went from 393 to 320 wide, a screenshot showed two hearts and a smaller
board, fine after a reload. Probably the screenshot came before the
refit; worth a look if it shows on a phone turned on its side.

**Next, also from the developer:** "when selecting game play as easy or
harder, the meaning of the descriptions or impact is not clear to me."

## 2026-10-19: Colour Sudoku: How hard? in plainer words; Q31

**Developer:** "when selecting game play as easy or harder, the meaning
of the descriptions or impact is not clear to me." The words were
solver terms: Easy "each step: the only place a digit can go", Harder
"some steps need two units at once".

**Explained in the chat:** the levels differ only in the steps a puzzle
needs. Easy: every digit can be found from one row, column, box or
colour (the only square left there for a digit, or the only digit left
for a square). Harder: at least once, an "all inside" step first (e.g.
the yellow shape's 4 can only be on squares all in one box, so no other
square of that box is a 4). **Proposed and agreed** ("This wording is
more understandable"): Easy "each digit can be found from one row,
column, box or colour"; Harder "some digits need two of those looked at
together".

**The developer asked** whether the level isn't mostly how many digits
start filled in, as in other Sudoku games. Claude: many apps do that,
but it's a rough measure (some of the hardest known Sudokus start with
21-25 digits; plenty with 17 fall to the simplest steps), and ours
barely differ in it. Counted from `data/colour-sudoku.json`: Easy
13-20 starting digits (median 17, mean 16.8), Harder 12-20 (median 16,
mean 15.5); a typical easy Sudoku elsewhere starts with 36-40. Offered:
Easy also starting with about 30 (digits from the answer only make a
puzzle easier, one answer kept). **Developer:** "Maybe just change the
words for now. I'll play it a bit and see if it feels too hard and we
need to add the other concept." Kept as Q31.

**Built:** the two `<small>` lines in `colour-sudoku.html`; DESIGN.md
"As built". At 320 x 640 each fits its button in 4 lines (Auto tidy's
3), nothing cut. **Test:** `tests/colour-sudoku-page.test.js`, "the
levels say what they ask of you" (the exact words).

## 2026-10-19: Release 2.1 published; status (start here next session)

Published with the developer's OK ("Yes, publish as 2.1."): Colour
Sudoku's selected square ringed outside it, and the plainer How hard?
words. `src/core/release.js` 2.1; `node tools/offline.js`: "release 2.1,
version bc4971605fea (2026-10-19), 88 files"; notes in `RELEASES.md`;
`npm test` 314 pass; `node tools/release.js`: "Release 2.1 is ready".
`main` fast-forwarded 6be4477..fa50e98 and pushed; tag `v2.1`
(annotated) pushed; GitHub release "2.1" from `node tools/release.js
notes` (https://github.com/donpark2000/Web-Games/releases/tag/v2.1).
The Pages build for fa50e98 "built" at 23:10:23Z; the live site then
sent `RELEASE = '2.1'`, version bc4971605fea, the CSS with the ring
(`inset: -3px`) and the page with the new Harder words. Claude's
preview server (`tools/serve.js` on 8123) stopped; no node processes
left.

**Status:** release 2.1 live (`main` = fa50e98, tag `v2.1`);
`colour-sudoku` = `main` + this entry. **Next:** the developer plays
Colour Sudoku on the phone: the rest of Q30 (N2 notes against N1,
Claude's choices in DESIGN.md "As built") and Q31 (does Easy feel too
hard; if so, start it with about 30 digits). Open: Q24, Q27, Q30, Q31.
**Proposed skill additions:** none.

## 2026-10-19: 2.1 on the phone

**Developer:** "Looking good on the phone. I will play it a while before
making more changes." On the build: "You did a good job of carrying
forward the design lessons from 'find the stars' when it comes to hints
and quitting." Q30 and Q31 stay open until then. Next changes start in a
fresh session.

## 2026-10-21: A physics-and-logic puzzle; Mirror Light mockup v1

**The idea** (developer): "Physics Sudoku". Each puzzle has a goal
("make the ball land in the red cup"), a set of parts (ramp, spring,
magnet, fan, weight, pulley), each usable a limited number of times, and
one logical answer. "Most physics games are trial-and-error. Most logic
games have no physics." Just a concept so far, open to better ideas.

**Claude:** real physics (smooth motion, bounces) and "one logical
answer" don't mix: a pixel or a rounding difference changes where the
ball lands, so it turns into trial and error, can differ from phone to
tablet, and no solver can prove an answer is the only one. The fix is
"physics on a grid": square by square, each part a fixed rule. Three ways
offered: **A** a ball run (closest to the idea; ThinkFun's *Gravity
Maze* is this kind of puzzle), **B** hidden parts found from where
dropped balls come out, **C** light and mirrors (the simplest to make
fully logical). Advice: start with three parts, not six.

**Developer:** A and C sound interesting; "more for me than kids I
think, but until I see how hard they are I am not sure. If C is
simplest, maybe we should start with that. Even if it is simple, it
could possibly provide some useful learnings or ideas for harder games."
So: C first, on the branch `light-puzzle` (from `colour-sudoku`, i.e.
`main` + journal).

**Rules (Claude's, for the mockup):** a square grid; a lamp on the edge
facing in; walls; gems (💎). Mirrors (double-sided, `/` or `\`) turn the
light a quarter turn; a splitter lets it through and turns a copy. Walls,
gems, the lamp and the board's edge stop it. Solved: every gem lit,
every tray piece placed, and the light touches each one. That last rule
is what makes one answer possible: without it a spare piece could go on
any dark square.

**Puzzle maker** (scratchpad `lp-core.js`, no DOM, meant for
`src/core/`): a lamp on a random edge square, a few random walls, the
pieces dropped one at a time on random squares the light crosses, a gem
where each beam ends inside the board. Then a solver counts answers: the
pieces only matter where the light goes, so it follows the light and, at
each empty square reached for the first time, tries "empty" and each
piece left, both ways round. While there's a second answer, a wall goes
on a square that answer's light crosses and the real one's doesn't. A
seeded random source, so a puzzle can be made again from its number.
**Measured** (2000 seeds each, one timed first): 5×5 with 3 mirrors and
2 walls, 134 made in 94 ms in all; 6×6 with 3 mirrors and a splitter,
108 in 1.2 s; 7×7 with 4 mirrors and a splitter, 56 in 3.8 s. Most
seeds fail at once (the light too short, a gem in the way of another
beam, too few gems); 3-7% end with a second answer on the same squares.
Searched choices per puzzle: 15-147 for 5×5, 328-5,770 for 6×6 with a
splitter. **Not yet known:** whether a person can reason these out step
by step or ends up guessing. The solver measures search size, not
reasoning; Colour Sudoku's levels came from a solver that uses only the
steps a person would.

Two puzzles checked by hand (seed 14, 5×5: the light turns at three
mirrors into the corner gem; seed 13, 6×6: the splitter sends one beam
to each gem).

**Mockup v1:** [Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN)
(private Claude artifact, version 1), built from the site's `site.css`,
`game.css` and `hidden-faces.css` plus its own sheet by a script in
Claude's scratchpad; 8 Easy (5×5, 3 mirrors, 1 gem) and 8 Harder (6×6,
3 mirrors and a splitter, 2 gems). Claude's choices, all open:
- **Name "Mirror Light"**, in 🧩 Puzzles for grown-ups (no home page in
  the mockup).
- **Setup:** the rules beside a solved puzzle with its light; the
  pieces explained; **How hard?** Easy / Harder; Play!.
- **Play:** 🏠, "Easy · puzzle 1", hearts, "1 of 3 placed", a clock. A
  night-dark board so the light shows, everything round it the site's
  look. Under it the tray ("2 left" per piece; tap one to choose it).
  **Tap a square** to put the chosen piece there, again to turn it, once
  more to take it off.
- **The light** (to compare, in the mockup bar under the footer):
  **Only on ▶ Shine**: the light runs out from the lamp square by
  square; a miss costs a ❤️ (three and it's over) and stays lit, the
  unlit gems and untouched pieces ringed in red, until a piece moves.
  **Always on**: the light follows every change, no hearts or Shine;
  solved as soon as it's right. Claude's view: always-on is
  trial-and-error, the thing the idea wanted to avoid; Shine keeps it a
  puzzle, as Find the Stars' looks do.
- **Hint (3):** a wrong piece first (taken off, or turned if only its
  way round is wrong); else the next piece along the answer's light,
  put down with a white edge and fixed. No ❓ Why? yet: that needs a
  solver that reasons like a person.
- **Give up:** "Show the answer" / No: the answer and its light. **The
  end:** the big star and the result in the bar; Next / Try again / New
  game.
- No sound, nothing kept on the device, no debug log (a mockup).

**Checked** (scratchpad served on localhost 8130 through the repo's
`tools/serve.js` `createServer`, built-in browser; a temporary
`.claude/launch.json` entry, removed after): at 393 × 760, 71 px squares
for 5×5, no page scrolling or sideways scroll; three mirrors placed with
the last one the wrong way, ▶ Shine: "Not yet: 1 💎 not lit", ❤️ 3 → 2,
the gem ringed; Hint turned that mirror ("in the right place but faces
the wrong way"); ▶ Shine: "Solved! · 1 ❤️ lost · 2 hints". Harder with
the light always on: the light followed the first piece, no Shine
button. Give up showed the answer, which `check` passes. At 320 × 640:
52 px squares for 5×5, the footer on screen; a Harder win with "Place
all but one piece" and the last piece by hand. No console errors.
**Found and fixed while checking:** the light drawn 6/5 too big (its
size used the board's `--n` from a sibling element, falling back to
Find the Stars' 6); darker blobs where the glow's segments overlapped
(now one see-through group); the local copy had no viewport line (the
viewer adds one on publishing), so it first showed at desktop width; at
320 px the hearts wrapped to three lines and the tray's words to two.

**Open questions:** none yet; the mockup choices above are for the
developer, the first being Shine or Always on.

## 2026-10-21: Mockup v1 played: Easy too easy

**Developer:** "Its pretty good. I find easy too easy. Adding the
splitter makes it more interesting. Do all games have 3 mirrors and one
splitter or does it change?" **Claude:** in v1 each level is one fixed
mix: all 8 Easy are 5×5, 3 mirrors, 1 gem (4-6 walls); all 8 Harder are
6×6, 3 mirrors and a splitter, 2 gems (5-13 walls). The maker takes any
size and mix, so the levels can change.

## 2026-10-21: Mirror Light mockup v2: a green splitter, Shine only, harder levels

**Developer** (after v1): "I did not play with the light always on. I'm
not sure that is a good option." And: "it is a bit hard to see the
difference between a mirror and a splitter and I expect it is even
harder on a phone. Maybe keep them both bright but make one white and
the other a different color (light blue or green)." **Claude:** green
rather than light blue, which is close to the lit gems' pale cyan; and a
second cue besides colour, dark stripes across the splitter ("glass the
light gets through"), for anyone who finds the colours hard to tell
apart or a dim screen. **Developer:** "Yes: build v2 with the white
mirror, the green striped splitter (and a plain green to compare), Shine
only, and the new levels."

**v2** ([Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN),
version 2):
- **Pieces:** the same bar for both (a dark edge, then the colour). The
  mirror solid white (was a pale grey-white); the splitter solid green
  (#4BE07F), with dark stripes across it (a dashed dark line over the
  green, dark 4 to green 8 of the 100-unit square). The mockup bar now
  compares **Green, striped** and **Plain green**.
- **Shine only:** the "Always on" light is gone (code and bar button).
- **Levels**, each puzzle in turn from one of two mixes:
  **Easy** 6×6, 3 or 4 mirrors and a splitter, 2 gems (v1's Harder);
  **Harder** 7×7, 3 or 4 mirrors and 2 splitters, 3 gems.
  The rules picture is now Easy puzzle 1, so it shows a splitter.

**Measured** (2000 seeds each, one timed first): 7×7 with 4 mirrors and
2 splitters, 3+ gems: 19 made in 34 s, the slowest seed 2.6 s, searched
choices 4,027-243,225 (median 47,782); 6×6 with 4 mirrors and a
splitter: 40 in 1.5 s. Picking the mockup's 8 + 8 took 0.4 s (Easy) and
13.5 s (Harder). Fine made ahead of time, as Find the Stars' and Colour
Sudoku's puzzles are; too slow to make while a player waits.

**Checked** (the same temporary server and `.claude/launch.json` entry,
removed after): the two pieces drawn 160 px wide side by side, white
against green with stripes, clearly different; an Easy 6×6 solved
("Solved! · no ❤️ lost · no hints"); a Harder 7×7 with one piece wrong:
"Not yet: 1 💎 not lit, and 1 piece the light didn't touch", ❤️ 3 → 2;
Plain green hid both splitters' stripes and Green, striped brought them
back. At 320 × 640, 37 px squares for 7×7, the footer on screen, no
sideways scroll. No console errors from the page (one 404 was the
preview opening the server's root, which has no page). The built-in
browser's pane was too small for a sharp phone-sized screenshot, so how
the pieces look at phone size is for the developer to judge.

**Open questions:** none yet; the striped or plain splitter, and
whether the new levels are hard enough, are for the developer.

## 2026-10-21: Mockup v2 played: striped splitter; Harder still easy

**Developer:** "I like the new dashed green splitter and the animation
is good. Even hard mode seems fairly easy. I'm not sure what would make
it more challenging. Other types of devices besides splitters and
mirrors? Maybe a second light? Or maybe 2 types of lights - that blow
each other up if they shine on each other?" So: the striped green
splitter stays (plain dropped); the light's square-by-square run stays.

**Claude, on why it's easy:** each gem can only be reached along a few
lines, so working back from the gems finds the pieces with little
doubt, and every rule says what must happen, none what mustn't. More
pieces or a bigger board make more of the same. What adds reasoning is
rules that pull against each other: two coloured lamps sharing the
mirrors (the developer's idea), gems of a colour, a lamp broken by the
other colour's light, and squares that must stay dark.

**Developer, on Claude's list:** "Or if there was more than one kind of
light, maybe there are also different kinds of splitters?" Squares that
must stay dark: "I don't think so - it might actually make it easier."
A purple gem lit by both: "Love it." Filters and prisms: "sounds good
but lets hold that idea for a future iteration." More pieces or a bigger
board: "probably a good idea. Maybe board size becomes a parameter to
pick before starting a game." **Claude:** a colour mirror (reflects its
own colour, lets the other straight through, as real dichroic mirrors
do) is the natural second splitter; suggested for the step after two
lamps, so each new rule's effect on difficulty can be seen alone. Size
as a setup choice, as Find the Stars has, with lamps (one or two) as
the other choice in place of Easy / Harder.

**Developer, more:** "Maybe the lamps are not occupying cells on the
board - maybe they are beside the board. Whether we have different
colors of lamps or several of the same or a mix) you could probably
have a max of one per side (implying a max of 4 lamps). I suppose you
could also make lamp placement an option of gameplay too." **Claude:**
beside the board, yes: every square is usable, and light leaving the
board where a lamp stands hits it, which fits the "lamp breaks" rule.
One simple rule for all mixes: no light may shine into a lamp, its own
colour or not. One lamp per side, up to 4. Placing the lamps as part of
play: a good later level (the lamps go in the tray; the solver tries
each spot on the edge), not in v3, one new rule at a time.

**Developer, one more idea before v3:** "The inner edge of the board is
all mirrors EXCEPT for where you position a light." **Claude:** the
light only runs along rows and columns, so it always meets an edge
mirror head-on and goes straight back the way it came, through the same
mirrors and splitters, to its own lamp (reflection runs both ways).
Mirrored edges therefore mean "the light must never reach the edge",
with the lamp breaking if it does: a strong "mustn't" rule, and a good
animation. Its effect on difficulty is unclear, as with the dark
squares the developer turned down: it rules things out (which can make
it easier) but also lets the maker use fewer walls (which can make it
harder). Cheap to try: a switch in the v3 mockup bar, Edges open /
mirrored, each with its own puzzles.

## 2026-10-21: Mirror Light: v3 next; status (start here next session)

**Developer:** "I'll start a new session. In that we can start with
building V3 with the edges switch."

**Where it stands:** branch `light-puzzle` (from `colour-sudoku`, i.e.
`main` + journal; nothing of the game in `src/` yet). Release 2.1 live,
`main` = fa50e98. Mockup v2 is the latest:
[Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN)
(private, version 2).

**The mockup's source** was in this session's scratchpad, which the
next session can't see. The whole of it is inside the published page:
read the artifact (Artifact tool, `action: "read"`) and take the inlined
`<style>` (the site's `site.css`, `game.css`, `hidden-faces.css`, then
the mockup's own rules after `/* Mirror Light (mockup v2)`) and
`<script>` (`window.PUZZLES`, then the core: `boardOf`, `trace`,
`check`, `solve`, `rng`, `make`; then the page code). Rebuild from those
as scratchpad files again (core, page code, CSS, a page template and a
build script that inlines them, a puzzle-picking script). To check it
locally: serve the scratchpad through the repo's `tools/serve.js`
`createServer` on 8130 from a small script, with a temporary
`.claude/launch.json` entry whose `runtimeArgs` give that script's full
path (a `cwd` outside the repo is refused), removed after; and a local
copy with a viewport line, which the viewer adds only when publishing.

**Agreed so far** (all from the entries since "A physics-and-logic
puzzle"):
- Light on a grid: mirrors (white, `/` or `\`, both sides) turn it; the
  splitter (green, dark stripes) lets it through and turns a copy;
  walls, gems, lamps and the edge stop it. Solved: every gem lit, every
  piece used, the light touching each. Tap a square to place, again to
  turn, again to take off.
- ▶ Shine only (no "always on"): the light runs out square by square; a
  miss costs a ❤️ (3), the misses ringed in red. Hints (3), Give up
  (Show the answer), the end as Find the Stars.
- v2's Harder (7×7, 2 splitters, 3 gems) is "fairly easy" for the
  developer; Easy (6×6) easier still.

**v3 to build** (a mockup update, same artifact):
- **Lamps beside the board**, not on a square; at most one per side
  (up to 4). Light leaving the board where a lamp stands hits it.
- **No light may shine into a lamp** (any colour): the lamp breaks (a
  small burst) and the puzzle fails. (Claude's proposal; the developer
  was offered "only the other colour breaks it" and picked neither
  explicitly, then said start v3: confirm on the way.)
- **Setup:** **Size** 6×6 / 7×7 / 8×8 (small grid pictures, as Find the
  Stars' size buttons; pieces grow with the board) and **Lamps** One /
  Two, in place of Easy / Harder.
- **Two lamps:** red and blue; red, blue and **purple** gems (purple
  needs both colours; a red or blue gem must be lit by its own colour
  and not the other). The two lights share the tray and pass through
  each other where they cross.
- **Edges switch** in the mockup bar: **open** (as now) / **mirrored**.
  Mirrored: the light meets the edge head-on and goes straight back
  along its path to its own lamp, so in effect "the light must never
  reach the edge". Puzzles made for each setting.
- **Time one make first** for 8×8 with two lamps (and mirrored edges)
  before any batch; if too slow, 8×8 may start with one lamp.
- The plain-green splitter switch goes (the striped one was chosen).

**Later, in order:** colour mirrors (reflect their own colour, let the
other through), one new rule at a time to see its effect; lamps the
player places (in the tray; the solver tries each edge spot); filters
and prisms. Turned down: squares that must stay dark (might make it
easier).

**Not yet known:** how hard a puzzle is for a person. The solver counts
its search, not reasoning; a solver that reasons like a person (as
Colour Sudoku's) could later sort puzzles into levels. Then the agreed
choices go in DESIGN.md, and the build (src/core, tests, debug log).

**Open questions:** Q24, Q27, Q30, Q31 (unchanged). **Proposed skill
additions:** none.

## 2026-10-21: Mirror Light mockup v3: lamps beside the board, two colours, mirrored edges

**Developer:** "Any colour breaks a lamp. Go ahead and build v3." (the
choice left open in the status entry: light of either colour shining
into either lamp breaks it).

**Rebuilt from v2's published page**, as the status entry described, as
scratchpad files again (`ml/`): `lp-core.js` (no DOM), `lp-page.js`,
`lp.css`, `body.html`, `build.js` (inlines the repo's `site.css`,
`game.css`, `hidden-faces.css` and the mockup's own), and scripts to
make, time and pick puzzles.

**The core, v3:**
- A lamp is `{side, k, c}`: beside the board on side 0-3 at row or
  column k, colour c. Its light starts at the board's edge. Light
  leaving the board where a lamp stands hits that lamp (`hits`).
- Mirrored edges: `trace` follows the light back from the edge (end
  `bounce`), for the picture. The light only runs along rows and
  columns, so it meets the edge head-on, and each step can be run
  backwards (a mirror's turn both ways; a splitter's straight-on copy
  goes back along the way in). So bounced light always gets back to its
  own lamp. The solver uses that and stops a branch at the edge at once.
- Colours are bits (red 1, blue 2); a gem is the bits it wants (3:
  purple). Solved: each gem got exactly its bits, no lamp hit, every
  piece used and touched. The solver also stops a branch when a gem gets
  a colour it doesn't want.
- Checked (`check-core.js`, 57 checks): hand-made boards (straight in,
  turned off an open edge, two lamps lighting each other, a bounce into
  its own lamp, a purple gem from both, a red gem lit by both); made
  puzzles of five setups, each answer checking and the solver finding
  only it.

**Making puzzles was the slow part.**
- The first loop over 8×8 with two lamps printed nothing for over 100 s:
  one seed's search had no cap (the skill's "cap each run"). Added a
  search budget.
- The solver copied its state at every choice. It now keeps one state
  and undoes each branch's changes. Compared with the old one on 600
  searches of random boards of every setup: the same answers and the
  same number of choices; 166 ms against 1006 ms. Broken once on
  purpose (a splitter one way round never tried): 280 of 600 differed.
- One minute on one core each, search capped at 500,000 choices; pieces
  4 mirrors with 1 splitter at 6×6, 2 splitters at 7×7 and 8×8:

  | Puzzles made in 1 min | 1 lamp, open | 1 lamp, mirrored | 2 lamps, open | 2 lamps, mirrored |
  |---|---|---|---|---|
  | 6×6 | 2920 | 3624 | 157 | 414 |
  | 7×7 | 44 | 86 | 1 | 7 |
  | 8×8 (4 mirrors) | 9 | 20 | 0 | 1 |
  | 8×8 (5 mirrors) | 2 | 2 | 0 | 0 |

  Most seeds fail at once (too few gems, a gem in another beam's way);
  the time goes on searches that end over the cap.
- Then 12 minutes on all 16 cores (cap 2,000,000 choices; 8×8 with 5
  mirrors). 8×8 with two lamps, 3 cores each: **2 puzzles (open edges)
  and 5 (mirrored)**. So, as agreed beforehand: **8×8 is one lamp only
  for now**; in the mockup, Two is greyed for 8×8 ("not for 8×8 yet").

**Mirrored edges, measured.** The maker builds every puzzle with open
edges and puts a gem where each beam ends, including just inside the
edge; with mirrored edges only the uniqueness check differs.
- The hope (last entry) that mirrored edges let the maker use fewer
  walls: **not seen.** On the 384 seeds that made a puzzle both ways,
  the mirrored one was the same board, walls and all, every time.
- Of 450 mirrored puzzles, **2** would have had a second answer with open
  edges. With a gem at every beam end, the answer's light never reaches
  the edge anyway, so the mirror only rules out wrong tries: it can only
  make a puzzle easier. (The extra mirrored puzzles in the table are
  seeds whose open search ran over the cap.)
- So mirrored puzzles are now made differently: gems at only half the
  beam ends (the other beams just stop at a wall) and no beam may end at
  the edge, so "never reach the edge" does the work the missing gems
  did. 6×6, one lamp, 30 s each: a gem at every end, 31 of 2092 need the
  mirrored edges (2.0 gems, 9.5 walls on average); half the ends, 93 of
  93 (1.0 gem, 11.5 walls). Rarer to make (93 against 2092).
- Remade the mirrored sets this way (5 minutes on 15 cores, then 3 more
  for 7×7 and 8×8 one lamp). With 3-4 starting walls, 7×7 one lamp and
  8×8 made none: almost every seed had a beam reaching the edge. 7×7 one
  lamp needed 12 starting walls (16 in 30 s); 8×8 with 5 mirrors made
  none even with 14 walls, with **4 mirrors** and 14 walls 6 in 25 s.
  Made: 6×6 40 (one lamp) and 120 (two), 7×7 63 and 15, 8×8 80. Picked:
  every mirrored puzzle needs the mirrored edges except one of 7×7 two
  lamps (7 of its 15 do).
- What the mirrored puzzles look like now: one gem (6×6) or two (7×7,
  8×8 one lamp) where open puzzles have two or three; more walls (7×7
  one lamp 14-22, open 7-14; 8×8 15-25, open 13-15); and much smaller
  searches by the solver's count (median choices 6×6 259 against 1379,
  7×7 1374 against 31281, 8×8 1175 against 83269): the edge rule cuts
  off most tries. Whether that makes them easier or harder for a person
  is for the developer to play.

**Picking the two-lamp puzzles.** The first picks for 6×6 had only
purple gems: the two lights met at a splitter on their crossing and went
everywhere together. And one 8×8 had a lamp shining straight into a gem
with no piece. Now first: both lamps use pieces; then purple gems with
red or blue ones too; then the most pieces both lights touch. Mirrored
sets take the puzzles that need the mirrored edges first, and leave out
the seeds their open set picked (the same seed makes the same board).

**Mockup v3** ([Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN),
version 3):
- **Setup:** the rules beside a solved 6×6 (lamp beside it); "Light
  must never shine into a lamp: it breaks"; the pieces, and a line on
  red, blue and purple gems; **Size** 6×6 / 7×7 / 8×8 (grid pictures);
  **Lamps** One (yellow) / Two (red and blue).
- **Play:** the lamps in a rim .7 of a square wide round the board,
  facing in. One lamp: yellow light and pale blue gems, as v2. Two:
  red and blue light, red, blue and purple gems, dim until lit, so the
  colour a gem wants shows from the start; where both colours share a
  line they run side by side.
- **A lamp the light shines into:** a small burst of sparks, then dark
  and cracked until a piece moves. It counts as a miss: a ❤️ and the
  red rings, like any other (Claude's choice; "the puzzle fails" could
  also mean the game ends).
- **Mirrored edges:** a silver edge round the board with a gap at each
  lamp; light reaching it comes back along its way into its lamp.
- **The mockup bar:** edges Open / Mirrored (puzzles made for each; a
  game under way starts again with the other set); purple gem plain or
  half red, half blue (a second cue besides colour); "Place all but one
  piece".
- 8 puzzles per setup except 8×8 two lamps (not offered).

**Checked** (scratchpad served on localhost through the repo's
`tools/serve.js` `createServer`, built-in browser; a temporary
`.claude/launch.json` entry, removed after; port 8131, as 8130 was
held by another Claude session's server, process 7152,
`serve-scratch.mjs`, which also added its own entry to the uncommitted
`.claude/launch.json` while this session ran; both left alone): at
393 × 760, 7×7 two lamps, one
mirror turned: "Not yet: 1 💎 not lit. That cost a ❤️", the gem ringed,
2 ❤️ left; 6×6 two lamps mirrored, one mirror turned: both beams
bounced off the top edge and broke both lamps (cracked, grey), the
message "light broke both lamps, 1 💎 not lit, 1 piece the light didn't
touch"; taps place, turn, take off, a wall shakes; Hint takes off a
wrong piece, then places the next; Shine with pieces left asks for
them; Give up shows the answer, which `check` passes; the edges switch
mid-game starts the open set. At 320 × 640, 8×8 two lamps (before 8×8
was one lamp only): 27 px squares, the footer on screen, no sideways
scroll, "Solved!". No console errors.
**Found and fixed while checking:** the rules picture's lamp drawn black
(its class lost when inlined into the picture); a miss message four
lines long in a three-line bar (shorter words; "Move a piece..." only
with one reason); "1 💎 not lit by all its colours" for a gem lit by
nothing. The built-in browser's screenshots came out cropped to part of
the page for a while (after screenshots at a reduced scale); setting the
size again fixed it.

**Open questions:** none new; the mockup's choices above are for the
developer, first whether two lamps and mirrored edges make it harder.
Q24, Q27, Q30, Q31 unchanged. **Proposed skill additions:** none (the
uncapped loop is a case of "Time one run before looping over many";
the solver comparison, of "make the expected outputs by running the
reference" and "prove every check can fail").

## 2026-10-21: Mockup v3 played: first verdicts; lamp switches

**Developer**, after a first play of v3:
- **Purple gem: half red, half blue** (the mockup bar's second choice).
- **A broken lamp costs a ❤️** (as the mockup has it; the game goes on).
- **Two lamps: keep them.** "I think it adds a dimension, especially if
  they are different color."
- **Mirrored edges: not sure yet**, needs more play.
- **An idea:** in place of ▶ Shine, an on/off switch on each lamp. "If
  the lamp is turned on and no gem is lit up, it loses a heart and turns
  off."

**Claude's view on lamp switches** (for the developer to decide):
- With one lamp it is ▶ Shine moved onto the lamp: the same game, and
  tapping the lamp itself is direct.
- With two, each colour can be tried alone. That gives more to go on
  than one Shine judging both, so it makes the puzzle somewhat easier.
- "No gem lit" as the only cost would let a beam that lights any one gem
  be looked at for free, for as long as it does: close to the "always
  on" turned down in v2 as too easy. A stricter rule: a lamp turned on
  costs a ❤️ (and turns off) unless its colour is all right: every gem
  wanting that colour lit by it, no gem lit that doesn't want it, no
  lamp hit.
- A lamp that's on goes off when a piece moves, or the light would show
  every change as it's made (again "always on").
- Tap size: the rim is .7 of a square, about 19 px at 8×8 on a 320 px
  phone, too small to tap reliably; the switch may need a bigger tap
  area than the drawn lamp, or a switch below the board.

**Open questions:** none new (lamp switches wait on the developer).
Q24, Q27, Q30, Q31 unchanged. **Proposed skill additions:** none.

## 2026-10-21: Mirror Light mockup v4: lamp switches

**Developer:** "Use the stricter rule: a lamp turned on costs a heart
unless its colour is all right. Lamps go off when a piece moves. Build
it into the mockup as v4."

**Source:** the previous session's scratchpad (`ml/`) was still on disk.
Copied into this session's scratchpad; its built page matched the
published v3 exactly (the whole page found inside the artifact read
back), so v4 is built on what was published.

**The core** (`lp-core.js`):
- `trace(p, placed, only)`: only the lamps that are on shine.
- `checkLamp(p, placed, li, others)`: lamp `li` switched on with
  `others` already on. Right when every gem wanting its colour gets it,
  no gem that doesn't want it gets it, and it shines into no lamp. When
  it is the last lamp, the light of them all must also touch every piece,
  all placed; then `solved`.
- Checked (`check-core.js`, 66 checks, 9 new): hand-made boards (red then
  blue on a purple gem; each colour on a gem of the other; a piece out
  of the light; red turned into the blue lamp, not the last). And
  against `check` on 9,600 boards (the answers of five sets with 0-3
  pieces moved or turned, both lamp orders): switching the lamps on one
  by one, each right, agrees with `check` on all 9,600 (2,513 right).
- Broken on purpose: dropping the "touched" rule made the comparison
  disagree on 317 boards and a hand-made case fail. Dropping the
  wrong-colour rule was caught only by the two hand-made colour cases,
  not by the comparison: random moves seldom light a gem the wrong
  colour while all else is right. So the hand-made cases are needed too.

**Mockup v4** ([Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN),
version 4):
- **No ▶ Shine**; the tools are Clear, Hint, Give up. **Each lamp is a
  switch**: off it is a dim colour; on it glows. Once every piece is on,
  the bar says "Every piece is on: tap a lamp to switch it on" and lamps
  that can be switched on pulse.
- **Switched on:** its light runs out square by square. Right: it stays
  on ("The red light is right. Now the blue lamp."); the last one right
  is Solved. Not right: a ❤️, the lamp goes off, its light stays faint
  with the misses ringed, e.g. "The blue light isn't right: no blue on
  1 💎. That cost a ❤️." A lamp it shone into breaks (and goes off).
- **Moving a piece** (a tap, Clear, a hint) switches every lamp off,
  mends a broken one and clears the faint light. Tapping a lamp that is
  on switches it off, free.
- **Claude's choices (for the developer):** a lamp with pieces still to
  place says so and costs nothing. A lamp that wasn't right, tapped
  again with nothing moved, says "Nothing has moved since that light:
  move a piece first" and costs nothing (it would only lose another
  ❤️). For a colour fault this holds even if the other lamp is switched
  on or off; for pieces the light didn't touch (the last lamp only) it
  is free to try again with other lamps on. A broken lamp says "move a
  piece and it's mended".
- **Purple gem: half red, half blue** always (agreed); with one colour
  on it, that half lights.
- **The tap area** for a lamp: at least 44 px along the edge (1.5
  squares when bigger) and from the board's edge out past the rim, 10 px
  beyond. Measured at 320 × 640, 8×8: 27 px squares, the drawn lamp 22 ×
  19 px, the tap area 45 × 28 px.
- Debug output: with `?debug` in the address, each lamp switched on is
  logged to the console with its result.
- The mockup bar: Mockup v4; the edges switch and "Place all but one
  piece" stay; the purple choice is gone.

**Checked** (scratchpad served on 8131 through the repo's
`tools/serve.js` `createServer`, built-in browser; a temporary
`.claude/launch.json` entry, removed after): at 393 × 760, 7×7 two
lamps: red right and on, then blue: Solved, the purple gem lit both
halves. One piece turned: blue first, not right (2 ❤️, faint light, the
gem ringed); red right; red off (free); blue again with nothing moved:
refused, no ❤️. 6×6 two lamps mirrored, one piece turned: blue shone
back into its own lamp (cracked; "That lamp is broken" when tapped);
red still right. One lamp: "Not yet: 1 💎 not lit", then Solved. Out of
hearts: the answer with both lamps on. A piece turned or taken off
switches the lamps off; a lamp with a piece missing asks for it. At 320
× 640, 8×8: tapped at the tap area's edge, off the drawn lamp: Solved;
no sideways scroll; the footer on screen. No console errors.
**Found and fixed while checking:** switching red off left "The red
light is right" in the bar.

**Another session's server:** the uncommitted `.claude/launch.json`
entry `mirror-light-mockup` (port 8130) belongs to another session, and
its server still runs (serving v3). `preview_start` by that name reused
it, so this session's server had its own name (`mirror-light-v4`, 8131)
and was removed after; the other entry and server were left alone.

**Open questions:** none new; v4's choices above are for the developer.
Mirrored edges: still to play. Q24, Q27, Q30, Q31 unchanged.
**Proposed skill additions:** none (the comparison that missed the
colour fault is a case of "Prove every check can fail").

## 2026-10-22: Mockup v4 played; Mirror Light mockup v5

**Developer**, after playing v4: "I like it. Complexity is good."
- **Mirrored edges: not needed.** Dropped: open edges only.
- **"The colors are subdued. The lamps colors should be brighter."**
- **The purple gem:** "the same outline thickness as the red jewel but
  half in red and half in blue. Interior shading can stay the same."
- (Lamp switches with the stricter rule, from v4: kept.)

**Mockup v5** ([Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN),
version 5):
- **Open edges only:** the edges switch, the silver edge and the
  mirrored rule's words are gone; the page carries only the open sets
  (the build leaves out the `-mirror` sets; the scratchpad keeps them).
- **Brighter lamps** (Claude's reading: the lamps, not the beams or
  gems). In v4 an off lamp was its colour dimmed, which is what made
  them look dull. Now the lamp's body is always its full colour (yellow
  #FFC21A, red #FF2E46, blue #1F86FF) and on/off shows in the lens: dark
  when off, nearly white with a glow of its colour when on.
- **Purple gem outline:** v4's two coloured halves were drawn over the
  outline and hid its inner half, so it looked thinner than the red
  gem's. Now the outline is drawn over the halves, in two halves (red
  left, blue right), at the red gem's thickness; it turns white where
  that colour has lit it, as the other gems' outlines do.

**Checked** (served on 8131 as before, a temporary `.claude/launch.json`
entry `mirror-light-v5`, removed after): at 393 × 760, 7×7 two lamps:
red on (bright body, glowing lens, the purple gem's red half and
outline lit), blue off (dark lens); the three gems drawn side by side,
large: the purple outline the same thickness as the red and blue ones;
blue switched on: Solved. 8×8 one lamp: yellow lamp, off. No edges
switch; sets 6-1, 6-2, 7-1, 7-2, 8-1, all open. `check-core.js`: 66
passed. One console error, a 404: the preview first opened the server's
root, which has no page; the mockup loads nothing from elsewhere.

**Open questions:** none new. Q24, Q27, Q30, Q31 unchanged.
**Proposed skill additions:** none.

## 2026-10-22: Solutions with fewer pieces

**Developer**, after playing v5: "I like the look and play. One aspect
that seems frustrating is that I can see solutions that do not use all
the mirrors. In some ways, solving the problem with less seems like a
better solution but I suppose this is also a key part of making the
game challenging. Thoughts?"

**Measured** (scratchpad `fewer.js`): each of the mockup's 40 puzzles
(open edges) solved again with every smaller tray. The solver accepts
only answers with every piece it is given placed and touched, so an
answer with a smaller tray is a way to light every gem right with fewer
pieces. All 40 in 0.4 s, none over the search cap.

| Set | Solvable with fewer | Fewest pieces needed (of the tray) |
|---|---|---|
| 6×6, 1 lamp | 6 of 8 | 2/5, 2/5, 3/5, 4/5 ×3 |
| 6×6, 2 lamps | 5 of 8 | 3/5 ×4, 4/5 |
| 7×7, 1 lamp | 2 of 8 | 4/6, 5/6 |
| 7×7, 2 lamps | 6 of 8 | 4/6, 5/6 ×5 |
| 8×8, 1 lamp | 3 of 8 | 6/7 ×3 |

So 22 of 40 can be done with fewer pieces, two 6×6 ones with 2 of 5:
there "use every piece" means finding somewhere to put the other three.
The maker checks only that the answer with the whole tray is unique.

**Claude's view:** the maker should keep only puzzles where every piece
is needed (no answer with any smaller tray). Then the shortest way is
the answer, "use every piece" is never arbitrary, and the rule could
even go from the words. Cost: about half of today's puzzles would pass
(18 of 40; 7×7 two lamps 2 of 8), so making gets slower; to measure
before deciding. Waiting on the developer.

## 2026-10-22: Mirror Light: a budget in place of a fixed tray?

**Developer** (another thought, before answering the last entry's
question): "Maybe you start the game with a budget, and each piece you
select (mirror or splitter) costs you something. You can spend it anyway
you want but you can't spend more that you have. At the end, when you
solve a puzzle the left over budget goes into a saving account. You
start the next puzzle with a new budget. If you run out you can withdraw
funds from your savings account. But at the end of solving a number of
puzzles, the size of your remaining savings account is a measure of
your total wins."

**Claude's view:**
- It answers the last entry's frustration from the other side: fewer
  pieces is rewarded (more saved) rather than refused. No fixed tray,
  so no "use every piece" and no "the light must touch every piece"; an
  unused piece is only money wasted.
- What changes for the maker: no longer "exactly one answer with this
  tray" but "the cheapest way to light every gem", which sets the
  budget (the cheapest cost plus a margin, so a best solve saves the
  margin). The solver can find the cheapest by trying trays in order of
  cost, as `fewer.js` did; with any number of pieces allowed the search
  is bigger, so to time first, 8×8 most of all. The cheapest way should
  need several pieces and be the only one at that cost, or puzzles get
  easy.
- Prices matter: a splitter does more than a mirror, so it should cost
  more (e.g. 1 and 2).
- One currency rather than two: a wrong lamp and a hint could cost from
  the budget instead of hearts, so everything a player does shows in
  the savings.
- The savings carry across puzzles (a run of, say, 10), kept on the
  device like a game in progress.
- Proposed: try it in the mockup as v6 before deciding the maker
  change. Waiting on the developer.

**Developer** (added): "And this way it does not matter if there is
only one unique solution per puzzle." *Claude:* right, and that is most
of the maker's time today (searches proving a second answer doesn't
exist), so making should get much faster, perhaps enough for 8×8 with
two lamps. What it still needs: the cheapest cost, proved (every
cheaper tray searched and failing), to set the budget; hints and Give
up then show one of the cheapest solutions, fitted to the player's
pieces where possible.

**Developer:** "I like your suggestions. How do hints and 'giving up'
impact this budget idea?"

**Claude's proposal** (for the developer to decide):
- **Pieces are paid for while on the board:** taking one off gives its
  price back; what's on the board at the solve is what's spent. (The
  other reading, a piece paid for once and gone even if taken off,
  makes every try cost money: more tension, but trying ideas is the
  game.)
- **Hints cost from the budget, more each time:** 1, then 2, then 3 in
  one puzzle (no fixed limit; the price is the limit). A hint takes off
  a piece that isn't in a cheapest solution (its price comes back) or
  places one that is, fixed there; a placed piece costs its own price as
  usual. With several cheapest solutions, the hint follows the one
  closest to the player's pieces.
- **Give up costs the puzzle's whole budget from the savings,** and
  shows a cheapest solution. Without a cost, giving up early would beat
  finishing a hard puzzle expensively. With it, giving up is only worth
  it once a puzzle has gone badly wrong.
- **A wrong lamp costs 1** (in place of a ❤️).
- Example, the cheapest solution costing 6 and a budget of 9: a perfect
  solve saves 3; a cost-7 solve with one wrong lamp saves 1; one hint
  then perfect saves 2; give up: -9.
- Open: what if the savings run out too (debt, shown in red, or the run
  ends)? Claude would allow debt: no dead end.

## 2026-10-22: Mirror Light: v6 (budget) next; status (start here next session)

**Developer:** "Should I start a new session before building v6?"
(Claude: yes; this entry is the handoff.)

**Where it stands:** branch `light-puzzle` (`main` + journal; nothing
of the game in `src/` yet). Release 2.1 live. Mockup v5 is the latest:
[Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN)
(private, version 5). The developer likes its look and play.

**The mockup's source** is in this session's scratchpad, which should
still be on disk:
`C:\Users\dpark\AppData\Local\Temp\claude\C--Users-dpark--claude-spares-spare-TrWCVP\95a52b30-9896-41b0-bf36-410ac644d745\scratchpad\ml\`
(copy it to the new session's scratchpad; if it's gone, rebuild from
the published page as in "Mirror Light: v3 next"). In it:
`lp-core.js` (no DOM: `trace`, `check`, `checkLamp`, `solve`, `make`),
`lp-page.js`, `lp.css`, `body.html`, `build.js` (inlines the repo's
CSS; writes `mirror-light.html` to publish and `local.html` with a
viewport line and a hash hook, e.g.
`#set=7-2-open&i=0&pieces=all|but1|wrong&on=0,1&tap=0`), `puzzles.json`
(the sets; the build keeps the `-open` ones), `check-core.js` (66
checks), `fewer.js` (solutions with fewer pieces), `serve.mjs` (serves
the folder on 8131 through the repo's `tools/serve.js`).
**Checking locally:** a temporary `.claude/launch.json` entry with its
own name (not `mirror-light-mockup`: that entry, uncommitted, belongs
to another session whose server still runs on 8130 serving v3; leave
it), `runtimeArgs` the full path of `serve.mjs`; remove it after. After
changing the address's hash, reload the page (a hash change alone
doesn't).

**Agreed** (entries from "Mockup v3 played" on):
- Lamps beside the board (one per side), each an **on/off switch** in
  place of ▶ Shine. A lamp switched on stays on if its light is right
  (every gem of its colour lit, none other, no lamp hit), else it
  costs and goes off, its light left faint. Moving a piece switches all
  lamps off. A lamp shone into breaks.
- **Two lamps** (red, blue) kept; **purple gem** half red, half blue,
  outlined in two halves at the red gem's thickness. **Open edges
  only.** Lamps bright, on/off shown in the lens.

**v6 to build: a budget in place of the fixed tray** (developer's idea;
"Mirror Light: a budget in place of a fixed tray?" and the two entries
after). The developer liked Claude's suggestions (mirror 1, splitter 2;
one currency, no ❤️; savings over a run of 10 kept on the device).
**Not yet confirmed by the developer, ask first:** the hints and Give
up proposal: pieces paid for only while on the board; hints 1, then 2,
then 3; a wrong lamp 1; Give up costs the puzzle's budget from the
savings; savings may go into debt (red) rather than end the run.
- No unique answer needed: the maker finds the **cheapest cost**
  (proved: every cheaper tray searched, failing), budget = cheapest +
  a margin (say 3). Aim for puzzles whose cheapest solution needs
  several pieces.
- **Time one make first** (cheapest-cost search with any number of
  pieces, 6×6 to 8×8, one and two lamps), capped, a line per run,
  before any batch. Hope: much faster than now, maybe enough for 8×8
  two lamps.
- Hints and Give up follow the cheapest solution closest to the
  player's pieces.

**Found this session:** 22 of the 40 mockup puzzles can be solved with
fewer pieces than the tray ("Solutions with fewer pieces"), the reason
for the budget.

**Open questions:** Q24, Q27, Q30, Q31 (unchanged). **Proposed skill
additions:** none.

## 2026-10-22: v6 go-ahead; a name

**Developer:** the hints and Give up proposal: "Yes - lets try that."
So v6 is built with: pieces paid for only while on the board; hints 1,
then 2, then 3 (no fixed limit); a wrong lamp 1; Give up costs the
puzzle's budget from the savings; savings may go into debt (red).
The leftover `mirror-light-mockup` entry in `.claude/launch.json` (an
older session's, its server on 8130 no longer running) removed with
the developer's OK.

**Developer:** "Regarding the name of the game, I'm thinking something
like Laser Lab or Laserdoku. Thoughts?" (Claude's answer in the next
entry.)

## 2026-10-22: Mirror Light mockup v6: a budget in place of the tray

**Built** ([Mirror Light Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN),
version 6), as agreed in the last three entries:
- **No tray.** Tap a square to buy the piece picked under the board:
  mirror **1 🪙**, splitter **2 🪙**; tap again to turn it, again to take
  it off (its price back). Paid for only while on the board. No "use
  every piece", no "the light must touch each one": an unused piece is
  only money wasted (`check` and `checkLamp` skip both when a puzzle has
  no tray; the v5 rules still hold for tray puzzles).
- **Each puzzle's budget** is its cheapest cost + 3. The status row shows
  "🪙 3 of 9 left" (red "4 over" past it) and the savings "🏦 12" (red
  below 0, the overspend shown coming out of them live). The hearts and
  "placed" count are gone.
- **A wrong lamp costs 1 🪙** (in place of a ❤️; no game over). **Hints
  cost 1, then 2, then 3...** (the button shows the next price, no
  limit). **Give up** asks "Give up: −9 🪙" / No and costs the whole
  budget from the savings.
- **Hints and Give up follow the cheapest answer closest to the
  player's board** (fewest pieces to take off, turn or put down, keeping
  every hint's piece). A hint takes off a piece not in it (price back),
  turns one facing the wrong way, or puts down the next piece along the
  light, fixed there. Every piece right already: no charge, "switch the
  lamps on".
- **A run of 10 puzzles** per size and lamps, kept on the device
  (localStorage; the next puzzle, the savings, the best run). The end:
  "Solved! Saved 3 🪙" over "Pieces 6, cheapest 6 ✓ · hints 1"; given
  up, "You gave up: −9 🪙" and a cheapest way with its light; after the
  10th, "Run over! Savings 17 🪙" over "This one: saved 3 🪙 · Best run!".
  End buttons **Next ▸** (or **New run**) and **New game**; no Try again
  (it would let a puzzle be played again for more savings). Under Play!:
  "Puzzle 4 of 10 · savings 7 🪙 · best run 17 🪙".
- **8×8 with two lamps** is open now (see below).
- The rules picture is a v5 puzzle, solved the cheapest way, so it gives
  away none of the run's answers (it had shown puzzle 1's).
- Mockup bar: "Place a cheapest way but one piece", "Start the run
  again".

**The maker** (scratchpad `lp-core.js`: `solveCheap`, `cheapest`,
`makeCheap`; `make`'s first half split out as `layout`, shared):
- `solveCheap(p, cap)`: the solver with money in place of the tray.
  `cheapest(p)` tries caps 0, 1, 2... so the first cap with an answer is
  the cheapest cost, proved (every smaller cap searched, none found).
- **Checked against last session's count first:** on the 40 v5 puzzles
  it finds the same 22 cheaper than their tray ("Solutions with fewer
  pieces"), in 1.6 s for all 40, the slowest 624 ms (a 7×7 two-lamp).
- **First try:** keep a puzzle only if nothing beats the cost of the
  layout's own pieces (walls added on cheaper answers' paths). Timed
  first, 400 seeds per setup, 20 s cap: 6×6 3 made each, 7×7 one lamp 2,
  7×7 two lamps, 8×8 one and two lamps 0. Too strict.
- **As built:** walls are added only against answers under a floor
  (`minCost`), then the cheapest is proved; it may come in under the
  layout's own cost. Floors 6×6 **6**, 7×7 **7**, 8×8 **8** (one above
  a first try at 5/6/7, which also worked). 2 minutes on one core each,
  up to 40: 6×6 one lamp 40 in 0.8 s, two lamps 40 in 7.8 s; 7×7 one
  lamp 40 in 15 s, two lamps 20 in 120 s; 8×8 one lamp 36 in 120 s; 8×8
  two lamps 1 in 120 s, then 14 cores for 3 minutes: 5 more (6 in all).
  At floor 7, 8×8 two lamps made 6 in 120 s on one core. Most seeds fail
  in the layout (too few gems, a gem in another beam's way), as in v3.
  **So no unique answer did make 8×8 with two lamps possible** (v5: 2 in
  12 minutes on 3 cores, with one answer), though it is still the rare
  one.
- **Picked** (`pick6.js`): 12 per setup, two lamps both lights using
  pieces first (all 12 at 6×6 and 7×7; 5 of 12 at 8×8), then a purple
  gem (5 at 6×6 and 7×7, none at 8×8). 8×8 two lamps: the 6 at floor 8
  and 6 at floor 7. Cheapest costs: 6×6 all 6; 7×7 7 (two at 8); 8×8 8
  (7 for six two-lamp ones). Answers at the cheapest cost: 1 to 50,
  most 2-20. Each picked puzzle checked again: its answer is right, the
  cheapest proved again the same, every kept answer costs it.

**Checks:** `check-core.js` 104 passed (66 before, plus 38 for v6: a
5×5 by hand with the cheapest 1 (one mirror) and 6 answers at 2; an
untouched piece allowed with no tray; 10 made budget puzzles: answer
right and at the cheapest, nothing cheaper, every kept answer right at
the cheapest, a turned piece fails in at least 8 of 10). One of the new
checks failed first: I had expected 2 answers at cost 2 (the mirror and
the splitter); the solver found 6, and it was right: four two-mirror
routes (up, then along the top row) also cost 2. The expectation was
fixed, not the solver.

**Checked in the browser** (served on 8131 as before, a temporary
`.claude/launch.json` entry `mirror-light-v6`, removed after): 393 × 760.
Puzzle 1 of 10 (6×6, budget 9): a cheapest way but one piece placed (4
left), a hint (1 🪙: places the last mirror, 2 left), the lamp: "Solved!
Saved 2 🪙", savings 2. Puzzle 2: a mirror off the answer (8 left), the
lamp: "Not yet: 2 💎 not lit. That cost 1 🪙." (7 left); the lamp again:
"Nothing has moved since that light"; hint 1 took the mirror off (1
back, 7 left); hint 2 (2 🪙) put a mirror down (4 left); 4 splitters
more: "4 over", savings shown −2; Give up −9: savings −7, red. 8×8 two
lamps, the run at puzzle 10 with savings 14 and a best of 10: the
answer, red then blue: "Run over! Savings 17 🪙 · Best run!", New run,
the store's next run at 0. 320 × 640: no sideways scroll. Fixed on the
way: the result's third line (the savings) was cut in the 3-line bar
(now only at a run's end, in the head); after Give up the budget showed
"1 over" (now the puzzle's result, "−9"). One console 404: the server's
root, opened before the page, as with v5.

**Developer's naming question** ("Laser Lab or Laserdoku"). Claude's
view: **Laser Lab**. It says what the game is, the beams already look
like lasers, red and blue suit lasers, and "lab" fits trying things and
the budget (a lab's funding). "-doku" tells puzzle players "Sudoku-like,
one answer, by logic", and this game has no numbers and, since v6, no
single answer; beside Colour Sudoku on the home page the two would
blur. If Laser Lab, the lamps could become laser boxes in a mockup.
Better decided before the build: a rename after it breaks bookmarks
and kept progress (Find the Stars kept `hidden-faces` for that reason).

**Open questions:** none new. Q24, Q27, Q30, Q31 unchanged.
**Proposed skill additions:** none.

## 2026-10-22: Named Laser Lab; "a fixed number of pieces"?

**Developer:** "Laser Lab is good." So the game is **Laser Lab** (the
mockup keeps its old title until its next version).

**Developer:** "I see you are still starting with a fixed number of
mirrors or splitters. I was thinking of dropping that and just use the
budget to pay for what you use."

**Claude:** v6 already has no fixed number: any number of either piece,
each paid for from the budget. Most likely misreading: the piece
buttons under the board show a big bold "1" and "2" beside the mirror
and splitter, where v5 showed "4 left"; they are the prices (with a
small 🪙) but read like counts. (Or the viewer still showed v5.) The
maker does start each puzzle from a few pieces dropped along the light
to place the gems, but the player never sees that, and the cheapest way
may use fewer. Proposed: make the price read as a price ("1 🪙 each"
or a price tag), with the name, in v7. Waiting on the developer.

## 2026-10-22: Laser Lab mockup v7: the name, lasers, prices

**Developer:** "Yes for all" (v7 with clearer prices, the Laser Lab
name, the lamps as lasers) "go ahead and publish V7 so I can try it on
my phone."

**Built** ([Laser Lab Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN),
version 7; the same link, its title now "Laser Lab Mockup"):
- **The name** in the title and heading. The words say laser and beam
  where they said lamp and light ("Tap a laser to switch it on", "The
  red beam isn't right", setup "Lasers"). The code keeps "lamp".
- **Lasers:** the lamp is drawn as an emitter box (its colour, three
  vents, a highlight) with a dark nozzle and a small aperture at the
  end, dark when off and glowing when on; the same size, place, colours
  and crack as the lamp.
- **Prices that read as prices:** each piece button shows the piece's
  name over "1 🪙 each" / "2 🪙 each" (v6: a big "1" or "2" beside the
  piece, read as a count). The rules: "Use as many pieces as you like:
  each one on the board costs its price, and taking it off gives the
  price back"; the pieces panel "Mirror (1 🪙 each)", "Splitter (2 🪙
  each)".
- The run is kept under a new key (`laser-lab-mockup-v7`), so a v6 run
  on the device doesn't carry over.

**Checked** (served on 8131, a temporary `.claude/launch.json` entry
`laser-lab-v7`, removed after; the mockup's source moved to this
session's new scratchpad, `...\C--Users-dpark-Documents-Web-Games\fd6c3904-...\scratchpad\ml\`):
393 × 760, 7×7 two lasers: the lasers drawn and switching, "The red beam
isn't right: no red on 3 💎. That cost 1 🪙." Found: the status row's
"3 of 10 left" ran into the savings (7×7 and 8×8 budgets are two
digits); fixed by giving the budget its own width (widest seen, "11 of
11 left", 104-231 px, the savings from 241 px). 320 × 640, 8×8, 5 over
with savings −17: no sideways scroll, the piece buttons inside 296 px.

**Open questions:** none new. Q24, Q27, Q30, Q31 unchanged.
**Proposed skill additions:** none.

## 2026-10-22: Laser Lab: v7 on the phone next; status (start here next session)

**Where it stands:** branch `light-puzzle` (`main` + journal, DESIGN
status line; nothing of the game in `src/` yet). Release 2.1 live.
Mockup v7 is the latest:
[Laser Lab Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN)
(private, version 7), for the developer to try on the phone.

**The mockup's source:**
`C:\Users\dpark\AppData\Local\Temp\claude\C--Users-dpark-Documents-Web-Games\fd6c3904-b347-46b0-add8-15bb1b794a4e\scratchpad\ml\`
(copy it to the new session's scratchpad). As before ("Mirror Light: v6
next"), plus: `lp-core.js` now also has `layout`, `PRICE`, `costOf`,
`solveCheap`, `cheapest`, `makeCheap`; `make-cheap-set.js` (one setup
into `sets6/`), `pick6.js` (writes `puzzles6.json`, 12 per setup, which
`build.js` uses; it reads `puzzles.json` only for the rules picture),
`time-cheap.js`; `check-core.js` 104 checks; `build.js` writes
`laser-lab.html` (to publish) and `local.html`. Earlier versions' files
kept as `*-v5.*` and `*-v6.*`.

**Agreed so far** (journal from "Mockup v3 played"): lasers beside the
board (one per side), each an on/off switch; open edges; red and blue
with a purple gem; **v6's budget** (pieces bought, 1 and 2, paid while
on the board; a wrong laser 1; hints 1, 2, 3...; Give up the whole
budget; savings over a run of 10, may go below 0); **the name Laser
Lab**. Still Claude's choices, to judge on the phone: margin 3 over the
cheapest; cost floors 6/7/8 by size; no Try again; the end words; the
laser drawing.

**Next:** the developer's verdict on v7 from the phone; then either
v8 or agreeing the design in DESIGN.md and building (`src/core/` for
the rules and the cheapest-cost maker, a tool making the puzzles ahead
of time as for the other puzzles, a test per feature). Decide the
file and storage names as `laser-lab` before building.

**Open questions:** Q24, Q27, Q30, Q31 (unchanged). **Proposed skill
additions:** none.

## 2026-10-22: Laser Lab built

**Task** (from the session that made mockup v7): build Laser Lab into
the site from mockup v7 so the developer can try it on the phone, then
publish it as release 3.0 once the developer says so. Branch
`light-puzzle`. DESIGN.md first got a "Laser Lab" section (commit
baf67ac): what was agreed with the developer, and what is Claude's
choice from the mockup, to be judged on the phone.

**Built** (the way Colour Sudoku is):
- `src/core/laser-lab.js` (no DOM): the tracer, `check`, `checkLamp`,
  `solveCheap`, `cheapest`, the maker (`layout`, `makeCheap`), the stock
  (`stockPuzzle`, `encode`/`decode`/`problems`, `stockOrder`), a game
  (`tapSquare`, `clearBoard`, `switchLamp`, `useHint`, `giveUp`,
  `closest`, the words), and runs kept on the device (`readProgress`,
  `keepCurrent`, `finishPuzzle`). Mirrored edges, the fixed tray and the
  unique-answer maker are left out (dropped in v5-v6).
- `tools/laser-lab-puzzles.js` into `data/laser-lab.json`;
  `laser-lab.html`, `src/ui/laser-lab.js`, `src/ui/llboard.js` (the
  pictures, with their colours as attributes so the home page's tile
  needs no game sheet), `css/laser-lab.css`; the home tile in 🧩 Puzzles
  for grown-ups; the game in `GAME_PAGES` (cleared by the home page and
  other games).
- Wired as the other puzzles: the debug log ("laser-lab": every piece,
  laser, hint, Give up, the end, the fits, the cheapest ways worked out
  with their time), the game kept for a reload (sessionStorage), the run
  kept on the device (`web-games-laser-lab`), sounds (tick, ding, uh-oh,
  ping, sparkle), stats (`data-play` on Next / New run), the fit, the
  iPhone's double-tap zoom blocked on the board, lasers and shop.
- **A puzzle left unfinished waits** (Claude's choice, DESIGN.md "As
  built"): the run keeps it as left, and Play! brings it back, even after
  a restart. The mockup brought it back with a clean board, which undid
  the coins spent on wrong lasers and hints: leaving would have been a
  free way out.

**The port checked against the reference** (the mockup's `lp-core.js`):
the same puzzles from the same seeds and options, 1,500 seeds over 6×6
one and two lasers and 7×7 one laser. The first run differed on 5 seeds
(7×7): the mockup's layout still checked its tray (every dropped piece
touched by a beam), which the port had dropped as v6 did for play. Put
back in the maker only, so the puzzles are the ones the mockup made:
1,500 of 1,500 the same.

**Tests** (`tests/laser-lab*.test.js`): the rules on hand-made boards
(a straight beam, a turn off an open edge, a laser broken, purple and
red gems, each laser judged alone), the cheapest cost and every answer
up to a cap, made puzzles (floor, proved, answers right), lasers in
turn against `check` on 300+ boards, encode/decode and seven broken
entries each refused with its reason, the game (taps and prices, a
wrong laser and the refused second tap, a broken laser, hints 1-2-3
taking off / putting down / turning / free when all is right, Give up),
a game kept as JSON and refused for another puzzle, runs (10 puzzles,
savings below 0, the best kept, unreadable progress); the page and the
stock. **Broken on purpose:** the wrong-colour rule in `checkLamp`, a
wrong laser free, hints always 1: each caught by one test. A solver
that never tries a `\` splitter was **not** caught (no answer in the
made puzzles needed it); added a hand board that only a `\` splitter
solves, which then caught it.

**Timing, one make first** (one core, from each setup's first seed):
6×6 one laser 10-66 ms a puzzle, two 110-240 ms; 7×7 one 0.2-0.3 s,
two 0.3-3.4 s; 8×8 one 0.8-1.9 s; 8×8 two lasers **1 puzzle in 400 s**
(7,123 seeds; the mockup had seen one per 2-3 core-minutes).

**Both beams must use a piece.** At 7×7 with two lasers none of the
first puzzles had a purple gem. The mockup had *picked* its 12 per
setup (both lasers using pieces first, then purple); the tool takes the
first made. Measured on 60 6×6 two-laser puzzles: both beams use pieces
in 58, a purple gem in 8. So the stock now keeps a two-laser puzzle only
when both beams pass through a piece of its cheapest way
(`bothUsePieces`; otherwise one laser just shines straight at its
gems), and leaves purple to chance (14 of 100 at 6×6, 15 of 100 at
7×7): open for the developer. At 8×8 the rule turns most away (93 of the 143
made in the end), and the make went to about 2 minutes of one core a
puzzle, so **8×8 with two lasers has 50** (5 runs) and the rest 100
(`stockSize`).

**The stock** (15 worker threads): 6×6 one laser 100 from 15,315 seeds
in 1 s; two 100 from 6,752 in 2 s; 7×7 one 100 from 9,448 in 5 s; two
100 from 17,289 in 104 s; 8×8 one 100 from 38,145 in 56 s; two
50 from 664,569 in 102 minutes (93 more made but turned away by the
two-laser rule). Cheapest costs: 6×6 all 6; 7×7 7 (one laser: some 8); 8×8 8
(some 9). Purple gems: 14 of 100 at 6×6, 15 of 100 at 7×7, 3 of 50 at
8×8. 57 KB in all.

**The cheapest ways on the device** (`answersFor`: one search at the
known cost, up to 50 ways, at the first hint or Give up). Over the whole
stock, choices median / max: 6×6 one laser 7k / 89k, two 112k / 434k;
7×7 one 194k / 1.35M, two 826k / 1.66M; 8×8 one 702k / 1.53M, two 930k / 1.59M. With nothing else running, in
Node: at most 283 ms (7×7 two lasers), medians 1-137 ms by setup;
in the built-in browser, an 8×8 two-laser hint: 846k choices, 304 ms.
(Measured during the make, with every core busy: 2-6 times that; one
browser hint then took 2.8 s for 35k choices.) Whether a
phone's first hint waits too long is for the phone (the log has
"cheapest ways worked out" with its ms); a worker thread could do it in
the background if so. Not built before it's measured (the standards'
"measure a worry before designing around it").

**Checked in the built-in browser** (`tools/serve.js` on 8123, the
`web-games` entry; a small stock made by a scratch script first, then
the real one):
- 393 × 760: 6×6 one laser, 47 px squares, page 730 of 760, no
  sideways scroll. The answer but one piece, a hint (1 🪙: "A mirror
  (1 🪙) goes at row 6, column 6, facing ⟍ ..."), the laser: "Solved!
  Saved 2 🪙 / Pieces 6, cheapest 6 ✓ · hints 1", savings 2. A reload:
  the same end. Next: puzzle 2 of 10. A piece turned, the laser: "Not
  yet: 1 💎 not lit. That cost 1 🪙.", the gem ringed, the beam faint;
  the laser again: "Nothing has moved since that beam", free. A reload:
  the faint beam, the ring and the words back. Via the home page (which
  clears the kept game, like a restart): setup says "Puzzle 2 of 10
  (under way) · savings 2 🪙"; Play! brought the 5 pieces and the spent
  coin back, lasers off and pulsing, the clock at 1:17 (77.4 s kept).
  Give up: "Give up: −9 🪙", savings 2 → −7 (red), "You gave up: −9 🪙 /
  A cheapest way (6 🪙), with its beams", the pieces fixed. 7×7 two
  lasers: red on: "The red beam is right. Now the blue laser."; blue:
  "Solved! Saved 3 🪙". The home tile: the 6×6 picture, 150 px.
- 320 × 640, 8×8 two lasers: 26 px squares, page 634 of 640, no
  sideways scroll. Every piece turned: "The red beam isn't right: no red
  on 2 💎", "The blue beam isn't right: no blue on 1 💎, blue on 1 red
  💎"; Clear: 9 of 11 left (the pieces' prices back, the 2 coins not);
  the answer: red right, blue: "Solved! Saved 1 🪙 / Pieces 8, cheapest
  8 ✓ · lasers 2". A `/` turning red into the blue laser: "it broke the
  blue laser", cracked; tapped: "That laser is broken. Move a piece and
  it's mended."
- **Found and fixed:** at 320 px the turn line and status fitted only at
  10.5 px beside the 🏠 (144 px for "8×8 · puzzle 1 of 10" and "🪙 11 of
  11 left 🏦 −99 59:59"). Now under 15 px the status stacks (the budget
  on its own line): 15 px. The class `.go` (the purple gem's outline
  halves) clashed with the site's Play row (`tests/css.test.js`):
  renamed `gho`.
- **Classified, not bugs:** Play! seemed dead once: the puzzles took
  8.7 s to load while every core was making the stock, and Play! stays
  greyed until they're in. The clock seemed to jump 7 s on picking up a
  puzzle: my tool calls' own delay (checked: 77,390 ms kept, 1:17 shown
  at once). No console errors.

**Suite:** `npm test` 339 passed (25 of them Laser Lab's). Clean-room: the tracked
and new files copied to an empty folder, the suite run twice (339
passed both times), the file listing the same before and after (145
files).

**Open questions:** Q32 (new). Q24, Q27, Q30, Q31 unchanged.
**Proposed skill additions:** none (the missed `\` splitter is "Prove
every check can fail"; the 10.5 px line is this site's fit lesson,
kept here).

## 2026-10-22: Laser Lab: publish as 3.0 next; status (start here next session)

**Where it stands:** branch `light-puzzle`, pushed. Laser Lab is built
and checked (see "Laser Lab built"); release 3.0 is prepared on the
branch: `src/core/release.js` 3.0, `tools/offline.js` run (version
7a1e35302c27, 94 files), its notes in `RELEASES.md`, and
`node tools/release.js` says ready. `npm test` 339 passed.

**Next:** the developer's OK to publish. Then merge `light-puzzle` into
`main`, push, tag `v3.0` on `main` and push the tag, make the GitHub
release with `node tools/release.js notes`, and once it's live on
github.io stop the localhost servers (`tools/serve.js` on 8123). Then
the developer tries it on the phone (Q32).

**Open questions:** Q24, Q27, Q30, Q31, Q32. **Proposed skill
additions:** none.

## 2026-10-22: Release 3.0 published (Laser Lab)

**Developer** (in the parent session, to Claude there): "OK to publish
when ready", then "OK to publish". The build session had prepared 3.0
(46bf29f) but its auto mode refused publish steps on an OK relayed
from another session, so the parent session, which had the developer's
OK first-hand, published it.

**Checked first:** `light-puzzle` level with GitHub at 46bf29f;
`src/core/release.js` 3.0; `RELEASES.md` 3.0 with version
7a1e35302c27; `node tools/release.js`: "Release 3.0 is ready";
`npm test`: 339 passed, 0 failed.

**Published:** `main` fast-forwarded to 46bf29f (as earlier releases:
no merge commits) and pushed; tag `v3.0` pushed;
[GitHub release 3.0](https://github.com/donpark2000/Web-Games/releases/tag/v3.0)
from `node tools/release.js notes`, titled "3.0" as 2.1 was. Live on
github.io within about 10 s of the check starting:
`src/core/version.js` serves 7a1e35302c27, `laser-lab.html` 200, the
home page links it. The localhost server (`tools/serve.js 8123`)
stopped; no node processes left.

**Next:** the developer tries Laser Lab on the phone.

## 2026-10-22: 3.0 on the phone; release 3.1 (Next ▸ lost the tools)

**Developer**, on the iPhone 16 (the installed app): "The graphics and
layout on the phone look good." Then: no quit and no new game button;
"the only controls I see once a game starts are the selection of
either a mirror or a splitter"; scrolling showed nothing more.

**Found:** in the built-in browser at 393 × 660 the live 3.0's first
puzzle had Clear, Hint and Give up (the tools row 549-592 px, visible).
Reading `src/ui/laser-lab.js`: `showEnd` hides `#tools` for Next ▸ / New
game; `startGame` hid `#endTools` but never showed `#tools` again (only
New game's handler did). On the live 3.0: puzzle 1 given up, Next ▸:
"puzzle 2 of 10", tools hidden, end buttons hidden, nothing but the
shop. So every puzzle after the first, on any device; not the phone or
the installed app. Missed because the tests read the page's code as
text and no check went past one puzzle's end by Next ▸ (the build
session's browser checks went back through New game, which shows them).

**Fixed** (the developer: "fix the missing buttons now and publish it
as 3.1. The other changes go in 3.2 in a new session"): `startGame`
shows `#tools` for every puzzle not over, logged ("play buttons").
Test `a puzzle started by Next ▸ (or any way) shows Clear, Hint and
Give up` (tests/laser-lab-page.test.js): fails without the fix ("an
unfinished puzzle starts without its tools"), passes with it. It first
failed for the wrong reasons twice (the file's CRLF line ends, then a
regex stopped by the braces in Next's handler); both fixed in the test
before trusting it. Local server, 393 × 760: puzzle 3 given up, Next ▸,
puzzle 4 had the tools; again for puzzle 5; the log "play buttons
{tools: true, end: false}" each time. `npm test` 340 passed.

**Published 3.1** (version 0c4447ecb657): `main` fast-forwarded to
8af660a, tag `v3.1`,
[GitHub release 3.1](https://github.com/donpark2000/Web-Games/releases/tag/v3.1);
live after about 20 s (`version.js`, the fix in `laser-lab.js`, `sw.js`
release 3.1). Local server stopped.

**Also from the phone, for 3.2** (a new session; answers so far):
- **New game during play**, back to setup; the run kept.
- **Try again with ❤️❤️❤️ per run** ("lets try per run first"): clears
  the board (hint pieces too) and gives back all that puzzle's spending,
  so budget and savings are as at its start.
- **The top line just "Puzzle 4 of 10"**, full size ("OK"); developer:
  the turn line's font was very small (the fit shrinks it beside the 🏠
  and 🔊).
- **Words instead of 🪙 and 🏦:** developer: "an icon that looks like a
  ball - not meaningful. And an icon of a house with a number beside
  it - not idea what that means." Claude's proposal: "Budget 4 of 9
  left · Savings 12" on a row of its own at a steady 17 px, and "coin"
  in words elsewhere ("Mirror · 1 coin", "Hint · 1 coin").
- **Quit:** developer: "Maybe Quit could solve the existing puzzle and
  deduct the cost of the pieces plus a penalty." Claude: that is what
  Give up already does (the cheapest way shown, the whole budget =
  cheapest + 3 taken); offered A, rename Give up to Quit, or B,
  something different. The developer hadn't seen Give up (the bug
  above) when asking. **Open: A or B.**

**Open questions:** none new besides Quit (above). Q24, Q27, Q30, Q31
unchanged. **Proposed skill additions:** "Check a screen's controls
after every way into it, not only the first": a state set on one path
(the end hiding the tools) stuck because only the first entry was
checked. To review with the developer.

## 2026-10-22: Laser Lab 3.2 built; status (start here next session)

**Quit settled** (developer, in the parent session, relayed here): "Yes:
no Quit button (New game is the quit), Give up renamed to Show answer
and working as now, Try again with hearts is the retry, keep Clear
free." What led to it: they had never seen the buttons (the 3.1 bug),
felt "quit" meant the same as New game, and "give up" sounded like a
retry. DESIGN.md "Laser Lab" has a new block, "Agreed after 3.0 on the
phone (release 3.2)", written before the code.

**Built** (branch `light-puzzle`):
- **Words for 🪙 and 🏦:** `coins()` says "1 coin", "3 coins", "−9
  coins"; the shop "1 coin each"; the hint "Hint 1 coin"; a row of its
  own under the top, "Budget 4 of 9 left · Savings 12", a steady 17 px
  (`.money`, not `--tif`); "Budget 2 over" with "over" and minus amounts
  red; at the end "Saved 3 · Savings 15", "Over 2 · ...", "Answer −9 ·
  ...". It goes on two lines without its dot if one is too narrow
  (measured with its widest words; never needed: 249 px of 361 at 393,
  of 294 at 320).
- **Top line "Puzzle 4 of 10"**, no board size: 20 px at 393 and at 320
  (the log's "turn line fit"); beside the 🏠 under it the hearts and the
  clock. The status no longer stacks (3.0-3.1's `stack` gone).
- **❤️ Try again, 3 per run** (`tryAgain` in src/core): the board
  cleared, hint pieces too, `fees`, `wrongLamps`, `hintsUsed` back to 0,
  so the budget is whole and the next hint costs 1; the clock runs on.
  The heart is kept in the run (`hearts`, 3 again in a new run; a run
  kept by 3.1 reads as 3). Asks first ("Try again: uses a ❤️?"); with
  nothing to give back it uses no heart and says so; greyed with none
  left. Not at the end (DESIGN.md: a solved puzzle replayed for more
  savings).
- **Show answer** (Give up renamed): asks "Show answer: −9 coins?" / Yes
  / No; works as before. The code keeps `giveUp` and `'gaveup'`, so a
  puzzle kept under 3.1 still reads. End words "Answer shown: −9 coins"
  over "A cheapest way: 6 coins".
- **New game during play**: the tools in two rows, Clear · Hint · Try
  again over Show answer · New game. It keeps the puzzle under way in
  the run (as 🏠 always did), so Play! brings it back as left. The
  brief said "the puzzle left starts fresh when they come back"; asked
  the parent session (a fresh start would give back what Try again gives
  back, free, making the hearts pointless). Built as "as left" (option 1
  of 3 offered). **Settled** (developer, relayed from the parent
  session): "Option 1: the puzzle comes back as it was left: pieces,
  coins spent, hints and clock." No code change; DESIGN.md records it as
  the developer's.
- **Debug log** (`laser-lab`): "answer?", "answer shown", "again?", "try
  again" (back, pieces, fees, hearts left, savings), "try again refused"
  (why), "<asked>: no", "new game" (during, puzzle, kept), "turn line
  fit" with the budget row's font, need and width, "end words fit",
  "play buttons" with the page and screen heights, "puzzle done"/"run
  over" with the hearts.

**Tests, each shown to fail without its change:** core tests (coins in
words; Try again gives everything back; refused with no hearts, nothing
spent, or over; hearts per run, kept, 3 in a new run, 3.1's runs read
as 3) and the three existing ones whose words changed: 7 failed against
stubs, 21 pass with the code. Page tests (tools and asks; top line and
budget row, no 🪙/🏦 outside comments; Try again wired; New game keeps
the run; prices "coin"; log names): 6 of 9 failed run against 3.1's
files (a `git archive HEAD` copy with the new test file), all pass now.
Then two found in the browser (below), each with a test failing first.
`npm test` 348 passed, 0 failed; clean room (a fresh copy, run twice):
348 and 348, file listing identical (145 files).

**Browser checks** (local server, built-in browser, every way into a
puzzle, as 3.1's lesson says):
- 393 × 760, 6×6 one laser: Play!, a piece, a wrong laser, a hint
  (budget 5 of 9), Try again → "Started over: 4 coins back. 2 ❤️ left",
  budget 9 of 9, no pieces, ❤️❤️🤍; Show answer → "Answer −9 · Savings
  −9", end buttons; Next ▸ → puzzle 2 with its tools and ❤️❤️🤍; New game
  during play → setup "Puzzle 2 of 10 (under way) · savings −9 coins ·
  ❤️❤️🤍" → Play! → as left; a reload mid-puzzle → as left with its
  tools; the last two hearts used → Try again greyed; Try again with
  nothing spent → refused, no heart. 12 mirrors → "Budget 2 over ·
  Savings −11" in red. No console errors.
- **Found: Next ▸ fitted the board before the tools were back.**
  `startGame` fitted while the end's one row showed, then showed the two
  tool rows: page 801 px on a 760 px screen (8×8 two lasers). In 3.1
  both rows were the same height, so it never showed; the tools' font fit
  was also skipped on that path. Fixed: the tools shown before the fit.
  After: every path (Play!, Next ▸, Try again, New game then Play!, a
  reload, Show answer) page 760 of 760, 31 px squares, nothing cut.
- **Found: the end's words cut at 320 px.** The bar holds 3 lines; in
  coins every end overflowed by 33 px. 3.1's did too: measured with its
  words, "You gave up: −11 🪙" over its line by 33 px, a solve with fees
  by 5. Fixed: `fitEnd` shrinks the head and line together until they
  fit (75% at 320 for the answer's words), and the two longest lines
  were shortened ("A cheapest way: 8 coins", "This one: −9 coins"):
  82.5%. At 393: 92.5%.
- 320 × 640, 8×8 two lasers: every path the same (tools showing,
  nothing cut, the asks and end rows not cut).

**The cost: a smaller board.** The second tools row (+48 px) and the
budget row (+28 px) come out of the board. 393 × 760: 6×6 squares 40 px
(3.0: 47, journal "Laser Lab built"), 8×8 two lasers 31 px, no
scrolling. 375 × 667: 6×6 28 px, 7×7 25 px, 8×8 24 px and 16 px of
scroll. 320 × 640: 6×6 25 px, 7×7 and 8×8 at the 24 px floor with 15 and
39 px of scroll (3.0: 8×8 26 px, none). Tighter buttons would save only
15 px and make them about 33 px tall (under the 44 px tap size); one
tools row would still leave 8×8 at 24 px at 320 × 640. To judge on the
phone; if the board feels small, New game could move to the top row.

**Release 3.2 prepared** (not published): `src/core/release.js` 3.2,
`node tools/offline.js` (version d82d45d7fa31, 94 files), RELEASES.md
3.2, `node tools/release.js`: "Release 3.2 is ready". The local server
(`tools/serve.js 8123`) is running for checks.

**Open questions:** none new (New game's puzzle left: settled, above).
Q32 (Laser Lab on the phone) now also covers 3.2's layout cost. Q24,
Q27, Q30, Q31 unchanged. **Proposed skill additions:** more evidence
for "Check a screen after every way into it": the Next ▸ path also
fitted the board to the wrong row (added there).

**Next:** the developer's OK to publish as 3.2; then the release steps in CLAUDE.md,
and stop the local server.

## 2026-10-22: Release 3.2 published (Laser Lab)

**Developer** (in the parent session): "OK to publish 3.2". Published
from the parent session, as 3.1 was (the 3.2 session had built and
prepared it; an OK relayed between sessions isn't taken as one there).

**Checked first:** `light-puzzle` level with GitHub at 0019967 (the
release prepared in bd070bc, then the journal and DESIGN.md);
`node tools/release.js`: "Release 3.2 is ready", version d82d45d7fa31;
`npm test` 348 passed. In the built-in browser on the local server
(a run left from the 3.2 session's checks, all hearts used): 393 × 760,
"Puzzle 2 of 10" at 20 px, "Budget 2 over · Savings −11" on its own
row, the tools Clear, Hint 1 coin, Try again (greyed: no hearts),
Show answer, New game; Show answer asked Yes / No, ended "Answer shown:
−9 coins", and Next ▸ brought puzzle 3 with all five tools. 320 × 640:
no sideways scroll, no button cut.

**Published:** `main` fast-forwarded to 0019967, tag `v3.2`,
[GitHub release 3.2](https://github.com/donpark2000/Web-Games/releases/tag/v3.2);
live after about 40 s (`version.js` d82d45d7fa31, the page with Try
again and Show answer). Local servers stopped; no node processes left.

**Next:** the developer tries 3.2 on the phone.

## 2026-10-22: Purple gems spread; release 3.3 prepared; status (start here next session)

**Task** (from the parent session, which asked the developer): on the
phone with two lasers the developer saw no purple gem (the half red,
half blue one that wants both beams). The developer, asked whether to
drop them: "Keep the two-colour gems: about 1 in 3 two-laser puzzles at
6x6 and 7x7, spread through each run, and 8x8's three spread out."

**Why there were so few:** the stock took the first seeds made, in seed
order, with no preference (journal "Laser Lab built"): 14 of 100 at
6×6, 15 at 7×7, 3 of 50 at 8×8. Places in the stock (1-based) of the
purple ones in 3.2: 6×6 run 1 had 2 (6, 10); 7×7 run 1 none (14 the
first); 8×8 at 17, 19, 32: runs 1, 3 and 5 none.

**Built** (DESIGN.md "Laser Lab", new block "Agreed after 3.2 (release
3.3)", and "As built"):
- `stockPurple(setup)` (core): with two lasers, `Math.round(size / 3)`
  (33 of 100); 8×8 two lasers 3 (its first 50 had 3; not remade, about
  30 core-minutes a puzzle); one laser 0. `isPurple(e)`: a '3' on an
  entry's board.
- **The pick:** from `firstSeed` on in seed order, the first
  `stockPurple` made puzzles with a purple gem and the first
  `size - stockPurple` without. With 0 purple that is 3.0's pick, and at
  8×8 two lasers it is exactly 3.2's 50 (47 + 3), so nothing else
  changes.
- **The order** (`stockOrder`): the others shuffled with the same fixed
  seed as before, then the purple ones (shuffled too) put at
  `floor((j + 0.5) × size / purple)`: 100 with 33 at 2, 5, 8, ... 99,
  3 or 4 a run, always 2 or 3 apart; 8×8 at 9, 26, 42 (runs 1, 3, 5).
  With no purple the order is 3.0's (one-laser setups unchanged).
- `tools/laser-lab-puzzles.js`: keeps making until it has both groups
  (all seeds below the last one done), says "purple" on each such line
  and where they went; `--order` puts a setup's puzzles already in the
  file in order without making any (used for 8×8 two lasers; it refuses
  if the file doesn't hold the count and purple share the rule wants).
  **Found:** `-` for the output file (as `-` for the count) wrote a file
  named `-` in the repo (the first 6×6 run went there; deleted). Now `-`
  means the default for both.

**Timing, one make first** (one core, from the seed after 3.2's last,
until one purple puzzle was kept; scratch script, capped at 60 / 120 s):
6×6 two lasers 1,034 seeds in 1.4 s (slowest 89 ms; 19 kept, the 19th
purple); 7×7 two lasers 65 seeds in 3.4 s (slowest 846 ms; the first
kept was purple). **The batch** (15 workers, the tool's 300 s cap a
seed, a line per puzzle kept; output in
`Web-Games-testing\2026-10-22_purple-gems`): 6×6 13,320 seeds, 3 s (221
kept, 35 purple); 7×7 37,632 seeds, 178 s; 8×8 reordered only.
**The same file again:** 6×6 remade into a copy: byte for byte the
same.

**Against 3.2's stock** (a copy kept in the test folder): 6-1, 7-1, 8-1
identical; 6-2 keeps 81 of its 100 (all 14 purple and the first 67
others), 19 new purple ones (seeds up to 62012902); 7-2 keeps 82 (15 +
67), 18 new (up to 72037355); 8-2 the same 50, 4 in their old places.
Purple per run of 10: 6-2 and 7-2 3 4 3 3 3 4 3 3 4 3; 8-2 1 0 1 0 1.

**A run kept on a device over the update** (`src/ui/laser-lab.js`
`startRun`, `restore`; core `restoreGame`): a run is kept by place
(run number and puzzle 0-9), with the puzzle under way as a game that
names its seed. The place, savings and hearts keep working; at 6×6 and
7×7 two lasers the puzzle at a place is now (nearly always) another one,
so a puzzle under way is dropped and logged ("puzzle under way not
picked up (not this puzzle)"), the new one starting fresh; a game kept
for a reload is dropped too ("resume failed: ... the puzzles
changed"). Both paths are 3.0's, as Find the Stars' reshuffle did
(Q28). Nothing is lost that counted: the savings change only at a
puzzle's end. A player part way through may meet a puzzle again later
(the places moved). **Checked in the built-in browser:** a 6×6 two-laser
run as 3.2 would have kept it (puzzle 3, savings 3, 2 hearts, puzzle
62001098 under way with 2 pieces and a wrong laser): Play! showed
"Puzzle 3 of 10", savings 3, ❤️❤️🤍, budget 9 of 9 on puzzle 62001476,
and the log said `puzzle under way not picked up (not this puzzle)
{"seed":62001476,"kept":62001098}`.

**Tests** (349, 348 before): `laser-lab-stock.test.js` "purple gems in
about 1 in 3 two-laser puzzles, spread through every run" (the count
`stockPurple`'s, 30-35%, 3 or 4 a run, never side by side, round the
end too; 8×8 one in each of 3 runs; none with one laser); "in
stockOrder" now passes entries; "the file is what the tool makes now"
also remakes 6×6 two lasers' first seeds up to its second purple
puzzle (the first two of each group the file's). `laser-lab.test.js`:
the order with 5 purple in 30 at 3, 9, 15, 21, 27; with none, the plain
shuffle. **Shown to fail:** run against 3.2's stock (a copy of HEAD with
the new code and tests): "6-2: 14 purple, not 33" and "6-2: not in
stockOrder's order"; with 3.2's 8×8 order alone: "8-2: purple per run
0,2,0,1,0"; with two of 6×6's swapped: "6-2: purple side by side at 2".
`npm test` 349 passed; clean room (a fresh copy, run twice): 349 and
349, the file listing the same (145 files).

**Browser** (local server, built-in browser): 6×6 puzzle 2 (62012902,
one of the new), 7×7 puzzle 5 (72014928, three purple gems), 8×8
puzzle 9 (82479962, two): each drawn half red, half blue. No console
errors.

**Release 3.3 prepared** (not published): `src/core/release.js` 3.3,
`node tools/offline.js` (version cf033660098b, 94 files), RELEASES.md
3.3, `node tools/release.js`: "Release 3.3 is ready". The local server
(`tools/serve.js 8123`, the `web-games` entry) is running.

**Open questions:** Q32's purple share settled (above); the rest of
Q32, Q24, Q27, Q30, Q31 unchanged. **Proposed skill additions:** none
(the `-` slip is this tool's).

**Next:** the developer's OK to publish as 3.3; then CLAUDE.md's
release steps, and stop the local server. Then the developer plays a
two-laser run on the phone. OK to purge
`Web-Games-testing\2026-10-22_purple-gems` once this is published.

## 2026-10-22: Release 3.3 published (Laser Lab: more purple gems)

**Developer** (in the parent session): "OK to publish as with 3.2".
Published from the parent session, as 3.1 and 3.2 were.

**Checked first:** `light-puzzle` level with GitHub at 08001b7;
`node tools/release.js`: "Release 3.3 is ready", version cf033660098b;
`npm test` 349 passed. The stock, by runs of 10 in its order: 6-2 and
7-2 33 of 100 with a purple gem, per run 3 4 3 3 3 4 3 3 4 3; 8-2 3 of
50, per run 1 0 1 0 1. In the built-in browser (393 × 760, the local
server on 8123 serving cf033660098b, a node process left from the 3.3
session's checks): a 6×6 two-laser run, each puzzle shown and Next ▸:
purple gems in puzzles 2, 5 and 8 (1, 2 and 2 gems).

**Published:** `main` fast-forwarded to 08001b7, tag `v3.3`,
[GitHub release 3.3](https://github.com/donpark2000/Web-Games/releases/tag/v3.3);
live after about 20 s (`version.js` cf033660098b). The leftover server
on 8123 stopped (PID 37008); no node processes left.

**Next:** the developer tries 3.3 on the phone.

**Purged** (developer: "OK to purge"): `Web-Games-testing\2026-10-22_purple-gems` (3.2's stock copy, the makes' output, the remake check) sent to the Recycle Bin. This entry and "Purple gems spread" are the record.

## 2026-10-22: Easy starts with 30 digits (Q31); release 3.4 prepared

**Task** (from the parent session; developer, Q31: "yess"): Colour
Sudoku's Easy should start with more digits, about 30, as in other
Sudoku games. Digits added from the answer, so each puzzle keeps its one
answer and only gets easier; Harder unchanged. Done in a session started
from the parent one, on `light-puzzle`.

**Built** (DESIGN.md "Colour Sudoku": a new decided bullet, "As built"
setup and puzzles):
- Core: `EASY_GIVENS = 30`; `addGivens(p, n, rnd)` adds digits from the
  answer one at a time, each to a box with the fewest givens (at random
  among those squares), and records `made` (the maker's count);
  `stockPuzzle('easy', seed)` = the maker's puzzle (as before) then
  `addGivens(..., mulberry32(seed ^ 0x9e3779b9))`, a stream of its own,
  so the maker's part is unchanged. Harder: untouched.
- `restoreGame` refuses a game kept with another number of starting
  digits, saying so: "kept with 17 starting digits, the puzzle now has
  30 (the puzzles changed)".
- `tools/colour-sudoku-puzzles.js`: an Easy line also says "N from the
  maker".
- **The words** (How hard?): the 2026-10-19 ones were still true but no
  longer said the main difference, so each now starts with its count:
  Easy "starts with 30 digits; each digit can be found from one row,
  column, box or colour", Harder "starts with 12 to 20; some digits need
  two of those looked at together". Claude's words, to confirm with the
  developer.

**Timing, one make first** (scratch script, `timeout 60`): Easy seeds
100000-100002: the maker 404 / 288 / 887 ms, the stock puzzle (maker +
added digits) 308 / 322 / 894 ms: adding costs nothing measurable.
**The batch** (the tool: 15 workers, its 60 s cap a make, a line per
make; output in `Web-Games-testing\2026-10-22_easy-digits\make.txt`):
Easy 261 seeds tried, 26 s; Harder 248, 28 s; 54 s in all. **The same
file again:** remade into a copy, byte for byte the same (76 s).

**Against 3.3's stock** (a copy kept in the test folder): Harder
identical; Easy: every one of the 200 places the same seed and colours
(so a puzzle number kept on a device is still the same puzzle), every
old given kept, 30 givens each (3.3: 13-20; the maker's counts by line
12:1 13:1 14:12 15:38 16:53 17:70 18:57 19:23 20:6). Per box, fewest
givens: 3.3 had a box with none in 121 of 200 and one in 79; now 3 in
199, 2 in 1; most 4 in 185, 5 in 14, 6 in 1. The file stays 71 KB (the
same length of string).

**Kept on a device over the update** (`src/ui/colour-sudoku.js`
`restore`; core `restoreGame`): the progress (`next`, `best` per level)
is unchanged in meaning, as the places hold the same seeds. A game kept
for a reload of an Easy puzzle has the old starting digits, so it is
dropped and logged, and the setup shows (3.0's path, as Find the Stars'
reshuffle and Laser Lab 3.3); a Harder one picks up as before. Nothing
that counted is lost: the puzzle was counted as used when it started.
**Checked in the built-in browser:** an Easy game started (puzzle 1,
seed 100137: 30 givens, "51 to go", the log's "game started ...
givens: 30", page 755 of 760 at 393 x 760); its kept state then changed
to 3.3's (only the maker's 17 givens, all of which were among the 30)
and the page reloaded: the log said `resume failed: a new game
{"error":"Error: restoreGame: kept with 17 starting digits, the puzzle
now has 30 (the puzzles changed)"}`, the setup showed, and the progress
read `next: {easy: 1}`. **320 x 640:** Easy's words take 6 lines (4
before), Harder's 5, both buttons 133 px, nothing cut, the page 320
wide (the setup already scrolled there). No console errors.

**Tests** (352, 349 before): `colour-sudoku.test.js` "Easy gets digits
added from the answer, spread over the boxes" (30, the maker's kept,
all from the answer, still one answer by Easy's steps, at least 3 a
box, the same for the same stream; already enough: unchanged; 81: the
answer) and "a game kept before more digits were added is refused,
saying why"; `colour-sudoku-stock.test.js` "Easy starts with 30 digits
spread over the boxes, Harder with fewer" (at least 2 a box; Harder
12-20); the page test's words. **Shown to fail** (a scratch copy of the
repo): with 3.3's stock, "easy seed 100137: 17 digits to start: stale:
run node tools/colour-sudoku-puzzles.js ..." and "the file is what the
tool makes now" (easy: stale); with `restoreGame`'s new check taken
out, the kept-game test fails. `npm test` 352 passed.

**Release 3.4 prepared** (not published): `src/core/release.js` 3.4,
`node tools/offline.js` (version bc03ebead85e, 94 files), RELEASES.md
3.4, `node tools/release.js`: "Release 3.4 is ready". The local server
(`tools/serve.js 8123`, the `web-games` entry) is running.

**Open questions:** Q31 resolved (moved). Q24, Q27, Q30, Q32
unchanged. **Proposed skill additions:** none.

**Next:** the developer's OK to publish as 3.4 (and on the new How
hard? words); then CLAUDE.md's release steps, and stop the local
server. Then the developer plays Easy on the phone. OK to purge
`Web-Games-testing\2026-10-22_easy-digits` once this is published.

## 2026-10-22: Release 3.4 published (Colour Sudoku Easy); Q24, Q27, Q30 closed

**Developer** (in the purple-gems session): "OK to close Q24 and Q27 and
Q30. If no other questions, please publish so I can test on m phone".
Q24, Q27 and Q30 moved to Resolved, each with that answer (commit
7e589fc). Published from that session; the Easy-digits session that
built and prepared 3.4 had stopped with it ready (its entry above).

**Checked first:** the 3.4 work read through (its entry above);
`light-puzzle` clean at 7e589fc; `node tools/release.js`: "Release 3.4
is ready", version bc03ebead85e; `npm test` 352 passed.

**Published:** `main` fast-forwarded to 7e589fc, tag `v3.4`,
[GitHub release 3.4](https://github.com/donpark2000/Web-Games/releases/tag/v3.4);
live after about 15 s (`version.js` bc03ebead85e, `release.js` 3.4).
Local server stopped (`tools/serve.js 8123`, PID 25380); no serve.js
left.

**Still to confirm with the developer:** the new How hard? words (Easy
"starts with 30 digits; ...", Harder "starts with 12 to 20; ..."),
Claude's. **Next:** the developer tries 3.3 (Laser Lab's purple gems)
and 3.4 (Easy with 30 digits) on the phone. OK to purge
`Web-Games-testing\2026-10-22_easy-digits`, to ask.

**Purged** (developer: "OK to purge the easy-digits test folder."): 
`Web-Games-testing\2026-10-22_easy-digits` (3.3's Colour Sudoku stock, the
make's output and the remake check) sent to the Recycle Bin. "Easy starts
with 30 digits" and "Release 3.4 published" are the record.

## 2026-10-23: Laser Lab 3.5: the end in pieces and coins, See best, the developer's setup words; no pinch zoom

**Developer** (after 3.3 and 3.4 on the phone): asked the difference
between ↺ Clear and ❤️ Try again (Claude: Clear is free, takes the
pieces off but a hint's, their prices back, wrong lasers and hints stay
paid; Try again uses a heart and gives back everything the puzzle cost,
hint pieces and hints too). Then four changes: new setup words (their
own text); the end "says how many pieces you used, and what the minimum
number of pieces would have been but it says 'cheapest'. It would be
clearer to say something like 'You used 7 pieces and 9 coins. Best
solution used 6 pieces and 7 coins'"; "sometimes on my phone the board
seems to zoom in (probably because I accidently used a 2 finger
gesture). Can that be disabled?"; and "an option to show the best
solution if your solution was not the best". Claude's suggestions
(three-line end words, See best / Your way, the pinch blocked on every
game page, one rule put back into the setup words), then the developer:
"Please build and publish 3.5".

**Found:** the end's "Pieces 7, cheapest 6" never counted pieces: both
were coins (`spent(G)`, the pieces' prices, against `P.cheapest`), so a
splitter counted 2. The label was wrong, not just unclear.

**Built** (DESIGN.md "Laser Lab", new block "Agreed after 3.4 (release
3.5)"; "Structure" for the zoom):
- **Setup words:** the developer's, as three paragraphs, with "You
  goal" → "Your goal", a comma before "but", and Claude's "Go over the
  budget and the rest comes out of your savings." (their text had left
  out that the savings pay and can go below 0).
- **The end's words** (core `endWords(g, p, best, run)`): "You used 7
  pieces (8 coins) · hints 1 coin · lasers 1 coin" over "Best: 6 pieces
  (7 coins)"; at the cheapest, one line, "...: the best ✓". The coins
  are the pieces' prices; hints and wrong lasers follow in coins (before,
  "hints 1" was coins too, unsaid). Show answer: "Best: N pieces (C
  coins)" (was "A cheapest way: C coins"). A run's end keeps the best
  line under "This one: ...". The bar's 3 lines take a head and up to
  two lines (`resOf`); an end kept by 3.4 (one `line`) still shows.
- **See best / Your way** (core `bestView`: the best way's pieces, every
  laser on, the game untouched): first of the end's buttons (now a row
  of 2 or 3, `grid-auto-flow: column`), only for a solve that cost more
  than the cheapest; free; reset to the player's board by a reload or
  the next puzzle. The best way is kept with the end (`ui.end.best`), so
  a reload shows the same one.
- **Which best way:** the cheapest way closest to the player's board
  (`closest`, as hints use). Working them out (`answersFor`) at the
  solve, timed first on 10 stock puzzles per setup (Node, this PC):
  average / worst ms 6-1 7/13, 6-2 38/118, 7-1 72/279, 7-2 187/298, 8-1
  145/242, 8-2 127/192. A phone is slower, so not before the sparkle:
  the end shows at once with the stored way (or the closest, if a hint
  already worked them out), and 0.4 s later `refineBest` works them
  out, updates the words and logs "best way" (pieces, stored, was).
  See best refines first if tapped sooner. **Does the count change?**
  Cheapest ways of different piece counts in 2 of those 10 7×7 two-laser
  puzzles, none in the others: rare, but the words count the way See
  best shows.
- **No pinch zoom** (`src/ui/nozoom.js`, loaded by the 12 game pages,
  not index.html or log.html): `gesturestart` / `gesturechange`
  cancelled (Safari; iOS ignores `user-scalable=no`), and a touch move
  with two fingers or more (others); one finger scrolls as before.
  Logged once per pinch: `[zoom] pinch blocked {"how":"gesture"}`.
  **Not yet checked on a real phone**: only the iPhone can show whether
  a real pinch is stopped.

**Tests** (359, 352 before): `laser-lab.test.js` "the words say pieces
and coins, yours and the best way's" (with fees, the best, over budget,
answer shown, a run's end) and "See best draws the best way with every
laser on, the game itself untouched"; `laser-lab-page.test.js` the
setup's words exactly, See best wired (drawn from `bestView`, shown only
when not best, refined before showing, reset per puzzle, an end kept by
3.4), the end's buttons See best / Next / New game, two new log lines;
`pages.test.js` "every game blocks pinch zoom; the home and log pages
don't"; new `nozoom.test.js` (a two-finger move cancelled and noted
once, one finger left alone, noted again after all fingers lift,
Safari's gesture; one that can't be cancelled left alone). **Shown to
fail** (a scratch copy, six breaks at once, each caught by its test):
"Best way:" for "Best:" in the words; `bestView` keeping the game's
fixed squares; the See best button removed; "You goal" put back; nozoom
left off nim.html; the touch rule at 3 fingers. `npm test` 359 passed;
clean room (a fresh copy, run twice): 359 and 359, the file listing the
same (147 files).

**Browser** (local server, built-in browser): a 6×6 one-laser run's
first puzzle (61012484, cheapest 6, budget 9) kept on the device with
its stored way plus a mirror off the beams, then Play! and the laser:
"Solved! Saved 2 coins" / "You used 6 pieces (7 coins)" / "Best: 5
pieces (6 coins)", See best / Next ▸ / New game; the log's "cheapest
ways worked out" 5 ms, "best way" 5 pieces. See best: the spare mirror
gone, the beam on; Your way: back. At 320 × 640: the three buttons 87 px
each, none cut, the page 320 × 640; the end's words at 87.5%. The
longest words likely ("Solved, 12 coins over" / "You used 14 pieces (21
coins) · hints 10 coins · lasers 12 coins" / "Best: ...") put in the bar
there fit at 67.5% (the fit goes to 60%). A reload came back to the end
with See best (not the best way). Next ▸ then Show answer: "Answer
shown: −9 coins" / "Best: 5 pieces (6 coins)", no See best, page 760 of
760. A synthetic `gesturestart` on the page: cancelled and logged. No
console errors.

**Release 3.5 prepared:** `src/core/release.js` 3.5, `node
tools/offline.js` (version 0b2719ffa49b, 95 files), RELEASES.md 3.5,
`node tools/release.js`: "Release 3.5 is ready".

**Open questions:** Q32 unchanged (the end's words and See best now part
of what the developer judges on the phone). **Proposed skill
additions:** none new (the mislabelled number is this game's).

**Next:** publish (the developer's go-ahead given), then the developer
plays 3.5 on the phone, including whether a pinch is now stopped.

## 2026-10-23: Release 3.5 published (Laser Lab end words, See best; no pinch zoom)

**Developer:** "Please build and publish 3.5". **Checked first:**
`npm test` 359 passed; `node tools/release.js`: "Release 3.5 is ready",
version 0b2719ffa49b. **Published:** `main` fast-forwarded to 0ed3fd4,
tag `v3.5`,
[GitHub release 3.5](https://github.com/donpark2000/Web-Games/releases/tag/v3.5);
live after about 15 s (`version.js` 0b2719ffa49b). Local server stopped
(`tools/serve.js 8123`, the built-in browser's preview); no serve.js
left. No test folder outside the repo this time (scratch copies only).

**Next:** the developer plays 3.5 on the phone: the setup words, the
end's words, See best, and whether a two-finger pinch is now stopped
(only the phone can show that; the log says `[zoom] pinch blocked` each
time).

## 2026-10-23: 3.5 on the phone; release 3.6 prepared (gems on arrival, zoom second try, no "the best")

**Developer** (3.5 on the phone): "Pretty good. The zoom still happens.
Not sure what I did to make it zoom but I have use a 2 finger pinch
gesture to zoom back out. One minor thing in the animation - the jewels
light up before the laser beam hits them. When I have the best solution
I don't think you need to say 'best'. It is obvious if there is no
second line saying what the best score could have been."

**The gems, measured first** (built-in browser, 393 × 760, a 6×6
one-laser puzzle with its stored way; a MutationObserver timing each
growing beam line, each gem's lit class and each line's animationend):
gem 12's line added at 635 ms, the gem lit at 735, the line grown at
768; gem 30: added 901, lit 1001, grown 1034. So the gem lit about 33 ms
before the beam's tip reached its centre: the gem's timer (90 ms after
its line was added) runs on its own, while the line's 90 ms animation
starts a frame or more later (here it took about 130 ms). A phone's
frames lag more, so more visibly. **Fix** (`drawSegs`): a gem lights, and
a laser breaks, at its line's `animationend`, with a timer (400 ms)
behind it for an animation that doesn't run; `cb.done` waits for both
the steps' time and every arrival. **After:** gems 6 and 5 lit at 464
ms, the same ms as their lines' animationend. **Found on the way:** with
reduced motion (site.css turns animations off) a growing beam stayed
hidden (its dash offset never ran) until the beam's end redrew it; now
shown whole (`laser-lab.css`).

**The zoom: what 3.5 shows.** The pinch back out going through means
3.5's block didn't hold on the iPhone at all (it would have blocked
zooming out too). Why is not known: the listeners may not have run, the
events may not have been cancelable, or iOS may ignore the cancel. Not
guessed further; 3.6 makes sure it can't strand a page, closes the
likeliest other way in, and logs how a zoom happens:
- **Only zooming in is blocked:** at a page scale over 1.01
  (`visualViewport.scale`) a pinch is let through, so a zoomed page can
  always be pinched back out.
- **No double-tap zoom anywhere on the page:** touch-action
  manipulation on the root (`document.documentElement`). Until now only
  the boards stopped a quick second tap (Find the Stars, 2026-10-13);
  one off the board (the hint bar, the budget row, the page's edge)
  could still zoom: the likeliest "not sure what I did".
- **Logged** ("zoom"): "blocking zoom in" on load (with the root's
  touch-action), each pinch blocked, a pinch that "couldn't be
  cancelled" (counted), and **every change of zoom**: from, to, the
  fingers of the last touch, ms since it, the gap between the last two
  one-finger taps, and the counts. The next zoom on the phone will say
  which way it came in.
Checked in the built-in browser: on laser-lab.html the root's
touch-action is manipulation, a synthetic `gesturestart` is cancelled
and logged; on the home page neither.

**Words:** at the cheapest, the end says just "You used 6 pieces (7
coins)" (3.5's ": the best ✓" gone); the "Best:" line only when there
was a cheaper way. An end on screen across the update keeps its 3.5
words until Next.

**Tests** (362, 359 before): `nozoom.test.js` rewritten for the new
shape (a pinch cancelled and noted once, one finger alone; zoomed in, a
pinch let through and blocked again at the normal size; one that can't
be cancelled noted and counted; the root's touch-action; the last
touches kept: fingers, tap gap); `laser-lab-page.test.js` "a gem lights
when its beam's line has grown, not by a timer of its own"; the end-words
test's best case. **Shown to fail** (a scratch copy): the gem back on
its timer ("the gem not lit by its line"); the zoomed-in let-through
removed; the root's touch-action removed; ": the best ✓" put back.
`npm test` 362 passed.

**Release 3.6 prepared** (not published): `src/core/release.js` 3.6,
`node tools/offline.js` (version 5f100156e0bb, 95 files), RELEASES.md
3.6, `node tools/release.js`: "Release 3.6 is ready". The local server
(`tools/serve.js 8123`, the built-in browser's preview) is running.

**Open questions:** Q33 added (does 3.6 stop the zoom on the iPhone?).
**Proposed skill addition:** one ("Tie an effect to the event it
follows, not a timer that guesses it").

**Next:** the developer's OK to publish as 3.6; then the release steps
and stop the local server. On the phone: whether anything still zooms,
and if so the log (version line → Save log), which now says how.

## 2026-10-23: Release 3.6 published; status (start here next session)

**Developer:** "Yes, publish as 3.6." **Checked first:** `light-puzzle`
level with GitHub at 0b09c68; `npm test` 362 passed; `node
tools/release.js`: "Release 3.6 is ready", version 5f100156e0bb.
**Published:** `main` fast-forwarded to 0b09c68, tag `v3.6`,
[GitHub release 3.6](https://github.com/donpark2000/Web-Games/releases/tag/v3.6);
live after about 50 s (`version.js` 5f100156e0bb). Local server stopped
(the built-in browser's preview on 8123); no serve.js left. No test
folder outside the repo (scratch copies only).

**Status:** Laser Lab 3.6 live: the end in pieces and coins (a "Best:"
line only when there was a cheaper way), See best / Your way, the
developer's setup words, gems lit as the beam reaches them. Every game
page: no double-tap zoom, a pinch blocked only at the normal size, and
every zoom change logged.

**Next:**
1. The developer plays 3.6 on the phone. **Q33:** does anything still
   zoom? If so, the log (version line → Save log) says how: look for
   `[zoom] page zoom changed` and the lines before it.
2. **Q32** (Laser Lab on the phone) stays open until the developer has
   played it enough to judge Claude's choices.
3. **Proposed skill additions waiting on the developer:** "Tie an
   effect to the event it follows, not a timer that guesses it" (new)
   and "Check a screen after every way into it".

## 2026-10-23: 3.6 on the phone; release 3.7 (a double tap on a piece, swap a piece, gems at the line's start)

**Developer:** "We can add the skills. 3.6 still zooms. It seems to
happen when I double tap a piece to change its direction sometimes but
not all the time. The jewels are lighting up after being hit, but the
lag could be a bit shorter. It would look more natural if the jewel lit
up at the same time as the last line of the laser was drawn." And a
change to play: with the other piece picked, a tap on a square with a
piece should just replace it ("I have to tap the existing piece twice
to remove it before placing the other type").

**Skill:** both proposed additions added (see "Proposed additions";
ai-dev-practices 2e527f2, pushed; `software-project-standards.zip`
rebuilt there, to upload in the skills settings).

**The zoom: cause.** Laser Lab's board cancels each touch's end (the
Find the Stars fix, 2026-10-13), with the listener on `#boardwrap`. A
touch's events all go to the element the touch started on. A tap on a
piece lands on the piece's picture (the square's `<svg>`), and the tap's
pointerdown renders the board: `c.innerHTML = cellSvg(...)` puts a new
picture in. The touched `<svg>` is now out of the page, so its touchend
bubbles to nothing: not the board's handler, not even nozoom's document
listener, and iOS sees an uncancelled double tap. An empty square has
no picture (the touch is on the square, which stays), so placing pieces
never zoomed: "sometimes but not all the time". The shop row had the
same shape: `render()` rebuilt its two buttons on every tap. Not
reproduced on the iPhone (no log sent); shown in the built-in browser
(Chrome): on Colour Sudoku, a square tapped (pointerdown) was out of
the page at once (`isConnected` false) and a touchend sent to it was
not heard by a listener on the board (`boardHeardIt: false`), which is
3.6's catch.

**Every path to it.** Find the Stars: its marks take no touches
(`.cell .mk { pointer-events: none }`) and its squares are made once a
puzzle: safe. Colour Sudoku: `render()` rebuilds the whole board and
both digit rows on each tap: the same gap (not reported; the developer
may not double tap there).

**The fix (3.7).**
- Laser Lab: `.llcell svg { pointer-events: none }`, so a tap is on the
  square, which stays; the shop's buttons made once, then only
  `aria-pressed` and `disabled` changed. In the browser: the element at
  a piece's centre is now the `llcell`; the tray's two buttons the same
  objects after taps, swaps and picks.
- Colour Sudoku: its squares are rebuilt, so the end is caught on the
  touched element itself: a capture-phase pointerdown (touch only, not
  in the hint bar) adds a once-only, non-passive touchend listener to
  `e.target`. In the browser: the touchend sent to the redrawn square
  was cancelled (`defaultPrevented` true). Logged with `redrawn` on a
  quick second tap.
- nozoom keeps the element each touch started on; "page zoom changed"
  now says `touchedRedrawn` and `touched` (the nearest id), so if the
  phone zooms again the log shows whether this was the way.

**Gems (3.7).** Lit at the last line's `animationstart` (3.6: its
`animationend`); a laser still breaks at the end, when the tip arrives.
Measured in the browser (a solved 6×6, one laser, hints placing the
pieces): lines start every ~67-100 ms and each grows in 67 ms; gem #11
lit at 697 ms with its line's start at 697, gem #22 at 764 with its
line's start at 763, i.e. 67 ms earlier than 3.6 would have. Not
changed: the lit gem's bounce (`bounce .4s`, from 60% size up), which
may also read as a lag; to ask if it still looks late.

**Swap (3.7).** `tapSquare`: a piece of the other kind is swapped for
the picked one, facing the same way (`did: 'swap'`, `was`); then taps
turn it and take it off as before; the budget pays the new price and
gets the old back; the lasers go off as for any change; a hint's piece
refused as before. Test: "a tap with the other piece picked swaps it";
the old test's "a piece turns whatever is picked" changed to tap with
the piece's own kind. In the browser: mirror / → mirror \ → (Splitter
picked) splitter \ → off; Mirror picked: mirror / → \; budget right.
Logged: the `piece` line's `did: swap` and `was`.

**Checks:** `npm test` 363 passed after `node tools/offline.js`. Each
new check shown to fail on a scratch copy with its fix taken out (the
svg's pointer-events, the kept shop buttons, the swap, the gem at
animationstart, Colour Sudoku's catch on the element): each reported by
its own message. No console errors.

**Release 3.7 prepared:** `src/core/release.js` 3.7, `tools/offline.js`
run, notes in `RELEASES.md`. Open: Q33 (does 3.7 stop the zoom),
Q32.

## 2026-10-23: Release 3.7 published; status (start here next session)

**Developer:** "Yes, publish as 3.7." **Checked first:** `light-puzzle`
level with GitHub at bcc0a91; `npm test` 363 passed; `node
tools/release.js`: "Release 3.7 is ready", version 2111778e433b.
**Published:** `main` fast-forwarded to bcc0a91, tag `v3.7`,
[GitHub release 3.7](https://github.com/donpark2000/Web-Games/releases/tag/v3.7);
live within about 15 s of the first check (`version.js`
2111778e433b). Local server stopped (the built-in browser's preview on
8123); no serve.js left. No test folder outside the repo (scratch
copies only).

**Status:** Laser Lab 3.7 live: a tap with the other piece picked swaps
it (facing the same way), a gem lights as its last beam line starts, a
double tap on a piece or a piece button no longer zooms; Colour Sudoku's
squares and digits likewise. The zoom log says whether the element
touched had been redrawn.

**Next:**
1. The developer plays 3.7 on the iPhone. **Q33:** does a double tap on
   a piece (or anything) still zoom? If so, Save log: the `[zoom] page
   zoom changed` line's `touchedRedrawn` and `touched` say where.
2. Gems: if they still look late, the lit gem's bounce (from 60% size)
   is the next thing to try.
3. **Q32** (Laser Lab on the phone) stays open.
4. The developer uploads the rebuilt skill zip
   (`ai-dev-practices\software-project-standards.zip`).

## 2026-10-23: 3.7 on the phone; Q33 closed; release 3.8 (a gem pops as it lights)

**Developer:** "The zooming problem seems to be gone ... I think we can
assume it is fixed for now". Q33 moved to Resolved. And: "The jewels
still seem to have a momentary delay lighting up after the laser hits
them. Not a big deal really, but I can't say I noticed much of a
difference between 3.6 and 3.7."

**Why 3.7 made no difference: measured.** In the built-in browser
(Chrome, the pane at about 30 frames a second; 6×6, one laser, hints
placing the pieces), each frame recording each gem's lit class, its
picture's size, and the dash offset of the beam line ending at it:
gem #12 lit at 953 ms at **0.6** of its size (the bounce, `scale(.6)`
to 1.15 to 1 over 0.4 s); the tip reached it at 1019 ms with the gem at
**0.86**; full size at 1086 (67 ms after the tip), biggest at 1186.
3.7 moved the lighting about 90 ms earlier (a line grows in `STEP_MS`
90), but the gem only got to full size after the tip either way, which
reads as the lag. And a second cause: **every lit gem bounced again**
(gem #17 back to 0.6 at 1386 ms, as the beam finished): `render()`
puts a new picture in every square (`c.innerHTML = cellSvg(...)`), and
the lit class's animation starts again on a new picture. `render()` runs
when the beam is done, and with two lasers as the second goes on, so the
first laser's gems bounced again too.

**The fix (3.8).**
- A lit gem is only a look (fill and glow), no animation: `.lit`,
  `.lit1`, `.lit2` lose `bounce`.
- The moment of lighting is its own class, `pop`, added only by the
  beam's gem callback: `gempop`, from `scale(1.3)` to 1 in 0.25 s,
  ease-out (big and bright at once, settling). Removed, a reflow, and
  added again, so a purple gem pops again for its second colour.
  `render()` removes `pop`, so a redraw shows a lit gem still.
- When: unchanged, at the last line's `animationstart` (3.7).
- Logged: `gems lit {laser, ms}`, each gem as `square@ms` after the
  laser went on, so a phone's log shows the timing.

**In the browser after the fix:** two lasers, 6×6: red's gems #29 and
#3 popped at 770 and 970 ms; the tips reached them at 836 and 1037 with
the gems at **1.18** (3.7: 0.86); blue's #3 (purple, its second colour)
popped again at 498, size 1.18 at the tip. Red's gems #6 and #13 stayed
at full size, without a second bounce, when blue went on and when it finished. Log:
`gems lit {"laser":0,"ms":"29@768 3@968"}`. Not checked: the phone, at
60 frames a second (the pane ran at about 30).

**Checks:** new test "a gem pops once, big at once, as its beam lights
it" (no `.lit` rule animates, the pop starts above full size, `render()`
removes `pop` and never adds it, the beam's callback re-adds it, the log
line). Each part shown to fail on a scratch copy with it undone (bounce
back on `.lit`, pop from .6, `pop` kept by render, not added, no
reflow, no log line): each reported by its own message. `npm test` 364
passed after `node tools/offline.js`. No console errors.

**Release 3.8 prepared:** `src/core/release.js` 3.8, `tools/offline.js`
run (version b9cd9937caf4), notes in `RELEASES.md`; `node
tools/release.js`: "Release 3.8 is ready". Open: Q32. If a gem still
looks late on the phone, the next thing to try is lighting it at the
line's end (when the tip arrives) now that the pop is at full size at
once.

## 2026-10-23: Release 3.8 published; status (start here next session)

**Developer:** "Publish 3.8." **Checked first:** `light-puzzle` level
with GitHub at 0df021e; `npm test` 364 passed; `node tools/release.js`:
"Release 3.8 is ready", version b9cd9937caf4. **Published:** `main`
fast-forwarded to 0df021e, tag `v3.8`,
[GitHub release 3.8](https://github.com/donpark2000/Web-Games/releases/tag/v3.8);
live within about 30 s (`version.js` b9cd9937caf4). Local server
stopped (the built-in browser's preview on 8123); no serve.js left. No
test folder outside the repo (scratch copies only).

**Status:** Laser Lab 3.8 live: a gem pops big at once as its beam
lights it, and doesn't bounce again on a redraw. Q33 (the zoom) closed.

**Next:**
1. The developer plays 3.8: do the gems still look late? If so, the
   next try is lighting them as the tip arrives (`animationend`); the
   log's `gems lit` line gives each gem's time.
2. **Q32** (Laser Lab on the phone) stays open.
3. The developer uploads the rebuilt skill zip
   (`ai-dev-practices\software-project-standards.zip`), if not done.

## 2026-10-23: Puzzle order confirmed; Q35 (what makes Laser Lab harder)

**Developer:** "for all puzzles we should keep track of ones used and
start new games and new runs with new puzzles. They can eventually
rotate but we should play all unique puzzles before going back to
one." **Checked in the code:** already so in all three. Find the Stars
and Colour Sudoku: `takeNext` counts a puzzle used as it starts, one
count a size or level (`prog.next`), `stockAt` = `list[k % length]` in
`stockOrder`'s fixed shuffle. Laser Lab: run `no`'s puzzle `at` is
number `no * 10 + at` (`puzzleNumber`), `finishPuzzle` starts run
`no + 1` after the tenth, the same `stockAt`. Stock: Find the Stars 200
a size; Colour Sudoku 200 a level; Laser Lab 100 a setup, 50 for 8×8
with two lasers (5 runs before one comes again). Written down as one
rule for every puzzle game: DESIGN.md "Puzzle order".

**Developer:** would the colour mirror, more lasers, or placing the
lasers make it easier or harder? Logged as Q35 with Claude's reasoning;
not measured yet.

## 2026-10-23: Q35 measured: colour mirror, more lasers (and bombs, an idea)

**Developer:** "measure these variants - colour mirror, more lasers.
Forget placing lasers manually." And a new idea: "Bombs that, when
placed beside a block and lit with a laser, blow of the block so the
light can pass through."

**The measure.** How many ways win at each budget (the cheapest cost
+0 to +3; the game's budget is +3), counted by `solveCheap` with no
answer limit (capped at 20 million choices; a capped count is a lower
bound, marked +). Fewer ways: less room to win by trying. A proxy for
"forgiving", not for how hard it is to reason out. Also, for puzzles with
more than one laser, each laser solved on its own (only its beam, gems
wanting just its colour): if the lasers alone cost less than together,
the beams get in each other's way. Scratch code (Claude's scratchpad):
a copy of `src/core/laser-lab.js` with colour mirrors and up to four
lasers; checked against the real code first (it remakes 16 stock
puzzles from their seeds and counts the same ways; broken on purpose,
it reported 5 makes and 8 counts different). 6×6 only: 7×7 with two
lasers ran past the cap at +2 (one puzzle, 8.8 s). Colour mirror: 2
coins, turns its own colour as a mirror does, lets the other through.

**Results** (medians, quartiles in brackets):

| 6×6 | n | +0 | +1 | +2 | +3 (budget) | beams in each other's way |
|---|---|---|---|---|---|---|
| one laser (stock) | 30 | 4 (2-8) | 31 (15-64) | 185 (87-450) | 958 (486-2720) | - |
| two lasers (stock) | 20 | 4 (3-7) | 36 (24-50) | 252 (190-450) | 1436+ | 1 of 20 |
| + colour mirror offered | 20 | 4 (3-8) | 50 (36-79) | 454+ (334-724) | 1996+ | - |
| made to need a colour mirror | 9 | 2 (2-4) | 18 (16-32) | 129 (100-216) | 602+ | 8 of 9 |
| three lasers | 20 | 3 (2-5) | 28 (16-38) | 183+ (89-309) | (capped) | 3 of 20 |
| four lasers | 20 | 3 (1-4) | 17 (11-24) | 125+ (45-175) | (capped) | 1 of 20 |

(7×7 one laser, 20: 7 / 81 / 625+ / 3048+.)

- **The budget's margin is the biggest lever:** at +3 about 250-350
  times as many ways win as at the cheapest.
- **A colour mirror offered on today's puzzles makes it easier:** the
  cheapest never fell (0 of 20) and never used one, but 1.4-1.8 times
  as many ways fit each budget.
- **Puzzles made to need one are harder:** about half the ways at each
  budget, and in 8 of 9 the beams get in each other's way (each laser
  alone 1-4 coins, together 6 or 7; today's two-laser puzzles: 1 of 20).
  Made by dropping one colour mirror where the beams cross, then kept
  only when no way without one fits the budget: one puzzle in 3,600-93,000
  seeds, 1-10 minutes of one core each at 6×6 (one of the ten runs ended
  without a puzzle or an error line; not looked into). Larger boards
  not tried; 8×8 with two lasers already takes about 30 minutes a puzzle.
- **More lasers: a little harder by the count** (three: about a quarter
  fewer ways; four: about half), **but in 18 of 20 (three) and 20 of 20
  (four) one laser needs 0 or 1 coins on its own**: the same 6-coin floor
  shared out, so each beam's job is smaller. Their beams mostly share
  pieces (8-9 of 20) rather than get in each other's way.

**Bombs: Claude's view, not measured.** A fit for the "physics" idea,
and a rule that changes the board, which nothing does yet. As a piece
the player buys, it frees any wall: more ways, likely easier (as the
colour mirror offered). As part of the puzzle (fixed bombs), or with
puzzles made to need one, likely harder: lighting it can also open a
way to a wrong gem or a laser. Open: which walls it blows (the four
next to it?); whether the beam carries on; and the per-laser switches:
a wall blown by red is gone for blue, so the order the lasers go on
would matter, and when the wall comes back needs a rule. The solver
would need to search in stages (walls change), so making puzzles costs
more.
