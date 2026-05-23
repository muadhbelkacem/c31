#!/usr/bin/env python3
"""CLI runner for the Internify local ML cleaner."""
from __future__ import annotations

import argparse
import logging
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml_cleaner import MLCleanerPipeline
from ml_cleaner.config import DEFAULT_CONFIG


def parse_bool(value: str | bool) -> bool:
    if isinstance(value, bool):
        return value
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y"}:
        return True
    if normalized in {"0", "false", "no", "n"}:
        return False
    raise argparse.ArgumentTypeError("Expected true/false")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Internify local ML cleaning pipeline.")
    parser.add_argument("--input", type=Path, default=None, help="Input JSON path. Defaults to data/raw/jobs.json, data/cleaned/jobs_cleaned.json, or public/intern_data.json.")
    parser.add_argument("--output", type=Path, default=DEFAULT_CONFIG.default_output_path, help="Production frontend output JSON path. Contains only accepted internships.")
    parser.add_argument("--dev-output", type=Path, default=DEFAULT_CONFIG.default_dev_output_path, help="Developer/debug output JSON path. Contains all processed records.")
    parser.add_argument("--min-probability", type=float, default=DEFAULT_CONFIG.min_probability, help="Minimum probability for internal is_real_internship decision.")
    parser.add_argument("--production-min-probability", type=float, default=DEFAULT_CONFIG.production_min_probability, help="Minimum probability required for public production output.")
    parser.add_argument("--include-manual-review-in-production", type=parse_bool, default=True, help="Whether manual-review internships can appear in production output when they pass the probability threshold.")
    parser.add_argument("--skip-transformer", action="store_true", help="Use transparent rule-only fallback without loading SentenceTransformers.")
    parser.add_argument("--max-records", type=int, default=None, help="Optional cap for testing.")
    parser.add_argument("--device", default=DEFAULT_CONFIG.default_device, choices=["cpu", "cuda", "mps"], help="Device for local models. CPU is the safe default.")
    return parser.parse_args()


def _safe_count_dev_records(path: Path) -> dict[str, int]:
    try:
        records = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(records, list):
            return {}
        return {
            "total records": len(records),
            "real internships": sum(1 for record in records if record.get("is_real_internship") is True),
            "non internships": sum(1 for record in records if record.get("is_real_internship") is False),
            "manual review records": sum(1 for record in records if record.get("needs_manual_review") is True),
            "records with exact 1.0 probability": sum(1 for record in records if record.get("internship_probability") == 1.0),
            "empty skill records": sum(1 for record in records if not record.get("skills")),
        }
    except Exception as exc:
        logging.warning("Could not read developer output quality summary: %s", exc)
        return {}


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    args = parse_args()
    try:
        pipeline = MLCleanerPipeline(device=args.device, skip_transformer=args.skip_transformer)
        report, summary = pipeline.run(
            args.input,
            args.output,
            args.min_probability,
            args.max_records,
            dev_output_path=args.dev_output,
            production_min_probability=args.production_min_probability,
            include_manual_review_in_production=args.include_manual_review_in_production,
        )
    except Exception as exc:
        logging.exception("Pipeline failed: %s", exc)
        return 1

    print("\nPipeline report")
    print(f"raw_input_count: {summary['raw_input_count']}")
    print(f"removed_invalid: {report.removed_invalid}")
    print(f"removed_duplicates: {report.removed_duplicates}")
    print(f"total_processed_dev_records: {summary['total_processed']}")
    print(f"accepted_production_internships: {summary['accepted_production_internships']}")
    print(f"rejected_non_internships: {summary['rejected_non_internships']}")
    print(f"manual_review_records: {summary['manual_review_records']}")
    print(f"records_with_exact_1.0_probability: {summary['exact_one_probability_records']}")
    print(f"empty_skill_records: {summary['empty_skill_records']}")
    print(f"production_output_path: {summary['production_output_path']}")
    print(f"dev_output_path: {summary['dev_output_path']}")

    counts = _safe_count_dev_records(args.dev_output)
    if counts:
        print("\nDeveloper output quality summary")
        for key, value in counts.items():
            print(f"{key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
