#!/usr/bin/env python3
"""Evaluate exported Internify predictions against manual labels."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml_cleaner.evaluation import evaluate_predictions


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate Internify ML cleaner output.")
    parser.add_argument("--predictions", type=Path, default=Path(__file__).resolve().parents[2] / "frontend/public/intern_data.json")
    parser.add_argument("--labels", type=Path, default=Path(__file__).resolve().parents[1] / "data/evaluation/labels.csv")
    args = parser.parse_args()
    evaluate_predictions(args.predictions, args.labels)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
