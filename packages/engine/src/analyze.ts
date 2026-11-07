/**
 * Combines the red-flag rules and the classifier into one explainable verdict.
 *
 * Rules decide most of it, because they can say *why*. The model adds weight when it agrees, and can
 * raise "caution" on its own when it is confident, but it can never lower a rule's floor.
 * Reassuring signals (licences, work visas, "#ad" disclosures, moderator roles) reduce scores but
 * never cancel a strong red flag such as a taken passport or a request for your OTP.
 */
import type { Analysis, Category, CategoryRisk, Lang, Level, ModelClass, RuleHit } from './types';
import { CATEGORIES } from './types';
import type { Prediction, RiskClassifier } from './classifier';
import { RULES, matchRules } from './rules';
import { registerRuleQuestions, selectQuestions } from './questions';
import { detectLanguage, wordCount } from './text';

RULES.forEach((r) => registerRuleQuestions(r.id, r.questions));

const LEVEL_RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };
const maxLevel = (a: Level, b: Level): Level => (LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b);
const STRENGTH_RANK = { strong: 3, medium: 2, weak: 1, context: 0 } as const;

export interface AnalyzeOptions {
  classifier?: RiskClassifier | null;
  lang?: Lang;
  maxQuestions?: number;
}

function has(hits: RuleHit[], ...ids: string[]) {
  return ids.some((id) => hits.some((h) => h.id === id));
}

function scoreCategory(category: Category, hits: RuleHit[], reassuring: RuleHit[], prediction: Prediction | null,
  classifier: RiskClassifier | null | undefined): CategoryRisk {
  const mine = hits.filter((h) => h.category === category);
  const core = mine.filter((h) => h.strength === 'strong' || h.strength === 'medium');
  // Weak and context signals only count alongside a real red flag in the same category.
  const counted = core.length ? mine : [];
  let score = counted.reduce((s, h) => s + h.weight, 0);
  let floor: Level = 'low';
  for (const h of counted) {
    const rule = RULES.find((r) => r.id === h.id);
    if (rule?.floor) floor = maxLevel(floor, rule.floor);
  }

  // Combinations that change the meaning of individual signals.
  if (category === 'influence' && has(counted, 'INF_FAKE_ACCOUNTS')
    && has(counted, 'INF_POLITICAL_CONTEXT', 'INF_SECRECY', 'INF_SCRIPTED', 'INF_ATTACK', 'INF_TRENDING', 'INF_FAKE_NEWS_PAGES')) {
    floor = 'high';
  }
  if (category === 'influence' && has(counted, 'INF_SECRECY') && has(counted, 'INF_SCRIPTED', 'INF_ATTACK', 'INF_FAKE_NEWS_PAGES')
    && has(counted, 'INF_POLITICAL_CONTEXT')) {
    floor = 'high';
  }
  if (category === 'trafficking') {
    if (has(counted, 'TRF_HIGH_RISK_PLACE') && has(counted, 'TRF_TOURIST_VISA', 'TRF_FREE_TRAVEL', 'TRF_NO_AGENCY', 'TRF_FAST_DEPARTURE', 'TRF_AGENT_FEE')) score += 2;
    if (has(counted, 'TRF_TOURIST_VISA') && has(counted, 'TRF_HIGH_RISK_PLACE', 'TRF_BORDER_ROUTE', 'TRF_NO_AGENCY', 'TRF_SCAM_WORK')) floor = 'high';
    if (has(counted, 'TRF_SCAM_WORK') && has(counted, 'TRF_HIGH_RISK_PLACE', 'TRF_FREE_TRAVEL', 'TRF_TOURIST_VISA')) floor = maxLevel(floor, 'high');
  }

  const relief = reassuring.filter((r) => RULES.find((d) => d.id === r.id)?.affects?.includes(category))
    .reduce((s, r) => s + r.weight, 0);
  score = Math.max(0, score - relief);

  let level: Level = score >= 7 ? 'high' : score >= 3 ? 'medium' : 'low';

  // The classifier: supporting evidence, and a cautious second opinion when no rule fired.
  const modelScore = prediction ? prediction.probs[category] : null;
  if (prediction && classifier && modelScore !== null) {
    const t = classifier.thresholds[category];
    const topRisk = prediction.top === category;
    if (modelScore >= t.high && topRisk) {
      if (score >= 2) level = maxLevel(level, 'high');
      else if (relief < 2) level = maxLevel(level, 'medium');
    } else if (modelScore >= t.medium && score >= 2 && topRisk) {
      level = maxLevel(level, 'medium');
    }
  }

  return { category, level: maxLevel(level, floor), ruleScore: score, modelScore, reasons: counted.filter((h) => h.strength !== 'context') };
}

const NEXT_STEPS: Record<Category, Record<'high' | 'medium', string[]>> = {
  influence: {
    high: [
      'Do not create, borrow or run accounts under other names, and do not post paid political content you cannot sign with your own name.',
      'Keep quiet copies of the ad, the recruiter profile, chats, scripts and payment slips. Do not confront them while you are still involved.',
      'Report the recruiter to the platform (Facebook, TikTok, X). During elections, you can also report to the election authority.',
    ],
    medium: [
      'Ask the questions below and get the answers in writing before you start.',
      'If they will not name the client or let you post only from your own account, walk away.',
    ],
  },
  trafficking: {
    high: [
      'Do not travel on this offer, and do not hand over your passport or send copies of it.',
      "Check the recruiter and job order with your government's migrant-worker agency before anything else.",
      'Tell someone you trust the recruiter\'s name, number and the route you were given.',
      'If someone you know has already gone, contact the anti-trafficking hotline or embassy below. Beware of "rescuers" who ask for money.',
    ],
    medium: [
      'Do not book or pay anything until you have a work visa, a contract and a licensed recruiter you have verified yourself.',
      'Ask the questions below. A real employer can answer all of them in writing.',
    ],
  },
  scam: {
    high: [
      'Do not pay anything and do not share codes, PINs, logins, IDs or SIM cards.',
      'If you already paid or shared details, contact your bank or e-wallet now and report it to the cybercrime hotline below.',
      'Keep screenshots, phone numbers and payment receipts as evidence.',
    ],
    medium: [
      'Do not pay any fee or deposit to get or keep a job.',
      "Contact the company through the details on its official website, not the ones in the message.",
    ],
  },
};

const LOW_STEPS = [
  'No common red flags found. That does not prove it is safe.',
  "Still check the employer's registration yourself and get a written contract before you start or travel.",
];

const CATEGORY_LABEL: Record<Category, string> = {
  influence: 'covert influence / troll-farm work',
  trafficking: 'trafficking or forced scam work abroad',
  scam: 'a job scam',
};

export function categoryLabel(c: Category): string {
  return CATEGORY_LABEL[c];
}

export function analyze(text: string, options: AnalyzeOptions = {}): Analysis {
  const all = matchRules(text);
  const redHits = all.filter((h) => h.category !== 'reassuring');
  const reassuring = all.filter((h) => h.category === 'reassuring');
  const prediction = options.classifier ? options.classifier.predict(text) : null;

  const categories = {} as Record<Category, CategoryRisk>;
  for (const c of CATEGORIES) categories[c] = scoreCategory(c, redHits, reassuring, prediction, options.classifier);

  const ranked = [...CATEGORIES].sort((a, b) => LEVEL_RANK[categories[b].level] - LEVEL_RANK[categories[a].level]
    || categories[b].ruleScore - categories[a].ruleScore || (categories[b].modelScore ?? 0) - (categories[a].modelScore ?? 0));
  const top = ranked[0]!;
  const words = wordCount(text);
  const concerning = ranked.filter((c) => categories[c].level !== 'low');

  let verdict: Analysis['verdict'] = categories[top].level === 'high' ? 'high' : categories[top].level === 'medium' ? 'caution' : 'low';
  if (verdict === 'low' && words < 6 && redHits.length === 0) verdict = 'unclear';

  const redFlags = concerning.flatMap((c) => categories[c].reasons)
    .sort((a, b) => STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength] || b.weight - a.weight);

  const steps = concerning.length
    ? concerning.flatMap((c) => NEXT_STEPS[c][categories[c].level === 'high' ? 'high' : 'medium']).slice(0, 5)
    : LOW_STEPS;

  let topTerms: Array<{ term: string; weight: number }> = [];
  if (prediction && options.classifier) {
    const cls: ModelClass = concerning[0] ?? (prediction.top === 'legit' ? 'legit' : prediction.top);
    topTerms = options.classifier.explain(prediction, cls, 6);
  }

  const summary = verdict === 'high'
    ? `High risk: this looks like ${CATEGORY_LABEL[top]}.`
    : verdict === 'caution'
      ? `Be careful: some signs of ${CATEGORY_LABEL[top]}. Check before you go further.`
      : verdict === 'unclear'
        ? 'Not enough text to check. Paste the full job ad or message.'
        : 'No common red flags found, but that is not a guarantee.';

  return {
    verdict,
    topCategory: concerning.length ? top : null,
    categories,
    redFlags,
    reassuring,
    model: prediction ? { probs: prediction.probs, topTerms } : null,
    questions: selectQuestions(redFlags, concerning, options.maxQuestions ?? 8),
    nextSteps: steps,
    language: options.lang ?? detectLanguage(text),
    wordCount: words,
    summary,
  };
}
