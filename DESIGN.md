# Design

The agreed direction for Web Games. This file records **decisions**; the
reasoning, evidence, and anything still open live in
[`DEV_JOURNAL.md`](DEV_JOURNAL.md).

*Status: kickoff decisions only (2026-10-04). The developer has more
details to give before building starts.*

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
- **Game rules kept apart from the screen code**: rules in `src/core/`
  (no DOM or UI code, unit-tested in Node), screens in `src/ui/`.
- **A debug log** (standards §1), hidden unless the address has `?dev`:
  an on-screen panel plus "save log to file" with browser and device
  details.

## The games (first version)

### Tic-tac-toe

- **Two players on one device**, or **against the computer**.
- The computer has an **easy** setting that makes mistakes on purpose so
  the kids can win, and a **harder** one.
- The rules are written so that a networked mode (each player on their own
  device) could be added later without rewriting them (journal, Q1).

### Matching cards

- **Single player** at first.
- **Emoji pictures** (animals, fruit, vehicles): free to use, no image
  licensing. The developer's own photos (family, pets) may come later.
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
