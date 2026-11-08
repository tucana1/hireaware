import type { Metadata } from 'next';
import model from '@hireaware/engine/model/risk-model.json';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'How it works', description: 'Methods, data, accuracy and limits of the Parakh checks.' };

type Summary = { accuracy: number; caught: number; risky_rows: number; false_alarms: number; rows: number };

export default function AboutPage() {
  const s = model.evaluation_summary as unknown as { us_test_model_only: Summary; india_heldout_model_only: Summary; challenge_accuracy_4class: number; challenge_macro_f1_4class: number };
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12 prose-simple">
      <PageHeader label="Methods, data and limits" title="How Parakh works" />
      <h2>Two layers</h2>
      <p><b>Red-flag rules</b> look for behaviours that matter (accounts under other names, scripts, a hidden client,
        tourist visas for work, coached answers for immigration, passports held, fees, OTP requests) in eight languages.
        Each rule explains itself and maps to questions to ask. Rules target behaviours, never parties or politics.</p>
      <p>A <b>text classifier</b> (TF-IDF with logistic regression, fine-tuned from the team&apos;s job-fraud model) scores four
        classes: legitimate, job scam, trafficking and covert influence. It runs in the browser extension, on this site and in the tipline.
        It supports the rules but can never cancel a strong red flag.</p>
      <h2>Data</h2>
      <ul>
        <li><b>EMSCAD</b>: 17,880 real job ads, about 5% fraudulent (University of the Aegean).</li>
        <li><b>Indian job ads</b>: 597 AI-generated postings (Hugging Face, Aioshi/smolified-fakejob).</li>
        <li><b>Global South synthetic set</b>: 9,198 training examples written from documented recruitment patterns in eight languages, including look-alike legitimate jobs (content moderators, fact-checkers, licensed overseas recruitment).
          No public dataset of troll-farm or scam-compound job ads exists, so these classes are synthetic.</li>
      </ul>
      <h2>Accuracy</h2>
      <ul>
        <li>US/global held-out ads: {pct(s.us_test_model_only.accuracy)} accuracy; {s.us_test_model_only.caught} of {s.us_test_model_only.risky_rows} frauds caught, {s.us_test_model_only.false_alarms} false alarms in {s.us_test_model_only.rows.toLocaleString()} ads.</li>
        <li>Indian held-out ads: {pct(s.india_heldout_model_only.accuracy)} accuracy.</li>
        <li>Hand-written challenge set (120 ads, 8 languages, never trained on): {pct(s.challenge_accuracy_4class)} four-class accuracy for the classifier alone.</li>
      </ul>
      <p>These numbers come from synthetic or old data. Real-world accuracy on troll-farm and scam-compound ads is unknown until
        it is tested on real, labelled examples. Treat results as guidance, and verify offers through official channels.</p>
      <h2>Privacy</h2>
      <ul>
        <li>The risk check runs in your browser. Answers are not sent or stored.</li>
        <li>Scanned text and tipline messages are analysed and discarded. Nothing is logged.</li>
        <li>The extension never sends page content anywhere.</li>
        <li>With an AI key configured, typed chatbot questions and tipline messages are sent to Anthropic&apos;s Claude to write the answer, and are not stored by us. For the tipline, our own checker still decides the risk level and the help numbers; Claude only writes the explanation and questions, in the sender&apos;s language.</li>
      </ul>
      <h2>Sources</h2>
      <p>Facts on this site come from UN agencies (OHCHR, UNODC, IOM), governments (Philippine DMW and others), platform
        transparency reports (Meta, OpenAI), the Oxford Internet Institute, Mozilla Foundation and investigative reporting,
        checked in November 2026. Sources are linked next to each fact.</p>
    </div>
  );
}
