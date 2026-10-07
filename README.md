# Web Games

Simple games for young kids (ages 5-7), played in a web browser on a
tablet or phone: tic-tac-toe, matching cards and Connect Four, all reached
from one home page.

**Play it:** https://donpark2000.github.io/Web-Games/

See [`DESIGN.md`](DESIGN.md) for how each game works.

## Try it on this computer

Needs [Node.js](https://nodejs.org/) (only for the local server and the
tests; the site itself is plain files, no build step).

```bash
node tools/serve.js
```

Then open http://localhost:8123/. Ctrl+C stops the server. The debug log,
kept on the device, is at http://localhost:8123/log.html (on the live
site: https://donpark2000.github.io/Web-Games/log.html).

## Tests

```bash
npm test
```

Runs every test once and ends with a pass/fail count.

## License

GPL-3.0. See [`LICENSE`](LICENSE).
