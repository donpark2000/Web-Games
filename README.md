# Web Games

Simple games for young kids (ages 5-7), played in a web browser on a
tablet or phone, all reached from one home page. Two players (the second
a person, or in most games the robot): tic-tac-toe, matching cards,
Connect Four, Count to 9, Snakes and Ladders, Five Dice and Nim. One
player: rock paper scissors and Follow Me.

**Play it:** https://donpark2000.github.io/Web-Games/

**Play with no connection:** open the site once with a connection and
install it, as **Let's Play!** (iPhone and iPad: Safari, Share, Add to
Home Screen; Android, Windows, Mac and Linux: the browser's Install
button or menu). It's saved on the device, and every game then plays
with no wifi or cellular. Updates come in the next time it's opened
online.

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

## After changing the site

Any change to a page, style, script, data file or icon needs a new
version of the offline app's file list (the tests fail until then):

```bash
node tools/offline.js
```

On http://localhost:8123/ edits still show on a reload. To try the app
the way the live site behaves (saved files first), use
http://127.0.0.1:8123/ instead; stopping the server is then the same as
having no connection.

## License

GPL-3.0. See [`LICENSE`](LICENSE).
