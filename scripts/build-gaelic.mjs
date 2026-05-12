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

for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH);
  console.log(`\nBatch ${Math.floor(i/BATCH)+1}/${Math.ceil(todo.length/BATCH)}: ${batch[0].name} → ${batch[batch.length-1].name}`);

  const prompt = `You are an expert in Scottish Gaelic hill names, etymology, and pronunciation.

For each Scottish hill below, provide:
- "meaning": concise English translation (max 6 words, literal). OMIT if name is non-Gaelic or etymology is genuinely unknown.
- "pronunciation": phonetic guide for English speakers. CAPS for stressed syllables. Hyphens between syllables. Omit if name is obviously English.

Gaelic conventions:
beinn/ben=hill, càrn/carn=cairn, mòr/mor=big, beag/beg=small, dearg=red, dubh/dhu=black, gorm=blue-green, bàn/ban=white, ruadh=reddish-brown, odhar=dun/greyish, breac=speckled, uaine=green, geal=white/bright, liath=grey, coire=corrie, gleann=glen, bealach=pass
bh/mh=v, gh=mostly silent, ch=loch-sound, dh=y/silent, -ach="-ach", -aidh="-ee", -aig="-ak"

Return ONLY valid JSON, no markdown:
{
  "id1": { "meaning": "...", "pronunciation": "..." },
  "id2": { "meaning": "..." },
  "id3": {}
}
Use {} if name is English/unknown and neither field applies.

Hills:
${batch.map(p => `${p.id} (${p.type}): ${p.name}`).join('\n')}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': API_KEY },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content[0].text.trim().replace(/^```json\s*/,'').replace(/\s*```$/,'');
    const parsed = JSON.parse(text);
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
console.log(`\n✓ Done. ${withData} with Gaelic data, ${omitted} omitted (English/unknown). Written to ${outFile}`);
