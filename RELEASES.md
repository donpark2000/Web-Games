# Releases

What changed in each release of the site, newest first. A release
number is **x.0 for a new game** and **x.1, x.2 ... for fixes and
changes** (DESIGN.md "Releases"). Each release is also a git tag `vX.Y`
and a [GitHub release](https://github.com/donpark2000/Web-Games/releases)
with these notes. The version in each heading is the site's own
fingerprint, the last part of the home page's version line.

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
