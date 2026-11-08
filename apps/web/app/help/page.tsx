import type { Metadata } from 'next';
import { COUNTRIES, GLOBAL_HELP } from '@hireaware/engine';
import { Card, ContactList, PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Get help', description: 'Hotlines, recruiter checks, evidence to keep, and what to do if you are already inside.' };

const REGION_ORDER = ['Southeast Asia', 'South Asia', 'Africa', 'Latin America', 'Middle East & North Africa'] as const;

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12">
      <PageHeader label="Free and confidential" title="Get help">
        If you or someone you know may be trapped, start with safety. Then use the official lines below. Real embassies,
        agencies and NGOs never charge to help you.
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-high/40 bg-high-soft">
          <h2 className="font-semibold text-lg text-high">If you are already inside and can&apos;t leave</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5 text-[15px]">
            <li>Your safety comes first. Only use your phone when it is safe; clear chats if you are watched.</li>
            <li>Quietly contact your embassy, your migrant-worker agency or the anti-trafficking line below.</li>
            <li>If you can, save the location, names and photos of documents.</li>
            <li>Beware of &quot;rescuers&quot; who ask for money. Some victims paid thousands to fake helpers.</li>
            <li>Under UN guidance, people forced to scam are victims and should not be punished for it.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-lg">If your job turned out to be a troll operation</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5 text-[15px]">
            <li>Don&apos;t confront the employer or go public while you&apos;re still exposed.</li>
            <li>Quietly keep briefs, scripts, account lists, payment slips and the client&apos;s name.</li>
            <li>Stop running accounts under other names: those are what platforms remove, and your number may be linked to them.</li>
            <li>Report to the platform (Meta, TikTok and X ban coordinated inauthentic behaviour), and in elections to the election authority.</li>
            <li>A fact-checking organisation or journalist can help expose it safely.</li>
          </ul>
        </Card>
        <Card className="sm:col-span-2">
          <h2 className="font-semibold text-lg">Evidence worth keeping</h2>
          <p className="mt-1 text-[15px]">Screenshots of the ad with its link and date · the recruiter&apos;s profile links and numbers · full chat exports ·
            the contract · tickets and itinerary · every receipt and e-wallet record · scripts, briefs or account lists. Store
            copies where the recruiter can&apos;t reach them, such as an email to yourself or a trusted person.</p>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mt-12 mb-4">Hotlines and recruiter checks</h2>
      <p className="text-sm text-muted mb-6">Numbers marked verified were seen on an official government site in November 2026. Always double-check before relying on a number.</p>
      <div className="space-y-8">
        {REGION_ORDER.filter((region) => COUNTRIES.some((c) => c.region === region)).map((region) => (
          <section key={region}>
            <h3 className="font-semibold text-lg mb-3">{region}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {COUNTRIES.filter((c) => c.region === region).map((c) => (
                <Card key={c.code}>
                  <h4 id={c.code} className="font-semibold scroll-mt-6">{c.name}</h4>
                  <div className="mt-2"><ContactList contacts={c.help} /></div>
                  {c.verify.length > 0 && (
                    <>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Check a recruiter</p>
                      <div className="mt-1"><ContactList contacts={c.verify} /></div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))}
        <section>
          <h3 className="font-semibold text-lg mb-3">Anywhere</h3>
          <Card><ContactList contacts={GLOBAL_HELP} /></Card>
        </section>
      </div>
    </div>
  );
}
