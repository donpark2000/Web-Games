// Fitting a game's play screen to the screen, so it needs no scrolling
// (developer, 2026-10-04, on an iPhone 16). No DOM code: src/ui/fit.js
// does the measuring.
//
// largestFitting(fits, min, max): the largest whole size in [min, max]
// for which fits(size) is true, trying sizes by halving the range. Assumes
// a bigger size never fits where a smaller one doesn't. Returns
// { size, tries, fitted }: fitted is false when even `min` doesn't fit
// (size is then `min`, and the page will scroll). The last call to
// fits() is always with the returned size, so a caller that applies the
// size inside fits() is left with it applied.
export function largestFitting(fits, min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (!(min <= max)) throw new Error(`largestFitting: bad range ${min}..${max}`);
  let tries = 1;
  if (fits(max)) return { size: max, tries, fitted: true };
  tries++;
  if (!fits(min)) return { size: min, tries, fitted: false };
  let lo = min, hi = max;   // lo fits, hi doesn't
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    tries++;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  tries++;
  fits(lo);   // leave the answer applied
  return { size: lo, tries, fitted: true };
}
