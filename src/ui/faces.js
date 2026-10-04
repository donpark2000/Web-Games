// The drawn faces (DESIGN.md "Tic-tac-toe"): our own SVG, built from shared
// parts (eyes, mouth, cheeks), so each face has three versions cheaply.
// Ported from the agreed "Tic-Tac-Toe Faces" artifact (2026-10-04); the
// mood 'happy' was renamed 'winner', and 'sad' (a gentle "aww": worried
// eyebrows and a small frown, no tears) added for the loser at the end of
// a round (developer, 2026-10-04).
//
// svg(name, mood) returns an SVG string; mood is 'normal', 'winner' or
// 'sad'.

const D = '#2B2B33';
function eyes(m, y, dx, col = D) {
  return [50 - dx, 50 + dx].map(x => {
    if (m === 'winner') return `<path d="M${x-6} ${y+2} Q${x} ${y-7} ${x+6} ${y+2}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
    const eye = `<circle cx="${x}" cy="${y}" r="5" fill="${col}"/><circle cx="${x+1.7}" cy="${y-1.8}" r="1.6" fill="#fff"/>`;
    if (m !== 'sad') return eye;
    // Worried eyebrows: the inner ends (towards the nose) raised.
    const inner = x < 50 ? 1 : -1;
    return eye + `<path d="M${x - 6 * inner} ${y-8} L${x + 5 * inner} ${y-12}" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`;
  }).join('');
}
function mouth(m, y, w = 7, col = D) {
  if (m === 'winner') return `<path d="M${50-w-4} ${y-2} Q50 ${y+17} ${50+w+4} ${y-2} Z" fill="${col}"/><ellipse cx="50" cy="${y+5}" rx="${w-1}" ry="2.8" fill="#F06B7E"/>`;
  // A small frown, a little narrower than the smile.
  if (m === 'sad') return `<path d="M${50-w+1} ${y+3} Q50 ${y-2} ${50+w-1} ${y+3}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>`;
  return `<path d="M${50-w} ${y} Q50 ${y+5} ${50+w} ${y}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>`;
}
const cheeks = (m, y, dx) => m === 'winner'
  ? `<ellipse cx="${50-dx}" cy="${y}" rx="6" ry="3.5" fill="#FF8FA3" opacity=".6"/><ellipse cx="${50+dx}" cy="${y}" rx="6" ry="3.5" fill="#FF8FA3" opacity=".6"/>` : '';
const glasses = (y, col) => `<circle cx="39" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="2.5"/><circle cx="61" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="2.5"/><path d="M48 ${y} L52 ${y}" stroke="${col}" stroke-width="2.5"/>`;

const DRAWINGS = {
  bear: m => `<circle cx="25" cy="27" r="13" fill="#A9744A"/><circle cx="75" cy="27" r="13" fill="#A9744A"/><circle cx="25" cy="27" r="7" fill="#E3BC93"/><circle cx="75" cy="27" r="7" fill="#E3BC93"/>
    <circle cx="50" cy="56" r="34" fill="#A9744A"/><ellipse cx="50" cy="70" rx="17" ry="13" fill="#E3BC93"/>${eyes(m,50,13)}${cheeks(m,62,25)}
    <ellipse cx="50" cy="63" rx="5.5" ry="4" fill="${D}"/>${mouth(m,72)}`,
  cat: m => `<path d="M18 46 L24 10 L46 28 Z" fill="#F2A541"/><path d="M82 46 L76 10 L54 28 Z" fill="#F2A541"/><path d="M25 36 L27 19 L37 28 Z" fill="#F7C6CF"/><path d="M75 36 L73 19 L63 28 Z" fill="#F7C6CF"/>
    <circle cx="50" cy="57" r="32" fill="#F2A541"/><path d="M44 29 L46 38 M50 27 L50 38 M56 29 L54 38" stroke="#D9822B" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="71" rx="15" ry="11" fill="#FBE3C4"/>${eyes(m,52,13)}${cheeks(m,63,23)}<path d="M46 63 L54 63 L50 67.5 Z" fill="#E86A86"/>
    <path d="M14 66 L32 68 M14 74 L32 72 M86 66 L68 68 M86 74 L68 72" stroke="${D}" stroke-width="1.6" stroke-linecap="round"/>${mouth(m,72,6)}`,
  dog: m => `<circle cx="50" cy="52" r="31" fill="#D9A066"/><ellipse cx="63" cy="46" rx="11" ry="10" fill="#B97D45"/>
    <ellipse cx="21" cy="50" rx="10" ry="22" fill="#7B4B2A" transform="rotate(15 21 50)"/><ellipse cx="79" cy="50" rx="10" ry="22" fill="#7B4B2A" transform="rotate(-15 79 50)"/>
    <ellipse cx="50" cy="68" rx="17" ry="13" fill="#F5DFC0"/>${eyes(m,47,13)}${cheeks(m,60,22)}<ellipse cx="50" cy="61" rx="6.5" ry="4.5" fill="${D}"/>${mouth(m,71)}`,
  bunny: m => `<ellipse cx="37" cy="22" rx="9" ry="21" fill="#F4F4F8" stroke="#C9CCD8" stroke-width="2"/><ellipse cx="63" cy="22" rx="9" ry="21" fill="#F4F4F8" stroke="#C9CCD8" stroke-width="2"/>
    <ellipse cx="37" cy="24" rx="4" ry="14" fill="#F7BFD0"/><ellipse cx="63" cy="24" rx="4" ry="14" fill="#F7BFD0"/>
    <circle cx="50" cy="62" r="30" fill="#F4F4F8" stroke="#C9CCD8" stroke-width="2"/>${eyes(m,57,12)}${cheeks(m,68,21)}<ellipse cx="50" cy="67" rx="4.5" ry="3" fill="#E86A86"/>${mouth(m,74,6)}`,
  fox: m => `<path d="M16 44 L22 8 L44 30 Z" fill="#EE7A2F"/><path d="M84 44 L78 8 L56 30 Z" fill="#EE7A2F"/><path d="M23 34 L25 18 L35 28 Z" fill="#5A3322"/><path d="M77 34 L75 18 L65 28 Z" fill="#5A3322"/>
    <path d="M50 92 L16 56 Q16 24 50 24 Q84 24 84 56 Z" fill="#EE7A2F"/><path d="M50 92 L19 58 Q36 60 50 70 Q64 60 81 58 Z" fill="#FFF4E8"/>
    ${eyes(m,50,14)}${cheeks(m,62,24)}<ellipse cx="50" cy="73" rx="5" ry="3.6" fill="${D}"/>${mouth(m,79,5)}`,
  panda: m => `<circle cx="26" cy="27" r="12" fill="${D}"/><circle cx="74" cy="27" r="12" fill="${D}"/><circle cx="50" cy="56" r="33" fill="#FBFBFB" stroke="#D3D6DE" stroke-width="2"/>
    <ellipse cx="37" cy="53" rx="10" ry="12.5" fill="${D}" transform="rotate(-25 37 53)"/><ellipse cx="63" cy="53" rx="10" ry="12.5" fill="${D}" transform="rotate(25 63 53)"/>
    ${eyes(m,52,13,'#fff')}${cheeks(m,66,24)}<ellipse cx="50" cy="65" rx="5.5" ry="4" fill="${D}"/>${mouth(m,73)}`,
  pig: m => `<path d="M20 38 L22 12 L42 26 Z" fill="#F49AB0"/><path d="M80 38 L78 12 L58 26 Z" fill="#F49AB0"/><circle cx="50" cy="55" r="32" fill="#F8B6C5"/>
    ${eyes(m,45,14)}${cheeks(m,58,25)}<ellipse cx="50" cy="63" rx="14" ry="10" fill="#F28AA2"/><ellipse cx="45" cy="63" rx="2.6" ry="3.6" fill="#B8506A"/><ellipse cx="55" cy="63" rx="2.6" ry="3.6" fill="#B8506A"/>${mouth(m,78)}`,
  frog: m => `<circle cx="30" cy="33" r="15" fill="#6CC24A"/><circle cx="70" cy="33" r="15" fill="#6CC24A"/><ellipse cx="50" cy="62" rx="38" ry="28" fill="#6CC24A"/>
    <circle cx="30" cy="33" r="10" fill="#fff"/><circle cx="70" cy="33" r="10" fill="#fff"/>${eyes(m,34,20)}${cheeks(m,64,26)}
    <circle cx="45" cy="56" r="1.8" fill="#3D7A2A"/><circle cx="55" cy="56" r="1.8" fill="#3D7A2A"/>${mouth(m,68,14)}`,
  lion: m => `<circle cx="50" cy="54" r="44" fill="#C8742A"/><circle cx="31" cy="31" r="8" fill="#F6C25B"/><circle cx="69" cy="31" r="8" fill="#F6C25B"/>
    <circle cx="50" cy="56" r="29" fill="#F6C25B"/><ellipse cx="50" cy="69" rx="14" ry="10" fill="#FCE3A8"/>${eyes(m,51,12)}${cheeks(m,61,21)}
    <ellipse cx="50" cy="63" rx="5" ry="3.6" fill="#7A4A2A"/>${mouth(m,71,6)}`,
  mouse: m => `<circle cx="22" cy="30" r="17" fill="#B9BECB"/><circle cx="78" cy="30" r="17" fill="#B9BECB"/><circle cx="22" cy="30" r="10" fill="#F7C1CF"/><circle cx="78" cy="30" r="10" fill="#F7C1CF"/>
    <circle cx="50" cy="58" r="30" fill="#C9CDD8"/>${eyes(m,54,12)}${cheeks(m,65,21)}<circle cx="50" cy="65" r="4" fill="#E86A86"/>
    <path d="M18 64 L34 66 M18 72 L34 70 M82 64 L66 66 M82 72 L66 70" stroke="${D}" stroke-width="1.5" stroke-linecap="round"/>${mouth(m,72,6)}`,
  monkey: m => `<circle cx="17" cy="52" r="12" fill="#8A5A3B"/><circle cx="83" cy="52" r="12" fill="#8A5A3B"/><circle cx="17" cy="52" r="7" fill="#F1C9A0"/><circle cx="83" cy="52" r="7" fill="#F1C9A0"/>
    <circle cx="50" cy="52" r="33" fill="#8A5A3B"/><circle cx="40" cy="48" r="13" fill="#F1C9A0"/><circle cx="60" cy="48" r="13" fill="#F1C9A0"/><ellipse cx="50" cy="66" rx="22" ry="16" fill="#F1C9A0"/>
    ${eyes(m,48,10)}${cheeks(m,62,22)}<circle cx="47" cy="61" r="1.8" fill="${D}"/><circle cx="53" cy="61" r="1.8" fill="${D}"/>${mouth(m,69)}`,
  chick: m => `<path d="M44 24 Q47 8 50 22 Q53 8 56 24" fill="none" stroke="#E9A800" stroke-width="3.5" stroke-linecap="round"/><circle cx="50" cy="56" r="33" fill="#FFD447"/>
    ${eyes(m,48,13)}${cheeks(m,62,22)}${m === 'winner'
      ? `<ellipse cx="50" cy="67" rx="7" ry="5" fill="${D}"/><path d="M41 60 L59 60 L50 66 Z" fill="#F28C28"/><path d="M43 69 L57 69 L50 76 Z" fill="#F28C28"/>`
      : `<path d="M42 61 L58 61 L50 70 Z" fill="#F28C28"/>`}`,
  girl: m => `<circle cx="18" cy="60" r="12" fill="#6B3E26"/><circle cx="82" cy="60" r="12" fill="#6B3E26"/><circle cx="26" cy="49" r="4.5" fill="#FF7FA8"/><circle cx="74" cy="49" r="4.5" fill="#FF7FA8"/>
    <circle cx="50" cy="49" r="32" fill="#6B3E26"/><ellipse cx="50" cy="59" rx="27" ry="28" fill="#F6C8A0"/>
    <path d="M23 50 Q28 22 50 22 Q72 22 77 50 Q64 34 50 39 Q36 34 23 50 Z" fill="#6B3E26"/>${eyes(m,58,11)}${cheeks(m,68,19)}${mouth(m,73,6)}`,
  boy: m => `<circle cx="23" cy="60" r="6" fill="#E8B48A"/><circle cx="77" cy="60" r="6" fill="#E8B48A"/><circle cx="50" cy="47" r="30" fill="#3F2A1D"/><ellipse cx="50" cy="59" rx="27" ry="28" fill="#E8B48A"/>
    <path d="M23 52 Q23 24 50 22 Q77 24 77 52 Q71 37 57 38 L50 31 L43 38 Q29 37 23 52 Z" fill="#3F2A1D"/>${eyes(m,58,11)}${cheeks(m,68,19)}${mouth(m,73,6)}`,
  grandma: m => `<circle cx="50" cy="19" r="12" fill="#C9CDD6"/><circle cx="50" cy="49" r="32" fill="#C9CDD6"/><ellipse cx="50" cy="59" rx="27" ry="28" fill="#F3CDA9"/>
    <path d="M23 52 Q25 26 50 26 Q75 26 77 52 Q66 38 50 41 Q34 38 23 52 Z" fill="#C9CDD6"/>${eyes(m,58,11)}${glasses(58,'#7A5BB0')}${cheeks(m,69,20)}${mouth(m,74,6)}`,
  grandpa: m => `<circle cx="22" cy="60" r="6" fill="#EBC09A"/><circle cx="78" cy="60" r="6" fill="#EBC09A"/><ellipse cx="50" cy="56" rx="28" ry="30" fill="#EBC09A"/>
    <ellipse cx="25" cy="50" rx="6" ry="11" fill="#D4D7DE"/><ellipse cx="75" cy="50" rx="6" ry="11" fill="#D4D7DE"/>
    <path d="M32 45 L44 44 M56 44 L68 45" stroke="#B8BCC6" stroke-width="3" stroke-linecap="round"/>${eyes(m,55,11)}${glasses(55,'#4E5D6C')}${cheeks(m,66,20)}
    <path d="M36 70 Q43 63 50 67 Q57 63 64 70 Q57 73 50 70 Q43 73 36 70 Z" fill="#D4D7DE"/>${mouth(m,76,6)}`,
  robot: m => `<path d="M50 10 L50 22" stroke="#7D93A8" stroke-width="3"/><circle cx="50" cy="10" r="5" fill="#F2724F"/>
  <rect x="8" y="46" width="10" height="20" rx="3" fill="#7D93A8"/><rect x="82" y="46" width="10" height="20" rx="3" fill="#7D93A8"/>
  <rect x="16" y="22" width="68" height="68" rx="16" fill="#A9BDD0"/><rect x="24" y="32" width="52" height="48" rx="10" fill="#24384D"/>
  ${m === 'winner'
    ? `<path d="M33 52 Q38 44 43 52 M57 52 Q62 44 67 52" fill="none" stroke="#7FE3F0" stroke-width="4" stroke-linecap="round"/><path d="M37 62 Q50 78 63 62 Z" fill="#7FE3F0"/>`
    : m === 'sad'
    ? `<rect x="34" y="47" width="9" height="9" rx="3" fill="#7FE3F0"/><rect x="57" y="47" width="9" height="9" rx="3" fill="#7FE3F0"/><path d="M33 43 L43 40 M67 43 L57 40" stroke="#7FE3F0" stroke-width="3" stroke-linecap="round"/><path d="M41 70 Q50 64 59 70" fill="none" stroke="#7FE3F0" stroke-width="3.5" stroke-linecap="round"/>`
    : `<rect x="34" y="44" width="9" height="11" rx="3" fill="#7FE3F0"/><rect x="57" y="44" width="9" height="11" rx="3" fill="#7FE3F0"/><path d="M40 67 L60 67" stroke="#7FE3F0" stroke-width="3.5" stroke-linecap="round"/>`}`,
};

export const DRAWN_FACES = Object.keys(DRAWINGS);
export const MOODS = ['normal', 'winner', 'sad'];

export function svg(name, mood = 'normal') {
  const draw = DRAWINGS[name];
  if (!draw) throw new Error(`no drawing for face: ${name}`);
  if (!MOODS.includes(mood)) throw new Error(`unknown mood: ${mood}`);
  return `<svg class="av" viewBox="0 0 100 100" aria-hidden="true">${draw(mood)}</svg>`;
}
