// The site's release number, for people (DESIGN.md "Releases"; developer,
// 2026-10-16): x.0 for a new game, x.1, x.2 ... for fixes and changes.
// Set by hand at each publish (a judgement no tool can make), with its
// notes in RELEASES.md; tools/release.js checks both before a publish,
// and tools/offline.js copies the number into sw.js. The site's version
// (src/core/version.js) stays the files' fingerprint, which is what makes
// devices fetch a new copy.
export const RELEASE = '3.5';
