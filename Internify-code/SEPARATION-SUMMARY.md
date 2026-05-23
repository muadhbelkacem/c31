# Internify Separation Summary

## Structure

The project is now separated into:

```text
frontend/      Next.js website
ml_pipeline/   Python local ML cleaner/enrichment pipeline
```

## Data flow

Production website data:

```text
frontend/public/intern_data.json
```

Developer/debug output:

```text
ml_pipeline/data/output/intern_data_dev.json
```

## Commands

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Run ML pipeline from repository root:

```bash
python ml_pipeline/scripts/run_ml_cleaner.py \
  --input ml_pipeline/data/raw/jobs.json \
  --output frontend/public/intern_data.json \
  --dev-output ml_pipeline/data/output/intern_data_dev.json
```

Fast test:

```bash
python ml_pipeline/scripts/run_ml_cleaner.py \
  --input ml_pipeline/data/raw/jobs.json \
  --output frontend/public/intern_data.json \
  --dev-output ml_pipeline/data/output/intern_data_dev.json \
  --skip-transformer \
  --max-records 25
```

## Skill display

Internship cards show max 6 skills. Internship detail pages still show all skills.

## Validation performed

Smoke test command:

```bash
python ml_pipeline/scripts/run_ml_cleaner.py --input ml_pipeline/data/raw/jobs.json --output frontend/public/intern_data.json --dev-output ml_pipeline/data/output/intern_data_dev.json --skip-transformer --max-records 25
```

Result:

```text
raw_input_count: 25
removed_invalid: 1
removed_duplicates: 0
total_processed_dev_records: 24
accepted_production_internships: 15
rejected_non_internships: 9
manual_review_records: 0
records_with_exact_1.0_probability: 0
empty_skill_records: 0
```

Production JSON check:

```text
frontend/public/intern_data.json contains only accepted internships.
No Pharmacist roles appeared in production output for the smoke test.
frontend/public/intern_data_dev.json was removed/moved out of frontend public.
```

Next.js build note:

`npm run build` could not run in the sandbox because dependencies were not installed (`next: not found`). Run `npm install` inside `frontend/` first on your machine.
