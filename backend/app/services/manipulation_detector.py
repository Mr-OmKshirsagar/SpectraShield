urgency_words = ["urgent", "immediately", "act now", "within 24 hours"]
fear_words = ["suspended", "blocked", "legal action", "security alert"]
authority_words = ["official", "admin", "support team", "security department"]
scarcity_words = ["limited time", "expires today", "only few hours"]

def calculate_manipulation_score(text: str):
    text_lower = text.lower()

    score = 0
    flagged_phrases = []

    urgency = 0
    fear = 0
    authority = 0
    scarcity = 0

    for word in urgency_words:
        if word in text_lower:
            urgency += 1
            score += 15
            flagged_phrases.append(word)

    for word in fear_words:
        if word in text_lower:
            fear += 1
            score += 20
            flagged_phrases.append(word)

    for word in authority_words:
        if word in text_lower:
            authority += 1
            score += 10
            flagged_phrases.append(word)

    for word in scarcity_words:
        if word in text_lower:
            scarcity += 1
            score += 15
            flagged_phrases.append(word)

    psychological_index = {
        "urgency": min(urgency * 25, 100),
        "fear": min(fear * 25, 100),
        "authority": min(authority * 25, 100),
        "scarcity": min(scarcity * 25, 100),
    }

    return min(score, 100), list(set(flagged_phrases)), psychological_index