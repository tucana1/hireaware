# Datasets

Kept deliberately small: only what the model needs (research scope narrowed on 7 Nov 2026).

## Used for training and evaluation

| Dataset | What it is | Use | Licence / notes |
|---|---|---|---|
| EMSCAD (`trial-modeling-news/fake_job_postings.csv`) | 17,880 real job ads, 866 fraudulent, mostly US/UK, 2012–14 (Univ. of the Aegean; Kaggle copy "Real / Fake Job Posting Prediction") | `legit` and `scam` classes; US/global test split | Research use; check before redistributing |
| Aioshi/smolified-fakejob (`india_synthetic_jobs.csv`) | 597 AI-generated Indian job ads (Hugging Face) | `legit` / `scam`; India held-out split | Metadata says Apache-2.0; the card also calls it the owner's asset, so check before redistributing |
| Global South synthetic set (`risk_data/synthetic_train.csv`) | 9,198 examples in 8 languages, written from the documented patterns in `facts.md` and the regional notes | `trafficking` and `influence` classes plus look-alike legitimate jobs; training only | Ours |
| Challenge sets v1 and v2 (`risk_data/challenge_set.csv`, `challenge_v2.csv`) | 120 + 60 hand-written examples | Evaluation only (v2 never tuned on) | Ours |
| Documented cases (`risk_data/documented_cases.csv`) | 24 real, sourced cases (12 trafficking, 12 influence), each restating what recruits were told, with the source link | Evaluation only. Frozen system: 18/24 flagged. After 3 general rule fixes ("N personas", attacks on named offices, Spanish "etiqueta del día"): 20/24. Misses that the ads simply don't reveal (e.g. the troll factory's "thematic posts and monitoring" ad) are why the chatbot asks about the situation | Our wording of public reports |

No public labelled dataset of troll-farm or scam-compound job ads exists. Searches for the trafficking and
influence classes found reports and takedown notices, not datasets.

## Real-world external check (downloaded 8 Nov 2026, never trained on)

| Dataset | Licence | Contents |
|---|---|---|
| [MOZNLP/MOZ-Smishing](https://huggingface.co/datasets/MOZNLP/MOZ-Smishing) | CreativeML OpenRAIL-M | Real Portuguese SMS from Mozambique: 2,009 legitimate (mostly M-Pesa receipts and personal messages), 552 smishing |
| [shariul-islam/bengali-sms-smishing-dataset](https://huggingface.co/datasets/shariul-islam/bengali-sms-smishing-dataset) | MIT | 7,005 SMS in Bengali, English, Banglish and code-mixed text; smish / promo / normal. The card does not say whether messages are real or generated |

Prepare with `trial-modeling-news/.venv/bin/python -I trial-modeling-news/risk_data/prepare_external.py`
(files go to the gitignored `risk_data/downloads/`), then run `npm run eval:external`.

These are SMS phishing sets, not job ads, so they mainly measure **false alarms on real everyday messages**.

- **First run** (rules + classifier as shipped earlier): 1,459 of 6,205 legitimate messages flagged "be careful", including 44% of Mozambican messages. None were flagged "high".
  - 1,455 of those flags came from the classifier on its own; the rules misfired only 4 times (0.06%).
  - Cause: the classifier learned job-scam money vocabulary and was allowed to flag any text.
- **Change:** the classifier can now raise a flag on its own only when the text is about a job or recruitment (`hasJobContext` in `packages/engine/src/analyze.ts`). Rules still apply to all text.
- **After the change**, flagged legitimate messages:

  | Dataset | Flagged |
  |---|---|
  | Mozambique | 0.3% |
  | Bengali | 0.0% |
  | Banglish | 0.3% |
  | Code-mixed | 0.6% |
  | English | 1.2% |

  Smishing flagged: 0–10%. That is expected, since most smishing isn't a job offer.
- **Honesty note:** the change was made after seeing these datasets, so the after-figures are optimistic. On the fresh v2 challenge set it cost two misses (42 → 40 of 45 risky ads flagged), still with no legitimate ads flagged. Both were known gaps: an influence ad that names no job words, and a PIN request worded "send your Mobile Money PIN".

## Recommended next (real-world check for the scam class)

**PH Spam + Marketing SMS dataset (Kaggle).** About 1,475 pre-labelled SMS messages from the Philippines,
including Filipino and code-switched texts. A De La Salle University study combined it with other data
into 2,318 SPAM and 3,910 HAM messages ("Smishing detection…", WCTP 2025, Atlantis Press,
doi:10.2991/978-94-6239-638-8_28). Most messages are general spam and marketing, not job offers, so it
mostly tests the scam rules on real Filipino text and checks for false alarms on ordinary messages.

To use it:
1. Add `KAGGLE_USERNAME` / `KAGGLE_KEY` (see `.env.example`).
2. Download it into `trial-modeling-news/risk_data/downloads/` (gitignored).
3. Check the Kaggle licence.
4. Score it with the engine **without retraining**, the same way `npm run eval` does.

The Kaggle page itself was not opened (sign-in needed), so confirm its exact name and licence.

## Still missing

Real, labelled recruiter messages for the trafficking and influence classes. The best sources are
partnerships (fact-checkers, migrant-worker NGOs, IJM, GASO) and opt-in reports from the tipline and the
extension, collected with consent and redaction.
