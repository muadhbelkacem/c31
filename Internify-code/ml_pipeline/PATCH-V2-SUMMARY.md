# Internify ML Cleaner Quality Patch v2

Patched files:

- `ml_cleaner/config.py`
- `ml_cleaner/rule_filter.py`
- `ml_cleaner/domain_classifier.py`
- `ml_cleaner/skill_extractor.py`
- `ml_cleaner/deduplicator.py`
- `ml_cleaner/transformer_classifier.py`
- `ml_cleaner/pipeline.py`
- `ml_cleaner/README.md`
- `data/libraries/skills_library.json`

## Main improvements

1. Fixed seniority keyword logic. Negative seniority terms are applied only to titles and explicit requirement snippets.
2. Expanded French internship vocabulary.
3. Rebuilt domain classification with weighted keyword rules and optional prototype embedding fallback.
4. Made skill extraction conservative to reduce false positives.
5. Expanded skill library for engineering, business, and cybersecurity.
6. Strengthened cross-platform deduplication.
7. Made final internship decisions consistent: label, probability, and boolean now agree.

## Commands

Install dependencies:

```bash
pip install -r requirements-ml.txt
```

Run full local transformer pipeline:

```bash
python scripts/run_ml_cleaner.py --input data/raw/jobs.json --output public/intern_data.json --device cpu
```

Fast rule-only test:

```bash
python scripts/run_ml_cleaner.py --input public/intern_data.json --output public/intern_data.json --skip-transformer --max-records 50
```
