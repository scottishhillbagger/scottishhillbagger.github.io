// scripts/build-forecast.mjs
// Runs in GitHub Actions twice daily. Calls Anthropic, writes forecast.json.

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync } from 'fs';

const REGIONS = [
  { id: 'the-northwest-highlands', name: 'Northwest Highlands' },
  { id: 'west-highlands', name: 'West Highlands' },
  { id: 'cairngorms-np-and-monadhliath', name: 'Cairngorms & Monadhliath' },
  { id: 'southeastern-highlands', name: 'Southeastern Highlands' },
  { id: 'southern-uplands', name: 'Southern Uplands' },
];

const prompt = `Use web_search to fetch the LATEST 3-day forecasts from mwis.org.uk for these Scottish regions. Search the web — do not rely on prior knowledge. 1-2 broad searches should cover the pattern.

Regions:
${REGIONS.map(r => `- ${r.name}: https://www.mwis.org.uk/forecasts/scottish/${r.id}`).join('\n')}

Return ONLY a single JSON object — no markdown fences, no preamble. Start with { end with }.

Schema:
{
  "summary": "One short sentence on the 3-day pattern.",
  "days": ["e.g. Fri", "e.g. Sat", "e.g. Sun"],
  "updatedAt": "ISO 8601 timestamp from MWIS forecast page, or now",
  "regions": [
    {
      "name": "Region name exactly as given",
      "forecast": [
        {
          "sky": "sun|partly-cloudy|cloud|rain|fog|snow|storm",
          "windMph": 20,
          "windDir": "SE",
          "tempC": 12,
          "rain": "none|light|heavy|showers",
          "cloudFree": 80,
          "freezingLevel": 9999,
          "score": 75,
          "note": "≤8 words, e.g. 'gusts on summits, frost overnight'"
        }
      ]
    }
  ]
}

Scoring (Munro-friendliness, 0-100): cloud-free summits 40%, wind on tops 30%, rain 15%, temp/freezing level 15%. Penalise hard for cloud below summit height.

Rules:
- Include EVERY region in order, exactly 3 forecast entries each.
- windMph: numeric average of the range.
- freezingLevel in metres above sea level (use 9999 if above all summits).
- Be terse. This renders as an icon grid.`;

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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  tools: [{ type: 'web_search_20250305', name: 'web_search' }],
  messages: [{ role: 'user', content: prompt }],
});

const text = message.content
  .filter(b => b.type === 'text')
  .map(b => b.text)
  .join('\n');

const data = parseJSON(text);
if (!data.updatedAt) data.updatedAt = new Date().toISOString();
data._generated = new Date().toISOString();

writeFileSync('forecast.json', JSON.stringify(data, null, 2));
console.log(`Wrote forecast.json — ${data.regions?.length || 0} regions`);
