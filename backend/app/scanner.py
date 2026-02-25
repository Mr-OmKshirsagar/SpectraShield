from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable, Literal, Optional
from urllib.parse import urlparse
import os
import base64
import socket
import ssl
from datetime import datetime, timedelta, timezone

import requests

from app.services.brand_detector import detect_brand_impersonation
from app.services.manipulation_detector import calculate_manipulation_score

try:
    import tldextract  # for robust domain parsing
except ImportError:  # pragma: no cover - optional dependency
    tldextract = None

try:
    import dns.resolver  # optional, for raw DNS records
except ImportError:  # pragma: no cover
    dns = None

try:
    import whois  # optional, for domain age
except ImportError:  # pragma: no cover
    whois = None


EvidenceType = Literal["reputation", "structural", "brand"]
Verdict = Literal["Safe", "Suspicious", "Malicious"]


HIGH_RISK_TLDS = {".top", ".xyz", ".tk", ".gq"}
DEFAULT_PROTECTED_BRANDS = [
    "google",
    "microsoft",
    "amazon",
    "paypal",
    "apple",
    "netflix",
    "facebook",
    "linkedin",
]


def _levenshtein(a: str, b: str) -> int:
    # Small-string DP, no external dependency.
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        current = [i]
        for j, cb in enumerate(b, start=1):
            insert = current[j - 1] + 1
            delete = previous[j] + 1
            replace = previous[j - 1] + (0 if ca == cb else 1)
            current.append(min(insert, delete, replace))
        previous = current
    return previous[-1]


def _ensure_scheme(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return u
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", u):
        return u
    return "http://" + u


def _hostname_from_url(url: str) -> str:
    parsed = urlparse(_ensure_scheme(url))
    host = parsed.netloc or parsed.path.split("/")[0]
    host = host.split("@")[-1]  # remove userinfo if present
    host = host.split(":")[0]  # remove port
    return host.lower()

def _clean_domain(url: str) -> str:
    """
    Normalization step:
    - lowercase
    - remove http://, https://, and www.
    - split by '/' and keep only host part
    """
    u = (url or "").strip().lower()
    u = re.sub(r"^https?://", "", u)
    if u.startswith("www."):
        u = u[4:]
    host = u.split("/")[0]
    return host

def _primary_domain(clean_domain: str) -> str:
    """
    Best-effort primary domain extraction without PSL.
    Uses the last two labels (e.g. 'secure-login.com').
    """
    host = (clean_domain or "").split("@")[-1].split(":")[0]
    parts = [p for p in host.split(".") if p]
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return host

def get_vt_url_id(url: str):
    """
    Standard VirusTotal v3 URL identifier format.
    Encodes the URL to base64 and removes the '=' padding.
    """
    return base64.urlsafe_b64encode(url.encode()).decode().strip("=")


def _subdomain_depth(host: str) -> int:
    if not host:
        return 0
    return len([p for p in host.split(".") if p])


@dataclass(frozen=True)
class EvidenceItem:
    type: EvidenceType
    label: str
    description: str


class URLIntelligenceEngine:
    """
    Explainable URL intelligence with layered scoring.
    """

    def __init__(
        self,
        threat_feed_collection,
        vt_cache_collection=None,
        protected_brands: Optional[Iterable[str]] = None,
        high_risk_tlds: Optional[Iterable[str]] = None,
    ):
        self.threat_feed = threat_feed_collection
        self.vt_cache = vt_cache_collection
        self.protected_brands = [b.lower() for b in (protected_brands or DEFAULT_PROTECTED_BRANDS)]
        # include .ml as a high-risk TLD for phishing
        default_tlds = set(HIGH_RISK_TLDS) | {".ml"}
        self.high_risk_tlds = {t.lower() for t in (high_risk_tlds or default_tlds)}

    def _vt_cached_lookup(self, url: str) -> Optional[dict]:
        api_key = os.getenv("VT_API_KEY")
        if not api_key or self.vt_cache is None:
            return None

        now = datetime.now(timezone.utc)
        cached = self.vt_cache.find_one({"url": url}, {"_id": 0})
        if cached and cached.get("fetched_at"):
            cached_dt = cached["fetched_at"]
            # Normalize to timezone-aware to avoid TypeError on comparison
            if getattr(cached_dt, "tzinfo", None) is None:
                cached_dt = cached_dt.replace(tzinfo=timezone.utc)
            if cached_dt > (now - timedelta(hours=24)):
                return cached.get("result")

        # VT v3 URL ID is base64url(url) without '=' padding
        url_id = get_vt_url_id(url)
        headers = {"x-apikey": api_key}

        vt_result = None
        try:
            r = requests.get(f"https://www.virustotal.com/api/v3/urls/{url_id}", headers=headers, timeout=20)
            if r.status_code == 200:
                vt_result = r.json()
            else:
                # If it's not in VT yet, submit it (best-effort). We won't block on polling.
                requests.post("https://www.virustotal.com/api/v3/urls", headers=headers, data={"url": url}, timeout=20)
        except Exception:
            vt_result = None

        try:
            self.vt_cache.update_one(
                {"url": url},
                {"$set": {"url": url, "fetched_at": now, "result": vt_result}},
                upsert=True,
            )
        except Exception:
            pass

        return vt_result

    def _vt_malicious_engines(self, vt_json: dict) -> int:
        try:
            stats = vt_json.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            return int(stats.get("malicious", 0))
        except Exception:
            return 0

    def get_vt_stats(self, url: str) -> dict:
        vt_json = self._vt_cached_lookup(url)
        if not vt_json:
            return {"malicious": 0, "total": 70}
        try:
            stats = vt_json.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            malicious = int(stats.get("malicious", 0))
            total = int(
                stats.get("harmless", 0)
                + stats.get("malicious", 0)
                + stats.get("suspicious", 0)
                + stats.get("undetected", 0)
                + stats.get("timeout", 0)
            )
            if total <= 0:
                total = 70
            return {"malicious": malicious, "total": total}
        except Exception:
            return {"malicious": 0, "total": 70}

    def analyze(self, url: str) -> dict:
        raw = (url or "").strip()
        raw_lower = raw.lower()
        clean_domain = _clean_domain(raw)
        host = _hostname_from_url(raw)
        primary = _primary_domain(clean_domain)
        primary_parts = [p for p in primary.split(".") if p]
        primary_sld = primary_parts[-2] if len(primary_parts) >= 2 else primary

        # If tldextract is available, prefer its parsed domain for brand checks
        brand_sld = primary_sld
        if tldextract is not None and clean_domain:
            try:
                ext = tldextract.extract(clean_domain)
                if ext.domain:
                    brand_sld = ext.domain
            except Exception:
                pass

        evidence: list[dict] = []
        score = 0.0
        brand_flagged = False
        high_risk_tld_used = False

        # LAYER 1 — Reputation
        if raw:
            found = self.threat_feed.find_one({"url": raw}, {"_id": 0, "url": 1})
            if found:
                return {
                    "score": 100.0,
                    "verdict": "Malicious",
                    "evidence": [
                        {
                            "type": "reputation",
                            "label": "Verified malicious",
                            "description": "Verified malicious on OpenPhish global feed.",
                        }
                    ],
                }

        # LAYER 2 — Structure
        if "@" in raw:
            # Redirection trick / obfuscated URL
            score += 60
            evidence.append(
                EvidenceItem(
                    type="structural",
                    label="Obfuscated URL",
                    description="Critical: URL contains '@', a strong indicator of deceptive redirection.",
                ).__dict__
            )

        if host and re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host):
            score += 40
            evidence.append(
                EvidenceItem(
                    type="structural",
                    label="IP-based host",
                    description="URL uses an IP address instead of a domain name.",
                ).__dict__
            )

        # IP + login/verify keywords (aggressive combination)
        if host and re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host) and ("login" in raw_lower or "verify" in raw_lower):
            score = max(score, 90.0)
            evidence.append(
                EvidenceItem(
                    type="structural",
                    label="IP + credential lure",
                    description="Critical: IP-based URL combined with credential-lure keywords (login/verify).",
                ).__dict__
            )

        depth = _subdomain_depth(host)
        if depth >= 5:
            score += 20
            evidence.append(
                EvidenceItem(
                    type="structural",
                    label="Excessive subdomains",
                    description=f"Hostname has {depth} labels which can indicate deceptive subdomain nesting.",
                ).__dict__
            )
        elif depth == 4:
            score += 10
            evidence.append(
                EvidenceItem(
                    type="structural",
                    label="Deep subdomain nesting",
                    description=f"Hostname has {depth} labels which may indicate suspicious nesting.",
                ).__dict__
            )

        # LAYER 3 — Brand mimicry / typosquatting
        # Use normalized SLD for fuzzy matching, stripping helper suffixes.
        def _normalize_brand_sld(s: str) -> str:
            if not s:
                return s
            base = s.lower()
            # remove common suffixes like -support, -login, -verify, -secure, -update
            base = re.sub(r"[-_\.](support|login|verify|secure|update)$", "", base)
            return base

        norm_sld = _normalize_brand_sld(brand_sld)
        if norm_sld:
            for brand in self.protected_brands:
                d = _levenshtein(norm_sld, brand)
                if d <= 2 and norm_sld != brand:
                    # Aggressive fix: strong brand typosquatting should score at least 90
                    score = max(score, 90.0)
                    brand_flagged = True
                    evidence.append(
                        EvidenceItem(
                            type="brand",
                            label="Brand impersonation",
                            description="Critical: Brand Impersonation detected via fuzzy matching.",
                        ).__dict__
                    )
                    break

        # SUBDOMAIN HIJACK DETECTION:
        # Brand appears anywhere in clean_domain but is not the actual primary domain.
        if clean_domain and norm_sld:
            for brand in self.protected_brands:
                if brand in clean_domain and norm_sld != brand:
                    score += 75
                    brand_flagged = True
                    evidence.append(
                        EvidenceItem(
                            type="brand",
                            label="Subdomain spoofing",
                            description="Critical: Domain spoofing detected via subdomain manipulation.",
                        ).__dict__
                    )
                    break

        # LAYER 4 — Metadata (high-risk TLD)
        for tld in self.high_risk_tlds:
            if clean_domain.endswith(tld) or host.endswith(tld):
                score += 20
                high_risk_tld_used = True
                evidence.append(
                    EvidenceItem(
                        type="structural",
                        label="High-risk TLD",
                        description="Warning: Use of high-risk Top Level Domain associated with phishing.",
                    ).__dict__
                )
                break

        # AGGRESSIVE COMBINATIONS (override-style scoring)
        # If (Brand Mimicry OR Subdomain Hijack) AND (High-Risk TLD), force near-certain malicious.
        if brand_flagged and high_risk_tld_used:
            score = max(score, 95.0)

        # If URL contains '@', force a high score.
        if "@" in raw:
            score = max(score, 85.0)

        # VirusTotal "Truth Engine"
        vt_json = self._vt_cached_lookup(raw) if raw else None
        if vt_json:
            m = self._vt_malicious_engines(vt_json)
            if m > 2:
                score = 100.0
                evidence.insert(
                    0,
                    EvidenceItem(
                        type="reputation",
                        label="VirusTotal verdict",
                        description=f"Critical: VirusTotal reports the URL as malicious ({m} engines).",
                    ).__dict__,
                )
            elif m == 1:
                score += 40.0
                evidence.append(
                    EvidenceItem(
                        type="reputation",
                        label="VirusTotal signal",
                        description="Warning: VirusTotal has a single malicious engine hit (low-confidence corroboration).",
                    ).__dict__
                )

        score = float(min(max(score, 0.0), 100.0))
        # Updated verdict bands:
        # 0–30   -> Safe
        # 31–60  -> Suspicious
        # 61–100 -> Malicious
        if score <= 30:
            verdict: Verdict = "Safe"
        elif score <= 60:
            verdict = "Suspicious"
        else:
            verdict = "Malicious"

        # If combination attack triggered, force a Malicious verdict explicitly.
        if brand_flagged and high_risk_tld_used:
            verdict = "Malicious"

        return {"score": score, "verdict": verdict, "evidence": evidence}


def compute_mail_severity(url_findings: list[dict]) -> dict:
    """
    Derive mail-level severity from link-level intelligence.
    The most dangerous link drives the severity score.
    """
    if not url_findings:
        return {
            "mail_severity_score": 0.0,
            "most_dangerous_link": None,
            "malicious_links": 0,
            "suspicious_links": 0,
            "safe_links": 0,
            "summary_reason": "No links found in opened email body.",
        }

    sorted_findings = sorted(
        [f for f in url_findings if isinstance(f, dict)],
        key=lambda item: float(item.get("score") or 0),
        reverse=True,
    )

    malicious_links = 0
    suspicious_links = 0
    safe_links = 0

    for finding in sorted_findings:
        score = float(finding.get("score") or 0)
        if score >= 61:
            malicious_links += 1
        elif score >= 31:
            suspicious_links += 1
        else:
            safe_links += 1

    top = sorted_findings[0]
    top_url = top.get("url")
    top_score = float(top.get("score") or 0)

    if malicious_links > 0:
        reason = f"Found {malicious_links} phishing link{'s' if malicious_links != 1 else ''} in body."
    elif suspicious_links > 0:
        reason = f"Found {suspicious_links} suspicious link{'s' if suspicious_links != 1 else ''} in body."
    else:
        reason = "Body links appear safe based on current signals."

    return {
        "mail_severity_score": top_score,
        "most_dangerous_link": top_url,
        "malicious_links": malicious_links,
        "suspicious_links": suspicious_links,
        "safe_links": safe_links,
        "summary_reason": reason,
    }


class HybridConsensusScanner:
    """
    Hybrid scanning pipeline with consensus logic:
    1) Hardcoded checks (brand + manipulation)
    2) External validation (VirusTotal via cached URL intelligence)
    3) Unified score fusion
    """

    def __init__(self, threat_feed_collection, vt_cache_collection=None):
        self.engine = URLIntelligenceEngine(
            threat_feed_collection,
            vt_cache_collection=vt_cache_collection,
        )
        self._brands = [b.lower() for b in DEFAULT_PROTECTED_BRANDS]

    def _url_brand_matches(self, urls: list[str]) -> list[str]:
        matches: list[str] = []
        for url in urls:
            host = _hostname_from_url(url)
            clean = _clean_domain(host)
            primary = _primary_domain(clean)
            parts = [p for p in primary.split(".") if p]
            sld = parts[-2] if len(parts) >= 2 else primary
            for brand in self._brands:
                distance = _levenshtein((sld or "").lower(), brand)
                if distance <= 2 and (sld or "").lower() != brand:
                    if brand not in matches:
                        matches.append(brand)
        return matches

    def _logic_flags(self, urls: list[str]) -> list[str]:
        flags: list[str] = []
        for url in urls:
            raw = (url or "").strip()
            host = _hostname_from_url(raw)
            if "@" in raw and "Hidden Redirection" not in flags:
                flags.append("Hidden Redirection")
            if host and re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host) and "IP Host" not in flags:
                flags.append("IP Host")
            if host and _subdomain_depth(host) >= 4 and "Deep Subdomain" not in flags:
                flags.append("Deep Subdomain")
        return flags

    def _ssl_details(self, hostname: str) -> dict:
        if not hostname:
            return {"issuer": "Unknown", "expiry_date": None, "is_valid": False}
        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=3) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert() or {}
            issuer = "Unknown"
            issuer_raw = cert.get("issuer")
            if issuer_raw and isinstance(issuer_raw, (list, tuple)):
                try:
                    flat = []
                    for item in issuer_raw:
                        for kv in item:
                            if isinstance(kv, tuple) and len(kv) == 2:
                                flat.append(f"{kv[0]}={kv[1]}")
                    if flat:
                        issuer = ", ".join(flat)
                except Exception:
                    issuer = str(issuer_raw)

            expiry_date = cert.get("notAfter")
            expiry_iso = None
            is_valid = False
            if expiry_date:
                try:
                    expiry_dt = datetime.strptime(expiry_date, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                    expiry_iso = expiry_dt.isoformat()
                    is_valid = expiry_dt > datetime.now(timezone.utc)
                except Exception:
                    is_valid = True

            return {"issuer": issuer, "expiry_date": expiry_iso, "is_valid": bool(is_valid)}
        except Exception:
            return {"issuer": "None", "expiry_date": None, "is_valid": False}

    def _ip_geo_details(self, hostname: str) -> dict:
        if not hostname:
            return {"ip_address": None, "country": "Unknown", "isp": "Unknown"}
        try:
            ip_addr = socket.gethostbyname(hostname)
        except Exception:
            return {"ip_address": None, "country": "Unknown", "isp": "Unknown"}

        country = "Unknown"
        isp = "Unknown"
        try:
            r = requests.get(
                f"http://ip-api.com/json/{ip_addr}?fields=status,country,isp,query",
                timeout=4,
            )
            if r.ok:
                data = r.json() or {}
                if data.get("status") == "success":
                    country = data.get("country") or "Unknown"
                    isp = data.get("isp") or "Unknown"
        except Exception:
            pass

        return {"ip_address": ip_addr, "country": country, "isp": isp}

    def _dns_records(self, hostname: str) -> dict:
        out = {"a": [], "mx": []}
        if not hostname or dns is None:
            return out

        try:
            answers = dns.resolver.resolve(hostname, "A")
            out["a"] = [str(a) for a in answers]
        except Exception:
            out["a"] = []

        try:
            answers = dns.resolver.resolve(hostname, "MX")
            out["mx"] = [str(mx.exchange).rstrip(".") for mx in answers]
        except Exception:
            out["mx"] = []

        return out

    def _whois_age(self, hostname: str) -> dict:
        out = {"domain_age_days": None, "whois_raw": {}}
        if not hostname or whois is None:
            return out

        try:
            w = whois.whois(hostname)
            created = None
            cd = w.creation_date
            if isinstance(cd, list) and cd:
                created = cd[0]
            elif cd:
                created = cd

            if created is not None and getattr(created, "tzinfo", None) is None:
                created = created.replace(tzinfo=timezone.utc)

            age_days = None
            if created is not None:
                age_days = max(0, (datetime.now(timezone.utc) - created).days)

            out = {
                "domain_age_days": age_days,
                "whois_raw": {
                    "registrar": str(getattr(w, "registrar", "") or ""),
                    "creation_date": created.isoformat() if created else None,
                    "expiration_date": str(getattr(w, "expiration_date", None) or ""),
                },
            }
        except Exception:
            pass

        return out

    def _page_title_redirects(self, url: str) -> dict:
        out = {
            "page_title": None,
            "redirect_chain": [],
            "redirect_hops": 0,
            "final_url": url,
        }
        if not url:
            return out

        try:
            r = requests.get(url, timeout=6, allow_redirects=True)
            history = [h.url for h in r.history] + [r.url]
            out["redirect_chain"] = history
            out["redirect_hops"] = max(len(history) - 1, 0)
            out["final_url"] = r.url

            text = r.text or ""
            match = re.search(r"<title[^>]*>(.*?)</title>", text, flags=re.IGNORECASE | re.DOTALL)
            if match:
                out["page_title"] = re.sub(r"\s+", " ", match.group(1)).strip()[:180]
        except Exception:
            pass

        return out

    def _ssl_age_signal(self, ssl_valid: bool, domain_age_days: Optional[int]) -> float:
        ssl_score = 100.0 if ssl_valid else 20.0
        if domain_age_days is None:
            age_score = 50.0
        elif domain_age_days >= 365:
            age_score = 100.0
        elif domain_age_days >= 90:
            age_score = 70.0
        elif domain_age_days >= 30:
            age_score = 45.0
        else:
            age_score = 20.0
        return (ssl_score + age_score) / 2.0

    def scan(self, email_text: str, sender_email: Optional[str], urls: Iterable[str]) -> dict:
        normalized_urls = []
        for u in list(urls or []):
            cu = (u or "").strip()
            if cu and cu not in normalized_urls:
                normalized_urls.append(cu)

        manipulation_score, flagged_phrases, psychological_index = calculate_manipulation_score(email_text or "")
        brand_detector_score = detect_brand_impersonation(email_text or "", sender_email or "")

        brand_matches = self._url_brand_matches(normalized_urls)
        logic_flags = self._logic_flags(normalized_urls)

        local_trigger = bool(brand_matches) or bool(logic_flags)
        local_score = 85.0 if local_trigger else float(max(manipulation_score, brand_detector_score, 15))

        url_findings: list[dict] = []
        highest_url_score = 0.0
        highest_url = None
        max_vt_malicious = 0
        vt_total_for_display = 70
        vt_external_score = 0.0

        for u in normalized_urls:
            intel = self.engine.analyze(u)
            vt_stats = self.engine.get_vt_stats(u)

            score = float(intel.get("score") or 0)
            if score >= highest_url_score:
                highest_url_score = score
                highest_url = u

            max_vt_malicious = max(max_vt_malicious, int(vt_stats.get("malicious", 0) or 0))
            vt_total_for_display = max(vt_total_for_display, int(vt_stats.get("total", 70) or 70))
            vt_ratio_score = min(100.0, (float(vt_stats.get("malicious", 0) or 0) / max(float(vt_stats.get("total", 70) or 70), 1.0)) * 100.0)
            vt_external_score = max(vt_external_score, vt_ratio_score)

            url_findings.append(
                {
                    "url": u,
                    "score": score,
                    "verdict": intel.get("verdict"),
                    "evidence": intel.get("evidence") or [],
                    "vt_malicious": int(vt_stats.get("malicious", 0) or 0),
                    "vt_total": int(vt_stats.get("total", 70) or 70),
                }
            )

        external_score = max(highest_url_score, vt_external_score) if normalized_urls else 0.0

        top_host = _hostname_from_url(highest_url) if highest_url else ""
        ssl_info = self._ssl_details(top_host)
        location = self._ip_geo_details(top_host)
        dns_records = self._dns_records(top_host)
        whois_meta = self._whois_age(top_host)
        page_meta = self._page_title_redirects(highest_url or "")
        ssl_age_score = self._ssl_age_signal(bool(ssl_info.get("is_valid")), whois_meta.get("domain_age_days"))

        adjusted_vt_score = external_score
        if local_score > 0 and external_score > 0 and abs(local_score - external_score) >= 25:
            adjusted_vt_score = (0.65 * local_score) + (0.35 * external_score)
            consensus_mode = "weighted_disagreement"
        else:
            consensus_mode = "weighted_consensus"

        unified_score = (0.4 * local_score) + (0.5 * adjusted_vt_score) + (0.1 * ssl_age_score)

        if max_vt_malicious > 2:
            unified_score = 100.0
            consensus_mode = "vt_override"

        if (not bool(ssl_info.get("is_valid"))) and bool(brand_matches):
            unified_score = max(unified_score, 91.0)
            consensus_mode = "ssl_brand_override"

        unified_score = float(min(max(round(unified_score, 2), 0.0), 100.0))

        if unified_score >= 75:
            verdict = "High Risk"
            confidence_level = "Very High Confidence"
        elif unified_score >= 35:
            verdict = "Medium Risk"
            confidence_level = "High Confidence"
        else:
            verdict = "Low Risk"
            confidence_level = "Moderate Confidence"

        if max_vt_malicious == 0 and unified_score < 35:
            confidence_level = "Low Confidence"

        detected_brand = brand_matches[0] if brand_matches else None
        if not detected_brand and brand_detector_score > 0:
            detected_brand = "Textual brand cue"

        threat_array = []
        if brand_matches:
            threat_array.append(f"Brand Mimicry: {brand_matches[0]}")
        for flag in logic_flags:
            threat_array.append(flag)
        for phrase in flagged_phrases:
            threat_array.append(f"Manipulation Phrase: {phrase}")
        if max_vt_malicious > 0:
            threat_array.append(f"VirusTotal: {max_vt_malicious}/{vt_total_for_display} engines flagged")

        intelligence_profile = {
            "ssl_status": {
                "issuer": ssl_info.get("issuer"),
                "expiry_date": ssl_info.get("expiry_date"),
                "is_valid": bool(ssl_info.get("is_valid")),
            },
            "location_data": {
                "country": location.get("country"),
                "isp": location.get("isp"),
                "ip_address": location.get("ip_address"),
            },
            "threat_array": threat_array,
            "advanced_technical_details": {
                "page_title": page_meta.get("page_title"),
                "domain_age_days": whois_meta.get("domain_age_days"),
                "redirect_chain": page_meta.get("redirect_chain") or [],
                "redirect_hops": int(page_meta.get("redirect_hops") or 0),
                "dns_records": dns_records,
                "whois": whois_meta.get("whois_raw") or {},
                "final_url": page_meta.get("final_url"),
            },
        }

        return {
            "unified_score": unified_score,
            "local_score": float(round(local_score, 2)),
            "external_score": float(round(external_score, 2)),
            "ssl_age_score": float(round(ssl_age_score, 2)),
            "consensus_mode": consensus_mode,
            "verdict": verdict,
            "confidence_level": confidence_level,
            "detected_brand": detected_brand,
            "brand_matches": brand_matches,
            "logic_flags": logic_flags,
            "flagged_phrases": flagged_phrases,
            "psychological_index": psychological_index,
            "vt_malicious_engines": max_vt_malicious,
            "vt_total_engines": vt_total_for_display,
            "highest_risk_url": highest_url,
            "url_findings": url_findings,
            "intelligence_profile": intelligence_profile,
        }

