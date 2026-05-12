#!/usr/bin/env node
/**
 * build-gaelic.mjs
 * Generates Gaelic name meanings and pronunciations for Munros, Corbetts, and Fionas.
 * Outputs: gaelic.json
 *
 * Usage:  ANTHROPIC_API_KEY=sk-... node build-gaelic.mjs
 * Pass --refresh to regenerate everything from scratch.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const REFRESH = process.argv.includes('--refresh');
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1); }

const html = readFileSync('index.html', 'utf-8');
const peakRegex = /\{id:"([^"]+)",name:"([^"]+)",type:"(munro|corbett|fiona)"/g;
const peaks = [];
let m;
while ((m = peakRegex.exec(html)) !== null) {
  peaks.push({ id: m[1], name: m[2], type: m[3] });
}
console.log(`Found ${peaks.length} peaks (${peaks.filter(p=>p.type==='munro').length} Munros, ${peaks.filter(p=>p.type==='corbett').length} Corbetts, ${peaks.filter(p=>p.type==='fiona').length} Fionas)`);

const outFile = 'gaelic.json';
const existing = (!REFRESH && existsSync(outFile)) ? JSON.parse(readFileSync(outFile, 'utf-8')) : {};
const todo = peaks.filter(p => !(p.id in existing));
console.log(`${Object.keys(existing).length} already done, ${todo.length} to process`);
if (todo.length === 0) { console.log('Nothing to do.'); process.exit(0); }

const BATCH = 40;
const results = { ...existing };

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

for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH);
  console.log(`\nBatch ${Math.floor(i/BATCH)+1}/${Math.ceil(todo.length/BATCH)}: ${batch[0].name} → ${batch[batch.length-1].name}`);

  const prompt = `You are an expert in Scottish Gaelic hill names, etymology, and pronunciation.

For each Scottish hill below provide a JSON object. Output ONLY the JSON — no introduction, no explanation, no markdown code fences. Your entire response must start with { and end with }.

Fields per entry:
- "meaning": concise English translation max 6 words, literal. OMIT field if name is non-Gaelic or etymology unknown.
- "pronunciation": phonetic for English speakers, CAPS for stressed syllables, hyphens between syllables. OMIT if name is obviously English.

Use {} for any peak with an English or unknown name.

Gaelic rules:
beinn/ben=hill, càrn/carn=cairn, mòr/mor=big, beag/beg=small, dearg=red, dubh/dhu=black, gorm=blue-green, bàn/ban=white, ruadh=reddish-brown, odhar=dun/grey, breac=speckled, uaine=green, geal=bright white, liath=grey, coire=corrie, gleann=glen, bealach=pass
bh/mh=v, gh=mostly silent, ch=loch-sound (write as ch), dh=y/silent, -ach="-ach", -aidh="-ee", -aig="-ak"

Hills:
${batch.map(p => `${p.id} (${p.type}): ${p.name}`).join('\n')}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': API_KEY },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);

    const parsed = extractJSON(data.content[0].text);
    let added = 0;
    for (const [id, val] of Object.entries(parsed)) {
      results[id] = (val.meaning || val.pronunciation) ? val : null;
      if (results[id]) added++;
    }
    console.log(`  ✓ ${added} Gaelic, ${Object.keys(parsed).length - added} omitted`);
    writeFileSync(outFile, JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(`  ✗ Failed: ${err.message} — progress saved, re-run to continue`);
    writeFileSync(outFile, JSON.stringify(results, null, 2));
    process.exit(1);
  }

  if (i + BATCH < todo.length) await new Promise(r => setTimeout(r, 600));
}

const withData = Object.values(results).filter(v => v !== null).length;
const omitted  = Object.values(results).filter(v => v === null).length;
console.log(`\n✓ Done. ${withData} with Gaelic data, ${omitted} omitted. Written to ${outFile}`);
