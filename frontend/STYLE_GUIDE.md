# PhishShield AI - UI Style Guide

## Overview

PhishShield AI employs a **clean, minimal, high-tech security interface** aesthetic designed for cybersecurity applications. The design system emphasizes clarity, professionalism, and trust while maintaining a modern, futuristic feel.

---

## 🎨 Color Palette

### Primary Background Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Dark Navy** | `#0B1120` | Primary background for all interfaces |
| **Secondary Navy** | `#1a1f35` | Secondary backgrounds, hover states |
| **Slate 900** | `#0f172a` | Cards, panels, elevated surfaces |
| **Slate 950** | `#020617` | Deep backgrounds, overlays |

### Status Colors

#### Safe / Success
- **Color**: `#00FFAA` (Neon Green)
- **Usage**: Success states, verified content, safe indicators, positive actions
- **Variants**:
  - Background: `bg-[#00FFAA]/10`
  - Border: `border-[#00FFAA]/30`
  - Text: `text-[#00FFAA]`

#### Warning / Caution
- **Color**: `#FFA500` (Orange)
- **Usage**: Caution states, medium risk, requires attention
- **Variants**:
  - Background: `bg-[#FFA500]/10`
  - Border: `border-[#FFA500]/30`
  - Text: `text-[#FFA500]`

#### Danger / Critical
- **Color**: `#FF3B3B` (Red)
- **Usage**: Critical alerts, high risk, dangerous actions
- **Variants**:
  - Background: `bg-[#FF3B3B]/10`
  - Border: `border-[#FF3B3B]/30`
  - Text: `text-[#FF3B3B]`

### Text Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **White** | `#FFFFFF` | Headings, primary text |
| **Slate 200** | `#e2e8f0` | Body text, descriptions |
| **Slate 300** | `#cbd5e1` | Secondary text |
| **Slate 400** | `#94a3b8` | Labels, tertiary text |
| **Slate 500** | `#64748b` | Muted text, placeholders |

### Accent Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Indigo** | `#6366f1` | Primary actions, links, accents |
| **Emerald** | `#10b981` | Success, positive metrics |
| **Rose** | `#f43f5e` | Errors, negative metrics |
| **Amber** | `#f59e0b` | Warnings, notifications |

---

## 📝 Typography

### Font Family

**Primary Font**: Inter  
**Alternative**: Poppins  
**Monospace**: System monospace for code, URLs

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

### Heading Styles

#### H1 - Main Page Titles
```tsx
<h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
  PhishShield AI
</h1>
```
- **Size**: `text-4xl` (36px)
- **Weight**: `font-bold`
- **Effect**: Gradient text

#### H2 - Section Titles
```tsx
<h2 className="text-3xl font-bold text-white">
  Security Dashboard
</h2>
```
- **Size**: `text-3xl` (30px)
- **Weight**: `font-bold`
- **Color**: White

#### H3 - Subsection Titles
```tsx
<h3 className="text-2xl font-semibold text-slate-200">
  Threat Analysis
</h3>
```
- **Size**: `text-2xl` (24px)
- **Weight**: `font-semibold`
- **Color**: Slate 200

#### H4 - Card Titles
```tsx
<h4 className="text-xl font-semibold text-slate-300">
  Recent Alerts
</h4>
```
- **Size**: `text-xl` (20px)
- **Weight**: `font-semibold`
- **Color**: Slate 300

#### H5 - Component Headers
```tsx
<h5 className="text-lg font-medium text-slate-300">
  Risk Breakdown
</h5>
```
- **Size**: `text-lg` (18px)
- **Weight**: `font-medium`
- **Color**: Slate 300

### Body Text

#### Large Body Text
```tsx
<p className="text-base text-slate-200">
  Primary content and important descriptions
</p>
```
- **Size**: `text-base` (16px)
- **Color**: Slate 200

#### Regular Body Text
```tsx
<p className="text-sm text-slate-300">
  Standard content and interface labels
</p>
```
- **Size**: `text-sm` (14px)
- **Color**: Slate 300

#### Small Text
```tsx
<p className="text-xs text-slate-400">
  Captions, helper text, supplementary information
</p>
```
- **Size**: `text-xs` (12px)
- **Color**: Slate 400

### Special Text Styles

#### Label Text (Uppercase)
```tsx
<span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
  Risk Score
</span>
```

#### Monospace (Code/URLs)
```tsx
<span className="font-mono text-sm text-slate-300">
  secure-verify-account.tk
</span>
```

---

## 🔘 Button Styles

### Primary Buttons

#### Safe Action Button
```tsx
<button className="px-6 py-3 bg-[#00FFAA] hover:bg-[#00FFAA]/90 text-[#0B1120] font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#00FFAA]/20">
  Verify Safe
</button>
```

#### Warning Action Button
```tsx
<button className="px-6 py-3 bg-[#FFA500] hover:bg-[#FFA500]/90 text-[#0B1120] font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#FFA500]/20">
  Review Warning
</button>
```

#### Danger Action Button
```tsx
<button className="px-6 py-3 bg-[#FF3B3B] hover:bg-[#FF3B3B]/90 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#FF3B3B]/20">
  Block Threat
</button>
```

### Secondary Buttons

#### Outlined Safe Button
```tsx
<button className="px-6 py-3 bg-[#00FFAA]/10 hover:bg-[#00FFAA]/20 border-2 border-[#00FFAA]/30 hover:border-[#00FFAA]/50 text-[#00FFAA] font-semibold rounded-xl transition-all">
  Safe Action
</button>
```

#### Outlined Warning Button
```tsx
<button className="px-6 py-3 bg-[#FFA500]/10 hover:bg-[#FFA500]/20 border-2 border-[#FFA500]/30 hover:border-[#FFA500]/50 text-[#FFA500] font-semibold rounded-xl transition-all">
  Warning Action
</button>
```

#### Outlined Danger Button
```tsx
<button className="px-6 py-3 bg-[#FF3B3B]/10 hover:bg-[#FF3B3B]/20 border-2 border-[#FF3B3B]/30 hover:border-[#FF3B3B]/50 text-[#FF3B3B] font-semibold rounded-xl transition-all">
  Danger Action
</button>
```

### Ghost Buttons

```tsx
<button className="px-6 py-3 hover:bg-slate-800/50 text-slate-300 hover:text-white font-medium rounded-xl transition-all">
  Ghost Button
</button>
```

### Icon Buttons

#### Standard Icon Button
```tsx
<button className="w-10 h-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg transition-all text-slate-300 hover:text-white">
  <Settings className="w-5 h-5" />
</button>
```

#### Icon Button with Status Color
```tsx
<button className="w-10 h-10 flex items-center justify-center bg-[#00FFAA]/10 hover:bg-[#00FFAA]/20 border border-[#00FFAA]/30 rounded-lg transition-all text-[#00FFAA]">
  <CheckCircle className="w-5 h-5" />
</button>
```

### Button Sizes

| Size | Classes | Padding |
|------|---------|---------|
| **Small** | `px-3 py-1.5 text-sm rounded-lg` | 12px × 6px |
| **Medium** | `px-4 py-2 rounded-lg` | 16px × 8px |
| **Large** | `px-6 py-3 rounded-xl` | 24px × 12px |

---

## 🗃️ Card Design System

### Basic Card

```tsx
<div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
  {/* Card content */}
</div>
```

**Key Properties**:
- Gradient background with transparency
- Border with 50% opacity
- Border radius: `rounded-xl` (12px)
- Glassmorphism: `backdrop-blur-sm`

### Hover Card (Interactive)

```tsx
<div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all cursor-pointer">
  {/* Interactive card content */}
</div>
```

### Status Cards

#### Safe Status Card
```tsx
<div className="relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-[#00FFAA]/30 rounded-xl p-6 backdrop-blur-sm overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-[#00FFAA]/5 to-transparent" />
  <div className="relative z-10">
    <CheckCircle className="w-8 h-8 text-[#00FFAA] mb-3" />
    <h4 className="text-lg font-semibold text-white mb-2">Safe Status</h4>
    <p className="text-sm text-slate-400">No threats detected</p>
  </div>
</div>
```

#### Warning Status Card
```tsx
<div className="relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-[#FFA500]/30 rounded-xl p-6 backdrop-blur-sm overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-[#FFA500]/5 to-transparent" />
  <div className="relative z-10">
    <AlertTriangle className="w-8 h-8 text-[#FFA500] mb-3" />
    <h4 className="text-lg font-semibold text-white mb-2">Warning Status</h4>
    <p className="text-sm text-slate-400">Requires attention</p>
  </div>
</div>
```

#### Danger Status Card
```tsx
<div className="relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-[#FF3B3B]/30 rounded-xl p-6 backdrop-blur-sm overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-[#FF3B3B]/5 to-transparent" />
  <div className="relative z-10">
    <XCircle className="w-8 h-8 text-[#FF3B3B] mb-3" />
    <h4 className="text-lg font-semibold text-white mb-2">Danger Status</h4>
    <p className="text-sm text-slate-400">Critical threat</p>
  </div>
</div>
```

### Feature Card (Hover Effect)

```tsx
<div className="group bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-[#00FFAA]/30 transition-all cursor-pointer">
  <div className="w-12 h-12 bg-[#00FFAA]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#00FFAA]/20 transition-all">
    <Shield className="w-6 h-6 text-[#00FFAA]" />
  </div>
  <h4 className="text-lg font-semibold text-white mb-2">Real-time Protection</h4>
  <p className="text-sm text-slate-400">
    Continuous monitoring and threat detection
  </p>
</div>
```

### Data/Stats Card

```tsx
<div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
  <div className="flex items-center justify-between mb-2">
    <Shield className="w-5 h-5 text-[#00FFAA]" />
    <span className="text-xs text-[#00FFAA] font-semibold">+12%</span>
  </div>
  <div className="text-2xl font-bold text-white mb-1">2,547</div>
  <div className="text-xs text-slate-500 uppercase tracking-wider">Threats Blocked</div>
</div>
```

---

## 🚨 Alert Components

### Success Alert

```tsx
<div className="bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-xl p-4 backdrop-blur-sm flex items-start gap-3">
  <CheckCircle className="w-5 h-5 text-[#00FFAA] flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-sm font-semibold text-[#00FFAA] mb-1">Success</div>
    <div className="text-sm text-slate-300">Operation completed successfully</div>
  </div>
  <button className="text-[#00FFAA] hover:text-[#00FFAA]/70 transition-colors">
    <X className="w-4 h-4" />
  </button>
</div>
```

### Warning Alert

```tsx
<div className="bg-[#FFA500]/10 border border-[#FFA500]/30 rounded-xl p-4 backdrop-blur-sm flex items-start gap-3">
  <AlertTriangle className="w-5 h-5 text-[#FFA500] flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-sm font-semibold text-[#FFA500] mb-1">Warning</div>
    <div className="text-sm text-slate-300">This action requires attention</div>
  </div>
  <button className="text-[#FFA500] hover:text-[#FFA500]/70 transition-colors">
    <X className="w-4 h-4" />
  </button>
</div>
```

### Danger Alert

```tsx
<div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-xl p-4 backdrop-blur-sm flex items-start gap-3">
  <ShieldAlert className="w-5 h-5 text-[#FF3B3B] flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-sm font-semibold text-[#FF3B3B] mb-1">Critical Threat</div>
    <div className="text-sm text-slate-300">Immediate action required</div>
  </div>
  <button className="text-[#FF3B3B] hover:text-[#FF3B3B]/70 transition-colors">
    <X className="w-4 h-4" />
  </button>
</div>
```

### Info Alert

```tsx
<div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm flex items-start gap-3">
  <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-sm font-semibold text-indigo-400 mb-1">Information</div>
    <div className="text-sm text-slate-300">Important system update available</div>
  </div>
  <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
    <X className="w-4 h-4" />
  </button>
</div>
```

### Left-Border Alert Style

```tsx
<div className="bg-[#00FFAA]/5 border-l-4 border-[#00FFAA] rounded-r-xl p-4 backdrop-blur-sm flex items-start gap-3">
  <CheckCircle className="w-5 h-5 text-[#00FFAA] flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="text-sm font-semibold text-white mb-1">Protected</div>
    <div className="text-sm text-slate-400">Your system is secure</div>
  </div>
</div>
```

### Banner Alert

```tsx
<div className="bg-gradient-to-r from-[#FF3B3B]/20 to-[#FF3B3B]/5 border border-[#FF3B3B]/30 rounded-xl p-4 backdrop-blur-sm">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <ShieldAlert className="w-6 h-6 text-[#FF3B3B]" />
      <div>
        <div className="text-sm font-bold text-white">Critical Security Alert</div>
        <div className="text-xs text-slate-400">Immediate action required</div>
      </div>
    </div>
    <button className="px-4 py-2 bg-[#FF3B3B] hover:bg-[#FF3B3B]/90 text-white font-semibold rounded-lg text-sm transition-all">
      Review Now
    </button>
  </div>
</div>
```

---

## 🎯 Iconography Style

### Icon Library

**Library**: Lucide React  
**Import**: `import { Shield, Mail, Lock } from "lucide-react"`

### Icon Sizes

| Size | Class | Pixels | Usage |
|------|-------|--------|-------|
| **Extra Small** | `w-4 h-4` | 16px | Inline icons, badges |
| **Small** | `w-5 h-5` | 20px | Buttons, alerts, labels |
| **Medium** | `w-6 h-6` | 24px | Feature cards, navigation |
| **Large** | `w-8 h-8` | 32px | Status cards, headers |
| **Extra Large** | `w-12 h-12` | 48px | Hero sections, splash |

### Icon Categories

#### Security Icons
- `Shield` - General protection
- `ShieldCheck` - Verified/safe
- `ShieldAlert` - Threat detected
- `Lock` - Secure/encrypted
- `Eye` - Monitoring/viewing

#### Status Icons
- `CheckCircle` - Success/safe
- `AlertTriangle` - Warning/caution
- `XCircle` - Danger/error
- `Info` - Information
- `Bell` - Notification

#### Action Icons
- `Download` - Download action
- `Upload` - Upload action
- `Settings` - Configuration
- `User` - Profile/account
- `Search` - Search function
- `Filter` - Filter data
- `Plus` - Add/create
- `Minus` - Remove/delete
- `X` - Close/dismiss
- `ChevronRight` - Navigate forward

### Icon with Background

#### Square Background
```tsx
<div className="w-12 h-12 bg-[#00FFAA]/10 rounded-lg flex items-center justify-center">
  <Shield className="w-6 h-6 text-[#00FFAA]" />
</div>
```

#### Circle Background
```tsx
<div className="w-12 h-12 bg-[#00FFAA]/10 rounded-full flex items-center justify-center">
  <Shield className="w-6 h-6 text-[#00FFAA]" />
</div>
```

#### Glow Effect
```tsx
<div className="relative">
  <div className="absolute inset-0 bg-[#00FFAA]/30 blur-xl rounded-full" />
  <Shield className="w-12 h-12 text-[#00FFAA] relative z-10" />
</div>
```

#### Gradient Background
```tsx
<div className="w-12 h-12 bg-gradient-to-br from-[#00FFAA]/20 to-[#00FFAA]/5 border border-[#00FFAA]/30 rounded-lg flex items-center justify-center">
  <Shield className="w-6 h-6 text-[#00FFAA]" />
</div>
```

---

## ✨ Visual Effects

### Glassmorphism

```css
background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.8));
backdrop-filter: blur(12px);
border: 1px solid rgba(100, 116, 139, 0.5);
```

### Gradient Text

```tsx
<h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
  Gradient Text
</h1>
```

### Glow Effects

```tsx
<div className="shadow-lg shadow-[#00FFAA]/20">
  {/* Content with glow */}
</div>
```

### Border Gradients

```tsx
<div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50">
  {/* Content */}
</div>
```

---

## 📏 Spacing & Layout

### Spacing Scale

| Token | Class | Size |
|-------|-------|------|
| `xs` | `gap-1`, `p-1` | 4px |
| `sm` | `gap-2`, `p-2` | 8px |
| `md` | `gap-4`, `p-4` | 16px |
| `lg` | `gap-6`, `p-6` | 24px |
| `xl` | `gap-8`, `p-8` | 32px |

### Border Radius

| Size | Class | Pixels |
|------|-------|--------|
| Small | `rounded-lg` | 8px |
| Medium | `rounded-xl` | 12px |
| Large | `rounded-2xl` | 16px |
| Full | `rounded-full` | 9999px |

### Container Max Widths

| Size | Class | Width |
|------|-------|-------|
| Small | `max-w-3xl` | 768px |
| Medium | `max-w-5xl` | 1024px |
| Large | `max-w-7xl` | 1280px |

---

## 🎬 Animations

### Entrance Animations

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Content */}
</motion.div>
```

### Hover Animations

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Hover me
</motion.button>
```

### Stagger Children

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.1 } }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

---

## 📱 Responsive Design

### Breakpoints

| Size | Min Width | Tailwind Class |
|------|-----------|----------------|
| Mobile | - | Default |
| Tablet | 768px | `md:` |
| Desktop | 1024px | `lg:` |
| Wide | 1280px | `xl:` |

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Grid items */}
</div>
```

---

## ♿ Accessibility

### Color Contrast

All color combinations meet **WCAG AAA standards** (7:1 minimum contrast ratio).

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order

### Screen Reader Support

- Semantic HTML elements
- ARIA labels on all icons
- Descriptive alt text for images

---

## 📦 Component Library

Access the interactive style guide at: **Style Guide View** (toggle from main navigation)

---

**PhishShield AI** - Professional cybersecurity design system for modern applications. 🛡️✨
