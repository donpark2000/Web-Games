// A service worker (sw.js, or the Topple Lab's topple-lab/sw.js) run here
// with a fake cache store and a fake network, for the offline tests
// (tests/offline.test.js, tests/topple-lab.test.js). Not a test itself.
import vm from 'node:vm';
import { withList } from '../tools/offline.js';

// Runs `source` (a sw.js) for `host`, served from `dir` (its scope), with
// FILES and VERSION set, a fake cache store and a fake network: `net.down`
// makes every fetch fail; `net.missing` files answer 404. Returns the
// handlers and what they did.
export function runSw(source, { host = 'donpark2000.github.io', dir = '/Web-Games/', files = ['index.html', 'nim.html', 'src/a.js'], version = 'v2', made = '2026-10-11', release = '', store = new Map(), hashes = {} } = {}) {
  const scope = `https://${host}${dir}`;
  const net = { down: false, missing: [], calls: [] };
  const fetch = async r => {
    const url = typeof r === 'string' ? r : r.url;
    net.calls.push({ url, cache: r.cache });
    if (net.down) throw new TypeError('Failed to fetch');
    const status = net.missing.some(m => url.endsWith(m)) ? 404 : 200;
    return new Response(`net:${new URL(url).pathname}`, { status });
  };
  const caches = {
    async open(name) {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        async addAll(reqs) {   // all or nothing, like the real one
          const got = [];
          for (const r of reqs) {
            const res = await fetch(r);
            if (!res.ok) throw new TypeError(`${r.url}: ${res.status}`);
            got.push([r.url, res]);
          }
          for (const [u, res] of got) m.set(u, res);
        },
        async match(u) { return m.get(u)?.clone(); },
        async put(u, res) { m.set(u, res); },
      };
    },
    async keys() { return [...store.keys()]; },
    async delete(name) { return store.delete(name); },
  };
  const handlers = {}, did = { skipWaiting: 0, claim: 0, posted: [] };
  const self = {
    location: new URL(`${scope}sw.js`), registration: { scope },
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: async () => { did.skipWaiting++; },
    clients: { claim: async () => { did.claim++; } },
  };
  vm.runInNewContext(withList(source, version, files, made, release, hashes), { self, caches, fetch, Request, Response, URL });
  const wait = type => { const e = { waitUntil(p) { e.p = p; } }; handlers[type](e); return e.p; };
  // A fetch event: the response, or null if sw.js leaves it to the browser.
  const get = async (url, method = 'GET') => {
    const e = { request: new Request(url, { method }), respondWith(p) { e.p = p; } };
    handlers.fetch(e);
    return e.p ? e.p : null;
  };
  return { handlers, did, net, store, scope, install: () => wait('install'), activate: () => wait('activate'), get };
}
