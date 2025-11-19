# Gemini 3 UI/UX Designer MCP Server

**"Simplicity is the ultimate sophistication."** - Jonathan Ive

A Model Context Protocol (MCP) server powered by Gemini 3 Pro Preview, embodying Jonathan Ive's legendary design philosophy for UI/UX design, prototyping, accessibility, and usability analysis.

## 🎨 Design Philosophy

This server follows **5 core principles** from Jonathan Ive's Apple design language:

1. **Extreme Minimalism** - Remove all decoration, keep only essence
2. **Generous Whitespace** - Luxury of emptiness, breathing room
3. **Refined Colors** - Grayscale foundation + ONE accent color
4. **Typography-Focused** - Huge ultra-light titles with bold size contrast
5. **Subtle Animation** - Natural, inevitable, imperceptible movements

## 📦 What's Included

### 10 Specialized Tools

#### 🔍 Design Review & System
1. **review_design** - 100-point Ive-style design evaluation
2. **generate_design_system** - Complete design system (colors, typography, spacing)

#### 🎨 Prototyping
3. **create_wireframe** - Minimalist layout wireframes
4. **generate_high_fidelity_mockup** - Full Ive-styled React components

#### ♿ Accessibility & Usability
5. **check_accessibility** - WCAG 2.1 AA compliance audit
6. **analyze_usability** - Nielsen heuristics + friction analysis

#### ✍️ Content & Interaction
7. **optimize_ux_writing** - Microcopy optimization
8. **design_interaction_flow** - State transitions + micro-interactions

#### ✨ Animation & Consistency
9. **create_animation_specs** - Subtle animation specifications
10. **evaluate_consistency** - Cross-design consistency check

## 🚀 Quick Start

### Installation

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-uiux-designer
npm install
npm run build
```

### Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "gemini3-uiux-designer": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-uiux-designer/dist/index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 📚 Tool Documentation

### 1. review_design

Review UI/UX designs with Ive's critical eye. Returns 100-point score with detailed feedback.

**Scoring System:**
- **Visual Design (40 pts)**: Color, Typography, Whitespace, Consistency
- **User Experience (40 pts)**: Intuitiveness, Accessibility, Responsiveness, Performance
- **Innovation (20 pts)**: Uniqueness, Progressiveness

**Ratings:**
- **90-100**: Insanely Great 🚀 (Ship it!)
- **80-89**: Good ✅ (Minor improvements)
- **70-79**: Needs Work ⚠️ (Major revisions)
- **0-69**: Reject ❌ (Start over)

**Example:**
```typescript
{
  "designCode": "<section className=\"bg-white py-48\">...</section>",
  "designDescription": "Landing page hero section",
  "context": "SaaS product, B2B audience"
}
```

**Output:**
```json
{
  "overall_score": 95,
  "rating": "Insanely Great",
  "visual_design": {
    "color_usage": { "score": 10, "comment": "Perfect grayscale..." },
    "typography": { "score": 10, "comment": "Excellent hierarchy..." },
    "whitespace": { "score": 10, "comment": "Generous py-48..." },
    "consistency": { "score": 9, "comment": "Minor inconsistency..." }
  },
  "strengths": ["Pure grayscale palette", "Massive ultra-light title"],
  "weaknesses": [{"issue": "...", "solution": "..."}],
  "priority_improvements": [...]
}
```

---

### 2. generate_design_system

Generate complete design system following Ive principles.

**Includes:**
- **Color Palette**: Grayscale + one accent
- **Typography**: Hero, H1, H2, Body with Tailwind classes
- **Spacing**: Section, element, grid spacing rules
- **Animation**: Subtle transition guidelines

**Example:**
```typescript
{
  "projectName": "Miyabi",
  "brandIdentity": "Professional, minimal, powerful",
  "accentColor": "#2563EB"
}
```

**Output:**
```json
{
  "color_palette": {
    "primary": "#FFFFFF",
    "secondary": "#F9FAFB",
    "text": "#111827",
    "accent": "#2563EB",
    "border": "#E5E7EB"
  },
  "typography": {
    "hero": {
      "class": "text-[120px] font-extralight tracking-tighter leading-none",
      "description": "Massive landing page titles"
    },
    ...
  },
  "spacing": {
    "section_padding": "py-48 (192px)",
    "element_margin": "mb-24 (96px)",
    "grid_gap": "gap-16 (64px)"
  },
  "animation": {
    "duration": "200ms",
    "easing": "ease-in-out",
    "recommended_properties": ["opacity", "transform"]
  },
  "principles": [
    "Extreme minimalism applied",
    "Generous whitespace (py-48)",
    "Single accent color (#2563EB)",
    "Subtle animations only"
  ]
}
```

---

### 3. create_wireframe

Create minimalist wireframes focusing on structure, not style.

**Example:**
```typescript
{
  "pageTitle": "Product Dashboard",
  "purpose": "Show user metrics and recent activity",
  "userFlow": ["Login", "View dashboard", "Click metric", "See details"]
}
```

**Output:**
```json
{
  "page_title": "Product Dashboard",
  "layout_description": "Three-column layout with header...",
  "sections": [
    {
      "name": "Header",
      "purpose": "Navigation and user profile",
      "components": ["Logo", "Nav menu", "Profile dropdown"]
    },
    {
      "name": "Metrics Grid",
      "purpose": "Display key performance indicators",
      "components": ["Metric card (4x)", "Chart component"]
    }
  ],
  "user_flow": ["Load dashboard", "Scan metrics", "Click metric card", "View detail modal"]
}
```

---

### 4. generate_high_fidelity_mockup

Generate production-ready React components with full Ive styling.

**Applies:**
- `text-[120px] font-extralight` for heroes
- `py-48` generous padding
- Grayscale + one accent color
- `transition-all duration-200` subtle animations
- `h-px` delicate 1px dividers

**Example:**
```typescript
{
  "pageTitle": "Pricing Page",
  "content": "Three tiers: Free, Pro, Enterprise. Features list for each.",
  "designSystem": {...} // Optional, from generate_design_system
}
```

**Output:**
```json
{
  "page_title": "Pricing Page",
  "design_rationale": "Vertical card layout with generous whitespace...",
  "react_code": "import React from 'react';\n\nexport function PricingPage() {\n  return (\n    <section className=\"bg-white py-48 px-5\">...",
  "design_system_used": {
    "colors": ["#FFFFFF", "#F9FAFB", "#111827", "#2563EB"],
    "typography": ["text-[120px] font-extralight", "text-7xl font-semibold"],
    "spacing": ["py-48", "mb-24", "gap-16"]
  },
  "ive_principles_applied": [
    "Extreme minimalism - no decoration",
    "Generous whitespace - py-48 sections",
    "Single accent color - #2563EB for CTA only",
    "Huge ultra-light title - text-[120px] font-extralight"
  ],
  "accessibility_features": [
    "Semantic HTML (section, article)",
    "ARIA labels on interactive elements",
    "Color contrast ratio > 4.5:1"
  ]
}
```

---

### 5. check_accessibility

Comprehensive WCAG 2.1 AA (or AAA) compliance audit.

**Checks:**
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: Tab order, focus indicators, skip links
- **Screen Reader**: ARIA labels, semantic HTML, alt text
- **Forms**: Labels, error messages, required fields
- **Interactive**: Button states, link text, focus management

**Example:**
```typescript
{
  "designCode": "<button className=\"bg-gray-200 text-gray-400\">Submit</button>",
  "wcagLevel": "AA"
}
```

**Output:**
```json
{
  "wcag_version": "2.1 AA",
  "overall_compliance": "Fail",
  "checks": [
    {
      "criterion": "1.4.3 Contrast (Minimum)",
      "level": "AA",
      "status": "Fail",
      "description": "Text must have 4.5:1 contrast ratio",
      "issues": ["Button text (gray-400 on gray-200) has 2.1:1 ratio"],
      "recommendations": ["Use gray-900 text on gray-200 background (8.5:1 ratio)"]
    },
    {
      "criterion": "2.1.1 Keyboard",
      "level": "A",
      "status": "Pass",
      "description": "All functionality available via keyboard",
      "issues": [],
      "recommendations": []
    }
  ],
  "keyboard_navigation": {
    "status": "Pass",
    "issues": []
  },
  "screen_reader": {
    "status": "Partial",
    "issues": ["Button lacks aria-label describing action"]
  }
}
```

---

### 6. analyze_usability

Usability analysis using **Nielsen's 10 Heuristics** + friction point identification.

**Heuristics:**
1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

**Example:**
```typescript
{
  "designDescription": "Multi-step form for account creation",
  "userTask": "Create account and set up profile",
  "designCode": "..." // Optional
}
```

**Output:**
```json
{
  "user_flow_analysis": {
    "optimal_path": ["Enter email", "Set password", "Verify email", "Add profile info", "Complete"],
    "friction_points": [
      {
        "step": "Set password",
        "issue": "Password requirements not shown until after error",
        "severity": "high",
        "solution": "Display requirements before user types"
      }
    ]
  },
  "heuristic_evaluation": [
    {
      "heuristic": "Error Prevention (#5)",
      "rating": 2,
      "findings": "Password requirements shown after error, not before",
      "severity": "major"
    },
    {
      "heuristic": "Aesthetic and Minimalist Design (#8)",
      "rating": 4,
      "findings": "Clean, focused form with no distractions",
      "severity": "cosmetic"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "issue": "Password requirements hidden until error",
      "solution": "Add inline validation with green checkmarks as user types",
      "expected_impact": "Reduce form abandonment by 30%"
    }
  ]
}
```

---

### 7. optimize_ux_writing

Optimize microcopy, button labels, error messages, tooltips.

**Principles:**
- **Clarity**: Be specific and unambiguous
- **Brevity**: Fewest words possible
- **Consistency**: Match platform conventions
- **Actionable**: Verbs over nouns
- **Human**: Conversational but professional

**Example:**
```typescript
{
  "originalText": "Click here to submit your information to our database",
  "context": "Button label",
  "tone": "Professional but friendly"
}
```

**Output:**
```json
{
  "original_text": "Click here to submit your information to our database",
  "optimized_text": "Save Profile",
  "improvements": [
    {
      "aspect": "Brevity",
      "before": "Click here to submit your information to our database",
      "after": "Save Profile",
      "rationale": "Removed redundant 'click here' (implied) and technical jargon ('database'). Users care about saving their profile, not database mechanics."
    },
    {
      "aspect": "Actionability",
      "before": "submit your information",
      "after": "Save",
      "rationale": "Strong verb ('Save') is more direct than passive phrase."
    }
  ],
  "tone_analysis": {
    "current_tone": ["formal", "technical", "wordy"],
    "recommended_tone": ["professional", "friendly", "concise"],
    "alignment_with_brand": "Optimized version matches modern SaaS tone better"
  },
  "readability": {
    "reading_level": "Grade 3 (vs Grade 8 before)",
    "recommendations": [
      "Use simple verbs (Save vs Submit)",
      "Avoid 'click here' redundancy",
      "Remove technical terms (database)"
    ]
  }
}
```

---

### 8. design_interaction_flow

Design complete interaction flows with state transitions and micro-interactions.

**Example:**
```typescript
{
  "flowName": "Add to Cart",
  "objective": "User adds item to cart with clear feedback",
  "steps": ["View product", "Click add to cart", "See confirmation", "Continue shopping"]
}
```

**Output:**
```json
{
  "flow_name": "Add to Cart",
  "objective": "Provide instant, clear feedback when item added",
  "steps": [
    {
      "step_number": 1,
      "user_action": "Hovers over 'Add to Cart' button",
      "system_response": "Button background lightens slightly",
      "ui_state": "hover",
      "animation": "bg-gray-900 → bg-gray-800, duration-200"
    },
    {
      "step_number": 2,
      "user_action": "Clicks 'Add to Cart'",
      "system_response": "Button shows loading state, then checkmark",
      "ui_state": "loading → success",
      "animation": "Spinner (200ms) → Checkmark fade-in (200ms)"
    },
    {
      "step_number": 3,
      "user_action": "N/A (automatic)",
      "system_response": "Toast notification appears top-right",
      "ui_state": "notification_shown",
      "animation": "Slide-in from right + fade-in (200ms)"
    }
  ],
  "interaction_patterns": [
    {
      "pattern_name": "Optimistic UI",
      "description": "Assume action succeeds, update UI immediately",
      "when_to_use": "Fast, reliable actions like adding to cart"
    }
  ],
  "micro_interactions": [
    {
      "trigger": "Button hover",
      "feedback": "Background color lightens",
      "duration": "200ms",
      "easing": "ease-in-out"
    },
    {
      "trigger": "Click success",
      "feedback": "Checkmark icon appears",
      "duration": "200ms",
      "easing": "ease-in-out"
    }
  ]
}
```

---

### 9. create_animation_specs

Create subtle animation specifications following Ive principles.

**Ive Animation Rules:**
- **Duration**: 200ms (quick, imperceptible)
- **Easing**: ease-in-out (natural)
- **Properties**: opacity, transform ONLY (no color)
- **Avoid**: pulse, bounce, shake, wiggle
- **Goal**: Natural, inevitable, subtle

**Example:**
```typescript
{
  "animationName": "Modal Appear",
  "purpose": "Smoothly show modal dialog",
  "element": "modal"
}
```

**Output:**
```json
{
  "animation_name": "Modal Appear",
  "purpose": "Smoothly show modal without jarring user",
  "ive_principle": "Subtle animation - natural, inevitable, imperceptible",
  "specs": {
    "duration": "200ms",
    "easing": "ease-in-out",
    "properties": ["opacity", "transform"],
    "timing": "Single-step (no delays)"
  },
  "css_code": "/* Tailwind CSS */\n.modal {\n  @apply transition-all duration-200 ease-in-out;\n  @apply opacity-0 scale-95;\n}\n\n.modal.active {\n  @apply opacity-100 scale-100;\n}",
  "framer_motion_code": "import { motion } from 'framer-motion';\n\nconst modalVariants = {\n  hidden: { opacity: 0, scale: 0.95 },\n  visible: { \n    opacity: 1, \n    scale: 1,\n    transition: { duration: 0.2, ease: 'easeInOut' }\n  }\n};\n\n<motion.div\n  variants={modalVariants}\n  initial=\"hidden\"\n  animate=\"visible\"\n>",
  "accessibility_notes": [
    "Respect prefers-reduced-motion media query",
    "Duration short enough to not feel slow",
    "No distraction from content"
  ],
  "performance_notes": [
    "Use transform and opacity (GPU-accelerated)",
    "Avoid animating width, height, or color",
    "Single animation, no chaining"
  ]
}
```

---

### 10. evaluate_consistency

Evaluate design consistency across multiple pages/components.

**Checks:**
- Color usage patterns
- Typography hierarchy
- Spacing consistency
- Component patterns
- Design system adherence
- Brand alignment

**Example:**
```typescript
{
  "designs": [
    { "name": "Homepage", "code": "..." },
    { "name": "Dashboard", "code": "..." },
    { "name": "Settings", "code": "..." }
  ],
  "designSystem": {...} // Optional
}
```

**Output:**
```json
{
  "overall_consistency_score": 78,
  "areas_evaluated": [
    {
      "area": "Color Usage",
      "score": 9,
      "consistent_elements": [
        "All pages use white background",
        "Gray-900 text consistent",
        "Blue-600 accent used only for primary CTA"
      ],
      "inconsistent_elements": [
        {
          "element": "Secondary button",
          "issue": "Dashboard uses gray-200, Settings uses gray-300",
          "location": "Dashboard line 45, Settings line 67",
          "recommendation": "Standardize on gray-200 (lighter, better contrast)"
        }
      ]
    },
    {
      "area": "Typography",
      "score": 7,
      "consistent_elements": ["H1 uses text-7xl", "Body uses text-xl"],
      "inconsistent_elements": [
        {
          "element": "Section headings",
          "issue": "Homepage uses text-5xl, Dashboard uses text-4xl",
          "location": "Homepage line 23, Dashboard line 34",
          "recommendation": "Use text-5xl consistently for section headings"
        }
      ]
    }
  ],
  "brand_alignment": {
    "score": 85,
    "aligned_aspects": [
      "Minimalist aesthetic maintained",
      "Generous whitespace throughout",
      "Professional tone"
    ],
    "misaligned_aspects": [
      "Settings page uses illustrations (breaks minimalism)"
    ]
  },
  "design_system_compliance": {
    "score": 72,
    "compliant_components": ["Header", "Footer", "Primary buttons"],
    "non_compliant_components": [
      {
        "component": "Card component on Dashboard",
        "deviation": "Uses gray-100 background instead of white",
        "fix": "Change bg-gray-100 to bg-white, use border instead"
      }
    ]
  }
}
```

---

## 🎯 Best Practices

### ✅ DO (Ive-Approved)

```tsx
// Perfect Ive-style hero
<section className="bg-white py-48 px-5 text-center">
  <div className="max-w-5xl mx-auto">
    <h1 className="text-[120px] font-extralight tracking-tighter text-gray-900 leading-none mb-6">
      Product Name
    </h1>
    <div className="h-px w-24 bg-gray-300 mx-auto mb-20"></div>
    <p className="text-2xl text-gray-600 font-light">
      Simple. Powerful. Beautiful.
    </p>
  </div>
</section>
```

**Why it's good:**
- Massive title with ultra-light font
- Generous vertical padding (py-48 = 192px)
- Pure grayscale (white, gray-900, gray-600, gray-300)
- Delicate 1px divider (h-px)
- Minimal text, maximum impact

### ❌ DON'T (Reject)

```tsx
// Bad: Too much going on
<section className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
  <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
  <h1 className="text-8xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
    🌸 Product Name ✨
  </h1>
  <button className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 hover:scale-110 transition transform duration-300 rounded-full shadow-2xl animate-bounce">
    Get Started Now! 🚀
  </button>
</section>
```

**Why it's bad:**
- 5+ colors (purple, blue, indigo, pink, green)
- Multiple gradients everywhere
- Flashy animations (pulse, bounce, scale-110)
- Emoji spam (🌸✨🚀)
- Drop shadows and blur effects
- No whitespace (cramped)

---

## 🏆 Design Scoring Reference

| Score | Rating | Action | Example |
|-------|--------|--------|---------|
| 90-100 | **Insanely Great** 🚀 | Ship immediately | Apple.com hero sections |
| 80-89 | **Good** ✅ | Minor tweaks, then ship | Well-executed minimalism with small flaws |
| 70-79 | **Needs Work** ⚠️ | Major revisions required | Good concept, poor execution |
| 0-69 | **Reject** ❌ | Start over with Ive principles | Gradient spam, flashy animations |

---

## 🔧 Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run dev
```

### Start Server
```bash
npm start
```

---

## 📖 Integration with Miyabi

This server is designed to integrate with Miyabi's existing agents:

- **Jonathan Ive Design Agent** - Use these MCP tools to execute Ive's reviews
- **Product Design Agent** - Generate design systems for product concepts
- **Marketing Agent** - Create landing page mockups
- **Content Creation Agent** - Optimize UX writing for UI components

---

## 🌟 Example Workflow

1. **Generate Design System**
   ```
   Use generate_design_system to create Miyabi's design system
   ```

2. **Create Wireframe**
   ```
   Use create_wireframe for the dashboard page
   ```

3. **Generate Hi-Fi Mockup**
   ```
   Use generate_high_fidelity_mockup to convert wireframe to React
   ```

4. **Review Design**
   ```
   Use review_design to get Ive's 100-point evaluation
   ```

5. **Check Accessibility**
   ```
   Use check_accessibility for WCAG 2.1 AA compliance
   ```

6. **Optimize Copy**
   ```
   Use optimize_ux_writing to refine button labels
   ```

7. **Add Animations**
   ```
   Use create_animation_specs for subtle transitions
   ```

---

## 📚 References

- **Inspiration**: Apple.com, iPhone product pages, AirPods Pro
- **Tools**: Figma, Tailwind CSS, Framer Motion, Radix UI
- **Standards**: WCAG 2.1, Nielsen Heuristics
- **Gemini 3 Docs**: https://ai.google.dev/gemini-api/docs/gemini-3

---

## 🎓 Jonathan Ive Quotes

> "Simplicity is not the absence of clutter, that's a consequence of simplicity. Simplicity is somehow essentially describing the purpose and place of an object and product."

> "Our goal is to try to bring a calm and simplicity to what are incredibly complex problems."

> "We don't do focus groups. We spend time asking people, 'What's right?'"

---

**Built for the Miyabi Project**
**Design Philosophy: Jonathan Ive - Extreme Minimalism**
**Powered by Gemini 3 Pro Preview**
**MCP Protocol v1.0.4**

---

**Agent Status**: ✅ Ready
**Version**: 1.0.0
**Author**: Miyabi Team (いぶさん 🎨)
**License**: MIT
