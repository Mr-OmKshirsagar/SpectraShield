def detect_ai_pattern(text: str) -> float:
    sentences = text.split(".")
    avg_length = sum(len(s) for s in sentences) / max(len(sentences), 1)

    score = 0

    if avg_length > 120:
        score += 30

    if text.lower().count("dear customer") > 1:
        score += 20

    if text.count("\n") > 10:
        score += 20

    return min(score, 100)
