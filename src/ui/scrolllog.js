// The home page's scroll room in the debug log (journal Q24: once, on the
// iPhone, it wouldn't scroll to its footer, and it can't be made to
// happen again): when it opens, changes size or turns, is shown again
// (also from the browser's memory), and when a scroll stops at its end.
// src/core/fit.js: scrollRoom.

import { scrollRoom } from '../core/fit.js';
import { log } from './debuglog.js';

const SETTLE_MS = 250;   // a resize or a scroll settles before it's logged

export function logScrollRoom(area) {
  let last = '';
  const room = () => scrollRoom({ docH: document.documentElement.scrollHeight, innerH: innerHeight, vvH: window.visualViewport?.height, scrollY });
  // `again`: logged only if something changed since the last line.
  const add = (why, r = room(), again = true) => {
    const key = JSON.stringify(r);
    if (!again && key === last) return;
    last = key;
    log.add(area, 'scroll room', { why, ...r });
  };
  const settle = fn => { let t = null; return () => { clearTimeout(t); t = setTimeout(fn, SETTLE_MS); }; };
  add('opened');
  addEventListener('resize', settle(() => add('resize', room(), false)));
  addEventListener('orientationchange', settle(() => add('turned')));
  addEventListener('pageshow', e => { if (e.persisted) add('shown again (from memory)'); });
  addEventListener('scroll', settle(() => { const r = room(); if (r.atEnd) add('scroll stopped at its end', r, false); }), { passive: true });
}
