/**
 * The risk-check chatbot: a short, branching set of questions about the person's situation, scored into
 * the same three categories as the text analysis. Written for people who may not know what they are
 * being recruited into, so questions describe behaviours ("will they give you accounts to use?") instead
 * of asking "is this a troll farm?".
 *
 * Pure data + functions: the website renders it as a chat; nothing is stored or sent anywhere.
 */
import type { Category, Level, Question } from './types';
import { CATEGORIES } from './types';
import { questionById, selectQuestions } from './questions';
import { COUNTRIES, GLOBAL_HELP, countryByCode, type Contact, type Country } from './regions';
import { guideForCountry, type RegionGuide } from './region-guides';

export interface Effect {
  category: Category;
  weight: number;
  reason: string;
  floor?: Level;
  urgent?: boolean;
  /** Question ids worth asking because of this answer. */
  ask?: string[];
}

export interface StepOption {
  id: string;
  label: string;
  effects?: Effect[];
}

export interface Step {
  id: string;
  prompt: string;
  hint?: string;
  kind: 'single' | 'multi';
  options: StepOption[];
  when?: (a: Answers) => boolean;
}

export type Answers = Record<string, string[]>;

const pick = (a: Answers, step: string) => a[step] ?? [];
const any = (a: Answers, step: string, ...ids: string[]) => pick(a, step).some((x) => ids.includes(x));
const abroad = (a: Answers) => any(a, 'where', 'abroad', 'unsure');
const posting = (a: Answers) => any(a, 'posting', 'yes', 'unsure');

export const STEPS: Step[] = [
  {
    id: 'situation', kind: 'single',
    prompt: "Hi, I'm the HireAware assistant. I'll ask a few quick questions about a job and point out anything worrying. Nothing you answer is stored. What fits you best?",
    options: [
      { id: 'considering', label: "I've been offered a job, or I'm about to apply" },
      { id: 'started', label: "I've already started the job" },
      { id: 'helping', label: "I'm worried about a friend or family member" },
    ],
  },
  {
    id: 'country', kind: 'single',
    prompt: 'Which country are you in right now? (So I can show the right hotlines.)',
    options: [...COUNTRIES.map((c) => ({ id: c.code, label: c.name })), { id: 'OTHER', label: 'Somewhere else' }],
  },
  {
    id: 'work', kind: 'multi',
    prompt: 'What kind of work is it? Pick all that apply.',
    options: [
      { id: 'social', label: 'Social media, content, comments or "engagement"' },
      { id: 'chat', label: 'Customer service, chat support or call centre' },
      { id: 'data', label: 'Typing, data entry or encoding' },
      { id: 'sales', label: 'Online sales, marketing or "investment" support' },
      { id: 'it', label: 'IT, gaming or tech' },
      { id: 'other', label: 'Something else' },
    ],
  },
  {
    id: 'where', kind: 'single',
    prompt: 'Where would you do the work?',
    options: [
      { id: 'home', label: 'From home (remote)' },
      { id: 'local', label: 'At an office in my own country' },
      { id: 'abroad', label: 'In another country' },
      { id: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'destination', kind: 'single', when: abroad,
    prompt: 'Which country did they say the job is in?',
    options: [
      { id: 'kh_mm_la', label: 'Cambodia, Myanmar or Laos', effects: [{ category: 'trafficking', weight: 3, reason: 'Most online-scam compounds are in Myanmar, Cambodia and Laos.', ask: ['Q_COUNTRY_CITY', 'Q_WORKER_TALK'] }] },
      { id: 'th', label: 'Thailand', effects: [{ category: 'trafficking', weight: 1, reason: 'Many victims were offered jobs in Thailand, then driven across the border into Myanmar.', ask: ['Q_COUNTRY_CITY'] }] },
      { id: 'russia', label: 'Russia', effects: [{ category: 'trafficking', weight: 4, floor: 'medium', reason: 'Helper, guard, driver and "work and study" offers in Russia have ended in army contracts or drone factories.', ask: ['Q_CONTRACT', 'Q_LEAVE'] }] },
      { id: 'my_vn', label: 'Malaysia, Vietnam or another Asian country' },
      { id: 'gulf', label: 'Dubai or another Gulf country', effects: [{ category: 'trafficking', weight: 1, reason: 'Some recruits were flown to Dubai first, then moved on to compounds.' }] },
      { id: 'other', label: 'Somewhere else' },
      { id: 'not_told', label: "They haven't said exactly", effects: [{ category: 'trafficking', weight: 3, reason: "You haven't been told exactly where you'll work.", ask: ['Q_COUNTRY_CITY'] }] },
    ],
  },
  {
    id: 'visa', kind: 'single', when: abroad,
    prompt: 'What visa will you travel on?',
    hint: 'A real job abroad needs a work visa or work permit before you fly.',
    options: [
      { id: 'work', label: "A work visa or permit, and I've seen it" },
      { id: 'tourist', label: 'A tourist or visit visa, or "no visa needed"', effects: [{ category: 'trafficking', weight: 5, floor: 'medium', reason: 'Working on a tourist or visit visa leaves you with no legal protection. It is the most common route into scam compounds.', ask: ['Q_VISA'] }] },
      { id: 'later', label: '"They\'ll sort it out when I arrive"', effects: [{ category: 'trafficking', weight: 4, reason: 'Visas "sorted out on arrival" usually mean you arrive as a tourist.', ask: ['Q_VISA'] }] },
      { id: 'unsure', label: "I don't know", effects: [{ category: 'trafficking', weight: 1, reason: "You don't know your visa type yet.", ask: ['Q_VISA'] }] },
    ],
  },
  {
    id: 'agency', kind: 'single', when: abroad,
    prompt: 'Is a licensed recruitment agency involved?',
    hint: 'For example DMW-licensed in the Philippines, eMigrate in India, NEA in Kenya, SLBFE in Sri Lanka.',
    options: [
      { id: 'verified', label: "Yes, and I checked the licence myself", effects: [{ category: 'trafficking', weight: -2, reason: 'You verified the recruiter\'s licence.' }] },
      { id: 'claimed', label: "They say so, but I haven't checked", effects: [{ category: 'trafficking', weight: 1, reason: "The licence hasn't been checked. Copycat pages clone real agencies.", ask: ['Q_LICENSE'] }] },
      { id: 'none', label: 'No agency: a direct hire, a friend, or someone online', effects: [{ category: 'trafficking', weight: 3, reason: 'There is no licensed agency, so you lose the protection and paperwork it provides.', ask: ['Q_LICENSE'] }] },
      { id: 'unsure', label: "I don't know", effects: [{ category: 'trafficking', weight: 1, reason: "You don't know whether the recruiter is licensed.", ask: ['Q_LICENSE'] }] },
    ],
  },
  {
    id: 'travel', kind: 'multi', when: abroad,
    prompt: 'Has anyone told you any of these? Pick all that apply.',
    options: [
      { id: 'lie', label: 'What to say at immigration, or that someone will "help" you at the airport', effects: [{ category: 'trafficking', weight: 6, floor: 'high', reason: 'You were coached on what to tell immigration. No real employer does this.', ask: ['Q_IMMIGRATION'] }] },
      { id: 'border', label: 'You will cross a border by car, boat or on foot', effects: [{ category: 'trafficking', weight: 4, floor: 'medium', reason: 'Being driven or shipped across a border is how people are moved into compounds.', ask: ['Q_COUNTRY_CITY'] }] },
      { id: 'passport', label: 'Someone will keep your passport', effects: [{ category: 'trafficking', weight: 6, floor: 'high', reason: 'Someone else holding your passport is a core sign of forced labour.', ask: ['Q_PASSPORT'] }] },
      { id: 'no_contract', label: "You'll get the contract after you arrive", effects: [{ category: 'trafficking', weight: 3, reason: 'Survivors of scam compounds were often shown contracts only after arrival.', ask: ['Q_CONTRACT'] }] },
      { id: 'secret', label: "Don't tell your family where you're going", effects: [{ category: 'trafficking', weight: 4, floor: 'medium', reason: 'Cutting you off from family means nobody knows where to look.' }] },
      { id: 'debt', label: "You'll repay the ticket or pay a penalty if you quit", effects: [{ category: 'trafficking', weight: 4, floor: 'medium', reason: 'Debts and penalties are used to stop people leaving.', ask: ['Q_LEAVE'] }] },
      { id: 'none', label: 'None of these' },
    ],
  },
  {
    id: 'posting', kind: 'single',
    prompt: 'Will the job involve posting, commenting, reacting or messaging people online?',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'accounts', kind: 'single', when: posting,
    prompt: 'Whose accounts would you use?',
    options: [
      { id: 'own', label: 'My own account, under my real name' },
      { id: 'official', label: "The company's official, named accounts" },
      { id: 'provided', label: 'Accounts they give me, under other names', effects: [{ category: 'influence', weight: 5, floor: 'medium', reason: 'You would post from accounts under other names. That is how troll farms fake public opinion, and platforms ban it.', ask: ['Q_OWN_ACCOUNTS', 'Q_PLATFORM_RULES'] }] },
      { id: 'create', label: "New accounts I'd create, with fake names or photos", effects: [{ category: 'influence', weight: 5, floor: 'medium', reason: 'Creating fake personas is the core of troll-farm work.', ask: ['Q_OWN_ACCOUNTS'] }] },
      { id: 'unsure', label: "They haven't said", effects: [{ category: 'influence', weight: 1, reason: "You don't know whose accounts you'll use.", ask: ['Q_OWN_ACCOUNTS'] }] },
    ],
  },
  {
    id: 'topic', kind: 'multi', when: posting,
    prompt: 'What would you post or comment about? Pick all that apply.',
    options: [
      { id: 'politics', label: 'Elections, candidates, parties or government', effects: [{ category: 'influence', weight: 2, reason: 'The content is political.', ask: ['Q_POLITICAL', 'Q_DISCLOSURE'] }] },
      { id: 'issue', label: 'A public issue or cause (a law, a project, a country)', effects: [{ category: 'influence', weight: 1, reason: 'The content is about a public issue.', ask: ['Q_END_CLIENT'] }] },
      { id: 'products', label: 'Products, a brand or customer support' },
      { id: 'scam_chat', label: 'Chatting with strangers about investments, crypto or romance', effects: [{ category: 'trafficking', weight: 5, floor: 'medium', reason: 'Chatting to strangers to get them to invest is the work done in scam compounds.', ask: ['Q_DUTIES_ABROAD'] }, { category: 'scam', weight: 2, reason: 'You would be persuading people to send money.' }] },
      { id: 'wont_say', label: "They won't tell me", effects: [{ category: 'influence', weight: 3, reason: "They won't tell you what the content is about.", ask: ['Q_SAMPLE_TASKS', 'Q_END_CLIENT'] }] },
    ],
  },
  {
    id: 'instructions', kind: 'multi', when: posting,
    prompt: 'Have they said any of these? Pick all that apply.',
    options: [
      { id: 'scripts', label: "You'll get scripts, talking points or hashtags to post", effects: [{ category: 'influence', weight: 2, reason: 'You would post scripted content as if it were your own opinion.', ask: ['Q_SAMPLE_TASKS', 'Q_REFUSE'] }] },
      { id: 'targets', label: 'Reply to, report or attack certain people or pages', effects: [{ category: 'influence', weight: 4, floor: 'medium', reason: 'Targeting critics, journalists or opponents is harassment work.', ask: ['Q_TARGETS'] }] },
      { id: 'hide', label: "Don't tell anyone who you work for, or the client is secret", effects: [{ category: 'influence', weight: 3, reason: 'The real client is hidden.', ask: ['Q_END_CLIENT'] }] },
      { id: 'no_label', label: "Don't say the posts are paid", effects: [{ category: 'influence', weight: 3, reason: 'Hiding that posts are paid deceives the audience.', ask: ['Q_DISCLOSURE'] }] },
      { id: 'quota', label: 'Pay per comment or share, with daily quotas', effects: [{ category: 'influence', weight: 1, reason: 'Piece-rate pay for comments is how engagement and troll farms pay.' }] },
      { id: 'none', label: 'None of these' },
    ],
  },
  {
    id: 'money', kind: 'multi',
    prompt: 'Have they asked you for any of these? Pick all that apply.',
    options: [
      { id: 'fee', label: 'A fee or deposit (registration, training, medical, placement, "top-up")', effects: [{ category: 'scam', weight: 4, floor: 'medium', reason: 'You were asked to pay to get or start the job.', ask: ['Q_WHY_FEE', 'Q_FEES'] }] },
      { id: 'otp', label: 'A one-time code, PIN, password or e-wallet / bank login', effects: [{ category: 'scam', weight: 6, floor: 'high', reason: 'No real employer needs your codes or logins. This is account theft or money-mule recruitment.', ask: ['Q_WHY_OTP'] }] },
      { id: 'lend', label: 'To lend or open a bank account, e-wallet or SIM for them', effects: [{ category: 'scam', weight: 6, floor: 'high', reason: 'Lending accounts or SIMs makes you a money mule, which can get you arrested.', ask: ['Q_WHY_OTP'] }] },
      { id: 'id_early', label: 'Passport or ID copies before any interview', effects: [{ category: 'scam', weight: 2, reason: 'They want your identity documents before a real selection process.' }] },
      { id: 'none', label: 'None of these' },
    ],
  },
  {
    id: 'pay', kind: 'single',
    prompt: 'How does the pay compare with similar jobs you know of?',
    options: [
      { id: 'much_higher', label: 'Much higher, for easy work', effects: [{ category: 'scam', weight: 1, reason: 'The pay is far above normal for simple work.' }] },
      { id: 'normal', label: 'About normal' },
      { id: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'process', kind: 'multi',
    prompt: 'How has the hiring gone so far? Pick all that apply.',
    options: [
      { id: 'chat_only', label: 'Only through WhatsApp, Telegram or social-media messages', effects: [{ category: 'scam', weight: 1, reason: 'Hiring only through private chat leaves no company record.', ask: ['Q_OFFICIAL_CHANNEL'] }] },
      { id: 'rushed', label: "They're rushing me to decide or leave", effects: [{ category: 'scam', weight: 1, reason: 'You are being rushed.' }, { category: 'trafficking', weight: 1, reason: 'Rushed departures stop you checking the offer.' }] },
      { id: 'friend', label: 'A friend or relative already "working there" recruited me', effects: [{ category: 'trafficking', weight: 1, reason: 'Recruits are often pressured to bring in friends.' }] },
      { id: 'no_contract', label: "There's no written contract yet", effects: [{ category: 'scam', weight: 1, reason: 'There is no written contract yet.', ask: ['Q_CONTRACT'] }] },
      { id: 'interview_office', label: 'I had an interview with a named person at a real office' },
      { id: 'none', label: 'None of these' },
    ],
  },
  {
    id: 'inside', kind: 'multi', when: (a) => any(a, 'situation', 'started', 'helping'),
    prompt: 'Is any of this happening now? Pick all that apply. You can stop at any time.',
    options: [
      { id: 'passport_taken', label: 'Passport or phone taken', effects: [{ category: 'trafficking', weight: 6, floor: 'high', urgent: true, reason: 'Your documents or phone have been taken.' }] },
      { id: 'cannot_leave', label: "Can't leave the building or compound freely", effects: [{ category: 'trafficking', weight: 6, floor: 'high', urgent: true, reason: 'You cannot leave freely.' }] },
      { id: 'threats', label: 'Threats, beatings, fines or a "debt" you must work off', effects: [{ category: 'trafficking', weight: 6, floor: 'high', urgent: true, reason: 'You are being threatened, fined or held by a debt.' }] },
      { id: 'forced_scam', label: 'Being made to scam people online', effects: [{ category: 'trafficking', weight: 6, floor: 'high', urgent: true, reason: 'You are being forced to scam people. You are a victim, not a criminal.' }] },
      { id: 'false_posts', label: 'Being told to post things I think are false, or to attack people online', effects: [{ category: 'influence', weight: 5, floor: 'high', reason: 'You are being used to spread false content or harass people.', ask: ['Q_REFUSE'] }] },
      { id: 'unpaid', label: 'Not being paid what was promised', effects: [{ category: 'scam', weight: 2, reason: 'You are not being paid as promised.' }] },
      { id: 'none', label: 'None of these' },
    ],
  },
];

const STEP_BY_ID = new Map(STEPS.map((s) => [s.id, s]));

/** The next unanswered step whose condition holds, or null when the check is complete. */
export function nextStep(answers: Answers): Step | null {
  for (const step of STEPS) {
    if (answers[step.id]) continue;
    if (step.when && !step.when(answers)) continue;
    return step;
  }
  return null;
}

export function getStep(id: string): Step | undefined {
  return STEP_BY_ID.get(id);
}

export interface AssessmentResult {
  levels: Record<Category, Level>;
  scores: Record<Category, number>;
  reasons: Record<Category, string[]>;
  overall: 'low' | 'caution' | 'high';
  urgent: boolean;
  topCategory: Category | null;
  questions: Question[];
  nextSteps: string[];
  saferIf: string[];
  country: Country | undefined;
  guide: RegionGuide | undefined;
  help: Contact[];
}

const RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };

export function assess(answers: Answers): AssessmentResult {
  const scores = { influence: 0, trafficking: 0, scam: 0 } as Record<Category, number>;
  const floors = { influence: 'low', trafficking: 'low', scam: 'low' } as Record<Category, Level>;
  const reasons = { influence: [], trafficking: [], scam: [] } as Record<Category, string[]>;
  const ask: string[] = [];
  let urgent = false;

  for (const [stepId, chosen] of Object.entries(answers)) {
    const step = STEP_BY_ID.get(stepId);
    if (!step || (step.when && !step.when(answers))) continue;
    for (const optId of chosen) {
      for (const e of step.options.find((o) => o.id === optId)?.effects ?? []) {
        scores[e.category] += e.weight;
        if (e.weight > 0) reasons[e.category].push(e.reason);
        if (e.floor && RANK[e.floor] > RANK[floors[e.category]]) floors[e.category] = e.floor;
        if (e.urgent) urgent = true;
        e.ask?.forEach((q) => ask.push(q));
      }
    }
  }

  // Fake or borrowed accounts plus a political, hidden or scripted brief = covert influence work.
  const fakeAccounts = any(answers, 'accounts', 'provided', 'create');
  const covertBrief = any(answers, 'topic', 'politics', 'issue', 'wont_say') || any(answers, 'instructions', 'scripts', 'targets', 'hide', 'no_label');
  if (fakeAccounts && covertBrief) floors.influence = 'high';
  if (any(answers, 'visa', 'tourist', 'later') && any(answers, 'destination', 'kh_mm_la', 'th', 'not_told')) floors.trafficking = 'high';

  const levels = {} as Record<Category, Level>;
  for (const c of CATEGORIES) {
    const fromScore: Level = scores[c] >= 7 ? 'high' : scores[c] >= 3 ? 'medium' : 'low';
    levels[c] = RANK[floors[c]] > RANK[fromScore] ? floors[c] : fromScore;
  }
  const ranked = [...CATEGORIES].sort((a, b) => RANK[levels[b]] - RANK[levels[a]] || scores[b] - scores[a]);
  const top = levels[ranked[0]!] === 'low' ? null : ranked[0]!;
  const overall = top === null ? 'low' : levels[top] === 'high' ? 'high' : 'caution';
  const concerning = ranked.filter((c) => levels[c] !== 'low');

  const questions = mergeQuestions(ask, selectQuestions([], concerning, 10));

  const steps: string[] = [];
  if (urgent) {
    steps.push('Your safety comes first. If you can, quietly contact your embassy or the hotline below. Only do it when it is safe for you.');
    steps.push('Beware of people who ask for money to "rescue" you. Real embassies and NGOs do not charge.');
    steps.push('Under UN guidance, people forced to commit scams are victims and should be protected, not punished.');
  }
  if (levels.trafficking !== 'low' && !urgent) steps.push("Don't travel or hand over your passport until you have a verified work visa, contract and licensed recruiter.");
  if (levels.influence !== 'low') steps.push("Don't run accounts under other names or post paid political content you can't sign with your own name. Keep quiet copies of instructions and payments.");
  if (levels.scam !== 'low') steps.push("Don't pay fees or share codes, PINs, logins or SIMs. If you already did, call your bank or e-wallet now.");
  if (!steps.length) steps.push('Nothing you told me is a common red flag. Still verify the employer yourself and get a written contract before you start or travel.');
  steps.push('Paste the actual job ad or recruiter message into the checker for a second look.');

  const saferIf: string[] = [];
  if (abroad(answers)) {
    if (!any(answers, 'visa', 'work')) saferIf.push('You see the work visa or work permit before you fly.');
    if (!any(answers, 'agency', 'verified')) saferIf.push("You verify the recruiter's licence and the job order on your government's website.");
    saferIf.push('You keep your own passport and phone, in writing.');
  }
  if (posting(answers) && !any(answers, 'accounts', 'own', 'official')) saferIf.push('You only post from your own named account or the company\'s official account.');
  if (any(answers, 'instructions', 'hide', 'no_label') || any(answers, 'topic', 'wont_say')) saferIf.push('The client is named in your contract and paid posts are labelled.');
  if (any(answers, 'money', 'fee')) saferIf.push('Nothing is paid before you are hired, and every payment gets an official receipt.');

  const country = countryByCode(pick(answers, 'country')[0]);
  return { levels, scores, reasons, overall, urgent, topCategory: top, questions, nextSteps: steps, saferIf, country, guide: focusGuide(guideForCountry(country?.code), concerning),
    help: [...(country?.help ?? []), ...GLOBAL_HELP] };
}

function mergeQuestions(first: string[], rest: Question[]): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  for (const q of [...first.map((id) => questionById(id)), ...rest]) {
    if (q && !seen.has(q.id)) {
      out.push(q);
      seen.add(q.id);
    }
  }
  return out.slice(0, 8);
}

const FOCUS: Record<Category, RegExp> = {
  influence: /post|comment|engagement|propaganda|politic|buzzer|cyber|hashtag|campaign|accounts|page|social media/i,
  trafficking: /visa|passport|compound|border|abroad|thailand|russia|embassy|agency|trafficked/i,
  scam: /fee|pay|money|deposit|liking|task/i,
};

/** Puts the regional points about the person's main concern first. */
function focusGuide(guide: RegionGuide | undefined, concerning: Category[]): RegionGuide | undefined {
  if (!guide || !concerning.length) return guide;
  const score = (p: string) => concerning.reduce((s, c, i) => s + (FOCUS[c].test(p) ? 10 - i * 3 : 0), 0);
  return { ...guide, points: [...guide.points].sort((a, b) => score(b) - score(a)) };
}
