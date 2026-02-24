def analyze_email_header(header_text: str):
    if not header_text:
        return 0, {
            "spf": "Not Provided",
            "dkim": "Not Provided",
            "dmarc": "Not Provided",
            "return_path_mismatch": False
        }

    header_lower = header_text.lower()
    score = 0

    spf_status = "Pass"
    dkim_status = "Pass"
    dmarc_status = "Pass"
    return_path_mismatch = False

    # SPF Check
    if "spf=fail" in header_lower or "received-spf: fail" in header_lower:
        spf_status = "Fail"
        score += 30

    # DKIM Check
    if "dkim=fail" in header_lower:
        dkim_status = "Fail"
        score += 25

    # DMARC Check
    if "dmarc=fail" in header_lower:
        dmarc_status = "Fail"
        score += 30

    # Return Path Mismatch Simulation
    if "return-path:" in header_lower and "from:" in header_lower:
        return_path = header_lower.split("return-path:")[1].split("\n")[0]
        from_field = header_lower.split("from:")[1].split("\n")[0]
        if return_path.strip() not in from_field.strip():
            return_path_mismatch = True
            score += 15

    return min(score, 100), {
        "spf": spf_status,
        "dkim": dkim_status,
        "dmarc": dmarc_status,
        "return_path_mismatch": return_path_mismatch
    }