// The page's one view of the connection (src/core/net.js), with the
// browser's navigator, timers and events. Loaded by src/ui/offline.js and
// src/ui/stats.js.

import { createNet } from '../core/net.js';
import { log } from './debuglog.js';

export const net = createNet({ nav: navigator, wait: setTimeout, on: addEventListener, log });
