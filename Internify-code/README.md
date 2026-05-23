# Internify

This repository is separated into two parts:

```text
Internify-main/
  frontend/      Next.js website
  ml_pipeline/   Local Python ML cleaner/enrichment pipeline
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The website reads production-safe internship data from:

```text
frontend/public/intern_data.json
```

The frontend also defensively filters records so user-facing pages only show records where:

```text
is_real_internship === true
internship_probability >= 0.60
```

Internship cards show a maximum of 6 skills. The full internship detail page shows all skills from the JSON record.

## Run the local ML pipeline

Install ML dependencies:

```bash
cd ml_pipeline
pip install -r requirements-ml.txt
```

From the repository root, run a fast local test without transformer loading:

```bash
python ml_pipeline/scripts/run_ml_cleaner.py \
  --input ml_pipeline/data/raw/jobs.json \
  --output frontend/public/intern_data.json \
  --dev-output ml_pipeline/data/output/intern_data_dev.json \
  --skip-transformer \
  --max-records 100
```

Run the full local SentenceTransformer pipeline:

```bash
python ml_pipeline/scripts/run_ml_cleaner.py \
  --input ml_pipeline/data/raw/jobs.json \
  --output frontend/public/intern_data.json \
  --dev-output ml_pipeline/data/output/intern_data_dev.json \
  --device cpu
```

## Output files

Production website data:

```text
frontend/public/intern_data.json
```

Developer/debug data:

```text
ml_pipeline/data/output/intern_data_dev.json
```

The developer file contains all processed records, including rejected roles and manual-review records. The frontend should not use this file for normal browsing.
