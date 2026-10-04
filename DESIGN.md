# Design

The agreed direction for Web Games. This file records **decisions**; the
reasoning, evidence, and anything still open live in
[`DEV_JOURNAL.md`](DEV_JOURNAL.md).

*Status (2026-10-04): tic-tac-toe built (branch `tic-tac-toe`), awaiting
the developer's check; matching cards still as at kickoff.*

## Goal

Simple web games for the developer's grandkids, all reached from one home
page. The first two:

- **Tic-tac-toe**
- **Matching cards** (turn cards over two at a time to find the pairs)

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
  the home page to change games (developer, 2026-10-04).
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
  **normal** and a **winner** version; only the winner's squares and the
  "wins!" line show the winner version. The loser keeps the normal face.
  Emoji were dropped: no smiling version for most animals, and they look
  different on each device.
- **Setup screen** ("New game"): "Who's playing?" first: **Me and the
  robot** (the robot is preselected) or **Two players**. Then the face
  pickers. **Both players can never have the same face** (the other
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
- **Win:** the squares that didn't win are blurred out; the 3 winning
  squares are highlighted and show the winner face. A tie dims the grid:
  "It's a tie!".
- **The robot is beatable** ("not too aggressive"): one level; takes a
  win 75% of the time, blocks 55%, likes the centre, otherwise random.
  Tunable.
- The rules are written so that a networked mode (each player on their
  own device) could be added later without rewriting them (journal, Q1).

### Matching cards

- **Single player** at first.
- **Emoji pictures** (animals, fruit, vehicles): free to use, no image
  licensing (not yet reviewed; tic-tac-toe moved to drawn faces). The developer's own photos (family, pets) may come later.
- **Levels of 6, 8 and 10 pairs.** A move counter, **no timer** (no
  pressure).

## Sound

Small effects, with a mute button. **Off by default** until the developer
has heard them.

## Later

- Playing each other on separate devices (journal, Q1).
- Matching cards with the developer's own photos.
- More games.

## Process

This project follows the `software-project-standards` practices: debug
output per feature, a test per feature, a one-command regression suite,
and a running journal (`DEV_JOURNAL.md`). See `CLAUDE.md`.
