import type { Metadata } from 'next';
import { Scanner } from '@/components/Scanner';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Scan a message', description: 'Paste a job ad or recruiter message to see its red flags and what to ask.' };

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
      <PageHeader label="Works in English, Filipino, Bahasa, Hindi, Swahili, Spanish, Portuguese and French" title="Scan a job ad or recruiter message">
        We look for the behaviours behind troll-farm work, trafficking into scam compounds and job scams, using red-flag
        rules and a classifier trained on real and synthetic job ads. It&apos;s guidance, not a verdict.
      </PageHeader>
      <Scanner />
    </div>
  );
}
