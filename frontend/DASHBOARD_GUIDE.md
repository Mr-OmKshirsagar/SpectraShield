# PhishShield AI - Analytics Dashboard Guide

## Overview

The PhishShield AI Analytics Dashboard provides comprehensive, real-time threat intelligence through an intuitive, enterprise-grade interface. Built for security teams and administrators, it visualizes phishing detection trends, risk patterns, and threat metrics across the organization.

## Dashboard Components

### 📊 Statistics Cards (Top Row)

Four key performance indicators provide instant insights:

#### 1. **Total Detections**
- **Metric**: Total number of phishing attempts detected
- **Period**: Configurable (7d/30d/90d)
- **Trend**: Shows percentage change from previous period
- **Color**: Indigo accent
- **Icon**: Activity pulse
- **Example**: 2,756 detections (+23.5% from last period)

#### 2. **Blocked Threats**
- **Metric**: Successfully blocked phishing attempts
- **Calculation**: Auto-blocked + manually blocked
- **Block Rate**: Percentage of detected threats blocked
- **Color**: Emerald (success)
- **Icon**: Ban/Shield
- **Example**: 2,525 blocked (91.6% block rate)

#### 3. **Average Risk Score**
- **Metric**: Mean risk score of all detected threats
- **Scale**: 0-100 (higher = more dangerous)
- **Color**: Rose (high risk indicator)
- **Icon**: Bar chart
- **Example**: 84 average (High risk)

#### 4. **Active Threats**
- **Metric**: Currently ongoing threats under investigation
- **Status**: Live monitoring
- **Color**: Amber (warning)
- **Icon**: Alert triangle with pulse animation
- **Example**: 12 active threats

### 📈 Weekly Phishing Detection Graph

**Type**: Area Chart (Dual-series)  
**Location**: Top-left, spans 2 columns  
**Time Period**: Last 7 days

#### Features:
- **Detected Line** (Indigo): All phishing attempts identified
- **Blocked Line** (Emerald): Successfully mitigated threats
- **Gap Analysis**: Difference shows threats that bypassed initial detection
- **Gradient Fill**: Visual depth with opacity gradients
- **Interactive Tooltips**: Hover for exact values
- **Grid Lines**: Subtle background grid for easy reading

#### Data Points:
- **X-Axis**: Days of the week (Mon-Sun)
- **Y-Axis**: Number of detections
- **Typical Range**: 150-700 per day

#### Use Cases:
- Identify peak phishing times
- Measure detection effectiveness
- Spot unusual activity patterns
- Track week-over-week trends

### 🏢 Most Impersonated Brands

**Type**: Horizontal Bar Chart  
**Location**: Top-right column

#### Features:
- **Top 6 Brands**: Most frequently impersonated
- **Brand Colors**: Each bar uses the brand's actual color
- **Count Display**: Shows exact number of attempts
- **Relative Sizing**: Bars scaled to #1 brand (100%)
- **Glow Effect**: Subtle box-shadow matching brand color

#### Tracked Brands:
1. **Microsoft** (#00A4EF) - 1,234 attempts
2. **PayPal** (#0070BA) - 987 attempts
3. **Amazon** (#FF9900) - 856 attempts
4. **Apple** (#A2AAAD) - 745 attempts
5. **Google** (#4285F4) - 623 attempts
6. **Netflix** (#E50914) - 512 attempts

#### Insights:
- Helps security teams focus training on commonly spoofed brands
- Identifies emerging impersonation trends
- Guides policy and filtering rules
- Assists in brand protection efforts

### 🔥 Risk Heatmap

**Type**: Calendar Heatmap (7x24 Grid)  
**Location**: Bottom-left column

#### Structure:
- **Rows**: 7 days of the week (Mon-Sun)
- **Columns**: 24 hours (0-23)
- **Cells**: 168 total data points

#### Color Coding:
- **Light Green**: Low risk (0-19)
- **Medium Green**: Moderate risk (20-39)
- **Amber**: Elevated risk (40-59)
- **Orange-Red**: High risk (60-79)
- **Deep Red**: Critical risk (80-100)

#### Features:
- **Hover Details**: Shows exact day, hour, and risk value
- **Pattern Recognition**: Identifies peak threat times
- **Scale Legend**: Color gradient reference at bottom
- **Interactive**: Hover to zoom/highlight cells

#### Use Cases:
- Schedule security staff during high-risk periods
- Optimize automated scanning schedules
- Identify attacker behavior patterns (e.g., evening/weekend attacks)
- Plan maintenance windows during low-risk times

### 📉 Threat Trend Lines

**Type**: Multi-line Chart  
**Location**: Bottom-center, spans 2 columns  
**Time Period**: 6 months

#### Three Threat Categories:

1. **Phishing** (Rose Red #FF0055)
   - Traditional email phishing
   - Credential harvesting
   - Social engineering

2. **Malware** (Amber #fbbf24)
   - Malicious attachments
   - Drive-by downloads
   - Ransomware attempts

3. **Spoofing** (Indigo #6366f1)
   - Domain spoofing
   - Brand impersonation
   - Executive impersonation (CEO fraud)

#### Features:
- **6-Month View**: January through June
- **Trend Analysis**: Shows increasing/decreasing patterns
- **Comparative**: All three threats on same scale
- **Dots**: Data points at each month
- **Smooth Curves**: Monotone interpolation for clarity

#### Insights:
- **Seasonality**: Phishing often spikes during holidays, tax season
- **Correlation**: Can identify if malware and phishing move together
- **Forecast**: Helps predict future threat levels
- **Resource Planning**: Informs staffing and tool investments

### 📋 Recent Flagged Domains Table

**Type**: Data Table  
**Location**: Bottom, full width

#### Columns:

1. **Domain**
   - Full domain name
   - Globe icon prefix
   - Monospace font for clarity
   - Example: `secure-microsoft-verify.tk`

2. **Risk Score**
   - Numerical score (0-100)
   - Color-coded text
   - Mini progress bar
   - Visual severity indicator

3. **Threats**
   - Number of threat indicators
   - Alert badge with count
   - Red background for visibility
   - Example: "8 threats"

4. **First Seen**
   - Time since first detection
   - Relative time format
   - Clock icon
   - Example: "2 hours ago"

5. **Status**
   - Current state
   - Badge style
   - Two states:
     - **Blocked** (Rose): Actively blocked
     - **Monitoring** (Amber): Under observation

6. **Actions**
   - "View Details →" link
   - Opens detailed analysis
   - Indigo accent color

#### Features:
- **6 Most Recent**: Shows latest flagged domains
- **Row Hover**: Highlights on mouse over
- **Alternating Rows**: Subtle stripe for readability
- **Scrollable**: For lists > 6 items
- **Sortable**: Click headers to sort (can be added)

#### Use Cases:
- Quick triage of new threats
- Identify attack campaigns (similar domains)
- Manual review of borderline cases
- Export to SIEM systems

## Design System

### Color Palette

**Primary Backgrounds:**
```css
--navy-deep: #0B1120
--slate-900: #0f172a
--slate-950: #020617
```

**Accent Colors:**
```css
--indigo: #6366f1    /* Primary actions, detected */
--emerald: #10b981   /* Success, blocked */
--rose: #FF0055      /* Danger, high risk */
--amber: #fbbf24     /* Warning, suspicious */
```

**Text Colors:**
```css
--slate-200: #e2e8f0  /* Primary text */
--slate-400: #94a3b8  /* Secondary text */
--slate-500: #64748b  /* Muted text */
```

### Glassmorphism Effects

All cards use glassmorphism for a modern, layered look:

```css
background: linear-gradient(135deg, 
  rgba(15, 23, 42, 0.8), 
  rgba(2, 6, 23, 0.8)
);
backdrop-filter: blur(12px);
border: 1px solid rgba(100, 116, 139, 0.5);
```

### Animations

**Card Entrance:**
- Stagger delay: 0.1s per card
- Motion: Fade in + slide up
- Duration: 0.5s
- Easing: ease-out

**Hover Effects:**
- Border glow (accent color)
- Background overlay fade-in
- Scale: 1.02x (subtle)
- Transition: 0.3s

**Chart Animations:**
- Bars/Areas: Width/height animation (1s)
- Lines: Path drawing effect
- Heatmap: Opacity fade-in

## Interactive Features

### Time Range Selector

Located in top-right header:
- **7 Days**: Default, detailed view
- **30 Days**: Monthly overview
- **90 Days**: Quarterly trends

Changes all time-based visualizations simultaneously.

### Chart Tooltips

Hover over any data point to see:
- Exact values
- Date/time context
- Related metrics
- Dark themed popup
- Rounded corners + shadow

### Table Interactions

- **Row Hover**: Background highlight
- **Click Row**: View full details (can be added)
- **Sort Columns**: Click headers (can be added)
- **Filter/Search**: Top-right search box (can be added)

## Responsive Design

### Breakpoints

- **Desktop** (>1280px): 3-column grid, full features
- **Tablet** (768-1279px): 2-column grid, stacked charts
- **Mobile** (<768px): Single column, scrollable

### Mobile Optimizations

- Cards stack vertically
- Charts maintain aspect ratio
- Table scrolls horizontally
- Touch-friendly hit targets (44px min)
- Simplified tooltips

## Data Integration

### Real-time Updates

Dashboard can be configured for live updates:

```typescript
// Update interval: 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchLatestStats();
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

### API Endpoints (Example)

```typescript
// Fetch dashboard data
GET /api/v1/dashboard/stats?range=7d

Response:
{
  "detections": 2756,
  "blocked": 2525,
  "avgRiskScore": 84,
  "activeThreats": 12,
  "weeklyData": [...],
  "brandData": [...],
  "heatmapData": [...],
  "trendData": [...],
  "recentDomains": [...]
}
```

### WebSocket Support

For real-time threat updates:

```typescript
const ws = new WebSocket('wss://api.phishshield.ai/dashboard');

ws.onmessage = (event) => {
  const threat = JSON.parse(event.data);
  updateDashboard(threat);
  showNotification(threat);
};
```

## Export & Reporting

### CSV Export

Export table data:
- Recent flagged domains
- Full detection history
- Risk scores over time
- Brand impersonation stats

### PDF Reports

Generate executive summaries:
- Weekly threat reports
- Monthly analytics
- Quarterly trends
- Custom date ranges

### Integration

Connect to external systems:
- SIEM (Splunk, QRadar)
- SOAR platforms
- Ticketing systems
- Slack/Teams notifications

## Performance

### Optimization Techniques

1. **Data Aggregation**: Pre-computed metrics
2. **Lazy Loading**: Charts load on-demand
3. **Memoization**: React memo for heavy components
4. **Virtual Scrolling**: For large tables
5. **Debouncing**: Filter/search inputs

### Load Times

- **Initial Render**: <200ms
- **Chart Rendering**: <500ms per chart
- **Data Fetch**: <1s (depends on API)
- **Total Time to Interactive**: <2s

## Accessibility

### WCAG Compliance

- **Color Contrast**: AAA rated (7:1 minimum)
- **Keyboard Navigation**: Full support
- **Screen Readers**: ARIA labels on all data
- **Focus Indicators**: Visible outlines
- **Text Sizing**: Respects user preferences

### Keyboard Shortcuts

- `Tab`: Navigate between elements
- `Arrow Keys`: Navigate table rows
- `Enter`: Open details
- `Esc`: Close modals/tooltips

## Use Cases

### Security Operations Center (SOC)

- **Real-time Monitoring**: Active threat tracking
- **Incident Response**: Quick triage via table
- **Pattern Detection**: Heatmap analysis
- **Trend Forecasting**: Long-term planning

### Executive Dashboard

- **KPI Overview**: Top stats cards
- **Trend Visualization**: Clean, simple charts
- **Risk Summary**: Average risk score
- **Effectiveness Metrics**: Block rate

### Compliance & Audit

- **Historical Data**: 90-day view
- **Export Reports**: PDF/CSV downloads
- **Threat Documentation**: Detailed logs
- **SLA Monitoring**: Block rate tracking

### Security Training

- **Threat Examples**: Recent domains table
- **Brand Awareness**: Impersonation chart
- **Attack Timing**: Heatmap patterns
- **Effectiveness Demo**: Detection vs. blocked

## Customization

### Theme Configuration

Customize colors in `Dashboard.tsx`:

```typescript
const theme = {
  colors: {
    safe: "#00FF94",
    warning: "#fbbf24",
    danger: "#FF0055",
  },
  // ... more customization
};
```

### Chart Configuration

Modify Recharts props:

```typescript
<AreaChart 
  data={data}
  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
>
  {/* Custom configuration */}
</AreaChart>
```

### Adding New Metrics

1. Add stat card to top row
2. Update data fetching logic
3. Configure chart type
4. Add tooltips and interactions

## Troubleshooting

### Charts Not Rendering

- Check recharts import
- Verify data format matches expected structure
- Ensure ResponsiveContainer has width/height

### Performance Issues

- Reduce data points (aggregate by hour instead of minute)
- Implement pagination for large tables
- Use React.memo for expensive components

### Data Not Updating

- Check WebSocket connection
- Verify API endpoints
- Inspect browser network tab
- Check for CORS issues

## Future Enhancements

- [ ] Real-time alerts overlay
- [ ] Drill-down capability (click chart → details)
- [ ] Custom date range picker
- [ ] Comparison mode (this week vs. last week)
- [ ] Threat correlation matrix
- [ ] Geographic attack map
- [ ] AI/ML prediction overlay
- [ ] Dark/light theme toggle

---

**PhishShield AI Dashboard** - Enterprise threat intelligence visualization. 📊🛡️
