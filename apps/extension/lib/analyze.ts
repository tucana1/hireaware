import { analyze, type Analysis } from '@hireaware/engine';
import { getDefaultClassifier } from '@hireaware/engine/default-classifier';

const MAX_TEXT = 20_000;

/** Runs the rules and the bundled classifier locally. */
export function analyzeLocally(text: string): Analysis {
  return analyze(text.slice(0, MAX_TEXT), { classifier: getDefaultClassifier() });
}
