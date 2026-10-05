// Rock paper scissors rules. No DOM or UI code: the screens live in src/ui/.
//
// The developer's design (2026-10-04, mockup v2): always you against the
// robot. Each round the robot picks first, at random, and its pick stays
// hidden; the screen counts 1, 2, 3 and only then lets you pick (unlock);
// your pick shows the robot's at once. Waiting gains nothing: the robot's
// pick is fixed before yours. First to 3 round wins takes the game; the
// same pick is "Same!" and not counted.
// Players: 1 is you, 2 is the robot.

import { ROBOT, checkFaces as checkPicks } from './players.js';

export { ROBOT };

export const PICKS = ['rock', 'paper', 'scissors'];
export const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
export const FIRST_TO = 3;

export const checkFaces = ({ p1 }) => checkPicks({ onePlayer: true, p1 });

// Who wins a round: 1 (mine), 2 (theirs) or 0 (the same pick).
export function judge(mine, theirs) {
  if (!PICKS.includes(mine) || !PICKS.includes(theirs)) throw new Error(`judge: bad pick: ${mine} / ${theirs}`);
  if (mine === theirs) return 0;
  return BEATS[mine] === theirs ? 1 : 2;
}

// The robot's pick: at random, every pick equally likely. `rand` returns
// numbers in [0, 1).
export const robotPick = (rand = Math.random) => PICKS[Math.min(2, Math.floor(rand() * 3))];

// A new match: no games won yet. Throws if the face isn't valid (the
// screen keeps "Play!" greyed until it is).
export function createMatch({ p1 }) {
  const why = checkFaces({ p1 });
  if (why) throw new Error(`can't start: ${why}`);
  const match = { faces: [p1, ROBOT], games: { 1: 0, 2: 0 } };
  newGame(match);
  return match;
}

// A new game (first to 3); games won are kept. Also "Play again" mid-game:
// the game restarts, not counted.
export function newGame(match) {
  match.stars = { 1: 0, 2: 0 };
  match.rounds = 0;
  match.result = null;
  match.round = null;
}

// A new round: the robot picks now, hidden; picking is locked until
// unlock() (the screen calls it when the countdown shows "3").
// Returns the robot's pick (for the debug log; the screen keeps it hidden).
export function newRound(match, rand = Math.random) {
  if (match.result) throw new Error('newRound: the game is over');
  match.round = { robot: robotPick(rand), mine: null, open: false, winner: null };
  return match.round.robot;
}

export function unlock(match) {
  if (!match.round || match.round.mine) return false;
  match.round.open = true;
  return true;
}

// You pick. Returns { ok: true, robot, winner, gameOver } or { ok: false,
// why } where why is 'game-over', 'no-round', 'not-yet' (still counting),
// 'already' (picked this round) or 'bad-pick'.
export function choose(match, pick) {
  if (match.result) return { ok: false, why: 'game-over' };
  const r = match.round;
  if (!r) return { ok: false, why: 'no-round' };
  if (r.mine) return { ok: false, why: 'already' };
  if (!r.open) return { ok: false, why: 'not-yet' };
  if (!PICKS.includes(pick)) return { ok: false, why: 'bad-pick' };
  r.mine = pick;
  r.winner = judge(pick, r.robot);
  match.rounds++;
  if (r.winner) {
    match.stars[r.winner]++;
    if (match.stars[r.winner] >= FIRST_TO) {
      match.result = { winner: r.winner };
      match.games[r.winner]++;
    }
  }
  return { ok: true, robot: r.robot, winner: r.winner, gameOver: !!match.result };
}
