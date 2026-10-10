// The site's stats on a page (DESIGN.md "Stats"): one count when the page
// opens, and one each time a game starts (Play! or Play again). Every page
// loads this but log.html. The counts and why: src/core/stats.js. Each one
// goes in the debug log ("stats"), sent or not.

import { GOATCOUNTER, shouldCount, pagePath, gameEvent, otherSite, countUrl } from '../core/stats.js';
import { log } from './debuglog.js';

const live = shouldCount({ hostname: location.hostname, webdriver: navigator.webdriver });
const page = pagePath(location.pathname);

function send(opts, what) {
  if (!live) {
    log.add('stats', `not counted (${navigator.webdriver ? 'automated browser' : location.hostname || 'a file'})`, { what });
    return;
  }
  const url = countUrl(GOATCOUNTER, { ...opts, rnd: Math.random().toString(36).slice(2, 8) });
  const img = new Image();
  img.onerror = () => log.add('stats', 'count not sent (blocked or offline)', { what });
  img.src = url;
  log.add('stats', 'counted', { what });
}

send({
  path: page,
  title: document.title,
  referrer: otherSite(document.referrer, location.hostname),
  screen: `${screen.width},${screen.height},${devicePixelRatio}`,
}, page);

// Play! and Play again, on every game (capture: counted even if the game's
// own handler stops the click). Disabled buttons send no click.
if (!page.endsWith('/')) {
  const event = gameEvent(page);
  addEventListener('click', e => {
    if (e.target.closest?.('#playBtn, #againBtn')) send({ path: event, title: document.title, event: true }, event);
  }, { capture: true });
}
