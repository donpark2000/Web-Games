# Releases

What changed in each release of the site, newest first. A release
number is **x.0 for a new game** and **x.1, x.2 ... for fixes and
changes** (DESIGN.md "Releases"). Each release is also a git tag `vX.Y`
and a [GitHub release](https://github.com/donpark2000/Web-Games/releases)
with these notes. The version in each heading is the site's own
fingerprint, the last part of the home page's version line.

## 6.1 (2026-10-29, version 0633202916d9)

Sideways screens, tried first on Reversi and the home page:

- **Reversi** on a tablet or phone held sideways: the board fills the
  screen's height in the middle, the 🏠 and 🔊 to its left, and the
  turn line, scores and buttons to its right. On a sideways tablet the
  board is about twice as wide as before; on a sideways phone it's
  bigger and the page no longer scrolls. It changes as the screen
  turns; upright, nothing changes.
- **The home page** held sideways shows more games a row: 3 on a phone,
  5 on a tablet.

## 6.0 (2026-10-25, version 11d40472a957)

A new game, **Reversi**, in 👥 Two players, after Dots and Boxes:

- Put down a disc to trap a line of the other colour between two of
  yours; the trapped discs flip over. When neither player can move,
  most discs wins (a tie is possible).
- Classic black and white discs, drawn as real pieces seen at an angle.
  Whoever goes first plays black.
- **Me and the robot** (⭐ Easy or ⭐⭐⭐ Hard) or **Two players**; a
  **6×6** board (picked to start with, for the kids) or the classic
  **8×8**; who goes first as in the other games.
- Faint dots show where you can play. Hold a finger down to see the
  disc and the discs it would flip; it goes down as you lift. The
  robot's latest disc stays ringed until you play. With no move: "No
  move for Teddy, so Robot goes again."
- The tally shows each player's face, colour and discs, with games won
  under it.

## 5.0 (2026-10-24, version 3642495c7376)

A new game, **Bridges** (the Hashi puzzle), in 👤 One player, for the
kids and grown-ups alike:

- Join the numbered islands with bridges: each island needs as many
  bridges as its number. Bridges go straight across or down, never
  cross, at most two between two islands, and in the end every island
  is joined to the rest.
- **Small** (5×5, numbers shown as dots, for the kids; picked to start
  with), **Medium** (7×7) or **Large** (10×10). 200 puzzles each, every
  one with exactly one answer that can be found by reasoning.
- Tap between two islands for a bridge, again for two, once more to take
  them away; or drag from an island.
- **💡 Hint** says why the next bridges must go where they go, and puts
  them down. **🏳 Give up** asks first, then **Show me how** (the rest a
  step at a time, with the reasons) or **Just show it** (the whole
  answer at once).

## 4.2 (2026-10-24, version 4d5c726fdbc5)

Dots and Boxes:

- **The Easy robot takes every box it can.** Before, it sometimes left
  a box it could have closed; taking it then often meant having to
  open a new run of boxes for the robot. Easy still makes careless
  moves that give boxes away.

## 4.1 (2026-10-24, version acc369c8d300)

Dots and Boxes:

- **The robot's move stays marked until you draw.** Every line it drew
  in its last turn (several when it won boxes and went again) keeps a
  pale band of its colour under it, so the move can't be missed while a
  finger covers the board. The band goes as soon as you draw your line.
  Its last line still blinks first.

## 4.0 (2026-10-24, version 86665e534113)

A new game for the kids, **Dots and Boxes**, in 👥 Two players:

- **Me and the robot** (⭐ Easy or ⭐⭐⭐ Hard) or **Two players**, on a
  board of **5×5** or **7×7** boxes.
- Take turns drawing a line between two dots. Close a box to win it:
  it shows your face, and you **go again**. Most boxes wins.
- Tap anywhere between two dots: the nearest line is drawn. While a
  finger is held down, that line shows faintly.
- The robot's line shows faintly for a moment, then is drawn and
  blinks, so it's easy to see where it went.
- A running tally of boxes under the board, and the games won.

## 3.11 (2026-10-23, version 268c25be2a2d)

The whole site:

- **A new version shows when the app opens.** The home page checks
  for a new version and loads it again by itself a few seconds after
  opening. Before, the new version only showed after going into a game
  and back. A game is never interrupted: the next page opened has the
  new version.
- **The home page starts fresh.** Going to it, closing the app, or a
  new version clears the game under way. In Laser Lab, Play! then
  brings back the same puzzle with a clean board and its coins back.
  The run, its savings and hearts, and the best runs are kept.
- Reopening the app without closing it still comes back to the game
  as it was.

## 3.10 (2026-10-23, version 9492cb48b18f)

Laser Lab:

- **Bombs are now boosters**, drawn as a funnel: a beam going into its
  wide open end is boosted, the wall it points at comes down, and the
  booster burns out. The open end is easy to see on a phone.
- **More boosters:** about 2 in 3 puzzles have one (6 or 7 in each run
  of 10), instead of half.
- **With two lasers, every booster puzzle needs the right order:** one
  order works and the other doesn't.

## 3.9 (2026-10-23, version 19293ca92ca2)

Laser Lab:

- **Directional bombs** in about half the puzzles. Each one points at a
  wall and has armour on its sides: a beam coming in from behind sets it
  off, the wall comes down, and the beam carries on. A beam from any
  other side stops at it.
- **With two lasers, a bomb is red or blue**, and only that colour sets
  it off, so the order you switch the lasers on can matter.
- New puzzles for every size except 8×8 with two lasers (no bombs there
  yet).

## 3.8 (2026-10-23, version b9cd9937caf4)

Laser Lab:

- **A gem lights the moment the beam reaches it:** it flashes big and
  bright, then settles, instead of growing from small.
- **A lit gem stays still** when the beam finishes or the other laser
  goes on (it used to bounce again, which looked like it lit late).

## 3.7 (2026-10-23, version 2111778e433b)

Laser Lab:

- **Swap a piece in one tap:** with Splitter picked, a tap on a mirror
  turns it into a splitter facing the same way (and the other way
  round), instead of having to take the old piece off first.
- **A gem lights as the beam's last line runs into it**, not after.
- **A double tap on a piece no longer zooms** (or on a piece button).

Colour Sudoku:

- **A double tap on a square or a digit no longer zooms** (the same
  cause as Laser Lab's).

Every game: if the page ever zooms again, the log now also says whether
the thing touched had just been redrawn.

## 3.6 (2026-10-23, version 5f100156e0bb)

Laser Lab:

- **A gem lights when the beam reaches it** (it lit a moment before).
- **No "the best ✓"** when your solve was the cheapest: the end just
  says what you used, and only adds a "Best:" line when there was a
  cheaper way.

Every game:

- **Zoom, second try:** a double tap anywhere on a game page no longer
  zooms (before, only on the boards), and a pinch is blocked only while
  the page is at its normal size, so a page that gets zoomed can always
  be pinched back out. Every change of zoom now goes in the log, with
  the touches just before it.

## 3.5 (2026-10-23, version 0b2719ffa49b)

Laser Lab:

- **The end says pieces and coins**: "You used 7 pieces (8 coins)" and
  "Best: 6 pieces (7 coins)" (it said "Pieces 7, cheapest 6", which were
  both coins). Matching the best says "the best ✓".
- **See best**: when your solve cost more than the cheapest, a See best
  button at the end shows a cheapest way (the one closest to yours) with
  its beams; Your way goes back. Free.
- **The setup's words rewritten** by the developer.

Every game:

- **No pinch zoom** on the game pages, so a two-finger touch can't zoom
  the board. The home page and the log page still zoom.

## 3.4 (2026-10-22, version bc03ebead85e)

Colour Sudoku:

- **Easy starts with 30 digits** (it was 13 to 20), spread over the
  boxes. The extra digits come from the answer, so each puzzle still has
  one answer and is only easier. Harder is unchanged.
- How hard? now says how many digits each level starts with.
- An Easy game left open for a reload over the update starts again at
  the setup; the next puzzle and best times are kept.

## 3.3 (2026-10-22, version cf033660098b)

Laser Lab:

- **More purple gems** (the half red, half blue ones that need both
  lasers): about 1 in 3 two-laser puzzles at 6×6 and 7×7, 3 or 4 in
  every run of 10 (they were about 1 in 7, and some runs had none).
  8×8's three now come in three different runs.
- A two-laser run under way keeps its place, savings and hearts; the
  puzzle under way starts fresh if a different puzzle is now in its
  place.

## 3.2 (2026-10-22, version d82d45d7fa31)

Laser Lab, from a first go on the phone:

- **Words in place of 🪙 and 🏦:** "Budget 4 of 9 left · Savings 12" on
  a row of its own, "over" and minus amounts in red; prices say "coin"
  ("1 coin each", "Hint 1 coin").
- **The top line just "Puzzle 4 of 10"**, full size.
- **❤️ Try again, 3 per run:** starts the puzzle over with everything it
  cost given back (pieces, wrong lasers, hints). The hearts show beside
  the clock.
- **Give up is now Show answer**, working as before.
- **New game during play:** back to the setup screen, the run kept.
- **The end's words fit** on small phones (they were cut at 320 px).

## 3.1 (2026-10-22, version 0c4447ecb657)

Laser Lab, after a first go on the phone:

- **Clear, Hint and Give up on every puzzle:** after a puzzle ended,
  Next ▸ started the next one without them (only New game brought
  them back).

## 3.0 (2026-10-22, version 7a1e35302c27)

A new game in 🧩 Puzzles for grown-ups: **Laser Lab**.

- **The puzzle:** buy mirrors (1 🪙) and splitters (2 🪙) and put them
  on the board so a laser's beam reaches every 💎, for as little as you
  can. A beam that shines into a laser breaks it.
- **Each laser is a switch:** tap it on and its beam runs out. Right, it
  stays on; not, it goes off and costs 1 🪙. Moving a piece switches the
  lasers off.
- **Size and lasers:** 6×6, 7×7 or 8×8, with one laser or two (red and
  blue, with red, blue and purple gems).
- **A budget per puzzle:** what's left goes into your savings over a run
  of 10 puzzles. Hints cost 1, then 2, then 3 🪙; Give up costs the
  whole budget.
- **Kept on the device:** the run under way, with the puzzle you left,
  and your best run for each size and lasers.

## 2.1 (2026-10-19, version bc4971605fea)

Colour Sudoku, after a first go on the phone:

- **The selected square's notes stay clear:** the square is marked by a
  ring outside it, over the lines around it, instead of a band inside
  it that hid the notes.
- **Plainer words for How hard?** Easy: "each digit can be found from
  one row, column, box or colour". Harder: "some digits need two of
  those looked at together".

## 2.0 (2026-10-19, version cfd968c6a9f1)

A new game in 🧩 Puzzles for grown-ups: **Colour Sudoku**.

- **The rules:** a 9×9 Sudoku whose squares are also split into nine
  coloured shapes, each holding 1 to 9 once too.
- **Easy or Harder:** Easy needs only "the only place a digit can go";
  Harder needs, at least once, a step using two units at once.
- **Two rows of digits:** big ones put a digit in, small dashed ones
  write notes, so there's no Notes button to switch. Digits the same as
  the selected square's are ringed. Auto tidy takes a placed digit out
  of the notes it rules out (or turn it off).
- **Three hearts, three hints, Undo and Give up**, as in Find the Stars;
  a hint puts the digit in and ❓ Why? shows the reason. Show me how
  walks through the rest one step at a time.
- **200 puzzles per level**, each counting as used once you start it,
  so they don't repeat until all 200 are played.

## 1.3 (2026-10-19, version 9a99095f131b)

Find the Stars: after a 10×10 is solved, the buttons are **Next** and
**New game**. Same size is gone there, as it did the same as Next.

## 1.2 (2026-10-19, version 88b43a849f0b)

Find the Stars: new puzzles more often.

- **A puzzle counts as used once you start it.** Play, Next, Same size
  and Another each bring one you haven't had; only Try again plays the
  same one again. Before, leaving a puzzle, giving up or running out of
  hearts brought it back next time.
- **The puzzles are in a new, shuffled order**, with the ones played
  before at the end, so the next ones are new. After the 200th of a size
  they come round again.

## 1.1 (2026-10-18, version a13d7c8f2673)

Find the Stars: a way to learn from a puzzle you couldn't solve.

- **Give up asks how:** "Give up?" Show me how, Just end it (as before)
  or No.
- **Show me how** walks through the rest of the puzzle from where you
  are, one step at a time: each step's words, the squares it's about
  lit, ❓ Why? for the deeper reason, then Next. ⏩ The rest finishes at
  once. The end says "Shown step by step" and counts as given up (no
  best time); Try again lets you solve it yourself.
- **Clearer hints:** the squares a hint isn't about keep their ✕s, stars
  and lines at full strength (only their colour fades), and the lit
  squares are lifted by a shadow.
- **The hints' white ✕s** have a thicker black edge, easier to see.

## 1.0 (2026-10-16, version 720f7406cc4a)

The first numbered release: everything on the site so far.

- **Nine games for young kids.** Two players, the second a person or in
  most games the robot: Tic-tac-toe, Matching cards, Connect Four, Count
  to 9, Snakes and Ladders, Five Dice and Nim. One player: Rock paper
  scissors and Follow Me.
- **Find the Stars**, a logic puzzle for grown-ups: one star per row,
  column and colour, none touching; 6 x 6 to 10 x 10, 200 puzzles each.
  Hints take their step on the board and explain themselves (❓ Why?);
  ✓ Got it goes back to play, and a greyed hint lights again with a tap.
- **Plays offline** once opened with a connection, and installs as an
  app (Let's Play!).
- **One game in progress at a time**: kept through a reload or a trip
  to another app; 🏠, the home page, another game or a restart of the
  app start fresh.
- **Give up** in Follow Me and Find the Stars (it asks first), and Find
  the Stars ends when no square is left.
- The home page's version line starts with the release number.
