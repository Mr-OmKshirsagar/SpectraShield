def analyze_threat_intel(header_text: str):
    if not header_text:
        return 0, {
            "ip_reputation": "Unknown",
            "country": "Unknown",
            "blacklisted": False
        }

    header_lower = header_text.lower()
    score = 0

    # Fake suspicious IP detection
    suspicious_ips = ["185.", "103.", "45."]

    ip_reputation = "Clean"
    country = "Safe Region"
    blacklisted = False

    for ip_prefix in suspicious_ips:
        if ip_prefix in header_lower:
            ip_reputation = "Suspicious"
            country = "High-Risk Region"
            blacklisted = True
            score += 40
            break

    return score, {
        "ip_reputation": ip_reputation,
        "country": country,
        "blacklisted": blacklisted
    }