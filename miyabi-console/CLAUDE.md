# Miyabi Console - Project Instructions

**Project**: Miyabi Console
**Type**: React + TypeScript + Vite Web Application
**Design System**: Jonathan Ive Principles (Extreme Minimalism)
**Location**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console/`

---

## 🎨 CRITICAL: Design Workflow Protocol

**ALL design work MUST use Gemini 3 Pro Preview + MCP tools.**

### Standard Operating Procedure

**Before ANY design/UI work:**

1. ✅ **Verify MCP servers are active**
   ```bash
   claude mcp list | grep gemini3
   # Expected: gemini3-uiux-designer ✓ Connected
   ```

2. ✅ **Use MCP tools for ALL design decisions**
   - New component → `generate_high_fidelity_mockup`
   - Review existing → `review_design` (target: 90+/100)
   - Check accessibility → `check_accessibility` (WCAG 2.1 AA)
   - Optimize copy → `optimize_ux_writing`

3. ✅ **Apply Jonathan Ive's 5 Principles**
   - Extreme Minimalism
   - Generous Whitespace (py-48 = 192px)
   - Refined Colors (grayscale + ONE accent)
   - Typography-Focused (text-[120px] heroes)
   - Subtle Animation (200ms only)

**Full workflow**: See `GEMINI3_DESIGN_WORKFLOW.md`

---

## 📦 Project Structure

```
miyabi-console/
├── src/
│   ├── pages/              # Page components (Ive-styled)
│   ├── components/         # Shared components
│   ├── design-system/      # Design tokens
│   │   └── ive-tokens.ts   # Jonathan Ive design system
│   ├── lib/                # Utilities & API clients
│   └── types/              # TypeScript definitions
├── .mcp.json              # MCP server configuration
└── GEMINI3_DESIGN_WORKFLOW.md  # Design SOP
```

---

## 🚀 Quick Start

### Development

```bash
# Start dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Type check
npm run type-check
```

### MCP Tools (Design)

```bash
# Verify MCP servers
claude mcp list

# Available tools (gemini3-uiux-designer):
# 1. generate_design_system
# 2. create_wireframe
# 3. generate_high_fidelity_mockup
# 4. review_design
# 5. check_accessibility
# 6. analyze_usability
# 7. optimize_ux_writing
# 8. design_interaction_flow
# 9. create_animation_specs
# 10. evaluate_consistency
```

---

## 🎯 Design Standards

### Quality Thresholds (Non-Negotiable)

| Metric | Minimum | Target |
|--------|---------|--------|
| Design Score | 90/100 | 95+/100 |
| Ive Compliance | 100% | 100% |
| Accessibility | WCAG 2.1 AA | WCAG 2.1 AAA |
| TypeScript | 0 errors | 0 errors |

### Before Shipping ANY Component

- [ ] `review_design` → Score ≥ 90
- [ ] `check_accessibility` → WCAG AA Pass
- [ ] All 5 Ive principles applied
- [ ] TypeScript compilation clean
- [ ] Responsive (mobile-first)

---

## 🎨 Design System Reference

### Colors (ive-tokens.ts)

```typescript
// Grayscale Foundation (99% of UI)
primary: '#FFFFFF'
text: '#111827' (gray-900)
secondary: '#6B7280' (gray-500)

// Single Accent (USE SPARINGLY - primary CTA ONLY)
accent: '#2563EB' (blue-600)

// Borders
border: '#E5E7EB' (gray-200)
divider: '#D1D5DB' (gray-300)
```

### Typography

```typescript
// Heroes
text-7xl md:text-[120px] font-extralight tracking-tighter leading-none

// H1
text-5xl md:text-7xl font-extralight

// Body
text-xl font-light text-gray-600
```

### Spacing

```typescript
// Sections
py-24 md:py-48  // 96-192px

// Elements
mb-16 md:mb-24  // 64-96px

// Grids
gap-8 md:gap-12  // 32-48px
```

### Animation

```typescript
// ONLY allowed
transition-all duration-200 ease-in-out

// Properties: opacity, transform ONLY
// Duration: 200ms ONLY
// Easing: ease-in-out ONLY

// FORBIDDEN: bounce, pulse, shake, wiggle
```

---

## 📝 Component Template

```tsx
/**
 * Component: [Name]
 *
 * Design Score: [90-100]/100
 * Ive Principles: ✅ 100% compliant
 * Accessibility: WCAG 2.1 AA ✅
 *
 * MCP Tools Used:
 * 1. generate_design_system
 * 2. generate_high_fidelity_mockup
 * 3. review_design ([score]/100)
 * 4. check_accessibility (Pass)
 */

import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Icon } from 'lucide-react'

export default function ComponentName() {
  // Component implementation
  // Following Ive principles
}
```

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T

```tsx
// Multiple colors
<p className="text-blue-600">Active</p>
<p className="text-green-500">Success</p>

// Cramped spacing
<section className="py-4">

// Small typography
<h1 className="text-3xl font-bold">

// Flashy animations
<div className="animate-bounce animate-pulse">

// Emojis
<span>🚀</span>

// Shadows
<div className="shadow-2xl">
```

### ✅ DO

```tsx
// Grayscale + ONE accent
<p className="text-gray-900">Active</p>
<Button className="bg-blue-600">Primary CTA</Button> // ONLY blue

// Generous spacing
<section className="py-24 md:py-48">

// Massive typography
<h1 className="text-7xl md:text-[120px] font-extralight">

// Subtle animations
<div className="transition-all duration-200 ease-in-out">

// Minimal icons
<Icon className="w-5 h-5 text-gray-400" />

// Delicate borders
<div className="border border-gray-100">
```

---

## 📚 Documentation

### Design Docs (READ FIRST)
1. **GEMINI3_DESIGN_WORKFLOW.md** - Standard design workflow
2. **DESIGN_REVIEW_IVE.md** - Design analysis & scoring
3. **IVE_IMPLEMENTATION_GUIDE.md** - Implementation guide
4. **src/design-system/ive-tokens.ts** - Token reference

### Implementation Docs
1. **SETUP_COMPLETE.md** - Quick status
2. **IMPLEMENTATION_COMPLETE.md** - Full implementation report
3. **MCP_SERVER_SETUP.md** - MCP configuration

### Architecture
1. **.claude/agents/The_Adaptive_Runtime.md** - Gemini 3 deep dive
2. **README.md** - Project overview

---

## 🔧 Troubleshooting

### MCP Servers Not Connected

```bash
# Check current directory
pwd
# Should be: .../miyabi-console

# Verify .mcp.json exists
ls -la .mcp.json

# Start new session in correct directory
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console
claude

# Verify
claude mcp list
```

### Design Score < 90

```bash
# Use review_design tool
# Check "priority_improvements"
# Apply top 3 recommendations
# Re-review
# Repeat until ≥ 90
```

### TypeScript Errors

```bash
# Check if errors are in new code or pre-existing
npm run type-check

# Pre-existing errors can be ignored
# New code must have 0 errors
```

---

## 🎓 Learning Resources

### Ive's Philosophy
- [Jony Ive on Design](https://www.youtube.com/watch?v=7OTk_qROTq0)
- [Apple Design Resources](https://developer.apple.com/design/)

### Inspiration
- Apple.com homepage
- iPhone product pages
- AirPods Pro landing page

### Implementation
- TailwindCSS documentation
- Lucide React icons
- HeroUI component library

---

## ✅ Pre-Commit Checklist

Before committing any UI changes:

- [ ] MCP `review_design` → Score ≥ 90
- [ ] MCP `check_accessibility` → WCAG AA Pass
- [ ] All 5 Ive principles applied
- [ ] TypeScript 0 errors in new code
- [ ] Responsive tested (mobile + desktop)
- [ ] Component documentation updated

---

## 🚀 Deployment

### Dev
```bash
npm run dev
# → http://localhost:5173
```

### Production Build
```bash
npm run build
# Output: dist/
```

### Quality Gates

All must pass before production:
- ✅ Design score ≥ 90/100
- ✅ Accessibility WCAG AA
- ✅ TypeScript clean
- ✅ Build successful
- ✅ All pages responsive

---

## 🎯 Success Metrics

### Current Status (2025-11-19)

| Metric | Score |
|--------|-------|
| DashboardPage | 96/100 🚀 |
| Layout | 94/100 🚀 |
| Ive Compliance | 100% ✅ |
| Accessibility | WCAG AA ✅ |
| TypeScript | 0 errors ✅ |

### Goals

- Maintain: Design score ≥ 92/100 average
- All new pages: ≥ 90/100 minimum
- 100% WCAG AA compliance
- Zero TypeScript errors

---

## 📞 Support

### Questions?
- Design workflow → `GEMINI3_DESIGN_WORKFLOW.md`
- Ive principles → `DESIGN_REVIEW_IVE.md`
- MCP setup → `MCP_SERVER_SETUP.md`

### Issues?
- GitHub Issues: (if applicable)
- Team chat: (if applicable)

---

## 🔑 Key Principles

### The Golden Rule

```
Design = MCP Tools + Gemini 3 + Ive Principles

1. Generate with MCP tools
2. Review with Gemini 3
3. Apply Ive principles
4. Ship when score ≥ 90
```

### Quality Over Speed

```
❌ Fast but ugly (score 60)
✅ Slower but Insanely Great (score 96)
```

### Consistency is Key

```
Use evaluate_consistency regularly
Maintain design system compliance
Follow ive-tokens.ts religiously
```

---

**"Simplicity is the ultimate sophistication."** - Jonathan Ive

**This project embodies this philosophy through Gemini 3 + MCP automation.**

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
**Location**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console/`
**Status**: ✅ **ACTIVE PROJECT**
