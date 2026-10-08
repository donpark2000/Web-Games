// Nim rules. No DOM or UI code: the screens live in src/ui/.
//
// Built like connect-four.js: a match is a plain object (players' faces,
// who-goes-first rule, how hard, scores, the current round), and
// everything here is a pure function of its inputs or mutates only the
// match passed in.
//
// Three rows of matches: 3, 5 and 7. On your turn you take one or more
// matches from one row; whoever takes the last match wins (developer,
// 2026-10-08). Each match has a place in its row (0 = leftmost), so the
// screen can leave the gaps where taken matches were. Players are 1 and 2.

import { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter };

export const START_ROWS = [3, 5, 7];
export const LEVELS = ['easy', 'hard'];

// A round's matches: per row, true where a match has been taken.
export const freshRows = () => START_ROWS.map(n => Array(n).fill(false));

// How many matches are left in each row, e.g. [3, 5, 7].
export const counts = taken => taken.map(row => row.filter(t => !t).length);

// The exact method: the rows' counts XORed together (the "nim-sum"). A
// player who leaves 0 can always win, whatever the other player does.
export const nimSum = rows => rows.reduce((a, b) => a ^ b, 0);

// Checks the setup screen's picks (players.js checkFaces). Against the
// robot, player 2's pick is ignored (it's always the robot).
export const checkFaces = ({ vsRobot, p1, p2 }) => checkPicks({ onePlayer: vsRobot, p1, p2 });

// A new match: games won 0-0, player 1 starts the first round. Throws if
// the picks aren't valid (the screen keeps "Play!" greyed until they are).
// `level` only matters against the robot.
export function createMatch({ vsRobot, p1, p2, firstRule, level = 'easy' }) {
  const why = checkFaces({ vsRobot, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  if (!LEVELS.includes(level)) throw new Error(`unknown level: ${level}`);
  return {
    vsRobot: !!vsRobot,
    faces: [p1, vsRobot ? ROBOT : p2],
    firstRule,
    level,
    scores: { 1: 0, 2: 0 },
    starter: 1,
    taken: freshRows(),
    turn: 1,
    result: null,
  };
}

// Puts all the matches back for a round; the match's starter goes first.
// Also "Play again": mid-round, that restarts the round unscored, with the
// same starter (the starter only changes when a round finishes).
export function newRound(match) {
  match.taken = freshRows();
  match.turn = match.starter;
  match.result = null;
}

// The player whose turn it is takes the matches at places `picks` in `row`.
// Returns { ok: true } or { ok: false, why } where why is 'round-over',
// 'bad-row', 'none-picked', 'bad-match' (no such place, or the same one
// twice) or 'already-taken'. Taking from two rows at once can't be asked
// for: one call is one row.
// When the move takes the last match: that player wins; sets match.result
// to { winner, row, picks }, scores it and picks the next round's starter.
export function take(match, row, picks) {
  if (match.result) return { ok: false, why: 'round-over' };
  const line = match.taken[row];
  if (!Number.isInteger(row) || !line) return { ok: false, why: 'bad-row' };
  if (!Array.isArray(picks) || !picks.length) return { ok: false, why: 'none-picked' };
  if (new Set(picks).size !== picks.length || !picks.every(i => Number.isInteger(i) && i >= 0 && i < line.length)) {
    return { ok: false, why: 'bad-match' };
  }
  if (picks.some(i => line[i])) return { ok: false, why: 'already-taken' };
  for (const i of picks) line[i] = true;
  if (counts(match.taken).every(n => n === 0)) {
    const winner = match.turn;
    match.result = { winner, row, picks: [...picks].sort((a, b) => a - b) };
    match.scores[winner]++;
    match.starter = nextStarter(match.starter, winner, match.firstRule);
  } else {
    match.turn = 3 - match.turn;
  }
  return { ok: true };
}

/* ---------- the robot ---------- */

// Every move from these counts, as [row, how many].
export const moves = rows => rows.flatMap((n, r) => Array.from({ length: n }, (_, k) => [r, k + 1]));
const after = (rows, [r, k]) => rows.map((n, i) => (i === r ? n - k : n));
const anyOf = (list, rand) => list[Math.min(list.length - 1, Math.floor(rand() * list.length))];

// Picks the robot's move from the counts left in each row. `rand` returns
// numbers in [0, 1); tests pass a fixed one so they're repeatable.
// Returns { row, count, reason } (reason for the debug log):
//
// Easy ("not stupid or random", developer 2026-10-08): looks one move
// ahead. Takes the win when it can ('win': one row left, it takes it
// all); never leaves just one row, which the other player would take
// whole ('safe'); 'stuck' when every move does that. It doesn't know the
// exact method: among the safe moves it takes any. A child who plays
// sensibly wins about half the time (journal, 2026-10-08).
//
// Hard: plays its best ('best': leaves a nim-sum of 0). When it can't
// (the other player has it beaten), it plays like Easy and waits for a
// slip.
export function robotMove(rows, level = 'easy', rand = Math.random) {
  const all = moves(rows);
  if (!all.length) throw new Error('robotMove: no matches left');
  if (level === 'hard') {
    const best = all.filter(m => nimSum(after(rows, m)) === 0);
    if (best.length) return pack(anyOf(best, rand), 'best');
  }
  const win = all.filter(m => after(rows, m).every(n => n === 0));
  if (win.length) return pack(win[0], 'win');
  const safe = all.filter(m => after(rows, m).filter(n => n > 0).length !== 1);
  return safe.length ? pack(anyOf(safe, rand), 'safe') : pack(anyOf(all, rand), 'stuck');
}
const pack = ([row, count], reason) => ({ row, count, reason });

// Which matches the robot lifts for a move: the rightmost ones still
// there, right to left (the order it picks them up on screen).
export function robotPicks(taken, row, count) {
  const there = taken[row].map((t, i) => (t ? -1 : i)).filter(i => i >= 0);
  if (count < 1 || count > there.length) throw new Error(`robotPicks: can't take ${count} from row ${row}`);
  return there.slice(-count).reverse();
}
