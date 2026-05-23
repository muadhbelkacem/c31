"""Typed data structures used by the Internify ML cleaner."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class NormalizedJob:
    """Canonical representation of a job record after field normalization."""

    source_index: int
    source_id: str
    title: str
    company: str
    location: str
    link: str
    salary: str
    description: str
    job_age: str
    platform: str
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class RuleScore:
    """Transparent pre-transformer internship relevance score."""

    score: float
    reasons: list[str]


@dataclass
class ClassificationResult:
    """Internship classification output with transparent confidence metadata."""

    probability: float
    label: str
    method: str
    explanation: str
    semantic_label: str | None = None
    semantic_margin: float | None = None
    rule_semantic_disagreement: bool = False


@dataclass
class DomainResult:
    """Domain classification output."""

    primary: str
    confidence: float
    method: str


@dataclass
class DeduplicationReport:
    """Summary of invalid and duplicate removal."""

    total_input: int = 0
    removed_invalid: int = 0
    removed_duplicates: int = 0
    total_output: int = 0
