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
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(//g, '')
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
  const firstDayLabel = isAfternoon ? "TOMORROW" : "TODAY";

  const dateBlock = `Today is ${dayLong(todayUK)}. The 3 days you must forecast are:
- Day 1: ${dayShort(day0)} (${dayLong(day0)}) — ${firstDayLabel}
- Day 2: ${dayShort(day1)} (${dayLong(day1)})
- Day 3: ${dayShort(day2)} (${dayLong(day2)})`;

  const pagesBlock = pages
    .map((p) => `=== ${p.name} (source: ${p.url}) ===\nMWIS last updated: ${p.updatedAt || 'not detected'}\n\n${p.text.slice(0, 8000)}`)
    .join('\n\n');

  return `${dateBlock}

You will be given the live text of 5 MWIS regional forecast pages, fetched directly from mwis.org.uk just now. Extract the data for the 3 days listed above. Do not use prior knowledge — use ONLY the text provided below.

CRITICAL:
- The first day in your output MUST be ${dayShort(day0)}. If the page's first labelled day is the day BEFORE ${dayShort(day0)}, skip that section and start from ${dayShort(day0)} onward.
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
  "summary": "One short sentence describing the 3-day pattern across Scotland.",
  "days": ["${dayShort(day0)}", "${dayShort(day1)}", "${dayShort(day2)}"],
  "updatedAt": "ISO 8601 — use the most recent MWIS 'Last updated' timestamp across the 5 pages",
  "regions": [
    {
      "name": "EXACT name from the 5-name list above",
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
- sky / amSky / pmSky: pick the headline. If MWIS says "Unbroken bright sunshine" use "sun", NOT "partly-cloudy". "Extensive sunshine" = sun. "Mostly dry, occasional sunshine, some rain" = partly-cloudy. Only use "rain" if MWIS describes rain as the dominant condition. Only use "cloud" if MWIS says cloud sits below summit height most of the day.
- cloudFree: anchor to MWIS's cloud-base description. "Mountains free of cloud" / "free of cloud once mist disperses" = 90-95. "Cloud above 600m" with summits >900m = 70-80. "Cloud filling above 600m" with summits ~900m = 30-50. "Cloud may not clear all day" = 10-20. Don't be conservative on bright days.
- windMph: numeric. If MWIS gives a range "20-30mph" use the average (25). If MWIS warns of stronger gusts (e.g. "gusty 40mph"), use the GUST value because it's the safety-relevant number for hill walkers.
- windDir: dominant compass direction from MWIS (often "SE", "S", "SW" etc.). Don't simplify "southeasterly" to "S".
- tempC: temperature on tops/summits as MWIS states it. If MWIS says "10 to 15C on tops" use 12 or 13.
- freezingLevel: metres ASL. "Above the summits" → 9999. "Freezing level 700m" → 700. Read MWIS carefully — most spring/summer days will be 9999.
- visibility: excellent (>30km), good (10-30km), moderate (4-10km), poor (<4km). MWIS phrases like "Excellent or superb visibility" → excellent. "Visibility very good" → good. "Visibility often poor in rain" → poor.
- status: "go" = MWIS's headline is positive (sunshine, dry, manageable wind, comfortable temp). "marginal" = mixed (some rain, gusty, low confidence). "poor" = MWIS warns of heavy rain, thunder, gales, white-out, or dangerous conditions.
- note: max 10 words. Reuse MWIS's distinctive language. DO NOT write generic notes like "patchy rain possible".

INPUT (live MWIS text):

${pagesBlock}`;
}

// --- JSON parsing with repair ---------------------------------------
const parseJSON = (text) => {
  let s = text.trim().replace(/^
http://googleusercontent.com/immersive_entry_chip/0
