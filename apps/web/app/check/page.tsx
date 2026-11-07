import type { Metadata } from 'next';
import Link from 'next/link';
import { RiskChat } from '@/components/RiskChat';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Risk check', description: 'A short chat about a job offer or your current job, with clear next steps.' };

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="About 3 minutes · nothing is stored" title="Am I at risk?">
        Answer a few questions about the job and where you are. You&apos;ll see what looks worrying, what would make it safer,
        and exactly what to ask the recruiter. You decide what to do.
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <RiskChat />
        <aside className="space-y-4 text-sm">
          <div className="rounded-xl border border-high/30 bg-high-soft p-4">
            <p className="font-semibold text-high">In danger right now?</p>
            <p className="mt-1">If your passport has been taken or you can&apos;t leave, go to <Link href="/help" className="link">Get help</Link> for
              hotlines and embassy advice. Only use your phone when it is safe.</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="font-semibold">Have the actual message?</p>
            <p className="mt-1 text-muted">Paste it into the <Link href="/scan" className="link">scanner</Link> to see which phrases are red flags.</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <p className="font-semibold">Privacy</p>
            <p className="mt-1 text-muted">Your answers stay in this browser tab and are gone when you close it. Questions you type are answered and not saved.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
