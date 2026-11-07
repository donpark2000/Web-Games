# three.js r160 (copied into the repo)

For the 3D games (DESIGN.md "3D games"; journal Q46): one pinned copy,
served and saved for offline like the site's own files, so nothing is
loaded from other sites.

- From the npm package `three@0.160.0` (`npm pack`, integrity
  `sha512-DLU8lc0zNIPkM7rH5/e1Ks1Z8tWCGRq6g8mPowdDJpw1CFBJMU7UoJjC6PefXW7z//SSl0b2+GCw14LB+uDhng==`),
  2026-11-07.
- `three.module.min.js`: `build/three.module.min.js`, unchanged
  (sha256 `3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6`).
- `RoundedBoxGeometry.js`: `examples/jsm/geometries/RoundedBoxGeometry.js`
  (sha256 `d20aeaf7077c459a8d952d215738d7b44fba028440bb862d84b622a34f0c80bb`),
  one line changed: it imports `./three.module.min.js` instead of
  `three`, so a page needs no import map (Safari before 16.4 has none).
- `LICENSE`: the package's MIT licence.

To update: replace these files from a newer package the same way, and
run `node tools/offline.js`.
