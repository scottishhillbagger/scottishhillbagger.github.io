#!/usr/bin/env node
/**
 * clean-gaelic.mjs
 * Normalises gaelic.json in-place.
 * Run from the repo root: node clean-gaelic.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('gaelic.json', 'utf-8'));
let cleaned = 0, nulled = 0;

// ── Manual overrides for known edge cases ──────────────────────────────────
const overrides = {
  'm001': { meaning: 'Hill of heaven', pronunciation: 'ben NEV-ish' },
  // Lochnagar: "little breasts" is accurate but jarring — use the corrie interpretation
  'm021': { meaning: 'Hill of the noisy corrie', pronunciation: 'loch-na-GAR' },
  // c008 Foinaven — "white" alone is too short
  'c008': { meaning: 'White/pale hill', pronunciation: 'FON-a-ven' },
};

for (const [id, val] of Object.entries(overrides)) {
  if (id in data) { data[id] = val; cleaned++; }
}

// ── Automated cleanup ──────────────────────────────────────────────────────
for (const [id, val] of Object.entries(data)) {
  if (!val || id in overrides) continue;

  if (val.meaning) {
    let m = val.meaning.trim();
    // Remove "possibly " hedge
    m = m.replace(/^possibly\s+/i, '');
    // Slash alternatives — keep first option only
    if (m.includes('/')) m = m.split('/')[0].trim();
    // Sentence case
    m = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
    if (m !== val.meaning) { val.meaning = m; cleaned++; }
  }

  // Remove placeholder pronunciations
  if (val.pronunciation && /\bGYAL-ik\b|\bHILL\b|\bENGLISH\b/i.test(val.pronunciation)) {
    delete val.pronunciation;
    cleaned++;
  }

  // Null out entries where both fields are now empty
  if (!val.meaning && !val.pronunciation) { data[id] = null; nulled++; }
}

writeFileSync('gaelic.json', JSON.stringify(data, null, 2));

const withData = Object.values(data).filter(v => v !== null).length;
console.log(`✓ Done. ${cleaned} entries updated, ${nulled} nulled. ${withData} total with Gaelic data.`);
