"""Duplicate detection for cleaned job postings."""
from __future__ import annotations

import re
from difflib import SequenceMatcher
from urllib.parse import parse_qs, urlparse

from .schemas import NormalizedJob
from .text_cleaning import normalized_key

TRACKING_PARAMS = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "feedid", "p", "vjs", "fvj"}


def canonical_link(link: str) -> str:
    """Normalize job links so tracking parameters do not prevent deduplication."""
    if not link:
        return ""
    try:
        parsed = urlparse(link.strip())
    except Exception:
        return normalized_key(link)
    host = parsed.netloc.lower().replace("www.", "")
    path = re.sub(r"/+$", "", parsed.path.lower())
    query = parse_qs(parsed.query)
    # Preserve stable ATS identifiers when available; remove noisy tracking.
    stable_parts: list[str] = []
    for key in sorted(query):
        key_l = key.lower()
        if key_l in TRACKING_PARAMS:
            continue
        if any(token in key_l for token in ("job", "opportunity", "posting", "jl", "jk")):
            stable_parts.append(f"{key_l}={' '.join(query[key])}")
    return normalized_key(f"{host} {path} {' '.join(stable_parts)}")


def _tokens(text: str) -> set[str]:
    return {tok for tok in normalized_key(text).split() if len(tok) >= 3}


def token_jaccard(a: str, b: str) -> float:
    """Token overlap similarity that is robust to word order differences."""
    ta = _tokens(a)
    tb = _tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def sequence_similarity(a: str, b: str) -> float:
    """Cheap CPU string similarity."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, normalized_key(a), normalized_key(b)).ratio()


def description_similarity(a: str, b: str) -> float:
    """Description similarity for fallback duplicate checks."""
    if not a or not b:
        return 0.0
    a_short = normalized_key(a[:2200])
    b_short = normalized_key(b[:2200])
    return max(SequenceMatcher(None, a_short, b_short).ratio(), token_jaccard(a_short, b_short))


def _company_key(company: str) -> str:
    key = normalized_key(company)
    for suffix in (" inc", " incorporated", " ltd", " limited", " corp", " corporation", " llc", " canada"):
        key = re.sub(rf"\b{suffix.strip()}\b", "", key)
    return normalized_key(key)


def _location_key(location: str) -> str:
    key = normalized_key(location)
    # Keep city-level location. Postal codes/addresses differ across boards.
    return " ".join(key.split()[:2])


def _exact_entity_key(job: NormalizedJob) -> tuple[str, str, str]:
    return (normalized_key(job.title), _company_key(job.company), _location_key(job.location))


def _is_cross_platform_duplicate(job: NormalizedJob, existing: NormalizedJob, threshold: float, title_threshold: float) -> bool:
    title_sim = sequence_similarity(job.title, existing.title)
    company_same = _company_key(job.company) == _company_key(existing.company)
    same_city = bool(_location_key(job.location) and _location_key(job.location) == _location_key(existing.location))
    desc_sim = description_similarity(job.description, existing.description)

    if company_same and same_city and title_sim >= title_threshold:
        return True
    if company_same and title_sim >= 0.82 and desc_sim >= threshold:
        return True
    if title_sim >= 0.92 and desc_sim >= threshold:
        return True
    return False


def deduplicate_jobs(jobs: list[NormalizedJob], threshold: float = 0.88, title_threshold: float = 0.90) -> tuple[list[NormalizedJob], int]:
    """Remove duplicates using canonical links and cross-platform fuzzy matching.

    The algorithm remains deterministic and CPU-friendly: it first checks exact
    normalized links and entity keys, then compares new records only against
    already-kept jobs using title/company/location/description similarity.
    """
    seen_links: set[str] = set()
    seen_entity_keys: dict[tuple[str, str, str], NormalizedJob] = {}
    kept: list[NormalizedJob] = []
    duplicates = 0

    for job in jobs:
        link_key = canonical_link(job.link)
        if link_key and link_key in seen_links:
            duplicates += 1
            continue

        entity_key = _exact_entity_key(job)
        existing = seen_entity_keys.get(entity_key)
        if existing is not None:
            duplicates += 1
            continue

        if any(_is_cross_platform_duplicate(job, candidate, threshold, title_threshold) for candidate in kept):
            duplicates += 1
            continue

        if link_key:
            seen_links.add(link_key)
        seen_entity_keys[entity_key] = job
        kept.append(job)

    return kept, duplicates
