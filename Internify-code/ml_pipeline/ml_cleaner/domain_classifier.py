"""Job domain classification using explainable keyword rules and optional embeddings."""
from __future__ import annotations

import json
import logging
import re
from collections import Counter
from pathlib import Path
from .config import DEFAULT_CONFIG
from .schemas import DomainResult

logger = logging.getLogger(__name__)

DEFAULT_DOMAIN_KEYWORDS: dict[str, dict[str, float]] = {
    "software_engineering": {"software": 1.0, "developer": 1.0, "programming": 1.0, "api": 0.9, "javascript": 0.7, "java": 0.7, "python": 0.7, "c++": 0.8, "c#": 0.8},
    "data_science": {"machine learning": 1.5, "artificial intelligence": 1.4, "data science": 1.5, "analytics": 1.0, "statistics": 0.9, "llm": 1.2},
    "cybersecurity": {"cybersecurity": 1.6, "information security": 1.4, "vulnerability": 1.4, "penetration": 1.3, "threat": 1.1, "malware": 1.3},
    "cloud_devops": {"cloud": 1.0, "devops": 1.6, "docker": 1.2, "kubernetes": 1.4, "aws": 1.0, "azure": 1.0, "gcp": 1.0},
    "business": {"business": 1.0, "strategy": 1.4, "marketing": 1.0, "sales": 1.0, "finance": 1.1, "accounting": 1.3, "operations": 1.0, "human resources": 1.2},
    "design": {"ui/ux": 1.6, "ux": 1.1, "figma": 1.3, "user experience": 1.4, "product design": 1.2, "graphic design": 1.2},
    "engineering": {"mechanical": 1.2, "electrical": 1.2, "civil": 1.1, "industrial": 1.1, "hardware": 1.2, "aerospace": 1.2, "fpga": 1.2, "pcb": 1.0},
    "healthcare": {"pharmacist": 1.8, "pharmacy": 1.8, "patient": 1.0, "clinical": 1.0, "healthcare": 1.2, "medical": 1.0, "dietitian": 1.3, "nurse": 1.4},
}

DOMAIN_DESCRIPTIONS = {
    "software_engineering": "Software development, backend engineering, frontend development, APIs, programming.",
    "data_science": "Machine learning, artificial intelligence, analytics, NLP, data modeling.",
    "cybersecurity": "Security analysis, vulnerability research, penetration testing, threat intelligence.",
    "cloud_devops": "Cloud infrastructure, DevOps, CI/CD, Kubernetes, Docker, AWS.",
    "business": "Finance, HR, operations, management, strategy, consulting.",
    "design": "UI/UX, product design, visual design, Figma, interaction design.",
    "engineering": "Mechanical, electrical, aerospace, hardware, civil engineering.",
    "healthcare": "Healthcare, pharmacy, patient care, clinical care, medication dispensing.",
    "general": "General non-specialized roles.",
}

DOMAIN_PRIORITY = [
    "cybersecurity", "data_science", "cloud_devops", "software_engineering",
    "engineering", "healthcare", "business", "design", "general",
]


def _load_domain_keywords(path: Path) -> dict[str, dict[str, float]]:
    try:
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {
                    str(domain): {str(k): float(v) for k, v in keywords.items() if isinstance(keywords, dict)}
                    for domain, keywords in data.items()
                    if isinstance(keywords, dict)
                }
    except Exception as exc:
        logger.warning("Could not load domain keyword library %s: %s", path, exc)
    return DEFAULT_DOMAIN_KEYWORDS


def _count_keyword(text: str, keyword: str) -> bool:
    if keyword.startswith(" ") or keyword.endswith(" "):
        return keyword in f" {text} "
    return re.search(rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])", text, flags=re.I) is not None


class DomainClassifier:
    """Classify job domains with keyword rules plus optional embedding fallback."""

    def __init__(self, model=None, threshold: float = 0.38, keywords_path: Path | None = None) -> None:
        self.model = model
        self.threshold = threshold
        self.domain_keywords = _load_domain_keywords(keywords_path or DEFAULT_CONFIG.domain_keywords_path)
        self.labels = list(DOMAIN_DESCRIPTIONS.keys())
        self.domain_embeddings = None
        if model is not None:
            try:
                self.domain_embeddings = model.encode(
                    [DOMAIN_DESCRIPTIONS[label] for label in self.labels],
                    convert_to_tensor=True,
                    normalize_embeddings=True,
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("Domain embedding fallback disabled: %s", exc)
                self.domain_embeddings = None

    def _keyword_scores(self, text: str) -> Counter[str]:
        lower = f" {text.lower()} "
        scores: Counter[str] = Counter()
        for domain, keywords in self.domain_keywords.items():
            for keyword, weight in keywords.items():
                if _count_keyword(lower, keyword.lower()):
                    scores[domain] += weight
        return scores

    def _embedding_classify(self, text: str) -> DomainResult | None:
        if self.model is None or self.domain_embeddings is None:
            return None
        try:
            from sentence_transformers import util
            embedding = self.model.encode(text[:1800], convert_to_tensor=True, normalize_embeddings=True)
            sims = util.cos_sim(embedding, self.domain_embeddings)[0].detach().cpu().tolist()
            pairs = sorted(zip(self.labels, sims), key=lambda item: item[1], reverse=True)
            label, score = pairs[0]
            margin = score - pairs[1][1] if len(pairs) > 1 else score
            if score >= self.threshold and margin >= 0.015:
                return DomainResult(primary=label, confidence=round(min(float(score), 0.95), 3), method="prototype embedding fallback")
        except Exception as exc:  # pragma: no cover
            logger.warning("Domain embedding classification failed: %s", exc)
        return None

    def classify(self, text: str) -> DomainResult:
        """Return primary domain, confidence, and method."""
        scores = self._keyword_scores(text)
        total = float(sum(scores.values()))
        if total > 0:
            max_score = max(scores.values())
            tied = [domain for domain, score in scores.items() if score == max_score]
            primary = sorted(tied, key=lambda d: DOMAIN_PRIORITY.index(d) if d in DOMAIN_PRIORITY else 999)[0]
            confidence = min(max_score / total, 0.95)
            if confidence < 0.42:
                embedded = self._embedding_classify(text)
                if embedded is not None and embedded.primary != "general":
                    return DomainResult(
                        primary=embedded.primary,
                        confidence=round(max(confidence, embedded.confidence), 3),
                        method="keyword rules + prototype embedding fallback",
                    )
            return DomainResult(primary=primary, confidence=round(confidence, 3), method="keyword rules")
        embedded = self._embedding_classify(text)
        if embedded is not None:
            return embedded
        return DomainResult(primary="general", confidence=0.35, method="default no-domain-keyword fallback")
