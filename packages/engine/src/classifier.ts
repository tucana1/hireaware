/**
 * Runs the recruitment-risk model exported by trial-modeling-news/model-recruitment-risk.py:
 * TF-IDF over word 1-2 grams (sublinear tf, l2 norm) followed by multinomial logistic regression.
 * Pure TypeScript, no dependencies, so it runs in the browser extension, the website and the tipline.
 */
import type { ModelClass } from './types';
import { cleanText, prepForModel } from './text';

export interface RiskModelJson {
  format: string;
  created: string;
  classes: ModelClass[];
  vectorizer: {
    analyzer: 'word';
    ngram_range: [number, number];
    sublinear_tf: boolean;
    vocabulary: string[];
    idf: number[];
  };
  coef: number[][];
  intercept: number[];
  thresholds: {
    scam: { medium: number; high: number };
    trafficking: { medium: number; high: number };
    influence: { medium: number; high: number };
    any_risk_review: number;
  };
  training?: Record<string, unknown>;
  evaluation_summary?: Record<string, unknown>;
  notes?: string;
}

export interface Feature {
  index: number;
  term: string;
  value: number;
}

export interface Prediction {
  probs: Record<ModelClass, number>;
  top: ModelClass;
  features: Feature[];
}

/** Same token rule as scikit-learn's default `(?u)\b\w\w+\b` (Python \w = letters, digits, underscore). */
const TOKEN = /[\p{L}\p{N}_]{2,}/gu;

export class RiskClassifier {
  readonly classes: ModelClass[];
  readonly thresholds: RiskModelJson['thresholds'];
  private readonly index = new Map<string, number>();

  constructor(private readonly model: RiskModelJson) {
    if (!model?.format?.startsWith('hireaware-tfidf-logreg/')) {
      throw new Error(`Unsupported model format: ${model?.format}`);
    }
    this.classes = model.classes;
    this.thresholds = model.thresholds;
    model.vectorizer.vocabulary.forEach((term, i) => this.index.set(term, i));
  }

  /** l2-normalised tf-idf features for the text, or null when no known word appears. */
  vectorize(raw: string): Feature[] | null {
    const text = prepForModel(cleanText(raw));
    const tokens = text.match(TOKEN) ?? [];
    const [minN, maxN] = this.model.vectorizer.ngram_range;
    const counts = new Map<number, number>();
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i + n <= tokens.length; i++) {
        const gram = n === 1 ? tokens[i]! : tokens.slice(i, i + n).join(' ');
        const idx = this.index.get(gram);
        if (idx !== undefined) counts.set(idx, (counts.get(idx) ?? 0) + 1);
      }
    }
    if (counts.size === 0) return null;
    const { idf, vocabulary, sublinear_tf } = this.model.vectorizer;
    const features: Feature[] = [];
    let sumSq = 0;
    for (const [index, count] of counts) {
      const tf = sublinear_tf ? 1 + Math.log(count) : count;
      const value = tf * idf[index]!;
      sumSq += value * value;
      features.push({ index, term: vocabulary[index]!, value });
    }
    const norm = Math.sqrt(sumSq) || 1;
    for (const f of features) f.value /= norm;
    return features;
  }

  predict(raw: string): Prediction | null {
    const features = this.vectorize(raw);
    if (!features) return null;
    const logits = this.classes.map((_, k) => {
      const row = this.model.coef[k]!;
      let z = this.model.intercept[k]!;
      for (const f of features) z += row[f.index]! * f.value;
      return z;
    });
    const top = Math.max(...logits);
    const exps = logits.map((z) => Math.exp(z - top));
    const total = exps.reduce((a, b) => a + b, 0);
    const probs = {} as Record<ModelClass, number>;
    this.classes.forEach((c, k) => (probs[c] = exps[k]! / total));
    const best = this.classes.reduce((a, b) => (probs[b] > probs[a] ? b : a));
    return { probs, top: best, features };
  }

  /** The words that pushed the score towards `cls` the most (positive contributions only). */
  explain(prediction: Prediction, cls: ModelClass, n = 6): Array<{ term: string; weight: number }> {
    const k = this.classes.indexOf(cls);
    const row = this.model.coef[k]!;
    return prediction.features
      .map((f) => ({ term: f.term, weight: row[f.index]! * f.value }))
      .filter((t) => t.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, n);
  }
}
