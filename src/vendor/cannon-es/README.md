# cannon-es 0.20.0 (copied into the repo)

The physics for Tin Can Alley (DESIGN.md "Tin Can Alley"): one pinned
copy, served and saved for offline like the site's own files, so nothing
is loaded from other sites.

- From the npm package `cannon-es@0.20.0` (`npm pack`, integrity
  `sha512-eZhWTZIkFOnMAJOgfXJa9+b3kVlvG+FX4mdkpePev/w/rP5V8NRquGyEozcjPfEoXUlb+p7d9SUcmDSn14prOA==`),
  2026-11-09.
- `cannon-es.js`: `dist/cannon-es.js`, unchanged
  (sha256 `f0700cbd3a482954949b9d58c1b0f76dcc74767750297647a39d8c40dd63d37c`).
  It imports nothing (checked: no `import` or `require` in it), so it
  runs as it is in the browser and under Node (the tests).
- `LICENSE`: the package's MIT licence.

To update: replace these files from a newer package the same way, and
run `node tools/offline.js`.
