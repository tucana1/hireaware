#!/usr/bin/env python3
"""Converts the downloaded external datasets into one CSV for `npm run eval:external`.

Datasets (download into risk_data/downloads/, which is gitignored; see docs/research/datasets.md):
  MOZNLP/MOZ-Smishing (Hugging Face): Portuguese SMS from Mozambique; 552 smishing, 2,009 legitimate.
  shariul-islam/bengali-sms-smishing-dataset (Hugging Face, MIT): 7,005 Bengali / English / Banglish /
  code-mixed SMS labelled smish / promo / normal. The card does not say whether messages are real.
These are SMS phishing sets, not job ads: they test false alarms on real everyday messages and whether
OTP / mobile-money scam rules fire. Never train on them.
"""
import csv
from pathlib import Path
import pandas as pd

D = Path(__file__).resolve().parent / 'downloads'
rows = []
moz = pd.read_csv(D / 'moz' / 'test.csv')
for r in moz.itertuples():
    rows.append(('moz', r.id, 'risky' if r.label == 'Smishing' else 'legit', 'pt', r.text))
ben = pd.concat([pd.read_parquet(D / 'bengali' / f'{s}.parquet') for s in ('train', 'validation', 'test')], ignore_index=True)
for i, r in enumerate(ben.itertuples()):
    rows.append(('bengali', f'b{i}', 'risky' if r.label == 'smish' else 'legit', r.source, r.text))
with (D / 'external_eval.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['dataset', 'id', 'label', 'lang', 'text'])
    w.writerows(rows)
print(f'{len(rows)} rows -> {D / "external_eval.csv"}')
