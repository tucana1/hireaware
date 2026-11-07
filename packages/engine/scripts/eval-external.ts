/**
 * Scores the shipped system on external, real-world SMS datasets (no retraining).
 * Prepare data first: trial-modeling-news/.venv/bin/python -I trial-modeling-news/risk_data/prepare_external.py
 * Run: npm run eval:external
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../src/index';
import { getDefaultClassifier } from '../src/default-classifier';
import { parseCsv } from './csv';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, '../../../trial-modeling-news/risk_data/downloads/external_eval.csv');
if (!existsSync(file)) {
  console.error(`Missing ${file}. See docs/research/datasets.md to download and prepare the data.`);
  process.exit(1);
}
const classifier = getDefaultClassifier();
const stats: Record<string, { legit: number; legitFlagged: number; legitHigh: number; risky: number; riskyFlagged: number; riskyAsScam: number }> = {};
const falseAlarms: string[] = [];

for (const r of parseCsv(readFileSync(file, 'utf8'))) {
  const key = `${r.dataset}${r.dataset === 'bengali' ? `/${r.lang}` : ''}`;
  const s = (stats[key] ??= { legit: 0, legitFlagged: 0, legitHigh: 0, risky: 0, riskyFlagged: 0, riskyAsScam: 0 });
  const a = analyze(r.text!, { classifier });
  const flagged = a.verdict === 'high' || a.verdict === 'caution';
  if (r.label === 'legit') {
    s.legit++;
    if (flagged) { s.legitFlagged++; if (falseAlarms.length < 12) falseAlarms.push(`[${key}] ${a.verdict}/${a.topCategory}: ${r.text!.slice(0, 110)}`); }
    if (a.verdict === 'high') s.legitHigh++;
  } else {
    s.risky++;
    if (flagged) s.riskyFlagged++;
    if (flagged && a.topCategory === 'scam') s.riskyAsScam++;
  }
}

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : 'n/a');
const report: Record<string, unknown> = {};
for (const [k, s] of Object.entries(stats)) {
  report[k] = { ...s, false_alarm_rate: pct(s.legitFlagged, s.legit), smishing_flagged_rate: pct(s.riskyFlagged, s.risky) };
  console.log(`${k.padEnd(18)} legit ${s.legit}: flagged ${s.legitFlagged} (${pct(s.legitFlagged, s.legit)}), high ${s.legitHigh} | smishing ${s.risky}: flagged ${s.riskyFlagged} (${pct(s.riskyFlagged, s.risky)}), as job scam ${s.riskyAsScam}`);
}
console.log('\nSample false alarms:\n' + falseAlarms.join('\n'));
writeFileSync(path.resolve(here, '../../../trial-modeling-news/recruitment_risk_results/external_evaluation.json'), JSON.stringify(report, null, 2));
