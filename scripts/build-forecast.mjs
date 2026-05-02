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

// --- Date helpers ---------------------------------------------------
const now = new Date();
const todayUK = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
const dayShort = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' });
const dayLong  = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' });
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

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
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&[a-z]+;/gi, '');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

// Pull "Last updated …" timestamp out of the stripped MWIS text.
function extractMWISUpdated(text) {
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
function buildPrompt(pages, forecastDays, isAfternoon) {
  const [day0, day1, day2] = forecastDays;
  const firstDayLabel = isAfternoon ? "TOMORROW (relative to update)" : "TODAY (relative to update)";

  const dateBlock = `The 3 days you must forecast are:\n- Day 1: ${dayShort(day0)} (${dayLong(day0)}) — ${firstDayLabel}\n- Day 2: ${dayShort(day1)} (${dayLong(day1)})\n- Day 3: ${dayShort(day2)} (${dayLong(day2)})`;

  const mappedPages = pages.map((p) => `=== ${p.name} (source: ${p.url}) ===\nMWIS last updated: ${p.updatedAt || 'not detected'}\n\n${p.text.slice(0, 8000)}`);
  const pagesBlock = mappedPages.join('\n\n');

  return `${dateBlock}\n\nYou will be given the live text of 5 MWIS regional forecast pages, fetched directly from mwis.org.uk just now. Extract the data for the 3 days listed above. Do not use prior knowledge — use ONLY the text provided below.\n\nCRITICAL:\n- The first day in your output MUST be ${dayShort(day0)}. If the page's first labelled day is the day BEFORE ${dayShort(day0)}, skip that section and start from ${dayShort(day0)} onward.\n- Match data day-by-day to the date headings in each MWIS page (e.g. "Friday 1st May 2026"). Do not blend days.\n- Region names in your output must match EXACTLY (verbatim, including punctuation and capitalisation):\n    "Northwest Highlands"\n    "West Highlands"\n    "Cairngorms & Monadhliath"\n    "Southeastern Highlands"\n    "Southern Uplands"\n- Read MWIS's headline verdict for each day FIRST. MWIS leads each day with summary lines like "Unbroken bright sunshine" or "Extensive sunshine, mountains free of cloud" or "Heavy thundery bursts". This headline is the ground truth for sky/cloud — anchor your sky, cloudFree, and status to it. Don't dilute it because a later sentence mentions a small risk.\n- Use direct phrasing from MWIS for the "note" field — keep MWIS's specific places, named hazards, and gust speeds (e.g. "gusts 40mph east from Cairngorm plateau", "thundery bursts north of Glen Garry", "Arran/Jura/Mull strongest").\n\nReturn ONLY a single JSON object — no markdown fences, no preamble. Start with { end with }.\n\nSchema:\n{\n  "summary": "One short sentence describing the 3-day pattern across Scotland.",\n  "days": ["${dayShort(day0)}", "${dayShort(day1)}", "${dayShort(day2)}"],\n  "updatedAt": "ISO 8601 — use the most recent MWIS 'Last updated' timestamp across the 5 pages",\n  "regions": [\n    {\n      "name": "EXACT name from the 5-name list above",\n      "forecast": [\n        {\n          "sky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",\n          "windMph": 25,\n          "windDir": "SE",\n          "tempC": 12,\n          "cloudFree": 90,\n          "freezingLevel": 9999,\n          "visibility": "excellent|good|moderate|poor",\n          "amSky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",\n          "pmSky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",\n          "status": "go|marginal|poor",\n          "note": "<=10 words, paraphrasing MWIS's most specific warning/highlight for this day"\n        }\n      ]\n    }\n  ]\n}\n\nField rules:\n- sky / amSky / pmSky: pick the headline. If MWIS says "Unbroken bright sunshine" use "sun", NOT "partly-cloudy". "Extensive sunshine" = sun. "Mostly dry, occasional sunshine, some rain" = partly-cloudy. Only use "rain" if MWIS describes rain as the dominant condition. Only use "cloud" if MWIS says cloud sits below summit height most of the day.\n- cloudFree: anchor to MWIS's cloud-base description. "Mountains free of cloud" / "free of cloud once mist disperses" = 90-95. "Cloud above 600m" with summits >900m = 70-80. "Cloud filling above 600m" with summits ~900m = 30-50. "Cloud may not clear all day" = 10-20. Don't be conservative on bright days.\n- windMph: numeric. If MWIS gives a range "20-30mph" use the average (25). If MWIS warns of stronger gusts (e.g. "gusty 40mph"), use the GUST value because it's the safety-relevant number for hill walkers.\n- windDir: dominant compass direction from MWIS (often "SE", "S", "SW" etc.). Don't simplify "southeasterly" to "S".\n- tempC: temperature on tops/summits as MWIS states it. If MWIS says "10 to 15C on tops" use 12 or 13.\n- freezingLevel: metres ASL. "Above the summits" → 9999. "Freezing level 700m" → 700. Read MWIS carefully — most spring/summer days will be 9999.\n- visibility: excellent (>30km), good (10-30km), moderate (4-10km), poor (<4km). MWIS phrases like "Excellent or superb visibility" → excellent. "Visibility very good" → good. "Visibility often poor in rain" → poor.\n- status: "go" = MWIS's headline is positive (sunshine, dry, manageable wind, comfortable temp). "marginal" = mixed (some rain, gusty, low confidence). "poor" = MWIS warns of heavy rain, thunder, gales, white-out, or dangerous conditions.\n- note: max 10 words. Reuse MWIS's distinctive language. DO NOT write generic notes like "patchy rain possible".\n\nINPUT (live MWIS text):\n\n${pagesBlock}`;
}

// --- JSON parsing with repair ---------------------------------------
const parseJSON = (text) => {
  let s = text.trim();
  s = s.replace(/^\x60\x60\x60(?:json)?\s*/i, '');
  s = s.replace(/\s*\x60\x60\x60$/, '');
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
  let trimmed = r.replace(/,?\s*"[^"]*$/, '');
  trimmed = trimmed.replace(/,?\s*\{[^}]*$/, '');
  trimmed = trimmed.replace(/,\s*$/, '');
  const candidate = trimmed + ']'.repeat(Math.max(0, aOpens - aCloses)) + '}'.repeat(Math.max(0, opens - closes));
  parsed = tryIt(candidate);
  if (parsed) return parsed;
  throw new Error('malformed JSON from model');
};

// --- Main -----------------------------------------------------------
console.log(`Build started ${now.toISOString()}`);

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

// Freshness check & dynamic date anchor calculation
const updatedTimes = pages.map(p => p.updatedAt).filter(Boolean).map(t => new Date(t).getTime());
const newestUpdate = updatedTimes.length ? Math.max(...updatedTimes) : null;
const ageHours = newestUpdate ? (Date.now() - newestUpdate) / 36e5 : null;

if (ageHours !== null && ageHours > 24) {
  console.warn(`⚠ Newest MWIS update is ${ageHours.toFixed(1)}h old — data may be stale`);
}

let day0, day1, day2;
let isAfternoonBulletin = false;

if (newestUpdate) {
  // 1. Get the date of the MWIS update itself in UK time
  const updateDate = new Date(newestUpdate);
  const updateUKDateStr = updateDate.toLocaleString('en-US', { timeZone: 'Europe/London' });
  const updateUKDate = new Date(updateUKDateStr);
  updateUKDate.setHours(0, 0, 0, 0); // Strip time, keep just the date

  // 2. Check the hour it was published
  const updateUKHour = parseInt(updateDate.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }), 10);
  
  // 3. If published >= 14:00, Day 1 of the forecast is the day AFTER the update date.
  if (updateUKHour >= 14) {
    isAfternoonBulletin = true;
    day0 = addDays(updateUKDate, 1);
  } else {
    isAfternoonBulletin = false;
    day0 = updateUKDate;
  }
} else {
  // Fallback if parsing fails completely: use system time
  const runUKHour = parseInt(todayUK.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }), 10);
  if (runUKHour >= 16) {
    isAfternoonBulletin = true;
    day0 = addDays(todayUK, 1);
  } else {
    isAfternoonBulletin = false;
    day0 = todayUK;
  }
}

day1 = addDays(day0, 1);
day2 = addDays(day0, 2);
const forecastDays = [day0, day1, day2];

console.log(`Bulletin type determined: ${isAfternoonBulletin ? 'Afternoon' : 'Morning'} update.`);
console.log(`Anchoring to Day 1: ${dayShort(day0)} ${dayLong(day0)}`);

// 2. Hand pages + date anchor to Claude for structured extraction
console.log('Asking Claude to structure the forecast…');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const message = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4000,
  messages: [{ role: 'user', content: buildPrompt(pages, forecastDays, isAfternoonBulletin) }],
});

const textBlocks = message.content.filter(b => b.type === 'text');
const textStrings = textBlocks.map(b => b.text);
const responseText = textStrings.join('\n');

const data = parseJSON(responseText);

// 3. Stamp metadata
if (!data.updatedAt && newestUpdate) {
  data.updatedAt = new Date(newestUpdate).toISOString();
} else if (!data.updatedAt) {
  data.updatedAt = new Date().toISOString();
}
data._generated = new Date().toISOString();
data._anchorDate = day0.toISOString().slice(0, 10);

// 4. Sanity check — first day label should match dynamic day0
const expectedFirst = dayShort(day0);
if (data.days?.[0] !== expectedFirst) {
  console.warn(`⚠ Expected first day "${expectedFirst}", got "${data.days?.[0]}" — overriding`);
  data.days = [dayShort(day0), dayShort(day1), dayShort(day2)];
}

// 5. Normalise region names
const NAME_ALIASES = {
  'the northwest highlands': 'Northwest Highlands',
  'northwest highlands': 'Northwest Highlands',
  'nw highlands': 'Northwest Highlands',
  'west highlands': 'West Highlands',
  'cairngorms np and monadhliath': 'Cairngorms & Monadhliath',
  'cairngorms and monadhliath': 'Cairngorms & Monadhliath',
  'cairngorms & monadhliath': 'Cairngorms & Monadhliath',
  'cairngorms': 'Cairngorms & Monadhliath',
  'southeastern highlands': 'Southeastern Highlands',
  'south eastern highlands': 'Southeastern Highlands',
  'southern uplands': 'Southern Uplands',
};
if (Array.isArray(data.regions)) {
  data.regions.forEach((r) => {
    const key = (r.name || '').toLowerCase().trim();
    if (NAME_ALIASES[key] && NAME_ALIASES[key] !== r.name) {
      console.log(`Normalised region name: "${r.name}" → "${NAME_ALIASES[key]}"`);
      r.name = NAME_ALIASES[key];
    }
  });
}

writeFileSync('forecast.json', JSON.stringify(data, null, 2));
console.log(`✓ Wrote forecast.json — ${data.regions?.length || 0} regions, days: ${(data.days || []).join('/')}, updatedAt: ${data.updatedAt}`);
