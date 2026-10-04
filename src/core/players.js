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
