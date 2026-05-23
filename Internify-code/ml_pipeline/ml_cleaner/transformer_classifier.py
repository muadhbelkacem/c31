"""Local transformer/embedding based internship classifier."""
from __future__ import annotations

import logging
from math import exp

from .schemas import ClassificationResult, NormalizedJob, RuleScore

logger = logging.getLogger(__name__)

PROTOTYPES = {
    "real internship": "student internship co-op stagiaire stage alternance temporary role for university students early career learning paid placement",
    "full-time experienced job": "senior full-time experienced professional permanent role requiring many years of experience leadership management",
    "unrelated posting": "posting not related to internship career opportunity irrelevant research notice incomplete unclear content",
    "training/course advertisement": "course bootcamp training program certification advertisement paid learning class workshop",
}


def sigmoid(x: float) -> float:
    return 1 / (1 + exp(-x))


def final_label_from_probability(probability: float, min_probability: float = 0.55) -> str:
    """Single source of truth for final internship label."""
    return "real internship" if probability >= min_probability else "not real internship"


class LocalInternshipClassifier:
    """Embedding prototype classifier using SentenceTransformers locally.

    This deliberately avoids sentiment models and cloud LLMs. The model compares
    each job against four human-readable prototype descriptions, then blends the
    semantic margin with transparent rule scoring.
    """

    def __init__(self, model_name: str, device: str = "cpu") -> None:
        self.model_name = model_name
        self.device = device
        try:
            from sentence_transformers import SentenceTransformer
        except Exception as exc:  # pragma: no cover - environment dependent
            raise RuntimeError(
                "sentence-transformers is required for transformer classification. "
                "Install requirements-ml.txt or run with --skip-transformer."
            ) from exc
        logger.info("Loading local embedding model: %s on %s", model_name, device)
        self.model = SentenceTransformer(model_name, device=device)
        self.labels = list(PROTOTYPES.keys())
        self.prototype_embeddings = self.model.encode(
            [PROTOTYPES[label] for label in self.labels],
            convert_to_tensor=True,
            normalize_embeddings=True,
        )

    def classify(self, job: NormalizedJob, rule_score: RuleScore, min_probability: float = 0.55, strong_rule_threshold: float = 0.82) -> ClassificationResult:
        """Classify a single job by similarity to label prototype descriptions."""
        from sentence_transformers import util

        # Strong transparent internship evidence should not be overruled by a
        # generic embedding prototype. This handles French/industry-specific
        # internships that may not semantically resemble the English prototype.
        if rule_score.score >= strong_rule_threshold:
            probability = max(rule_score.score, min_probability + 0.08)
            probability = min(0.94, probability)
            return ClassificationResult(
                probability=round(float(probability), 4),
                label="real internship",
                method="strong rule override + sentence-transformers available",
                explanation=(
                    f"Rule score {rule_score.score:.2f} exceeded the strong internship threshold "
                    f"{strong_rule_threshold:.2f}; final label is set deterministically to real internship."
                ),
                semantic_label=None,
                semantic_margin=None,
                rule_semantic_disagreement=False,
            )

        text = f"Title: {job.title}. Company: {job.company}. Description: {job.description[:1800]}"
        embedding = self.model.encode(text, convert_to_tensor=True, normalize_embeddings=True)
        sims = util.cos_sim(embedding, self.prototype_embeddings)[0].detach().cpu().tolist()
        label_scores = dict(zip(self.labels, sims))
        best_label = max(label_scores, key=label_scores.get)
        internship_sim = label_scores["real internship"]
        strongest_negative = max(
            label_scores["full-time experienced job"],
            label_scores["training/course advertisement"],
            label_scores["unrelated posting"],
        )
        semantic_margin = internship_sim - strongest_negative
        probability = 0.60 * sigmoid(4.0 * semantic_margin) + 0.40 * rule_score.score

        # If another prototype wins clearly, cap borderline positives unless
        # rules already contain good internship evidence.
        if best_label != "real internship" and rule_score.score < 0.65 and probability > 0.52:
            probability = 0.52

        probability = round(float(max(0.01, min(0.96, probability))), 4)
        label = final_label_from_probability(probability, min_probability)
        rule_suggests_internship = rule_score.score >= min_probability
        semantic_suggests_internship = best_label == "real internship"
        rule_semantic_disagreement = rule_suggests_internship != semantic_suggests_internship
        explanation = (
            f"Compared the posting embedding with four local label descriptions; "
            f"best semantic label was '{best_label}', semantic margin was {semantic_margin:.3f}, "
            f"then blended with rule score {rule_score.score:.2f}."
        )
        return ClassificationResult(
            probability=probability,
            label=label,
            method="sentence-transformers prototype similarity + rule blend",
            explanation=explanation,
            semantic_label=best_label,
            semantic_margin=round(float(semantic_margin), 4),
            rule_semantic_disagreement=rule_semantic_disagreement,
        )


def rule_only_classification(rule_score: RuleScore, min_probability: float = 0.55, strong_rule_threshold: float = 0.82) -> ClassificationResult:
    """Explainable fallback used when --skip-transformer is selected."""
    probability = rule_score.score
    label = final_label_from_probability(probability, min_probability)
    method = "rule-only fallback (--skip-transformer)"
    if rule_score.score >= strong_rule_threshold:
        method = "strong rule-only internship decision (--skip-transformer)"
    probability = round(float(max(0.01, min(0.94, probability))), 4)
    label = final_label_from_probability(probability, min_probability)
    return ClassificationResult(
        probability=probability,
        label=label,
        method=method,
        explanation="Used transparent internship keyword, education, duration, and experience-level rules only.",
        semantic_label=None,
        semantic_margin=None,
        rule_semantic_disagreement=False,
    )
