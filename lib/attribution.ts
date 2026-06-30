/* First-party, first-touch campaign attribution. Captured on landing into
   sessionStorage (ephemeral, no persistent tracking cookie → no consent gate),
   passed to Paddle at checkout, and stored on the purchase so CAC/ROAS per
   campaign can be queried from our own DB. Client-only. */

export interface Attribution {
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_term?: string; utm_content?: string; gclid?: string; ref?: string;
  referrer?: string; landing?: string; ts?: string;
}

const KEY = 'vb_attr';
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'ref'] as const;

/** Store first-touch attribution for this session (won't overwrite an earlier touch). */
export function captureAttribution(): void {
  try {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(KEY)) return;                 // first-touch only
    const p = new URLSearchParams(window.location.search);
    const attr: Attribution = {};
    for (const f of FIELDS) { const v = p.get(f); if (v) attr[f] = v.slice(0, 200); }
    const referrer = document.referrer || '';
    const external = referrer && !referrer.includes(window.location.host);
    if (Object.keys(attr).length === 0 && !external) return; // nothing worth storing (direct/internal)
    if (external) attr.referrer = referrer.slice(0, 300);
    attr.landing = window.location.pathname.slice(0, 200);
    attr.ts = new Date().toISOString();
    sessionStorage.setItem(KEY, JSON.stringify(attr));
  } catch { /* storage blocked — skip silently */ }
}

/** Read the stored attribution for this session, if any. */
export function getAttribution(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch { return null; }
}
