// The start of every Topple Lab page (DESIGN.md "Topple Lab"): the first
// and only script tag the page has; ./begin.js does the work (keeps the
// lab's saves apart, then loads the page's scripts).
import { begin } from './begin.js';

await begin({ win: window, doc: document, load: u => import(u) });
