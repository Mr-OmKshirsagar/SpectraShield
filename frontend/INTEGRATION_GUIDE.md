# PhishShield AI - Gmail Integration Guide

## Overview

PhishShield AI is a modern cybersecurity browser extension that detects phishing attempts in real-time. This implementation includes both the extension popup UI and a Gmail integration demo showing risk badges injected directly into email listings.

## Features

### 1. **Extension Popup UI** (Default View)
- Circular animated risk meter (0-100 score)
- Real-time risk analysis with neon green (safe) / amber (suspicious) / red (danger) indicators
- Risk breakdown panel showing manipulation, URL, brand, and attachment risks
- Expandable "Why Flagged?" section with detailed threat analysis
- Action buttons: Mark Safe, Report Phishing, Open in Safe Mode
- Floating warning banner for high-risk alerts
- Dark theme with deep navy background (#0B1120)
- Futuristic cybersecurity dashboard aesthetic

### 2. **Gmail Integration Demo**
- Full Gmail inbox simulation with PhishShield risk badges
- Risk indicators appear inline next to email subject lines
- Hover tooltips showing risk percentage and threat level
- Color-coded badges:
  - 🟢 Green (Safe): 0-30% risk
  - 🟡 Amber (Suspicious): 30-70% risk
  - 🔴 Red (High Risk): 70-100% risk
- Status footer showing protection statistics

## Using the Application

### Switching Between Views

The application has two main views accessible via toggle buttons:

1. **Extension Popup View** (default)
   - Shows the complete browser extension popup interface
   - Click "View Gmail Integration" button (top-right) to switch to Gmail demo

2. **Gmail Integration View**
   - Shows a full Gmail inbox with risk badges injected
   - Click "View Extension Popup" button (top-right) to return to popup view

### Understanding Risk Levels

| Risk Level | Score Range | Color | Icon | Meaning |
|------------|-------------|-------|------|---------|
| **Safe** | 0-29% | Green | ✓ CheckCircle | Email appears legitimate |
| **Suspicious** | 30-69% | Amber | ⚠️ Triangle | Potential phishing indicators detected |
| **High Risk** | 70-100% | Red | 🛡️ Shield Alert | Strong phishing signals, do not interact |

### Risk Analysis Criteria

The simulated phishing detection analyzes:

1. **Manipulation Tactics** (25%)
   - Urgency indicators ("URGENT", "ACTION REQUIRED")
   - Authority impersonation
   - Social engineering patterns

2. **URL Analysis** (30%)
   - Domain reputation
   - Link redirection chains
   - URL obfuscation

3. **Brand Verification** (25%)
   - Sender domain matching
   - Logo/branding consistency
   - Known phishing templates

4. **Attachment Scanning** (20%)
   - File type analysis
   - Malware signatures
   - Suspicious executables

## Real Browser Extension Implementation

### File Structure for Browser Extension

```
phishshield-extension/
├── manifest.json           # Extension configuration
├── popup/
│   ├── popup.html         # Popup HTML container
│   ├── popup.tsx          # Main popup component (from App.tsx)
│   └── popup-bundle.js    # Compiled popup script
├── content/
│   ├── gmail-content.tsx  # Gmail injection script
│   └── content-bundle.js  # Compiled content script
├── background/
│   └── service-worker.js  # Background processing
└── assets/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### manifest.json Example

```json
{
  "manifest_version": 3,
  "name": "PhishShield AI",
  "version": "1.0.0",
  "description": "AI-powered phishing detection for Gmail",
  
  "permissions": [
    "activeTab",
    "storage"
  ],
  
  "host_permissions": [
    "https://mail.google.com/*"
  ],
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icon-16.png",
      "48": "assets/icon-48.png",
      "128": "assets/icon-128.png"
    }
  },
  
  "content_scripts": [
    {
      "matches": ["https://mail.google.com/*"],
      "js": ["content/content-bundle.js"],
      "css": ["content/content-styles.css"],
      "run_at": "document_idle"
    }
  ],
  
  "background": {
    "service_worker": "background/service-worker.js"
  },
  
  "web_accessible_resources": [
    {
      "resources": ["assets/*"],
      "matches": ["https://mail.google.com/*"]
    }
  ]
}
```

### Gmail Content Script Integration

The `gmail-content.tsx` file contains the Gmail injection logic:

**Key Components:**

1. **GmailRiskInjector Class**
   - Identifies email rows in Gmail's DOM
   - Extracts email subject and sender information
   - Injects React-based risk badges inline
   - Monitors for new emails using MutationObserver

2. **Gmail Selectors**
   ```javascript
   // Email rows
   'tr.zA, tr[role="row"]'
   
   // Subject line
   'span.bog, span[data-thread-id]'
   
   // Sender
   'span[email], span.yW span[email]'
   ```

3. **Badge Injection Process**
   - Detect email row
   - Analyze email content (subject + sender)
   - Create risk badge container
   - Render React component using createRoot
   - Append to subject line

### API Integration (Production)

For production deployment, replace the simulated analysis with real API calls:

```typescript
// In gmail-content.tsx
class PhishShieldAnalyzer {
  async analyzeEmail(emailSubject: string, emailSender: string): Promise<EmailRiskData> {
    try {
      const response = await fetch('https://api.phishshield.ai/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
          subject: emailSubject,
          sender: emailSender,
          // Add more email metadata as needed
        })
      });
      
      const data = await response.json();
      return {
        riskLevel: data.risk_level,
        riskScore: data.risk_score
      };
    } catch (error) {
      console.error('PhishShield analysis error:', error);
      return { riskLevel: 'safe', riskScore: 0 }; // Fail safe
    }
  }
}
```

### Background Service Worker

Handle analysis processing in the background to avoid blocking the UI:

```javascript
// background/service-worker.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeEmail') {
    fetch('https://api.phishshield.ai/v1/analyze', {
      method: 'POST',
      body: JSON.stringify(request.emailData)
    })
    .then(response => response.json())
    .then(data => sendResponse({ success: true, riskData: data }))
    .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep channel open for async response
  }
});
```

### Content Script Communication

```typescript
// Send email data from content script to background
async function analyzeWithBackground(emailData: EmailData): Promise<RiskData> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'analyzeEmail', emailData },
      (response) => {
        if (response.success) {
          resolve(response.riskData);
        }
      }
    );
  });
}
```

## Building for Production

### 1. Build the React Application

```bash
npm run build
```

### 2. Package for Chrome/Edge

```bash
# Create extension package
zip -r phishshield-extension.zip manifest.json popup/ content/ background/ assets/
```

### 3. Load Extension (Development)

1. Open Chrome/Edge
2. Navigate to `chrome://extensions` or `edge://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

### 4. Test in Gmail

1. Navigate to https://mail.google.com
2. Open your inbox
3. Risk badges should appear next to email subject lines
4. Hover over badges to see risk scores
5. Click extension icon to see full popup analysis

## Security Considerations

### Data Privacy

- **No PII Collection**: PhishShield does not store or transmit personal information
- **Local Analysis**: Where possible, perform analysis client-side
- **Minimal Permissions**: Request only necessary browser permissions
- **Encrypted Communication**: Use HTTPS for all API calls

### Content Security Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Secure API Keys

Never hardcode API keys in content scripts. Use:

1. Background service workers for API calls
2. Chrome storage API for secure credential storage
3. Environment variables during build

```typescript
// Secure API key retrieval
chrome.storage.sync.get(['apiKey'], (result) => {
  const apiKey = result.apiKey;
  // Use apiKey for authentication
});
```

## Deployment Checklist

- [ ] Replace simulated risk analysis with production API
- [ ] Add proper error handling and fallbacks
- [ ] Implement rate limiting for API calls
- [ ] Add user authentication/API key management
- [ ] Test across different Gmail themes and languages
- [ ] Optimize performance (lazy loading, debouncing)
- [ ] Add analytics (privacy-preserving)
- [ ] Create onboarding tutorial
- [ ] Submit to Chrome Web Store
- [ ] Create privacy policy and terms of service

## Troubleshooting

### Badges Not Appearing

1. Check if content script is loaded: `console.log` in `gmail-content.tsx`
2. Verify Gmail selectors are still valid (Gmail updates their DOM)
3. Ensure Tailwind CSS is properly injected
4. Check browser console for errors

### Performance Issues

1. Debounce email processing (currently set to 300ms)
2. Limit concurrent API calls
3. Cache analysis results for recently seen emails
4. Use Web Workers for heavy processing

### Styling Conflicts

Gmail's CSS may conflict with the extension:

```css
/* content-styles.css - Add !important for critical styles */
.phishshield-risk-badge {
  all: initial; /* Reset all styles */
  /* Then apply your styles with specificity */
}
```

## Future Enhancements

- [ ] Support for Outlook, Yahoo Mail, ProtonMail
- [ ] Advanced ML model for offline analysis
- [ ] Phishing report feedback loop
- [ ] Domain reputation database
- [ ] Link preview with safety check
- [ ] Attachment sandboxing
- [ ] Real-time threat intelligence feeds
- [ ] Team/enterprise dashboard

## License

This implementation is provided as a demonstration. For production use, ensure compliance with:
- Gmail API Terms of Service
- Chrome Web Store Developer Program Policies
- Data privacy regulations (GDPR, CCPA, etc.)

## Support

For questions or issues:
- GitHub Issues: https://github.com/yourorg/phishshield
- Email: support@phishshield.ai
- Documentation: https://docs.phishshield.ai

---

**PhishShield AI** - Protecting your inbox, one email at a time. 🛡️
