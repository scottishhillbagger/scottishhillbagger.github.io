#!/usr/bin/env node
/**
 * build-gaelic.mjs
 * Generates Gaelic name meanings and pronunciations for Munros, Corbetts, and Fionas.
 * Outputs: gaelic.json
 *
 * Usage: ANTHROPIC_API_KEY=sk-... node build-gaelic.mjs
 *        --refresh   regenerate everything from scratch
 *        --source=X  read peaks from X (default: peaks.js, falls back to index.html)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';

const REFRESH = process.argv.includes('--refresh');
const sourceArg = process.argv.find(a => a.startsWith('--source='));
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1); }

// ── Source file detection ────────────────────────────────────────────────
// After the index.html → peaks.js refactor, peak data lives in peaks.js.
// Fall back to index.html for older checkouts so this script keeps working
// either way.
const sourceFile = sourceArg
  ? sourceArg.slice('--source='.length)
  : (existsSync('peaks.js') ? 'peaks.js' : 'index.html');

if (!existsSync(sourceFile)) {
  console.error(`Source file not found: ${sourceFile}`);
  process.exit(1);
}
console.log(`Reading peaks from ${sourceFile}`);

const sourceText = readFileSync(sourceFile, 'utf-8');

// Tolerant of formatting: allow whitespace anywhere between tokens, allow the
// id/name/type fields in any order, allow optional spaces and quote styles.
// We do one strict parse first; if it returns zero, we fall back to a
// looser per-field scan to be helpful about debugging.
const peakRegexStrict = /\{\s*id\s*:\s*["']([^"']+)["']\s*,\s*name\s*:\s*["']([^"']+)["']\s*,\s*type\s*:\s*["'](munro|corbett|fiona)["']/g;
const peaks = [];
let m;
while ((m = peakRegexStrict.exec(sourceText)) !== null) {
  peaks.push({ id: m[1], name: m[2], type: m[3] });
}

if (peaks.length === 0) {
  console.error(`No peaks parsed from ${sourceFile}. Expected entries of the form:`);
  console.error(`  {id:"m001",name:"Ben Nevis",type:"munro",...}`);
  console.error(`Check that the source file actually contains the peak array.`);
  process.exit(1);
}

console.log(`Found ${peaks.length} peaks (${peaks.filter(p=>p.type==='munro').length} Munros, ${peaks.filter(p=>p.type==='corbett').length} Corbetts, ${peaks.filter(p=>p.type==='fiona').length} Fionas)`);

const outFile = 'gaelic.json';
const existing = (!REFRESH && existsSync(outFile)) ? JSON.parse(readFileSync(outFile, 'utf-8')) : {};
const todo = peaks.filter(p => !(p.id in existing));
console.log(`${Object.keys(existing).length} already done, ${todo.length} to process`);
if (todo.length === 0) { console.log('Nothing to do.'); process.exit(0); }

const BATCH = 40;
const results = { ...existing };

// ── JSON extraction (resilient to wrapping prose / fences) ──────────────
function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch(_) {}
  const stripped = text.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
  try { return JSON.parse(stripped); } catch(_) {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch(_) {}
  }
  throw new Error(`Could not extract JSON. Raw response:\n${text.slice(0, 300)}`);
}

// ── Static system prompt (stable across batches → cacheable) ────────────
// Splitting the prompt this way lets us mark the long static preamble with
// cache_control: ephemeral, so it doesn't get re-billed every batch. The
// per-batch hill list goes in the user turn where it can vary.
const SYSTEM_PROMPT = `You are an expert in Scottish Gaelic hill names, etymology, and pronunciation.

For each Scottish hill the user lists, provide one entry in a single JSON object keyed by the peak id. Output ONLY the JSON — no introduction, no explanation, no markdown code fences. Your entire response must start with { and end with }.

Fields per entry:
- "meaning": concise English translation, max 6 words, literal. OMIT this field if the name is non-Gaelic OR if the etymology is genuinely unknown. Do not hedge with "possibly" — either you know it or you omit the field.
- "pronunciation": phonetic guide for English speakers, CAPS for stressed syllables, hyphens between syllables (e.g. "ben NEV-ish"). OMIT this field if the name is obviously English ("Cairnsmore", "Hart Fell", etc.).

For a peak that is entirely English or has an unknown name, return an empty object: {}. Do NOT use placeholder strings like "English name" or "unknown".

Return exactly one entry per id requested, with the same ids the user provided — no extra ids, no missing ids.

Gaelic rules (for your reference, don't echo these in the output):
beinn/ben=hill, càrn/carn=cairn, mòr/mor=big, beag/beg=small, dearg=red, dubh/dhu=black, gorm=blue-green, bàn/ban=white, ruadh=reddish-brown, odhar=dun/grey, breac=speckled, uaine=green, geal=bright white, liath=grey, coire=corrie, gleann=glen, bealach=pass
Pronunciation: bh/mh=v, gh=mostly silent, ch=loch-sound (write as 'ch'), dh=y/silent, -ach="-ach", -aidh="-ee", -aig="-ak"`;

// ── Per-batch API call with retry + backoff ─────────────────────────────
async function callBatch(batch, attempt = 1) {
  const userMessage = `Hills:\n${batch.map(p => `${p.id} (${p.type}): ${p.name}`).join('\n')}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      temperature: 0,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  // Distinguish transient (retry) from terminal (give up) failures by HTTP
  // status code. 429 = rate-limited, 5xx = server-side, both worth retrying.
  // 4xx other than 429 are our bug; don't burn retries on those.
  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => '');
    const transient = resp.status === 429 || resp.status >= 500;
    if (transient && attempt < 4) {
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.warn(`  ⚠ HTTP ${resp.status} (attempt ${attempt}/3) — retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      return callBatch(batch, attempt + 1);
    }
    throw new Error(`HTTP ${resp.status}: ${bodyText.slice(0, 200)}`);
  }

  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return extractJSON(data.content[0].text);
}

// ── Schema validation per parsed batch ──────────────────────────────────
function validateBatch(parsed, batch) {
  const requestedIds = new Set(batch.map(p => p.id));
  const returnedIds = new Set(Object.keys(parsed));
  const missing = [...requestedIds].filter(id => !returnedIds.has(id));
  const extra = [...returnedIds].filter(id => !requestedIds.has(id));
  if (missing.length) console.warn(`  ⚠ Missing ${missing.length} ids in response: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
  if (extra.length)   console.warn(`  ⚠ Extra ${extra.length} unrequested ids in response: ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? '…' : ''}`);
  // Drop hallucinated ids so they don't pollute the output.
  for (const id of extra) delete parsed[id];
  return { missing: missing.length, extra: extra.length };
}

for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH);
  console.log(`\nBatch ${Math.floor(i/BATCH)+1}/${Math.ceil(todo.length/BATCH)}: ${batch[0].name} → ${batch[batch.length-1].name}`);

  try {
    const parsed = await callBatch(batch);
    validateBatch(parsed, batch);

    let added = 0;
    for (const [id, val] of Object.entries(parsed)) {
      results[id] = (val.meaning || val.pronunciation) ? val : null;
      if (results[id]) added++;
    }
    console.log(`  ✓ ${added} Gaelic, ${Object.keys(parsed).length - added} omitted`);
    writeFileSync(outFile, JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(`  ✗ Failed after retries: ${err.message} — progress saved, re-run to continue`);
    writeFileSync(outFile, JSON.stringify(results, null, 2));
    process.exit(1);
  }

  if (i + BATCH < todo.length) await new Promise(r => setTimeout(r, 600));
}

const withData = Object.values(results).filter(v => v !== null).length;
const omitted = Object.values(results).filter(v => v === null).length;
console.log(`\n✓ Done. ${withData} with Gaelic data, ${omitted} omitted. Written to ${outFile}`);
