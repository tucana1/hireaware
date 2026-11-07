import type { Metadata } from 'next';
import { TiplineSimulator } from '@/components/TiplineSimulator';
import { Card, PageHeader } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Tipline & extension', description: 'Forward suspicious recruiter messages on WhatsApp, or check job posts in your browser.' };

export default function TiplinePage() {
  const wa = SITE.tiplineNumber.replace(/[^\d]/g, '');
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="WhatsApp tipline" title="Forward it before you reply">
        Got a job offer on WhatsApp, Telegram or Facebook? Forward or paste it to the tipline. You&apos;ll get the red flags
        and a list of strict questions to put back to the recruiter, because a real employer can answer them.
      </PageHeader>
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] items-start">
        <div className="space-y-4">
          <Card>
            <p className="font-semibold">How it works</p>
            <ol className="mt-2 list-decimal pl-5 space-y-1.5">
              <li>{wa ? <>Save <a className="link" href={`https://wa.me/${wa}`}>{SITE.tiplineNumber}</a> and send <b>HI</b>.</> : <>Message the tipline number (shown here once the team connects WhatsApp).</>}</li>
              <li>Paste or forward the recruiter&apos;s message.</li>
              <li>Read the reply: risk level, why, and the questions to ask.</li>
              <li>Send <b>HELP</b> for hotlines in your country, <b>QUESTIONS</b> for a checklist, <b>PRIVACY</b> for how data is handled.</li>
            </ol>
          </Card>
          <Card>
            <p className="font-semibold">Privacy</p>
            <p className="mt-1 text-muted">Messages are checked and discarded, never stored. Your number is only used to pick hotlines for your country.
              Voice notes and images aren&apos;t read yet: paste the text instead.</p>
          </Card>
          <Card>
            <p className="font-semibold">Languages</p>
            <p className="mt-1 text-muted">Red flags are recognised in English, Filipino/Taglish, Bahasa Indonesia, Hindi/Hinglish, Swahili, Spanish, Portuguese and French. Replies are in English for now.</p>
          </Card>
        </div>
        <TiplineSimulator />
      </div>

      <section id="extension" className="mt-20 scroll-mt-6">
        <PageHeader eyebrow="Browser extension" title="Check job posts while you browse">
          The HireAware extension runs the same red-flag rules and classifier on your own computer. Nothing you read is sent anywhere.
        </PageHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><p className="font-semibold">Scan this page</p><p className="mt-1 text-muted">One click checks the job post you&apos;re reading on LinkedIn, JobStreet, Indeed, Facebook or any site.</p></Card>
          <Card><p className="font-semibold">Check selected text</p><p className="mt-1 text-muted">Highlight a message, right-click, and choose &quot;Check with HireAware&quot;.</p></Card>
          <Card><p className="font-semibold">Paste anything</p><p className="mt-1 text-muted">Open the popup and paste a WhatsApp or Telegram message to check it.</p></Card>
        </div>
        <Card className="mt-4">
          <p className="font-semibold">Install (developer preview)</p>
          <ol className="mt-2 list-decimal pl-5 space-y-1 text-[15px]">
            <li>Build it: <code className="rounded bg-paper px-1.5 py-0.5 text-sm">npm run build:extension</code> (creates <code className="text-sm">apps/extension/.output/chrome-mv3</code>).</li>
            <li>Open <code className="text-sm">chrome://extensions</code> (or <code className="text-sm">edge://extensions</code>) and turn on Developer mode.</li>
            <li>Click <b>Load unpacked</b> and choose the <code className="text-sm">chrome-mv3</code> folder.</li>
          </ol>
        </Card>
      </section>
    </div>
  );
}
