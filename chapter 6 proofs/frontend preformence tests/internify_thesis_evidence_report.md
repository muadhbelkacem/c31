# Internify Thesis Evidence Report

Created at: 2026-05-25T18:40:57.337480+00:00

## Classification comparison

| System | Scope | Real | Ambiguous | Fake | Accuracy vs human | Precision | Recall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Human opinion / ground truth | 300 | 29 | 2 | 269 | Reference | Reference | Reference |
| ChatGPT 5.5 opinion | 300 | 30 | 3 | 267 | 99.33% | 96.67% | 100% |
| Old uploaded AI transformer | 7 matched only | 3 | 0 | 4 | 57.14% | 100% | 50% |
| New ml_cleaner | 300 | 29 | 2 | 269 | 100% | 100% | 100% |

## Actual frontend production build metrics

| Metric | Value | Unit |
|---|---:|---|
| production_build_exit_code | 0 | 0 means passed |
| total_build_time | 22.7 | seconds |
| compile_time | 6.0 | seconds |
| static_page_generation_time | 4.6 | seconds |
| max_build_memory | 1.819 | GB decimal |
| accepted_frontend_records | 202 | records |
| frontend_json_size | 1.179 | MB decimal |
| frontend_json_gzip_size | 231 | KB approx |

## Actual frontend response speed

| Page/API | Cold load ms | Warm median ms | Warm P95 ms | Samples |
|---|---:|---:|---:|---:|
| Homepage / | 25.16 | 8.98 | 11.04 | 20 |
| Internship API /api/internship | 37.22 | 7.88 | 11.05 | 20 |
| Role page /role/[id] | 129.71 | 9.22 | 14.61 | 20 |
| Single role API /api/internship/[id] | 16.66 | 14.12 | 16.85 | 20 |

## Website data statistics

| Statistic | Value |
|---|---:|
| Public internships displayed | 202 |
| Average internship probability | 0.825 |
| Median internship probability | 0.9 |
| Manual-review records still shown | 60 / 202 |
| Records with extracted skills | 184 / 202 |
| Records with no skills | 18 / 202 |
| Records with salary available | 106 / 202 |
| Records missing salary | 96 / 202 |
| Records missing link | 2 / 202 |
| Empty descriptions | 0 / 202 |

## Category distribution

| Category | Count | Percent |
|---|---:|---:|
| Business | 112 | 55.45% |
| Engineering | 33 | 16.34% |
| Software engineering | 22 | 10.89% |
| Data science | 11 | 5.45% |
| General | 8 | 3.96% |
| Cloud/DevOps | 6 | 2.97% |
| Healthcare | 5 | 2.48% |
| Cybersecurity | 3 | 1.49% |
| Design | 2 | 0.99% |

## Thesis-ready interpretation

The evaluation results show that the original ML cleaner was highly conservative rather than fundamentally incorrect. Compared with the human inspection results, which identified 29 real internships, 2 ambiguous cases, and 269 false internship records, the original transformer-based cleaner tended to reject uncertain postings instead of confidently accepting them as internships. This behavior reduced false positives, meaning that roles classified as internships were usually reliable, but it also lowered recall because some genuine internships with short or weak descriptions were missed. Examples include postings where the title clearly contained terms such as “Intern” or “Internship,” but the description provided little semantic context. After improving the cleaner with human-aligned title rules, clear internship signals were given stronger importance, while uncertain cases such as “New Grad,” “Entry-Level,” “Student OK,” “Fellow,” or unsupported “Co-op” roles were handled more carefully. As a result, the improved ml_cleaner matched the human inspection labels on the 300-record test sample, showing that the main weakness of the original system was conservative decision-making on sparse job records rather than general classification failure.


The experimental results show that the Internify system is effective both as a frontend internship discovery platform and as a lightweight internship classification pipeline. From the manually inspected 300-role test sample, only 29 records were confirmed as real internships, while 269 were false internship records and 2 were ambiguous, demonstrating a high noise rate in scraped job-board data. The original transformer-based cleaner behaved conservatively: it achieved high precision by avoiding false positives, but its recall was lower because it rejected some genuine internships with sparse descriptions. After adding human-aligned title rules, the improved ml_cleaner matched the manual inspection labels on the full 300-record sample. On the frontend side, the production build completed successfully, served 202 accepted internship records, and achieved warm local response times around 9–14 ms for the tested pages and APIs in the logged production run. These findings support the thesis claim that lightweight preprocessing, semantic enrichment, and frontend filtering can transform noisy scraped recruitment data into a usable internship discovery system.