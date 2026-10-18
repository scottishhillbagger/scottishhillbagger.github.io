// scripts/archive-forecast.mjs
// Runs after build-forecast.mjs in the daily workflow.
//   node scripts/archive-forecast.mjs            -> append forecast.json to data/forecast-history.csv
//   node scripts/archive-forecast.mjs --failed   -> log a failed run (no data rows)
// Every run, good or bad, gets one line in data/forecast-runs.csv,
// so gaps in the history are visible rather than silent.

import { readFileSync, existsSync } from 'fs';
import { forecastToRows, appendRows, logRun } from './forecast-rows.mjs';

const runAt = new Date().toISOString();

if (process.argv.includes('--failed')) {
  logRun({ run_at: runAt, result: 'failed', mwis_updated_at: '', rows_added: 0, detail: process.env.FAIL_DETAIL || 'build step failed' });
  console.log('Logged failed run.');
  process.exit(0);
}

if (!existsSync('forecast.json')) {
  logRun({ run_at: runAt, result: 'failed', mwis_updated_at: '', rows_added: 0, detail: 'forecast.json missing' });
  console.error('forecast.json missing — logged as failed run.');
  process.exit(0);
}

const fc = JSON.parse(readFileSync('forecast.json', 'utf8'));
const rows = forecastToRows(fc, { source: 'live' });
const added = appendRows(rows);
const mwisUpdated = rows[0]?.mwis_updated_at || '';

// "duplicate" = we read a bulletin we already have (MWIS hadn't updated yet).
const result = added > 0 ? 'ok' : rows.length ? 'duplicate' : 'empty';
logRun({ run_at: runAt, result, mwis_updated_at: mwisUpdated, rows_added: added, detail: `${rows.length} rows parsed` });
console.log(`Archive: ${result} — ${added} new rows (bulletin ${mwisUpdated})`);
