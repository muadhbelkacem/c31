"""Evaluation utilities for manually labeled internship records."""
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


def _to_binary(label: str) -> int:
    return 1 if str(label).strip().lower() in {"1", "true", "real internship", "internship", "yes"} else 0


def evaluate_predictions(output_json: Path, labels_csv: Path) -> dict[str, float] | None:
    """Evaluate frontend JSON predictions against a CSV with columns id,label."""
    labels_csv.parent.mkdir(parents=True, exist_ok=True)
    if not labels_csv.exists():
        with labels_csv.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["id", "label"])
            writer.writerow(["example_job_id", "real internship"])
        print(f"No labels file found. Created template at {labels_csv}")
        print("Fill it with rows from the exported JSON using labels: real internship or not internship.")
        return None
    if not output_json.exists():
        print(f"Prediction file not found: {output_json}")
        return None

    predictions: dict[str, int] = {}
    data: list[dict[str, Any]] = json.loads(output_json.read_text(encoding="utf-8"))
    for row in data:
        predictions[str(row.get("id", ""))] = 1 if row.get("is_real_internship") else 0

    y_true: list[int] = []
    y_pred: list[int] = []
    with labels_csv.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rid = str(row.get("id", ""))
            if rid in predictions:
                y_true.append(_to_binary(row.get("label", "")))
                y_pred.append(predictions[rid])

    if not y_true:
        print("No label IDs matched exported predictions. Check the id column.")
        return None
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    accuracy = (tp + tn) / len(y_true)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    metrics = {"accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1}
    for key, value in metrics.items():
        print(f"{key}: {value:.3f}")
    return metrics
