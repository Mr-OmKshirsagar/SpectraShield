# PhishShield AI - Secure Link Preview System

## Overview

The PhishShield AI Link Preview is an enterprise-grade security interface that provides comprehensive threat analysis and sandboxed previews of suspicious links before users visit them. This feature is designed to prevent phishing attacks by giving users critical security information in a clear, professional dashboard.

## Features

### 🛡️ Security Info Bar (Top Panel)

The security info bar provides at-a-glance critical information across four key metrics:

#### 1. **Risk Score Meter**
- **Range**: 0-100 (higher = more dangerous)
- **Visual Indicator**: Animated progress bar with glow effects
- **Color Coding**:
  - 🟢 **0-39**: Safe (Green #00FF94)
  - 🟡 **40-69**: Suspicious (Amber #fbbf24)
  - 🔴 **70-100**: High Risk (Red #FF0055)
- **Real-time Animation**: Smooth progress animation on load
- **Display**: Large numerical score with label

#### 2. **Domain Age**
- Shows how long the domain has been registered
- **Warning Indicators**:
  - Domains < 30 days old: High risk flag
  - Domains < 90 days old: Caution flag
  - Established domains: Lower risk
- **Amber color scheme** for newly registered domains
- Important because phishing sites are often newly created

#### 3. **SSL Certificate Status**
- **Valid SSL**: Shows padlock icon + "Certificate Verified"
- **Invalid/Missing SSL**: Shows unlock icon + warning
- **Checks**:
  - Certificate validity period
  - Certificate issuer authenticity
  - Self-signed certificate detection
  - Expired certificate detection
- **Color Coding**:
  - ✅ Green: Valid certificate
  - ❌ Red: Invalid/missing certificate

#### 4. **Server Location**
- Geographic location of the server hosting the site
- **Risk Indicators**:
  - "Unknown": Server using anonymization
  - Mismatched locations (e.g., "Microsoft" site in Moldova)
  - Known phishing hotspots
- Helps identify spoofed sites

### 🚨 Threat Indicators Panel

Comprehensive list of detected security threats with severity levels:

#### Threat Types:

**Critical Threats** (Red):
- Spoofed domain names
- Invalid SSL certificates
- Known phishing patterns
- Malicious redirects
- Blacklisted domains

**Warning Indicators** (Amber):
- New domain registration
- Suspicious TLD (.tk, .ml, .ga, etc.)
- No HTTPS redirect
- Uncommon registrars
- High-risk hosting providers

**Safe Indicators** (Green):
- Verified domain
- Valid SSL certificate
- Established domain age
- Trusted registrar
- Clean reputation

Each threat shows:
- Icon indicating severity
- Clear threat label
- Detailed description
- Color-coded background

### 🖼️ Sandboxed Preview Window

Safe, isolated preview of the target webpage:

#### Features:
- **Browser Chrome Simulation**: Realistic browser UI with traffic lights and URL bar
- **Static Content Rendering**: Page rendered without executing JavaScript
- **Overlay Warning**: High-risk sites show prominent warning overlay
- **Preview Disabled Mode**: Extremely dangerous sites show "Preview Disabled" badge
- **PhishShield Watermark**: Branding in corner for security assurance
- **Simulated Login Forms**: Shows what attackers are trying to capture

#### Security Benefits:
- No script execution (prevents tracking, malware)
- No cookies or session data transmitted
- No form submissions possible
- Isolated rendering environment
- Safe visual inspection

### 🔍 Advanced Technical Details (Expandable)

Collapsible section showing deep technical analysis:

- **Registrar Information**: Who registered the domain
- **TLD Risk Assessment**: Top-level domain threat rating
- **HTTP Status Codes**: Server response codes
- **Response Time**: Page load latency
- **DNS Records**: Domain name system information
- **IP Address**: Server IP and reputation
- **Hosting Provider**: Datacenter information
- **WHOIS Data**: Registration details

### 🎯 Action Buttons

Two primary actions with clear consequences:

#### 1. **Block & Report** (Recommended for high-risk)
- Blocks the link from being accessed
- Reports to PhishShield threat database
- Adds domain to personal blocklist
- Notifies security team (enterprise version)
- **Visual**: Red button with ban icon

#### 2. **Open Anyway (Unsafe)**
- Proceeds to site despite warnings
- Logs the action for security audit
- Shows additional confirmation dialog
- Opens in isolated browser tab
- **Visual**: Gray button with external link icon

## Design Specifications

### Color Palette

```css
/* Primary Background */
--bg-primary: #0B1120;
--bg-secondary: #1a1f35;

/* Risk Colors */
--risk-safe: #00FF94;
--risk-warning: #fbbf24;
--risk-danger: #FF0055;

/* Accent Colors */
--accent-indigo: #6366f1;
--accent-emerald: #10b981;
--accent-rose: #f43f5e;

/* Neutral Colors */
--slate-50: #f8fafc;
--slate-200: #e2e8f0;
--slate-400: #94a3b8;
--slate-700: #334155;
--slate-900: #0f172a;
```

### Typography

- **Headers**: Gradient text from white to slate-400
- **Body Text**: Slate-200 for readability
- **Secondary Text**: Slate-400/500
- **Monospace (URLs/Technical)**: Font-mono
- **Risk Scores**: Bold, large, color-coded

### Layout & Spacing

- **Max Width**: 1280px (5xl)
- **Border Radius**: 12-16px for cards
- **Glow Effects**: 10-20px blur with color opacity
- **Grid**: 4-column responsive grid for info cards
- **Padding**: 16-24px for card interiors
- **Gaps**: 16-24px between elements

### Animations

All animations use `motion/react` (Framer Motion):

```typescript
// Stagger animations for threat list
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: index * 0.05 }}

// Scale on hover
whileHover={{ scale: 1.1 }}

// Progress bar animation
animate={{ width: `${riskScore}%` }}
transition={{ duration: 1, ease: "easeOut" }}

// Modal entrance
initial={{ scale: 0.9, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: "spring", duration: 0.5 }}
```

## Usage Scenarios

### Scenario 1: Email Link Click

1. User receives email with suspicious link
2. User clicks link in Gmail
3. PhishShield intercepts the click
4. Link Preview modal appears instantly
5. User reviews security metrics
6. User makes informed decision

### Scenario 2: Browser Extension Integration

1. User hovers over link in any webpage
2. Small PhishShield badge appears
3. User clicks badge for full preview
4. Link Preview interface loads
5. User sees complete security analysis

### Scenario 3: Corporate Security Dashboard

1. Security team reviews flagged links
2. Each link opens in Link Preview
3. Team analyzes threat indicators
4. Decision made: block or allow
5. Action logged for compliance

## Interactive Demo

The application includes an **Interactive Link Preview Demo** mode showing:

- Simulated phishing email with multiple suspicious links
- Each link has risk score and context
- Click any link to see Link Preview in modal
- Close modal to return to email view
- Multiple example phishing scenarios

### Demo Links Included:

1. **Microsoft Account Phishing** (Risk: 87%)
   - Spoofed Microsoft domain
   - .tk TLD
   - Invalid SSL

2. **PayPal Payment Scam** (Risk: 94%)
   - HTTP (no HTTPS)
   - .xyz TLD
   - Urgency manipulation

3. **Amazon Delivery Fake** (Risk: 76%)
   - Russian .ru domain
   - Package tracking lure
   - Suspicious subdomain

4. **Bank Login Phishing** (Risk: 91%)
   - Generic banking domain
   - Chase brand spoofing
   - Identity verification lure

## Technical Implementation

### Component Structure

```
LinkPreview.tsx (Main Component)
├── Security Info Bar
│   ├── Risk Score Meter
│   ├── Domain Age Card
│   ├── SSL Status Card
│   └── Location Card
├── Threat Indicators List
├── Sandboxed Preview Window
├── Advanced Details (Expandable)
└── Action Buttons

LinkPreviewDemo.tsx (Interactive Demo)
├── Email Context
├── Suspicious Links List
├── Modal Wrapper
└── LinkPreview Component
```

### Props Interface

```typescript
interface LinkPreviewProps {
  url?: string;           // Target URL to analyze
  riskScore?: number;     // 0-100 risk score
}
```

### State Management

```typescript
const [showFullUrl, setShowFullUrl] = useState(false);
const [expandedSection, setExpandedSection] = useState<string | null>(null);
```

### Data Flow

1. **URL Input** → Analysis engine
2. **Analysis Results** → Risk calculation
3. **Risk Data** → Visual components
4. **User Action** → Security policy enforcement

## Integration with PhishShield Ecosystem

### Email Protection (Gmail/Outlook)

When integrated with email clients:

```typescript
// Content script intercepts link clicks
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && shouldAnalyze(link.href)) {
    e.preventDefault();
    showLinkPreview(link.href);
  }
});
```

### Browser Extension

Chrome/Edge extension manifest:

```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["link-interceptor.js"]
  }],
  "web_accessible_resources": [{
    "resources": ["link-preview.html"],
    "matches": ["<all_urls>"]
  }]
}
```

### API Integration

Connect to PhishShield backend:

```typescript
async function analyzeLinkAPI(url: string) {
  const response = await fetch('https://api.phishshield.ai/v1/link/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ url })
  });
  
  return await response.json();
  // Returns: { riskScore, threats, domain, ssl, location, ... }
}
```

## Security & Privacy

### Data Handling

- ✅ URLs are hashed before storage
- ✅ No user tracking or analytics
- ✅ Preview rendered server-side in sandbox
- ✅ No cookies or localStorage used
- ✅ No third-party scripts loaded

### Sandboxing

Preview iframe uses strict CSP:

```html
<iframe 
  sandbox="allow-same-origin"
  csp="default-src 'none'; img-src data:; style-src 'unsafe-inline';"
  src="about:blank"
></iframe>
```

### Enterprise Features

For corporate deployments:

- SAML/SSO integration
- Centralized policy management
- Audit logging
- Compliance reporting (SOC2, GDPR)
- Custom threat intelligence feeds

## Performance

### Optimization Techniques

- **Lazy Loading**: Preview only loads when needed
- **Debounced Analysis**: 300ms debounce for hover previews
- **Cached Results**: Recent link analyses cached for 5 minutes
- **Progressive Enhancement**: Basic info loads first, details follow
- **Code Splitting**: Preview component loaded on-demand

### Load Times

- Initial render: < 100ms
- Security analysis: < 500ms (with API)
- Preview generation: < 1s
- Total time to interactive: < 1.5s

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels on all interactive elements
- **High Contrast**: Colors meet WCAG AAA standards
- **Focus Indicators**: Visible focus rings
- **Alt Text**: Descriptive text for icons

### Keyboard Shortcuts

- `Esc`: Close preview modal
- `Tab`: Navigate between elements
- `Enter/Space`: Activate buttons
- `Arrow Keys`: Scroll through threats

## Future Enhancements

- [ ] ML-based threat prediction
- [ ] Real-time threat feed updates
- [ ] QR code scanning and analysis
- [ ] Mobile app support
- [ ] Browser history scanning
- [ ] Bulk URL analysis
- [ ] Custom whitelist/blacklist
- [ ] Team sharing of threat reports

## Support & Documentation

- **Developer Docs**: https://docs.phishshield.ai/link-preview
- **API Reference**: https://api.phishshield.ai/docs
- **Support**: support@phishshield.ai
- **Security Issues**: security@phishshield.ai

---

**PhishShield AI Link Preview** - Making the web safer, one link at a time. 🛡️
