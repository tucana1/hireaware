/**
 * Evaluates the shipped system (red-flag rules + classifier, exactly as the apps run it) on the
 * hand-written challenge sets. Run: npm run eval   (from the repo root)
 *
 * A text counts as "flagged" when the verdict is caution or high; the predicted category is the
 * engine's top category (or legit when nothing is flagged).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { analyze, type Category } from '../src/index';
import { getDefaultClassifier } from '../src/default-classifier';
import { parseCsv } from './csv';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../../../trial-modeling-news/risk_data');
const LABELS = ['legit', 'scam', 'trafficking', 'influence'] as const;
type Label = (typeof LABELS)[number];

const classifier = getDefaultClassifier();
const report: Record<string, unknown> = {};

for (const [name, file] of [['challenge_v1', 'challenge_set.csv'], ['challenge_v2', 'challenge_v2.csv'], ['documented_cases', 'documented_cases.csv']] as const) {
  const rows = parseCsv(readFileSync(path.join(dataDir, file), 'utf8'));
  const confusion: Record<Label, Record<Label, number>> = Object.fromEntries(LABELS.map((t) => [t, Object.fromEntries(LABELS.map((p) => [p, 0]))])) as never;
  let flaggedRisky = 0, risky = 0, flaggedLegit = 0, legit = 0, exact = 0, highOnLegit = 0;
  const misses: string[] = [];
  for (const r of rows) {
    const truth = r.label as Label;
    const a = analyze(r.text!, { classifier });
    const flagged = a.verdict === 'high' || a.verdict === 'caution';
    const pred: Label = flagged ? (a.topCategory as Category) : 'legit';
    confusion[truth][pred]++;
    if (pred === truth) exact++;
    else misses.push(`${r.id} ${truth} -> ${pred} (${a.verdict})`);
    if (truth === 'legit') { legit++; if (flagged) flaggedLegit++; if (a.verdict === 'high') highOnLegit++; }
    else { risky++; if (flagged) flaggedRisky++; }
  }
  const result = {
    rows: rows.length,
    category_accuracy: +(exact / rows.length).toFixed(3),
    risky_flagged: `${flaggedRisky}/${risky}`,
    legit_flagged: `${flaggedLegit}/${legit}`,
    legit_marked_high: highOnLegit,
    confusion_rows_true_cols_pred: confusion,
    misses,
  };
  report[name] = result;
  console.log(`\n${name}: ${rows.length} rows`);
  console.log(`  category accuracy ${result.category_accuracy}; risky texts flagged ${result.risky_flagged}; legit texts flagged ${result.legit_flagged} (high: ${highOnLegit})`);
  for (const t of LABELS) console.log(`  ${t.padEnd(12)} ${LABELS.map((p) => String(confusion[t][p]).padStart(3)).join(' ')}`);
  if (misses.length) console.log('  misses: ' + misses.join('; '));
}

writeFileSync(path.resolve(dataDir, '../recruitment_risk_results/system_evaluation.json'), JSON.stringify(report, null, 2));
