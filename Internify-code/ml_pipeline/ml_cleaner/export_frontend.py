"""Frontend export mapping for Next.js intern_data.json."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def rating_from_probability(probability: float) -> float:
    """Convert internship probability to a simple 1-5 frontend rating."""
    return round(3.0 + 2.0 * max(0.0, min(1.0, probability)), 1)


def filter_production_records(
    records: list[dict[str, Any]],
    min_probability: float = 0.60,
    include_manual_review: bool = True,
) -> list[dict[str, Any]]:
    """Return only public website-safe accepted internships."""
    filtered: list[dict[str, Any]] = []
    for record in records:
        probability = float(record.get("internship_probability") or 0.0)
        is_real = record.get("is_real_internship") is True
        manual_review = record.get("needs_manual_review") is True
        if not is_real or probability < min_probability:
            continue
        if manual_review and not include_manual_review:
            continue
        filtered.append(record)
    return filtered


def export_frontend_json(records: list[dict[str, Any]], output_path: Path) -> None:
    """Write UTF-8 JSON for the Next.js frontend."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
