from pydantic import BaseModel
from typing import Optional, Dict, List

# 🔥 DEFINE SimulationStep FIRST
class SimulationStep(BaseModel):
    step: int
    title: str
    description: str


class EmailRequest(BaseModel):
    email_text: str = ""
    email_header: Optional[str] = None
    url: Optional[str] = None
    urls: Optional[List[str]] = None
    sender_email: Optional[str] = None
    private_mode: Optional[bool] = False


class EmailResponse(BaseModel):
    final_risk: float
    verdict: str
    confidence_level: str
    breakdown: Dict[str, float]
    highlighted_phrases: Optional[List[str]] = None
    domain_age_days: Optional[int] = None
    attack_simulation: Optional[List[SimulationStep]] = None

