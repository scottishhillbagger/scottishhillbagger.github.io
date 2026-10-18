// scripts/forecast-rows.mjs
// Shared logic: turn one forecast.json into tidy rows, and read/write the CSV.
// One row = one MWIS bulletin x one region x one target date.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export const HISTORY_PATH = 'data/forecast-history.csv';
export const RUNS_PATH = 'data/forecast-runs.csv';

export const COLUMNS = [
  'mwis_updated_at', 'issue_date', 'target_date', 'day_index', 'lead_days', 'region',
  'sky', 'am_sky', 'pm_sky',
  'wind_mph_low', 'wind_mph_high', 'wind_mph', 'gust_mph', 'wind_dir',
  'temp_c_low', 'temp_c_high', 'temp_c',
  'cloud_free', 'freezing_level', 'visibility', 'status', 'reason',
  'schema_version', 'prompt_version', 'model', 'generated_at', 'source',
];

export const RUN_COLUMNS = ['run_at', 'result', 'mwis_updated_at', 'rows_added', 'detail'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// UK calendar date (YYYY-MM-DD) of an instant
export const ukDate = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

const addDaysYMD = (ymd, n) => {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);

// Work out day 0's date. New files carry _anchorDate. Older files only have
// weekday labels, so take the first date on/after `fallbackFrom` whose
// weekday matches days[0].
function anchorDate(fc, fallbackFrom) {
  if (fc._anchorDate) return fc._anchorDate;
  const label = (fc.days?.[0] || '').slice(0, 3);
  const start = fallbackFrom;
  for (let i = 0; i < 7; i++) {
    const ymd = addDaysYMD(start, i);
    if (WEEKDAYS[new Date(ymd + 'T00:00:00Z').getUTCDay()] === label) return ymd;
  }
  return start;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : '');

// forecast.json -> array of row objects.
// opts.fallbackDate: UK date to anchor old files without _anchorDate (e.g. commit date).
// opts.source: 'live' or 'backfill'.
export function forecastToRows(fc, { fallbackDate, source = 'live' } = {}) {
  const mwisUpdated = fc._mwisUpdatedAt || fc.updatedAt || '';
  const issueDate = mwisUpdated ? ukDate(mwisUpdated) : (fallbackDate || '');
  const day0 = anchorDate(fc, fallbackDate || issueDate);
  const schemaVersion = fc._schemaVersion
    ?? (fc.regions?.[0]?.forecast?.[0] && 'windMphLow' in fc.regions[0].forecast[0] ? 2 : 1);

  const rows = [];
  for (const region of fc.regions || []) {
    (region.forecast || []).forEach((d, i) => {
      const target = addDaysYMD(day0, i);
      rows.push({
        mwis_updated_at: mwisUpdated,
        issue_date: issueDate,
        target_date: target,
        day_index: i,
        lead_days: issueDate ? daysBetween(issueDate, target) : '',
        region: region.name,
        sky: d.sky ?? '', am_sky: d.amSky ?? '', pm_sky: d.pmSky ?? '',
        wind_mph_low: num(d.windMphLow), wind_mph_high: num(d.windMphHigh), wind_mph: num(d.windMph),
        gust_mph: num(d.gustMph), wind_dir: d.windDir ?? '',
        temp_c_low: num(d.tempCLow), temp_c_high: num(d.tempCHigh), temp_c: num(d.tempC),
        cloud_free: num(d.cloudFree), freezing_level: num(d.freezingLevel),
        visibility: d.visibility ?? '', status: d.status ?? '',
        reason: d.reason ?? d.note ?? '',
        schema_version: schemaVersion,
        prompt_version: fc._promptVersion ?? '',
        model: fc._model ?? '',
        generated_at: fc._generated ?? '',
        source,
      });
    });
  }
  return rows;
}

// --- Minimal CSV handling -------------------------------------------
const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toLine = (cols, row) => cols.map((c) => esc(row[c])).join(',');

function parseLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// Keys already in the history, so re-reading the same bulletin adds nothing.
const keyOf = (r) => `${r.mwis_updated_at}|${r.region}|${r.target_date}`;

export function existingKeys(path = HISTORY_PATH) {
  const keys = new Set();
  if (!existsSync(path)) return keys;
  const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
  const header = parseLine(lines[0]);
  const iU = header.indexOf('mwis_updated_at'), iR = header.indexOf('region'), iT = header.indexOf('target_date');
  for (const l of lines.slice(1)) {
    const f = parseLine(l);
    keys.add(`${f[iU]}|${f[iR]}|${f[iT]}`);
  }
  return keys;
}

// Append rows not already present. Returns number added.
export function appendRows(rows, path = HISTORY_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  const keys = existingKeys(path);
  const fresh = rows.filter((r) => r.mwis_updated_at && !keys.has(keyOf(r)));
  let text = existsSync(path) ? readFileSync(path, 'utf8') : COLUMNS.join(',') + '\n';
  if (text && !text.endsWith('\n')) text += '\n';
  text += fresh.map((r) => toLine(COLUMNS, r)).join('\n') + (fresh.length ? '\n' : '');
  writeFileSync(path, text);
  return fresh.length;
}

export function logRun(entry, path = RUNS_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  let text = existsSync(path) ? readFileSync(path, 'utf8') : RUN_COLUMNS.join(',') + '\n';
  if (!text.endsWith('\n')) text += '\n';
  writeFileSync(path, text + toLine(RUN_COLUMNS, entry) + '\n');
}
