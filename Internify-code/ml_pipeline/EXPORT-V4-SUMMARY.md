# Internify export/filter patch summary

This patch adds a two-file export workflow:

- `public/intern_data.json`: production-safe accepted internships only.
- `public/intern_data_dev.json`: full developer/debug output with rejected and manual-review records.

The frontend and API routes continue to read `public/intern_data.json` and now apply a defensive filter requiring `is_real_internship === true` and `internship_probability >= 0.60`.

Local configurable libraries were added under `ml_cleaner/libraries/` for skills, domains, internship rules, and negative role patterns.

Validation command used:

```bash
python scripts/run_ml_cleaner.py --input data/raw/jobs.json --output public/intern_data.json --dev-output public/intern_data_dev.json --skip-transformer --max-records 100
```

Validation result on the 100-record smoke test:

- Raw input: 100
- Invalid removed: 33
- Duplicates removed: 4
- Developer records: 63
- Production internships: 49
- Rejected/non-internships: 14
- Manual review records: 3
- Exact 1.0 probabilities: 0
- Empty skill records: 7

The production file contains no Pharmacist / Staff Pharmacist / Pharmacy Manager / Relief Pharmacist roles in the smoke test.

`npm run build` could not be completed in this sandbox because Next.js dependencies are not installed here (`next: not found`). Run `npm install` first on your machine, then run `npm run build`.
