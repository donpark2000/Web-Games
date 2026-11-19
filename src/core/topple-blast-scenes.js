// Topple!'s scenes that offer the blast ball (DESIGN.md "Topple!", The blast ball;
// journal Q130, Q132): the structures a good player can't always win in 3 balls,
// judged a little off. WRITTEN BY tools/topple-stars.js --list-from, not by hand:
// a test fails when the files the scenes are made from have changed since.
export const BLAST_FROM = { made: '2026-11-19T21:48:06.307Z', scenes: 750, deals: 6, seed: 1000, tries: 30, fingerprint: '809d6d667c973da6' };
export const BLAST_SCENES = [
  { world: 'park', level: 3, stack: 'iceCastle', modes: ['normal', 'harder', 'hardest'] },
  { world: 'park', level: 3, stack: 'iceSpreadMix', modes: ['hardest'] },
  { world: 'park', level: 4, stack: 'canyonSpreadMix', modes: ['hardest'] },
  { world: 'park', level: 5, stack: 'candles', modes: ['normal', 'harder', 'hardest'] },
  { world: 'park', level: 5, stack: 'starPalace', modes: ['normal', 'harder', 'hardest'] },
  { world: 'park', level: 5, stack: 'starSpreadMix', modes: ['hardest'] },
  { world: 'moon', level: 7, stack: 'panels4+panels6+crates4', modes: ['normal', 'harder', 'hardest'] },
  { world: 'moon', level: 7, stack: 'panels6+panels4+crates3', modes: ['normal', 'harder', 'hardest'] },
  { world: 'moon', level: 9, stack: 'crates2x2+trestle+tank', modes: ['normal', 'harder', 'hardest'] },
  { world: 'moon', level: 9, stack: 'tank+trestle+crates2x2+beacon', modes: ['normal', 'harder', 'hardest'] },
  { world: 'moon', level: 9, stack: 'trestle+crates4+trestle+tank', modes: ['normal', 'harder', 'hardest'] },
  { world: 'moon', level: 10, stack: 'beacon+gantry+antenna+gantry', modes: ['normal', 'harder', 'hardest'] },
];
