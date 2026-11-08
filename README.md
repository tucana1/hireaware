# HireAware

**Check the job behind the job offer.** HireAware helps job seekers across the Global South spot offers
that would make them unknowing workers for troll farms and covert propaganda, traffic them into online-scam
compounds, or simply scam them, before they say yes. Cutting off the supply of unwitting workers is a way
to reduce misinformation at its source.

| Tool | What it does | Where |
|---|---|---|
| **Website** | Warning signs, real cases, region-by-region guidance, a help directory for 18 countries | `apps/web` |
| **Risk-check chatbot** | Asks about the person's situation (job type, destination, visa, accounts, money, whether they're already inside) and returns risk levels, reasons, "it would look safer if…", strict questions and local hotlines. Answers typed questions from a local knowledge base, or with Claude when a key is set | `/check` |
| **Message scanner** | Paste a job ad or recruiter message in 8 languages; see red flags, evidence and questions to ask | `/scan`, `POST /api/analyze` |
| **WhatsApp tipline** | Forward a recruiter's message; get the risk, the reasons and strict questions to put back to the recruiter, plus hotlines for the sender's country | `/api/whatsapp` (Twilio), `/api/whatsapp/meta` (Meta Cloud API), simulator at `/tipline` |
| **Browser extension** | "Scan this page", right-click "Check with HireAware", or paste text. The classifier runs locally; nothing is sent anywhere | `apps/extension` |
| **Classifier** | The team's TF-IDF + logistic-regression job-fraud model, fine-tuned into 4 classes (legit, scam, trafficking, influence) and exported to run in TypeScript | `trial-modeling-news/`, `packages/engine` |

Everything works **without API keys**. Keys only switch on extras (Claude answers in the chatbot, real
WhatsApp delivery). See `.env.example`.

## Quick start

Needs Node 22+ (Python 3.12+ only to retrain the model).

```bash
npm install
npm run dev            # website on http://localhost:3000
npm test               # engine + website tests
npm run build          # production builds of the website and the extension
npm run eval           # scores the shipped rules + model on the hand-written challenge sets
npm run eval:external  # false-alarm check on real SMS from Mozambique and Bangladesh (see docs/research/datasets.md)
npm run test:e2e       # Chromium end-to-end: website (incl. WhatsApp + Claude via local stand-ins) and extension
```

The end-to-end tests need Playwright's Chromium once: `npx playwright install chromium`.

Load the extension: `npm run build:extension`, then open `chrome://extensions`, turn on Developer mode,
click **Load unpacked** and choose `apps/extension/.output/chrome-mv3`.

## How it decides

1. **Red-flag rules** (`packages/engine/src/rules.ts`): about 30 explainable rules in English,
   Filipino/Taglish, Bahasa Indonesia, Hindi/Hinglish, Swahili, Spanish, Portuguese and French. They
   target behaviours, never parties or politics:
   - fake or borrowed accounts, scripts and talking points, a hidden client, attacks on critics, foreign personas, fake news pages
   - tourist visas for work, coaching for immigration, passports held, debts, border crossings by land, Russia war-economy lures
   - fees, task scams, OTP/PIN/e-wallet requests, money mules

   Reassuring signals (licences, work visas, "#ad" disclosures, moderator and fact-checker roles) lower
   scores but never cancel a strong red flag.
2. **Classifier** (`packages/engine/src/classifier.ts`): runs the exported model. It adds weight when it
   agrees and can raise "be careful" on its own, but can't lower a rule's floor.
3. **Questions to ask** (`questions.ts`): each red flag maps to strict, verifiable questions. A real
   employer can answer them in writing.

Results on a fresh, hand-written held-out set (60 ads, 8 languages): 91.7% correct category, 40 of 45
risky ads flagged, 0 of 15 legitimate look-alikes flagged. On 6,205 real legitimate SMS messages from
Mozambique and Bangladesh, at most 1.2% get a "be careful" flag. On 24 documented real recruitment
cases it flagged 18 before and 20 after three general rule fixes. The misses are ads that reveal nothing
("thematic posts and monitoring"), which is why the risk-check chatbot asks about the situation instead. Details and
caveats are in [`trial-modeling-news/README.md`](trial-modeling-news/README.md).

## Repository map

```
apps/web/              Next.js 16 website + API routes (analyze, chat, tipline, WhatsApp webhooks)
apps/extension/        WXT (Manifest V3) browser extension; model runs in the service worker
packages/engine/       Shared TypeScript engine: rules, classifier, fusion, questions, chatbot flow,
                       knowledge base, tipline replies, country help directory, region guides
trial-modeling-news/   Python models: the original fraud model + the 4-class recruitment-risk model,
                       synthetic data generators and challenge sets
docs/research/         Sourced fact sheet and Global South regional research (Nov 2026)
PLAN.md                Original build plan (India-first), kept for history; see its status note
```

## Deploying

- **Website:** any Node host. On Vercel, set the root directory to `apps/web`; it builds with no secrets.
- **WhatsApp, demo:** in the Twilio console's WhatsApp sandbox, set "When a message comes in" to
  `https://<domain>/api/whatsapp`, and set `TWILIO_AUTH_TOKEN` (requests are signature-checked).
- **WhatsApp, production:** Meta WhatsApp Cloud API. Callback `https://<domain>/api/whatsapp/meta`;
  set `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
- **Claude answers in the chatbot:** set `ANTHROPIC_API_KEY` (model `claude-sonnet-5-5` by default).

## Privacy and safety

- Nothing typed into the risk check, scanner or tipline is stored or logged.
- The extension never sends page content anywhere.
- Every hotline and link shown was confirmed on an official government site; numbers that couldn't be confirmed were left out (see `docs/research/site-facts-check.md`).
- Guidance only, not legal advice. Forced-scam victims are victims: the site says so, and says to beware of
  paid "rescuers".

## Limits

- The trafficking and influence classes are trained on synthetic examples, because no public dataset of
  troll-farm or scam-compound job ads exists.
- Challenge sets were written by the team. Real labelled examples are the most important next step.
- Replies are in English for now. Detection works in 8 languages.
- Voice notes and screenshots on the tipline are not read yet; the bot asks for pasted text.
