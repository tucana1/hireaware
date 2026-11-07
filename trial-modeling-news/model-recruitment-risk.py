#!/usr/bin/env python3
"""Recruitment-risk model: a 4-class fine-tune of the main TF-IDF + logistic-regression model.

Classes
  legit        ordinary job
  scam         job scam: fees, task scams, ID / bank / OTP harvesting, money mules (EMSCAD "fraudulent")
  trafficking  deceptive overseas recruitment into scam compounds / forced work
  influence    covert influence work: troll farms, fake personas, scripted political posting

What is kept from model-testing1.py (so the US/India numbers stay comparable)
  * clean_text / combine_fields, the EMSCAD conflict + duplicate filters, company-hash groups, and the
    GroupShuffleSplit seeds (42 then 43) that produce train / validation / test.
  * The India CSV split (train_test_split 0.2, seed 42, stratified) and its sample weight (5).
  * Description-only copies of EMSCAD training rows; word 1-2 gram TF-IDF (min_df 2, max_df 0.98,
    50,000 features, sublinear tf); class-balanced logistic regression.
  * Model selection by company/recipe-grouped 5-fold CV on training data only. The test sets and the
    challenge set are never used to choose anything.

What is new
  * Global South synthetic training data (risk_data/synthetic_train.csv; 8 languages) for the
    trafficking and influence classes plus look-alike legitimate jobs. Grouped by recipe in CV.
  * NFKC Unicode normalisation of the model input (undoes 𝗳𝗮𝗻𝗰𝘆 letters scammers use to dodge filters).
    Splits and de-duplication still use the original cleaning, so they are identical.
  * Multinomial (softmax) logistic regression and per-class alert thresholds chosen out-of-fold.
  * A JSON export (vocabulary, idf, weights, thresholds) that the TypeScript engine runs in the browser
    extension, the website and the WhatsApp tipline, plus parity fixtures that prove TS == Python.

Run from trial-modeling-news/ (about 5-10 minutes):
  .venv/bin/python risk_data/generate_synthetic.py
  .venv/bin/python risk_data/challenge_set.py
  .venv/bin/python model-recruitment-risk.py
Outputs: recruitment_risk_results/ and ../packages/engine/model/risk-model.json (+ test fixtures).
Scores are uncalibrated: they rank risk, they are not probabilities of harm.
"""
import argparse
import hashlib
import html
import json
import math
import re
import time
import unicodedata
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
CLASSES = ['legit', 'scam', 'trafficking', 'influence']
RISK = ['scam', 'trafficking', 'influence']
TEXT_COLUMNS = ['title', 'company_profile', 'description', 'requirements', 'benefits']
SEED = 42
TOKEN = re.compile(r'(?u)\b\w\w+\b')


def is_blank(value):
    return value is None or (isinstance(value, float) and math.isnan(value))


def clean_text(value):
    """Identical to model-testing1.py."""
    if is_blank(value):
        return ''
    value = html.unescape(str(value))
    value = re.sub(r'<[^>]*>', ' ', value)
    return re.sub(r'\s+', ' ', value).strip().lower()


def prep(text):
    """Model input: NFKC + lowercase on top of clean_text. Mirrored by the TypeScript engine."""
    return unicodedata.normalize('NFKC', text).lower()


def combine_fields(frame):
    import pandas as pd
    parts = []
    for column in TEXT_COLUMNS:
        values = frame[column] if column in frame else pd.Series('', index=frame.index)
        parts.append(values.map(clean_text))
    combined = parts[0]
    for part in parts[1:]:
        combined = combined + ' ' + part
    return combined.str.replace(r'\s+', ' ', regex=True).str.strip()


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


# ───────────────────────── pure-Python inference from the JSON export (mirrors the TS engine) ─────────────────────────
def json_predict(model, raw_text):
    text = prep(clean_text(raw_text))
    vec = model['vectorizer']
    vocab = {t: i for i, t in enumerate(vec['vocabulary'])}
    tokens = TOKEN.findall(text)
    grams = list(tokens) + [' '.join(tokens[i:i + 2]) for i in range(len(tokens) - 1)]
    counts = Counter(g for g in grams if g in vocab)
    if not counts:
        return None
    weights = {vocab[g]: (1 + math.log(c)) * vec['idf'][vocab[g]] for g, c in counts.items()}
    norm = math.sqrt(sum(v * v for v in weights.values())) or 1.0
    logits = []
    for k in range(len(model['classes'])):
        row = model['coef'][k]
        logits.append(model['intercept'][k] + sum(row[i] * v / norm for i, v in weights.items()))
    top = max(logits)
    exps = [math.exp(z - top) for z in logits]
    s = sum(exps)
    return [e / s for e in exps]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--csv', type=Path, default=HERE / 'fake_job_postings.csv')
    parser.add_argument('--india-csv', type=Path, default=HERE / 'india_synthetic_jobs.csv')
    parser.add_argument('--synthetic-csv', type=Path, default=HERE / 'risk_data' / 'synthetic_train.csv')
    parser.add_argument('--challenge-csv', type=Path, default=HERE / 'risk_data' / 'challenge_set.csv')
    parser.add_argument('--output', type=Path, default=HERE / 'recruitment_risk_results')
    parser.add_argument('--export', type=Path, default=REPO / 'packages' / 'engine' / 'model' / 'risk-model.json')
    parser.add_argument('--fixtures', type=Path, default=REPO / 'packages' / 'engine' / 'test' / 'fixtures' / 'parity.json')
    parser.add_argument('--c-grid', type=float, nargs='+', default=[10, 30])
    parser.add_argument('--syn-weights', type=float, nargs='+', default=[1, 3])
    parser.add_argument('--india-weight', type=float, default=5.0)
    parser.add_argument('--high-precision', type=float, default=0.85,
                        help='Out-of-fold precision a class score needs for a "high" alert.')
    parser.add_argument('--medium-precision', type=float, default=0.50,
                        help='Out-of-fold precision a class score needs for a "medium" alert.')
    parser.add_argument('--review-precision', type=float, default=0.60,
                        help='Precision target for the any-risk review threshold (same as model-testing1.py).')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import joblib
    import sklearn
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import (average_precision_score, precision_recall_curve, confusion_matrix,
                                 accuracy_score, precision_score, recall_score, f1_score, ConfusionMatrixDisplay)
    from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold, train_test_split
    from sklearn.pipeline import Pipeline
    from scam_rules import any_flag
    t0 = time.time()
    print('scikit-learn', sklearn.__version__)

    # ───────────── EMSCAD: identical pipeline to model-testing1.py ─────────────
    raw = pd.read_csv(args.csv)
    df = raw.copy()
    df['fraudulent'] = pd.to_numeric(df['fraudulent'], errors='coerce').astype(int)
    df['text'] = combine_fields(df)
    df = df.loc[df['text'].str.len() > 0].copy()
    conflicting = df.groupby('text')['fraudulent'].nunique()
    df = df.loc[~df['text'].isin(conflicting[conflicting > 1].index)].copy()
    df = df.drop_duplicates('text').reset_index(drop=True)
    profiles = df['company_profile'].map(clean_text)
    keys = np.where(profiles.str.len() > 0, 'company:' + profiles, 'ad:' + df['text'])
    df['group'] = [sha(k) for k in keys]
    outer = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=SEED)
    trainval_idx, test_idx = next(outer.split(df, groups=df['group']))
    trainval, test = df.iloc[trainval_idx].copy(), df.iloc[test_idx].copy()
    inner = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=SEED + 1)
    train_idx, val_idx = next(inner.split(trainval, groups=trainval['group']))
    train, val = trainval.iloc[train_idx].copy(), trainval.iloc[val_idx].copy()
    for part in (trainval, train, val, test):
        part['label'] = np.where(part['fraudulent'] == 1, 'scam', 'legit')
    print(f'EMSCAD train {len(train)}, validation {len(val)}, test {len(test)} (fraud {int(test.fraudulent.sum())})')

    # ───────────── India synthetic: identical split to model-testing1.py ─────────────
    extra = pd.read_csv(args.india_csv)
    extra['fraudulent'] = pd.to_numeric(extra['fraudulent'], errors='coerce')
    extra = extra.dropna(subset=['fraudulent']).astype({'fraudulent': int})
    extra['text'] = combine_fields(extra)
    extra = extra.loc[(extra['text'].str.len() > 0) & ~extra['text'].isin(df['text'])]
    extra = extra.drop_duplicates('text').reset_index(drop=True)
    india_train, india_test = train_test_split(extra, test_size=0.20, random_state=SEED, stratify=extra['fraudulent'])
    for part in (india_train, india_test):
        part['label'] = np.where(part['fraudulent'] == 1, 'scam', 'legit')
        part['group'] = ['india:' + sha(t) for t in part['text']]

    # ───────────── Global South synthetic (train only) + hand-written challenge set (eval only) ─────────────
    chal = pd.read_csv(args.challenge_csv)
    chal['raw'] = chal['text']
    chal['text'] = chal['text'].map(clean_text)
    syn = pd.read_csv(args.synthetic_csv)
    syn['text'] = syn['text'].map(clean_text)
    known = set(df['text']) | set(extra['text']) | set(chal['text'])
    syn = syn.loc[(syn['text'].str.len() > 0) & ~syn['text'].isin(known)].drop_duplicates('text').reset_index(drop=True)
    syn['group'] = 'syn:' + syn['family']
    print('Synthetic training rows:', len(syn), dict(Counter(syn['label'])))
    print('Challenge rows:', len(chal), dict(Counter(chal['label'])))

    # ───────────── grouped CV on training data only ─────────────
    def frame(part, source, weight):
        return pd.DataFrame({'text': part['text'].values, 'label': part['label'].values,
                             'group': part['group'].values, 'source': source, 'weight': weight})

    cv_df = pd.concat([frame(trainval, 'emscad', 1.0), frame(india_train, 'india', args.india_weight),
                       frame(syn, 'synthetic', 1.0)], ignore_index=True)
    cv_text = cv_df['text'].map(prep).values
    cv_y = cv_df['label'].map(CLASSES.index).values
    is_syn = (cv_df['source'] == 'synthetic').values

    def vectorizer():
        return TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_df=0.98, max_features=50000,
                               sublinear_tf=True, dtype=np.float64)

    def classifier(c_value):
        return LogisticRegression(C=c_value, class_weight='balanced', max_iter=4000, random_state=SEED)

    grid = [(c, w) for c in args.c_grid for w in args.syn_weights]
    oof = {key: np.zeros((len(cv_df), len(CLASSES))) for key in grid}
    folds = list(StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED).split(cv_text, cv_y, cv_df['group']))
    for fold, (tr, te) in enumerate(folds, 1):
        vec = vectorizer().fit(cv_text[tr])
        x_tr, x_te = vec.transform(cv_text[tr]), vec.transform(cv_text[te])
        for c_value, syn_w in grid:
            w = cv_df['weight'].values[tr] * np.where(is_syn[tr], syn_w, 1.0)
            clf = classifier(c_value).fit(x_tr, cv_y[tr], sample_weight=w)
            oof[(c_value, syn_w)][te] = clf.predict_proba(x_te)
        print(f'CV fold {fold}/5 done ({time.time() - t0:.0f}s)')

    cv_rows = []
    for key, proba in oof.items():
        row = {'C': key[0], 'synthetic_weight': key[1]}
        for k, name in enumerate(CLASSES):
            if name == 'legit':
                continue
            row[f'AP {name}'] = average_precision_score(cv_y == k, proba[:, k])
            row[f'AP {name} (synthetic recipes only)'] = average_precision_score(cv_y[is_syn] == k, proba[is_syn, k])
        row['AP any-risk'] = average_precision_score(cv_y != 0, 1 - proba[:, 0])
        row['macro risk AP'] = float(np.mean([row[f'AP {n}'] for n in RISK]))
        cv_rows.append(row)
    cv_table = pd.DataFrame(cv_rows).sort_values('macro risk AP', ascending=False)
    print(cv_table.round(4).to_string(index=False))
    best_c, best_w = float(cv_table.iloc[0]['C']), float(cv_table.iloc[0]['synthetic_weight'])
    best_oof = oof[(best_c, best_w)]
    print(f'Selected C={best_c:g}, synthetic weight={best_w:g} (highest out-of-fold macro risk AP)')

    # ───────────── thresholds, out-of-fold on training data ─────────────
    def min_threshold(y_true, score, target):
        p, r, t = precision_recall_curve(y_true, score)
        p, r = p[:-1], r[:-1]
        ok = np.flatnonzero(p >= target)
        if len(ok):
            return float(t[ok[0]]), float(p[ok[0]]), float(r[ok[0]]), 'lowest threshold meeting the precision target'
        f1 = 2 * p * r / np.maximum(p + r, 1e-12)
        i = int(np.argmax(f1))
        return float(t[i]), float(p[i]), float(r[i]), 'precision target unmet; best F1'

    thresholds = {}
    for name in RISK:
        k = CLASSES.index(name)
        med = min_threshold(cv_y == k, best_oof[:, k], args.medium_precision)
        high = min_threshold(cv_y == k, best_oof[:, k], args.high_precision)
        thresholds[name] = {'medium': med[0], 'high': max(high[0], med[0]),
                            'oof_medium': {'precision': med[1], 'recall': med[2], 'rule': med[3]},
                            'oof_high': {'precision': high[1], 'recall': high[2], 'rule': high[3]}}
    real = (cv_df['source'] != 'synthetic').values
    review = min_threshold(cv_y[real] != 0, 1 - best_oof[real, 0], args.review_precision)
    thresholds['any_risk_review'] = {'value': review[0], 'oof_precision': review[1], 'oof_recall': review[2],
                                     'rule': review[3] + ' (EMSCAD + India rows, like model-testing1.py)'}
    print(json.dumps({k: (v if k == 'any_risk_review' else {'medium': round(v['medium'], 3), 'high': round(v['high'], 3)})
                      for k, v in thresholds.items()}, indent=1))

    # ───────────── final fit (mirrors model-testing1.py: EMSCAD train + description-only copies + India train) ─────────────
    desc_only = combine_fields(train[['description']])
    keep = desc_only.str.len() > 0
    fit_text = pd.concat([train['text'], desc_only[keep], india_train['text'], syn['text']], ignore_index=True).map(prep)
    fit_label = pd.concat([train['label'], train.loc[keep, 'label'], india_train['label'], syn['label']], ignore_index=True)
    fit_weight = np.concatenate([np.ones(len(train)), np.ones(int(keep.sum())),
                                 np.full(len(india_train), args.india_weight), np.full(len(syn), best_w)])
    model = Pipeline([('tfidf', vectorizer()), ('classifier', classifier(best_c))])
    model.fit(fit_text, fit_label.map(CLASSES.index), classifier__sample_weight=fit_weight)
    print(f'Final model: {len(fit_text):,} rows, vocabulary {len(model["tfidf"].vocabulary_):,} ({time.time() - t0:.0f}s)')

    def proba(texts):
        return model.predict_proba(pd.Series(list(texts)).map(prep))

    # ───────────── evaluation (reported, never used for selection) ─────────────
    review_t = thresholds['any_risk_review']['value']

    def binary_report(texts, y_true, with_rules):
        p = proba(texts)
        pred = (1 - p[:, 0]) >= review_t
        if with_rules:
            pred = pred | np.asarray(any_flag(list(texts)), dtype=bool)
        tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
        return {'rows': int(len(y_true)), 'risky_rows': int(np.sum(y_true)), 'accuracy': accuracy_score(y_true, pred),
                'precision': precision_score(y_true, pred, zero_division=0), 'recall': recall_score(y_true, pred, zero_division=0),
                'caught': int(tp), 'missed': int(fn), 'false_alarms': int(fp),
                'average_precision': average_precision_score(y_true, 1 - p[:, 0])}

    evaluation = {'us_test': {}, 'india_heldout': {}}
    for rules in (False, True):
        tag = 'with_scam_rules' if rules else 'model_only'
        evaluation['us_test'][tag] = binary_report(test['text'], test['fraudulent'].values, rules)
        evaluation['india_heldout'][tag] = binary_report(india_test['text'], india_test['fraudulent'].values, rules)

    cp = proba(chal['text'])
    cy = chal['label'].map(CLASSES.index).values
    cpred = cp.argmax(1)
    cm = confusion_matrix(cy, cpred, labels=range(len(CLASSES)))
    per_class = {name: {'precision': precision_score(cy == k, cpred == k, zero_division=0),
                        'recall': recall_score(cy == k, cpred == k, zero_division=0),
                        'f1': f1_score(cy == k, cpred == k, zero_division=0)} for k, name in enumerate(CLASSES)}
    risk_flag = (1 - cp[:, 0]) >= review_t
    evaluation['challenge'] = {
        'rows': int(len(chal)), 'accuracy_4class': accuracy_score(cy, cpred),
        'macro_f1_4class': f1_score(cy, cpred, average='macro'), 'per_class': per_class,
        'confusion_matrix': {'labels': CLASSES, 'rows_true_cols_pred': cm.tolist()},
        'any_risk': {'precision': precision_score(cy != 0, risk_flag, zero_division=0),
                     'recall': recall_score(cy != 0, risk_flag, zero_division=0),
                     'false_alarms_on_legit': int(np.sum(risk_flag & (cy == 0))), 'legit_rows': int(np.sum(cy == 0))},
        'by_language_accuracy': {lang: accuracy_score(cy[m], cpred[m]) for lang in sorted(chal['lang'].unique())
                                 for m in [(chal['lang'] == lang).values]},
    }
    errors = chal.assign(predicted=[CLASSES[i] for i in cpred], score=np.round(cp.max(1), 3))
    errors.loc[errors['predicted'] != errors['label'], ['id', 'label', 'predicted', 'score', 'lang', 'region', 'raw']] \
        .to_csv(args.output / 'challenge_errors.csv', index=False)
    print('\nCHALLENGE SET (hand-written, never trained on):')
    print(f"  4-class accuracy {evaluation['challenge']['accuracy_4class']:.3f}, macro F1 {evaluation['challenge']['macro_f1_4class']:.3f}")
    print('  confusion (rows = true, cols = predicted):', CLASSES)
    for name, row in zip(CLASSES, cm):
        print(f'   {name:12s}', row)
    for k in ('us_test', 'india_heldout'):
        for tag, m in evaluation[k].items():
            print(f"{k:14s} {tag:16s} acc {m['accuracy']:.3f}  caught {m['caught']}/{m['risky_rows']}  false alarms {m['false_alarms']}")

    # ───────────── export for the TypeScript engine ─────────────
    vec, clf = model['tfidf'], model['classifier']
    export = {
        'format': 'hireaware-tfidf-logreg/1',
        'created': time.strftime('%Y-%m-%d'),
        'classes': CLASSES,
        'preprocess': 'clean_text (html.unescape, strip tags, collapse whitespace, lowercase) then NFKC + lowercase',
        'vectorizer': {'analyzer': 'word', 'token_pattern': r'(?u)\b\w\w+\b', 'ngram_range': [1, 2],
                       'sublinear_tf': True, 'norm': 'l2',
                       'vocabulary': [str(t) for t in vec.get_feature_names_out()],
                       'idf': [round(float(v), 5) for v in vec.idf_]},
        'coef': [[round(float(v), 4) for v in row] for row in clf.coef_],
        'intercept': [round(float(v), 5) for v in clf.intercept_],
        'thresholds': {name: {'medium': round(thresholds[name]['medium'], 4), 'high': round(thresholds[name]['high'], 4)}
                       for name in RISK} | {'any_risk_review': round(review_t, 4)},
        'training': {'selected_C': best_c, 'synthetic_weight': best_w, 'india_weight': args.india_weight,
                     'rows': int(len(fit_text)), 'sklearn': sklearn.__version__},
        'evaluation_summary': {
            'us_test_model_only': {k: round(v, 4) if isinstance(v, float) else v for k, v in evaluation['us_test']['model_only'].items()},
            'india_heldout_model_only': {k: round(v, 4) if isinstance(v, float) else v for k, v in evaluation['india_heldout']['model_only'].items()},
            'challenge_accuracy_4class': round(evaluation['challenge']['accuracy_4class'], 4),
            'challenge_macro_f1_4class': round(evaluation['challenge']['macro_f1_4class'], 4)},
        'notes': 'Scores are uncalibrated and rank risk; they are not probabilities of harm. '
                 'Trafficking and influence classes are trained on synthetic data written from documented patterns.',
    }
    args.export.parent.mkdir(parents=True, exist_ok=True)
    args.export.write_text(json.dumps(export, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    size_mb = args.export.stat().st_size / 1e6
    print(f'Exported {args.export} ({size_mb:.2f} MB)')

    # Parity fixtures: sklearn vs the pure-Python JSON reimplementation (the TS engine must match the latter).
    rng = np.random.default_rng(SEED)
    samples = list(chal['raw'].values) + list(test['text'].sample(15, random_state=SEED).values) \
        + list(syn['text'].sample(15, random_state=SEED).values) + [
            'Earn ₱5,000 DAILY!!! 💰💰 Message us on 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 &amp; Telegram',
            '<p>Social&nbsp;Media <b>Manager</b></p> — Makati &lt;hybrid&gt;',
            'फर्जी अकाउंट चलाने होंगे, हर पोस्ट के पैसे मिलेंगे',
            'ＦＵＬＬＷＩＤＴＨ customer service job in Ｃａｍｂｏｄｉａ',
            'Ça va? Atención al cliente en Tailândia, passagem paga!',
            '', '!!!', 'ok']
    fixtures, max_diff = [], 0.0
    for text in samples:
        expected = json_predict(export, text)
        sk = proba([clean_text(text)])[0].tolist() if expected is not None else None
        if expected is not None:
            max_diff = max(max_diff, max(abs(a - b) for a, b in zip(expected, sk)))
        fixtures.append({'text': text, 'json_proba': expected, 'sklearn_proba': sk})
    args.fixtures.parent.mkdir(parents=True, exist_ok=True)
    args.fixtures.write_text(json.dumps({'classes': CLASSES, 'max_abs_diff_json_vs_sklearn': max_diff,
                                         'cases': fixtures}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Parity fixtures: {len(fixtures)} cases, max |JSON - sklearn| = {max_diff:.2e}')

    # ───────────── save, graphs, checks ─────────────
    bundle = {'pipeline': model, 'classes': CLASSES, 'thresholds': thresholds, 'preprocess': 'prep(clean_text(text))',
              'sklearn_version': sklearn.__version__, 'seed': SEED, 'selected_C': best_c, 'synthetic_weight': best_w,
              'scope': 'Recruitment risk: legit / scam / trafficking / influence. Uncalibrated.'}
    joblib.dump(bundle, args.output / 'risk_model.joblib')
    restored = joblib.load(args.output / 'risk_model.joblib')
    (args.output / 'evaluation.json').write_text(json.dumps({
        'cv_results': cv_rows, 'selected': {'C': best_c, 'synthetic_weight': best_w}, 'thresholds': thresholds,
        'evaluation': evaluation, 'export_mb': size_mb, 'parity_max_abs_diff': max_diff,
        'sklearn_version': sklearn.__version__, 'counts': {
            'emscad_train': len(train), 'emscad_test': len(test), 'india_train': len(india_train),
            'india_test': len(india_test), 'synthetic': len(syn), 'challenge': len(chal)}}, indent=2, default=float))
    cv_table.to_csv(args.output / 'cv_results.csv', index=False)

    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    ConfusionMatrixDisplay(cm, display_labels=CLASSES).plot(ax=axes[0], cmap='Blues', colorbar=False)
    axes[0].set_title('Challenge set (hand-written, never trained on)')
    names = vec.get_feature_names_out()
    lines = []
    for k, name in enumerate(CLASSES):
        top = np.argsort(clf.coef_[k])[-8:][::-1]
        lines.append(f'{name.upper()}: ' + ', '.join(names[top]))
    axes[1].axis('off')
    axes[1].text(0, 1, '\n\n'.join(lines), va='top', wrap=True, fontsize=9)
    axes[1].set_title('Top terms per class')
    fig.tight_layout()
    fig.savefig(args.output / 'challenge_evaluation.png', dpi=160)
    plt.close(fig)

    checks = {
        'No shared employer groups across EMSCAD splits': set(train.group).isdisjoint(test.group)
            and set(val.group).isdisjoint(test.group) and set(train.group).isdisjoint(val.group),
        'No challenge-set text in any training data': set(chal['text'].map(prep)).isdisjoint(set(fit_text))
            and set(chal['text'].map(prep)).isdisjoint(set(cv_text)),
        'Every class present in training': set(fit_label) == set(CLASSES),
        'Probabilities finite and sum to 1': bool(np.isfinite(cp).all() and np.allclose(cp.sum(1), 1)),
        'JSON export matches sklearn (max diff < 2e-3)': max_diff < 2e-3,
        'Save/reload preserves scores': bool(np.allclose(restored['pipeline'].predict_proba(pd.Series(chal['text']).map(prep)), cp)),
    }
    print('\nAUTOMATED CHECKS')
    for name, ok in checks.items():
        print(('PASS' if ok else 'FAIL') + ': ' + name)
    (args.output / 'checks.json').write_text(json.dumps(checks, indent=2))
    assert all(checks.values()), 'A check failed.'
    print(f'Done in {time.time() - t0:.0f}s. Results in {args.output}')


if __name__ == '__main__':
    main()
