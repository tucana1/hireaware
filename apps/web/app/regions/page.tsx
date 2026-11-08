import type { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRIES, REGION_GUIDES } from '@hireaware/engine';
import { Card, PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'By region', description: 'What job seekers in each part of the Global South should know.' };

export default function RegionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12">
      <PageHeader label="The Global South" title="What's different where you live">
        The lures are similar everywhere, but the routes, money apps, election calendars, recruitment rules and the risk of
        being treated as a suspect afterwards differ. Pick your region.
      </PageHeader>
      <nav aria-label="Regions" className="flex flex-wrap gap-2 mb-8">
        {REGION_GUIDES.map((g) => <a key={g.id} href={`#${g.id}`} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm hover:border-accent">{g.name}</a>)}
      </nav>
      <div className="space-y-6">
        {REGION_GUIDES.map((g) => {
          const countries = COUNTRIES.filter((c) => g.countries.includes(c.code));
          return (
            <section key={g.id} id={g.id} className="scroll-mt-6">
              <Card>
                <h2 className="text-xl font-semibold">{g.name}</h2>
                <ul className="mt-3 list-disc pl-5 space-y-2">{g.points.map((p) => <li key={p}>{p}</li>)}</ul>
                <p className="mt-4 text-sm font-medium">Lures seen in ads</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {g.lures.map((l) => <li key={l} className="rounded-md bg-caution-soft text-caution px-2 py-1 text-sm">{l}</li>)}
                </ul>
                {countries.length > 0 && (
                  <p className="mt-4 text-sm">
                    Hotlines and recruiter checks: {countries.map((c, i) => (
                      <span key={c.code}>{i > 0 && ', '}<Link className="link" href={`/help#${c.code}`}>{c.name}</Link></span>
                    ))}
                  </p>
                )}
              </Card>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted">Compiled from UN, government, platform and investigative sources (November 2026). Full notes with sources are in the project repository under docs/research.</p>
    </div>
  );
}
