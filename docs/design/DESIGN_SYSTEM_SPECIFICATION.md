# Miyabi Web UI - Design System Specification

**Version**: 1.0
**Last Updated**: 2025-10-23
**Framework**: Next.js 14 + Tailwind CSS + shadcn/ui (New York style)

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Elevation & Shadows](#elevation--shadows)
7. [Animation & Transitions](#animation--transitions)
8. [Iconography](#iconography)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

1. **Developer-Centric Clarity** - UI prioritizes clear information hierarchy for technical workflows
2. **Agent-First Design** - Visual representation of autonomous agents as first-class citizens
3. **Real-Time Feedback** - Live updates via WebSocket reflected in UI animations
4. **Minimal Distraction** - Clean, professional interface without unnecessary embellishments
5. **Dark Mode Ready** - Designed with both light and dark modes in mind

### Design Language

- **Modern B2B SaaS** - Professional, clean, technical
- **Reference Inspirations**: GitHub, Vercel, Linear, Retool
- **Not consumer-facing** - Prioritize functionality over aesthetics

---

## Color Palette

### Base Colors (Slate-based)

**shadcn/ui Configuration**: `baseColor: "slate"`

#### Primary Colors

```css
/* Background */
--background: 0 0% 100%;           /* #FFFFFF */
--foreground: 222.2 84% 4.9%;      /* #020817 - Slate 950 */

/* Muted (subtle backgrounds) */
--muted: 210 40% 96.1%;            /* #F1F5F9 - Slate 100 */
--muted-foreground: 215.4 16.3% 46.9%; /* #64748B - Slate 500 */

/* Card (elevated surfaces) */
--card: 0 0% 100%;                 /* #FFFFFF */
--card-foreground: 222.2 84% 4.9%; /* #020817 */

/* Border */
--border: 214.3 31.8% 91.4%;       /* #E2E8F0 - Slate 200 */
--input: 214.3 31.8% 91.4%;        /* #E2E8F0 */
```

#### Accent Colors (Agent-related)

```css
/* Primary (Agent actions) */
--primary: 221.2 83.2% 53.3%;      /* #3B82F6 - Blue 500 */
--primary-foreground: 210 40% 98%; /* #F8FAFC - Slate 50 */

/* Secondary (Supporting actions) */
--secondary: 210 40% 96.1%;        /* #F1F5F9 - Slate 100 */
--secondary-foreground: 222.2 47.4% 11.2%; /* #1E293B - Slate 800 */

/* Accent (Highlights) */
--accent: 210 40% 96.1%;           /* #F1F5F9 */
--accent-foreground: 222.2 47.4% 11.2%; /* #1E293B */
```

#### Status Colors

```css
/* Success (Agent completed) */
--success: 142.1 76.2% 36.3%;      /* #16A34A - Green 600 */
--success-light: 142.1 70.6% 45.3%; /* #22C55E - Green 500 */

/* Warning (In progress) */
--warning: 37.7 92.1% 50.2%;       /* #F59E0B - Amber 500 */
--warning-light: 45.4 93.4% 47.5%; /* #FBBF24 - Amber 400 */

/* Error (Agent failed) */
--error: 0 84.2% 60.2%;            /* #EF4444 - Red 500 */
--error-light: 0 72.2% 50.6%;      /* #DC2626 - Red 600 */

/* Info (Notifications) */
--info: 217.2 91.2% 59.8%;         /* #3B82F6 - Blue 500 */
--info-light: 213.1 93.9% 67.8%;   /* #60A5FA - Blue 400 */
```

#### Agent Type Colors

Specific colors for each Agent type (7 agents):

```css
/* CoordinatorAgent (しきるん) */
--agent-coordinator: 271.5 81.3% 55.9%; /* #A855F7 - Purple 500 */

/* CodeGenAgent (つくるん) */
--agent-codegen: 217.2 91.2% 59.8%;     /* #3B82F6 - Blue 500 */

/* ReviewAgent (めだまん) */
--agent-review: 142.1 76.2% 36.3%;      /* #16A34A - Green 600 */

/* DeploymentAgent (はこぶん) */
--agent-deployment: 24.6 95% 53.1%;     /* #F97316 - Orange 500 */

/* PRAgent (まとめるん) */
--agent-pr: 280.7 89.6% 68%;            /* #C084FC - Purple 400 */

/* IssueAgent (みつけるん) */
--agent-issue: 199.1 89.2% 48%;         /* #0EA5E9 - Sky 500 */

/* Hooks Integration */
--agent-hooks: 335.8 77.6% 57.8%;       /* #EC4899 - Pink 500 */
```

### Dark Mode Colors

**TBD**: To be defined in future iteration. Structure:

```css
.dark {
  --background: 222.2 84% 4.9%;     /* Slate 950 */
  --foreground: 210 40% 98%;        /* Slate 50 */
  /* ... other dark mode variables */
}
```

---

## Typography

### Font Family

```css
/* Primary Font (System) */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Monospace (Code, IDs, Technical) */
font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

### Font Sizes

**Tailwind CSS Scale** (default):

```css
/* Headings */
--text-6xl: 3.75rem;   /* 60px - Hero titles */
--text-5xl: 3rem;      /* 48px - Page titles */
--text-4xl: 2.25rem;   /* 36px - Section titles */
--text-3xl: 1.875rem;  /* 30px - Card titles */
--text-2xl: 1.5rem;    /* 24px - Subsection titles */
--text-xl: 1.25rem;    /* 20px - Component titles */

/* Body */
--text-lg: 1.125rem;   /* 18px - Large body */
--text-base: 1rem;     /* 16px - Default body */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Captions, labels */
```

### Font Weights

```css
--font-thin: 100;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;      /* Primary buttons, headers */
--font-semibold: 600;    /* Emphasis */
--font-bold: 700;        /* Strong emphasis */
--font-black: 900;       /* Hero text */
```

### Line Heights

```css
--leading-tight: 1.25;   /* Headings */
--leading-snug: 1.375;   /* Subheadings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.625; /* Long-form content */
--leading-loose: 2;      /* Spacing emphasis */
```

### Typography Usage

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **Page Title** | 3xl (30px) | Bold (700) | Tight (1.25) | Dashboard, main pages |
| **Section Title** | 2xl (24px) | Semibold (600) | Snug (1.375) | Card headers |
| **Card Title** | xl (20px) | Semibold (600) | Normal (1.5) | Component titles |
| **Body Large** | lg (18px) | Normal (400) | Normal (1.5) | Emphasis paragraphs |
| **Body** | base (16px) | Normal (400) | Normal (1.5) | Default text |
| **Body Small** | sm (14px) | Normal (400) | Normal (1.5) | Secondary text |
| **Caption** | xs (12px) | Normal (400) | Normal (1.5) | Labels, metadata |
| **Code** | sm (14px) | Normal (400) | Relaxed (1.625) | Code snippets |

---

## Spacing & Layout

### Spacing Scale

**Tailwind CSS Default Scale** (rem-based):

```
0   = 0px
0.5 = 2px   (0.125rem)
1   = 4px   (0.25rem)
2   = 8px   (0.5rem)
3   = 12px  (0.75rem)
4   = 16px  (1rem)
5   = 20px  (1.25rem)
6   = 24px  (1.5rem)
8   = 32px  (2rem)
10  = 40px  (2.5rem)
12  = 48px  (3rem)
16  = 64px  (4rem)
20  = 80px  (5rem)
24  = 96px  (6rem)
```

### Layout Grid

**Container Sizes**:
```css
/* Breakpoint-based containers */
sm: 640px;   /* Small devices */
md: 768px;   /* Medium devices */
lg: 1024px;  /* Large devices */
xl: 1280px;  /* Extra large devices */
2xl: 1536px; /* 2X large devices */
```

**Grid System**:
```css
/* 12-column grid */
grid-cols-12

/* Common layouts */
grid-cols-1  /* Mobile */
grid-cols-2  /* Tablet */
grid-cols-3  /* Desktop */
grid-cols-4  /* Wide desktop */
```

### Component Spacing

| Element | Padding | Margin | Gap |
|---------|---------|--------|-----|
| **Card** | p-6 (24px) | mb-6 (24px) | - |
| **Button** | px-4 py-2 (16px 8px) | - | - |
| **Input** | px-3 py-2 (12px 8px) | - | - |
| **Section** | py-8 (32px) | - | - |
| **Container** | px-6 (24px) | - | - |
| **Stack (vertical)** | - | - | gap-4 (16px) |
| **Inline (horizontal)** | - | - | gap-2 (8px) |

---

## Components

### Button Styles

#### Primary Button
```tsx
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Execute Agent
</Button>
```

#### Secondary Button
```tsx
<Button variant="outline" className="border-slate-300 text-slate-700">
  Cancel
</Button>
```

#### Ghost Button
```tsx
<Button variant="ghost" className="text-slate-600 hover:text-slate-900">
  View Details
</Button>
```

#### Destructive Button
```tsx
<Button variant="destructive" className="bg-red-600 hover:bg-red-700">
  Delete
</Button>
```

### Card Styles

#### Standard Card
```tsx
<Card className="p-6 shadow-sm border border-slate-200">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

#### Elevated Card (hover effect)
```tsx
<Card className="p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
  Content
</Card>
```

#### Status Card (with color accent)
```tsx
<Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50">
  Agent Running...
</Card>
```

### Input Styles

#### Text Input
```tsx
<Input
  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
  placeholder="Enter value..."
/>
```

#### Search Input
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <Input className="pl-10" placeholder="Search..." />
</div>
```

### Badge Styles

#### Status Badges
```tsx
/* Running */
<Badge className="bg-amber-100 text-amber-800 border-amber-300">
  Running
</Badge>

/* Completed */
<Badge className="bg-green-100 text-green-800 border-green-300">
  Completed
</Badge>

/* Failed */
<Badge className="bg-red-100 text-red-800 border-red-300">
  Failed
</Badge>
```

#### Agent Type Badges
```tsx
<Badge className="bg-blue-100 text-blue-800 border-blue-300">
  CodeGenAgent
</Badge>
```

---

## Elevation & Shadows

### Shadow Scale

```css
/* Tailwind CSS shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### Component Elevation

| Component | Default | Hover | Active |
|-----------|---------|-------|--------|
| **Card** | shadow-sm | shadow-md | - |
| **Button** | shadow-sm | shadow | shadow-inner |
| **Modal** | shadow-2xl | - | - |
| **Dropdown** | shadow-lg | - | - |
| **Tooltip** | shadow-md | - | - |
| **Header** | shadow-sm | - | - |

---

## Animation & Transitions

### Transition Durations

```css
--duration-75: 75ms;    /* Instant feedback */
--duration-100: 100ms;  /* Quick transitions */
--duration-150: 150ms;  /* Default */
--duration-200: 200ms;  /* Smooth */
--duration-300: 300ms;  /* Noticeable */
--duration-500: 500ms;  /* Deliberate */
```

### Easing Functions

```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Common Animations

#### Hover Effects
```css
/* Button hover */
transition: all 150ms ease-in-out;
transform: translateY(-1px);

/* Card hover */
transition: shadow 200ms ease-out;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
```

#### Loading Spinner
```tsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
```

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 300ms ease-out;
}
```

#### Slide In (Agent execution start)
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slideInRight 300ms ease-out;
}
```

#### Progress Bar (Agent execution)
```tsx
<div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
  <div
    className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## Iconography

### Icon Library

**Primary**: `lucide-react` (already installed)

### Icon Sizes

```css
--icon-xs: 12px;   /* Inline text icons */
--icon-sm: 16px;   /* Button icons, labels */
--icon-base: 20px; /* Default */
--icon-lg: 24px;   /* Headers */
--icon-xl: 32px;   /* Feature highlights */
--icon-2xl: 48px;  /* Hero sections */
```

### Common Icons

| Context | Icon | Size |
|---------|------|------|
| **GitHub** | `Github` | sm (16px) |
| **Agent** | `Bot` | base (20px) |
| **Search** | `Search` | sm (16px) |
| **Settings** | `Settings` | base (20px) |
| **Logout** | `LogOut` | sm (16px) |
| **Success** | `CheckCircle` | base (20px) |
| **Error** | `XCircle` | base (20px) |
| **Warning** | `AlertTriangle` | base (20px) |
| **Info** | `Info` | base (20px) |
| **Loading** | `Loader2` (spinning) | base (20px) |
| **Repository** | `Folder` | sm (16px) |
| **Issue** | `FileText` | sm (16px) |
| **PR** | `GitPullRequest` | sm (16px) |
| **Workflow** | `Workflow` | base (20px) |

---

## Responsive Design

### Breakpoints

```css
/* Mobile-first approach */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (laptops) */
xl: 1280px  /* Extra large devices (desktops) */
2xl: 1536px /* 2X large devices (large desktops) */
```

### Responsive Patterns

#### Container
```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>
```

#### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>
```

#### Typography
```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>
```

#### Visibility
```tsx
/* Hide on mobile, show on desktop */
<div className="hidden lg:block">Desktop only</div>

/* Show on mobile, hide on desktop */
<div className="block lg:hidden">Mobile only</div>
```

---

## Accessibility

### ARIA Requirements

1. **Semantic HTML** - Use proper HTML5 elements (`<nav>`, `<main>`, `<article>`)
2. **ARIA Labels** - All interactive elements must have accessible names
3. **Focus States** - Visible focus indicators (`:focus-visible`)
4. **Keyboard Navigation** - Tab order, Enter/Space activation
5. **Screen Reader Support** - ARIA live regions for dynamic content

### Focus Styles

```css
/* Default focus ring */
.focus-visible:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Focus ring for inputs */
input:focus, textarea:focus, select:focus {
  ring: 2px;
  ring-color: #3B82F6;
  ring-offset: 2px;
}
```

### Color Contrast

**WCAG 2.1 AA Compliance**:
- Normal text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Verified Combinations**:
- Slate 950 on White: 18.67:1 ✅
- Slate 700 on White: 8.59:1 ✅
- Blue 600 on White: 5.88:1 ✅
- White on Blue 600: 5.88:1 ✅

---

## Implementation Notes

### CSS Variables Setup

All design tokens are defined in `src/app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... all other variables ... */
  }
}
```

### Tailwind Configuration

Design system integrated via `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... etc
      }
    }
  }
}
```

### Component Library

All components sourced from `shadcn/ui`:
- Installed via `npx shadcn@latest add <component>`
- Stored in `src/components/ui/`
- Customizable via className props

---

## Version History

- **v1.0** (2025-10-23) - Initial design system specification
  - Color palette defined (Slate-based, 7 agent colors)
  - Typography scale established
  - Component styles documented
  - Responsive breakpoints defined
  - Accessibility guidelines added

---

## References

- **shadcn/ui Documentation**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
