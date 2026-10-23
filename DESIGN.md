# Design

The agreed direction for Web Games. This file records **decisions**; the
reasoning, evidence, and anything still open live in
[`DEV_JOURNAL.md`](DEV_JOURNAL.md).

*Status (2026-10-23, later): Laser Lab: a tap with the other piece
picked swaps it, a gem lights as its last beam line starts, and a double
tap on a piece no longer zooms (nor on Colour Sudoku's redrawn squares)
(release 3.7, prepared). Earlier 2026-10-23: Laser Lab's end says pieces and coins, yours and
the best way's, with **See best**; its setup words are the developer's;
**no zooming in** on any game page (release 3.5; 3.6: no double-tap
zoom anywhere on the page, a zoomed page can be pinched back out, gems
light as the beam reaches them, no "the best ✓"). 2026-10-22: a new grown-ups' puzzle, **Laser Lab** (called
Mirror Light until 2026-10-22; buy mirrors and splitters so a laser's
beam reaches every gem), built from mockup v7 on the branch
`light-puzzle` (see "Laser Lab"), to try on the phone once published
(release 3.0). Release 2.1 live. 2026-10-19: **Colour
Sudoku** built from mockup v3.1 and published (releases 2.0, 2.1; see
below). Earlier: Colour Sudoku designed
(mockups v1-v3.1). Find the Stars: no Same size after a 10 x 10 win
(published, release 1.3). Earlier 2026-10-19: a puzzle counts as used as it
starts (only Try again plays one again), and the puzzles are shuffled
once into a new order (published, release 1.2). 2026-10-18: Find the Stars: Give up asks how, and **Show me
how** walks through the rest a step at a time; the spotlight fades only
the squares' colour and lifts the lit ones; hint ✕s have a thicker black
edge (published 2026-10-18, release 1.1). 2026-10-15, later: Find the Stars: a look where there's known
to be no star costs nothing, and the last hint's words stay in the bar,
greyed; hints take their own step, with white hint ✕s (published
2026-10-15). Earlier 2026-10-15: every game carries on where it was left, and the
installed app's icon goes back to the game left (published
2026-10-15). 2026-10-14: Hidden Faces renamed **Find the Stars** (one white
star hides, no faces), bigger ✕s, no wait on a double tap, the end in
the hint bar; the 🏠 one size (80 px) in every game, drawn by the site;
Nim's and Matching's setup pictures fixed (published 2026-10-14).
2026-10-13: Hidden Faces, a logic puzzle for the developer (not the
kids), agreed from mockup v2, built and published, in a third home-page
group; Undo takes back a wrong look. Until then (2026-10-11): all nine games published, the home page grouped
by players. The offline app ("Let's Play!", happy bear icon) published
2026-10-10; a version line on the home page and no counts sent offline
published 2026-10-11, and the app checked on an iPhone and an Android
tablet. Stats (GoatCounter, "Stats" in every footer) published
2026-10-10. Follow Me added 2026-10-09 (the same day: no ding for a
right order, Easy at Hard's starting pace, a 3 s pause before the robot's
next order, a "Game over" banner; all published). Nim added 2026-10-08 (checked by the developer on the live
site). Sound published 2026-10-09 (heard by the developer). Face names
published 2026-10-09.*

## Goal

Simple web games for the developer's grandkids, all reached from one home
page. So far:

- **Tic-tac-toe**
- **Matching cards** (turn cards over two at a time to find the pairs)
- **Connect Four** (drop pieces into columns; 4 in a row wins)
- **Count to 9** (turn over numbered cards in order, 1 to 9)
- **Snakes and Ladders** (roll the die, climb ladders, slide down snakes)
- **Five Dice** (Yahtzee-style: roll five dice up to 3 times, fill the boxes)
- **Nim** (take matches from one row; whoever takes the last one wins)
- **Rock paper scissors** (against the robot)
- **Follow Me** (repeat the robot's order of faces, Simon-style)

And one for the developer (2026-10-13: "I wanted it for me"):

- **Find the Stars** (called Hidden Faces until 2026-10-14; a logic
  puzzle: one star per row, column and colour, none touching)
- **Colour Sudoku** (2026-10-19; a Sudoku whose squares are also split
  into nine coloured shapes, each holding 1-9 once)
- **Laser Lab** (2026-10-22; buy mirrors and splitters so a laser's beam
  reaches every gem, for as little as you can)

## Players

- **Ages 5-7** (early readers): mostly pictures, a few short words.
  Cheerful feedback on a win; losing is gentle.
- **Tablets and phones first** (iPad, Android, iPhone): touch only, big
  tap targets, works upright and sideways. A computer works too.

## Platform

- **A static web site on GitHub Pages**, from the public repo
  `donpark2000/Web-Games`. Nothing to install; the kids open a link.
  **Installing is optional**, for play with no connection (see "Offline
  app").
- **Plain JavaScript (ES modules), no build step.** What's in the repo is
  what's served. Tests run under Node.
- **Works in Safari** (iPad, iPhone) as well as Chrome and Edge.
- **No ads, no sign-in, nothing loaded from other sites** (no web fonts,
  no outside scripts). **One anonymous counter** for the site's stats (see
  "Stats"; developer, 2026-10-10: until then "no tracking").

## Licence

GPL-3.0 (developer, 2026-10-04), same as GP-200 Patch Manager Web.

## Structure

- **One home page** with a big picture button per game, so a third game
  is just another button. **Grouped by who can play** (developer,
  2026-10-04): **👥 Two players** first (a game with a two-player choice,
  the second player a person or the robot: tic-tac-toe, matching cards,
  Connect Four, Count to 9, Snakes and Ladders, Five Dice, Nim), then **👤 One player** (no way to play
  another person: rock paper scissors, Follow Me), then **🧩 Puzzles for
  grown-ups** (Find the Stars, Colour Sudoku, Laser Lab; developer, 2026-10-13: one
  site, kept apart). Each game in one group only; a
  group's only game is one column wide, centred.
- **A 🏠 button top-left on every game screen** (setup and play), back to
  the home page to change games, **80 px in every game** (developer,
  2026-10-14: it changed size a lot from game to game; the bigger sizes
  of tic-tac-toe and matching cards were the ones liked; from 2026-10-04
  until then it was one of the game's grid squares). **The house is drawn
  by the site**, not the 🏠 emoji: Chrome on a Linux VM with no colour
  emoji font drew a purple building (developer, 2026-10-14).
- **Every play screen fits the screen with no scrolling**, footer
  included (developer, 2026-10-04, on an iPhone 16): the grid squares
  shrink as far as needed (tic-tac-toe down to 56 px,
  Connect Four holes to 30 px, matching cards and Count to 9 cards to
  56 px; below that the
  page scrolls). Big screens keep big pieces. The setup screens scroll.
- **No zooming in on the game pages** (developer, 2026-10-23: the board
  "seems to zoom in", from a two-finger touch by accident; release 3.5):
  `src/ui/nozoom.js` cancels Safari's gesture events and any touch move
  with two fingers or more (iOS ignores the viewport's
  `user-scalable=no`), **only while the page is at its normal size**: a
  page zoomed in somehow can always be pinched back out (3.6; with 3.5
  the iPhone still zoomed, and the developer pinched it back out). **No
  double-tap zoom anywhere on the page** (3.6: touch-action
  manipulation on the whole page; until then only the boards). The
  boards also cancel each touch's end (iOS still zooms on a quick double
  tap otherwise), **caught where the touch's element can't have been
  redrawn** (3.7: a tap on a Laser Lab piece redrew it, its touch's end
  reached nothing, and a double tap zoomed): a Laser Lab square's
  picture takes no touches and its shop's buttons are kept; Colour
  Sudoku, which redraws its squares and digits on a tap, catches the end
  on the touched element itself. One
  finger still scrolls. The home page and log.html keep zoom. Logged
  ("zoom"): each pinch blocked or that couldn't be cancelled, and every
  change of zoom with the touches just before it and whether the element
  touched had been redrawn.
- **A small footer on every page:** "© 2026 Donald Parker · Free software
  under the GPL-3.0 · Source code · Stats" (links to the GitHub repo and
  the stats; developer, 2026-10-04, "Stats" 2026-10-10). **At the bottom of the screen** when the page is shorter
  than the screen, under everything when it's longer; "Source code"
  **opens in a new tab**, so the game stays open (developer, 2026-10-04).
  Little space around it (16 px above, 12 px below the page), so the play
  screens fit a phone.
- **Shared styles**: `css/site.css` (every page), `css/game.css` (the
  game screens' setup panels, including the three-way "Who's playing?"
  and the two-choice "How hard?" / "How long?", turn line, buttons),
  `css/cards.css` (the
  flipping cards of matching cards and Count to 9), then each game's own.
- **Game rules kept apart from the screen code**: rules in `src/core/`
  (no DOM or UI code, unit-tested in Node), screens in `src/ui/`.
- **A debug log** (standards §1), **never on the game screens**
  (developer, 2026-10-07). Every page logs all the time; the lines are
  kept on the device (the browser's localStorage, the newest 3000 lines,
  each page's under a heading with the date, time and screen size) and
  never sent anywhere. **`log.html`** shows them, with **Save log** (a
  file with browser and device details), **Copy** and **Clear** (asks
  first). **Reached by its address, or by tapping the home page's version
  line** ("sort of hidden": it looks like plain text; developer,
  2026-10-11: the installed app has no address bar). (Until 2026-10-07: a
  panel on screen with `?dev`; until 2026-10-11 nothing linked to it.)

## The games (first version)

### Tic-tac-toe

Agreed 2026-10-04 from mockups v1-v2 (journal). The mockups are private
Claude artifacts: [Tic-Tac-Toe Mockup](https://claude.ai/artifact/Y4LgG7JDqk9KBzH3wngEWY)
(version 2) and [Tic-Tac-Toe Faces](https://claude.ai/artifact/DizY1LaW5xgCiXzBbfWxaa).

- **Faces instead of X and O.** Each player picks a face; it fills the
  squares they take. **Drawn faces** (our own SVG, not emoji): bear, cat,
  dog, bunny, fox, panda, pig, frog, lion, mouse, monkey, chick,
  grandma, grandpa, plus the robot (computer only), each with a fixed
  name (see "Face names"; girl and boy dropped 2026-10-09). Each has a
  **normal**, a **winner** and an **"aww"** version (worried eyebrows, a
  small frown, no tears; added 2026-10-04, developer). The winner's
  squares and the "wins!" line show the winner version.
  Emoji were dropped: no smiling version for most animals, and they look
  different on each device.
- **Setup screen** ("New game"): "Who's playing?" first: **Me and the
  robot** (the robot is preselected) or **Two players**. Then the face
  pickers: against the robot only your own (no player 2 panel; developer,
  2026-10-04). **Both players can never have the same face** (the other
  player's face is greyed out). Then **who goes first**: take turns,
  winner goes first, or loser goes first. After a tie, the other player
  starts next. Player 1 (the child, against the robot) starts the first
  round. "Play!" stays greyed, with the reason, until the faces are
  picked.
- **Game screen**, top to bottom: whose turn it is ("<face>'s turn"; the
  robot "is thinking..." for 0.8 s), the grid, a **scoreboard** (a dark,
  flat strip, unlike the grid; wins per face, ties in the middle; outlines
  whose turn it is; one grid square of space above it, and its faces as
  big as on the grid, developer 2026-10-04), then the buttons **Play again** (same faces, grid
  cleared; mid-round it restarts the round unscored) and **New game**
  (back to setup, last picks kept). Scores start at 0-0 on Play!.
- **Each player's squares are tinted** their colour (orange / blue).
- **Scorecard cheer at the end of a round** (from matching cards,
  developer 2026-10-04): the winner's scorecard face shows its winner
  version, grows (1.4x; the faces are already big) and wiggles; the
  loser's shows its "aww" version; a tie: both cheer. The growing and
  wiggling lasts about 2.8 s; the **smiling and "aww" faces stay until
  the next round** (Play again or New game) (2026-10-04: the developer
  didn't see the aww face when it lasted only 2.8 s).
- **Win:** the squares that didn't win are blurred out; the 3 winning
  squares are highlighted and show the winner face. A tie dims the grid:
  "It's a tie!".
- **The robot is beatable** ("not too aggressive"): one level; takes a
  win 75% of the time, blocks 55%, likes the centre, otherwise random.
  Tunable.
- The rules are written so that a networked mode (each player on their
  own device) could be added later without rewriting them (journal, Q1;
  that mode was dropped 2026-10-04: GitHub Pages can't pass moves
  between devices).

### Matching cards

Agreed 2026-10-04 from mockup v1 (journal):
[Matching Cards Mockup](https://claude.ai/artifact/HNSrgzfwREctAqTTJZ7t4A)
(private Claude artifact, version 3).

- **Cards face down in a grid**, all with the same back (a yellow star on
  teal-blue dots). Each turn a player turns over two. A match stays face
  up, tinted the finder's colour, and scores a pair ("A match!", 0.6 s);
  a mismatch shows "Not a match" for 1.5 s, then turns back. **The turn
  passes either way.** The round ends when the last pair is found.
- **Setup screen** like tic-tac-toe's: **Just me** or **Two players**
  (no robot for now), face pickers (two players never share a face),
  **How many cards?** (3x4, **4x4 default**, 4x5, 4x6, 5x6, 6x6; sizes
  whose cards would be under 56 px on the screen are greyed, with a
  note), who goes first (two players only; same three choices).
- **Pictures: the drawn faces** (the 15, robot included) less the
  players' picks; when a grid needs more pairs than that, some faces
  appear 4 times. No timer.
- **Play screen**: 🏠, the turn line, the grid (sized so the whole page fits the screen,
  turned sideways when that gives bigger cards; grids too big for that
  with cards of at least 56 px keep bigger cards and the page scrolls),
  then **two scorecards**: **This game** (dark
  strip, pairs per player, outlines whose turn it is) and **Games won**
  (light, smaller; wins and ties; reset on New game). Then Play again /
  New game, as in tic-tac-toe.
- **Just me**: "Find the pairs!"; the first card shows pairs found of
  the total and turns taken; the second shows the **best** (fewest
  turns) for that grid size; the end says "All found in N turns!".
- **Cheers on the scorecard**: on each pair, the finder's face shows its
  winner version, grows to 1.35x and wiggles; at the end the winner's
  (both for a tie) grows to 1.8x for about 3 s and the loser's shows its
  "aww" version; those smiling and "aww" faces stay until the next round,
  as in tic-tac-toe.
  The turn line says "<face> wins!" / "It's a tie!".
- The developer's own photos (family, pets) may come later.

### Connect Four

Agreed 2026-10-04 (journal, "Connect Four built"): Claude's proposal,
accepted as is ("Sounds good"); no mockup, since the setup, faces and
scoreboard are tic-tac-toe's (the developer).

- **Everything but the board is tic-tac-toe's**: the setup screen (Me and
  the robot / Two players, face pickers, who goes first), the turn line,
  the dark scoreboard with ties, the end-of-round scorecard cheer and
  "aww" face, Play again / New game, the robot "is thinking..." 0.8 s.
- **The board: 7 columns by 6 rows**, a yellow frame with round holes.
  Each player's pieces are discs showing their face, tinted their colour
  (orange / blue). **Tap anywhere in a column**: the piece falls to the
  lowest empty hole (a short falling animation with a small bounce).
  A full column can't be tapped.
- **4 in a row wins**: across, down or diagonal. The winning pieces (all
  of them, if one move makes two lines) are ringed, grow a little, show
  the winner face and wiggle; the rest are blurred out, as in
  tic-tac-toe. A full board with no 4 is a tie: the board dims.
- **Sized to the screen**: the board is the page width (at most 520 px),
  smaller when needed so the whole page fits the screen.
- **Against the robot**, the setup screen has no player 2 panel, as in
  tic-tac-toe.
- **The robot is beatable**, like tic-tac-toe's: takes a win 75% of the
  time, blocks 55%, half the time avoids a column that would let the
  other player win on top of it, otherwise plays at random, leaning
  towards the middle columns. Tunable (`ROBOT_TUNING`).

### Count to 9

The developer's own game, agreed 2026-10-04 (journal, "Count to 9: the
developer's game"); no mockup (the screens are matching cards' with
numbered cards).

- **9 cards face down in a 3x3 grid**, numbered 1 to 9 in a random order,
  with matching cards' back. A player turns cards over one at a time: as
  long as each is the next number, they keep going. A wrong number
  **flashes red for 1.5 s** ("Oops!"), turns back, and the turn passes.
- **Two levels** ("How hard?"): **⭐ Easy** ("Numbers stay up"): the
  numbers already counted stay face up and the next player carries on
  from the next number (the count is shared). **⭐⭐⭐ Hard** ("A miss: back
  to 1"): a miss turns every card back and the next player starts at 1.
  Easy is preselected.
- **Whoever turns over the 9 wins**, in either level. No ties.
- **Who's playing?**: **Just me**, **Me and the robot** (preselected) or
  **Two players**; face pickers (player 2's only for two players), who
  goes first (not alone), as in the other games.
- **Cards**: a big number with that many dots under it, laid out like a
  die (for a child not sure of 7 vs 8). Counted cards are tinted the
  colour of whoever counted them.
- **Turn line**: "<face> <name>, find <n>" (alone: "Find <n>"); the robot "is
  thinking..." 0.8 s before each card it turns over.
- **Scoreboard** (dark strip): games won per player. **Just me**: the
  turns this round and the best (fewest turns) per level, with a 🏆;
  the end says "1 to 9 in N turns!". The end-of-round scorecard cheer and
  "aww" face, Play again / New game and the 🏠 as in the other
  games; the page fits the screen with no scrolling.
- **The robot never peeks**: it only knows cards it has seen turned over,
  each remembered with a **40% chance in easy, 30% in hard**
  (`ROBOT_TUNING.remember`, tunable; was 60% in both, too strong,
  "especially in hard mode", developer 2026-10-04).
  It takes the next number when it remembers where it is, otherwise it
  guesses among the face-down cards it doesn't remember.
- Later, maybe: a "How many cards?" choice (count to 6, 9, 12 or 16).

### Snakes and Ladders

Agreed 2026-10-05 from mockup v3 (journal):
[Snakes and Ladders Mockup](https://claude.ai/artifact/6zYeLSTePYJ2A295izWTM5)
(private Claude artifact, version 4). Board size 6 x 6: Claude's
recommendation, left to Claude ("Perfect. Please build the game").

- **Everything but the board and die is Connect Four's**: the setup
  screen (Me and the robot / Two players, face pickers, who goes first),
  the dark scoreboard (games won; no ties), the end-of-round scorecard
  cheer and "aww" face, Play again (a new board; mid-round not scored) /
  New game, 🏠, footer, debug log.
- **Board: 6 x 6, squares 1 to 36** winding back and forth from the
  bottom left; 36 (top left) has a 🏆. Drawn wooden ladders and friendly
  green snakes. Both pieces start on 1. Pieces are the players' faces,
  ringed in their colour; two on one square sit side by side.
- **A new board every game**, made by rules: 4 ladders and 4 snakes; never
  on 1 or 36; each moves you at least 5 squares and spans 1 or 2 rows,
  never more columns sideways than rows; no square used twice; no snake in
  the last row; none crossing; the snakes together take away 60-90% of
  what the ladders give (the developer: snakes looked longer than
  ladders). `BOARD_RULES` in `src/core/snakes-ladders.js`.
- **Top row: 🏠, the words, the die.** The die waits as a 3D cube (no face
  toward you) outlined in the colour of whose turn it is; tap it to roll.
  It tumbles, then shows one flat face, a dot going with each hop, until
  the turn is over (the developer: a face on the die didn't look like a
  die).
- **A turn:** "<face> rolled 4", the piece hops one square per dot; on a
  ladder's foot "Up the ladder!" and it climbs (happy face, normal at the
  top); on a snake's head "Wheee! Down the snake." and it slides along the
  snake ("aww" face until that player's next turn). The robot "is
  thinking..." 0.8 s and rolls by itself.
- **Exact roll to finish:** extra dots hop back from 36 ("Too many! Back
  5"). Whoever lands on 36 wins.
- **Sized to the screen:** the squares are the biggest that let the page
  fit with no scrolling (56 px on an iPhone 16, at most 520 px of board);
  the die is one square, at least 48 px.

### Five Dice

Yahtzee-style, agreed 2026-10-06 from mockup v5 (journal):
[Five Dice Mockup](https://claude.ai/artifact/JJKuS2fc4kpTo7YDdDDWKk)
(private Claude artifact, version 5). Not called "Yahtzee" (Hasbro's
trademark); "Five Dice" agreed by the developer (2026-10-06).

- **Setup:** Count to 9's **Who's playing?** (Just me / Me and the robot,
  preselected / Two players) and face pickers, then **How long?**: 🎲
  **Short** (7 boxes: 1s-6s and 5 the same; preselected) or 🎲🎲🎲
  **Long** (all 13 boxes plus the bonus). **No "Who goes first?"**
  (developer: not relevant to a dice game): players take turns starting
  each game, player 1 the first.
- **Play screen**, top to bottom: 🏠 and the words; five dice and a
  yellow **Roll** button (three dots: rolls left); the score sheet; the
  dark scoreboard (points this game, games won; "Short"/"Long"; Just me:
  points and the best per length 🏆); Play again / New game. Sized so
  the page fits the screen (rows and dice grow together; 40 px rows and
  48 px dice on an iPhone 16).
- **One score card at a time** (developer, 2026-10-07: on a phone the
  long game's two columns were small, and which was whose was confusing):
  during a game the sheet shows only the card of whose turn it is, the
  robot's too; it **switches when the turn passes** (after the 3 s Undo),
  so the next player sees their own card before rolling. **When the game
  is over, both cards side by side.** The player's face, on their colour,
  heads each column; during a long game, **one face across the sheet**
  instead of one per panel (developer, 2026-10-07: both halves are one
  player's, one turn). Short and long alike (developer: the same look in
  both).
- **A turn, up to 3 rolls:** the dice wait as Snakes and Ladders' cube in
  the player's colour; the first Roll rolls all five. After that, **tap a
  die to pick it up and roll it again** (it lifts, tilts, turns the
  player's colour; tap again to put it back); dice not tapped stay put
  (developer: like real dice). **Roll with none picked up lifts all five**
  and asks "Roll them all?"; a second Roll rolls them.
- **Scoring: one tap on a box** (developer: two taps were tedious). After
  a roll, each empty box in that player's column shows what it would
  score, faded. After scoring, the Roll button is **↩ Undo for 3 s** (a
  bar running out), then the turn passes. No undo for a roll (undoing
  after seeing the new dice would be a free extra roll).
- **The screen does all the adding.** Pictures, not words: a die for
  1s-6s; 3 dice (3 the same), 4 dice (4 the same), 3 + 2 dice under a roof
  (full house, 25), dice as stairs (4 in a row 30, 5 in a row 40), 5 dice
  and a star (5 the same, 50), a "?" die (anything, the total). Long: two
  panels side by side, the 1s-6s plus a **bonus** row (a bar filling to
  63, then ⭐35) on the left, the other 7 on the right; short: one panel.
  No extra 5-the-same bonuses or "joker" rules.
- **Tap a picture: a pop-up** with the picture, its name, the rule in a
  few words, an example roll and its score, and on your turn "Your dice
  now: N" (the bonus: each player's 1s-6s "of 63"). **Only the ✕ closes
  it** (developer, 2026-10-06; "tap anywhere to close" dropped). Another
  picture shows that one; taps elsewhere work as usual.
- **The robot** shows what it does at a person's pace: thinks before its
  first roll, looks at each roll, **picks up the dice to roll again one at
  a time** (all five at once, as a person's "Roll them all", developer
  2026-10-06), shows its box pulsing before scoring (`ROBOT_WAIT` in
  `src/ui/five-dice.js`: 1.2 s, 1.6 s, 0.5 s per die, 0.9 s, 1.6 s,
  1.5 s). **It plays its best** (developer, 2026-10-06: to show good
  play): the most points on average over the rest of the game, worked out
  exactly (`src/core/five-dice-best.js`). Short game: worked out on the
  spot. Long game: a 1 MB file of values (`data/five-dice-long.bin`, made
  by `tools/five-dice-table.js`), loaded when a long game against the
  robot starts. Its average: 70.4 points short, 245.9 long (the published
  best, James Glenn). Against a simple player it wins about 70% short,
  93% long (journal, "Five Dice: the robot plays its best").
- 🏠, footer, end-of-game scorecard cheer and "aww" face, debug log as in
  the other games. Ties possible ("It's a tie!").

### Nim

The developer's game, agreed 2026-10-08 from mockup v1 (journal):
[Nim Mockup](https://claude.ai/artifact/3sRohn5n7h6VaGBU394722)
(private Claude artifact, version 1).

- **Three rows of drawn matchsticks: 3, 5 and 7**, centred on a wooden
  tray. On your turn take **one or more matches from one row** (the whole
  row too). **Whoever takes the last match wins** (developer; the other
  way round works too, and switching mid-game was left out: "might just
  make it more confusing").
- **Setup:** a rules panel ("Take 1 or more matches from one row. Take
  the last match to win!" under a small 3-5-7 picture); **Who's
  playing?** (Me and the robot, preselected / Two players), face pickers,
  **How hard?** (robot only; just "⭐ Easy" and "⭐⭐⭐ Hard", no line
  under them: developer, 2026-10-08, "robot doesn't know the trick" won't
  inspire anyone to play), **Who goes first?** (the usual three).
- **Taking: tap each match, then Take** (developer). A tapped match lifts
  and tilts, on the player's colour; tap again to put it back. The button
  says how many ("Take 2"), greyed until one is picked. A tap in another
  row drops the first row's picks, and the turn line says "One row at a
  time!" for 2 s. Taken matches fly off and leave their places empty; no
  row numbers or counts.
- **The end:** the last match (or matches) stays, in the winner's colour,
  and wiggles; "<face> wins!"; the scorecard cheer and "aww" face as in
  the other games. No ties. The dark scoreboard counts games won.
- **The robot** thinks 0.8 s, lifts its matches one at a time (0.45 s
  each, the rightmost first), waits 0.7 s, then takes them (`ROBOT_WAIT`
  in `src/ui/nim.js`). **⭐ Easy** ("not stupid or random", developer):
  looks one move ahead: takes the win when it can, never leaves just one
  row, otherwise any move (a child who plays sensibly wins about half the
  time). **⭐⭐⭐ Hard** (plays its best, to learn from): the
  exact method (leaves the rows' XOR at 0), Easy's move when it can't.
  From 3-5-7 whoever goes first can always win, so a child who has
  worked it out beats Hard by going first.
- **Sized to the screen:** the matches are the biggest that let the page
  fit with no scrolling (43 px on an iPhone 16, at most 64 px). 🏠,
  footer, debug log as in the other
  games.

### Rock paper scissors

The developer's design, agreed 2026-10-04 from mockup v2 (journal):
[Rock Paper Scissors Mockup](https://claude.ai/artifact/KpNrFFah3PDgt3xhs8VgTX)
(private Claude artifact, version 2). Built and published 2026-10-04.

- **You against the robot only**: no "Who's playing?" choice and no "who
  goes first". The setup screen is the face picker, "You play the robot.
  First to 3 wins!" and Play!.
- **A round:** the robot picks first, at random, on a face-down card (the
  matching cards' back): "🤖 has picked!". A countdown **1, 2, 3** (0.7 s
  each; the robot's card bobs on each number); the three picture buttons
  (drawn rock, paper, scissors, not emoji) are greyed until "3" ("Pick
  one!"), then wait as long as needed. **The moment you tap**, your pick
  shows and the robot's card turns over. Waiting gains nothing: the
  robot's pick was fixed first.
- **The result is acted out:** the winning card lunges at the other,
  which shakes and greys; "Rock smashes scissors!" / "Paper covers rock!"
  / "Scissors cut paper!". The same pick: "Same! Go again.", not counted.
- **Rounds start by themselves**: "Ready?" 1 s before a game's first
  round; the result shows 2.5 s (1.5 s after "Same!"), then the next
  countdown. No button between rounds.
- **First to 3 wins the game**: the dark scoreboard shows 3 stars each.
  At 3 the game stops on "<face> wins!", with the scorecard cheer and
  "aww" face, until **Play again** (a new game; mid-game it restarts the
  game, not counted) or **New game** (back to setup).
- **Games won**: a light second strip, as in matching cards; Play again
  keeps it, New game resets it.
- 🏠, footer, no scrolling, debug log as in the other games.

### Follow Me

Simon-style, one player. Agreed 2026-10-09 from mockup v2 (journal):
[Follow Me Mockup](https://claude.ai/artifact/CYBaCqBjipGMo88xYWr8tJ)
(private Claude artifact, version 2), plus "How many faces?", agreed for
a v3 that was skipped (developer: "go straight to publish").

- **Setup:** a rules panel (the four pads in small: "Watch the robot.
  Then tap the same faces in the same order!"), **Pick your face**, **How
  many faces?** (**4**, 2x2, preselected; **6**; **9**, 3x3; each button
  a small grid), **How hard?** (⭐ Easy ❤️❤️❤️ / ⭐⭐⭐ Hard ❤️: the hearts
  only, no "faster" or other words: developer, 2026-10-09), Play!.
- **The pads:** each its own face, colour and note: frog (green), chick
  (yellow), pig (pink), bunny (blue), then fox, panda, lion, mouse,
  monkey, cat (`PAD_FACES` in `src/core/follow-me.js`), **never your own
  face** (the next one comes in). Notes from one pentatonic scale, low to
  high in reading order (4 pads: G4 C5 E5 G5, as in the mockup).
- **A round:** "Ready?" 1 s; the robot: "Watch me!" (1 s), each pad lights
  (bright colour, smiling face, its note) in turn. Then the turn line says
  "Leo's turn!", **with no sound** (developer: a ping after the robot's
  notes is one sound more than the faces shown). Each tap lights the pad
  and plays its note; a row of dots fills, one per step. All right:
  "Yes! 3!", **with no sound** (developer, 2026-10-09: a ding covered
  the last note), then **3 s of quiet** from your last note to the
  robot's first ("Yes! 3!" 2 s, "Watch me!" 1 s; developer, 2026-10-09:
  2 s still felt fast), and it shows the order again with one more step.
  Never the same pad three times running. No time limit.
- **A miss:** "uh-oh", the tapped pad shakes, the right one blinks twice,
  a heart is lost. Hearts left (Easy): "Oops! Watch again." and the same
  order is shown again. None left (Hard: the first miss): "Leo got 5!
  New best!", the sparkle and the scorecard cheer (the smiling face stays
  until the next game); a game that ends at 0: "Try again!", no sparkle.
- **Game over** (agreed 2026-10-09 from mockup v3): 2 s after the last
  miss (after the right pad's blink) the pads dim and a **"Game over"
  banner** sits over them with **Play again** (big, yellow) and **New
  game** (developer: not during a game, so a stray tap can't restart
  it). The 🏠 stays outside the banner and works while it shows.
- **Give up** (built 2026-10-15, journal Q23; developer: "Every game
  should have a 'give up' or 'start again' option"): a small 🏳 Give up
  under the scoreboard all through a game (kept in its place, only
  hidden, at the end, so the pads don't move). It **asks first**, in a
  card over the dimmed pads like the banner: "Give up this game?" **Yes**
  / **No**, with the robot stopped. Yes ends the game as the last miss
  does: "Leo got 3!" (the score counts for the best), then the Game over
  banner. No carries on: "Ready?" and the robot shows the order again
  from the start (or adds its next step if the last order was right).
- **Speed:** both start with each step lit 0.45 s and 0.17 s between.
  Easy stays at that all game; Hard gets 6% quicker each round, down to
  0.26 s lit (`LEVELS`). (Easy was slower, 0.65 s and 0.28 s, until
  2026-10-09: the developer found it harder to remember.)
- **Scoreboard** (dark strip): your face and name, steps in a row this
  game; the hearts and the level; 🏆 the **best for this size and level**
  ("best (9, Hard)"), kept for the visit, across New game (7 on 9 faces is
  much harder than 7 on 4).
- **Sized to the screen:** the pads are the biggest that let the page fit
  with no scrolling, at most 200 px (on a 393 x 760 phone: 174 px for 4,
  132 px for 6, 112 px for 9). 6 is 2 across and 3 down on an upright
  phone, 3x2 when that gives bigger pads (wide screens); a phone held
  sideways can't fit them, so it scrolls, 3x2 at 56 px. A long order makes the dots smaller, never a second
  line.

### Find the Stars

(Called **Hidden Faces** until 2026-10-14. The developer: a coloured face
over a square can hide that square's colour, which the logic needs; the
white faces worked best, and for a grown-ups' game the cute faces matter
less, so one fixed symbol. The files and code keep the old name:
`hidden-faces.html`, `src/core/hidden-faces.js`, a found star is a
'face' mark; renaming the page would break bookmarks and installed
copies, reset its stats and lose the kept progress.)

A logic puzzle for the developer (like the "Zoodoko" / "Meowdoku" phone
games; the puzzle is Star Battle with one star). Agreed 2026-10-13 from
mockup v2 (journal):
[Hidden Faces Mockup](https://claude.ai/artifact/HiQ1FiMsGUMRxGfoYfNXRs)
(private Claude artifact, version 2). Name, hearts, hint counts and
Auto ✕ on by default accepted as proposed; rubbing out kept (developer).

- **The rules:** an N x N grid in N joined colour regions hides N stars:
  **one per row, one per column, one per colour**, and **no two stars
  touch, not even at a corner** (developer: "a key part to the logic").
  Sizes **6 x 6 to 10 x 10**. Every puzzle has exactly one answer,
  reachable by reasoning alone (no guessing).
- **Home:** the only game in **🧩 Puzzles for grown-ups**, below the
  other two groups; its picture a 5 x 5 puzzle under way.
- **The star:** white with a dark edge, the same everywhere, so it
  stands out on every square colour and is never taken for one
  (developer, 2026-10-14). No face picker.
- **Setup:** the rules beside a solved 5 x 5; **Size** (6 x 6 to 10 x
  10); **When you find a star:** **Auto ✕** (default: its row, column, colour and
  neighbours get ✕s) or I'll do it; Play!.
- **Play:** 🏠, the star and "8×8 · puzzle 1" (one line), 🔊; hearts ❤️❤️❤️, "3 of
  8 found", a clock; the board as big as fits with no scrolling (thick
  lines between colours, thin inside one); a **hint bar always 5 lines
  high** (a hint never moves the board; 3 for the words, and since
  2026-10-16 a greyed hint's blank line and "tap to light this hint
  again"), **empty and hidden until the
  first hint** (developer, 2026-10-13: "Tap 💡 for the next step, explained"
  wasn't needed, and stayed with no hints left), then the last hint's
  words, greyed (see "Hints"); **Undo**, **💡 Hint** (3 per
  puzzle), **👁 Show** (uncovers a star; 1 per puzzle), **🏳 Give up**
  (2026-10-15, Q23: one row on phones from 320 px wide, the words a
  little smaller under 386 px, and smaller still if the phone's fonts
  need it: the screen shrinks them until none is cut; developer,
  2026-10-16: on the iPhone the row, wider in Safari's fonts, pushed
  the whole play screen right. No row of buttons can widen the page: a
  button too wide is cut instead). Give up **asks first**, in the tools'
  place: "Give up?" **Show me how** / **Just end it** / **No** (a touch
  on the board is No; 2026-10-18, before that "Give up this game?" Yes /
  No); Just end it ends the game (see "The end"); Show me how walks
  through the rest (see "Show me how").
- **✕s are drawn lines**, nearly black, about 60% of a square (developer,
  2026-10-14: the first ✕s, 40% and see-through grey, were hard to see
  on a phone at 10 x 10); a wrong look's red ✕ is bigger (84%). **A
  hint's ✕** is the same ✕, white with a dark edge like the star
  (developer, 2026-10-15, option B of the
  [Hint Colour Mockup](https://claude.ai/artifact/UHCmnZzkkCyGmscpWyDNxK),
  version 1: the lines dark at 23 under white at 13); since 2026-10-18
  the edge is **black and thicker**, 33 under the white 13 (developer:
  edge 3 of the
  [Give Up Walkthrough Mockup](https://claude.ai/artifact/PmNc95i5mPVZVPmtnUkDEH),
  version 5; the old edge was about 1 px on a 10 x 10).
- **Taps:** an empty square: ✕; a ✕: look under it. A star pops in (with
  Auto ✕, the ✕s around it); a wrong look is a red ✕ that stays, shakes
  and costs a heart; the third ends the game. **Drag** from an empty
  square: ✕ every square passed; **drag from a ✕: rub ✕s out**. **Undo
  takes back ✕s, rub-outs and wrong looks, one square at a time, last
  first** (a drag is one step per square: developer, 2026-10-14, a long
  drag easily went a square too far and Undo took back all of it)
  (developer, 2026-10-13:
  "being able to undo errors is kind of the whole point of undo"; until
  then never a look): the red ✕ is a ✕ again and the heart comes back,
  but the mistake still counts in the result. A found star and a hint's
  step (its star, its ✕s) are never taken back, and no drag changes a
  hint's ✕ (developer, 2026-10-15: they're certain, like a found star);
  a step with nothing left to change is skipped, and Undo is
  greyed when nothing would change. **A double tap is a ✕ and a look**
  (developer, 2026-10-14: the 0.4 s wait for a slip, built 2026-10-13,
  was too long, and Undo takes back a wrong look); a double tap on the
  last heart still ends the game (developer, 2026-10-14: OK).
  **A look where there's known to be no star costs nothing** (developer,
  2026-10-15: after a hint, a double tap on a square it crossed out cost
  a heart, and Undo kept the mistake): a square a found star rules out
  (its row, column, colour or a neighbour, Auto ✕ or not) or a hint
  crossed out (a hint's ✕: a tap on one looks).
  The ✕ stays and wiggles, a tick, and the hint bar says why for 2.5 s
  ("No star here: row 3 already has its star.", "No star here: a hint
  crossed it out."); no heart, no mistake. Such a look tells nothing new,
  so it's no free guess; anywhere else a wrong look counts as before.
  **Two quick taps never zoom
  the page** (developer, 2026-10-13: the iPhone zoomed in on a ✕-then-look
  and there was no way back): the board cancels each touch's end.
- **Hints** say the next step in words **and take it** (developer,
  2026-10-15: "It seems unlikely that if one asks for a hint they would
  chose to ignore it"): a hint that points at a star (one square left, a
  wrong ✕) places the star, and hint ✕s go on the empty squares it rules
  out, Auto ✕ or not; any other puts hint ✕s on the squares it crosses
  out. The player's own ✕s stay theirs. A star placed by a hint can win
  the game. The order: a
  wrong ✕ first, then ✕s a found star already implies, then the solver's
  next step (one square left; a unit's squares all inside another; a
  star here would rule out all of a unit's squares; k colours in k rows
  or columns; try-a-star). **Spotlight:** squares the hint isn't about
  fade, **only their colour** (since 2026-10-18, fade E of the Give Up
  Walkthrough Mockup; developer: the whole square faded and white ✕s
  were hard to see, "Being able to see the whole grid is important to
  understanding"): their ✕s, stars and the lines between colours stay at
  full strength, their colour as the old fade showed it (the colour at
  30% of its chroma, 35% of it over the page's sky; worked out in the
  script, `fadedColor`, as CSS's `oklch(from ...)` needs Safari 16.4+);
  those it is about keep their colour with a dark edge, **lifted by a
  shadow** above their neighbours (the same size, so no neighbour's
  edges are covered); the square
  it means has a thick black ring in a white one, named in the text
  ("the ringed square (row 3, column 1)") (developer, 2026-10-13: in v1
  "it is not clear where 'here' is"). The squares it crossed out carry
  its hint ✕s (until 2026-10-15, before hints took their step, a
  blinking ✕ over each).
- **While a hint is lit, the tools row is its own** (developer,
  2026-10-16, Q25: "not clear how to accept it and get back to game
  play"): **❓ Why?** (when it has one) and **✓ Got it**, each half the
  row (Got it the whole row for a hint with no Why?). Got it puts the
  hint out, as a touch on the board does; Undo, Hint, Show and Give up
  come back.
- **The last hint's words stay** (developer, 2026-10-15: to check it was
  understood after following it): ✓ Got it or a touch on the board takes
  the hint off the board, but its words stay in the bar, greyed, until
  the next hint, 👁 Show or the end, with a blank line and then a
  centred line under them, the words' size: **"(tap to light this hint
  again)"**
  (developer, 2026-10-16: the words speak of "lit squares" with none
  lit; a passing note and a ↻, tried first, went too soon and looked
  like a browser's refresh; then "Add a blank line ... and center
  justify it"; "keeping the same font size as the hint text"). The bar
  is two lines taller for them (on a 393 x 760 iPhone the board keeps its
  size: the screen's width limits it there; on a 375 x 667 phone the
  squares give up 3-4 px, and a 10 x 10, already at the smallest
  squares, scrolls 4 px). **A tap on the greyed
  words lights it again** (free: the same hint), with its ❓ Why?. Kept
  with the game, greyed or lit.
- **❓ Why?** (developer, 2026-10-14, from the agreed
  [Why Hint Mockup](https://claude.ai/artifact/1ogeXejM7WRrnBtGFKqXq5),
  version 1: where to put a star or a ✕ was clear, "but the reasoning is
  not always clear"): while a hint shows, **❓ Why?** is in its row
  (above), free (no hint used); in the Why? it reads **💡 The hint** and
  goes back. ✓ Got it or a tap on the board ends both. The deeper reason, on the
  board and in one line of words in the hint bar:
  - **"would rule out":** a pale pretend star in the ring; on each lit
    square a label saying why it would go (**touch**, **row**, **col**,
    **colour**); the row, column or colour that would run out outlined
    in red dashes, and the pretend star's colour dotted when a square
    goes for being that colour. "A star on the ringed square would rule
    out row 6's last 4 squares (lit): 3 touching it, 1 Pink like it. No
    star left for row 6!"
  - **"all inside"**, **"k in k rows"** and **"only one left":** the
    units outlined in blue (solid: the ones whose squares are left;
    dashed: the ones they lie in), and the reason in words ("Row 1's
    star is on a lit square, and they're all in Brown. So Brown's one
    star is row 1's: no star in the rest of Brown.").
  - None for a wrong ✕ or ✕s a found star implies: their words are the
    reason.
- **Show me how** (Give up's walk-through; developer, 2026-10-18: giving
  up was "very unsatisfying since I learn nothing from it"; agreed from
  the [Give Up Walkthrough Mockup](https://claude.ai/artifact/PmNc95i5mPVZVPmtnUkDEH),
  versions 1-5): the rest of the puzzle **from the player's board**, a
  step at a time, each **shown and taken as a hint is** (its words, the
  squares lit, ❓ Why?, its star or hint ✕s), with no hint used
  (`walkStep` in `src/core/hidden-faces.js`). A wrong ✕ comes first, as
  with hints; ✕s a found star implies go on with the next step, not as
  steps of their own; each "only one left" is its own step. With no step
  it can explain (it shouldn't happen) it shows the next star. The tools
  row is its own: **❓ Why?** (💡 The step in the Why?), **⏩ The rest**
  (all the steps at once, then the end) and **Next ▸** ("Finish ▸" after
  the last). **"Step 3 of 18"** in place of "3 of 10 found"; **the clock
  stops**; the board takes no taps. Kept with the game: a reload comes
  back on the same step. A whole 10 x 10 takes 16-34 steps.
- **The end:** the result in the hint bar beside **one big star**, and
  three buttons in place of the tools, so the board stays in view and
  nothing on it moves (developer, 2026-10-14: faces smiling and wiggling
  on a big board were hard to see). Solved: the bar turns pale yellow,
  a gold star pops in, bobs and throws sparkles; "Solved in 4:12!" over
  "1 mistake · 0 hints · Best 3:50" ("· 1 shown" after a Show; "New
  best!" for a best time per size); **Next** (one size up, to 10 x 10) /
  Same size / New game; **after a 10 x 10, Next / New game**, each half
  the row (developer, 2026-10-19: Next and Same size are the same thing
  there; "leave the next button and remove the same size button"). Out of hearts: a big grey star, "Out of hearts /
  The pale stars show where they were", the stars not found pale on the
  board; Try again / Another / New game. Two more ends, the same but for
  the words (2026-10-15, Q23): **given up** ("You gave up") and **no
  squares left** ("No squares left"): once no square is empty (a hint's
  ✕s count) with stars still hidden, the game ends, after 0.4 s (Claude's
  choice: a double tap's look on the last ✕ still comes first). Not
  sooner: a row, column or colour all crossed out can still be put right
  with Undo or a rub-out (developer: "OK"). The rule is `isFull` in
  `src/core/hidden-faces.js`; a full grid kept in that 0.4 s ends when
  picked up again. **Shown step by step** (2026-10-18, after Show me
  how): "Shown step by step / 18 steps · you found 3 of 10" beside a
  white star, the bar edged blue; Try again (to solve it yourself, now
  you've seen how) / Another / New game. It counts as given up: no best
  time, the puzzle not moved on.
- **Puzzles: 200 per size, made ahead of time** by
  `tools/hidden-faces-puzzles.js` into `data/hidden-faces.json` (works
  offline; 103 KB). One difficulty for now (built 2026-10-13; levels
  later): the bar mockup v2's puzzles were picked by, steps needing more
  than "one square left" in at least 60% as many as the size (about 1 in
  3 made puzzles passes). Each is stored with the seed it was made from;
  the first 200 passing seeds from n x 10000 on, so the tool always makes
  the same file. None needs "try it" (that rule is for hints). **Played
  in a shuffled order** (developer, 2026-10-19: "shuffle the existing
  order once so I start off seeing new puzzles"; until then seed order):
  shuffled with a fixed seed (`stockOrder`), the first 50 of the old
  order last, as a device may have played some of them.
- **Kept on the device** (built 2026-10-13, Claude's choice): the next
  puzzle per size ("puzzle 3") and the best time per size. **A puzzle
  counts as used as it starts** (developer, 2026-10-19, Q28: "It is less
  interesting to have to keep going through the same puzzles before
  getting to something new"): Play, Next, Same size and Another each
  bring the next one not yet started; only **Try again** plays one again
  (and a reload or another app picks up the one under way). Until then
  only a win or Another moved on, so leaving mid-puzzle, Give up or
  running out of hearts brought the same puzzle back. **After the 200th
  they come round again, in the same order** (developer: "By the time I
  get to the 200th puzzle I will have long forgotten what came first"),
  the number counting on ("puzzle 201"). **The clock stops** while the page is hidden (another app,
  the phone locked).
- **Sounds:** a tick per ✕, a ding for a star, "uh-oh" for a wrong look,
  a ping for a hint, the sparkle when solved, "aww" when out of hearts.

### Colour Sudoku

A second puzzle for the developer (2026-10-19), in 🧩 Puzzles for
grown-ups. **Built 2026-10-19 from
[Colour Sudoku Mockup](https://claude.ai/artifact/D53EsTrxeFeaFpFKwzr7wF)**
(private Claude artifact, version 4 = mockup v3.1) as it stood
(developer: "I can't try it on my phone until you build and publish
it"); what isn't marked as decided below is Claude's choice from the
mockup, to be judged on the phone (journal, "Colour Sudoku mockup v1" to
"Colour Sudoku built").

- **The rules (Extra Regions):** a 9 x 9 Sudoku (1 to 9 once in every
  row, column and 3 x 3 box) whose squares are also split into **nine
  coloured shapes of 9 squares**, each also holding 1 to 9 once
  (developer, 2026-10-19, journal Q29). Every puzzle has exactly one
  answer, reachable by reasoning alone.
- **Two rows of digits** under the board: big digits put a digit in the
  selected square, a row of smaller dashed ones write notes (developer:
  "I always found online games that have the toggle feature
  annoying"). No Notes button.
- **Digits the same as the selected square's are ringed** (a ring, not
  a disc, so the square's colour shows; developer: "The ring shows up
  better on light colors like yellow"); a note that matches is ringed
  too, and only a note that is there.
- **Notes** as big and dark as a 3 x 3 place allows (37% of a square,
  near-black), **with a white edge** to start with (N2; developer: to
  judge N1 against N2 on a phone).
- **The selected square: a ring outside it**, over the lines round it,
  so it covers none of the square's notes (developer, 2026-10-19, after
  2.0 on the phone: the band inside the square "obscures the note";
  option C of four, journal "Colour Sudoku on the phone: the selected
  square's ring").
- **No repeats when you start again** (developer, 2026-10-19, the lesson
  of Find the Stars, journal Q28): the puzzles of each level made ahead
  of time, played in an order shuffled once, **each counting as used as
  it starts**, the next one per level kept on the device, and the stock
  coming round again only after the last.
- **Easy starts with 30 digits** (developer, 2026-10-22, journal Q31:
  "yess", as in other Sudoku games, where the level mostly sets how many
  are filled in; release 3.4): the maker's puzzle with digits from its
  answer added, so it keeps its one answer and only gets easier. Harder
  starts with what the maker leaves (12-20).

As built (Claude's choices from the mockup, unless marked):
- **Setup:** the rules beside a solved puzzle; **How hard?** Easy
  ("starts with 30 digits; each digit can be found from one row, column,
  box or colour") / Harder ("starts with 12 to 20; some digits need two
  of those looked at together": "all inside", a unit's digit confined to
  another unit; words agreed with the developer 2026-10-19, after 2.0:
  the first ones' "meaning ... is not clear"; the counts in front added
  2026-10-22 with Easy's 30 digits, journal Q31, Claude's words);
  **Your notes:** Auto tidy (a digit placed comes out of
  the notes it rules out; default) / I'll do it; Play!.
- **Play:** 🏠, "Easy · puzzle 3" over ❤️❤️❤️, "52 to go" and the
  clock (beside the 🏠, so the board gets their row; as big as fit,
  smaller on narrow phones: about 12 px at 320 px wide), 🔊; the board
  as big as fits with no scrolling (38 px squares on a 393 x 760 phone,
  at least 24 px), colour fills, thick lines round the boxes; the hint
  bar (3 lines, hidden until a hint); the two rows of digits; **Undo**,
  **💡 Hint** (3 per puzzle), **🏳 Give up**.
- **Entering:** tap a square (any: one with a digit rings the same
  digits), then a digit; a digit all nine of which are placed is
  greyed. A wrong digit is red, shakes and costs a heart (the third ends
  the game); the same wrong digit again costs nothing. **Undo** takes
  back notes and wrong digits (the heart back, the mistake counted),
  never a right digit (certain, like a found star). Digits typed on a
  keyboard work too (Shift: a note).
- **Hints, as Find the Stars':** a wrong digit first (the hint takes it
  out; its heart stays lost), then the solver's next digit, with any
  "all inside" steps it needs first (their squares dashed); the hint
  **puts the digit in**, white with a black edge. The spotlight, the
  ringed square named in the words, ❓ Why? (each other empty square of
  the unit labelled with what rules the digit out, those digits ringed
  in red dots; for "the only digit left", what its row, column, box and
  colour have), ✓ Got it; a lit hint's words take the digits' rows too,
  so the board never moves; put out, its words stay greyed, "(tap to
  light it again)".
- **Give up:** Show me how / Just end it / No, as Find the Stars; Show
  me how walks the rest a step at a time ("Step 3 of 62"), with ❓ Why?,
  ⏩ The rest, Next ▸; no best time.
- **The end:** the result in the hint bar beside one big star ("Solved
  in 4:12!" over "1 mistake · 0 hints · Best 3:50" or "New best!"; "Out
  of hearts" / "You gave up" with the rest of the answer pale; "Shown
  step by step"); **Next** / **Try again** / **New game**.
- **Puzzles:** 200 per level, made ahead of time by
  `tools/colour-sudoku-puzzles.js` into `data/colour-sudoku.json` (71 KB),
  each with one answer the level's steps reach; Harder ones need "all
  inside" at least once. The first 200 kept seeds from 100000 (Easy) and
  200000 (Harder), shuffled once with a fixed seed. The maker leaves
  12-20 givens; **Easy's then get digits from the answer up to 30**
  (`EASY_GIVENS`, `addGivens`), each in a box with the fewest (at random
  among those, from a stream of the seed's own), so at least 3 in a box
  (199 of 200; one has a box with 2; 3.3's Easy had a box with none in
  121 of 200).
- **Kept on the device:** the next puzzle and the best time per level.
- **Sounds:** a tick per note, a thud per right digit, "uh-oh" for a
  wrong one, a ping for a hint or step, the sparkle when solved, "aww"
  when out of hearts.

### Laser Lab

A third puzzle for the developer (2026-10-21, "Physics Sudoku": physics
on a grid, so it stays logical), in 🧩 Puzzles for grown-ups. Called
**Mirror Light** until 2026-10-22 (developer: "Laser Lab is good").
Designed in mockups v1-v7 (journal, "A physics-and-logic puzzle" to
"Laser Lab mockup v7"):
[Laser Lab Mockup](https://claude.ai/artifact/9ydP14hwMYEm6zAfwgNtiN)
(private Claude artifact, version 7). **Built from v7 as it stood**, so
the developer can try it on the phone (a mockup can't be opened there);
what isn't marked as agreed below is Claude's choice, to be judged on
the phone. Files and storage: `laser-lab` (`laser-lab.html`,
`src/core/laser-lab.js`, `web-games-laser-lab`); the code says "lamp"
where the words say "laser".

Agreed with the developer:
- **The board:** a square grid, night-dark so the beams show, with walls
  and gems (💎). **Lasers stand beside the board**, at most one per side,
  each shining in along its row or column. **Mirrors** (white, `/` or `\`,
  both sides) turn a beam a quarter turn; **splitters** (green with dark
  stripes) let it through and turn a copy. Walls and gems stop a beam;
  **open edges** (a beam leaving the board is gone; mirrored edges were
  tried in v3-v4 and dropped: "not needed"). **A beam shining into a
  laser breaks it** (any colour; it costs as a wrong laser does, and a
  piece moved mends it).
- **Size** 6×6, 7×7 or 8×8 and **Lasers** One (yellow) or Two (red and
  blue), picked on the setup screen. With two, gems are red, blue or
  **purple** (purple wants both): each beam must reach every gem of its
  colour and no other. The two beams pass through each other. **The
  purple gem is half red, half blue**, its outline in two halves at the
  red gem's thickness (developer, v5). Lasers bright: the body always
  its full colour, on/off shown in the nozzle's aperture.
- **Each laser is an on/off switch** (developer, v4, in place of a
  ▶ Shine button): tapped on, its beam runs out square by square. Right
  (every gem of its colour lit by it, none other, no laser hit) it stays
  on; the last one right solves the puzzle. Not right: it **costs**, goes
  off, and its beam stays faint with the misses ringed. **Moving a
  piece switches every laser off.** Tapping a laser that's on switches
  it off, free.
- **A budget in place of a fixed tray** (developer, v6): pieces are
  bought, **mirror 1 coin, splitter 2 coins**, as many as you like, **paid for
  only while on the board** (taking one off gives its price back). **A
  wrong laser costs 1 coin. Hints cost 1, then 2, then 3...** in one
  puzzle (no limit but the price). **Show answer (Give up until 3.2)
  costs the puzzle's whole budget.** What's left of the budget when the puzzle is solved goes
  into the **savings**, kept over **a run of 10 puzzles**; spending past
  the budget comes out of the savings, which **may go below 0** (red).
  The savings at the end of a run are the score. No fixed tray, so no
  "use every piece"; a piece the beams don't touch is only money
  wasted. The puzzles need no single answer: a cheapest way is enough.
- **Hints and Show answer follow the cheapest way closest to the player's
  board** (fewest pieces to take off, turn or put down, keeping every
  hint's piece). A hint takes off a piece not in it (price back), turns
  one facing the wrong way, or puts down the next piece along the beam;
  a piece a hint leaves is fixed there. Show answer shows a cheapest way
  with its beams.
- **Prices read as prices:** each piece button shows the piece over "1
  coin each" / "2 coins each" (developer, v7: v6's big "1" read as a
  count; the word since 3.2).

Agreed after 3.0 on the phone (release 3.2; journal "3.0 on the phone;
release 3.1" and "Laser Lab 3.2"):
- **Words, not 🪙 and 🏦** (developer: the coin "looks like a ball - not
  meaningful", the bank "a house with a number beside it - not idea
  what that means"): **"Budget 4 of 9 left · Savings 12"** on a row of
  its own under the top, at a steady 17 px (not shrunk with the top
  line); "Budget 2 over" past it, "over" and minus amounts in red. Prices
  and costs say "coin": "1 coin each", "Hint 1 coin", "Saved 3 coins".
- **The top line just "Puzzle 4 of 10"**, at full size (no board size;
  developer: the turn line was very small, shrunk beside the 🏠 and 🔊).
- **No Quit button** (developer: "New game is the quit"); **New game
  during play** goes back to setup with the run kept, and **the puzzle
  left comes back as it was left** (developer: "Option 1: the puzzle
  comes back as it was left: pieces, coins spent, hints and clock"; a
  fresh start would be a free Try again).
- **🏳 Give up renamed Show answer**, working as before (developer:
  "give up" sounded like a retry): it asks first, "Show answer: −9
  coins?" / No; then a cheapest way with its beams, the whole budget
  off the savings, and Next ▸.
- **❤️ Try again, 3 hearts per run** (developer: "lets try per run
  first"): the board cleared, hint pieces too, and everything spent on
  the puzzle given back (pieces, wrong lasers, hints, so the next hint
  costs 1 again): the budget and savings as at the puzzle's start. It
  uses a heart; the hearts show in the status row beside the 🏠 and are
  kept with the run (a new run has 3 again).
- **↺ Clear stays free**: the pieces off but a hint's, their prices back;
  wrong lasers and hints already paid stay paid.

Agreed after 3.2 (release 3.3; journal "Purple gems spread"):
- **Purple gems in about 1 in 3 two-laser puzzles** (developer: "Keep
  the two-colour gems: about 1 in 3 two-laser puzzles at 6x6 and 7x7,
  spread through each run, and 8x8's three spread out"; 3.0-3.2 had 14
  and 15 of 100, as the seeds fell, and none in some runs). 6×6 and 7×7:
  33 of 100, 3 or 4 in every run of 10, never two side by side. 8×8: its
  3 of 50 (not remade: about 30 minutes of one core a puzzle), each in a
  run of its own.

Agreed after 3.4 (release 3.5; journal "Laser Lab 3.5"):
- **The setup's words are the developer's** (Claude added "Go over the
  budget and the rest comes out of your savings.", a rule theirs left
  out, and fixed "You goal").
- **The end says pieces and coins** (developer: "Pieces 7, cheapest 6"
  read as pieces, though both were coins; "something like 'You used 7
  pieces and 9 coins. Best solution used 6 pieces and 7 coins'"):
  "You used 7 pieces (8 coins) · hints 1 coin · lasers 1 coin" over
  "Best: 6 pieces (7 coins)"; matching the cheapest, just the first line
  (3.6, developer: "It is obvious if there is no second line"; 3.5 added
  ": the best ✓"). The coins are the pieces' (hints and
  wrong lasers after them). After Show answer: "Best: 6 pieces (7
  coins)". At a run's end the best line stays under "This one: ...".
- **See best** (developer: "an option to show the best solution if your
  solution was not the best"): at the end of a puzzle solved for more
  than the cheapest, **See best / Next ▸ / New game**; See best (free)
  shows on the board the cheapest way closest to the player's board, its
  lasers on; **Your way** goes back. The best line counts that way's
  pieces (two cheapest ways can differ: 2 of 10 7×7 two-laser puzzles
  tried). The cheapest ways are worked out 0.4 s after the sparkle starts
  (up to 0.3 s on a computer), the puzzle's stored way counted until
  then.

Agreed after 3.5 (release 3.6):
- **A gem lights as the beam reaches it** (developer: "the jewels light
  up before the laser beam hits them"): by its beam line's animation,
  not by a timer of its own; a laser broken when its line has grown (the
  animation's end). **3.7:** the gem lights as its last line **starts**
  (developer, of 3.6's lighting at the line's end: "the lag could be a
  bit shorter", lit "at the same time as the last line of the laser was
  drawn").

Agreed after 3.6 (release 3.7):
- **A tap with the other piece picked swaps it** (developer: changing
  between mirror and splitter took two taps to take the old piece off
  first): a mirror becomes a splitter (or back), **facing the same
  way**, its price changing to the new piece's; then taps turn it and
  take it off as before. A hint's piece stays as it is.

Claude's choices from the mockup, to be judged on the phone:
- **The budget is the cheapest cost + 3**, so a best solve saves 3.
- **The cheapest cost is at least 6 (6×6), 7 (7×7) or 8 (8×8)**: the
  maker walls off cheaper ways until none is left under that floor.
- **No Try again at the end** (it would let a solved puzzle be played
  again for more savings, and a shown answer be copied): the end's
  buttons are **Next ▸** (**New run** after the 10th) and **New game**
  (and See best first, 3.5, when it shows).
  ❤️ Try again (3.2) is for a puzzle under way.
- **The end's words**, in the hint bar beside one big star: "Solved!
  Saved 3 coins" ("Solved, 2 coins over" when it cost more than the
  budget) over the pieces and coins (3.5, above; until then "Pieces 6,
  cheapest 6 ✓ · hints 1 · lasers 1"); "Answer
  shown: −9 coins" (3.0-3.1: "You gave
  up"); after the
  10th, "Run over! Savings 17 coins" over "This one: saved 3 coins · Best
  run!" (or "This one: −9 coins"). The budget row says what the puzzle
  did: "Saved 3 · Savings 15", "Over 2 · Savings 10", "Answer −9 ·
  Savings 6". **The end's words shrink to fit the bar's 3 lines** (3.2:
  at 320 px wide, to about 80%; 3.1's were cut there).
- **The laser drawing:** an emitter box in its colour with three vents
  and a highlight, a dark nozzle and a small aperture, dark when off,
  glowing when on; a small burst and a crack when broken.
- **Setup:** the rules beside a solved 6×6 with one laser (not one of
  the run's puzzles); the pieces explained, with prices; **Size**;
  **Lasers**; Play!, and under it "Puzzle 4 of 10 · savings 7 coins ·
  ❤️❤️🤍 · best run 17 coins" (or "A run of 10 puzzles").
- **Play** (as 3.2): 🏠, "Puzzle 4 of 10" over the hearts (❤️ left, 🤍
  used) and a clock; under them the budget row, "Budget 3 of 10 left ·
  Savings 12" (red "Budget 4 over", the overspend shown coming out of the
  savings as it happens); the board with its lasers, as big
  as fits with no scrolling; the two piece buttons (the one picked
  lights; tap a square to put it there, again to turn it, once more to
  take it off; a tap on the other kind of piece swaps it for the one
  picked, 3.7); the hint bar (3 lines, hidden until needed); the tools
  in two rows: **↺ Clear**, **💡 Hint** with its price, **❤️ Try
  again**; **🔑 Show answer**, **New game**. Once a piece is on, the
  lasers that can be switched on pulse.
- **Try again asks first**, as Show answer does ("Try again: uses a ❤️?"
  / No), since a heart is worth more than a tap; with nothing to give
  back (no piece on, nothing paid) it uses no heart and says so; with no
  hearts left it is greyed. **The clock keeps running** through it (the
  clock is the puzzle's time, not a cost).
- **A laser tapped again with nothing moved** since it wasn't right
  says "Nothing has moved since that beam: move a piece first" and costs
  nothing; a broken one says "Move a piece and it's mended".
- **The tap area** for a laser: at least 44 px along the edge (1.5
  squares when bigger), from the board's edge out past the rim.

As built (Claude's, not in the mockup):
- **A puzzle left unfinished waits:** the run keeps it on the device as
  it was left (pieces, coins spent, hints, clock), and Play! brings it
  back, even after a restart, so leaving neither costs nor saves
  anything. (The mockup brought it back with a clean board, which
  would have undone what was spent.) A reload or a trip to another app
  also comes back to the lasers that were on and the bar's words.
- **Puzzles made ahead of time** by `tools/laser-lab-puzzles.js` into
  `data/laser-lab.json`: **100 per size and lasers, 50 for 8×8 with two**
  (about 30 minutes of one core each; more can follow), the first made from a
  fixed seed on (with two lasers, the first 33 with a purple gem and the
  first 67 without, 3.3; 8×8: its first 50, 3 purple); each stored with
  its seed, board, lasers, cheapest cost and one cheapest way. **With two lasers, both beams pass through a
  piece** of that way (the mockup's first pick rule; at 8×8 it turns
  most puzzles away). The cheapest ways that hints
  and Show answer choose from (up to 50) are worked out on the device at the
  first hint or Show answer. Run k's puzzles are the stock's from 10k on, in
  an order shuffled once with a fixed seed, the purple ones then spaced
  evenly through it (3.3; one laser: 3.0's order); after the last they
  come round again. **A run kept over 3.3's new stock** keeps its place,
  savings and hearts; a puzzle under way that is no longer at its place
  is dropped (logged "puzzle under way not picked up"), and that place's
  new puzzle starts fresh. Nothing spent on it had reached the savings.
- **Kept on the device** (`web-games-laser-lab`): per size and lasers,
  the run under way (its number, the next puzzle, the savings, the
  hearts left (3.2; a run kept before 3.2 has 3), the puzzle under way)
  and the best run. The code keeps its 3.0 names for Show answer
  (`giveUp`, result `'gaveup'`), so puzzles kept under 3.1 still read.
- (3.0-3.1: the status beside the 🏠 stacked when one row would be under
  15 px. Gone in 3.2: the budget has its own row.)
- **Sounds:** a tick per piece put down, turned or taken off; a ding
  for a beam that's right, "uh-oh" for one that isn't (or breaks a
  laser), a ping for a hint, the sparkle when solved.

## Face names

Each face has a **fixed name** (developer, 2026-10-08), with **no
renaming** ("not sure optional rename is worth the complexity"). The
names (agreed 2026-10-09): bear **Teddy**, cat **Kitty**, dog **Buddy**,
bunny **Hoppy**, fox **Foxy**, panda **Ping**, pig **Piggy**, frog
**Froggy**, lion **Leo**, mouse **Squeak**, monkey **Coco**, chick
**Peep**, **Grandma**, **Grandpa**, **Robot** (`NAMES` in
`src/core/players.js`).

- **No girl or boy faces** (developer, 2026-10-09): a fixed name can't
  fit a real child, and two brothers couldn't both be "the boy" (two
  players never share a face). Children pick an animal.
- **Where the names show:** under each face in the pickers; on every
  scoreboard (instead of "You" / "Player 1" / "Player 2"; in Matching
  cards and Five Dice above "pairs" / "points" / "won N"; under the face
  in Rock paper scissors) and on the "Games won" strips (its label on two
  lines, to keep one row on a phone); beside the face at the top of Five
  Dice's score card (left out when both long cards show at the end: the
  columns are 48 px on a phone); under your card in Rock paper scissors
  instead of "You"; and in the turn lines: "<face>
  Leo's turn" (also against the robot, instead of "your turn"), "Leo
  wins!", "Robot is thinking…", "Leo, find 3" (Count to 9), "Leo rolled
  4" (Snakes and Ladders), "Leo's turn. Roll!" (Five Dice).

## Sound

Small effects in every game, picked by the developer from a sampler
(2026-10-09; journal, "Sounds picked from sampler v1"):
[Game Sound Sampler](https://claude.ai/artifact/TfxCqWQnvPEfxg4iwX5d8c)
(private Claude artifact, version 1).

- **Made in the page** (Web Audio, `src/ui/sounds.js`): no sound files,
  nothing from other sites.
- **On by default** (developer). A **🔊/🔇 button top-right** on every
  game screen (setup and play), 48 px, turns sound off or on for all the
  games, **remembered on the device**.
- **On iPhone and iPad the sounds follow the silent switch** (developer),
  and leave any music playing alone.
- **The sounds:** a wood tick for setup choices, picking a match or a die,
  and each hop; a thud when a move lands (tic-tac-toe, Connect Four as the
  disc reaches its hole, Nim's Take, a Five Dice score); a swish when a
  card turns (Matching cards, Count to 9, the robot's card in Rock paper
  scissors); a soft dice shake; a ding for a pair, the right number, or a
  round of Rock paper scissors won; "uh-oh" for no match, a wrong number,
  a round lost, or "One row at a time!"; a climb up a ladder and a
  "wheee" down a snake; a ping for "your turn" after the robot's turn
  where it takes several steps (Count to 9, Snakes and Ladders, Five Dice,
  Nim), but **not in Follow Me**, where the robot's notes are the order to
  count. Follow Me's pads each play **their own note** (`sound.note()`);
  **while you play, the notes are its only sounds** (no ding for a right
  order; developer, 2026-10-09: sound matters more in this game than in
  the others, and extra sounds distract), only "uh-oh" for a miss and the
  end-of-game sound.
- **At the end of a round:** a sparkle when a person wins; a gentle
  wobble-down "aww" when the robot wins; two players, only the sparkle;
  playing alone, the sparkle when you finish; a tie (and "Same!" in Rock
  paper scissors), "ding ding".

## Stats

Which games are opened and played, from where, over time (developer,
2026-10-10; journal, Q12). No paid service.

- **GoatCounter** (goatcounter.com, free, donation-supported): no
  cookies, nothing personal kept; country from the visitor's address,
  which isn't stored. The site `donpark2000` (`GOATCOUNTER` in
  `src/core/stats.js`), domain donpark2000.github.io.
- **Our own few lines send the counts** (`src/ui/stats.js`, on every page
  but log.html), one small request each, no script from another site:
  each **page opened** (its full path, e.g. `/Web-Games/nim.html`; the
  home page `/Web-Games/`), with its title, the screen size and the
  referrer when another site sent the visitor; and each **game started**
  (Play! or Play again) as an event, `play-<game>` (e.g. `play-nim`);
  in Find the Stars also "Same size" and "Another", in Colour Sudoku
  and Laser Lab "Next" (`data-play`; Laser Lab's is "New run" after a
  run's 10th puzzle).
- **Only the live site counts** (donpark2000.github.io), not localhost or
  an automated browser, so testing doesn't add to the numbers. **Nothing
  is sent with no connection** (2026-10-11: an iPhone in airplane mode
  shows an alert when the app tries the network); **the page count waits
  2 s** after the page opens and checks then (the iPhone's app can say
  it's online as it opens; see "Offline app"). Each count (sent or
  not, and why) goes in the debug log.
- **The dashboard is public**, linked as "Stats" in every footer (a new
  tab, like "Source code").

## Offline app

The kids' phones have no cellular plan, only home wifi; the games must
work in the car too (developer, 2026-10-10; journal, Q13).

- **An installable web app** (a PWA): no app store, no developer account
  or fee. Opened once with a connection, it can be installed from the
  browser (iPhone and iPad: Safari, Share, Add to Home Screen; Android,
  Windows, Mac, Linux: the browser's Install button) and then plays with
  none. On a computer, a bookmark plays offline too.
- **Named "Let's Play!"** (developer, 2026-10-10; "Web Games" was dull),
  also the home page's tab title. **Icon: the happy bear** on sunny
  yellow (mockup v1, idea A), drawn from the site's own bear by
  `tools/make-icons.js` (`icons/`: SVG, and PNGs at 192, 512 (also
  Android's trimmed "maskable" one) and 180 for iPhone and iPad).
  `manifest.webmanifest` holds the name, icons and colours; every page
  links it.
- **`sw.js` saves the whole site** (every page, style, script, the Five
  Dice robot's data and the icons, about 1.5 MB) on the first visit, so
  every game plays offline, not just the ones opened. It serves the
  saved files first (instant, online or not); other sites (the stats
  counter) are left alone, so **offline plays aren't counted**.
- **Updates:** the saved files carry a version made from their contents
  (`tools/offline.js` writes the list and version into `sw.js`, and the
  version into `src/core/version.js` for the pages; the tests fail until
  it's run after a change). A device that opens the app
  online gets the new version in the background; the next page opened
  uses it, and the old copy is deleted.
- **On localhost the network comes first**, so the local server still
  shows edits on a reload; 127.0.0.1 behaves like the live site, for
  testing it.
- **`src/ui/offline.js`** (every page) registers `sw.js` and logs
  ("offline"): opened as the installed app or in the browser, the saved
  version and file count, a new version taking over, or why there's
  none. **It registers 2 s after the page opens, and only with a
  connection** (nothing to fetch; 2026-10-11, the iPhone's airplane-mode
  alert; the installed app said `navigator.onLine` true as it opened in
  airplane mode). `src/core/net.js` (`SETTLE_MS`) does the waiting, and
  logs ("net") each online/offline event (until 2026-10-11 also
  `navigator.onLine` 0.5, 1, 2 and 4 s after opening). The browser may still
  check for a new `sw.js` by itself when a page opens; that can't be
  turned off from the page.
- **A version line on the home page**, under the footer (developer,
  2026-10-11: to see on a phone whether a new version has arrived):
  "Version 1.0 · Oct 16, 2026 · 720f74": the release number (see
  "Releases"), the day `tools/offline.js` made that version and its first
  6 characters. **Always the version of the page's
  own files** (`src/core/version.js`), however it was loaded (developer,
  2026-10-11: "The version should always be the version"; until then it
  was asked of the running `sw.js`, and a first visit or a hard reload
  showed "Not saved for offline yet"). When a new version takes over
  while the page is open: "(new version next time: …)". **Tapping it
  opens the log page** (see "Structure").

## Releases

A release number for people (developer, 2026-10-16: "a more human
meaningful version number"): **x.0 for a new game, x.1, x.2 ... for
fixes and changes**, starting at **1.0** (2026-10-16: everything on the
site until then). The site's version stays the files' fingerprint
(`tools/offline.js`), which is what makes devices fetch a new copy; the
release number goes in front of it on the version line.

- **Set by hand at each publish** in `src/core/release.js` (whether a
  change is a fix or a new game is a judgement): Claude proposes the
  number when asking to publish ("Publish as 1.1?"), the developer
  confirms or changes it. `tools/offline.js` copies it into `sw.js`, so a
  new version taking over says its release too.
- **Release notes** in `RELEASES.md`, newest first, under "## X.Y
  (YYYY-MM-DD, version <the site's version>)": what changed, in a few
  lines for the developer (no "What's new" in the app: developer,
  2026-10-16).
- **Visible on GitHub:** each release is a git tag `vX.Y` on `main` and a
  GitHub release with its notes.
- **Every publish is a new release.** `node tools/release.js` checks
  before a publish: the number is x.y, newer than the last tag and not
  one already made; `RELEASES.md`'s newest release is that number, with
  notes and the site's current version; `tools/offline.js` is up to
  date. `node tools/release.js notes` gives the notes for the GitHub
  release, a paragraph or list item per line (GitHub shows every line
  break in a release's text). `npm test` checks the number's form and that `RELEASES.md`'s
  newest is it.

## Coming back to a game

**At most one game in progress, kept only for a reload or a trip to
another app** (2026-10-15, journal Q22; developer: "A restart should
always start clean. In fact I would suggest that starting any new game
clears out any in-progress games. It is one app." and "clicking Home
should also wipe out current state of any one game"). This replaced
Q20's rule of the same day (every game kept on the device until
finished, and the app's icon going back to the last game).

- **Kept in the browser's per-session storage** (`sessionStorage`,
  `src/core/resume.js` and `src/ui/resume.js`), after every change and
  as the page is hidden or left, and **picked up when the page opens
  again in the same visit**: a reload, or back from another app. A
  restart of the app (or a new browser tab) is a new session, with
  nothing kept: the home page, a clean slate. (Whether iOS closing the
  app in the background on its own keeps the game is to be measured on
  the iPhone; either fits the rule.)
- **Cleared by:** 🏠 (and nothing kept after it), **the home page**
  (also back to it, from the browser's memory or not), and **opening a
  different game** (any other game's kept state is cleared). A game page
  shown again from the browser's memory after its state was cleared
  starts fresh (it reloads). The app's icon no longer goes back into a
  game.
- **As it was left**, with what was moving finished or done again: a
  robot's turn starts again; two cards left showing settle; a roll or a
  move being shown is done (Snakes and Ladders: the pieces where they
  landed); a Five Dice box just scored keeps its 3 s Undo; Nim's matches
  picked up stay picked up; Rock paper scissors and Follow Me say
  "Ready?" and play the round again (Follow Me shows the same order
  again); a finished round shows its end, without the sound or cheer.
  Find the Stars: the same puzzle, board, hearts, hints and Show left,
  Undo, the clock and the hint on show (with its Why?); a finished
  puzzle shows its result.
- **Find the Stars' progress stays on the device** (`web-games-hidden-faces`:
  the next puzzle per size and the best times), as before; Colour
  Sudoku's too (`web-games-colour-sudoku`: per level), and Laser Lab's
  (`web-games-laser-lab`: the run per size and lasers, with the puzzle
  under way). Colour Sudoku
  comes back with its puzzle, board, notes, hearts, hints, the selected
  square, Undo, the clock, the hint on show (with its Why?) and Show me
  how's step.
- **Old keys removed:** on the first load after the update, the games
  kept on the device before (`web-games-resume-<game>` in localStorage)
  and the last page (`web-games-last-page`) are removed.
- A kept game that can't be read (an older format after an update, or a
  Find the Stars puzzle no longer in the stock) is dropped, logged, and
  the game starts at its setup screen.
- Logged ("resume"): a kept game found (its screen, how long ago) or not
  used and why; each game's "resumed" with what it picked up; another
  game's state cleared on opening one; "🏠: the game cleared"; "home
  page" with what it cleared; the old keys removed; a cleared page
  shown again from memory, starting fresh.
- **The home page logs its scroll room** (journal Q24: once on the
  iPhone it wouldn't scroll to its footer): the page's height, the
  screen's (`innerHeight` and the visible viewport's), how far it can
  scroll and where it is, when it opens, changes size or turns, is shown
  again from memory, and when a scroll stops at its end
  (`src/ui/scrolllog.js`).

## Later

- Matching cards with the developer's own photos.
- Rock paper scissors: a difficulty setting to make the robot better or
  worse (developer, 2026-10-04). Its pick is made before yours, so it
  can't cheat; a "better" robot would have to learn from your earlier
  picks.
- More games.

## Process

This project follows the `software-project-standards` practices: debug
output per feature, a test per feature, a one-command regression suite,
and a running journal (`DEV_JOURNAL.md`). See `CLAUDE.md`.
