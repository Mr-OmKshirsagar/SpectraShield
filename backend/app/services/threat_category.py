"""
Threat categorization layer: assign category from scoring patterns.
Used for explainable risk and hackathon MVP.
"""

from typing import List, Optional

THREAT_CATEGORIES = [
    "Credential Harvesting",
    "Brand Impersonation",
    "Financial Scam",
    "Account Takeover",
    "Urgency-Based Attack",
]


def get_threat_category(
    manipulation_score: float,
    url_score: float,
    brand_score: float,
    header_score: float,
    flagged_phrases: List[str],
) -> str:
    """
    Assign primary threat category from layer scores and flagged phrases.
    Returns one of THREAT_CATEGORIES.
    """
    phrases_lower = [p.lower() for p in (flagged_phrases or [])]
    text = " ".join(phrases_lower)

    # Dominant signals
    if brand_score >= 50 and (url_score >= 40 or "verify" in text or "account" in text):
        return "Brand Impersonation"
    if url_score >= 55 and (manipulation_score >= 30 or "click" in text or "link" in text):
        return "Credential Harvesting"
    if manipulation_score >= 45 and any(w in text for w in ["urgent", "immediately", "suspend", "lock", "action required"]):
        return "Urgency-Based Attack"
    if "payment" in text or "bank" in text or "card" in text or "refund" in text:
        if brand_score >= 30 or url_score >= 40:
            return "Financial Scam"
    if "account" in text and ("suspend" in text or "lock" in text or "verify" in text):
        return "Account Takeover"
    if brand_score >= 60:
        return "Brand Impersonation"
    if url_score >= 60:
        return "Credential Harvesting"
    if manipulation_score >= 50:
        return "Urgency-Based Attack"
    if header_score >= 50:
        return "Account Takeover"

    return "Urgency-Based Attack"  # default when mixed signals


def build_reasoning_summary(
    manipulation_score: float,
    url_score: float,
    brand_score: float,
    header_score: float,
    flagged_phrases: List[str],
    domain_age_days: Optional[int],
    verdict: str,
) -> str:
    """
    Build a short textual reasoning summary for the UI.
    """
    parts = []
    if manipulation_score >= 35:
        parts.append("Detected urgent or pressure language")
    if url_score >= 40:
        if domain_age_days is not None and domain_age_days < 30:
            parts.append("suspicious or very new domain")
        else:
            parts.append("suspicious URL or link risk")
    if brand_score >= 40:
        parts.append("possible brand or sender impersonation")
    if header_score >= 40:
        parts.append("suspicious or mismatched header indicators")
    if flagged_phrases:
        parts.append("flagged phrases in content")
    if not parts:
        return "No strong phishing indicators detected."
    return " ".join(parts).capitalize() + "."
