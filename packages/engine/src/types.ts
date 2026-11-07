/** Risk categories the engine reports. "legit" is only a model class, never a risk category. */
export type Category = 'influence' | 'trafficking' | 'scam';
export type ModelClass = 'legit' | Category;
export type Level = 'low' | 'medium' | 'high';
export type Verdict = 'low' | 'caution' | 'high' | 'unclear';
export type Strength = 'strong' | 'medium' | 'weak' | 'context';

/** Languages with UI strings. Detection may also return these for incoming messages. */
export type Lang = 'en' | 'fil' | 'es' | 'pt' | 'fr' | 'sw' | 'id' | 'hi';

export const CATEGORIES: Category[] = ['influence', 'trafficking', 'scam'];

export interface RuleHit {
  id: string;
  /** Red-flag category, or "reassuring" for signals that make an offer look more legitimate. */
  category: Category | 'reassuring';
  strength: Strength;
  weight: number;
  title: string;
  explain: string;
  /** The text that triggered the rule (normalised, lowercase). */
  evidence: string;
}

export interface CategoryRisk {
  category: Category;
  level: Level;
  /** Sum of rule weights after combinations and reassurance. */
  ruleScore: number;
  /** Classifier score for this class (uncalibrated), or null if the model could not score the text. */
  modelScore: number | null;
  reasons: RuleHit[];
}

export interface Question {
  id: string;
  category: Category | 'any';
  text: string;
  why: string;
}

export interface Analysis {
  verdict: Verdict;
  /** The most concerning category, or null when nothing stands out. */
  topCategory: Category | null;
  categories: Record<Category, CategoryRisk>;
  /** Red flags, strongest first. */
  redFlags: RuleHit[];
  /** Signals that point towards a legitimate offer. They never cancel a strong red flag. */
  reassuring: RuleHit[];
  model: {
    probs: Record<ModelClass, number>;
    /** Words and phrases that pushed the model towards its top risk class. */
    topTerms: Array<{ term: string; weight: number }>;
  } | null;
  questions: Question[];
  nextSteps: string[];
  language: Lang;
  wordCount: number;
  summary: string;
}
