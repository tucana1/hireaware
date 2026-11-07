/**
 * Help and verification directory, by country.
 *
 * `verified: true` means the number or link was seen on an official site on 2026-11-07 (sources in
 * docs/research/facts.md). Unverified entries are shown with a "check before relying on it" note.
 * Keep this list conservative: a wrong hotline number is worse than none.
 */
export interface Contact {
  name: string;
  phone?: string;
  url?: string;
  note?: string;
  verified: boolean;
}

export interface Country {
  code: string;
  name: string;
  /** International dialling prefix without "+", used to guess a tipline user's country. */
  dial: string;
  region: 'Southeast Asia' | 'South Asia' | 'Africa' | 'Latin America' | 'Middle East & North Africa' | 'Pacific' | 'Global';
  help: Contact[];
  /** Where to check a recruiter or company. */
  verify: Contact[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'PH', name: 'Philippines', dial: '63', region: 'Southeast Asia',
    help: [
      { name: '1343 Actionline Against Human Trafficking (24/7)', phone: '1343', url: 'https://1343actionline.ph/', verified: true },
      { name: 'Department of Migrant Workers (DMW) hotline', phone: '1348', url: 'https://dmw.gov.ph/', verified: true },
      { name: 'National Bureau of Investigation', phone: '(02) 8523-8231', url: 'https://nbi.gov.ph/contact/', verified: true },
    ],
    verify: [
      { name: 'DMW licensed recruitment agencies', url: 'https://dmw.gov.ph/inquiry/licensed-recruitment-agencies', verified: true },
      { name: 'DMW approved job orders', url: 'https://dmw.gov.ph/inquiry/approved-job-orders', verified: true },
      { name: 'DTI business name search', url: 'https://bnrs.dti.gov.ph/search/search_this', verified: true },
    ],
  },
  {
    code: 'IN', name: 'India', dial: '91', region: 'South Asia',
    help: [{ name: 'National Cyber Crime Helpline', phone: '1930', url: 'https://cybercrime.gov.in', verified: true }],
    verify: [{ name: 'eMigrate: list of active registered recruiting agents', url: 'https://emigrate.gov.in', note: 'Unregistered agents work through Facebook, WhatsApp and SMS.', verified: true }],
  },
  {
    code: 'KE', name: 'Kenya', dial: '254', region: 'Africa',
    help: [{ name: 'State Department for Diaspora Affairs', phone: '+254 114 757 002', note: 'Email kazimajuu@diaspora.go.ke', url: 'https://www.diaspora.go.ke/', verified: true }],
    verify: [{ name: 'National Employment Authority (NEA) portal', url: 'https://neaims.go.ke/EmploymentAgencyList.aspx', note: 'Offers for Thailand should also be authenticated by the Ministry of Foreign Affairs or the Kenyan embassy in Bangkok.', verified: true }],
  },
  {
    code: 'NG', name: 'Nigeria', dial: '234', region: 'Africa',
    help: [{ name: 'NAPTIP (anti-trafficking agency)', phone: '627', note: 'Also *627# or 0800 2255 627874 (toll-free)', url: 'https://naptip.gov.ng/', verified: true }],
    verify: [],
  },
  {
    code: 'GH', name: 'Ghana', dial: '233', region: 'Africa',
    help: [{ name: 'Cyber Security Authority', phone: '292', note: 'Call or SMS 292; WhatsApp 050 160 3111', url: 'https://www.csa.gov.gh/report', verified: true }],
    verify: [],
  },
  {
    code: 'LK', name: 'Sri Lanka', dial: '94', region: 'South Asia',
    help: [{ name: 'Sri Lanka Bureau of Foreign Employment', phone: '1989', note: 'From abroad: WhatsApp +94 71 9 802 822', url: 'https://www.slbfe.lk/', verified: true }],
    verify: [{ name: 'SLBFE registered agencies', url: 'https://www.slbfe.lk/', verified: true }],
  },
  {
    code: 'MY', name: 'Malaysia', dial: '60', region: 'Southeast Asia',
    help: [{ name: 'National Scam Response Centre', phone: '997', note: '8am–8pm daily. Call within 24 hours and file a police report.', url: 'https://www.bnm.gov.my/faqs/scams', verified: true }],
    verify: [],
  },
  {
    code: 'TH', name: 'Thailand', dial: '66', region: 'Southeast Asia',
    help: [{ name: 'Anti-Online Scam Operation Center', phone: '1441', verified: true }],
    verify: [],
  },
  {
    code: 'ID', name: 'Indonesia', dial: '62', region: 'Southeast Asia',
    help: [{ name: 'Indonesian Embassy in Phnom Penh (for citizens in Cambodia)', phone: '+855 12 813 282', note: 'Also +855 23 217 934', verified: true }],
    verify: [{ name: 'KP2MI (Ministry for the Protection of Indonesian Migrant Workers)', url: 'https://kp2mi.go.id', verified: true }],
  },
  {
    code: 'UG', name: 'Uganda', dial: '256', region: 'Africa',
    help: [{ name: 'Ministry of Internal Affairs anti-trafficking line (toll-free)', phone: '0800-199-003', note: 'Also 0800-199-004', verified: true }],
    verify: [{ name: 'EEMIS: licensed external-employment companies and approved jobs', url: 'https://eemis.mglsd.go.ug/', verified: true }],
  },
  {
    code: 'ET', name: 'Ethiopia', dial: '251', region: 'Africa',
    help: [{ name: 'National anti-trafficking hotline (toll-free; Amharic, Afan Oromo, English, Tigrigna)', phone: '8797', verified: true }, { name: 'Police', phone: '991', verified: true }],
    verify: [],
  },
  {
    code: 'ZA', name: 'South Africa', dial: '27', region: 'Africa',
    help: [{ name: 'National Human Trafficking Hotline', phone: '0800 222 777', verified: true }, { name: 'SAPS Crime Stop', phone: '08600 10111', verified: true }, { name: 'DIRCO (consular help abroad)', phone: '+27 12 351 1000', verified: true }],
    verify: [{ name: 'Check foreign offers with DIRCO and register on Travel Smart', url: 'https://www.dirco.gov.za/', verified: true }],
  },
  {
    code: 'NP', name: 'Nepal', dial: '977', region: 'South Asia',
    help: [{ name: 'Nepal Police Anti Human Trafficking Bureau', phone: '1177', note: 'Toll-free 16600141177', url: 'https://ahtb.nepalpolice.gov.np/', verified: true }],
    verify: [{ name: 'DoFE licensed recruiting agencies and labour permits', url: 'https://foreignjob.dofe.gov.np/Home/RecruitmentAgency', verified: true }],
  },
  {
    code: 'BD', name: 'Bangladesh', dial: '880', region: 'South Asia',
    help: [],
    verify: [{ name: 'BMET (Bureau of Manpower, Employment and Training)', url: 'https://bmet.gov.bd/', verified: true }],
  },
  {
    code: 'PK', name: 'Pakistan', dial: '92', region: 'South Asia',
    help: [],
    verify: [{ name: 'Bureau of Emigration & Overseas Employment: licensed promoters', url: 'https://beoe.gov.pk/', verified: true }],
  },
  {
    code: 'BR', name: 'Brazil', dial: '55', region: 'Latin America',
    help: [{ name: 'Disque 100 (human rights, incl. trafficking; 24/7)', phone: '100', note: 'WhatsApp (61) 99611-0100', verified: true }, { name: 'Itamaraty emergency line (Brazilians abroad)', phone: '+55 61 98260-0610', verified: true }],
    verify: [],
  },
  {
    code: 'MX', name: 'Mexico', dial: '52', region: 'Latin America',
    help: [{ name: 'Línea Nacional contra la Trata de Personas', phone: '800 5533 000', verified: true }],
    verify: [{ name: 'Contratados.org: recruiter reviews', url: 'https://contratados.org', verified: true }],
  },
  {
    code: 'CO', name: 'Colombia', dial: '57', region: 'Latin America',
    help: [{ name: 'Línea gratuita nacional contra la trata (24/7, with IOM)', phone: '01 8000 52 20 20', note: 'From abroad +57 1 600 10 35', verified: true }],
    verify: [{ name: 'Only authorised transnational agencies may place you abroad, and they may not charge you', verified: true }],
  },
];

/** Shown for everyone, wherever they are. */
export const GLOBAL_HELP: Contact[] = [
  { name: 'IOM: find your nearest office', url: 'https://www.iom.int/get-help', note: 'The UN migration agency helps trafficked and stranded migrants.', verified: true },
  { name: 'Global Anti-Scam Organisation (GASO)', url: 'https://www.globalantiscam.org/', note: 'Takes reports and refers risk-to-life cases. Not a rescue service.', verified: true },
  { name: 'International Justice Mission: forced scamming', url: 'https://www.ijm.org/our-work/trafficking-slavery/forced-scamming', verified: true },
];

export function countryByCode(code: string | undefined | null): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

/** Guess the country from an E.164 number such as "+639171234567" or "whatsapp:+254...". */
export function countryFromPhone(phone: string | undefined | null): Country | undefined {
  const digits = (phone ?? '').replace(/^whatsapp:/, '').replace(/[^\d]/g, '');
  if (!digits) return undefined;
  return [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
}
