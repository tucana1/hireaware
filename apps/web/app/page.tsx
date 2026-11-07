import Link from 'next/link';
import { Card } from '@/components/ui';
import { SITE } from '@/lib/site';

const STATS = [
  { figure: '300,000+', text: 'people working in online-scam operations across Southeast Asia, from at least 66 countries', source: 'UN Human Rights Office, Feb 2026', url: 'https://news.un.org/en/story/2026/02/1167012' },
  { figure: '81', text: 'countries with organised social-media manipulation; private firms involved in 48', source: 'Oxford Internet Institute, 2021', url: 'https://demtech.oii.ox.ac.uk/research/posts/industrialized-disinformation/' },
  { figure: '₱500–3,000', text: 'a day reportedly paid to commenters in Philippine troll operations', source: 'Freedom House via Philstar, 2017', url: 'https://philstar.com/headlines/2017/11/14/1758866/watchdog-social-media-influencers-paid-back-duterte' },
];

const TOOLS = [
  { href: '/check', title: 'Risk check', text: 'Answer a few questions about the job and your situation. Get a clear picture and the questions to ask, in about three minutes.', cta: 'Start the check' },
  { href: '/scan', title: 'Scan a message', text: 'Paste a job ad or a recruiter\'s message in any of 8 languages. See the red flags and what they mean.', cta: 'Scan a message' },
  { href: '/tipline', title: 'WhatsApp tipline', text: 'Forward a suspicious message and get strict questions to put back to the recruiter.', cta: 'How the tipline works' },
  { href: '/tipline#extension', title: 'Browser extension', text: 'Checks job posts while you browse, on your own device. Nothing leaves your computer.', cta: 'Get the extension' },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-14 sm:py-20">
        <p className="text-sm font-medium text-accent">For job seekers across the Global South</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl">
          Is this job what it says it is?
        </h1>
        <p className="mt-4 text-xl text-muted max-w-2xl">
          Some &quot;social media&quot;, &quot;customer service&quot; and &quot;data entry&quot; jobs are really troll farms spreading
          propaganda, or traps that traffic people into scam compounds. {SITE.name} helps you check before you say yes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/check" className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:brightness-110">Check my situation</Link>
          <Link href="/scan" className="rounded-lg border border-line bg-card px-5 py-3 font-semibold hover:border-accent">Scan a job message</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <Card key={s.figure}>
            <p className="text-3xl font-semibold text-accent">{s.figure}</p>
            <p className="mt-1">{s.text}</p>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-muted link">{s.source}</a>
          </Card>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Three things these jobs have in common</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="font-semibold">📢 You won&apos;t be yourself</p>
            <p className="mt-1 text-muted">Accounts under other names, scripts to post as your own opinion, a client nobody will name.</p>
          </Card>
          <Card>
            <p className="font-semibold">✈️ Rules get skipped</p>
            <p className="mt-1 text-muted">Tourist visas for work, no licensed agency, someone &quot;helping&quot; you through immigration.</p>
          </Card>
          <Card>
            <p className="font-semibold">💸 You pay, or hand over control</p>
            <p className="mt-1 text-muted">Fees to start, deposits to &quot;unlock&quot; tasks, or your passport, phone, codes and accounts.</p>
          </Card>
        </div>
        <p className="mt-4"><Link href="/learn" className="link">See all the warning signs</Link></p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Tools</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="group rounded-xl border border-line bg-card p-5 hover:border-accent">
              <p className="font-semibold text-lg">{t.title}</p>
              <p className="mt-1 text-muted">{t.text}</p>
              <p className="mt-3 text-accent font-medium group-hover:underline">{t.cta} →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-accent-soft p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Why this matters for misinformation</h2>
        <p className="mt-2 max-w-3xl">
          Paid disinformation is an industry, and it runs on workers, many of whom don&apos;t know what they joined. They fake
          public opinion at election time, swarm journalists and critics, and run fake news pages. Scam compounds use the
          same fake accounts and scripts. Helping people recognise these jobs before they start cuts off the supply.
        </p>
      </section>
    </div>
  );
}
