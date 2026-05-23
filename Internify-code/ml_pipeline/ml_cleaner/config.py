"""Configuration defaults for the Internify local ML cleaning pipeline."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


ML_PIPELINE_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ML_PIPELINE_ROOT.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"


@dataclass(frozen=True)
class CleanerConfig:
    """Runtime configuration for the local pipeline.

    Paths are anchored to the separated project structure so the ML scripts can
    be launched either from the repository root or from inside ml_pipeline.
    Thresholds remain exposed for thesis/demo tuning without changing model code.
    """

    input_candidates: tuple[Path, ...] = (
        ML_PIPELINE_ROOT / "data/raw/jobs.json",
        ML_PIPELINE_ROOT / "data/cleaned/jobs_cleaned.json",
        FRONTEND_ROOT / "public/intern_data.json",
    )
    default_output_path: Path = FRONTEND_ROOT / "public/intern_data.json"
    default_dev_output_path: Path = ML_PIPELINE_ROOT / "data/output/intern_data_dev.json"

    libraries_dir: Path = ML_PIPELINE_ROOT / "ml_cleaner/libraries"
    skills_library_path: Path = ML_PIPELINE_ROOT / "ml_cleaner/libraries/skills_library.json"
    domain_keywords_path: Path = ML_PIPELINE_ROOT / "ml_cleaner/libraries/domain_keywords.json"
    internship_rules_path: Path = ML_PIPELINE_ROOT / "ml_cleaner/libraries/internship_rules.json"
    negative_patterns_path: Path = ML_PIPELINE_ROOT / "ml_cleaner/libraries/negative_role_patterns.json"

    # Backward-compatible mirror for older scripts/docs that reference data/libraries.
    legacy_skills_library_path: Path = ML_PIPELINE_ROOT / "data/libraries/skills_library.json"

    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Final internship decision thresholds.
    min_probability: float = 0.55
    production_min_probability: float = 0.60
    strong_rule_internship_threshold: float = 0.82
    obvious_internship_probability_cap: float = 0.96
    strong_rule_probability_cap: float = 0.94
    blended_probability_cap: float = 0.96
    blended_probability_floor: float = 0.01
    manual_review_min_probability: float = 0.45
    manual_review_max_probability: float = 0.60
    weak_semantic_margin_threshold: float = 0.08

    # Skill extraction: embedding matching is deliberately conservative to
    # avoid hallucinated skills such as TypeScript in accounting postings.
    max_skills_per_job: int = 15
    skill_similarity_threshold: float = 0.68
    skill_similarity_margin: float = 0.06

    # Deduplication thresholds. Token overlap handles cross-board duplicates
    # where links differ but title/company/description are nearly identical.
    duplicate_similarity_threshold: float = 0.88
    duplicate_title_threshold: float = 0.90

    min_description_chars: int = 40
    min_quality_score: int = 2
    default_device: str = "cpu"


DEFAULT_CONFIG = CleanerConfig()
