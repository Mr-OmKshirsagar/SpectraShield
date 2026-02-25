/**
 * SpectraShield Gmail content script.
 * - Extracts subject/sender only (privacy-first), calls backend with private_mode: true.
 * - Injects risk badges after each subject. Uses a cache so badges persist and reattach when Gmail recycles DOM on scroll.
 */

(function () {
  'use strict';

  var API_BASE = 'http://localhost:8000';
  var BADGE_ATTR = 'data-spectrashield-id';
  var processed = new Set();
  var cache = {};
  var debounceMs = 500;
  var scrollDebounceMs = 350;
  var debounceTimer;
  var scrollTimer;
  var openMailDebounceMs = 450;
  var openMailTimer;
  var threadMeta = {};
  var openMailCache = {};
  var openMailInFlight = new Set();
  var openMailSignatureByThread = {};

  // ---- Link-level (zero-touch) scanning ----
  var linkProcessed = new WeakSet();
  var urlCache = {}; // href -> { score, verdict, topReason, vtNote, ts }
  var urlCacheTtlMs = 10 * 60 * 1000;

  function scoreToLevel(score) {
    if (score >= 71) return 'malicious';
    if (score >= 31) return 'suspicious';
    return 'safe';
  }

  function topReasonFromIntel(intel) {
    try {
      var ev = intel && intel.evidence;
      if (ev && ev.length > 0) return ev[0].description || ev[0].label || '';
    } catch (_) {}
    return '';
  }

  function analyzeUrl(href) {
    var now = Date.now();
    var cached = urlCache[href];
    if (cached && (now - cached.ts) < urlCacheTtlMs) return Promise.resolve(cached);
    return fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_text: '',
        email_header: null,
        url: href,
        urls: [],
        sender_email: null,
        private_mode: true
      })
    }).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    }).then(function (data) {
      var intel = data.url_intelligence || null;
      var score = typeof data.final_score === 'number' ? data.final_score :
        (intel && typeof intel.score === 'number' ? intel.score :
          (data.breakdown && typeof data.breakdown.url_score === 'number' ? data.breakdown.url_score : 0));
      var verdict = intel && intel.verdict ? intel.verdict : (score >= 71 ? 'Malicious' : score >= 31 ? 'Suspicious' : 'Safe');
      var topReason = topReasonFromIntel(intel) || (data.reasoning_summary || '');
      var vtNote = '';
      try {
        if (intel && Array.isArray(intel.evidence)) {
          for (var i = 0; i < intel.evidence.length; i++) {
            var ev = intel.evidence[i];
            if (ev && ev.type === 'reputation' && ev.label && ev.label.indexOf('VirusTotal') !== -1) {
              vtNote = ev.description || ev.label;
              break;
            }
          }
        }
      } catch (_) {}
      var out = { score: Math.round(score || 0), verdict: verdict, topReason: topReason, vtNote: vtNote, ts: Date.now() };
      urlCache[href] = out;
      return out;
    });
  }

  function ensureLinkBadge(a, analysis) {
    // avoid breaking layout: insert small inline badge after the <a>
    if (!a || !a.parentNode) return;
    if (a.nextSibling && a.nextSibling.classList && a.nextSibling.classList.contains('spectrashield-link-badge')) return;

    var badge = document.createElement('span');
    badge.className = 'spectrashield-link-badge ' + scoreToLevel(analysis.score);
    badge.textContent = '🛡️';
    badge.setAttribute('aria-label', 'SpectraShield link risk badge');

    badge.addEventListener('mouseenter', function () {
      var tt = document.createElement('div');
      tt.className = 'spectrashield-link-tooltip';
      var status = analysis.verdict || (analysis.score >= 71 ? 'Malicious' : analysis.score >= 31 ? 'Suspicious' : 'Safe');
      var reason = analysis.topReason || 'No strong signals detected.';
      var vt = analysis.vtNote || 'VirusTotal: No verdict / not queried.';
      tt.innerHTML =
        '<div class="row"><div class="label">Status</div><div class="value">' + status + '</div></div>' +
        '<div class="row"><div class="label">Risk Score</div><div class="value">' + analysis.score + '%</div></div>' +
        '<div class="reason"><span class="label">Top Reason:</span> ' + reason + '</div>' +
        '<div class="reason"><span class="label">VirusTotal:</span> ' + vt + '</div>';
      document.body.appendChild(tt);
      var r = badge.getBoundingClientRect();
      tt.style.left = (r.left + r.width / 2) + 'px';
      tt.style.top = (r.top - 10) + 'px';
      tt.style.transform = 'translate(-50%, -100%)';
      badge._linktt = tt;
    });
    badge.addEventListener('mouseleave', function () {
      if (badge._linktt) { badge._linktt.remove(); badge._linktt = null; }
    });

    a.parentNode.insertBefore(badge, a.nextSibling);
  }

  function scanLinks(root) {
    var container = root || document;
    var targets = container.querySelectorAll('a[href]');
    for (var i = 0; i < targets.length; i++) {
      var a = targets[i];
      if (linkProcessed.has(a)) continue;
      var href = a.getAttribute('href') || '';
      if (!href) continue;
      if (/^(mailto:|javascript:|#)/i.test(href)) continue;
      if (!/^https?:\/\//i.test(href)) continue;

      linkProcessed.add(a);
      (function (anchor, u) {
        analyzeUrl(u).then(function (analysis) {
          ensureLinkBadge(anchor, analysis);
        }).catch(function () { /* ignore */ });
      })(a, href);
    }
  }

  // Scan typical email body containers (Gmail .a3s, Outlook .BodyFragment)
  function scanEmailBody(root) {
    var container = root || document;
    var bodies = container.querySelectorAll('.a3s, .BodyFragment');
    if (!bodies.length) {
      // Fallback: scan links in the whole document
      scanLinks(container);
      return;
    }
    for (var i = 0; i < bodies.length; i++) {
      scanLinks(bodies[i]);
    }
  }

  function getRowId(row) {
    var id = row.getAttribute('data-message-id') ||
      row.getAttribute('data-legacy-message-id') ||
      row.getAttribute('data-thread-id') ||
      (row.querySelector('[data-thread-id]') && row.querySelector('[data-thread-id]').getAttribute('data-thread-id')) ||
      row.getAttribute('data-id');
    if (id) return id;
    var sub = getSubject(row);
    var sender = getSender(row);
    if (sub && sub.text) return 'r-' + (sub.text.slice(0, 80) + (sender || '')).replace(/\s/g, '');
    return null;
  }

  function getSubject(row) {
    var sel = [
      'span.bog',
      '.bog span',
      'span[data-thread-id]',
      '.y2',
      '.y6 span',
      '[role="link"] span',
      'span[data-tooltip]'
    ];
    for (var i = 0; i < sel.length; i++) {
      var el = row.querySelector(sel[i]);
      if (el && el.textContent) {
        var t = el.textContent.trim();
        if (t.length > 0 && t.length < 500) return { element: el, text: t };
      }
    }
    return null;
  }

  function getSender(row) {
    var sel = [
      'span[email]',
      'span.yW span[email]',
      '.yW [email]',
      '.yP',
      'td.yX span',
      '.xY span'
    ];
    for (var i = 0; i < sel.length; i++) {
      var el = row.querySelector(sel[i]);
      if (el) {
        var email = el.getAttribute('email') || el.textContent.trim();
        if (email) return email;
      }
    }
    return '';
  }

  function getSnippet(row) {
    var el = row.querySelector('.y2') || row.querySelector('[class*="snippet"]');
    return el ? el.textContent.trim().slice(0, 200) : '';
  }

  /** Extract all http(s) URLs from text. */
  function extractUrlsFromText(text) {
    if (!text || typeof text !== 'string') return [];
    var matches = text.match(/https?:\/\/[^\s\]\)\"\'<>]+/ig);
    if (!matches) return [];
    var urls = [];
    for (var i = 0; i < matches.length; i++) {
      var clean = matches[i].replace(/[\]\)\"\'>]+$/, '');
      if (urls.indexOf(clean) === -1) urls.push(clean);
    }
    return urls;
  }

  /** Get all URLs from row: link hrefs (preferred) or from subject + snippet text. */
  function getAllUrlsFromRow(row, subjectText, snippetText) {
    var urls = [];
    var links = row.querySelectorAll('a[href^="http"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href) {
        var clean = href.split(/[\s\]\)\"\'>]/)[0];
        if (clean && urls.indexOf(clean) === -1) urls.push(clean);
      }
    }
    var combined = [subjectText, snippetText].filter(Boolean).join(' ');
    var textUrls = extractUrlsFromText(combined);
    for (var j = 0; j < textUrls.length; j++) {
      if (urls.indexOf(textUrls[j]) === -1) urls.push(textUrls[j]);
    }
    return urls;
  }

  function getRows() {
    return document.querySelectorAll('tr.zA, tr[role="row"], div[data-message-id]');
  }

  function sanitizeInlineUrl(u) {
    if (!u) return '';
    return u.split(/[\s\]\)\"\'>]/)[0];
  }

  function getCurrentOpenThreadId(openBody) {
    var fromHash = null;
    var hash = window.location.hash || '';
    var m = hash.match(/\/(FM[a-zA-Z0-9_-]+)/);
    if (m && m[1]) fromHash = m[1];

    var container = openBody ? openBody.closest('[data-thread-id]') : null;
    var fromDom = container && container.getAttribute ? container.getAttribute('data-thread-id') : null;

    if (fromDom) return fromDom;
    if (fromHash) return fromHash;

    var h = document.querySelector('h2.hP');
    var subjectText = h && h.textContent ? h.textContent.trim() : '';
    if (subjectText) {
      var keys = Object.keys(threadMeta);
      for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var info = threadMeta[id];
        if (info && info.subject === subjectText) return id;
      }
    }

    if (subjectText) return 'open-' + subjectText.slice(0, 100).replace(/\s+/g, '-').toLowerCase();
    return null;
  }

  function ensureOpenSubjectBadge(subjectEl, threadId) {
    if (!subjectEl || !threadId) return null;
    var existing = subjectEl.parentNode && subjectEl.parentNode.querySelector('.spectrashield-open-badge[' + BADGE_ATTR + '="open-' + threadId + '"]');
    if (existing) return existing;

    var badge = document.createElement('span');
    badge.className = 'spectrashield-badge spectrashield-open-badge suspicious';
    badge.setAttribute(BADGE_ATTR, 'open-' + threadId);
    badge.style.marginLeft = '8px';
    badge.style.padding = '0 8px';
    badge.style.width = 'auto';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = '600';
    badge.style.borderRadius = '999px';
    badge.style.lineHeight = '20px';
    badge.textContent = 'Scanning...';
    badge.title = 'Scanning email body and links...';

    badge.addEventListener('mouseenter', function () {
      var info = badge._openInfo;
      if (!info) return;
      var tt = document.createElement('div');
      tt.className = 'spectrashield-link-tooltip';
      var logic = info.logicFlags && info.logicFlags.length ? info.logicFlags.join(', ') : 'None';
      var brand = info.brandMatch || 'None';
      var rep = (typeof info.vtFlagged === 'number' ? info.vtFlagged : 0) + '/' +
        (typeof info.vtTotal === 'number' ? info.vtTotal : 70) + ' engines flagged';
      tt.innerHTML =
        '<div class="row"><div class="label">Unified Score</div><div class="value">' + info.score + '%</div></div>' +
        '<div class="row"><div class="label">Brand Match</div><div class="value">' + brand + '</div></div>' +
        '<div class="row"><div class="label">Logic Flags</div><div class="value">' + logic + '</div></div>' +
        '<div class="row"><div class="label">Global Reputation</div><div class="value">' + rep + '</div></div>' +
        '<div class="reason"><span class="label">Reason:</span> ' + (info.reason || 'No additional details available.') + '</div>';
      document.body.appendChild(tt);
      var r = badge.getBoundingClientRect();
      tt.style.left = (r.left + r.width / 2) + 'px';
      tt.style.top = (r.top - 10) + 'px';
      tt.style.transform = 'translate(-50%, -100%)';
      badge._openTt = tt;
    });

    badge.addEventListener('mouseleave', function () {
      if (badge._openTt) {
        badge._openTt.remove();
        badge._openTt = null;
      }
    });

    badge.addEventListener('click', function (e) {
      e.stopPropagation();
      var context = badge._openContext || (openMailCache[threadId] && openMailCache[threadId].context);
      openSpectraShieldAnalysis(context);
    });

    subjectEl.after(badge);
    return badge;
  }

  function applyOpenBadgeState(badge, level, score, reason, breakdown) {
    if (!badge) return;
    badge.classList.remove('high', 'suspicious', 'safe');
    badge.classList.add(level);

    badge.textContent = 'Risk Score ' + score + '%';
    badge.title = (reason || 'No additional details available.') + ' (Score: ' + score + '%)';
    badge._openInfo = {
      score: score,
      reason: reason,
      brandMatch: breakdown && breakdown.brandMatch ? breakdown.brandMatch : 'None',
      logicFlags: breakdown && breakdown.logicFlags ? breakdown.logicFlags : [],
      vtFlagged: breakdown && typeof breakdown.vtFlagged === 'number' ? breakdown.vtFlagged : 0,
      vtTotal: breakdown && typeof breakdown.vtTotal === 'number' ? breakdown.vtTotal : 70
    };
  }

  function gatherOpenMailData(openBody) {
    if (!openBody) return null;

    var subjectEl = document.querySelector('h2.hP');
    var subject = subjectEl && subjectEl.textContent ? subjectEl.textContent.trim() : '';

    var senderEl = document.querySelector('.gD[email], span[email], .go');
    var sender = senderEl ? (senderEl.getAttribute('email') || senderEl.textContent || '').trim() : '';

    var bodyText = (openBody.innerText || '').trim();
    var links = openBody.querySelectorAll('a[href]');
    var urls = [];
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || !/^https?:\/\//i.test(href)) continue;
      var clean = sanitizeInlineUrl(href);
      if (clean && urls.indexOf(clean) === -1) urls.push(clean);
    }

    var textUrls = extractUrlsFromText(bodyText);
    for (var j = 0; j < textUrls.length; j++) {
      if (urls.indexOf(textUrls[j]) === -1) urls.push(textUrls[j]);
    }

    return {
      subjectEl: subjectEl,
      subject: subject,
      sender: sender,
      bodyText: bodyText,
      urls: urls
    };
  }

  function scanOpenedMail() {
    var openBody = document.querySelector('.a3s');
    var openHeader = document.querySelector('.ha');
    if (!openBody && !openHeader) return;
    if (!openBody) return;

    var data = gatherOpenMailData(openBody);
    if (!data || !data.subjectEl) return;

    // Body must be fully loaded enough before scanning.
    if (!data.bodyText && data.urls.length === 0) return;
    if (data.bodyText.length < 20 && data.urls.length === 0) return;

    var threadId = getCurrentOpenThreadId(openBody);
    if (!threadId) return;

    var badge = ensureOpenSubjectBadge(data.subjectEl, threadId);
    if (!badge) return;

    var openContext = {
      emailText: [data.subject, data.bodyText].filter(Boolean).join('\n\n').slice(0, 25000),
      senderEmail: data.sender || '',
      urls: data.urls || []
    };
    badge._openContext = openContext;

    var signature = [data.subject, data.bodyText.length, data.urls.length].join('|');
    if (openMailSignatureByThread[threadId] === signature && openMailCache[threadId]) {
      var cached = openMailCache[threadId];
      if (cached.context) badge._openContext = cached.context;
      applyOpenBadgeState(badge, cached.level, cached.score, cached.reason, cached.breakdown);
      return;
    }

    if (openMailInFlight.has(threadId)) return;
    openMailInFlight.add(threadId);
    openMailSignatureByThread[threadId] = signature;

    badge.textContent = 'Scanning...';
    badge.classList.remove('high', 'safe');
    badge.classList.add('suspicious');
    badge.title = 'Scanning email body and links...';

    analyzeEmail(
      openContext.emailText,
      data.sender,
      data.urls,
      {
        thread_id: threadId,
        opened_mail_body: data.bodyText.slice(0, 25000),
        opened_mail_urls: data.urls
      }
    ).then(function (resp) {
      var openSummary = resp && resp.open_mail_summary ? resp.open_mail_summary : {};
      var riskBreakdown = resp && resp.risk_breakdown ? resp.risk_breakdown : {};
      var scoreRaw = typeof resp.mail_severity_score === 'number' ? resp.mail_severity_score :
        (typeof resp.unified_severity_score === 'number' ? resp.unified_severity_score :
          (typeof resp.final_risk === 'number' ? resp.final_risk : 0));
      var score = Math.round(scoreRaw || 0);
      var level = riskLevel(score);
      var reason = openSummary.reason || resp.reasoning_summary || 'No strong signals detected in opened email body.';
      var maliciousCount = typeof openSummary.malicious_links === 'number' ? openSummary.malicious_links : 0;
      var suspiciousCount = typeof openSummary.suspicious_links === 'number' ? openSummary.suspicious_links : 0;
      if (!openSummary.reason && (maliciousCount > 0 || suspiciousCount > 0)) {
        reason = 'Found ' + maliciousCount + ' phishing and ' + suspiciousCount + ' suspicious links in body.';
      }

      var tooltipBreakdown = {
        brandMatch: riskBreakdown.brand_match || 'None',
        logicFlags: riskBreakdown.logic_flags || [],
        vtFlagged: riskBreakdown.global_reputation && typeof riskBreakdown.global_reputation.flagged === 'number'
          ? riskBreakdown.global_reputation.flagged : 0,
        vtTotal: riskBreakdown.global_reputation && typeof riskBreakdown.global_reputation.total === 'number'
          ? riskBreakdown.global_reputation.total : 70
      };

      openMailCache[threadId] = { level: level, score: score, reason: reason, breakdown: tooltipBreakdown, context: openContext };
      cache[threadId] = {
        level: level,
        score: score,
        emailText: openContext.emailText,
        senderEmail: openContext.senderEmail,
        urls: openContext.urls,
        urlScore: riskBreakdown && typeof riskBreakdown.external_score === 'number' ? riskBreakdown.external_score : undefined
      };
      syncInboxBadgeForThread(threadId, level, score);
      applyOpenBadgeState(badge, level, score, reason, tooltipBreakdown);
    }).catch(function () {
      openMailCache[threadId] = {
        level: 'suspicious',
        score: 35,
        reason: 'Could not complete full body scan.',
        breakdown: { brandMatch: 'Unknown', logicFlags: ['ScanError'], vtFlagged: 0, vtTotal: 70 },
        context: openContext
      };
      cache[threadId] = {
        level: 'suspicious',
        score: 35,
        emailText: openContext.emailText,
        senderEmail: openContext.senderEmail,
        urls: openContext.urls,
        urlScore: undefined
      };
      syncInboxBadgeForThread(threadId, 'suspicious', 35);
      applyOpenBadgeState(
        badge,
        'suspicious',
        35,
        'Could not complete full body scan.',
        { brandMatch: 'Unknown', logicFlags: ['ScanError'], vtFlagged: 0, vtTotal: 70 }
      );
    }).finally(function () {
      openMailInFlight.delete(threadId);
    });
  }

  function scheduleOpenMailScan() {
    clearTimeout(openMailTimer);
    openMailTimer = setTimeout(scanOpenedMail, openMailDebounceMs);
  }

  function rowHasBadgeForId(row, id) {
    var badge = row.querySelector('.spectrashield-badge[' + BADGE_ATTR + '="' + id + '"]');
    return !!badge;
  }

  function removeOrphanBadges(container) {
    if (!container) return;
    var badges = container.querySelectorAll('.spectrashield-badge');
    for (var j = 0; j < badges.length; j++) {
      badges[j].remove();
    }
  }

  function analyzeEmail(emailText, senderEmail, urls, extraPayload) {
    var payload = {
      email_text: emailText,
      email_header: null,
      url: urls && urls.length > 0 ? urls[0] : null,
      urls: urls || [],
      sender_email: senderEmail || null,
      private_mode: true
    };
    if (extraPayload && typeof extraPayload === 'object') {
      for (var key in extraPayload) {
        if (Object.prototype.hasOwnProperty.call(extraPayload, key)) {
          payload[key] = extraPayload[key];
        }
      }
    }
    return fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    });
  }

  function riskLevel(finalRisk) {
    if (finalRisk >= 70) return 'high';
    if (finalRisk >= 30) return 'suspicious';
    return 'safe';
  }

  function openSpectraShieldAnalysis(entry) {
    if (!entry) return;
    var params = new URLSearchParams();
    if (entry.emailText) params.set('email_text', entry.emailText);
    if (entry.senderEmail) params.set('sender_email', entry.senderEmail);
    if (entry.urls && entry.urls.length > 0) params.set('url', entry.urls[0]);
    var url = 'http://localhost:5173/?' + params.toString();
    try {
      window.open(url, '_blank');
    } catch (_) { }
  }

  function getBadgeIcon(level) {
    if (level === 'safe') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';
    }
    if (level === 'suspicious') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 9v4M12 16h.01"/></svg>';
  }

  function applyInboxBadgeVisual(span, level, score) {
    if (!span) return;
    span.className = 'spectrashield-badge ' + level;
    span.title = (level === 'high' ? 'High risk' : level === 'suspicious' ? 'Suspicious' : 'Safe') + ': ' + score + '%';
    span.innerHTML = getBadgeIcon(level);
  }

  function syncInboxBadgeForThread(threadId, level, score) {
    if (!threadId) return;
    var badges = document.querySelectorAll('.spectrashield-badge[' + BADGE_ATTR + '="' + threadId + '"]');
    for (var i = 0; i < badges.length; i++) {
      applyInboxBadgeVisual(badges[i], level, score);
    }
  }

  function createBadge(level, score, id) {
    var span = document.createElement('span');
    span.setAttribute(BADGE_ATTR, id);
    applyInboxBadgeVisual(span, level, score);
    // Hover tooltip
    span.addEventListener('mouseenter', function () {
      var tt = document.createElement('span');
      tt.className = 'spectrashield-tooltip';
      var tip = (level === 'high' ? 'High risk' : level === 'suspicious' ? 'Suspicious' : 'Safe') + ': ' + score + '%';
      var entry = cache[id];
      if (entry && typeof entry.urlScore === 'number') tip += ' (URL: ' + Math.round(entry.urlScore) + '%)';
      tt.textContent = tip;
      document.body.appendChild(tt);
      var r = span.getBoundingClientRect();
      tt.style.left = (r.left + r.width / 2) + 'px';
      tt.style.top = (r.top - 4) + 'px';
      tt.style.transform = 'translate(-50%, -100%)';
      span._tt = tt;
    });
    span.addEventListener('mouseleave', function () {
      if (span._tt) {
        span._tt.remove();
        span._tt = null;
      }
    });
    // Click → open SpectraShield UI with this email's context (include URL for Scan Link)
    span.addEventListener('click', function (e) {
      e.stopPropagation();
      openSpectraShieldAnalysis(cache[id]);
    });
    return span;
  }

  function injectBadge(subjectInfo, level, score, id) {
    if (!subjectInfo || !subjectInfo.element) return;
    var row = subjectInfo.element.closest('tr') || subjectInfo.element.closest('div[data-message-id]');
    if (row) removeOrphanBadges(row);
    var badge = createBadge(level, score, id);
    subjectInfo.element.after(badge);
  }

  function processRow(row) {
    var id = getRowId(row);
    if (!id) return;

    var subjectInfo = getSubject(row);
    var sender = getSender(row);
    var snippet = getSnippet(row);
    var subjectText = subjectInfo && subjectInfo.text ? subjectInfo.text : '';
    if (subjectText || sender) {
      threadMeta[id] = {
        subject: subjectText || '',
        sender: sender || ''
      };
    }
    var emailText = [subjectText, snippet].filter(Boolean).join(' ').trim();
    var urls = getAllUrlsFromRow(row, subjectText, snippet);

    if (cache[id]) {
      if (!rowHasBadgeForId(row, id) && subjectInfo && document.contains(subjectInfo.element)) {
        injectBadge(subjectInfo, cache[id].level, cache[id].score, id);
      }
      return;
    }

    if (rowHasBadgeForId(row, id)) return;
    if (!emailText && !sender) return;
    if (processed.has(id)) return;

    processed.add(id);

    analyzeEmail(emailText || '(no content)', sender, urls, { thread_id: id })
      .then(function (data) {
        var level = riskLevel(typeof data.final_risk === 'number' ? data.final_risk : 0);
        var score = Math.round(data.final_risk || 0);
        cache[id] = {
          level: level,
          score: score,
          emailText: emailText || '',
          senderEmail: sender || '',
          urls: urls || [],
          urlScore: data.breakdown && typeof data.breakdown.url_score === 'number' ? data.breakdown.url_score : undefined
        };
        if (subjectInfo && subjectInfo.element && document.contains(subjectInfo.element)) {
          if (!rowHasBadgeForId(row, id)) injectBadge(subjectInfo, level, score, id);
        }
      })
      .catch(function () {
        var subject = (subjectInfo && subjectInfo.text || '').toLowerCase();
        var s = (sender || '').toLowerCase();
        var level = 'safe';
        if (/urgent|action required|verify|suspended|confirm your|payroll/.test(subject) || /noreply/.test(s)) level = 'high';
        else if (/click here|limited time|delivery|support/.test(subject) || /delivery|support/.test(s)) level = 'suspicious';
        var score = level === 'high' ? 85 : level === 'suspicious' ? 55 : 15;
        cache[id] = {
          level: level,
          score: score,
          emailText: emailText || '',
          senderEmail: sender || '',
          urls: urls || [],
          urlScore: undefined
        };
        if (subjectInfo && subjectInfo.element && document.contains(subjectInfo.element)) {
          if (!rowHasBadgeForId(row, id)) injectBadge(subjectInfo, level, score, id);
        }
      });
  }

  function processAll() {
    var rows = getRows();
    for (var i = 0; i < rows.length; i++) {
      try {
        processRow(rows[i]);
      } catch (e) { }
    }
  }

  function scheduleProcess() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processAll, debounceMs);
  }

  function scheduleProcessScroll() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(processAll, scrollDebounceMs);
  }

  function start() {
    var main = document.querySelector('[role="main"]');
    processAll();
    scanEmailBody(document);
    scheduleOpenMailScan();

    if (main) {
      var mo = new MutationObserver(scheduleProcess);
      mo.observe(main, { childList: true, subtree: true });

      var lmo = new MutationObserver(function (mutations) {
        var shouldCheckOpenMail = false;
        for (var i = 0; i < mutations.length; i++) {
          for (var j = 0; j < mutations[i].addedNodes.length; j++) {
            var n = mutations[i].addedNodes[j];
            if (n && n.querySelectorAll) {
              scanEmailBody(n);
              if (
                (n.matches && (n.matches('.a3s') || n.matches('.ha') || n.matches('h2.hP'))) ||
                n.querySelector('.a3s') ||
                n.querySelector('.ha') ||
                n.querySelector('h2.hP')
              ) {
                shouldCheckOpenMail = true;
              }
            }
          }
        }
        if (shouldCheckOpenMail) scheduleOpenMailScan();
      });
      lmo.observe(main, { childList: true, subtree: true });

      main.addEventListener('scroll', scheduleProcessScroll, { passive: true });
      main.addEventListener('scroll', scheduleProcessScroll, { passive: true, capture: true });
      document.addEventListener('scroll', scheduleProcessScroll, { passive: true, capture: true });
    }

    window.addEventListener('hashchange', function () {
      setTimeout(processAll, 600);
      setTimeout(scheduleOpenMailScan, 700);
    });

    window.addEventListener('focus', function () {
      setTimeout(processAll, 200);
      setTimeout(scheduleOpenMailScan, 250);
    });

    setInterval(function () {
      if (document.visibilityState === 'visible') processAll();
      if (document.visibilityState === 'visible') scanEmailBody(document);
      if (document.visibilityState === 'visible') scheduleOpenMailScan();
    }, 2500);
  }

  function waitForGmail() {
    if (document.querySelector('[role="main"]') || document.querySelector('tr.zA')) {
      start();
      return;
    }
    var t = setInterval(function () {
      if (document.querySelector('[role="main"]') || document.querySelector('tr.zA')) {
        clearInterval(t);
        start();
      }
    }, 800);
    setTimeout(function () { clearInterval(t); }, 20000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGmail);
  } else {
    waitForGmail();
  }
})();
