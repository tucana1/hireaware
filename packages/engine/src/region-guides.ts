/**
 * What a job seeker in each part of the Global South should know. The risks differ by area:
 * migration routes, local lures, money apps, elections, war-economy recruitment, and how victims are
 * treated when they come home. Written in our own words from regional research notes compiled on
 * 2026-11-07 (docs/research/). Figures are as reported by the sources cited there.
 */
export interface RegionGuide {
  id: string;
  name: string;
  countries: string[];
  /** Short, plain-language points. */
  points: string[];
  /** Typical lure wording seen in ads, for recognition (not quotes). */
  lures: string[];
}

export const REGION_GUIDES: RegionGuide[] = [
  {
    id: 'sea', name: 'Southeast Asia', countries: ['PH', 'ID', 'VN', 'TH', 'MY', 'MM', 'KH', 'LA'],
    points: [
      '"Customer service", "admin", "computer operator" or "e-commerce" jobs in Cambodia, Myanmar, Laos or "Thailand", paying far above local wages with no experience needed, are the most common scam-compound lure.',
      'A sponsor who pays your ticket and visa and tells you to travel as a tourist is a warning sign, not a perk. Legal overseas jobs go through licensed agencies and official portals (DMW in the Philippines, KP2MI/SISKOP2MI in Indonesia, DOLAB in Vietnam).',
      'Be careful when a friend abroad pushes you to join their job: compounds make workers find a replacement before they can leave, and pay recruiters per new person.',
      'Paid "posting", "commenting" or "engagement" gigs can be political influence work. Indonesian "buzzers" and Malaysian "cybertroopers" are paid per post or per task, often with ready-made accounts and daily scripts sent over WhatsApp or Telegram.',
      'Coming home is not the end of the risk: returnees have been detained and charged in some countries. Contact your embassy or hotline early and keep evidence of the original offer.',
      'Never hand your passport to a "sponsor". People who reached embassies without one needed emergency travel documents.',
    ],
    lures: ['lowongan kerja, gaji tinggi, visa turis (Indonesian)', 'việc nhẹ lương cao: easy work, high pay (Vietnamese)', 'CSR abroad, libre flight, tourist visa lang (Taglish)'],
  },
  {
    id: 'sa', name: 'South Asia', countries: ['IN', 'BD', 'PK', 'LK', 'NP'],
    points: [
      'Check the agent before you pay anything. Every country has a free official list: eMigrate (India), BMET (Bangladesh), BE&OE (Pakistan), SLBFE (Sri Lanka), DoFE (Nepal). Unlisted agents who only use WhatsApp or Facebook are a red flag.',
      'A tourist visa or visa on arrival is never a work permit. If an "employer" flies you to Bangkok and then drives you to a border town such as Mae Sot, you are being trafficked. About 7,000 Indians have been rescued from scam compounds since 2022.',
      'Be very wary of "helper", "cook", "security guard" or "student" offers for Russia, especially if citizenship is promised. People from India, Nepal, Sri Lanka and Bangladesh who took them ended up in combat. Never sign a document you cannot read.',
      '"Earn from home by liking, commenting or posting" can be political manipulation: click farms sell reactions and bot accounts for political attacks, paid through bKash or Nagad, and parties run permanent online teams.',
      'Legal fees are capped in some countries (for example Nepal\'s limit for main Gulf and Malaysia jobs). Agents charging lakhs of rupees through informal channels are a warning sign.',
    ],
    lures: ['Thailand mein data entry job, tourist visa (Hinglish)', '"Digital Sales and Marketing Executive" in Laos or Cambodia', 'free visa free ticket for Russia "helper" jobs'],
  },
  {
    id: 'eaf', name: 'East Africa and the Horn', countries: ['KE', 'UG', 'ET'],
    points: [
      'A real overseas job needs two checks, the agency and the specific job: NEA\'s NEAIMS portal (Kenya), EEMIS (Uganda), E-LMIS (Ethiopia).',
      '"Customer care, typing or digital marketing in Thailand, ticket paid" is the classic lure. Warning signs: a tourist visa, being told to fly out through a neighbouring country to avoid checks, and a long drive from Bangkok towards the border.',
      'Security-guard, driver or "logistics" jobs in Russia, or offers routed through Moscow, have ended on the front line. Young women have been offered Russian "work and study" programmes that led to drone factories (Alabuga Start), sometimes shared by officials or influencers.',
      '"Online jobs" paying per hashtag or per day in a WhatsApp group are often paid political campaigns, paid by M-Pesa. Expect more of them before Kenya\'s August 2027 election.',
      'If you are trapped, you may be treated as a suspect: Kenyans have been jailed in Myanmar and held in Thai immigration detention. Keep your offer letter, chats and payment receipts.',
    ],
    lures: ['Kazi Thailand, tiketi bure (Swahili)', 'customer care agents needed, agency fee covers ticket and visa', 'paid hashtag campaign, join the WhatsApp group'],
  },
  {
    id: 'waf', name: 'West, Southern and Francophone Africa', countries: ['NG', 'GH', 'ZA', 'SN', 'CI', 'CM'],
    points: [
      '"Customer care in Thailand" with free flights and housing has led Nigerians and South Africans into locked compounds in Myanmar.',
      'An interview on Telegram, "show money" paid into your account to pass a visa check, or a request for bank statements before a contract are red flags.',
      'A "scholarship", "work-study" or "training" in Russia can be a drone factory or an army contract. An influencer\'s post is not proof a job is real; South African influencers were paid to promote one such scheme.',
      '"Social media manager" jobs can be propaganda jobs: posting about another country\'s politics, running several accounts or handing your passwords to a boss. In 2020, workers in Ghana and Nigeria ran fake American personas for a Russia-linked operation without knowing who was behind it.',
      'Check the licence: Federal Ministry of Labour (Nigeria), the labour ministry list (Ghana), DIRCO (South Africa). Leave the employer\'s name, address and a check-in schedule with family.',
    ],
    lures: ['Emploi en Thaïlande, billet offert, visa touristique (French)', 'customer care / teaching / hospitality in Thailand, $1,500', 'web-activistes rémunérés par publication (French)'],
  },
  {
    id: 'lac', name: 'Latin America and the Caribbean', countries: ['BR', 'MX', 'CO', 'VE', 'HN', 'SV', 'NI', 'GT'],
    points: [
      '"Customer service" or "tech company" jobs in Thailand, Cambodia, Laos or Myanmar, paid in dollars with a free flight, are the most documented trap for Brazilians and Colombians right now. Brazil\'s foreign ministry issued a warning in 2026.',
      'Your Spanish or Portuguese is what scam bosses want: native speakers to scam people in their own language. Treat "bilingual customer service in Asia" as a red flag.',
      'Recruiters are often a friend of a friend or someone showing off a luxury lifestyle online, and some are paid per person delivered.',
      'Check before you go: in Colombia only authorised agencies may place you abroad and they may not charge you; in Mexico, look up recruiters on Contratados.org.',
      '"Online campaign" side jobs can be propaganda work: tweeting the "hashtag of the day" for bonuses, running fake accounts under a gag contract, or paid "bodega" accounts.',
    ],
    lures: ['atención al cliente en Tailandia, pasaje pagado, visa de turista (Spanish)', 'vaga de atendimento na Tailândia, passagem paga (Portuguese)', 'operador digital, perfiles de ciudadanos comunes (Spanish)'],
  },
  {
    id: 'mena', name: 'Middle East, North Africa and the Pacific', countries: ['EG', 'TN', 'MA', 'JO', 'FJ', 'PG'],
    points: [
      '"A job in Thailand" can end in Myanmar: Moroccans offered e-commerce or call-centre jobs were driven across the river from Mae Sot.',
      'Recruiters can be your own people, including in diaspora Facebook groups, and some are paid per recruit.',
      'Check licences with Egypt\'s or Jordan\'s Ministry of Labour lists. Your country may have no embassy in Myanmar, Laos or Cambodia, so know which embassy covers them.',
      '"Page admin" jobs can be influence-for-hire: PR firms in the region have run hundreds of fake news pages and fake local profiles for clients in other countries\' elections.',
      'Pacific islands: use your government\'s labour-mobility unit and approved employers, not a Facebook "agent" who wants a fee, and be wary of paid political page work around elections.',
    ],
    lures: ['e-commerce or casino job in Thailand, $1,000 rising to $2,000', 'page admin for an unnamed client'],
  },
];

export function guideForCountry(code: string | undefined | null): RegionGuide | undefined {
  if (!code) return undefined;
  return REGION_GUIDES.find((g) => g.countries.includes(code.toUpperCase()));
}
