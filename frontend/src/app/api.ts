/**
 * Frontend API client for SpectraShield backend.
 * Base URL: VITE_API_URL or http://localhost:8000
 */

const getApiBase = (): string => {
  return (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:8000";
};

export interface AnalyzeRequest {
  email_text: string;
  email_header?: string | null;
  url?: string | null;
  sender_email?: string | null;
  private_mode?: boolean;
}

export interface AnalyzeResponse {
  final_risk: number;
  verdict: string;
  confidence_level: string;
  threat_category?: string;
  reasoning_summary?: string;
  breakdown: {
    manipulation_score: number;
    url_score: number;
    ai_generated_score: number;
    brand_impersonation_score: number;
    header_score: number;
  };
  psychological_index?: number;
  highlighted_phrases?: string[] | null;
  domain_age_days?: number | null;
  header_analysis?: unknown;
  threat_intel?: unknown;
  attack_simulation?: unknown;
}

export interface HistoryRecord {
  id: string;
  final_risk: number;
  verdict: string;
  confidence_level: string;
  threat_category?: string;
  timestamp: string;
}

export async function analyzeEmail(body: AnalyzeRequest): Promise<AnalyzeResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analyze failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getHistory(): Promise<HistoryRecord[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/history`);
  if (!res.ok) throw new Error(`History failed: ${res.status}`);
  return res.json();
}

export async function clearHistory(): Promise<{ message: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/history`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Clear history failed: ${res.status}`);
  return res.json();
}

export async function deleteScan(scanId: string): Promise<{ message: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/history/${encodeURIComponent(scanId)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete scan failed: ${res.status}`);
  return res.json();
}
