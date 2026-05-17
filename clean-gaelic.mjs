#!/usr/bin/env node
/**
 * clean-gaelic.mjs
 * Normalises gaelic.json in-place.
 *
 * Run from the repo root:
 *   node clean-gaelic.mjs              # apply changes
 *   node clean-gaelic.mjs --dry-run    # preview changes, don't write
 *   node clean-gaelic.mjs --verbose    # show each individual change
 */
import { readFileSync, writeFileSync } from 'fs';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose') || DRY_RUN;

const data = JSON.parse(readFileSync('gaelic.json', 'utf-8'));

// ── Manual overrides for known edge cases ──────────────────────────────────
// These run first and bypass the automated rules entirely.
const overrides = {
  'm001': { meaning: 'Hill of heaven', pronunciation: 'ben NEV-ish' },
  // Lochnagar: "little breasts" is accurate but jarring for the main app —
  // use the corrie interpretation. The detailed field guide (data.js) carries
  // the full Beinn Chìochan note for users who want the deeper story.
  'm021': { meaning: 'Hill of the noisy corrie', pronunciation: 'loch-na-GAR' },
  // c008 Foinaven — "white" alone is too short
  'c008': { meaning: 'White/pale hill',          pronunciation: 'FON-a-ven' },
};

// ── Counters split by rule, so the summary is honest about what changed ──
const counts = {
  overrides: 0,
  missingOverrides: 0,
  hedgesStripped: 0,
  slashesExpanded: 0,
  cased: 0,
  placeholdersDropped: 0,
  nulled: 0,
};

const log = (msg) => { if (VERBOSE) console.log('  ' + msg); };

// ── Apply overrides; warn on any that target a missing peak id ──────────
for (const [id, val] of Object.entries(overrides)) {
  if (id in data) {
    if (JSON.stringify(data[id]) !== JSON.stringify(val)) {
      log(`override ${id}: ${JSON.stringify(data[id])} → ${JSON.stringify(val)}`);
      data[id] = val;
      counts.overrides++;
    }
  } else {
    console.warn(`⚠ Override targets missing id: ${id}`);
    counts.missingOverrides++;
  }
}

// ── Sentence-case helper that preserves proper nouns ────────────────────
// Naive .toLowerCase() mangles "MacDuff", "Caledonians", "Loch", etc.
// Strategy: lowercase only words that look like ordinary common nouns —
// keep any word that's already mixed-case (e.g. "MacDuff") or that appears
// in a small allow-list of place/people roots. First letter of the whole
// string always capitalised.
// Canonical casing for proper-noun roots. Keys are lowercase for lookup;
// values are the form to emit. This catches inputs that arrived in ALL
// CAPS or all-lowercase and restores the right shape.
const PROPER_CASING = {
  'caledonians': 'Caledonians',
  'macduff':     'MacDuff',
  "macduff's":   "MacDuff's",
  'mackenzie':   'MacKenzie',
  'macgregor':   'MacGregor',
  'loch':        'Loch',
  'glen':        'Glen',
  'ben':         'Ben',
  'cuillin':     'Cuillin',
  'cairngorm':   'Cairngorm',
  'cairngorms':  'Cairngorms',
  'highland':    'Highland',
  'highlands':   'Highlands',
  'lewis':       'Lewis',
  'skye':        'Skye',
  'mull':        'Mull',
  'rum':         'Rum',
  'jura':        'Jura',
  'arran':       'Arran',
  'islay':       'Islay',
  'harris':      'Harris',
  'fionn':       'Fionn',
  "fionn's":     "Fionn's",
  "fingal's":    "Fingal's",
  'mhic':        'Mhic',
  'norse':       'Norse',
  'gaelic':      'Gaelic',
  'pictish':     'Pictish',
  'celtic':      'Celtic',
  'fillan':      'Fillan',
  'mungo':       'Mungo',
  'columba':     'Columba',
  'patrick':     'Patrick',
  'bride':       'Bride',
  'bridget':     'Bridget',
};

function smartSentenceCase(s) {
  // Tokenize on whitespace but preserve original separators
  const tokens = s.split(/(\s+)/);
  const out = tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return tok;
    // Keep any token that's genuinely mixed-case as-is (preserves "MacDuff" etc.).
    // "Genuinely mixed-case" = has uppercase past position 0 AND has lowercase
    // somewhere. This catches "MacDuff" but normalizes "MACDUFF" and "macduff".
    if (/[A-Z]/.test(tok.slice(1)) && /[a-z]/.test(tok)) return tok;
    // Strip trailing punctuation when checking the lookup table
    const trailingPunc = (tok.match(/[.,;:]$/) || [''])[0];
    const bare = tok.toLowerCase().replace(/[.,;:]$/, '');
    if (PROPER_CASING[bare]) {
      return PROPER_CASING[bare] + trailingPunc;
    }
    // Ordinary word: lowercase
    return tok.toLowerCase();
  });
  // Force first non-whitespace character to uppercase
  const joined = out.join('');
  const firstAlpha = joined.search(/[A-Za-z]/);
  if (firstAlpha === -1) return joined;
  return joined.slice(0, firstAlpha) + joined[firstAlpha].toUpperCase() + joined.slice(firstAlpha + 1);
}

// ── Pronunciation looks-like-a-real-guide validator ─────────────────────
// Old logic blocked specific known-bad strings ("HILL", "ENGLISH" etc.).
// New logic accepts any pronunciation that *looks* like a phonetic guide —
// has a stressed syllable (CAPS run of 2+ letters) or at least one hyphen.
// Rejects bare English words, prose like "see meaning", etc.
function looksLikePronunciation(s) {
  if (!s || typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length === 0) return false;
  // Known explicit bailouts
  if (/^(unknown|n\/?a|see [a-z]+|english|not gaelic)$/i.test(trimmed)) return false;
  // A real pronunciation guide has either:
  //   • multiple syllables joined by hyphens (e.g. "ben NEV-ish", "FON-a-ven")
  //   • or at least one stressed syllable plus another syllable
  // A bare single word like "HILL" or "MOUNTAIN" doesn't qualify — it's the
  // model's placeholder for "this isn't actually a pronunciation".
  const hasHyphen = /-/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  // If no hyphens AND it's a single word, reject — even if it's all caps.
  if (!hasHyphen && wordCount === 1) return false;
  // Otherwise require at least one stress marker or hyphenated syllable break.
  return hasHyphen || /[A-Z]{2,}/.test(trimmed);
}

// ── Automated cleanup ──────────────────────────────────────────────────────
for (const [id, val] of Object.entries(data)) {
  if (!val || id in overrides) continue;

  if (val.meaning) {
    let m = val.meaning.trim();
    const original = m;

    // Strip "possibly " hedge (the prompt now discourages this, but old runs
    // still contain it). Log so they can be spot-checked.
    if (/^possibly\s+/i.test(m)) {
      m = m.replace(/^possibly\s+/i, '');
      log(`${id} hedge stripped: "${original}" → "${m}"`);
      counts.hedgesStripped++;
    }

    // Slash alternatives — preserve both rather than silently dropping the
    // second. "Pillar/eye mountain" → "Pillar or eye mountain". Reads better
    // and retains the etymology information.
    if (m.includes('/')) {
      const before = m;
      m = m.split('/').map(s => s.trim()).filter(Boolean).join(' or ');
      log(`${id} slash expanded: "${before}" → "${m}"`);
      counts.slashesExpanded++;
    }

    // Sentence case with proper-noun preservation
    const cased = smartSentenceCase(m);
    if (cased !== m) {
      log(`${id} cased: "${m}" → "${cased}"`);
      counts.cased++;
      m = cased;
    }

    if (m !== val.meaning) val.meaning = m;
  }

  // Validate pronunciation; drop if it doesn't look like a real guide.
  if (val.pronunciation && !looksLikePronunciation(val.pronunciation)) {
    log(`${id} pronunciation dropped: "${val.pronunciation}"`);
    delete val.pronunciation;
    counts.placeholdersDropped++;
  }

  // Null out entries where both fields are now empty
  if (!val.meaning && !val.pronunciation) {
    log(`${id} nulled (both fields empty)`);
    data[id] = null;
    counts.nulled++;
  }
}

// ── Write (or pretend to) ───────────────────────────────────────────────
if (!DRY_RUN) {
  writeFileSync('gaelic.json', JSON.stringify(data, null, 2));
}

const withData = Object.values(data).filter(v => v !== null).length;
const totalChanges = counts.overrides + counts.hedgesStripped + counts.slashesExpanded + counts.cased + counts.placeholdersDropped + counts.nulled;

console.log('');
console.log(DRY_RUN ? '─── DRY RUN — no file written ───' : '─── Applied ───');
console.log(`  Overrides applied:        ${counts.overrides}`);
if (counts.missingOverrides) console.log(`  Overrides missing target: ${counts.missingOverrides}`);
console.log(`  "Possibly" hedges removed: ${counts.hedgesStripped}`);
console.log(`  Slash alternatives expanded: ${counts.slashesExpanded}`);
console.log(`  Sentence-cased:           ${counts.cased}`);
console.log(`  Placeholder pronunciations dropped: ${counts.placeholdersDropped}`);
console.log(`  Entries nulled:           ${counts.nulled}`);
console.log(`  Total changes:            ${totalChanges}`);
console.log(`  Total with Gaelic data:   ${withData}`);
