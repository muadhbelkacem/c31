"""Field normalization and text cleaning utilities."""
from __future__ import annotations

import html
import re
from hashlib import sha1
from typing import Any

from .schemas import NormalizedJob

FIELD_ALIASES = {
    "title": ("title", "job_title", "position", "role", "name"),
    "company": ("company", "employer", "organization", "company_name"),
    "description": ("description", "job_description", "summary", "details", "content"),
    "location": ("location", "city", "job_location", "place"),
    "link": ("original_apply_link", "apply_url", "link", "url", "platform_link"),
    "salary": ("salary", "compensation", "pay", "wage"),
    "job_age": ("job_age", "date_posted", "posted_date", "posted", "age", "scrape_date", "scraped_date"),
    "platform": ("platform", "source", "site"),
}

BOILERPLATE_PATTERNS = [
    r"apply now\b.*$",
    r"equal opportunity employer.*$",
    r"we are an equal opportunity employer.*$",
    r"by applying.*privacy policy.*$",
    r"create a job alert.*$",
    r"sign in to save.*$",
]


def first_value(record: dict[str, Any], aliases: tuple[str, ...]) -> str:
    """Return the first non-empty string-like value among candidate aliases."""
    for key in aliases:
        value = record.get(key)
        if value is None:
            continue
        if isinstance(value, (list, tuple)):
            value = ", ".join(str(v) for v in value if v is not None)
        value = str(value).strip()
        if value and value.lower() not in {"none", "null", "nan", "n/a"}:
            return value
    return ""


def remove_html(text: str) -> str:
    """Remove HTML tags and decode HTML entities."""
    text = html.unescape(str(text or ""))
    text = re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
    return re.sub(r"<[^>]+>", " ", text)


def normalize_whitespace(text: str) -> str:
    """Collapse repeated whitespace."""
    return re.sub(r"\s+", " ", str(text or "")).strip()


def remove_urls(text: str) -> str:
    """Remove URLs from text fields where URLs add noise."""
    return re.sub(r"https?://\S+|www\.\S+", " ", text)


def reduce_repeated_boilerplate(text: str) -> str:
    """Remove repeated lines and common job-board boilerplate phrases."""
    lines = [normalize_whitespace(line) for line in re.split(r"[\r\n]+", text)]
    seen: set[str] = set()
    kept: list[str] = []
    for line in lines:
        if not line:
            continue
        key = line.lower()
        if key in seen:
            continue
        seen.add(key)
        kept.append(line)
    reduced = " ".join(kept)
    for pattern in BOILERPLATE_PATTERNS:
        reduced = re.sub(pattern, " ", reduced, flags=re.I | re.S)
    return normalize_whitespace(reduced)


def clean_description(text: str) -> str:
    """Clean description while preserving useful punctuation for skill matching."""
    text = remove_html(text)
    text = remove_urls(text)
    text = reduce_repeated_boilerplate(text)
    text = re.sub(r"[^\w\s\-\+\#\./,():;]", " ", text, flags=re.UNICODE)
    return normalize_whitespace(text)


def normalize_title(text: str) -> str:
    """Clean and normalize a job title."""
    text = remove_html(text)
    text = remove_urls(text)
    text = re.sub(r"\s*[\-|–|—]\s*(apply now|urgent|new)\b.*$", "", text, flags=re.I)
    return normalize_whitespace(text).title()


def normalize_company(text: str) -> str:
    """Clean company names without over-normalizing legal suffixes."""
    text = remove_html(text)
    text = re.sub(r"\s+", " ", text).strip(" -|,")
    return normalize_whitespace(text)


def normalize_location(text: str) -> str:
    """Clean location strings."""
    text = remove_html(text)
    text = re.sub(r"\b(remote|hybrid)\b", lambda m: m.group(1).title(), text, flags=re.I)
    return normalize_whitespace(text).strip(" ,-") or "Not specified"


def clean_salary(text: str) -> str:
    """Normalize salary/compensation field."""
    text = remove_html(text)
    text = normalize_whitespace(text)
    text = re.sub(r"\s+(a|per)\s+", "/", text, flags=re.I)
    return text


def stable_id(parts: list[str]) -> str:
    """Create a deterministic ID from important fields."""
    joined = "|".join(p.strip().lower() for p in parts if p)
    return sha1(joined.encode("utf-8")).hexdigest()[:16]


def normalize_record(record: dict[str, Any], index: int) -> NormalizedJob:
    """Map inconsistent scraped fields to the canonical job schema."""
    title = normalize_title(first_value(record, FIELD_ALIASES["title"]))
    company = normalize_company(first_value(record, FIELD_ALIASES["company"]))
    description = clean_description(first_value(record, FIELD_ALIASES["description"]))
    location = normalize_location(first_value(record, FIELD_ALIASES["location"]))
    link = normalize_whitespace(first_value(record, FIELD_ALIASES["link"]))
    salary = clean_salary(first_value(record, FIELD_ALIASES["salary"]))
    job_age = normalize_whitespace(first_value(record, FIELD_ALIASES["job_age"]))
    platform = normalize_whitespace(first_value(record, FIELD_ALIASES["platform"]))
    source_id = normalize_whitespace(str(record.get("id") or record.get("job_id") or ""))
    if not source_id:
        source_id = stable_id([title, company, location, link, description[:120], str(index)])
    return NormalizedJob(
        source_index=index,
        source_id=source_id,
        title=title,
        company=company,
        location=location,
        link=link,
        salary=salary,
        description=description,
        job_age=job_age,
        platform=platform,
        raw=record,
    )


def normalized_key(text: str) -> str:
    """Lowercase alphanumeric key for matching and deduplication."""
    return re.sub(r"[^a-z0-9]+", " ", str(text or "").lower()).strip()
