import Link from 'next/link';
import { ArrowRight, ArrowUpRight, MessagesSquare, PlaneTakeoff, Puzzle, ShieldAlert, VenetianMask, Wallet } from 'lucide-react';
import { Scanner } from '@/components/Scanner';
import { SectionHeading } from '@/components/ui';

/** What each kind of job looks like in real recruitment messages (wording from documented cases). */
const SIGNS = [
  {
    icon: VenetianMask,
    title: 'Troll farm or propaganda work',
    body: 'Usually called a social media, content or "engagement" job. The giveaway is how you are asked to post.',
    phrases: ['"You\'ll get 5 ready-made profiles"', '"Talking points are sent every morning"', '"The client is confidential"'],
  },
  {
    icon: PlaneTakeoff,
    title: 'Trafficking into scam compounds',
    body: 'Usually customer service, data entry or IT work abroad. The giveaway is how you are asked to travel.',
    phrases: ['"Travel on a tourist visa first"', '"If immigration asks, say you are on holiday"', '"The company keeps your passport"'],
  },
  {
    icon: Wallet,
    title: 'Job scams',
    body: 'Easy work for high pay. The giveaway is that money or control flows from you to them.',
    phrases: ['"Pay the registration fee to activate"', '"Top up to unlock VIP tasks"', '"Send us the code we texted you"'],
  },
];

const STATS = [
  { figure: '71,653', text: 'suspicious recruitment accounts and job posts taken down on Facebook and TikTok by the Philippines\' Department of Migrant Workers', source: 'DMW via Gulf News, Jan 2025', url: 'https://gulfnews.com/world/asia/philippines/philippines-70k-fake-job-postings-taken-down-1.500020840' },
  { figure: '300,000+', text: 'people working in online-scam operations across Southeast Asia, from at least 66 countries', source: 'UN Human Rights Office, Feb 2026', url: 'https://news.un.org/en/story/2026/02/1167012' },
  { figure: '81', text: 'countries with organised social-media manipulation; private firms involved in 48', source: 'Oxford Internet Institute, 2021', url: 'https://demtech.oii.ox.ac.uk/research/posts/industrialized-disinformation/' },
  { figure: '₱500–3,000', text: 'a day reportedly paid to commenters in Philippine troll operations', source: 'Freedom House via Philstar, 2017', url: 'https://philstar.com/headlines/2017/11/14/1758866/watchdog-social-media-influencers-paid-back-duterte' },
];

const TOOLS = [
  { href: '/check', icon: ShieldAlert, title: 'Risk check', text: 'Answer a few questions about the job and your situation. About three minutes.' },
  { href: '/tipline', icon: MessagesSquare, title: 'WhatsApp tipline', text: 'Forward a recruiter\'s message and get strict questions to send back.' },
  { href: '/tipline#extension', icon: Puzzle, title: 'Browser extension', text: 'Checks job posts as you browse, entirely on your own device.' },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-12 pb-14 sm:pt-16 grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
          <div className="lg:pt-2">
            <h1 className="text-[2.1rem] sm:text-5xl font-semibold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
              Check a job offer before you say yes.
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-muted [text-wrap:pretty]">
              Some social media, customer service and data entry jobs are really troll farms spreading propaganda, or
              traps that traffic people into scam compounds. Paste the ad or the recruiter&apos;s message to see what to watch for.
            </p>
            <p className="mt-6 text-sm text-muted">
              No message to paste?{' '}
              <Link href="/check" className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-strong">
                Answer a few questions instead <ArrowRight className="size-3.5" />
              </Link>
            </p>
          </div>
          <Scanner layout="stacked" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-20">
        <SectionHeading title="What we look for">
          The job titles sound ordinary. What gives these jobs away is how they ask you to work, travel and pay.
        </SectionHeading>
        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {SIGNS.map((s) => (
            <div key={s.title}>
              <s.icon className="size-5 text-accent" strokeWidth={1.75} />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
              <ul className="mt-4 space-y-2">
                {s.phrases.map((p) => (
                  <li key={p} className="border-l-2 border-high/60 pl-3 text-[14px] text-ink-soft">{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href="/learn" className="mt-10 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong">
          All warning signs and real cases <ArrowRight className="size-3.5" />
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-20">
        <SectionHeading title="The scale of it" />
        <dl className="mt-8 grid gap-x-10 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.figure}>
              <dt className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">{s.figure}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{s.text}</dd>
              <dd className="mt-2">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[13px] text-faint hover:text-accent">
                  {s.source}<ArrowUpRight className="size-3" />
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-20">
        <SectionHeading title="Other ways to check" />
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="group flex items-center gap-4 py-5">
                <t.icon className="size-5 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="flex-1">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-[15px] text-muted">{t.text}</p>
                </div>
                <ArrowRight className="size-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-20">
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em]">Why this matters for misinformation</h2>
          <p className="text-[17px] leading-relaxed text-ink-soft">
            Paid disinformation is an industry, and it runs on workers, many of whom don&apos;t know what they joined. They fake
            public opinion at election time, swarm journalists and critics, and run fake news pages. Scam compounds use the same
            fake accounts and scripts. Helping people recognise these jobs before they start cuts off the supply.
          </p>
        </div>
      </section>
    </>
  );
}
