// The site's stats on a page (DESIGN.md "Stats"): one count when the page
// opens, and one each time a game starts (Play! or Play again). Every page
// loads this but log.html. The counts and why: src/core/stats.js. Each one
// goes in the debug log ("stats"), sent or not.

import { GOATCOUNTER, whyNotCounted, pagePath, gameEvent, otherSite, countUrl } from '../core/stats.js';
import { log } from './debuglog.js';
import { net } from './net.js';

const page = pagePath(location.pathname);

function send(opts, what) {
  // Asked at each count: the connection can come and go during a visit.
  const why = whyNotCounted({ hostname: location.hostname, webdriver: navigator.webdriver, online: navigator.onLine });
  if (why) {
    log.add('stats', `not counted (${why})`, { what });
    return;
  }
  const url = countUrl(GOATCOUNTER, { ...opts, rnd: Math.random().toString(36).slice(2, 8) });
  const img = new Image();
  img.onerror = () => log.add('stats', 'count not sent (blocked or offline)', { what });
  img.src = url;
  log.add('stats', 'counted', { what });
}

// The page count waits for the page to settle: an iPhone's installed app
// can say it's online as it opens in airplane mode (src/core/net.js).
net.afterSettle(() => send({
  path: page,
  title: document.title,
  referrer: otherSite(document.referrer, location.hostname),
  screen: `${screen.width},${screen.height},${devicePixelRatio}`,
}, page));

// Play! and Play again, on every game (capture: counted even if the game's
// own handler stops the click). Disabled buttons send no click.
if (!page.endsWith('/')) {
  const event = gameEvent(page);
  addEventListener('click', e => {
    if (e.target.closest?.('#playBtn, #againBtn')) send({ path: event, title: document.title, event: true }, event);
  }, { capture: true });
}
