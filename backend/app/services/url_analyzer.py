import re
from urllib.parse import urlparse

suspicious_tlds = [".xyz", ".top", ".gq", ".tk"]
known_safe_domains = [
    "google.com",
    "accounts.google.com",
    "amazon.com",
    "paypal.com",
    "college.edu",
    "company.com"
]


def extract_domain(url):
    parsed = urlparse(url)
    return parsed.netloc if parsed.netloc else url

def analyze_url(url: str):
    if not url:
        return 0, {"domain_age_days": None}

    score = 0
    domain_age_days = None

    domain = extract_domain(url)

    # Suspicious TLD
    for tld in suspicious_tlds:
        if tld in domain:
            score += 30

    # Excess hyphens
    if domain.count("-") > 2:
        score += 20

    # IP-based URL
    if re.search(r"\d+\.\d+\.\d+\.\d+", domain):
        score += 40

    # Simulated domain age logic
    if any(safe in domain for safe in known_safe_domains):
        domain_age_days = 4000
        score -= 20  # reduce suspicion
    else:
        domain_age_days = 30
        score += 30
    
    score = max(score, 0)


    return min(score, 100), {
        "domain_age_days": domain_age_days
    }
