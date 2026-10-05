# Design

The agreed direction for Web Games. This file records **decisions**; the
reasoning, evidence, and anything still open live in
[`DEV_JOURNAL.md`](DEV_JOURNAL.md).

*Status (2026-10-04): tic-tac-toe, matching cards and Connect Four
Count to 9 and rock paper scissors published.*

## Goal

Simple web games for the developer's grandkids, all reached from one home
page. So far:

- **Tic-tac-toe**
- **Matching cards** (turn cards over two at a time to find the pairs)
- **Connect Four** (drop pieces into columns; 4 in a row wins)
- **Count to 9** (turn over numbered cards in order, 1 to 9)
- **Rock paper scissors** (against the robot)

## Players

- **Ages 5-7** (early readers): mostly pictures, a few short words.
  Cheerful feedback on a win; losing is gentle.
- **Tablets and phones first** (iPad, Android, iPhone): touch only, big
  tap targets, works upright and sideways. A computer works too.

## Platform

- **A static web site on GitHub Pages**, from the public repo
  `donpark2000/Web-Games`. Nothing to install; the kids open a link.
- **Plain JavaScript (ES modules), no build step.** What's in the repo is
  what's served. Tests run under Node.
- **Works in Safari** (iPad, iPhone) as well as Chrome and Edge.
- **No ads, no tracking, no sign-in, nothing loaded from other sites**
  (no web fonts, no outside scripts).

## Licence

GPL-3.0 (developer, 2026-10-04), same as GP-200 Patch Manager Web.

## Structure

- **One home page** with a big picture button per game, so a third game
  is just another button.
- **A 🏠 button top-left on every game screen** (setup and play), back to
  the home page to change games, **as big as one of that game's grid
  squares** (developer, 2026-10-04).
- **Every play screen fits the screen with no scrolling**, footer
  included (developer, 2026-10-04, on an iPhone 16): the grid squares and
  the 🏠 shrink together as far as needed (tic-tac-toe down to 56 px,
  Connect Four holes to 30 px, matching cards and Count to 9 cards to
  56 px; below that the
  page scrolls). Big screens keep big pieces. The setup screens scroll.
- **A small footer on every page:** "© 2026 Donald Parker · Free software
  under the GPL-3.0 · Source code" (link to the GitHub repo) (developer,
  2026-10-04). **At the bottom of the screen** when the page is shorter
  than the screen, under everything when it's longer; "Source code"
  **opens in a new tab**, so the game stays open (developer, 2026-10-04).
  Little space around it (16 px above, 12 px below the page), so the play
  screens fit a phone.
- **Shared styles**: `css/site.css` (every page), `css/game.css` (the
  game screens' setup panels, turn line, buttons), `css/cards.css` (the
  flipping cards of matching cards and Count to 9), then each game's own.
- **Game rules kept apart from the screen code**: rules in `src/core/`
  (no DOM or UI code, unit-tested in Node), screens in `src/ui/`.
- **A debug log** (standards §1), hidden unless the address has `?dev`:
  an on-screen panel plus "save log to file" with browser and device
  details.

## The games (first version)

### Tic-tac-toe

Agreed 2026-10-04 from mockups v1-v2 (journal). The mockups are private
Claude artifacts: [Tic-Tac-Toe Mockup](https://claude.ai/artifact/Y4LgG7JDqk9KBzH3wngEWY)
(version 2) and [Tic-Tac-Toe Faces](https://claude.ai/artifact/DizY1LaW5xgCiXzBbfWxaa).

- **Faces instead of X and O.** Each player picks a face; it fills the
  squares they take. **Drawn faces** (our own SVG, not emoji): bear, cat,
  dog, bunny, fox, panda, pig, frog, lion, mouse, monkey, chick, girl,
  boy, grandma, grandpa, plus the robot (computer only). Each has a
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
- **Pictures: the drawn faces** (the 17, robot included) less the
  players' picks; when a grid needs more pairs than that, some faces
  appear 4 times. No timer.
- **Play screen**: 🏠 (one card; on the setup screen, one 4x4 card),
  the turn line, the grid (sized so the whole page fits the screen,
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
  smaller when needed so the whole page fits the screen. The 🏠 is one
  hole, but at least 48 px (a hole is about 43 px on a phone).
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
- **Turn line**: "<face> find <n>" (alone: "Find <n>"); the robot "is
  thinking..." 0.8 s before each card it turns over.
- **Scoreboard** (dark strip): games won per player. **Just me**: the
  turns this round and the best (fewest turns) per level, with a 🏆;
  the end says "1 to 9 in N turns!". The end-of-round scorecard cheer and
  "aww" face, Play again / New game and the 🏠 (one card) as in the other
  games; the page fits the screen with no scrolling.
- **The robot never peeks**: it only knows cards it has seen turned over,
  each remembered with a 60% chance (`ROBOT_TUNING.remember`, tunable).
  It takes the next number when it remembers where it is, otherwise it
  guesses among the face-down cards it doesn't remember.
- Later, maybe: a "How many cards?" choice (count to 6, 9, 12 or 16).

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

## Sound

Small effects, with a mute button. **Off by default** until the developer
has heard them.

## Later

- Matching cards with the developer's own photos.
- More games.

## Process

This project follows the `software-project-standards` practices: debug
output per feature, a test per feature, a one-command regression suite,
and a running journal (`DEV_JOURNAL.md`). See `CLAUDE.md`.
