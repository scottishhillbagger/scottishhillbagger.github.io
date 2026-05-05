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
// MWIS publishes two bulletins daily:
//   Morning (~07:30 UK):   forecasts today, tomorrow, day after
//   Afternoon (~15:30 UK): forecasts tomorrow, day after, day after that
//                          (does NOT re-forecast the current day)
//
// We anchor based on what MWIS actually published, NOT on when our build runs.
// Why: a build that runs at 17:00 UK doesn't help if MWIS hasn't published the
// afternoon bulletin yet; we'd anchor to "tomorrow" but read yesterday's data.
// We compute the anchor AFTER fetching MWIS, using the bulletin's "Last updated"
// timestamp. The anchorFromBulletin() function below is called later.

const now = new Date();
const dayShort = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' });
const dayLong  = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' });
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// UK-local "today at midnight" Date object
function ukMidnight(d) {
  const ymd = d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }); // e.g. "2026-05-04"
  return new Date(ymd + 'T00:00:00Z'); // treat as UTC midnight to keep getDate() stable
}

// Given a bulletin published-at timestamp, return the anchor date (day 0 of forecast)
function anchorFromBulletin(bulletinTime) {
  // Get UK hour and date of the bulletin
  const bulletinHourStr = bulletinTime.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' });
  const bulletinHour = parseInt(bulletinHourStr, 10);
  const bulletinDay = ukMidnight(bulletinTime);
  // If bulletin was published in the afternoon (>= 12:00 UK), it forecasts from "tomorrow"
  // Morning bulletins forecast from "today" (the bulletin's own day)
  if (bulletinHour >= 12) {
    return addDays(bulletinDay, 1);
  }
  return bulletinDay;
}

// Placeholders — assigned after we fetch MWIS and know the freshest update time.
// We initialise to a sensible fallback (today) so functions referencing them don't break.
let day0 = ukMidnight(now);
let day1 = addDays(day0, 1);
let day2 = addDays(day0, 2);
console.log(`Build started at ${now.toISOString()} (UK ${now.toLocaleString('en-GB', { timeZone: 'Europe/London' })})`);

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
- Region names in your output must match EXACTLY (verbatim, including punctuation and capitalisation):
    "Northwest Highlands"
    "West Highlands"
    "Cairngorms & Monadhliath"
    "Southeastern Highlands"
    "Southern Uplands"
- Read MWIS's headline verdict for each day FIRST. MWIS leads each day with summary lines like "Unbroken bright sunshine" or "Extensive sunshine, mountains free of cloud" or "Heavy thundery bursts". This headline is the ground truth for sky/cloud — anchor your sky, cloudFree, and status to it. Don't dilute it because a later sentence mentions a small risk.
- Use direct phrasing from MWIS for the "note" field — keep MWIS's specific places, named hazards, and gust speeds (e.g. "gusts 40mph east from Cairngorm plateau", "thundery bursts north of Glen Garry", "Arran/Jura/Mull strongest").

Return ONLY a single JSON object — no markdown fences, no preamble. Start with { end with }.

Schema:
{
  "days": ["${dayShort(day0)}", "${dayShort(day1)}", "${dayShort(day2)}"],
  "updatedAt": "ISO 8601 — use the most recent MWIS 'Last updated' timestamp across the 5 pages",
  "regions": [
    {
      "name": "EXACT name from the 5-name list above",
      "forecast": [
        {
          "sky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",
          "windMphLow": 20,
          "windMphHigh": 30,
          "gustMph": 40,
          "windDir": "SE",
          "tempCLow": 8,
          "tempCHigh": 12,
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
- sky / amSky / pmSky: pick the headline. If MWIS says "Unbroken bright sunshine" use "sun", NOT "partly-cloudy". "Extensive sunshine" = sun. "Mostly dry, occasional sunshine, some rain" = partly-cloudy. Only use "rain" if MWIS describes rain as the dominant condition. Only use "cloud" if MWIS says cloud sits below summit height most of the day.
- cloudFree: anchor to MWIS's cloud-base description. "Mountains free of cloud" / "free of cloud once mist disperses" = 90-95. "Cloud above 600m" with summits >900m = 70-80. "Cloud filling above 600m" with summits ~900m = 30-50. "Cloud may not clear all day" = 10-20. Don't be conservative on bright days.
- windMphLow / windMphHigh: extract the MWIS range as two numbers. If MWIS says "20 to 30 mph", use windMphLow=20, windMphHigh=30. If MWIS gives a single number (e.g. "around 15mph"), use that for both. Always include both.
- gustMph: ONLY if MWIS explicitly mentions gusts (words like "gusty", "gusts", "gusting"). If MWIS says "gusts 40mph" or "perhaps 35-40mph", use 40. If no gusts mentioned, OMIT this field entirely (do not include it as null or 0).
- windDir: dominant compass direction from MWIS (often "SE", "S", "SW" etc.). Don't simplify "southeasterly" to "S".
- tempCLow / tempCHigh: temperature range on tops/summits as MWIS states it. "10 to 15C on tops" → tempCLow=10, tempCHigh=15. Single number → use for both.
- freezingLevel: metres ASL. "Above the summits" → 9999. "Freezing level 700m" → 700.
- visibility: excellent (>30km), good (10-30km), moderate (4-10km), poor (<4km).
- status: "go" = MWIS's headline is positive (sunshine, dry, manageable wind, comfortable temp). "marginal" = mixed (some rain, gusty, low confidence). "poor" = MWIS warns of heavy rain, thunder, gales, white-out, or dangerous conditions. When deciding, weight the GUST or HIGH wind value (not the average) — a 40mph gust day is poor regardless of the calm 10mph low.
- note: max 10 words. Reuse MWIS's distinctive language. Examples of good notes: "gusts 40mph Cairngorm plateau", "thundery bursts Great Glen pm", "frost overnight, snow above 700m", "Arran/Jura/Mull strongest 35-40mph". DO NOT write generic notes like "patchy rain possible".

Worked example — if MWIS West Highlands Day 1 says:
  "Bright sunshine. Locally gusty wind. Southeasterly 20 to 30mph, strongest and most gusty Arran, Jura and Mull, where sometimes 35 or 40mph in morning. Mountains free of cloud. Excellent or superb visibility. 10 to 15C on tops."
Then output: sky:"sun", amSky:"sun", pmSky:"sun", windMphLow:20, windMphHigh:30, gustMph:40, windDir:"SE", tempCLow:10, tempCHigh:15, cloudFree:95, visibility:"excellent", status:"go", note:"gusts 35-40mph Arran/Jura/Mull morning"

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

// Compute anchor based on the freshest MWIS bulletin we got (NOT the runner's clock).
// Why: a build that runs at 17:00 UK doesn't help if MWIS hasn't published the
// afternoon bulletin yet. Anchoring to the bulletin's own time keeps days correct.
if (newestUpdate) {
  const bulletinTime = new Date(newestUpdate);
  day0 = anchorFromBulletin(bulletinTime);
  day1 = addDays(day0, 1);
  day2 = addDays(day0, 2);
  const bulHourStr = bulletinTime.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' });
  console.log(`Bulletin published ${bulletinTime.toISOString()} (UK hour ${bulHourStr}) — anchoring day 0 to ${dayShort(day0)} ${day0.toISOString().slice(0,10)}`);
} else {
  console.warn('⚠ No MWIS update timestamp found on any page — falling back to today');
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

// 5. Normalise region names — defensive fix in case the model drifts
// (e.g. "The Northwest Highlands" → "Northwest Highlands")
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
