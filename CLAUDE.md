# Notes for Claude

## Starting a session

Do this at the start of every session, before anything else, without
being asked (the developer's first message may just be "start"):

1. Load the `software-project-standards` skill.
2. Read `DESIGN.md` (decisions). In `DEV_JOURNAL.md` (reasoning, findings),
   read the "Open questions" section and the **latest "Status (start here
   next session)" entry** (or the latest entry, until there is one); read
   older entries only when a task needs them.
3. Check `git status` and that the branch matches GitHub (`git fetch`).
4. Reply with a short summary: where things stand, the next step, and
   anything needed from the developer. Then wait for the go-ahead.
5. Name the session in the sidebar as `<Mon D> · <topic>` (e.g. "Oct 4 ·
   Web games kickoff"), once the developer's go-ahead makes the topic
   clear, so sessions can be told apart. Rename it if the work changes a
   lot.

## Working standards

Follow the `software-project-standards` skill if it's available. If not,
this is the short version:

1. **Debug output with every feature.** Hook it into the site's debug log
   (kept on the device; `log.html` shows it and saves it to a file with
   browser/device details).
2. **A test with every feature**, covering the normal case and at least one
   failure or edge case.
3. **One command runs the whole regression suite** with a single pass/fail
   verdict. Tests are hermetic: temp dirs only, no hardcoded paths, nothing
   left behind.
4. **Keep `DEV_JOURNAL.md` current as you go.** Record evidence, not just
   conclusions. Move open questions to "Resolved" with the evidence that
   settled them.
5. **Propose generalizable lessons** as additions to the standards skill.
   Keep project-specific ones in the journal.

## Project rules

- Keep `src/core/` free of DOM/UI code.
- Plain JavaScript ES modules, no build step.
- Nothing loaded from other sites; no ads or sign-in. The one exception
  to "no tracking": the anonymous stats counter (DESIGN.md "Stats").
- Publishing is merging to `main` (once GitHub Pages is on); only with the
  developer's OK. Work happens on branches.
- Once a publish is live on github.io, stop the localhost servers
  (`tools/serve.js`, the developer's and Claude's) and say so; they
  aren't needed any more and leftovers clash on ports.

## Files: repo vs. test output

| Place | Holds | Lifetime |
|---|---|---|
| `C:\Users\dpark\Documents\Web-Games\` (this repo) | code, tests, docs, journal only | permanent (git) |
| `C:\Users\dpark\Documents\Web-Games-testing\<date>_<topic>\` | one device test session: screenshots, logs | disposable |

- Never put test output in the repo folder. Claude's own helper scripts
  stay in its scratchpad.
- Purge: once a session's results are in `DEV_JOURNAL.md`, ask "OK to
  purge `<folder>`?"; on a yes, send the folder to the Recycle Bin (not a
  permanent delete) and note the purge in the journal.
