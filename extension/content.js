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

  /** Extract first http(s) URL from text. */
  function extractUrlFromText(text) {
    if (!text || typeof text !== 'string') return null;
    var match = text.match(/https?:\/\/[^\s\]\)\"\'<>]+/i);
    return match ? match[0].replace(/[\]\)\"\'>]+$/, '') : null;
  }

  /** Get first URL from row: link hrefs (preferred) or from subject + snippet text. */
  function getFirstUrlFromRow(row, subjectText, snippetText) {
    var links = row.querySelectorAll('a[href^="http"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href) {
        var clean = href.split(/[\s\]\)\"\'>]/)[0];
        if (clean) return clean;
      }
    }
    var combined = [subjectText, snippetText].filter(Boolean).join(' ');
    return extractUrlFromText(combined);
  }

  function getRows() {
    return document.querySelectorAll('tr.zA, tr[role="row"], div[data-message-id]');
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

  function analyzeEmail(emailText, senderEmail, url) {
    return fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_text: emailText,
        email_header: null,
        url: url || null,
        sender_email: senderEmail || null,
        private_mode: true
      })
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

  function createBadge(level, score, id) {
    var span = document.createElement('span');
    span.className = 'spectrashield-badge ' + level;
    span.setAttribute(BADGE_ATTR, id);
    span.title = (level === 'high' ? 'High risk' : level === 'suspicious' ? 'Suspicious' : 'Safe') + ': ' + score + '%';
    if (level === 'safe') {
      span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';
    } else if (level === 'suspicious') {
      span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>';
    } else {
      span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 9v4M12 16h.01"/></svg>';
    }
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
      var entry = cache[id];
      if (!entry) return;
      var params = new URLSearchParams();
      if (entry.emailText) params.set('email_text', entry.emailText);
      if (entry.senderEmail) params.set('sender_email', entry.senderEmail);
      if (entry.firstUrl) params.set('url', entry.firstUrl);
      var url = 'http://localhost:5173/?' + params.toString();
      try {
        window.open(url, '_blank');
      } catch (_) {}
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
    var emailText = [subjectText, snippet].filter(Boolean).join(' ').trim();
    var firstUrl = getFirstUrlFromRow(row, subjectText, snippet);

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

    analyzeEmail(emailText || '(no content)', sender, firstUrl)
      .then(function (data) {
        var level = riskLevel(typeof data.final_risk === 'number' ? data.final_risk : 0);
        var score = Math.round(data.final_risk || 0);
        cache[id] = {
          level: level,
          score: score,
          emailText: emailText || '',
          senderEmail: sender || '',
          firstUrl: firstUrl || undefined,
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
          firstUrl: firstUrl || undefined,
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
      } catch (e) {}
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

    if (main) {
      var mo = new MutationObserver(scheduleProcess);
      mo.observe(main, { childList: true, subtree: true });

      main.addEventListener('scroll', scheduleProcessScroll, { passive: true });
      main.addEventListener('scroll', scheduleProcessScroll, { passive: true, capture: true });
      document.addEventListener('scroll', scheduleProcessScroll, { passive: true, capture: true });
    }

    window.addEventListener('hashchange', function () {
      setTimeout(processAll, 600);
    });

    window.addEventListener('focus', function () {
      setTimeout(processAll, 200);
    });

    setInterval(function () {
      if (document.visibilityState === 'visible') processAll();
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
