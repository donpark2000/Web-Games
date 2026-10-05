// Rock paper scissors pictures: our own SVG, not emoji (emoji look
// different on each device), from the approved mockup v2 (2026-10-04).

export const PICTURES = {
  rock: `<svg class="av" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 68 Q10 46 27 35 Q37 19 57 22 Q80 24 86 47 Q92 71 71 80 Q47 89 27 82 Q15 77 14 68 Z" fill="#9AA3AD" stroke="#6B7480" stroke-width="3" stroke-linejoin="round"/><path d="M30 42 Q38 30 52 31" fill="none" stroke="#C4CBD2" stroke-width="5" stroke-linecap="round"/><path d="M58 52 L66 60 L62 70" fill="none" stroke="#6B7480" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="64" r="3" fill="#7F8893"/><circle cx="72" cy="42" r="2.4" fill="#7F8893"/></svg>`,
  paper: `<svg class="av" viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(-6 50 50)"><path d="M24 12 L64 12 L78 26 L78 88 L24 88 Z" fill="#fff" stroke="#8FA6B4" stroke-width="3" stroke-linejoin="round"/><path d="M64 12 L64 26 L78 26" fill="#E2ECF1" stroke="#8FA6B4" stroke-width="3" stroke-linejoin="round"/><path d="M33 40 H69 M33 50 H69 M33 60 H69 M33 70 H58" stroke="#9CCBE6" stroke-width="3" stroke-linecap="round"/></g></svg>`,
  scissors: `<svg class="av" viewBox="0 0 100 100" aria-hidden="true"><path d="M47 56 L24 9 Q33 11 55 51 Z" fill="#D3DAE0" stroke="#738191" stroke-width="2.6" stroke-linejoin="round"/><path d="M53 56 L76 9 Q67 11 45 51 Z" fill="#D3DAE0" stroke="#738191" stroke-width="2.6" stroke-linejoin="round"/><path d="M49 55 L38 66 M51 55 L62 66" stroke="#F2724F" stroke-width="8" stroke-linecap="round"/><circle cx="32" cy="76" r="12" fill="none" stroke="#F2724F" stroke-width="7"/><circle cx="68" cy="76" r="12" fill="none" stroke="#F2724F" stroke-width="7"/><circle cx="50" cy="53" r="3.6" fill="#4E5A66"/></svg>`,
};

// What the winning pick does to the other ("Rock smashes scissors!").
export const SAYS = { rock: 'Rock smashes scissors!', paper: 'Paper covers rock!', scissors: 'Scissors cut paper!' };
