// Players and faces, shared by every game. No DOM or UI code.
// Players are 1 and 2.

// The faces a person can pick. The robot is only for the computer (in
// matching cards it can still be a picture on a card).
export const FACE_NAMES = [
  'bear', 'cat', 'dog', 'bunny', 'fox', 'panda', 'pig', 'frog',
  'lion', 'mouse', 'monkey', 'chick', 'girl', 'boy', 'grandma', 'grandpa',
];
export const ROBOT = 'robot';

// Who goes first in the next round: take turns, winner first, loser first.
export const FIRST_RULES = ['alt', 'win', 'lose'];

// Who starts the next round. winner 0 is a tie: then the other player
// starts, whatever the rule.
export function nextStarter(starter, winner, rule) {
  if (!winner || rule === 'alt') return 3 - starter;
  return rule === 'win' ? winner : 3 - winner;
}

// The scorecard faces at the end of a round, as moods per player: the
// winner smiles (its 'winner' version), the loser shows the gentle "aww"
// ('sad') version; a tie: both smile. Playing alone (`solo`): player 1
// smiles. The screens keep these until the next round starts (developer,
// 2026-10-04: the loser's aww face went unnoticed when it lasted only the
// 2.8 s cheer).
export function endMoods(winner, { solo = false } = {}) {
  if (![0, 1, 2].includes(winner)) throw new Error(`endMoods: bad winner: ${winner}`);
  if (solo) return { 1: 'winner' };
  if (!winner) return { 1: 'winner', 2: 'winner' };
  return { [winner]: 'winner', [3 - winner]: 'sad' };
}

// The sound at the end of a round (developer, 2026-10-09): 'win' when a
// person wins, 'aww' when the robot beats you, 'tie' for a tie. Two
// players: 'win' only (the loser's "aww" face is enough). Playing alone
// (`solo`): 'win' when you finish. Against the robot, it is player 2.
export function endSound(winner, { vsRobot = false, solo = false } = {}) {
  if (![0, 1, 2].includes(winner)) throw new Error(`endSound: bad winner: ${winner}`);
  if (solo) return 'win';
  if (!winner) return 'tie';
  return vsRobot && winner === 2 ? 'aww' : 'win';
}

// Checks the setup screen's picks. Returns '' when they're fine, otherwise
// a reason code the screen turns into words:
//   'p1-missing', 'p2-missing', 'unknown-face', 'same-face'.
// `onePlayer` (against the robot, or playing alone): player 2's pick is
// ignored.
export function checkFaces({ onePlayer, p1, p2 }) {
  if (!p1) return 'p1-missing';
  if (!FACE_NAMES.includes(p1)) return 'unknown-face';
  if (onePlayer) return '';
  if (!p2) return 'p2-missing';
  if (!FACE_NAMES.includes(p2)) return 'unknown-face';
  if (p1 === p2) return 'same-face';
  return '';
}
