# Raw multi-platform role format support

This project now supports the uploaded multi-platform raw role JSON format directly in `public/intern_data.json` and `data/raw/jobs.json`.

Supported raw fields include:

```json
{
  "job_id": "glassdoor_...",
  "title": "Civil Engineering Technologist",
  "company": "Trace Associates Inc.",
  "location": "Calgary, AB",
  "platform": "ECO Canada",
  "description": "...",
  "salary": "$36.00 - $38.00 / hour",
  "date_posted": "October 10, 2025",
  "platform_link": "https://...",
  "original_apply_link": "https://...",
  "scrape_date": "2025-10-15 23:07:56",
  "scraped_date": "2025-10-15T20:47:46.235867"
}
```

## What changed

- `public/intern_data.json` was replaced with the uploaded 1,425-record raw dataset.
- `data/raw/jobs.json` was also set to the uploaded raw dataset for Python pipeline input.
- Next.js now normalizes both raw records and ML-enriched records using `app/lib/jobMapper.ts`.
- Role IDs now prefer `job_id` / `id` / `source_id`, so detail pages stay stable.
- Apply links prefer `original_apply_link`, then `apply_url`, `link`, `url`, and `platform_link`.
- The Python cleaner now reads `scrape_date` and `scraped_date` as date aliases.
- The UI text was softened from “internships only” to “roles” because the new dataset includes both internships and non-internship jobs.
- Supabase env vars are no longer required just to preview local JSON data; auth/save features remain optional.

## Run frontend

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Run Python cleaner on the new format

Fast local test:

```bash
python scripts/run_ml_cleaner.py --input data/raw/jobs.json --output public/intern_data.json --skip-transformer --max-records 100
```

Full local transformer run:

```bash
python scripts/run_ml_cleaner.py --input data/raw/jobs.json --output public/intern_data.json --device cpu
```

The frontend can display either the raw JSON format or the ML-enriched JSON format.
