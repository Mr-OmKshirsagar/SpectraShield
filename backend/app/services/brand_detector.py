known_brands = {
    "amazon": "amazon.com",
    "paypal": "paypal.com",
    "sbi": "sbi.co.in",
    "google": "google.com"
}

def detect_brand_impersonation(text: str, sender_email: str) -> float:
    text = text.lower()
    score = 0

    for brand, domain in known_brands.items():
        if brand in text:
            if sender_email and domain not in sender_email:
                score += 50

    return min(score, 100)
