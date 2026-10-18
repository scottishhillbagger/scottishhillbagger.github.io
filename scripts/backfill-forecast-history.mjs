// scripts/backfill-forecast-history.mjs
// One-off: walk every past commit of forecast.json and add it to
// data/forecast-history.csv. Safe to re-run — duplicates are skipped.
// Needs full git history (in Actions: actions/checkout with fetch-depth: 0).

import { execSync } from 'child_process';
import { forecastToRows, appendRows, ukDate } from './forecast-rows.mjs';

const log = execSync('git log --reverse --format=%H%x09%cI -- forecast.json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean);

console.log(`Found ${log.length} commits touching forecast.json`);
let total = 0, skipped = 0;

for (const line of log) {
  const [hash, committedAt] = line.split('\t');
  let fc;
  try {
    fc = JSON.parse(execSync(`git show ${hash}:forecast.json`, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  } catch {
    skipped++;
    continue; // file deleted or unparseable in this commit
  }
  // Old files have no _anchorDate; anchor from the commit's UK date.
  const rows = forecastToRows(fc, { fallbackDate: ukDate(committedAt), source: 'backfill' });
  total += appendRows(rows);
}

console.log(`Backfill done: ${total} rows added, ${skipped} commits skipped`);
