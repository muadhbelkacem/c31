"""Transparent rule-based internship relevance scoring."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .config import DEFAULT_CONFIG
from .schemas import NormalizedJob, RuleScore

DEFAULT_RULES: dict[str, Any] = {
    "english_positive_keyword_weights": {
        "intern": 0.30,
        "internship": 0.35,
        "co-op": 0.30,
        "coop": 0.25,
        "student intern": 0.25,
        "graduate program": 0.20,
        "trainee": 0.22,
        "junior": 0.10,
    },
    "french_positive_keyword_weights": {
        "stage": 0.30,
        "stagiaire": 0.35,
        "étudiant": 0.18,
        "etudiant": 0.18,
        "étudiante": 0.18,
        "etudiante": 0.18,
        "alternance": 0.25,
        "maîtrise": 0.12,
        "maitrise": 0.12,
        "baccalauréat": 0.12,
        "baccalaureat": 0.12,
    },
    "french_stage_context": ["stagiaire", "étudiant", "étudiante", "durée", "baccalauréat", "maîtrise", "université", "coop", "alternance"],
    "stage_exclusion_phrases": ["at any stage of application", "at any stage of recruitment", "at any stage of employment", "any stage of the process"],
}
DEFAULT_NEGATIVE_PATTERNS: dict[str, Any] = {
    "title_negative_keywords": {
        "senior": -0.30,
        "director": -0.35,
        "principal": -0.30,
        "staff engineer": -0.30,
        "staff pharmacist": -0.35,
        "head of": -0.30,
        "manager": -0.25,
        "licensee": -0.30,
        "gestionnaire": -0.18,
    },
    "title_negative_patterns": [
        {"pattern": r"\blead\s+(software|backend|frontend|engineer|developer|designer|analyst|architect)\b", "weight": -0.18, "reason": "title seniority pattern: lead"},
        {"pattern": r"\b(manager|gestionnaire|licensee)\b", "weight": -0.22, "reason": "title seniority/professional keyword"},
    ],
    "professional_negative_patterns": [],
    "experience_negative_patterns": [],
    "employment_negative_patterns": [],
}

EDUCATION_PATTERNS = [
    r"\bstudent\b",
    r"\bcurrently enrolled\b",
    r"\bpursuing\b.*\b(degree|bachelor|master|phd)\b",
    r"\bbachelor'?s\b",
    r"\bmaster'?s\b",
    r"\buniversity\b",
    r"\bcollege\b",
    r"\bétudiant(?:e)?\b",
    r"\betudiant(?:e)?\b",
    r"\binscrit(?:e)?\b",
    r"\bbaccalaur[eé]at\b",
    r"\bma[iî]trise\b",
]
DURATION_PATTERNS = [
    r"\b\d{1,2}\s*(month|months|week|weeks)\b",
    r"\b\d{1,2}\s*mois\b",
    r"\b(winter|summer|fall|spring|hiver|été|ete|automne|printemps)\s+20\d{2}\b",
    r"\b20\d{2}\s+(intern|internship|co-op|coop|stage)\b",
    r"\b(stage|internship)\s+(d['’]une\s+)?dur[eé]e\b",
]
LOW_EXPERIENCE_PATTERNS = [
    r"\bentry[- ]level\b",
    r"\b0\s*[-–]\s*2\s+years\b",
    r"\bno experience\b",
    r"\baucune exp[eé]rience\b",
]
REQUIREMENT_CUE_PATTERNS = [
    r"requirements?[:\s].{0,500}",
    r"qualifications?[:\s].{0,500}",
    r"required qualifications?[:\s].{0,500}",
    r"minimum qualifications?[:\s].{0,500}",
    r"what you.?ll need[:\s].{0,500}",
    r"knowledge, skills and experience[:\s].{0,500}",
    r"profil recherch[eé][:\s].{0,500}",
    r"exigences?[\s:]+.{0,500}",
]

_RULES_CACHE: dict[str, Any] | None = None
_NEGATIVE_CACHE: dict[str, Any] | None = None


def _load_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                merged = json.loads(json.dumps(fallback))
                for key, value in data.items():
                    merged[key] = value
                return merged
    except Exception:
        pass
    return fallback


def load_internship_rules() -> dict[str, Any]:
    global _RULES_CACHE
    if _RULES_CACHE is None:
        _RULES_CACHE = _load_json(DEFAULT_CONFIG.internship_rules_path, DEFAULT_RULES)
    return _RULES_CACHE


def load_negative_patterns() -> dict[str, Any]:
    global _NEGATIVE_CACHE
    if _NEGATIVE_CACHE is None:
        _NEGATIVE_CACHE = _load_json(DEFAULT_CONFIG.negative_patterns_path, DEFAULT_NEGATIVE_PATTERNS)
    return _NEGATIVE_CACHE


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", text, flags=re.I) is not None


def _candidate_requirement_text(description: str) -> str:
    """Return only short requirement-like windows from the description."""
    lower = description.lower()
    windows: list[str] = []
    for pattern in REQUIREMENT_CUE_PATTERNS:
        windows.extend(match.group(0) for match in re.finditer(pattern, lower, flags=re.I | re.S))
    return " ".join(windows)


def _looks_french(text: str) -> bool:
    lower = f" {text.lower()} "
    markers = [" stagiaire ", " étudiant ", " étudiante ", " durée ", " baccalauréat ", " maîtrise ", " université ", " emploi ", " poste ", " compétences "]
    return sum(1 for marker in markers if marker in lower) >= 1


def _stage_is_internship_signal(title_text: str, full_text: str, rules: dict[str, Any]) -> bool:
    """Avoid English false positives such as 'at any stage of application'."""
    exclusions = [str(x).lower() for x in rules.get("stage_exclusion_phrases", [])]
    if any(exclusion in full_text for exclusion in exclusions):
        # Still allow stage if the title or French context clearly indicates an internship.
        if not _contains_phrase(title_text, "stage") and not _looks_french(full_text):
            return False
    if _contains_phrase(title_text, "stage"):
        return True
    if "stage / coop" in full_text or "stage coop" in full_text:
        return True
    french_context = [str(x) for x in rules.get("french_stage_context", [])]
    return _looks_french(full_text) or any(_contains_phrase(full_text, term) for term in french_context)


def score_internship_rules(job: NormalizedJob) -> RuleScore:
    """Compute a simple, explainable rule score before transformer classification.

    Positive title signals are weighted more than description-only terms. Negative
    professional and seniority signals are restricted to title/requirements when
    appropriate so ordinary company boilerplate does not dominate the decision.
    """
    rules = load_internship_rules()
    negatives = load_negative_patterns()

    title_text = job.title.lower()
    full_text = f"{job.title} {job.description}".lower()
    requirements_text = _candidate_requirement_text(job.description)

    score = 0.10
    reasons: list[str] = []

    positive_weights: dict[str, float] = {}
    positive_weights.update({str(k): float(v) for k, v in rules.get("english_positive_keyword_weights", {}).items()})
    positive_weights.update({str(k): float(v) for k, v in rules.get("french_positive_keyword_weights", {}).items()})

    # Strong title-first signals.
    for keyword, weight in positive_weights.items():
        if keyword == "stage" and not _stage_is_internship_signal(title_text, full_text, rules):
            continue
        if _contains_phrase(title_text, keyword):
            score += weight
            reasons.append(f"positive title keyword: {keyword}")

    # Description-only positives are weaker and avoid generic English 'stage'.
    for keyword, weight in positive_weights.items():
        if _contains_phrase(title_text, keyword):
            continue
        if keyword == "stage" and not _stage_is_internship_signal(title_text, full_text, rules):
            continue
        if _contains_phrase(full_text, keyword):
            # Prevent company boilerplate mentions of interns/students from dominating.
            reduced_weight = min(weight, 0.12 if keyword in {"student", "étudiant", "etudiant", "étudiante", "etudiante"} else weight)
            score += reduced_weight
            reasons.append(f"positive keyword: {keyword}")

    for keyword, weight in negatives.get("title_negative_keywords", {}).items():
        if _contains_phrase(title_text, str(keyword)):
            score += float(weight)
            reasons.append(f"negative title/professional keyword: {keyword}")

    for item in negatives.get("title_negative_patterns", []):
        if re.search(str(item.get("pattern", "")), title_text, flags=re.I):
            score += float(item.get("weight", 0.0))
            reasons.append(str(item.get("reason", "negative title pattern")))

    if any(re.search(p, full_text, flags=re.I) for p in EDUCATION_PATTERNS):
        score += 0.15
        reasons.append("education/student indicator")
    if any(re.search(p, full_text, flags=re.I) for p in DURATION_PATTERNS):
        score += 0.15
        reasons.append("internship duration/term indicator")
    if any(re.search(p, full_text, flags=re.I) for p in LOW_EXPERIENCE_PATTERNS):
        score += 0.12
        reasons.append("entry-level experience indicator")

    # Experience penalties are limited to title and explicit candidate requirement snippets.
    seniority_scope = f"{title_text} {requirements_text}"
    for group_name in ("experience_negative_patterns", "employment_negative_patterns"):
        for item in negatives.get(group_name, []):
            if re.search(str(item.get("pattern", "")), seniority_scope, flags=re.I):
                score += float(item.get("weight", 0.0))
                reasons.append(str(item.get("reason", group_name)))

    # Professional/license negatives can appear in full descriptions and are strong.
    for item in negatives.get("professional_negative_patterns", []):
        if re.search(str(item.get("pattern", "")), full_text, flags=re.I):
            score += float(item.get("weight", 0.0))
            reasons.append(str(item.get("reason", "professional role signal")))

    score = max(0.0, min(1.0, score))
    if not reasons:
        reasons.append("no strong internship rule signals")
    return RuleScore(score=round(score, 3), reasons=reasons[:12])


def is_invalid_record(job: NormalizedJob, min_description_chars: int = 40) -> tuple[bool, list[str]]:
    """Detect records too incomplete or noisy for the frontend."""
    reasons: list[str] = []
    if not job.title or len(job.title) < 3:
        reasons.append("missing/short title")
    if not job.company or len(job.company) < 2:
        reasons.append("missing/short company")
    if not job.description or len(job.description) < min_description_chars:
        reasons.append("missing/short description")
    if re.fullmatch(r"[\W_]+", job.description or ""):
        reasons.append("description contains no useful text")
    return bool(reasons), reasons
