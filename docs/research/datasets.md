# Datasets

Kept deliberately small: only what the model needs (research scope narrowed on 7 Nov 2026).

## Used for training and evaluation

| Dataset | What it is | Use | Licence / notes |
|---|---|---|---|
| EMSCAD (`trial-modeling-news/fake_job_postings.csv`) | 17,880 real job ads, 866 fraudulent, mostly US/UK, 2012–14 (Univ. of the Aegean; Kaggle copy "Real / Fake Job Posting Prediction") | `legit` and `scam` classes; US/global test split | Research use; check before redistributing |
| Aioshi/smolified-fakejob (`india_synthetic_jobs.csv`) | 597 AI-generated Indian job ads (Hugging Face) | `legit` / `scam`; India held-out split | Metadata says Apache-2.0; the card also calls it the owner's asset, so check before redistributing |
| Global South synthetic set (`risk_data/synthetic_train.csv`) | 9,198 examples in 8 languages, written from the documented patterns in `facts.md` and the regional notes | `trafficking` and `influence` classes plus look-alike legitimate jobs; training only | Ours |
| Challenge sets v1 and v2 (`risk_data/challenge_set.csv`, `challenge_v2.csv`) | 120 + 60 hand-written examples | Evaluation only (v2 never tuned on) | Ours |

No public labelled dataset of troll-farm or scam-compound job ads exists. Searches for the trafficking and
influence classes found reports and takedown notices, not datasets.

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
