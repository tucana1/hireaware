/**
 * Red-flag rules: explainable, multilingual patterns for the behaviours that matter.
 *
 * Languages covered: English, Filipino/Taglish, Spanish, Portuguese, French, Swahili, Bahasa Indonesia,
 * Hindi/Hinglish (romanised and Devanagari). Rules target behaviours (fake personas, tourist visas
 * for work, passports taken, fees, OTP requests), never parties, candidates or countries' politics.
 *
 * Each rule may list `unless` patterns: a hit is ignored when one appears within ±60 characters
 * (e.g. "we never charge fees", "remove fake accounts" in a content-moderator ad).
 * `examples` double as unit tests (test/rules.test.ts).
 */
import type { Category, Level, RuleHit, Strength } from './types';
import { normalizeForRules } from './text';

export interface RuleDef {
  id: string;
  category: Category | 'reassuring';
  /** For reassuring rules: the categories whose score they reduce. */
  affects?: Category[];
  strength: Strength;
  weight: number;
  /** Minimum level for the category whenever this rule fires. */
  floor?: Level;
  patterns: string[];
  unless?: string[];
  title: string;
  explain: string;
  questions?: string[];
  examples?: { hit: string[]; miss: string[] };
}

const NEGATION = ["never", "don't", 'do not', 'no', 'not', 'without', 'nunca', 'jamás', 'jamais', 'ne jamais', 'não', 'tidak', 'hakuna', 'hatu', 'walang', 'hindi', 'huwag', 'kabhi', 'nahi', 'sin', 'sem', 'aucun'];
const NEG = `(?:${NEGATION.join('|')})`;
/** Phrases that show the job is about fighting fake accounts or disinformation, not running them. */
const COUNTER_WORK = '(?:remove|removing|removal|detect|detecting|detection|identify|review|reviewing|report(?:ing)? on|flag|investigat\\w*|monitor\\w*|track\\w*|takedown|moderat\\w*|fact[- ]?check\\w*|eliminar|detecci[oó]n|remover|detectar|signaler|hapus|deteksi|hatana|research\\w*|study|studying|expose)';

export const RULES: RuleDef[] = [
  // ───────────────────────────── covert influence / troll farms ─────────────────────────────
  {
    id: 'INF_FAKE_ACCOUNTS', category: 'influence', strength: 'strong', weight: 5, floor: 'medium',
    title: 'Asks you to run fake, "dummy" or borrowed accounts',
    explain: 'Posting from accounts under other names to look like many real people is how troll farms and covert propaganda work. Platforms ban it, and workers are the ones whose details get exposed.',
    patterns: [
      "(?:dummy|dummies|fake|alter|alt|poser|troll|burner|ghost|pseudonymous|anonymous|sock ?puppet|ready-made|aged|farzi|bodong|samaran|anonim)[- ]?(?:accounts?|accts?|acc|profiles?|ids?|personas?|handles?|akun|account)",
      "(?:work|assigned|provided|supplied|given|company|work-only)[- ](?:profiles?|accounts?|personas?)",
      "(?:accounts?|profiles?|personas?|ids?)(?: and passwords)? (?:will be |are |we )?(?:provided|supplied|given|assigned|handed|we (?:give|provide|send|assign))",
      "use the (?:accounts?|profiles?) (?:we|they|the team) (?:give|provide|send|assign)",
      "(?:accounts?|profiles?) (?:that )?(?:look|appear|seem)s? (?:to be )?(?:real|like (?:real|ordinary|regular|local))",
      "(?:build|create|grow)\\w* (?:personas?|ordinary[- ]citizen accounts|community voices accounts)",
      "persona[- ]building|under (?:assigned )?personas?|local-sounding names|names and photos are provided|photos and names are provided",
      "(?:from|using|with|under) (?:\\d+(?:-\\d+)?|multiple|several|many|different|other) (?:dummy|dummies|accounts|ids|profiles|handles|names)",
      "(?:different|other) names(?: and (?:photos|pictures))?",
      "(?:never|don't|do not|not) (?:use )?your (?:own |real )(?:name|account|profile|identity)",
      // Filipino / Taglish
      "dummy(?: account| acc)?|alter account|iba-?ibang (?:pangalan|account)|account na ibibigay|bibigyan ka (?:namin )?ng (?:mga )?account|huwag gamitin ang personal|bawal gamitin ang totoong pangalan",
      // Spanish / Portuguese
      "perfiles? falsos?|cuentas? (?:falsas|an[oó]nimas|de apoyo)|nombres de ciudadanos comunes|nunca tu nombre real|cuentas que te damos|perfis? falsos?|perfis de apoio|contas? falsas?|nunca use seu nome",
      // French / Swahili / Indonesian / Hindi
      "faux comptes?|sous diff[eé]rents noms|jamais (?:utiliser )?votre vrai nom|plusieurs comptes|akun (?:palsu|samaran|anonim|bodong)|akaunti nyingi|akaunti zetu|majina tofauti|akun yang kami sediakan|jangan pakai nama asli|alag[- ]alag (?:id|ids|accounts?)|\\d+ accounts chalaye\\w*|accounts? chalane|फर्जी (?:अकाउंट|आईडी)",
    ],
    unless: [COUNTER_WORK, `${NEG} (?:\\S+ ){0,4}(?:create|provide|give|use|ask)`, 'we never ask you to create'],
    questions: ['Q_OWN_ACCOUNTS', 'Q_PLATFORM_RULES', 'Q_END_CLIENT'],
    examples: {
      hit: ["You'll be handed 4 ready-made profiles and a daily brief", 'create and manage 10 dummy accounts', 'Pakai akun samaran untuk komentar', 'Manejarás perfiles falsos', 'post from different accounts so it looks natural', 'magco-comment gamit ang 3 account na ibibigay namin'],
      miss: ['Review content and remove fake accounts according to policy', 'Investigate fake account networks', 'We never ask you to create extra accounts', 'Manage the official brand accounts'],
    },
  },
  {
    id: 'INF_FOREIGN_PERSONA', category: 'influence', strength: 'strong', weight: 5, floor: 'high',
    title: 'Asks you to pose as people from another country',
    explain: 'Writing "as Americans" or "as locals" of another country, often behind a VPN, is the hallmark of foreign influence operations, like the troll operation run from Ghana and Nigeria in 2020.',
    patterns: [
      "(?:post|write|comment|pose|appear|writing|posting)\\w* (?:as if you (?:live|lived|were) (?:in )?|as )(?:americans?|us citizens|locals|local residents|citizens of)",
      "as if you live in|appear to be (?:local|locals|local residents)|addressed to americans|accounts that appear to be local",
      "(?:set|use|change) (?:your )?vpn (?:to|location)|vpn locations? we specify|target countr(?:y|ies)",
      "comme si vous [eé]tiez des citoyens",
    ],
    unless: [COUNTER_WORK],
    questions: ['Q_END_CLIENT', 'Q_OWN_ACCOUNTS', 'Q_PLATFORM_RULES'],
    examples: { hit: ["You'll run pages addressed to Americans, writing as if you live in the US", 'comment from accounts that appear to be local residents of the target countries'], miss: ['Customer support for US clients'] },
  },
  {
    id: 'INF_ATTACK', category: 'influence', strength: 'strong', weight: 4,
    title: 'Asks you to attack, report or drown out critics',
    explain: 'Being told to swarm journalists, critics or opponents, or to mass-report their accounts, is harassment work used to silence people. It is not marketing.',
    patterns: [
      "(?:attack|bash|harass|troll|discredit|silence|pressure|flood|swarm|drown out|counter|push back on|reply to|respond to|tag|go after|mass[- ]?report|report)\\w*(?: and \\w+)? (?:\\S+ ){0,4}(?:critics?|journalists?|reporters?|opposition|opponents?|rivals?|activists?|haters?|bashers?|fact[- ]?checkers?|other (?:camp|party|side)|detractors|hostile accounts|critical pages|pages critical)",
      "mass[- ]?report|report (?:hostile|critical) (?:accounts|pages)|in bulk|brigad\\w+",
      "desacreditar|(?:atacar|desmentir) a (?:los )?(?:cr[ií]ticos|periodistas|opositores)|atacar os cr[ií]ticos|attaquer les (?:opposants|journalistes)|washambulie|kuwajibu wapinzani|serang (?:pengkritik|lawan)|lawan narasi|serbu kolom komentar|sagutin ang mga kritiko|sa mga basher|troll karna|(?:opposition|doosri party)\\w* (?:\\S+ ){0,3}(?:reply|jawab)",
    ],
    unless: [COUNTER_WORK, "answer constituents|customer (?:comments|complaints|questions)"],
    questions: ['Q_TARGETS', 'Q_REFUSE', 'Q_END_CLIENT'],
    examples: { hit: ['push back on haters in the comments', 'mass-report the pages on our list', 'serbu kolom komentar media online'], miss: ['Respond to customer comments on our official page', 'Monitor and report on disinformation narratives'] },
  },
  {
    id: 'INF_FAKE_NEWS_PAGES', category: 'influence', strength: 'strong', weight: 4,
    title: 'Runs "independent" news or fan pages for a hidden client',
    explain: 'Pages built to look like independent news or ordinary fan pages, while secretly run for a client, are a common way to spread propaganda and false stories.',
    patterns: [
      "(?:news|news-style|meme|fan|community|citizen journalism)[- ]?pages? (?:that )?(?:look|appear)s? (?:independent|like (?:a )?(?:local )?news)",
      "pages? that (?:look|appear)s? (?:like )?(?:a )?(?:local )?(?:news|independent)|look\\w* independent|without showing the connection|as if you (?:found|wrote) it",
      "(?:page|blog) network|network of (?:pages|blogs)|news links from our partner pages",
      "pages d'actualit[eé] ind[eé]pendantes|p[aá]ginas? (?:de noticias )?que parezcan|p[aá]ginas de not[ií]cias que parecem",
    ],
    unless: [COUNTER_WORK],
    questions: ['Q_END_CLIENT', 'Q_DISCLOSURE', 'Q_SAMPLE_TASKS'],
    examples: { hit: ['create a page that looks like a local news outlet', 'share news links from our partner pages'], miss: ['Social media producer for our newsroom'] },
  },
  {
    id: 'INF_SECRECY', category: 'influence', strength: 'medium', weight: 3,
    title: 'Hides who is paying, or that posts are paid',
    explain: 'Legitimate marketing and campaigns disclose who pays. Being told to keep the client secret, never say you are paid, or skip "sponsored" labels means the audience is being deceived.',
    patterns: [
      "(?:client|principal|organi[sz]ation|campaign|end client)(?: identity)? (?:is|are|will be|remains?|stays?) (?:confidential|secret|withheld|undisclosed|anonymous|private)",
      "(?:confidential|secret|undisclosed|anonymous) client|client identity withheld|do not reveal the principal",
      "(?:do not|don't|never|must not|not to) (?:reveal|disclose|mention|tell|say|discuss|post)\\w* (?:\\S+ ){0,5}(?:client|principal|organi[sz]ation|campaign|you(?:'re| are) paid|paid|who you work|this (?:job|work))",
      "(?:without|never|not|sin|sem) (?:label|tag|mark|marcar|disclos)\\w* (?:it |them )?(?:as )?(?:sponsored|paid|an? ad|advertising|publicidad|publicidade)",
      "discretion (?:is a must|required)|strict secrecy|keep (?:this|the group|it|the group chat) (?:private|confidential|secret)|delete (?:the )?(?:messages|chats) after",
      "confidencialidad absoluta|el cliente es confidencial|no digas (?:a nadie )?que te pagan|nada de falar|cliente sigiloso|n[aã]o comente com ningu[eé]m|discr[eé]tion obligatoire|client est confidentiel|ne parlez [aà] personne",
      "siri kabisa|mteja ni siri|usimwambie mtu|(?:jaga|wajib jaga) kerahasiaan|klien rahasia|jangan bilang|bawal (?:ipagsabi|sabihin)|confidential ang client|huwag sabihin na bayad|walang kailangang alamin|(?:bahar )?kisi ko (?:kuch )?(?:mat|nahi) bata\\w*|kisi ko (?:kuch )?bata\\w* (?:nahi|mat)|किसी को मत बताना",
    ],
    questions: ['Q_END_CLIENT', 'Q_DISCLOSURE'],
    examples: { hit: ['The client is confidential.', "Don't say you're paid.", 'Kisi ko batana nahi'], miss: ['All sponsored posts are labeled as paid partnerships'] },
  },
  {
    id: 'INF_SCRIPTED', category: 'influence', strength: 'medium', weight: 2,
    title: 'Gives you scripts, talking points or hashtags to post as your own',
    explain: 'Copy-paste comments, "tweet sheets" and daily hashtag lists are how coordinated campaigns fake grassroots opinion.',
    patterns: [
      "talking points|tweet ?sheets?|content (?:sheet|pack|brief)|engagement brief|daily (?:brief|content pack|missions?)|comment templates?|templates? (?:for|of) comments|copy[- ]?paste",
      "(?:we|our (?:media )?team|the team|coordinator|team leader) (?:will )?(?:send|give|provide|share|drop)s? (?:you )?(?:the |daily )?(?:content|posts|tweets|hashtags|memes|scripts|captions|trending topic)",
      "(?:content|posts|memes|articles|material)(?: and memes)? (?:is |are |will be )?(?:prepared|provided|supplied|sent daily)|post them as your own|hashtag of the day|trending topic and tweets",
      "guiones|te (?:mandamos|enviamos) los|etiquetas oficiales|roteiros?|material vem pronto|messages pr[eé]par[eé]s|(?:messages|articles|hashtags) (?:et hashtags )?sont fournis|tutakutumia hashtag|naskah|template komentar|konten disiapkan|may script|kopyahin|ibibigay (?:namin|ng tl)|content (?:aur memes )?humari team degi|ipapadala namin ang mga sasabihin",
    ],
    questions: ['Q_SAMPLE_TASKS', 'Q_REFUSE'],
    examples: { hit: ['You will receive talking points each morning', 'Konten disiapkan tim pusat'], miss: ['Write original blog posts about our products'] },
  },
  {
    id: 'INF_TRENDING', category: 'influence', strength: 'weak', weight: 1,
    title: 'Pays you to push hashtags or "make it trend"',
    explain: 'Paying many accounts to push a hashtag manufactures the appearance of public opinion.',
    patterns: [
      "(?:make|get|push|bring|keep|boost)\\w* (?:\\S+ ){0,4}(?:hashtags?|topics?|trends?)\\w* (?:\\S+ ){0,3}(?:trend|trending|top)",
      "posiciona\\w* (?:las )?tendencias|hacer tendencia|subir a hashtag|ramaikan tagar|bikin tagar|kusukuma hashtag|paangatin ang hashtag|trend ko top|positionner",
    ],
    questions: ['Q_DISCLOSURE', 'Q_END_CLIENT'],
  },
  {
    id: 'INF_ENGAGEMENT_QUOTA', category: 'influence', strength: 'weak', weight: 1,
    title: 'Pay per comment, share or reaction, with daily quotas',
    explain: 'Piece-rate pay for comments and reactions, with high daily quotas, is how engagement farms and troll farms pay their workers.',
    patterns: [
      "(?:per|each|every|kada|bawat|por|par|kwa kila) (?:comment|post|tweet|share|react\\w*|like|retweet|live|hashtag|komentar|comentario|coment[aá]rio|publication|publicaci[oó]n|v[ií]deo)",
      "(?:daily |minimum |min\\.? )?(?:target|quota|kpi|meta diaria|objectif)\\w*:? (?:of )?\\d+ (?:comments|posts|tweets|shares|interactions|engagements|reacts?|tuits|commentaires|komentar)",
      "\\d+ (?:comments|posts|tweets|shares|interactions|engagements|tuits|testimonials) (?:a|per|each) (?:day|shift|night)",
    ],
    questions: ['Q_SAMPLE_TASKS'],
  },
  {
    id: 'INF_POLITICAL_CONTEXT', category: 'influence', strength: 'context', weight: 2,
    title: 'The work is about elections, government or a public issue',
    explain: 'Political content on its own is fine. Combined with fake accounts, scripts or secrecy, it means covert political propaganda.',
    patterns: [
      "candidates?|candidat[oe]s?|calon|mgombea|kandidato|politicians?|senators?|mayor|governor|congress\\w*|(?:political |ruling )?part(?:y|ies)|partido|partai|chama|administration|government|gobierno|governo|gouvernement|pemerintah|serikali|munisipyo|ministry|minister|president|presidente|prefeito|alcalde",
      "campaign|campa[ñn]a|campanha|campagne|kampanye|elections?|elecciones|elei[cç][oõ]es|[eé]lections?|pemilu|pilkada|uchaguzi|eleksyon|halalan|chunav|by-election|constituency|opposition|oposici[oó]n|voters?|state policy|national movement|public affairs|advocacy|RUU|the bill",
    ],
  },
  // ───────────────────────────── trafficking into scam compounds / forced work ─────────────────────────────
  {
    id: 'TRF_COACHED_LIE', category: 'trafficking', strength: 'strong', weight: 6, floor: 'high',
    title: 'Coaches you to lie to immigration or get past airport checks',
    explain: 'No legitimate employer tells you what to say to immigration officers. Coaching, "escorts" and fake return tickets are how traffickers move people out on tourist visas.',
    patterns: [
      "(?:if|when) (?:the )?(?:immigration|officers?|they) (?:asks?|questions?)",
      "(?:tell|say to|inform) (?:the )?(?:immigration|officer)|immigration (?:believes|thinks)",
      "(?:say|tell (?:them|the officer)) (?:that )?you(?:'re| are)? (?:on |going on |going to (?:a )?|a )?(?:vacation|holiday|tourist|visiting|visit|birthday)",
      "(?:do not|don't|never) (?:mention|say|tell)\\w* (?:\\S+ ){0,4}(?:work|job|working)",
      "(?:do not|don't) inform the (?:bureau|poea|dmw|emigration)",
      "(?:escort|coordinator|contact|guide) (?:\\S+ ){0,6}(?:at|in|through) (?:the )?(?:airport|immigration)|(?:assist|help) you at the airport",
      "(?:won't|will not|not|para hindi ka) (?:be |ma-?)?offload\\w*|avoid (?:being )?offload\\w*|(?:pass|clear|get through) immigration",
      "(?:fake|dummy) return ticket|look like a tourist|delete (?:our|the) (?:chats?|messages) before|keep this between us until you land",
      "sabihin mo (?:sa immigration|bakasyon|pupunta)|(?:wag|huwag) mong sabihin na magtatrabaho|pag sa immigration|sa immigration,? sabihin",
      "di que vas de vacaciones|en migraci[oó]n di|na imigra[cç][aã]o diga|[aà] l'a[eé]roport,? dites|sema (?:unaenda|ni) likizo|usiseme ni kazi|di imigrasi bilang|immigration pe (?:bolna|bol)|airport pe ghoomne",
    ],
    questions: ['Q_IMMIGRATION', 'Q_VISA', 'Q_LICENSE'],
    examples: { hit: ['If immigration asks, say you are on vacation', 'Our coordinator will assist you at the airport', 'Pag sa immigration, sabihin mo pupunta ka sa birthday ng pinsan mo', 'Usiseme ni kazi ukifika uwanja wa ndege'], miss: ['Deployment only after OEC issuance and PDOS'] },
  },
  {
    id: 'TRF_TOURIST_VISA', category: 'trafficking', strength: 'strong', weight: 4, floor: 'medium',
    title: 'A job abroad on a tourist or visit visa',
    explain: 'Working on a tourist or visit visa is illegal almost everywhere, leaves you without protection, and is the most common route into scam compounds in Myanmar, Cambodia and Laos.',
    patterns: [
      "(?:tourist|visit|visitor|tourism) visas?|visa on arrival",
      "(?:go|travel|leave|enter|fly|depart)\\w* (?:first )?as (?:a )?(?:tourist|visitor)|as (?:a )?tourists?(?: first| on paper)?",
      "(?:no|without|don't need|do not need|not need)\\w*(?: an?| for)? (?:work|working|employment) (?:visa|permit)|no (?:labou?r|work) permit (?:needed|required)",
      "(?:work )?(?:visa|permit|papers)(?: will be)? (?:made|processed|arranged|fixed|done|converted|sorted)\\w* (?:there|after arrival|on arrival|once you arrive|when you arrive|later)|(?:convert|fix|change)\\w* (?:your |the )?(?:visa|papers) (?:later|there|after)|fixes the papers",
      "turista (?:ka|lang|muna)|tourist visa lang|visa de turista|como turista|visto de turista|entra como turista|visa touristique|visa ya utalii|visa (?:wisata|kunjungan|turis)|tourist visa pe|टूरिस्ट वीज़ा",
    ],
    unless: [`${NEG} (?:\\S+ ){0,3}(?:travel|go|work|use)\\w* (?:\\S+ ){0,3}(?:tourist|visit)`, 'never on a tourist'],
    questions: ['Q_VISA', 'Q_LICENSE', 'Q_IMMIGRATION'],
    examples: { hit: ["You'll leave as a tourist", 'Travel on a tourist visa first', 'Berangkat pakai visa wisata', 'Viaje como turista'], miss: ['Work visa processed by the employer before departure', 'Never travel for work on a tourist visa'] },
  },
  {
    id: 'TRF_PASSPORT_CONTROL', category: 'trafficking', strength: 'strong', weight: 6, floor: 'high',
    title: 'Someone else will hold your passport or phone, or you cannot leave',
    explain: 'Taking passports or phones and restricting movement are core indicators of forced labour and trafficking under international law.',
    patterns: [
      "(?:company|employer|boss|hr|supervisor|agent|office|they|we) (?:will )?(?:keep|keeps|hold|holds|take|takes|retain|retains|collect|collects|guard|safekeep)\\w* (?:your |the )?passports?",
      "passports? (?:will be |are |is )?(?:kept|held|retained|collected|surrendered|taken|stored)(?: by)?|hand (?:over )?(?:your |the )?passport|passports? for (?:safekeeping|security|visa processing|work permit)|keep the passport",
      "phones? (?:are |is |will be )?(?:collected|kept|taken|confiscated)|(?:cannot|can't|can not|not allowed to|unable to) (?:leave|go out|exit)(?: the (?:compound|building|park|site))?",
      "guarda (?:tu|los|el) pasaportes?|fica com (?:seu|o) passaporte|garde votre passeport|itashika pasipoti|paspor (?:dipegang|disimpan|ditahan)|passport company ke paas|magtatabi ng passport|hindi ka (?:pwedeng|puwedeng) lumabas|bawal ka umalis|sortie non autoris[eé]e|tidak bisa pulang|inside the (?:park|compound)",
    ],
    unless: ['you (?:keep|hold) (?:your )?(?:own )?passport', 'keep your passport at all times', 'conservas tu pasaporte', 'vous gardez votre passeport', 'unabaki na pasipoti'],
    questions: ['Q_PASSPORT', 'Q_LEAVE', 'Q_WORKER_TALK'],
    examples: { hit: ['Your passport will be held by HR for work permit processing', 'Phones are collected at the start of each shift', 'La empresa guarda los pasaportes'], miss: ['You keep your passport at all times', 'Bring your passport for the interview'] },
  },
  {
    id: 'TRF_DEBT', category: 'trafficking', strength: 'strong', weight: 4, floor: 'medium',
    title: 'Debts or penalties tie you to the job',
    explain: 'Being told you owe the recruiter for flights or fees, or must pay a large penalty to quit, is debt bondage: a standard way traffickers stop people leaving.',
    patterns: [
      "(?:penalty|fine|multa|penalidad|p[eé]nalit[eé]|denda|bond) (?:\\S+ ){0,8}(?:if you (?:quit|leave|resign)|leave early|early|before (?:the )?(?:contract|end)|resign|quit)",
      "early (?:exit|termination|leaving) (?:penalty|fee)|penalty \\$?[\\d,]+|(?:owe|debt) (?:\\S+ ){0,4}(?:ticket|flight|company|recruiter)",
      "(?:deduct|repay|pay back|return)\\w* (?:\\S+ ){0,4}(?:ticket|flight|visa|accommodation|agent fee)|deduct\\w* (?:it |them )?from your (?:salary|pay)|repay (?:\\S+ ){0,3}before receiving",
      "si renuncias|multa de \\d|bayar denda|kecuali bayar denda|p[eé]nalit[eé] si|penalty kapag umalis|magbabayad ka ng|utarudisha kutoka mshahara",
    ],
    questions: ['Q_LEAVE', 'Q_FEES'],
    examples: { hit: ['Contract 1 year; early exit penalty $5,000', 'the company will deduct it from your salary'], miss: ['Return airfare is covered at the end of the contract'] },
  },
  {
    id: 'TRF_SCAM_WORK', category: 'trafficking', strength: 'strong', weight: 4,
    title: 'The "job" is persuading strangers online to invest or deposit',
    explain: 'Chatting to foreigners on dating or messaging apps and steering them into crypto or investment platforms is the work done in scam compounds, often by people trafficked there.',
    patterns: [
      "(?:chat|talk|befriend|friendships?|relationships?|trust|message|text)\\w* (?:\\S+ ){0,6}(?:foreign|foreigners?|overseas|clients?|customers?|leads|strangers|people)(?: \\w+){0,8} (?:invest|deposit|crypto|trading|investment)",
      "(?:encourage|convince|persuade|get|guide|move)\\w* (?:\\S+ ){0,4}(?:clients?|customers?|leads|them|people) (?:\\S+ ){0,4}(?:deposit|invest|crypto|trading|investment)",
      "dating apps?|(?:online )?(?:casino|gambling) (?:customer service|operator|company|host)|game operator|crypto (?:platform|exchange)|investment (?:app|platform)|trading app",
      "para que inviertan|para investirem|pour qu'ils investissent|vendre des placements|ili wawekeze|supaya mereka investasi|invest karwana|para mag-?invest|chatting dengan orang luar negeri",
    ],
    questions: ['Q_DUTIES_ABROAD', 'Q_COUNTRY_CITY', 'Q_WORKER_TALK'],
    examples: { hit: ['Build friendships with clients online and encourage deposits on our investment app', 'chat with foreign clients on dating apps'], miss: ['Answer customer questions about deliveries'] },
  },
  {
    id: 'TRF_BORDER_ROUTE', category: 'trafficking', strength: 'strong', weight: 4,
    title: 'Unusual travel route: border crossings by land or boat, or "backdoor" exits',
    explain: 'Real employers fly you directly with proper papers. Being driven across a land border, or leaving through irregular ports, is how people are moved into compounds in Myanmar, Cambodia and Laos.',
    patterns: [
      "cross\\w* (?:the )?border|across the border|(?:by|via) (?:land|road|boat|ferry|backdoor|back door)|road transfer|travel by land|take you across|ferry to|backdoor",
      "exit (?:via|through) (?:zamboanga|tawi-?tawi|bongao|sulu)|mae sot|moc bai|near the border|border area",
      "cruzas la frontera|cerca de la frontera|at[eé] a fronteira|traverser la fronti[eè]re|perbatasan|lumabas sa (?:zamboanga|tawi)",
    ],
    unless: [COUNTER_WORK, 'border control officer|customs and border'],
    questions: ['Q_COUNTRY_CITY', 'Q_IMMIGRATION', 'Q_VISA'],
  },
  {
    id: 'TRF_HIGH_RISK_PLACE', category: 'trafficking', strength: 'medium', weight: 2,
    title: 'Workplace in a known scam-compound area',
    explain: 'Thousands of people have been trafficked into online-scam compounds in Myanmar (Myawaddy, Shwe Kokko, KK Park), Cambodia (Sihanoukville and border towns) and Laos (Golden Triangle). Jobs there need extra checks.',
    patterns: [
      "myanmar|myawaddy|shwe kokko|kk park|karen state|tachileik|cambodia|kamboja|camboya|camboja|cambodge|sihanoukville|phnom penh|bavet|poipet|laos|lao pdr|golden triangle|bokeo|tech park near|sez",
    ],
    questions: ['Q_COUNTRY_CITY', 'Q_LICENSE', 'Q_WORKER_TALK'],
  },
  {
    id: 'TRF_WAR_ECONOMY', category: 'trafficking', strength: 'medium', weight: 3,
    title: 'Job, study or "scholarship" in Russia',
    explain: 'People from Africa, South Asia and Latin America offered helper, guard, driver, hospitality or "work and study" jobs in Russia have ended up in army contracts or drone factories (for example the Alabuga Start programme). Never sign a contract you cannot read.',
    patterns: ['russia|russian (?:army|military|passport|citizenship|contract)|moscow|alabuga|tatarstan|yelabuga|rossiya'],
    questions: ['Q_CONTRACT', 'Q_COUNTRY_CITY', 'Q_LEAVE'],
  },
  {
    id: 'TRF_NO_AGENCY', category: 'trafficking', strength: 'medium', weight: 3,
    title: 'Skips the licensed agency or exit paperwork',
    explain: 'Countries such as the Philippines, India, Indonesia, Nepal, Bangladesh, Sri Lanka and Kenya license overseas recruiters and issue exit clearances. Offers that avoid them avoid the protection they give you.',
    patterns: [
      "(?:no|without|skip|don't need|no need(?: for)?|not through|without going through|tanpa lewat|hindi na kailangan(?: dumaan sa| ng)?|wala nang|sin pasar por)(?: an?| the)? (?:agency|agencies|agen resmi|bp2mi|kp2mi|poea|dmw|oec|labou?r permit|emigration clearance|bureau|official agent|licensed agency|agency agency)",
      "direct hir\\w* (?:\\S+ ){0,3}(?:abroad|overseas|sa laos|sa cambodia|no agency)|no need poea|without (?:a )?contract|no contract needed",
    ],
    questions: ['Q_LICENSE', 'Q_CONTRACT', 'Q_VISA'],
  },
  {
    id: 'TRF_HIDE_FROM_FAMILY', category: 'trafficking', strength: 'strong', weight: 4,
    title: 'Asks you to keep the location or details from your family',
    explain: 'Isolating people from family is a trafficking tactic: nobody knows where to look if something goes wrong.',
    patterns: [
      "(?:don't|do not|wag|huwag|n[aã]o|no|usi)\\w* (?:\\S+ ){0,4}(?:tell|inform|sabihin|comente|digas|mwambie) (?:\\S+ ){0,3}(?:family|families|parents|fam[ií]lia|pamilya|famille|familia)",
      "exact (?:location|address)\\w* (?:\\S+ ){0,4}(?:security|secret)|endere[cç]o exato|kung saan exactly",
    ],
    questions: ['Q_COUNTRY_CITY', 'Q_WORKER_TALK'],
  },
  {
    id: 'TRF_FAST_DEPARTURE', category: 'trafficking', strength: 'weak', weight: 1,
    title: 'Pushes you to fly within days',
    explain: 'Real overseas recruitment takes weeks: contracts, medicals, visas and exit clearances. Rushing you prevents checks.',
    patterns: [
      "(?:fly|depart\\w*|leave|alis|berangkat|sales|partez|safari)(?: \\w+){0,3} (?:within|in|next|ndani ya) (?:\\d+ days?|a week|one week|1 week|next week|days|tomorrow|friday)",
      "departure (?:in|next) \\w+|ready to fly within|alis agad|berangkat minggu depan|sales la pr[oó]xima semana|departure next",
    ],
  },
  {
    id: 'TRF_FREE_TRAVEL', category: 'trafficking', strength: 'weak', weight: 1,
    title: 'Everything paid for, no questions asked',
    explain: 'Free flights and housing are normal in some legitimate overseas jobs, so this alone means little. With a tourist visa or a scam-compound location it is a classic lure.',
    patterns: [
      "free (?:air ?fare|flights?|tickets?|air tickets?|food|accommodation|housing|dorm\\w*|lodging|visa and ticket)|(?:flights?|tickets?|air ?fare|visa)(?: and \\w+)? (?:is |are )?(?:paid|provided|covered)|everything (?:is )?(?:shouldered|paid|arranged)|we arrange everything",
      "pasajes? (?:de avi[oó]n )?pagados?|passagem pag[ae]|billet (?:d'avion )?(?:offert|pay[eé])|tiketi (?:ya ndege )?bure|tiket (?:pesawat )?(?:gratis|ditanggung)|libre (?:ang )?(?:flight|lahat|pagkain)|flight ticket free|sagot ng boss",
    ],
  },
  {
    id: 'TRF_AGENT_FEE', category: 'trafficking', strength: 'medium', weight: 2,
    title: 'Large agent or visa fee for an overseas job',
    explain: 'Big upfront fees to agents push workers into debt, and many countries cap or ban them. Ask for the legal limit and an official receipt.',
    patterns: [
      "(?:agent|agency|placement|visa|ticket) fees?|pay (?:\\S+ ){0,3}(?:to )?the agent|agent ko (?:\\S+ ){0,2}dena|lipa ada ya wakala|ada ya wakala",
    ],
    unless: [`${NEG} (?:\\S+ ){0,2}(?:placement |agency )?fee`],
    questions: ['Q_FEES', 'Q_LICENSE'],
  },
  // ───────────────────────────── job scams ─────────────────────────────
  {
    id: 'SCM_SECRETS', category: 'scam', strength: 'strong', weight: 6, floor: 'high',
    title: 'Asks for codes, PINs, logins, or to use your bank account, e-wallet or SIM',
    explain: 'No real employer needs your OTP, PIN or e-wallet login, or wants to "rent" your account or SIM. This is identity theft, or recruits you as a money mule, which is a crime you can be arrested for.',
    patterns: [
      "(?:send|share|give|provide|tell|need)\\w*(?: us| me)? (?:the |your )?(?:otp|one[- ]time (?:password|pin|code)|verification code|code (?:we|you) (?:send|receive)|code that you receive|mpin|m-?pesa pin|pin|cvv|password|online banking (?:login|password)|login details)",
      "(?:otp|mpin|cvv) (?:\\S+ ){0,3}(?:once|to verify|to confirm)|(?:and|your) (?:the )?(?:otp|mpin|pin)\\b",
      "selfie (?:holding|with) (?:your )?(?:id|document|documento)",
      "(?:rent|lend|borrow|renting|hiramin|ipahiram|kodisha|empreste|pr[eé]stanos|pr[eê]tez|pinjamkan|kiraye pe)\\w* (?:\\S+ ){0,3}(?:accounts?|gcash|maya|m-?pesa|e-?wallet|bank|sim|rekening|conta|cuenta|compte|akaunti|mobile money)",
      "(?:receive|accept)\\w* (?:\\S+ ){0,3}(?:payments?|transfers?|funds?|transferencias)(?: \\w+){0,5} (?:account|cuenta)(?: \\w+){0,6} (?:transfer|forward|send|wire|env[ií]as)",
      "(?:open|buka) (?:a )?(?:bank account|rekening)(?: \\w+){0,5} (?:hand|serahkan|give|over|kami)|buy (?:\\d+ )?sim cards?|(?:register|iparerehistro)\\w* (?:\\S+ ){0,3}sim|sim mo|payment (?:processing )?agent|agente de pagos|deposit (?:it|the cheque|the check)(?:, keep| and keep)",
      "env[ií]a (?:el|o) c[oó]digo|envie (?:uma selfie|o c[oó]digo)|envoyez le code|tuma (?:namba ya siri|pin)|kirim (?:kode )?otp|otp bhejo|i-?send ang otp|account kiraye",
    ],
    questions: ['Q_WHY_OTP', 'Q_EMPLOYER_REG', 'Q_OFFICIAL_CHANNEL'],
    examples: { hit: ['We just need your MPIN and the OTP once', 'Pwede ba namin hiramin ang SIM mo?', 'receive client funds into your account and forward them'], miss: ['Salary is paid to your own bank account every 15th'] },
  },
  {
    id: 'SCM_FEE', category: 'scam', strength: 'strong', weight: 4, floor: 'medium',
    title: 'You have to pay to get or start the job',
    explain: 'Real employers do not charge to apply, interview, train or "activate" you. Fees, deposits and "top-ups" are the business model of job scams.',
    patterns: [
      "(?:registration|security|processing|training|joining|refundable|interview|kit|uniform|verification|onboarding|certification|medical|reservation|activation|application|form|test|starter|membership|software licen[cs]e|dossier) (?:fees?|deposits?|charges?|money)",
      "(?:pay|send|deposit|transfer|settle|buy|purchase|top ?up|recharge)\\w* (?:\\S+ ){0,6}(?:to|so (?:that )?we can) (?:activate|unlock|reserve|secure|start|confirm|process|withdraw|receive|be considered|get placed|retirar)",
      "(?:pay|send|settle|deposit)\\w* (?:\\S+ ){0,6}before (?:the )?(?:interview|training|joining|start|test|selection|screening|you start|the test)",
      "(?:pay|send|tuma)\\w* (?:\\S+ ){0,3}(?:registration|form fee|deposit)(?! fee)|buy the (?:application )?form|security deposit|refundable deposit|(?:top ?up|recharge|deposit)\\w* (?:\\S+ ){0,4}(?:ma-?)?(?:unlock|withdraw|activate|upgrade|premium)",
      "inscripci[oó]n|deposita (?:para|primero)|taxa de (?:cadastro|ativa[cç][aã]o|inscri[cç][aã]o)|frais (?:d'inscription|de dossier)|ada ya (?:usajili|fomu)|ya fomu|biaya pendaftaran|wajib top ?up|isi saldo|magbayad (?:muna |lang )?ng|mag-?deposit|registration fee|fees? jama|रजिस्ट्रेशन (?:फीस|शुल्क)|pehle ₹|for training materials first|pay (?:\\S+ ){0,3}for (?:the |your )?(?:visa processing|medicals|starter kit|software)",
    ],
    unless: [`${NEG} (?:\\S+ ){0,3}(?:fees?|charge|cost|bayad|ada|biaya|frais|taxa|cobramos)`, 'free of charge|walang bayad|hakuna ada|tidak (?:ada|dipungut) biaya|aucun frais|sem nenhuma taxa|nunca cobramos|kabhi koi fees nahi|never charge'],
    questions: ['Q_WHY_FEE', 'Q_FEES', 'Q_EMPLOYER_REG'],
    examples: { hit: ['Kindly settle the medical and training fee', 'Pay KES 1,500 registration and get placed', 'deposit ₱1,500 para ma-unlock ang combo tasks', 'pague a taxa de ativação via Pix'], miss: ['No registration fee. We never charge candidates.', 'Walang bayad ang application at training.'] },
  },
  {
    id: 'SCM_TASKS', category: 'scam', strength: 'strong', weight: 4,
    title: 'Paid to like, follow, rate or "complete tasks" online',
    explain: 'The "task" job (liking videos, rating hotels, boosting orders) pays small amounts at first, then asks you to deposit more and more to "unlock" earnings that never come out.',
    patterns: [
      "(?:like|follow|subscrib|rate|review|watch|liking|following|rating)\\w* (?:\\S+ ){0,3}(?:videos?|accounts?|channels?|products?|hotels?|shops?|youtube|tiktok)(?: \\w+){0,6} (?:earn|paid|commission|per task|bonus|₱|\\$|kes|ngn|₹|rs|r\\$|rp|pesos)",
      "(?:earn|get paid|commission)\\w* (?:\\S+ ){0,4}(?:by|for) (?:liking|following|subscribing|rating|reviewing)|(?:prepaid|merchant|combo|vip|premium) tasks?|order boosting|vip level|per task|tugas (?:vip|premium)|unlock (?:\\S+ ){0,2}tasks?",
      "(?:add|contact) (?:our )?(?:mentor|receptionist|tutor|instructor)|dar like|curtindo v[ií]deos|aimez des vid[eé]os|ku-?like video|like dan follow|beri like|like karo|mag-?like at (?:mag-?)?follow|rate ka lang|sigue cuentas",
    ],
    questions: ['Q_TASK_DEPOSIT', 'Q_EMPLOYER_REG'],
    examples: { hit: ['Earn ₱800 daily by liking TikTok videos', 'Complete prepaid merchant tasks to earn 30% returns'], miss: ['Create TikTok videos for our brand account'] },
  },
  {
    id: 'SCM_FAKE_CHEQUE', category: 'scam', strength: 'strong', weight: 4, floor: 'high',
    title: 'Cheque or equipment trick',
    explain: 'Being asked to buy equipment from a "vendor" for later reimbursement, or to deposit a cheque and send part of it on, is a classic scam: the money you send is real, the cheque bounces.',
    patterns: [
      "buy (?:\\S+ ){0,3}(?:laptop|equipment|kit|software) from (?:our )?(?:approved |preferred )?vendor|(?:send|mail) you a (?:cheque|check)|wire the rest|reimburse\\w* (?:\\S+ ){0,4}(?:first )?pay ?(?:check|cheque)",
    ],
    questions: ['Q_WHY_FEE', 'Q_EMPLOYER_REG'],
  },
  {
    id: 'SCM_GUARANTEE', category: 'scam', strength: 'medium', weight: 2,
    title: 'Guaranteed job or income, no interview',
    explain: 'Real hiring involves selection. "100% hired" and "no interview" are ways to rush you past your own judgement.',
    patterns: [
      "guarantee[ds]? (?:\\S+ ){0,2}(?:job|income|placement|selection|hiring|earnings|returns)|100% (?:guaranteed|hired|job|placement)|no interview|without (?:an? )?interview|sure hired|walang interview|placed within \\d+ hours",
      "sin entrevista|sem entrevista|sans entretien|bila interview|tanpa interview|renda garantida|ingreso garantizado|revenu garanti|mapato ya uhakika",
    ],
    questions: ['Q_INTERVIEW'],
  },
  {
    id: 'SCM_EASY_MONEY', category: 'scam', strength: 'medium', weight: 2,
    title: 'Big daily pay for very little work',
    explain: 'Pay that is far above normal for simple tasks is bait.',
    patterns: [
      "(?:earn|gana|ganhe|gagnez|pata pesa|dapat|kamaye|kumita)\\w* (?:\\S+ ){0,5}(?:daily|a day|per day|al d[ií]a|por dia|par jour|kwa siku|per hari|roz|kada araw|/day)",
      "(?:₱|php|\\$|kes|ngn|₦|ghs|₹|rs\\.?|taka|bdt|ugx|npr|r\\$|rp)\\s?[\\d,.]+(?:\\s?[-–]\\s?(?:₱|\\$)?[\\d,.]+)? (?:daily|a day|per day|/day|kada araw|al d[ií]a|par jour|per hari)",
    ],
    unless: ['per day rate for (?:engineers|consultants)'],
    questions: ['Q_INTERVIEW', 'Q_EMPLOYER_REG'],
  },
  {
    id: 'SCM_CHAT_ONLY', category: 'scam', strength: 'weak', weight: 1,
    title: 'Hiring happens only in WhatsApp, Telegram or private chat',
    explain: 'Moving hiring into private chat apps avoids company records. Common in scams, but some small employers do it too.',
    patterns: [
      "(?:whats\\s?app|telegram|viber|signal|wechat|imo)\\s*(?:us|me|now|at|on|number|no\\.?|:|\\+|\\d)",
      "(?:contact|message|text|ping|reach|call|dm|chat|apply|connect|join|add|escr[ií]benos|chama|contactez|hubungi|message sa|sali sa)\\w* (?:\\S+ ){0,4}(?:on|via|through|over|to|in|por|pelo|sur|lewat|sa)? ?(?:our )?(?:whats\\s?app|telegram|viber|wechat|imo)",
      "wa\\.me|t\\.me/|inbox|in private|al privado|en priv[eé]|\\bdm\\b",
    ],
  },
  {
    id: 'SCM_URGENCY', category: 'scam', strength: 'weak', weight: 1,
    title: 'Pressure to decide right now',
    explain: 'Artificial deadlines stop you checking. A real employer will wait a day for you to verify them.',
    patterns: [
      "limited (?:slots?|seats?|places?)|(?:only|just) \\d+ slots?|today only|valid today|(?:reply|respond) within \\d+|hurry|cupos limitados|vagas limitadas|places limit[eé]es|nafasi chache|kuota terbatas|seats limited|urgent hiring|apply now|solo por hoy",
    ],
  },
  // ───────────────────────────── reassuring signals (reduce, never cancel strong flags) ─────────────────────────────
  {
    id: 'OK_LICENSED', category: 'reassuring', affects: ['trafficking', 'scam'], strength: 'medium', weight: 2,
    title: 'Mentions a government recruitment licence you can verify',
    explain: 'Licensed agencies can be checked on government registries. Verify the number yourself; scammers copy real licence numbers.',
    patterns: [
      "(?:dmw|poea)[- ](?:licen[cs]e|licensed|accredited|approved)|licensed by the department of migrant workers|dmw licen[cs]e no|licen[cs]e no\\.? ?[\\w-]+|e-?migrate[- ]registered|ra licen[cs]e|nea[- ](?:registered|licensed)|bmet[- ]licensed|slbfe[- ]registered|kp2mi|bp2mi|p3mi|department of foreign employment approved|ministry of (?:gender, )?labou?r(?: and social development)? licen[cs]e|verify (?:our|the) (?:licen[cs]e|job order)|licensed (?:agency|company)",
    ],
  },
  {
    id: 'OK_WORK_VISA', category: 'reassuring', affects: ['trafficking'], strength: 'medium', weight: 2,
    title: 'Proper work visa and exit paperwork before travel',
    explain: 'A work visa or permit, contract and exit clearance arranged before you fly is how legitimate overseas jobs work.',
    patterns: [
      "(?:work|employment|working) (?:visa|permit)(?:s)? (?:is |are )?(?:processed|arranged|issued|sponsored|provided)|(?:visa|permit|contract|oec|clearance)\\w* (?:\\S+ ){0,6}before (?:departure|you fly|you travel|travel|you start|leaving)|\\boec\\b|pdos|emigration clearance|labou?r permit issued|non-immigrant b|work permit sponsored|contract (?:attested|verified|signed) before|visa kerja sebelum",
    ],
  },
  {
    id: 'OK_NO_FEE', category: 'reassuring', affects: ['scam', 'trafficking'], strength: 'medium', weight: 2,
    title: 'States clearly that applicants never pay',
    explain: 'Good sign, but scammers say it too. Watch for fees that appear later under another name.',
    patterns: [
      "(?:no|zero) (?:placement |recruitment |application |hidden )?fees?|never (?:charge|ask for|collect)\\w*|free of charge|walang bayad|hakuna ada|tidak (?:ada|dipungut) biaya|aucun frais|sem nenhuma taxa|nunca cobramos|kabhi koi fees nahi|never pay (?:anyone|through)",
    ],
  },
  {
    id: 'OK_OWN_PASSPORT', category: 'reassuring', affects: ['trafficking'], strength: 'medium', weight: 2,
    title: 'You keep your own passport',
    explain: 'Good sign. Make sure it is also written in the contract.',
    patterns: ["you (?:keep|hold) (?:your )?(?:own )?passport|keep your passport at all times|conservas tu pasaporte|vous gardez votre passeport|unabaki na pasipoti"],
  },
  {
    id: 'OK_DISCLOSED', category: 'reassuring', affects: ['influence'], strength: 'medium', weight: 2,
    title: 'Works from official or your own accounts, with paid content disclosed',
    explain: 'Official accounts, "#ad" labels and "paid for by" notices are how legitimate marketing and campaigns work in the open.',
    patterns: [
      "#ad|#sponsored|paid partnership|paid for by|authori[sz]ed by|(?:official|verified)(?:,)? (?:\\S+ ){0,3}(?:accounts?|pages?|handles?)|(?:from|on) your (?:own|personal) account|own single account|never (?:provide|ask you to create)\\w* (?:extra )?accounts|etiqueta como publicidad|identifica[cç][aã]o de publi|identificado como publicidade|toujours signal[eé]|akun resmi|akaunti rasmi|official accounts? handle",
    ],
  },
  {
    id: 'OK_COUNTER_DISINFO', category: 'reassuring', affects: ['influence'], strength: 'medium', weight: 3,
    title: 'The job is fighting fake accounts or misinformation',
    explain: 'Content moderation, fact-checking and trust-and-safety roles deal with fake accounts and disinformation in order to remove them.',
    patterns: [
      `${COUNTER_WORK} (?:\\S+ ){0,6}(?:fake accounts?|fake account networks|disinformation|misinformation|troll networks?|coordinated inauthentic|influence operations|hate speech|viral (?:claims|posts)|cuentas falsas|contas falsas|faux comptes|akun palsu|hoaks)`,
      "fact[- ]?check(?:er|ing|s)?|trust (?:and|&) safety|community guidelines|platform polic(?:y|ies)|ifcn|verificador de datos|periodista verificador|checador de fatos",
    ],
  },
  {
    id: 'OK_FORMAL', category: 'reassuring', affects: ['scam', 'trafficking', 'influence'], strength: 'weak', weight: 1,
    title: 'Formal employment details (benefits, office interview, careers page)',
    explain: 'Statutory benefits and in-person interviews at a real office point to a real employer.',
    patterns: [
      "\\bhmo\\b|13th month|sss|philhealth|pag-?ibig|nhif|nssf|\\bpf\\b|\\besi\\b|bpjs|\\bclt\\b|prestaciones de ley|\\bcdi\\b|night diff\\w*|paid leave|pension|health insurance|(?:interview|walk-?in)\\w* (?:\\S+ ){0,3}(?:at|in) (?:our )?office|visit our office|careers? (?:page|portal|site)|apply (?:through|on|via) (?:our )?(?:website|careers|jobstreet|linkedin)|plantilla",
    ],
  },
];

interface CompiledRule extends RuleDef {
  re: RegExp[];
  unlessRe: RegExp[];
}

const WORD_START = '(?<![\\p{L}\\p{N}_])';
const WORD_END = '(?![\\p{L}\\p{N}_])';

function compile(pattern: string, global: boolean): RegExp {
  return new RegExp(`${WORD_START}(?:${pattern})${WORD_END}`, global ? 'giu' : 'iu');
}

let compiled: CompiledRule[] | null = null;
export function compiledRules(): CompiledRule[] {
  compiled ??= RULES.map((r) => ({
    ...r,
    re: r.patterns.map((p) => compile(p, true)),
    unlessRe: (r.unless ?? []).map((p) => compile(p, false)),
  }));
  return compiled;
}

const WINDOW = 60;

/** Runs every rule over the text. Returns at most one hit per rule (its first un-negated match). */
export function matchRules(raw: string): RuleHit[] {
  const text = normalizeForRules(raw);
  const hits: RuleHit[] = [];
  for (const rule of compiledRules()) {
    let found: string | null = null;
    outer: for (const re of rule.re) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        const start = m.index ?? 0;
        const window = text.slice(Math.max(0, start - WINDOW), start + m[0].length + WINDOW);
        if (rule.unlessRe.some((u) => u.test(window))) continue;
        found = m[0];
        break outer;
      }
    }
    if (found !== null) {
      hits.push({ id: rule.id, category: rule.category, strength: rule.strength, weight: rule.weight,
        title: rule.title, explain: rule.explain, evidence: found.trim().slice(0, 120) });
    }
  }
  return hits;
}

export function ruleById(id: string): RuleDef | undefined {
  return RULES.find((r) => r.id === id);
}
