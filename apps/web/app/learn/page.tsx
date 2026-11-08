import type { Metadata } from 'next';
import Link from 'next/link';
import { QUESTIONS } from '@hireaware/engine';
import { PlaneTakeoff, VenetianMask, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui';

const SIGNS = [
  {
    icon: VenetianMask, title: 'Troll farm or propaganda work',
    aka: 'Often called social media specialist, digital ambassador, engagement associate, online volunteer or page admin.',
    signs: [
      "You'll use accounts under other names, or create them",
      "You get scripts, talking points or hashtags to post as your own views",
      "The client is secret, or you're told not to say posts are paid",
      "You're asked to reply to, report or swarm critics, journalists or rivals",
      'Pay is per comment or share, with daily quotas',
      "You'll post as people from another country, often behind a VPN",
      "You'll run independent-looking news or fan pages for a hidden client",
    ],
  },
  {
    icon: PlaneTakeoff, title: 'Trafficking into scam compounds',
    aka: 'Often called customer service, chat support, data entry, IT or digital sales executive.',
    signs: [
      'Work in, or through Thailand to, Myanmar, Cambodia or Laos',
      'Travel on a tourist or visit visa, with papers "sorted on arrival"',
      'Someone tells you what to say at immigration',
      'High pay for entry-level work, free flights, no experience needed',
      'No licensed agency; recruited by chat app or by a friend abroad',
      'Contract only after you arrive; passport or phone held',
      'Driven across a border by car or boat after landing',
    ],
  },
  {
    icon: Wallet, title: 'Job scams',
    aka: 'Easy work for high pay, where money or control flows from you to them.',
    signs: [
      'Fees to apply, train, "activate" or reserve a slot',
      'Paid to like, follow or rate, then deposits to "unlock" tasks',
      'Requests for one-time codes, PINs or e-wallet logins',
      '"Renting" or opening a bank account, e-wallet or SIM for them',
      'Guaranteed job, no interview, big daily pay',
      'Hiring only in WhatsApp or Telegram, under time pressure',
    ],
  },
];

export const metadata: Metadata = { title: 'Warning signs', description: 'How troll-farm and scam-compound recruitment works, the warning signs, and real cases.' };

const CASES = [
  {
    title: 'Philippines: the "architects" of networked disinformation (2018)',
    text: 'A year of research found political disinformation was designed by advertising and PR strategists, who hired influencers and low-paid fake-account operators working to quota. Many workers were drawn in by financial insecurity and kept ordinary day jobs.',
    source: 'University of Leeds / Ong & Cabañes', url: 'https://www.leeds.ac.uk/news/article/4184/fake_news_production_and_social_media_trolls',
  },
  {
    title: 'Ghana and Nigeria: young workers running American personas (2020)',
    text: 'Meta removed a network run by locals in Ghana and Nigeria on behalf of people in Russia, posting about US race and policing. Workers coordinated on Telegram from phones they had been given. Meta said some took part knowingly and some did not.',
    source: 'Meta, March 2020', url: 'https://about.fb.com/news/2020/03/removing-coordinated-inauthentic-behavior-from-russia/',
  },
  {
    title: 'Kenya: paid hashtag campaigns against judges and journalists (2021)',
    text: 'Influencers were paid about US$10–15 a day through M-Pesa, coordinated in WhatsApp groups, to push hashtags and attack judges, journalists and activists. Some of those targeted began to self-censor.',
    source: 'Mozilla Foundation, 2021', url: 'https://www.mozillafoundation.org/en/blog/fellow-research-inside-the-shadowy-world-of-disinformation-for-hire-in-kenya/',
  },
  {
    title: 'Russia: ordinary-looking job ads for a troll factory (2014–15)',
    text: 'The Internet Research Agency advertised "social media specialist" and "content manager" jobs on mainstream job sites, with bland descriptions like "thematic posts". Staff posted 50–100 propaganda messages a day in shifts.',
    source: 'BuzzFeed News, 2018', url: 'https://www.buzzfeednews.com/article/janelytvynenko/job-ads-for-russian-troll-factory',
  },
  {
    title: 'Philippines: a marketing firm mass-producing partisan comments with AI (2025)',
    text: 'OpenAI reported a Philippine marketing firm using ChatGPT to write thousands of partisan comments during the 2025 midterm season. Most drew almost no real engagement.',
    source: 'OpenAI, June 2025', url: 'https://openai.com/global-affairs/disrupting-malicious-uses-of-ai-june-2025/',
  },
  {
    title: 'Myanmar: thousands released from scam compounds (2025)',
    text: 'After Thailand cut power and internet to border scam towns, about 7,000 foreigners were released in early 2025. Hundreds of Filipinos were repatriated in batches through 2025, including 346 in one flight in November.',
    source: 'UN News, Feb 2026', url: 'https://news.un.org/en/story/2026/02/1167012',
  },
  {
    title: 'Philippines: POGO raids and the ban (2023–2025)',
    text: 'Raids on scam hubs in Clark (2023), Bamban and Porac (2024) involved more than 2,000 workers, many of them foreign. The Philippines banned offshore gaming operators in 2024 and passed the Anti-POGO Act in October 2025.',
    source: 'IJM; Philstar; SunStar', url: 'https://www.ijm.org/our-work/trafficking-slavery/forced-scamming',
  },
];

export default function LearnPage() {
  const byCat = (c: 'influence' | 'trafficking' | 'scam' | 'any') => QUESTIONS.filter((q) => q.category === c);
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 prose-simple">
      <PageHeader label="Know the pattern" title="Warning signs">
        The job titles sound ordinary. What gives these jobs away is how they ask you to work, travel and pay.
      </PageHeader>

      <div className="not-prose divide-y divide-line border-y border-line">
        {SIGNS.map((g) => (
          <section key={g.title} className="grid gap-4 py-8 md:grid-cols-[16rem_1fr] md:gap-10">
            <div>
              <g.icon className="size-5 text-accent" strokeWidth={1.75} />
              <h2 className="mt-3 text-lg font-semibold">{g.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{g.aka}</p>
            </div>
            <ul className="space-y-2.5 text-[15px] leading-relaxed text-ink-soft">
              {g.signs.map((x) => <li key={x} className="flex gap-3"><span className="mt-2.5 h-px w-3 shrink-0 bg-high" />{x}</li>)}
            </ul>
          </section>
        ))}
      </div>

      <h2>How people get drawn in without knowing</h2>
      <p>
        In the Philippines, researchers found political disinformation is designed by PR and advertising strategists and passed
        down to influencers and low-paid account operators working to quota, many from the same pool as call-centre and
        moderation workers. In Ghana and Nigeria, young people thought they worked for a human-rights NGO. In Russia, troll
        factory jobs were advertised as &quot;content manager&quot; roles on mainstream job sites.
      </p>
      <p>
        Scam compounds recruit the same way: ordinary-looking ads on Facebook, Telegram and job sites, interviews by chat,
        flights paid. On arrival, passports and phones are taken and people are forced to scam strangers, often using fake
        personas and scripts. The UN says forced-scam victims should be treated as victims, not criminals.
      </p>

      <h2>Real cases</h2>
      <ol className="not-prose divide-y divide-line border-y border-line">
        {CASES.map((c) => (
          <li key={c.title} className="py-5">
            <p className="font-medium">{c.title}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{c.text}</p>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] text-faint underline decoration-line-strong underline-offset-[3px] hover:text-accent">{c.source}</a>
          </li>
        ))}
      </ol>

      <h2 id="questions">Questions to ask any recruiter</h2>
      <p>Be strict. A genuine employer can answer every one of these in writing. If they dodge, delay or get angry, treat it as a no.</p>
      <h3>Any job</h3>
      <ul>{byCat('any').map((q) => <li key={q.id}>{q.text}</li>)}</ul>
      <h3>Social media, content or &quot;engagement&quot; jobs</h3>
      <ul>{byCat('influence').map((q) => <li key={q.id}>{q.text}</li>)}</ul>
      <h3>Jobs abroad</h3>
      <ul>{byCat('trafficking').map((q) => <li key={q.id}>{q.text}</li>)}</ul>
      <h3>When money or accounts come up</h3>
      <ul>{byCat('scam').map((q) => <li key={q.id}>{q.text}</li>)}</ul>

      <h2>Why it matters</h2>
      <ul>
        <li>Disinformation is a hired service: organised manipulation was found in 81 countries, with private firms involved in 48 (Oxford Internet Institute, 2021).</li>
        <li>It targets elections and the people who hold power to account: judges, journalists and activists.</li>
        <li>Foreign actors buy cheap outsourced labour to exploit other countries&apos; divisions.</li>
        <li>Scam compounds and influence operations share the same tools: fake accounts, scripts and now AI.</li>
      </ul>
      <p>Next: <Link href="/regions">what&apos;s different in your region</Link> · <Link href="/help">get help</Link></p>
    </div>
  );
}
