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
  "needs_manual_review": false,
  "cleaning_metadata": {
    "rule_score": 0.85,
    "rule_reasons": ["positive keyword: intern"],
    "internship_label": "real internship",
    "classification_method": "sentence-transformers prototype similarity",
    "semantic_label": "real internship",
    "semantic_margin": 0.12,
    "rule_semantic_disagreement": false,
    "needs_manual_review": false
  }
}
```

`needs_manual_review` is a deterministic ambiguity flag. It becomes true for borderline probabilities, disagreement between rule evidence and semantic evidence, weak semantic margins, or cases where an internship-looking title would otherwise be classified as non-internship. Ambiguous cases are flagged for human review; they are not sent to an LLM fallback.

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
5. Apply deterministic safeguards for obvious internship titles with student/duration evidence.
6. Flag uncertain cases with `needs_manual_review` instead of using an LLM fallback.

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

## Quality Patch v2 Notes

This version keeps the original local, explainable architecture but fixes the most important quality issues found during review:

- Negative seniority words such as `manager`, `lead`, and `director` are no longer searched blindly across the whole description. They only affect the score when they appear in the title or explicit requirement snippets.
- French internship signals now include `stage`, `stagiaire`, `étudiant`, `étudiante`, `alternance`, `maîtrise`, and `baccalauréat`.
- Domain classification uses stronger weighted keyword rules and, when the local sentence-transformer model is loaded, a prototype embedding fallback.
- Skill extraction is more conservative. Exact and synonym matches are trusted first; embedding matches require a high similarity threshold and a margin over the second-best skill.
- The skill library now includes engineering, business, and cybersecurity skills such as FPGA, VHDL, PCB, SAP, Strategy, Accounting, SIEM, TCP/IP, and Wireshark.
- Cross-platform deduplication now uses canonical links, normalized title/company/location, and fuzzy title/description similarity.
- `internship_label`, `internship_probability`, and `is_real_internship` are now generated from one deterministic decision rule, so they do not contradict each other.
- Ambiguous records include `needs_manual_review` at the top level and inside `cleaning_metadata`. This replaces any LLM fallback claim with a local, explainable manual-review mechanism.
- Exact `1.0` probabilities are avoided for model-generated decisions because no manually labeled ground-truth certainty is available at inference time.

This is still not a supervised classifier. It is a local hybrid pipeline: transparent rules plus optional local transformer embeddings.

## Production and developer exports

The pipeline writes two JSON files by default:

- `public/intern_data.json` is the production-safe file used by the public Next.js website. It contains only accepted internships where `is_real_internship` is `true` and `internship_probability >= 0.60`.
- `public/intern_data_dev.json` is the developer/debug file. It contains all processed records, including rejected jobs, manual-review records, rule scores, semantic labels, domain metadata, and extracted skills.

Ambiguous records are flagged with `needs_manual_review`; they are not sent to an LLM. The project remains local-only and uses local rules plus SentenceTransformer embeddings when enabled.

The normal frontend reads `public/intern_data.json` only. API/data loaders also apply a defensive filter so rejected jobs such as permanent pharmacist roles are not shown to users even if the wrong file is copied into production.

### Example command

```bash
python scripts/run_ml_cleaner.py \
  --input data/raw/jobs.json \
  --output public/intern_data.json \
  --dev-output public/intern_data_dev.json \
  --production-min-probability 0.60
```

For a fast local test without loading SentenceTransformers:

```bash
python scripts/run_ml_cleaner.py \
  --input data/raw/jobs.json \
  --output public/intern_data.json \
  --dev-output public/intern_data_dev.json \
  --skip-transformer \
  --max-records 100
```

## Local knowledge libraries

Configurable local JSON libraries live in `ml_cleaner/libraries/`:

- `skills_library.json`
- `domain_keywords.json`
- `internship_rules.json`
- `negative_role_patterns.json`

These libraries make the rules and extraction behavior easier to inspect and defend. They do not use OpenAI, cloud LLMs, paid APIs, ESCO, FAISS, ANN, or RRF.
