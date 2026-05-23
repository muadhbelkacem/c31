"""End-to-end local ML cleaning and enrichment pipeline for Internify."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any
import re

from .config import CleanerConfig, DEFAULT_CONFIG
from .deduplicator import deduplicate_jobs
from .domain_classifier import DomainClassifier
from .export_frontend import export_frontend_json, filter_production_records, rating_from_probability
from .rule_filter import is_invalid_record, score_internship_rules
from .schemas import DeduplicationReport, NormalizedJob
from .skill_extractor import SkillExtractor, ensure_skills_library
from .text_cleaning import normalize_record
from .transformer_classifier import LocalInternshipClassifier, rule_only_classification

logger = logging.getLogger(__name__)

INTERNSHIP_TITLE_TERMS = (
    "intern", "internship", "co-op", "coop", "stage", "stagiaire",
)

STUDENT_DURATION_TERMS = (
    "student", "enrolled", "currently enrolled", "bachelor", "master",
    "university", "college", "degree", "winter", "summer", "fall",
    "spring", "2025", "2026", "4 months", "8 months", "12 months",
    "étudiant", "etudiante", "étudiante", "baccalauréat", "baccalaureat",
    "maîtrise", "maitrise", "université", "universite", "durée", "duree",
)


def _contains_term(text: str, term: str) -> bool:
    """Case-insensitive term check with safe boundaries for short tokens."""
    return re.search(rf"(?<![a-z0-9]){re.escape(term.lower())}(?![a-z0-9])", text.lower()) is not None


def title_indicates_internship(title: str) -> bool:
    """Return true when the title contains an explicit internship term.

    The English word "stage" is not counted here unless the title itself uses it,
    which is usually a French internship signal. Generic description phrases like
    "at any stage of application" are handled in rule_filter and ignored.
    """
    return any(_contains_term(title, term) for term in INTERNSHIP_TITLE_TERMS)


def description_has_student_or_duration_signal(description: str) -> bool:
    """Return true when the description contains student eligibility or duration evidence."""
    return any(_contains_term(description, term) for term in STUDENT_DURATION_TERMS)


def needs_manual_review_flag(
    probability: float,
    rule_score: float,
    title_has_internship: bool,
    is_real: bool,
    semantic_margin: float | None,
    rule_semantic_disagreement: bool,
    min_review_probability: float,
    max_review_probability: float,
    weak_margin_threshold: float,
) -> bool:
    """Deterministically flag ambiguous records instead of using an LLM fallback."""
    uncertain_probability = min_review_probability <= probability <= max_review_probability
    title_conflict = title_has_internship and not is_real
    weak_semantic_margin = semantic_margin is not None and abs(semantic_margin) < weak_margin_threshold
    return bool(uncertain_probability or rule_semantic_disagreement or title_conflict or weak_semantic_margin)


def detect_language_simple(text: str) -> str:
    """Small local language heuristic for English/French/unknown."""
    lower = f" {text.lower()[:2500]} "
    fr_markers = [
        " le ", " la ", " les ", " des ", " une ", " expérience ", " developpement ",
        " développement ", " étudiant ", " étudiante ", " stagiaire ", " stage ",
        " baccalauréat ", " maîtrise ", " emploi ", " poste ", " compétences ",
    ]
    en_markers = [" the ", " and ", " with ", " experience ", " student ", " internship ", " software ", " role "]
    fr = sum(1 for m in fr_markers if m in lower)
    en = sum(1 for m in en_markers if m in lower)
    if fr > en and fr >= 2:
        return "fr"
    if en >= 1:
        return "en"
    return "unknown"


class MLCleanerPipeline:
    """Production-oriented local data cleaning and enrichment pipeline."""

    def __init__(self, config: CleanerConfig = DEFAULT_CONFIG, device: str = "cpu", skip_transformer: bool = False) -> None:
        self.config = config
        self.device = device
        self.skip_transformer = skip_transformer
        ensure_skills_library(config.skills_library_path)
        # Keep the legacy library mirror available for older scripts/docs.
        ensure_skills_library(config.legacy_skills_library_path)

        self.classifier: LocalInternshipClassifier | None = None
        shared_embedding_model = None
        if not skip_transformer:
            self.classifier = LocalInternshipClassifier(config.embedding_model_name, device=device)
            shared_embedding_model = self.classifier.model

        self.skill_extractor = SkillExtractor(
            library_path=config.skills_library_path,
            model_name=None if skip_transformer else config.embedding_model_name,
            device=device,
            enable_embeddings=not skip_transformer,
            threshold=config.skill_similarity_threshold,
            max_skills=config.max_skills_per_job,
            margin=config.skill_similarity_margin,
        )
        self.domain_classifier = DomainClassifier(model=shared_embedding_model, keywords_path=config.domain_keywords_path)

    @staticmethod
    def load_input(path: Path) -> list[dict[str, Any]]:
        """Load JSON input that may be a list or an object containing jobs/items/data."""
        if not path.exists():
            raise FileNotFoundError(f"Input file not found: {path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [row for row in data if isinstance(row, dict)]
        if isinstance(data, dict):
            for key in ("jobs", "items", "data", "results"):
                value = data.get(key)
                if isinstance(value, list):
                    return [row for row in value if isinstance(row, dict)]
            return [data]
        raise ValueError("Input JSON must be a list or an object containing jobs/items/data/results.")

    @staticmethod
    def find_default_input(candidates: tuple[Path, ...]) -> Path:
        """Find the first available standard input path."""
        for path in candidates:
            if path.exists():
                return path
        raise FileNotFoundError("No input file found. Tried: " + ", ".join(str(p) for p in candidates))

    def normalize_and_filter(self, raw_jobs: list[dict[str, Any]]) -> tuple[list[NormalizedJob], DeduplicationReport, dict[str, list[str]]]:
        """Normalize, remove invalid records, then deduplicate."""
        report = DeduplicationReport(total_input=len(raw_jobs))
        invalid_reasons: dict[str, list[str]] = {}
        normalized: list[NormalizedJob] = []
        for index, record in enumerate(raw_jobs):
            job = normalize_record(record, index)
            invalid, reasons = is_invalid_record(job, self.config.min_description_chars)
            if invalid:
                report.removed_invalid += 1
                invalid_reasons[job.source_id] = reasons
                continue
            normalized.append(job)
        deduped, duplicates = deduplicate_jobs(
            normalized,
            threshold=self.config.duplicate_similarity_threshold,
            title_threshold=self.config.duplicate_title_threshold,
        )
        report.removed_duplicates = duplicates
        report.total_output = len(deduped)
        return deduped, report, invalid_reasons

    def enrich_job(self, job: NormalizedJob, min_probability: float) -> dict[str, Any]:
        """Enrich one normalized job and return frontend-ready shape."""
        combined = f"{job.title}. {job.company}. {job.location}. {job.description}"
        rule_score = score_internship_rules(job)
        if self.classifier is None:
            classification = rule_only_classification(
                rule_score,
                min_probability=min_probability,
                strong_rule_threshold=self.config.strong_rule_internship_threshold,
            )
        else:
            classification = self.classifier.classify(
                job,
                rule_score,
                min_probability=min_probability,
                strong_rule_threshold=self.config.strong_rule_internship_threshold,
            )
        skills = self.skill_extractor.extract(combined)
        domain = self.domain_classifier.classify(combined)

        title_has_internship = title_indicates_internship(job.title)
        obvious_internship = title_has_internship and description_has_student_or_duration_signal(job.description)

        probability = classification.probability
        method = classification.method
        explanation = classification.explanation
        if obvious_internship:
            probability = min(self.config.obvious_internship_probability_cap, max(probability, min_probability + 0.10))
            method = f"obvious internship deterministic override + {method}"
            explanation = (
                "Title contains an explicit internship term and the description contains student/duration evidence; "
                "final label is set deterministically to real internship. "
                + explanation
            )

        probability = round(float(max(self.config.blended_probability_floor, min(self.config.blended_probability_cap, probability))), 4)

        # Single deterministic rule: the label and boolean are always consistent.
        is_real = probability >= min_probability
        final_label = "real internship" if is_real else "not real internship"
        needs_manual_review = needs_manual_review_flag(
            probability=probability,
            rule_score=rule_score.score,
            title_has_internship=title_has_internship,
            is_real=is_real,
            semantic_margin=classification.semantic_margin,
            rule_semantic_disagreement=classification.rule_semantic_disagreement,
            min_review_probability=self.config.manual_review_min_probability,
            max_review_probability=self.config.manual_review_max_probability,
            weak_margin_threshold=self.config.weak_semantic_margin_threshold,
        )

        return {
            "id": job.source_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "link": job.link,
            "salary": job.salary,
            "description": job.description,
            "rating": rating_from_probability(probability),
            "job_age": job.job_age,
            "platform": job.platform,
            "skills": skills,
            "category": domain.primary,
            "is_real_internship": bool(is_real),
            "internship_probability": probability,
            "needs_manual_review": needs_manual_review,
            "cleaning_metadata": {
                "source_index": job.source_index,
                "rule_score": rule_score.score,
                "rule_reasons": rule_score.reasons,
                "internship_label": final_label,
                "classification_method": method,
                "classification_explanation": explanation,
                "semantic_label": classification.semantic_label,
                "semantic_margin": classification.semantic_margin,
                "rule_semantic_disagreement": classification.rule_semantic_disagreement,
                "needs_manual_review": needs_manual_review,
                "extracted_skills": skills,
                "skills_count": len(skills),
                "domain_classification": {"primary": domain.primary, "confidence": domain.confidence, "method": domain.method},
                "detected_language": detect_language_simple(combined),
                "original_id": job.raw.get("id") or job.raw.get("job_id") or "",
            },
        }

    def run(
        self,
        input_path: Path | None,
        output_path: Path,
        min_probability: float | None = None,
        max_records: int | None = None,
        dev_output_path: Path | None = None,
        production_min_probability: float | None = None,
        include_manual_review_in_production: bool = True,
    ) -> tuple[DeduplicationReport, dict[str, Any]]:
        """Run the full pipeline and export both production and developer JSON files.

        Production output is safe for the public website and contains only
        accepted internships. Developer output contains every processed record
        with full metadata for debugging/evaluation.
        """
        input_path = input_path or self.find_default_input(self.config.input_candidates)
        min_prob = self.config.min_probability if min_probability is None else min_probability
        prod_min_prob = self.config.production_min_probability if production_min_probability is None else production_min_probability
        dev_output_path = dev_output_path or self.config.default_dev_output_path

        logger.info("Loading input: %s", input_path)
        raw_jobs = self.load_input(input_path)
        if max_records is not None:
            raw_jobs = raw_jobs[:max_records]

        jobs, report, _ = self.normalize_and_filter(raw_jobs)
        logger.info(
            "Normalized %s valid records; removed %s invalid and %s duplicates",
            len(jobs), report.removed_invalid, report.removed_duplicates,
        )

        enriched = [self.enrich_job(job, min_prob) for job in jobs]
        production_records = filter_production_records(
            enriched,
            min_probability=prod_min_prob,
            include_manual_review=include_manual_review_in_production,
        )

        export_frontend_json(production_records, output_path)
        export_frontend_json(enriched, dev_output_path)

        summary = {
            "raw_input_count": len(raw_jobs),
            "invalid_removed": report.removed_invalid,
            "duplicates_removed": report.removed_duplicates,
            "total_processed": len(enriched),
            "accepted_production_internships": len(production_records),
            "rejected_non_internships": sum(1 for r in enriched if not r.get("is_real_internship")),
            "manual_review_records": sum(1 for r in enriched if r.get("needs_manual_review") is True),
            "exact_one_probability_records": sum(1 for r in enriched if r.get("internship_probability") == 1.0),
            "empty_skill_records": sum(1 for r in enriched if not r.get("skills")),
            "production_output_path": str(output_path),
            "dev_output_path": str(dev_output_path),
        }
        logger.info("Exported %s production internships to %s", len(production_records), output_path)
        logger.info("Exported %s developer records to %s", len(enriched), dev_output_path)
        return report, summary
