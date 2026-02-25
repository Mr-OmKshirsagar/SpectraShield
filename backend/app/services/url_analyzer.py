from urllib.parse import urlparse

from app.database import threat_feed_collection, vt_cache_collection
from app.scanner import URLIntelligenceEngine

known_safe_domains = [
    "google.com",
    "accounts.google.com",
    "amazon.com",
    "paypal.com",
    "college.edu",
    "company.com",
]

_engine = URLIntelligenceEngine(threat_feed_collection, vt_cache_collection=vt_cache_collection)


def extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc if parsed.netloc else url


def analyze_url(url: str):
    """
    Returns:
      (url_score, url_metadata)

    `url_score` stays a numeric 0-100 for frontend compatibility.
    `url_metadata` includes an `intel` payload with explainable evidence.
    """
    if not url:
        return 0, {"domain_age_days": None, "intel": None}

    domain = extract_domain(url)
    domain_age_days = 4000 if any(safe in domain for safe in known_safe_domains) else 30

    intel = _engine.analyze(url)
    return intel["score"], {
        "domain_age_days": domain_age_days,
        "intel": intel,
    }
