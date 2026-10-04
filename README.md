# Web Games

Simple games for young kids (ages 5-7), played in a web browser on a
tablet or phone: tic-tac-toe and a matching-cards game, both reached from
one home page.

**Play it:** https://donpark2000.github.io/Web-Games/

*Being built: tic-tac-toe is playable; matching cards is next.* See
[`DESIGN.md`](DESIGN.md).

## Try it on this computer

Needs [Node.js](https://nodejs.org/) (only for the local server and the
tests; the site itself is plain files, no build step).

```bash
node tools/serve.js
```

Then open http://localhost:8123/ (add `?dev` for the debug log:
http://localhost:8123/?dev). Ctrl+C stops the server.

## Tests

```bash
npm test
```

Runs every test once and ends with a pass/fail count.

## License

GPL-3.0. See [`LICENSE`](LICENSE).
