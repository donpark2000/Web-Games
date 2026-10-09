// Follow Me's pad colours, shared by its screen and the home page's
// picture. Each pad has a bright colour (lit), a soft one (waiting) and a
// darker edge under it. The colour names are src/core/follow-me.js's
// PAD_FACES.

export const PAD_COLORS = {
  g: ['#4FB264', '#DDF1DF', '#3A8A4C'],   // green: frog
  y: ['#F7B928', '#FFF0C4', '#C98F0A'],   // yellow: chick
  k: ['#EF6F9F', '#FDE1EB', '#C24F7B'],   // pink: pig
  b: ['#3A94D4', '#D8EBF9', '#2A6E9F'],   // blue: bunny
  o: ['#F2724F', '#FFE1D6', '#C4512F'],   // orange: fox
  v: ['#8E6CC8', '#EAE1F7', '#6A4BA0'],   // purple: panda
  t: ['#2BB3A3', '#D5F2EE', '#1D857A'],   // teal: lion
  r: ['#E04B4B', '#FBDADA', '#A83333'],   // red: mouse
  n: ['#A9744A', '#F1E2D3', '#7D5333'],   // brown: monkey
  c: ['#5BC0EB', '#DDF3FC', '#3C93B8'],   // sky: cat
};

// The style for a pad of colour `color`: its three colours as CSS
// variables (--c lit, --soft waiting, --edge).
export function padStyle(color) {
  const c = PAD_COLORS[color];
  if (!c) throw new Error(`padStyle: unknown colour: ${color}`);
  return `--c: ${c[0]}; --soft: ${c[1]}; --edge: ${c[2]}`;
}
