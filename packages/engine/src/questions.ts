/**
 * Questions to put to a recruiter. The point is to be strict: a genuine employer can answer every one of
 * these in writing, while traffickers and troll-farm operators dodge, delay or get angry.
 * Sources: DMW advisories (2022-2026), IOM explainer (2026), OHCHR (2026), Meta Inauthentic Behavior policy.
 */
import type { Category, Question, RuleHit } from './types';

export const QUESTIONS: Question[] = [
  // any job
  { id: 'Q_EMPLOYER_REG', category: 'any', text: "What is the employer's full registered company name and registration number?", why: 'You can look it up yourself (e.g. SEC or DTI in the Philippines). Scammers use brand names, nicknames or "a client".' },
  { id: 'Q_CONTRACT', category: 'any', text: 'Can you send the written contract now, before I commit, with the employer, duties, pay, hours and exact workplace?', why: 'Survivors of scam compounds were often shown a contract only after arrival. A real offer survives being written down.' },
  { id: 'Q_FEES', category: 'any', text: 'Will I pay anything at any point? How much, to whom, and will I get an official receipt?', why: 'Fees, deposits and "deductions" are how people are trapped in debt.' },
  { id: 'Q_OFFICIAL_CHANNEL', category: 'any', text: "Can you contact me from the company's official email or phone number listed on its website?", why: 'Hiring that happens only in Telegram, WhatsApp or private messages leaves no trail.' },
  { id: 'Q_INTERVIEW', category: 'any', text: 'Who will interview me, and how can I check that this person really works for the company?', why: 'Fake recruiters copy real company names and logos.' },
  // influence
  { id: 'Q_OWN_ACCOUNTS', category: 'influence', text: 'Will I only post from accounts in my own real name? Will I ever be asked to create, buy or use other accounts?', why: 'Running fake or multiple accounts breaks platform rules and is how troll farms work.' },
  { id: 'Q_END_CLIENT', category: 'influence', text: 'Who is the end client paying for this content, and will their name be in my contract?', why: 'Political clients are often hidden behind PR or marketing firms.' },
  { id: 'Q_POLITICAL', category: 'influence', text: 'Will any of the work involve elections, candidates, parties, government or public issues?', why: 'Political work can be legitimate, but then it is done openly, from official accounts.' },
  { id: 'Q_DISCLOSURE', category: 'influence', text: 'Will paid posts be clearly labelled as paid or sponsored?', why: 'Hiding that content is paid deceives the audience and can break election and advertising rules.' },
  { id: 'Q_SAMPLE_TASKS', category: 'influence', text: "Can you show me a real example of one day's tasks, including any scripts, talking points or quotas?", why: 'Copy-paste comments and per-comment quotas are signs of a coordinated campaign.' },
  { id: 'Q_TARGETS', category: 'influence', text: 'Will I ever be asked to reply to, report or pressure specific people, journalists or groups?', why: 'Swarming critics is harassment, and workers can be held responsible.' },
  { id: 'Q_REFUSE', category: 'influence', text: 'Can I refuse to post something I believe is false or misleading, without losing pay?', why: 'If the answer is no, you are being hired to spread whatever you are told.' },
  { id: 'Q_PLATFORM_RULES', category: 'influence', text: "How does this work follow Facebook, TikTok and X rules on fake accounts and coordinated behaviour?", why: 'Platforms remove whole networks for "coordinated inauthentic behaviour"; the accounts you run are the ones taken down.' },
  // trafficking
  { id: 'Q_VISA', category: 'trafficking', text: 'What visa will I travel on? Can I see the work visa or work permit before I fly?', why: 'A real job abroad needs a work visa arranged before departure. A tourist visa for work is a stop sign.' },
  { id: 'Q_LICENSE', category: 'trafficking', text: 'What is your recruitment licence number, and is this an approved job order?', why: 'Check it yourself: DMW in the Philippines, eMigrate in India, NEA in Kenya, SLBFE in Sri Lanka, your labour ministry elsewhere.' },
  { id: 'Q_COUNTRY_CITY', category: 'trafficking', text: 'Which country, city and building will I physically work in?', why: 'Many victims were offered jobs in Thailand and then driven across the border into Myanmar, Cambodia or Laos.' },
  { id: 'Q_PASSPORT', category: 'trafficking', text: 'Will anyone hold my passport, ID or phone at any time?', why: 'Taking documents and phones is a core sign of forced labour.' },
  { id: 'Q_LEAVE', category: 'trafficking', text: 'If I want to quit and come home, what happens? Who pays for the flight back? Is there any penalty or debt?', why: 'Penalties and "debts" for flights and housing are used to stop people leaving.' },
  { id: 'Q_IMMIGRATION', category: 'trafficking', text: 'Will I leave through normal immigration with my exit documents, without anyone telling me what to say?', why: 'Coaching you to say you are a tourist is how traffickers get people past airport checks.' },
  { id: 'Q_WORKER_TALK', category: 'trafficking', text: 'Can I video-call someone who already does this job, at the workplace?', why: 'Real workplaces can show you around. Compounds cannot.' },
  { id: 'Q_DUTIES_ABROAD', category: 'trafficking', text: 'What exactly will I do all day? Will I chat with strangers online or sell investments or crypto?', why: 'Persuading strangers to invest is the work done in scam compounds.' },
  // scam
  { id: 'Q_WHY_FEE', category: 'scam', text: 'Why do I need to pay before I am hired? Can it be deducted from my first salary instead?', why: 'Legitimate employers do not charge to apply, interview or train.' },
  { id: 'Q_WHY_OTP', category: 'scam', text: 'Why do you need my bank or e-wallet login, PIN or one-time code?', why: 'No real employer ever needs these. Sharing them can make you a money mule.' },
  { id: 'Q_TASK_DEPOSIT', category: 'scam', text: 'Will I ever have to deposit my own money to unlock tasks or withdraw earnings?', why: 'Task scams pay a little at first, then demand bigger and bigger deposits.' },
];

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
const RULE_QUESTIONS: Record<string, string[]> = {};

export function registerRuleQuestions(ruleId: string, ids: string[] | undefined) {
  if (ids) RULE_QUESTIONS[ruleId] = ids;
}

export function questionById(id: string): Question | undefined {
  return BY_ID.get(id);
}

const BASE: Record<Category, string[]> = {
  influence: ['Q_OWN_ACCOUNTS', 'Q_END_CLIENT', 'Q_DISCLOSURE', 'Q_SAMPLE_TASKS', 'Q_POLITICAL', 'Q_REFUSE'],
  trafficking: ['Q_VISA', 'Q_LICENSE', 'Q_COUNTRY_CITY', 'Q_PASSPORT', 'Q_LEAVE', 'Q_IMMIGRATION', 'Q_WORKER_TALK'],
  scam: ['Q_WHY_FEE', 'Q_WHY_OTP', 'Q_TASK_DEPOSIT'],
};
const UNIVERSAL = ['Q_EMPLOYER_REG', 'Q_CONTRACT', 'Q_FEES', 'Q_OFFICIAL_CHANNEL', 'Q_INTERVIEW'];

/**
 * Questions for a set of red flags and categories of concern, most relevant first:
 * the flags' own questions, then the base questions for each concerning category, then universal ones.
 */
export function selectQuestions(hits: RuleHit[], categories: Category[], limit = 8): Question[] {
  const ids: string[] = [];
  const push = (id: string) => {
    if (!ids.includes(id) && BY_ID.has(id)) ids.push(id);
  };
  for (const h of hits) (RULE_QUESTIONS[h.id] ?? []).forEach(push);
  for (const c of categories) BASE[c].forEach(push);
  UNIVERSAL.forEach(push);
  return ids.slice(0, limit).map((id) => BY_ID.get(id)!);
}

export function questionsFor(category: Category): Question[] {
  return BASE[category].map((id) => BY_ID.get(id)!);
}

export const UNIVERSAL_QUESTIONS = UNIVERSAL.map((id) => BY_ID.get(id)!);
