import asyncio
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import scan_collection, threat_feed_collection, vt_cache_collection
from app.routes import router
from app.scanner import HybridConsensusScanner, compute_mail_severity
from app.services.attack_simulator import generate_attack_simulation
from app.services.header_analyzer import analyze_email_header
from app.services.threat_category import build_reasoning_summary, get_threat_category
from app.services.threat_intel import analyze_threat_intel
from app.services.threat_intel import sync_openphish

logger = logging.getLogger("spectrashield.daily_pulse")
hybrid_scanner = HybridConsensusScanner(threat_feed_collection, vt_cache_collection=vt_cache_collection)

app = FastAPI(
    title="SpectraShield AI",
    description="Threat Intelligence Platform (phishing detection + explainable URL intel)",
    version="1.0.0",
    debug=True
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    class Config:
        extra = "allow"

    email_text: str = ""
    email_header: Optional[str] = None
    url: Optional[str] = None
    urls: Optional[list[str]] = None
    sender_email: Optional[str] = None
    private_mode: Optional[bool] = False
    thread_id: Optional[str] = None
    opened_mail_body: Optional[str] = None
    opened_mail_urls: Optional[list[str]] = None


def _score_to_verdict(score: float) -> str:
    if score >= 75:
        return "High Risk"
    if score >= 35:
        return "Medium Risk"
    return "Low Risk"


def _score_to_confidence(score: float) -> str:
    if score >= 75:
        return "Very High Confidence"
    if score >= 50:
        return "High Confidence"
    if score >= 35:
        return "Moderate Confidence"
    return "Low Confidence"


def _extract_urls_from_text(text: str) -> set[str]:
    if not text:
        return set()
    extracted = set()
    matches = re.findall(r'https?://[^\s\]\)\"\'<>]+', text, flags=re.IGNORECASE)
    for u in matches:
        cleaned_u = u.rstrip(']>).\'"')
        if cleaned_u:
            extracted.add(cleaned_u)
    return extracted


@app.post("/analyze")
def analyze_email(data: AnalyzeRequest):
    base_email_text = data.email_text or ""
    opened_mail_body = data.opened_mail_body or ""
    effective_email_text = "\n".join([t for t in [base_email_text, opened_mail_body] if t]).strip()

    if data.thread_id:
        cached = scan_collection.find_one(
            {
                "thread_id": data.thread_id,
                "confidence_level": {"$in": ["High Confidence", "Very High Confidence"]},
            },
            {"_id": 0},
        )
        if cached:
            cached["cached"] = True
            return cached

    gathered_urls: set[str] = set()
    if data.url:
        gathered_urls.add(data.url)
    if data.urls:
        gathered_urls.update([u for u in data.urls if u])
    if data.opened_mail_urls:
        gathered_urls.update([u for u in data.opened_mail_urls if u])

    gathered_urls.update(_extract_urls_from_text(effective_email_text))

    hybrid = hybrid_scanner.scan(
        email_text=effective_email_text,
        sender_email=data.sender_email,
        urls=list(gathered_urls),
    )

    intelligence_profile = hybrid.get("intelligence_profile") or {}
    technical_details = intelligence_profile.get("advanced_technical_details") or {}
    url_findings = hybrid.get("url_findings") or []
    url_score = float(hybrid.get("external_score") or 0)
    domain_age_days = technical_details.get("domain_age_days")

    header_score, header_details = analyze_email_header(data.email_header)
    threat_score, threat_details = analyze_threat_intel(data.email_header)

    mail_url_summary = compute_mail_severity(url_findings)
    mail_severity_score = float(mail_url_summary.get("mail_severity_score") or 0)
    final_risk = round(max(float(hybrid.get("unified_score") or 0), mail_severity_score), 2)
    verdict = _score_to_verdict(final_risk)
    confidence = _score_to_confidence(final_risk)

    attack_simulation = generate_attack_simulation(final_risk)

    threat_category = get_threat_category(
        float(hybrid.get("local_score") or 0),
        url_score,
        100.0 if hybrid.get("detected_brand") else 0.0,
        header_score,
        hybrid.get("flagged_phrases") or [],
    )

    reasoning_summary = build_reasoning_summary(
        float(hybrid.get("local_score") or 0),
        url_score,
        100.0 if hybrid.get("detected_brand") else 0.0,
        header_score,
        hybrid.get("flagged_phrases") or [],
        domain_age_days,
        verdict,
    )

    mail_reason = mail_url_summary.get("summary_reason")
    if mail_reason:
        reasoning_summary = f"{reasoning_summary} {mail_reason}".strip()

    response_payload = {
        "thread_id": data.thread_id,
        "final_risk": final_risk,
        "unified_severity_score": final_risk,
        "mail_severity_score": mail_severity_score,
        "verdict": verdict,
        "confidence_level": confidence,
        "threat_category": threat_category,
        "reasoning_summary": reasoning_summary,
        "consensus_mode": hybrid.get("consensus_mode"),
        "intelligence_profile": intelligence_profile,
        "threat_array": intelligence_profile.get("threat_array") or [],
        "open_mail_summary": {
            "malicious_links": mail_url_summary.get("malicious_links", 0),
            "suspicious_links": mail_url_summary.get("suspicious_links", 0),
            "safe_links": mail_url_summary.get("safe_links", 0),
            "most_dangerous_link": mail_url_summary.get("most_dangerous_link"),
            "reason": mail_reason,
        },
        "risk_breakdown": {
            "brand_match": hybrid.get("detected_brand") or "None",
            "logic_flags": hybrid.get("logic_flags") or [],
            "global_reputation": {
                "flagged": int(hybrid.get("vt_malicious_engines") or 0),
                "total": int(hybrid.get("vt_total_engines") or 70),
            },
            "local_score": float(hybrid.get("local_score") or 0),
            "external_score": float(hybrid.get("external_score") or 0),
            "ssl_age_score": float(hybrid.get("ssl_age_score") or 0),
        },
        "url_intelligence": (url_findings[0] if url_findings else None),
        "body_url_intelligence": url_findings,
        "breakdown": {
            "manipulation_score": float(hybrid.get("local_score") or 0),
            "url_score": url_score,
            "ai_generated_score": 0,
            "brand_impersonation_score": 100.0 if hybrid.get("detected_brand") else 0.0,
            "header_score": header_score,
        },
        "psychological_index": hybrid.get("psychological_index") or {},
        "highlighted_phrases": hybrid.get("flagged_phrases") or [],
        "domain_age_days": domain_age_days,
        "header_analysis": header_details,
        "threat_intel": threat_details,
        "attack_simulation": attack_simulation,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if data.thread_id:
        scan_collection.update_one(
            {"thread_id": data.thread_id},
            {
                "$set": {
                    **response_payload,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {
                    "id": str(uuid.uuid4())[:8],
                    "created_at": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )
    elif not data.private_mode:
        scan_collection.insert_one({
            "id": str(uuid.uuid4())[:8],
            **response_payload,
            "created_at": datetime.now(timezone.utc),
        })

    response_payload["cached"] = False
    return response_payload


app.include_router(router)


async def _daily_pulse_loop():
    while True:
        try:
            result = await sync_openphish()
            logger.info("OpenPhish sync complete: %s", result)
        except Exception:
            logger.exception("OpenPhish sync failed")
        await asyncio.sleep(24 * 60 * 60)


@app.on_event("startup")
async def start_daily_pulse():
    asyncio.create_task(_daily_pulse_loop())
