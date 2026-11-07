# hack-humanity — job recruitment fraud detection

Flags likely-fraudulent job postings, with extra coverage for Indian/South Asian scam patterns.
This folder holds the models. The rest of the project (website, tipline, extension) is described in the [top-level README](../README.md).

## Setup (Python 3.12)

```bash
cd trial-modeling-news
python3.12 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Only needed for model-embeddings.py (adds PyTorch, ~1 GB):
pip install -r requirements-embeddings.txt
```

Run every command below from `trial-modeling-news/` with the environment active. Python 3.12 or 3.13 both work.

## Files

| File | What it is |
|---|---|
| `model-testing1.py` | **Main model.** TF-IDF + logistic regression, trained on the US/global dataset plus 80% of the Indian data. Writes `job_fraud_results/`. |
| `model-embeddings.py` | Comparison model: TF-IDF vs. sentence embeddings (all-MiniLM-L6-v2) vs. both, with separate thresholds for Indian postings. Writes `job_fraud_results_embed/`. |
| `scam_rules.py` | Hand-written India-specific red flags (upfront fees, WhatsApp/Telegram contact, Aadhaar/PAN/bank requests, guaranteed jobs). Any hit forces an alert. |
| `convert_hf_india.py` | Downloads the Indian dataset from Hugging Face, converts it to `india_synthetic_jobs.csv`, and with `--score` scores the held-out part with the saved model. |
| `fake_job_postings.csv` | EMSCAD: 17,880 real (mostly US/UK, 2012–14) postings, ~5% fraudulent. |
| `india_synthetic_jobs.csv` | 597 **AI-generated** Indian-context postings (373 fake) from `Aioshi/smolified-fakejob`. |
| `job_fraud_results/` | Current main model (`job_fraud_baseline.joblib`), metrics and graphs. |
| `job_fraud_results_embed/` | Embedding comparison results and saved model. |
| `job_fraud_results_baseline/`, `job_fraud_results_v2/` | Older runs, kept for comparison. |

## Datasets

Both CSVs are included in this repo, so no download is needed to run the models.

| File | Source | Notes |
|---|---|---|
| `fake_job_postings.csv` | **EMSCAD** (Employment Scam Aegean Dataset), University of the Aegean. Kaggle copy: [Real / Fake Job Posting Prediction](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction) | 17,880 real postings, 866 fraudulent, mostly US/UK, 2012–14. Paper: Vidros et al., ["Automatic Detection of Online Recruitment Frauds: Characteristics, Methods, and a Public Dataset"](https://www.mdpi.com/1999-5903/9/1/6), *Future Internet* 9(1):6, 2017. |
| `india_synthetic_jobs.csv` | [Aioshi/smolified-fakejob](https://huggingface.co/datasets/Aioshi/smolified-fakejob) on Hugging Face, converted by `convert_hf_india.py` | 597 **AI-generated** Indian-context postings (373 fake). The metadata says Apache-2.0, but the dataset card also calls it the owner's "sovereign asset", so check with the owner before redistributing. |

Check each source's license before using the data outside this project.

## Common commands

```bash
python model-testing1.py                       # retrain main model (~5 min), opens graphs
python model-testing1.py --quick --no-show     # faster, no graph windows
python convert_hf_india.py --score             # score Indian held-out postings with saved model
python model-embeddings.py                     # embedding comparison (~10 min first run)
```

Useful flags for `model-testing1.py`: `--target-precision 0.7` (fewer false alarms, less fraud
caught), `--no-rules`, `--no-extra`, `--no-desc-aug`, `--extra-weight N`.

## Using the saved model

```python
import joblib
bundle = joblib.load('job_fraud_results/job_fraud_baseline.joblib')
score = bundle['pipeline'].predict_proba(['lowercased title + company profile + description ...'])[0, 1]
flag = score >= bundle['threshold']   # also flag if scam_rules.scam_flags(text) is non-empty
```

Text must be cleaned the same way as in training (`clean_text` / `combine_fields` in `model-testing1.py`).

## Current results

| Held-out set | Accuracy | Fraud caught | False alarms |
|---|---|---|---|
| US/global test (3,213 postings, 203 fraud) | 96.7% | 55% | 15 |
| Indian held-out (120 postings, 75 fake) — main model | 90.8% | 99% | 10 |
| Indian held-out — TF-IDF, India-specific threshold (`model-embeddings.py`) | 92.5% | 97% | 7 |
| Indian held-out — TF-IDF + embeddings, India threshold | 94.2% | 95% | 3 |

## Caveats

- The Indian data is AI-generated; real-world accuracy on Indian scams is unknown until tested on
  real labeled postings.
- The Indian held-out set is only 120 postings (±~5 points).
- Scores are uncalibrated and are not fraud probabilities. A posting below the threshold is not
  guaranteed safe.

## Next steps

1. Collect 100–200 real Indian postings with labels (cybercrime.gov.in reports, Reddit, Naukri)
   and evaluate on them.
2. If the TF-IDF + embeddings model also wins on real data, make it the main model.

## Recruitment-risk model (4 classes): the one the apps use

`model-recruitment-risk.py` fine-tunes the main model above into four classes: **legit, scam,
trafficking, influence** (troll-farm / covert propaganda work). It keeps the same cleaning, company-grouped
splits, seeds, description-only augmentation and India weighting, so the US and India numbers stay
comparable, and adds:

- `risk_data/generate_synthetic.py` + `risk_data/global_south_packs.py`: 9,198 synthetic **training** rows
  written from documented recruitment patterns, in English, Filipino/Taglish, Bahasa Indonesia,
  Hindi/Hinglish, Swahili, Spanish, Portuguese and French, including look-alike legitimate jobs
  (content moderators, fact-checkers, licensed overseas recruitment, official political comms).
- `risk_data/challenge_set.py` (120 rows) and `risk_data/challenge_v2.py` (60 rows): hand-written
  **evaluation-only** sets. v2 was written after the model and rules were frozen.
- NFKC normalisation, multinomial logistic regression, per-class thresholds chosen out-of-fold, and a JSON
  export (`../packages/engine/model/risk-model.json`) that the TypeScript engine runs in the browser.
  `../packages/engine/test/fixtures/parity.json` proves the TS and Python scores match.

```bash
.venv/bin/python risk_data/generate_synthetic.py
.venv/bin/python risk_data/challenge_set.py && .venv/bin/python risk_data/challenge_v2.py
.venv/bin/python model-recruitment-risk.py     # ~2 min; writes recruitment_risk_results/ and the JSON export
cd .. && npm run eval                           # scores the shipped system (rules + model) on both challenge sets
```

| Held-out set | Original model | Recruitment-risk model |
|---|---|---|
| US/global test (3,213 / 203 fraud) | 96.7% acc, 111 caught, 15 false alarms | 96.7% acc, 126 caught, 28 false alarms |
| India held-out (120 / 75 fake) | 90.8% acc | 93.3% acc, 75/75 caught |
| Challenge v1, classifier alone (4 classes) | n/a | 77.5% accuracy |
| Challenge v1, full system (rules + model) | n/a | 97.5% category accuracy; 88/90 risky flagged; 1/30 legit flagged |
| Challenge v1, full system after the job-context gate | n/a | 98.3% category accuracy; 88/90 risky flagged; 0/30 legit flagged |
| **Challenge v2, full system (fresh), after the gate** | n/a | **91.7% category accuracy; 40/45 risky flagged; 0/15 legit flagged** |
| **Documented real cases** (24 sourced cases, `risk_data/documented_cases.py`), frozen system | n/a | **18/24 flagged (75%)**; 62.5% right category |
| Documented real cases after 3 general rule fixes (optimistic) | n/a | 20/24 flagged; 70.8% right category |
| Real SMS (Mozambique, Bangladesh), legitimate messages flagged | n/a | 0.0–1.2% after the gate (2–44% before); see `docs/research/datasets.md` |

Caveats: the trafficking and influence classes are trained on synthetic data, and both challenge sets were
written by the project team. Rules were written after challenge v1 was seen, so v2 is the more honest figure.
Before the job-context gate the full system scored 95% on v2 (42/45 flagged); the gate cut real-world false alarms from up to 44% to at most 1.2% but cost two v2 misses. The remaining misses are subtle influence ads ("a phone with 8 logged-in profiles") and a "send your Mobile Money PIN" request. Real labelled examples are
the next step.
