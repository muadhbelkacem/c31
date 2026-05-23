# Internify Local ML Cleaner

This module adds a local, thesis-defendable machine-learning cleaning and enrichment pipeline for Internify job and internship postings.

It reads raw or pre-cleaned JSON records, normalizes inconsistent scraper fields, removes low-quality records, deduplicates postings, scores internship relevance, extracts skills, classifies the job domain, detects language with a small local heuristic, and exports a frontend-ready `public/intern_data.json` file.

## What runs locally

The default ML method uses `sentence-transformers/all-MiniLM-L6-v2` through SentenceTransformers. This is a lightweight embedding model that can run on CPU. It is used for:

- prototype-based internship classification
- optional semantic skill matching

There are no OpenAI API calls, no paid APIs, and no cloud LLM calls.

For slow machines or offline environments where the model is not downloaded yet, use `--skip-transformer`. That mode keeps the same pipeline but uses the transparent rule score only.

## Files

```text
ml_cleaner/
  __init__.py
  config.py
  schemas.py
  text_cleaning.py
  rule_filter.py
  transformer_classifier.py
  skill_extractor.py
  domain_classifier.py
  deduplicator.py
  pipeline.py
  export_frontend.py
  evaluation.py
  README.md
requirements-ml.txt
scripts/run_ml_cleaner.py
scripts/evaluate_ml_cleaner.py
data/libraries/skills_library.json
```

## Input format

The pipeline accepts a JSON list or an object containing `jobs`, `items`, `data`, or `results`.

It supports inconsistent field names such as:

- title: `title`, `job_title`, `position`
- company: `company`, `employer`, `organization`
- description: `description`, `job_description`, `summary`
- location: `location`, `city`
- link: `link`, `url`, `apply_url`, `platform_link`, `original_apply_link`
- salary: `salary`, `compensation`
- date/age: `date_posted`, `job_age`
- platform: `platform`, `source`

## Output format

The frontend export contains one object per job:

```json
{
  "id": "...",
  "title": "...",
  "company": "...",
  "location": "...",
  "link": "...",
  "salary": "...",
  "description": "...",
  "rating": 4.4,
  "job_age": "30 days ago",
  "platform": "Glassdoor",
  "skills": ["Python", "SQL"],
  "category": "software_engineering",
  "is_real_internship": true,
  "internship_probability": 0.71,
  "cleaning_metadata": {
    "rule_score": 0.85,
    "rule_reasons": ["positive keyword: intern"],
    "internship_label": "real internship",
    "classification_method": "sentence-transformers prototype similarity"
  }
}
```

## Install

```bash
pip install -r requirements-ml.txt
```

The first transformer run downloads the Hugging Face model to the local cache. After that, it can run from the local cache.

## Run

From the Internify project root:

```bash
python scripts/run_ml_cleaner.py --input data/raw/jobs.json --output public/intern_data.json
```

For a quick smoke test without loading transformer models:

```bash
python scripts/run_ml_cleaner.py --input public/intern_data.json --output public/intern_data.json --skip-transformer --max-records 25
```

With the requested arguments:

```bash
python scripts/run_ml_cleaner.py --input data/raw/jobs.json --output Internify-main/public/intern_data.json --min-probability 0.55 --device cpu
```

## Evaluation

If you provide `data/evaluation/labels.csv` with columns:

```csv
id,label
abc123,real internship
xyz789,not internship
```

run:

```bash
python scripts/evaluate_ml_cleaner.py --predictions public/intern_data.json --labels data/evaluation/labels.csv
```

If the labels file does not exist, the script creates a template CSV and prints instructions.

## How the internship classifier works

The system does not use a sentiment classifier. It uses local embedding similarity:

1. Create short label descriptions for four labels:
   - real internship
   - full-time experienced job
   - unrelated posting
   - training/course advertisement
2. Encode the job text and label descriptions using `all-MiniLM-L6-v2`.
3. Compare cosine similarity between the job and each label description.
4. Blend the semantic score with a transparent rule score.

The explanation is intentionally simple because it reflects what the code actually does.

## Limitations

- This is not an ESCO taxonomy system.
- It does not implement reciprocal rank fusion, ANN indexing, or an LLM fallback.
- Embedding prototype classification is weaker than a supervised classifier trained on a labeled internship dataset.
- Skill extraction may miss rare tools or infer a broad skill when the text is semantically similar.
- The language detector is a simple local heuristic, not a full language-identification model.

## Honest thesis defense description

A precise way to describe this component:

> Internify uses a local hybrid NLP pipeline. It combines deterministic cleaning and rule-based internship signals with a lightweight SentenceTransformers embedding model. The model compares each posting against manually defined label prototypes and blends that semantic similarity with transparent rule scores. Skills are extracted using a local curated skill library with exact, synonym, and optional embedding similarity matching. The system is fully local, explainable, and suitable for CPU execution, but it is not a replacement for a supervised classifier trained on a large labeled dataset.


## Manual review flag

The frontend export now includes `needs_manual_review` at the top level and in `cleaning_metadata`. Ambiguous records are flagged for human review using deterministic thresholds and rule/semantic disagreement. The system does not use an LLM fallback.

## Production vs developer output

The ML cleaner now writes two JSON files:

- `public/intern_data.json`: production-safe accepted internships only.
- `public/intern_data_dev.json`: all processed records for debugging, evaluation, and thesis inspection.

The public Next.js pages read only `public/intern_data.json` and also apply a defensive internship filter.

## Separated project layout

The ML pipeline now lives under `ml_pipeline/`, while the Next.js website lives under `frontend/`.

Recommended command from the repository root:

```bash
python ml_pipeline/scripts/run_ml_cleaner.py \
  --input ml_pipeline/data/raw/jobs.json \
  --output frontend/public/intern_data.json \
  --dev-output ml_pipeline/data/output/intern_data_dev.json
```

Production output for the website is written to `frontend/public/intern_data.json`.
Developer/debug output is written to `ml_pipeline/data/output/intern_data_dev.json`.
