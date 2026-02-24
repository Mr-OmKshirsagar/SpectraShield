def fuse_risk_scores(manipulation, url, ai_pattern, brand):

    # Base weighted score
    base_score = (
        manipulation * 0.30 +
        url * 0.35 +
        ai_pattern * 0.15 +
        brand * 0.20
    )

    # 🔥 Strong signal escalation rules
    if url >= 60:
        base_score += 15

    if manipulation >= 40:
        base_score += 15

    if brand >= 50:
        base_score += 20

    # 🔥 Combination escalation
    if url >= 60 and manipulation >= 15:
        base_score += 20

    final_score = min(base_score, 100)

    # 🔥 More realistic classification
    if final_score >= 75:
        verdict = "High Risk"
        confidence = "Very High Confidence"
    elif final_score >= 50:
        verdict = "High Risk"
        confidence = "High Confidence"
    elif final_score >= 35:
        verdict = "Medium Risk"
        confidence = "Moderate Confidence"
    else:
        verdict = "Low Risk"
        confidence = "Low Confidence"

    return round(final_score, 2), verdict, confidence
