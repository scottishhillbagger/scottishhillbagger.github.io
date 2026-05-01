// scripts/build-forecast.mjs
// Runs in GitHub Actions twice daily. Fetches MWIS pages directly,
// extracts a structured 3-day forecast via Claude, writes forecast.json.

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync } from 'fs';

const REGIONS = [
  { id: 'the-northwest-highlands', name: 'Northwest Highlands' },
  { id: 'west-highlands', name: 'West Highlands' },
  { id: 'cairngorms-np-and-monadhliath', name: 'Cairngorms & Monadhliath' },
  { id: 'southeastern-highlands', name: 'Southeastern Highlands' },
  { id: 'southern-uplands', name: 'Southern Uplands' },
];

// --- Date anchoring -------------------------------------------------
// MWIS publishes the morning bulletin around 07:30 UK time. If we're
// running before that, today's bulletin may not exist yet, so anchor
// the first day to today regardless and let the model handle it.
// Run-time is UTC in GitHub Actions; in summer Scotland is UTC+1.
const now = new Date();
const todayUK = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
const dayShort = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' });
const dayLong  = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' });
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const day0 = todayUK;
const day1 = addDays(todayUK, 1);
const day2 = addDays(todayUK, 2);

// --- Fetch MWIS pages directly --------------------------------------
async function fetchMWIS(id) {
  const url = `https://www.mwis.org.uk/forecasts/scottish/${id}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'scottishhillbagger.github.io forecast bot (https://scottishhillbagger.github.io)' },
  });
  if (!res.ok) throw new Error(`MWIS ${id}: HTTP ${res.status}`);
  const html = await res.text();
  return stripToText(html);
}

// Strip HTML to plain text — keep visible content only, drop tags.
function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pull "Last updated …" timestamp out of the stripped MWIS text.
function extractMWISUpdated(text) {
  // e.g. "Last updated Thu 30th Apr 26 at 7:35AM"
  const m = text.match(/Last updated\s+\w+\s+(\d+)\w*\s+(\w+)\s+(\d+)\s+at\s+(\d+):(\d+)(AM|PM)/i);
  if (!m) return null;
  const [, dayN, monthName, yr2, hh, mm, ampm] = m;
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthIdx = months.indexOf(monthName.slice(0,3).toLowerCase());
  if (monthIdx < 0) return null;
  let hour = parseInt(hh, 10) % 12;
  if (ampm.toUpperCase() === 'PM') hour += 12;
  const year = 2000 + parseInt(yr2, 10);
  return new Date(Date.UTC(year, monthIdx, parseInt(dayN, 10), hour, parseInt(mm, 10)));
}

// --- Build the prompt with fetched content embedded -----------------
function buildPrompt(pages) {
  const dateBlock = `Today is ${dayLong(day0)}. The 3 days you must forecast are:
- Day 1: ${dayShort(day0)} (${dayLong(day0)}) — TODAY
- Day 2: ${dayShort(day1)} (${dayLong(day1)})
- Day 3: ${dayShort(day2)} (${dayLong(day2)})`;

  const pagesBlock = pages
    .map((p) => `=== ${p.name} (source: ${p.url}) ===\nMWIS last updated: ${p.updatedAt || 'not detected'}\n\n${p.text.slice(0, 8000)}`)
    .join('\n\n');

  return `${dateBlock}

You will be given the live text of 5 MWIS regional forecast pages, fetched directly from mwis.org.uk just now. Extract the data for the 3 days listed above. Do not use prior knowledge — use ONLY the text provided below.

CRITICAL:
- The first day in your output MUST be today (${dayShort(day0)}). If the page's first labelled day is the day BEFORE today, skip that section and use today's section onward.
- Match data day-by-day to the date headings in each MWIS page (e.g. "Friday 1st May 2026"). Do not blend days.
- Use direct phrasing from MWIS for the "note" field — keep MWIS's specific places, named hazards, and gust speeds (e.g. "gusts 40mph east from Cairngorm plateau", "thundery bursts north of Glen Garry", "Arran/Jura/Mull strongest").

Return ONLY a single JSON object — no markdown fences, no preamble. Start with { end with }.

Schema:
{
  "summary": "One short sentence describing the 3-day pattern across Scotland.",
  "days": ["${dayShort(day0)}", "${dayShort(day1)}", "${dayShort(day2)}"],
  "updatedAt": "ISO 8601 — use the most recent MWIS 'Last updated' timestamp across the 5 pages",
  "regions": [
    {
      "name": "exact region name from the list",
      "forecast": [
        {
          "sky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",
          "windMph": 25,
          "windDir": "SE",
          "tempC": 12,
          "cloudFree": 90,
          "freezingLevel": 9999,
          "visibility": "excellent|good|moderate|poor",
          "amSky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",
          "pmSky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",
          "status": "go|marginal|poor",
          "note": "<=10 words, paraphrasing MWIS's most specific warning/highlight for this day"
        }
      ]
    }
  ]
}

Field rules:
- windMph: numeric average of the MWIS range. If MWIS says "20-30mph", use 25. If gusts are mentioned and stronger than the average (e.g. "20mph but gusty 40mph"), use the GUST value because it's the safety-relevant number.
- windDir: dominant compass direction.
- tempC: temperature on tops/summits.
- cloudFree: % chance of cloud-free summits. MWIS phrases like "extensive sunshine, mountains free of cloud" → 90-95. "Cloud may form below 600m" → 60-70. "Extensive cloud, may not clear all day" → 10-20.
- freezingLevel: metres ASL. "Above the summits" → 9999. If MWIS says "freezing level 700m" → 700.
- status: "go" = good Munro day (low wind, cloud-free tops, dry, safe temps). "marginal" = doable with caveats (gusty, mixed, low confidence forecast). "poor" = avoid (gales, heavy rain, white-out, dangerous).
- amSky/pmSky: split if MWIS says morning differs from afternoon (e.g. "dry morning, rain by afternoon" → amSky: sun, pmSky: rain).
- visibility: excellent (>30km), good (10-30km), moderate (4-10km), poor (<4km).
- note: max 10 words. Reuse MWIS's distinctive language. Examples: "gusts 40mph Cairngorm plateau", "thundery bursts Great Glen pm", "frost overnight, snow above 700m". DO NOT write generic notes like "patchy rain possible".

INPUT (live MWIS text):

${pagesBlock}`;
}

// --- JSON parsing with repair ---------------------------------------
const parseJSON = (text) => {
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1) throw new Error('no JSON object found');
  s = last > first ? s.slice(first, last + 1) : s.slice(first);

  const tryIt = (str) => { try { return JSON.parse(str); } catch { return null; } };
  let parsed = tryIt(s);
  if (parsed) return parsed;

  let r = s.replace(/,(\s*[}\]])/g, '$1');
  parsed = tryIt(r);
  if (parsed) return parsed;

  const opens = (r.match(/\{/g) || []).length;
  const closes = (r.match(/\}/g) || []).length;
  const aOpens = (r.match(/\[/g) || []).length;
  const aCloses = (r.match(/\]/g) || []).length;
  let trimmed = r.replace(/,?\s*"[^"]*$/, '').replace(/,?\s*\{[^}]*$/, '').replace(/,\s*$/, '');
  const candidate = trimmed + ']'.repeat(Math.max(0, aOpens - aCloses)) + '}'.repeat(Math.max(0, opens - closes));
  parsed = tryIt(candidate);
  if (parsed) return parsed;
  throw new Error('malformed JSON from model');
};

// --- Main -----------------------------------------------------------
console.log(`Build started ${now.toISOString()} — anchoring to ${dayShort(day0)} ${dayLong(day0)}`);

// 1. Fetch all 5 MWIS pages
console.log('Fetching MWIS pages…');
const pages = await Promise.all(REGIONS.map(async (r) => {
  try {
    const text = await fetchMWIS(r.id);
    const updated = extractMWISUpdated(text);
    const updatedISO = updated ? updated.toISOString() : null;
    console.log(`  ✓ ${r.name} — ${text.length} chars, MWIS updated: ${updatedISO || '?'}`);
    return { id: r.id, name: r.name, url: `https://www.mwis.org.uk/forecasts/scottish/${r.id}`, text, updatedAt: updatedISO };
  } catch (e) {
    console.error(`  ✗ ${r.name} — ${e.message}`);
    return { id: r.id, name: r.name, url: `https://www.mwis.org.uk/forecasts/scottish/${r.id}`, text: '', updatedAt: null, error: e.message };
  }
}));

// Freshness check — warn if all pages are >24h old
const updatedTimes = pages.map(p => p.updatedAt).filter(Boolean).map(t => new Date(t).getTime());
const newestUpdate = updatedTimes.length ? Math.max(...updatedTimes) : null;
const ageHours = newestUpdate ? (Date.now() - newestUpdate) / 36e5 : null;
if (ageHours !== null && ageHours > 24) {
  console.warn(`⚠ Newest MWIS update is ${ageHours.toFixed(1)}h old — data may be stale`);
}

// 2. Hand pages + date anchor to Claude for structured extraction
console.log('Asking Claude to structure the forecast…');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const message = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4000,
  messages: [{ role: 'user', content: buildPrompt(pages) }],
});

const responseText = message.content
  .filter(b => b.type === 'text')
  .map(b => b.text)
  .join('\n');

const data = parseJSON(responseText);

// 3. Stamp metadata
if (!data.updatedAt && newestUpdate) {
  data.updatedAt = new Date(newestUpdate).toISOString();
} else if (!data.updatedAt) {
  data.updatedAt = new Date().toISOString();
}
data._generated = new Date().toISOString();
data._anchorDate = day0.toISOString().slice(0, 10);

// 4. Sanity check — first day label should match today
const expectedFirst = dayShort(day0);
if (data.days?.[0] !== expectedFirst) {
  console.warn(`⚠ Expected first day "${expectedFirst}", got "${data.days?.[0]}" — overriding`);
  data.days = [dayShort(day0), dayShort(day1), dayShort(day2)];
}

writeFileSync('forecast.json', JSON.stringify(data, null, 2));
console.log(`✓ Wrote forecast.json — ${data.regions?.length || 0} regions, days: ${(data.days || []).join('/')}, updatedAt: ${data.updatedAt}`);
