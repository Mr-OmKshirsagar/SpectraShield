from fastapi import APIRouter
from app.schemas import EmailRequest, EmailResponse
from app.services.manipulation_detector import calculate_manipulation_score
from app.services.url_analyzer import analyze_url
from app.services.ai_pattern_detector import detect_ai_pattern
from app.services.brand_detector import detect_brand_impersonation
from app.services.risk_fusion import fuse_risk_scores
from app.services.attack_simulator import generate_attack_simulation
from app.services.header_analyzer import analyze_email_header
from app.services.threat_intel import analyze_threat_intel
from app.services.threat_category import get_threat_category, build_reasoning_summary
from app.database import scan_collection
from datetime import datetime
import uuid


router = APIRouter()

@router.post("/analyze")
def analyze_email(data: EmailRequest):

    manipulation_score, flagged_phrases, psychological_index = calculate_manipulation_score(data.email_text)
    url_score, url_metadata = analyze_url(data.url) if data.url else (0, {})
    ai_score = detect_ai_pattern(data.email_text)
    brand_score = detect_brand_impersonation(data.email_text, data.sender_email)

    header_score, header_details = analyze_email_header(
    data.email_header
)
    
    threat_score, threat_details = analyze_threat_intel(
    data.email_header
)

    final_risk, verdict, confidence = fuse_risk_scores(
    manipulation_score,
    url_score,
    ai_score,
    brand_score + header_score + threat_score
)

    attack_simulation = generate_attack_simulation(final_risk)

    threat_category = get_threat_category(
        manipulation_score, url_score, brand_score, header_score,
        flagged_phrases or [],
    )
    domain_age_days = url_metadata.get("domain_age_days")
    reasoning_summary = build_reasoning_summary(
        manipulation_score, url_score, brand_score, header_score,
        flagged_phrases or [], domain_age_days, verdict,
    )

    scan_record = {
        "id": str(uuid.uuid4())[:8],
        "final_risk": final_risk,
        "verdict": verdict,
        "confidence_level": confidence,
        "threat_category": threat_category,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    # 🔒 Store only if private_mode is False
    # 🔒 Store only if private_mode is False

    if not data.private_mode:
        scan_collection.insert_one(scan_record)

    return {
        "final_risk": final_risk,
        "verdict": verdict,
        "confidence_level": confidence,
        "threat_category": threat_category,
        "reasoning_summary": reasoning_summary,
        "breakdown": {
            "manipulation_score": manipulation_score,
            "url_score": url_score,
            "ai_generated_score": ai_score,
            "brand_impersonation_score": brand_score,
            "header_score": header_score,
        },
        "psychological_index": psychological_index,
        "highlighted_phrases": flagged_phrases,
        "domain_age_days": domain_age_days,
        "header_analysis": header_details,
        "threat_intel": threat_details,
        "attack_simulation": attack_simulation,
    }

@router.get("/history")
def get_history():
    records = list(scan_collection.find({}, {"_id": 0}))
    return records[::-1]  # newest first

@router.delete("/history")
def clear_history():
    scan_collection.delete_many({})
    return {"message": "All logs cleared"}

@router.delete("/history/{scan_id}")
def delete_scan(scan_id: str):
    result = scan_collection.delete_one({"id": scan_id})
    if result.deleted_count == 1:
        return {"message": f"Scan {scan_id} deleted"}
    return {"message": "Scan ID not found"}