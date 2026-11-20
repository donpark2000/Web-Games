// The Topple Lab's saves kept apart from the main site's (DESIGN.md "Topple
// Lab"). The lab runs the main site's code, which keeps the game, the
// tutorials seen, the sound and drawing settings and the debug log on the
// device under its own names ('web-games-topple-game', 'web-games-log',
// ...). The lab and the main site share donpark2000.github.io's storage, so
// on the lab's pages both of the browser's stores (localStorage,
// sessionStorage) are swapped for a view that puts PREFIX in front of every
// name: the lab's game is 'web-games-topple-lab-web-games-topple-game', and
// the main site's names are never read, written or cleared from the lab.
// No page code here (it's given the window), so it's tested in Node.

export const PREFIX = 'web-games-topple-lab-';
const STORES = ['localStorage', 'sessionStorage'];

// A store (getItem, setItem, removeItem, key, length, clear) that sees only
// the names in `real` starting with `prefix`, without it.
export class LabStorage {
  #real; #prefix;
  constructor(real, prefix = PREFIX) { this.#real = real; this.#prefix = prefix; }
  #own() {
    const out = [];
    for (let i = 0; i < this.#real.length; i++) {
      const k = this.#real.key(i);
      if (k?.startsWith(this.#prefix)) out.push(k);
    }
    return out;
  }
  get length() { return this.#own().length; }
  key(i) { return this.#own()[i]?.slice(this.#prefix.length) ?? null; }
  getItem(k) { return this.#real.getItem(this.#prefix + String(k)); }
  setItem(k, v) { this.#real.setItem(this.#prefix + String(k), v); }
  removeItem(k) { this.#real.removeItem(this.#prefix + String(k)); }
  clear() { for (const k of this.#own()) this.#real.removeItem(k); }
}

// Swaps `win`'s stores for the lab's view. { ok: true, stores } when every
// store the page can reach is the lab's view; { ok: false, why } when one
// couldn't be swapped (the lab mustn't start: the main site's code would
// use the main site's names). A store the browser blocks (reading it
// throws) stays blocked: the main site's code then keeps nothing.
export function guard(win, prefix = PREFIX) {
  const stores = [];
  for (const name of STORES) {
    let real;
    try { real = win[name]; } catch { stores.push(`${name}: blocked`); continue; }
    if (real === null || real === undefined) { stores.push(`${name}: none`); continue; }
    if (real instanceof LabStorage) { stores.push(`${name}: the lab's already`); continue; }
    const view = new LabStorage(real, prefix);
    try { Object.defineProperty(win, name, { configurable: true, enumerable: true, get: () => view }); } catch { /* checked below */ }
    let now = null;
    try { now = win[name]; } catch { /* as below */ }
    if (now !== view) return { ok: false, why: `${name} couldn't be kept apart from the main site's` };
    stores.push(`${name}: the lab's`);
  }
  return { ok: true, stores };
}
