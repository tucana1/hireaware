/**
 * Knowledge base for the chatbot's free-text questions. Answers locally with simple keyword retrieval
 * (no API key needed); when an Anthropic key is configured, the website gives this same text to Claude
 * as grounding. Figures and sources are from docs/research/facts.md (checked 2026-11-07).
 */
export interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  sources?: Array<{ title: string; url: string }>;
}

export const FAQ: FaqEntry[] = [
  {
    id: 'what_is_troll_farm',
    question: 'What is a troll farm, and how would I know if a job is one?',
    keywords: ['troll', 'farm', 'keyboard', 'army', 'warrior', 'propaganda', 'disinformation', 'fake', 'accounts', 'political', 'comments', 'social', 'media', 'engagement', 'netizen'],
    answer: 'A troll farm pays people to post from fake or borrowed accounts so a message looks like the opinion of many ordinary people. The job is rarely called that: ads say "social media specialist", "digital ambassador", "engagement associate" or "online volunteer". Warning signs: you are given accounts under other names, or told to create them; you get daily scripts, hashtags or talking points; the client is secret; you are told not to say the posts are paid; and you are asked to reply to or report critics and journalists. In the Philippines, researchers found this work is passed down from PR strategists to low-paid workers paid by quota, often the same people who do call-centre or moderation jobs.',
    sources: [{ title: 'Oxford Internet Institute, Industrialized Disinformation (2021)', url: 'https://demtech.oii.ox.ac.uk/research/posts/industrialized-disinformation/' }],
  },
  {
    id: 'how_big',
    question: 'How common is paid disinformation?',
    keywords: ['how', 'common', 'many', 'countries', 'industry', 'statistics', 'big', 'scale', 'paid', 'disinformation'],
    answer: 'The Oxford Internet Institute found organised social-media manipulation in 81 countries, with governments or parties working with private firms in 48 of them, and almost US$60 million spent on such firms since 2009. In the Philippines, reported pay for paid commenters ranged from about ₱500 to ₱3,000 a day (2017), and a troll-network leader described entry-level pay of ₱30,000 a month, with each worker handling many accounts (2019).',
    sources: [
      { title: 'Oxford Internet Institute press release (Jan 2021)', url: 'https://www.oii.ox.ac.uk/social-media-manipulation-by-political-actors-now-an-industrial-scale-problem-prevalent-in-over-80-countries-annual-oxford-report/' },
      { title: 'GMA News (Feb 2019)', url: 'https://www.gmanetwork.com/news/topstories/nation/686376/ph-online-troll-earns-between-p30-000-p70-000-a-month-leader-bares/story/' },
    ],
  },
  {
    id: 'scam_compounds',
    question: 'What are scam compounds and how do people end up there?',
    keywords: ['scam', 'compound', 'myanmar', 'cambodia', 'laos', 'thailand', 'kk', 'park', 'trafficked', 'trafficking', 'hub', 'pogo', 'forced'],
    answer: 'Scam compounds are guarded sites, mostly in Myanmar, Cambodia and Laos, where people are forced to run online fraud such as fake romance and crypto investment chats. The UN Human Rights Office estimates at least 300,000 people work in these operations across Southeast Asia, from at least 66 countries. Most were recruited with ordinary-looking job ads for customer service, IT, data entry or "digital sales", often with high pay, free flights and a tourist visa, then driven across a border. On arrival, passports and phones are taken and people are held by "debts".',
    sources: [
      { title: 'UN News on the OHCHR report (Feb 2026)', url: 'https://news.un.org/en/story/2026/02/1167012' },
      { title: 'IOM: key facts on trafficking into online scam operations', url: 'https://www.iom.int/explainer/key-facts-human-trafficking-online-scam-operations' },
    ],
  },
  {
    id: 'tourist_visa',
    question: 'They said I can travel on a tourist visa and get a work visa later. Is that OK?',
    keywords: ['tourist', 'visa', 'visit', 'work', 'permit', 'later', 'arrival', 'immigration', 'convert', 'papers'],
    answer: 'No. A real job abroad needs a work visa or permit arranged before you fly. Travelling for work on a tourist or visit visa leaves you without legal protection, and it is the most common route into scam compounds. Philippine authorities warn specifically about jobs in Thailand, Cambodia, Laos or Myanmar that tell you no visa is needed. If anyone coaches you on what to say at immigration, stop: that is a trafficking warning sign.',
    sources: [{ title: 'IOM explainer', url: 'https://www.iom.int/explainer/key-facts-human-trafficking-online-scam-operations' }],
  },
  {
    id: 'verify_recruiter',
    question: 'How do I check whether a recruiter or agency is real?',
    keywords: ['check', 'verify', 'recruiter', 'agency', 'licence', 'license', 'legit', 'real', 'registered', 'dmw', 'poea', 'emigrate', 'nea', 'slbfe'],
    answer: 'Check the licence yourself on the government site, not through a link the recruiter sends. Philippines: the DMW list of licensed agencies and approved job orders (dmw.gov.ph), or call 1348. India: eMigrate registered recruiting agents. Kenya: the National Employment Authority portal (neamis.go.ke); offers for Thailand should also be authenticated by the Ministry of Foreign Affairs or the Kenyan embassy in Bangkok. Sri Lanka: SLBFE (1989). Then check the company registration, insist on a written contract that matches the ad, and get official receipts for any payment. Watch for copycat pages that clone real agencies.',
    sources: [{ title: 'DMW licensed agencies', url: 'https://dmw.gov.ph/inquiry/licensed-recruitment-agencies' }],
  },
  {
    id: 'fees',
    question: 'Is it normal to pay a fee to get a job?',
    keywords: ['fee', 'pay', 'deposit', 'registration', 'training', 'placement', 'medical', 'processing', 'money', 'charge'],
    answer: 'Paying to apply, interview, train or "activate" an account is the business model of job scams. Legitimate employers do not charge for these. Some countries allow a limited, regulated placement fee for overseas jobs, but only through licensed agencies, after a contract, and with an official receipt. Never pay into a personal account or e-wallet, and never pay to "unlock" tasks or withdraw earnings.',
  },
  {
    id: 'task_scam',
    question: 'Someone is paying me to like videos or rate products. Is that a real job?',
    keywords: ['like', 'videos', 'follow', 'rate', 'review', 'task', 'tasks', 'telegram', 'commission', 'youtube', 'tiktok', 'hotels', 'part-time'],
    answer: 'This is the "task scam". You are paid a little at first to build trust, then asked to deposit money to unlock bigger "combo" or "VIP" tasks, and the money never comes back. It usually moves you to Telegram or WhatsApp with a "mentor" or "receptionist". Stop, do not deposit anything, and report the account to the platform and your cybercrime hotline.',
    sources: [{ title: 'WhatsApp: pause, question, verify (2025)', url: 'https://about.fb.com/news/2025/08/new-whatsapp-tools-tips-beat-messaging-scams/' }],
  },
  {
    id: 'otp_mule',
    question: 'Why would a job ask for my OTP, PIN, bank account or SIM card?',
    keywords: ['otp', 'pin', 'mpin', 'bank', 'account', 'gcash', 'mpesa', 'm-pesa', 'sim', 'ewallet', 'e-wallet', 'mule', 'transfer', 'rent', 'lend'],
    answer: 'No real employer needs your one-time codes, PINs or logins. Requests to "rent" or open a bank account, e-wallet or SIM for them, or to receive money and forward it, recruit you as a money mule. That can get you arrested and your accounts frozen. If you already shared details, contact your bank or e-wallet immediately and report it.',
  },
  {
    id: 'already_inside',
    question: "I'm already there and can't leave. What do I do?",
    keywords: ['inside', 'stuck', 'trapped', 'cannot', 'leave', 'passport', 'taken', 'help', 'rescue', 'escape', 'embassy', 'forced', 'beaten', 'threat'],
    answer: 'Your safety comes first. Only use your phone when it is safe. If you can, quietly contact your embassy, your migrant-worker agency (Philippines: DMW 1348 or the 1343 Actionline), or IOM. Save the address or location, names and photos if you can do it safely. Be careful of people who ask for money to "rescue" you: real embassies and NGOs do not charge. Under UN guidance, people forced to commit scams are victims and should not be punished for crimes they were forced to commit.',
    sources: [{ title: 'OHCHR press release (Feb 2026)', url: 'https://www.ohchr.org/en/press-releases/2026/02/un-report-details-grave-abuses-against-those-trafficked-scam-centres' }],
  },
  {
    id: 'already_troll',
    question: "I think my social media job is a troll operation. What should I do?",
    keywords: ['quit', 'my', 'job', 'troll', 'operation', 'leave', 'report', 'whistle', 'accounts', 'think', 'working', 'propaganda', 'already'],
    answer: 'Do not confront your employer or go public while you are still exposed. Quietly keep copies of briefs, scripts, account lists, payment slips and anything naming the client. Stop running accounts under other names; those accounts are what platforms take down, and your number or ID may be attached to them. You can report the network to the platform (Meta, TikTok and X all ban coordinated inauthentic behaviour) and, during elections, to the election authority. Talk to a journalist or a fact-checking organisation if you want to expose it safely.',
    sources: [{ title: 'Meta Inauthentic Behavior policy', url: 'https://transparency.meta.com/policies/community-standards/inauthentic-behavior/' }],
  },
  {
    id: 'evidence',
    question: 'What evidence should I keep?',
    keywords: ['evidence', 'proof', 'keep', 'screenshot', 'save', 'record', 'report', 'documents'],
    answer: 'Keep screenshots of the job ad with its link and date; the recruiter\'s profile links and phone numbers; full chat exports; the contract; tickets and itinerary; every payment receipt or e-wallet record; and any scripts, briefs or account lists you were given. Store copies somewhere the recruiter cannot reach, such as an email to yourself or a trusted person.',
  },
  {
    id: 'legit_social',
    question: 'How is a real social media job different?',
    keywords: ['real', 'legit', 'legitimate', 'social', 'media', 'manager', 'marketing', 'brand', 'influencer', 'different', 'normal', 'moderator', 'content'],
    answer: 'Real social media jobs work in the open: you post from the brand\'s official accounts or your own named account, paid content is labelled (#ad, "Paid partnership", "Paid for by"), the employer and client are named in your contract, and you are never asked to create accounts under other names or to attack people. Content moderators and fact-checkers deal with fake accounts in order to remove them, which is the opposite of running them.',
  },
  {
    id: 'why_matters',
    question: 'Why does this matter for misinformation?',
    keywords: ['why', 'matter', 'misinformation', 'democracy', 'elections', 'harm', 'society', 'mission'],
    answer: 'Disinformation is now a hired service, and it needs workers. Paid networks fake public opinion during elections, harass journalists and judges into silence, and let foreign actors exploit local divisions using outsourced labour. In the 2025 Philippine midterms, one study found fake profiles behind roughly a third of election-related X profiles it sampled. Many workers do not know what they joined. Helping people recognise these jobs before they say yes cuts off that supply.',
    sources: [{ title: 'Freedom House, Freedom on the Net 2025: Philippines', url: 'https://freedomhouse.org/country/philippines/freedom-net/2025' }],
  },
  {
    id: 'privacy',
    question: 'Do you store what I type?',
    keywords: ['store', 'data', 'privacy', 'private', 'save', 'delete', 'track', 'anonymous', 'safe'],
    answer: 'No. The risk check runs in your browser and nothing you answer is stored. Text you paste into the checker is analysed and then discarded. The browser extension works entirely on your device. If you report a recruiter, only what you choose to send is kept.',
  },
  {
    id: 'hotlines',
    question: 'Who can I call for help?',
    keywords: ['call', 'hotline', 'number', 'help', 'contact', 'report', 'police', 'embassy', 'phone'],
    answer: 'Philippines: 1343 Actionline (trafficking, 24/7), DMW 1348 (overseas workers), NBI (02) 8523-8231. India: 1930 and cybercrime.gov.in. Nigeria: NAPTIP 627. Ghana: Cyber Security Authority 292. Sri Lanka: SLBFE 1989. Malaysia: 997. Thailand: 1441. Kenya: State Department for Diaspora Affairs +254 114 757 002. Anywhere: IOM (iom.int/get-help). The Get help page lists more, with links.',
  },
];

const STOP = new Set(['the', 'a', 'an', 'is', 'it', 'to', 'i', 'my', 'me', 'do', 'what', 'and', 'or', 'of', 'in', 'on', 'for', 'this', 'that', 'be', 'are', 'can', 'if', 'with', 'about', 'they', 'you', 'how', 'should', 'would', 'there', 'am', 'was', 'have', 'has']);

function tokens(text: string): string[] {
  return (text.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu) ?? []).filter((t) => !STOP.has(t));
}

export interface FaqMatch {
  entry: FaqEntry;
  score: number;
}

/** Best FAQ entries for a free-text question, by keyword and question-word overlap. */
export function searchFaq(query: string, limit = 3): FaqMatch[] {
  const q = tokens(query);
  if (!q.length) return [];
  return FAQ.map((entry) => {
    const kw = new Set(entry.keywords);
    const qw = new Set(tokens(entry.question));
    let score = 0;
    for (const t of q) {
      if (kw.has(t)) score += 2;
      else if (qw.has(t)) score += 1;
      else if ([...kw].some((k) => k.length > 4 && (t.startsWith(k) || k.startsWith(t)))) score += 1;
    }
    return { entry, score: score / Math.sqrt(q.length + 2) };
  }).filter((m) => m.score > 0.6).sort((a, b) => b.score - a.score).slice(0, limit);
}

/** The knowledge base as plain text, for grounding an LLM. */
export function knowledgeText(): string {
  return FAQ.map((f) => `Q: ${f.question}\nA: ${f.answer}${f.sources?.length ? `\nSources: ${f.sources.map((s) => `${s.title} <${s.url}>`).join('; ')}` : ''}`).join('\n\n');
}
