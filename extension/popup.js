const API_BASE = 'http://localhost:8000';

const emailText = document.getElementById('emailText');
const url = document.getElementById('url');
const sender = document.getElementById('sender');
const privateMode = document.getElementById('privateMode');
const analyzeBtn = document.getElementById('analyzeBtn');
const result = document.getElementById('result');
const error = document.getElementById('error');
const riskValue = document.getElementById('riskValue');
const verdictEl = document.getElementById('verdict');
const confidenceEl = document.getElementById('confidence');
const categoryEl = document.getElementById('category');
const reasoningEl = document.getElementById('reasoning');

function showResult(data) {
  result.classList.remove('hidden');
  error.classList.add('hidden');
  const risk = Math.round(data.final_risk);
  riskValue.textContent = risk + '%';
  riskValue.className = 'risk-value ' + (risk >= 70 ? 'danger' : risk >= 30 ? 'warn' : 'safe');
  verdictEl.textContent = data.verdict || '—';
  confidenceEl.textContent = data.confidence_level || '—';
  categoryEl.textContent = data.threat_category || '—';
  reasoningEl.textContent = data.reasoning_summary || '';
}

function showErr(msg) {
  error.classList.remove('hidden');
  error.textContent = msg;
  result.classList.add('hidden');
}

analyzeBtn.addEventListener('click', async () => {
  const text = (emailText.value || '').trim();
  if (!text) {
    showErr('Enter email content.');
    return;
  }
  analyzeBtn.disabled = true;
  error.classList.add('hidden');
  try {
    const res = await fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_text: text,
        url: (url.value || '').trim() || undefined,
        sender_email: (sender.value || '').trim() || undefined,
        private_mode: privateMode.checked,
      }),
    });
    if (!res.ok) throw new Error('Backend error: ' + res.status);
    const data = await res.json();
    showResult(data);
  } catch (e) {
    showErr(e.message || 'Cannot reach backend. Is it running on localhost:8000?');
  } finally {
    analyzeBtn.disabled = false;
  }
});
