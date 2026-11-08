import type { Metadata } from 'next';
import Link from 'next/link';
import { ScanSearch, ShieldAlert } from 'lucide-react';
import { RiskChat } from '@/components/RiskChat';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Risk check', description: 'A short chat about a job offer or your current job, with clear next steps.' };

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
      <PageHeader label="About 3 minutes · nothing is stored" title="Am I at risk?">
        Answer a few questions about the job and where you are. You&apos;ll see what looks worrying, what would make it safer,
        and exactly what to ask the recruiter. You decide what to do.
      </PageHeader>
      <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <RiskChat />
        <aside className="divide-y divide-line border-y border-line text-[15px]">
          <div className="flex gap-3 py-5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-high" strokeWidth={1.75} />
            <div>
              <p className="font-medium">In danger right now?</p>
              <p className="mt-1 text-muted">If your passport has been taken or you can&apos;t leave, go to <Link href="/help" className="link">Get help</Link> for
                hotlines and embassy advice. Only use your phone when it is safe.</p>
            </div>
          </div>
          <div className="flex gap-3 py-5">
            <ScanSearch className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
            <div>
              <p className="font-medium">Have the actual message?</p>
              <p className="mt-1 text-muted">Paste it into the <Link href="/scan" className="link">scanner</Link> to see which phrases are red flags.</p>
            </div>
          </div>
          <p className="py-5 text-muted">Your answers stay in this browser tab and are gone when you close it. Questions you type are answered and not saved.</p>
        </aside>
      </div>
    </div>
  );
}
