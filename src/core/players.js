// Players and faces, shared by every game. No DOM or UI code.
// Players are 1 and 2.

// The faces a person can pick. The robot is only for the computer (in
// matching cards it can still be a picture on a card). The girl and boy
// faces were dropped 2026-10-09 (developer): a fixed name can't fit a
// child, and two brothers couldn't both be "the boy".
export const FACE_NAMES = [
  'bear', 'cat', 'dog', 'bunny', 'fox', 'panda', 'pig', 'frog',
  'lion', 'mouse', 'monkey', 'chick', 'grandma', 'grandpa',
];
export const ROBOT = 'robot';

// Each face's fixed name (developer, 2026-10-09; no renaming), shown under
// the faces in the pickers, on the scoreboards and in the turn lines.
export const NAMES = {
  bear: 'Teddy', cat: 'Kitty', dog: 'Buddy', bunny: 'Hoppy', fox: 'Foxy', panda: 'Ping',
  pig: 'Piggy', frog: 'Froggy', lion: 'Leo', mouse: 'Squeak', monkey: 'Coco', chick: 'Peep',
  grandma: 'Grandma', grandpa: 'Grandpa', robot: 'Robot',
};

// A face's name. An unknown face is an error, not a blank name.
export function nameOf(face) {
  if (!Object.hasOwn(NAMES, face)) throw new Error(`nameOf: unknown face: ${face}`);
  return NAMES[face];
}

// The two faces on the setup screen's "Two players" button: player 1's
// pick (the bear until there is one) and player 2's, or another face
// until player 2 has picked a different one.
export function twoPlayerFaces(p1, p2) {
  const a = p1 || 'bear';
  return [a, p2 && p2 !== a ? p2 : a === 'cat' ? 'bear' : 'cat'];
}

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
