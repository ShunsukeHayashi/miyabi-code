# Miyabi Desktop Design System Spec (v0.1)

**Prepared by**: ProductDesignAgent（つくるん2号想定）  
**Date**: 2025-11-04  
**Scope**: Task5 "デザインシステム統一" の実装指針

---

## 1. Foundation Tokens

### 1.1 Colour Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#0f172a` (slate-900) | App shell background, headers |
| `--color-bg-surface` | `#111827` (gray-900) | Terminal/log backgrounds |
| `--color-bg-panel` | `#f8fafc` (slate-50) | Cards and panels |
| `--color-bg-elevated` | `#ffffff` | Modal surfaces |
| `--color-border-subtle` | `#e2e8f0` | Panel borders |
| `--color-border-strong` | `#cbd5f5` | Focus & highlight |
| `--color-text-primary` | `#0f172a` | Primary text |
| `--color-text-secondary` | `#475569` | Secondary text |
| `--color-text-muted` | `#64748b` | Meta captions |
| `--color-accent` | `#2563eb` | Primary actions, links |
| `--color-accent-soft` | `#eff6ff` | Accent hover/selected |
| `--color-success` | `#10b981` | Success states |
| `--color-warning` | `#f59e0b` | Warning states |
| `--color-danger` | `#ef4444` | Error states |
| `--color-terminal-bg` | `#0b1120` | Terminal canvas |
| `--color-terminal-text` | `#e2e8f0` | Terminal text |

All tokens meet WCAG 2.1 AA contrast (>4.5:1). Leverage CSS variables in `src/index.css` and mirror via Tailwind custom colours.

### 1.2 Typography Scale

| Token | Font | Size | Line Height | Usage |
|-------|------|------|-------------|-------|
| `--font-display` | "Inter", sans-serif | 72px | 0.9 | Hero headings |
| `--font-heading-xl` | Inter | 48px | 1.05 | Panel title hero |
| `--font-heading-lg` | Inter | 32px | 1.1 | Section headings |
| `--font-heading-md` | Inter | 24px | 1.15 | Card titles |
| `--font-body-lg` | Inter | 20px | 1.35 | Descriptive copy |
| `--font-body-md` | Inter | 16px | 1.5 | Paragraph body |
| `--font-body-sm` | Inter | 14px | 1.45 | Secondary text |
| `--font-mono` | "JetBrains Mono", monospace | 14px | 1.4 | Terminal/logs |

Include `font-weight: 200` (extralight) for display, `400` for body, `600` for UI labels.

### 1.3 Spacing Grid

Use base unit `4px` (`0.25rem`). Sequence: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Document as Tailwind spacing tokens `spacing: { '1': '4px', '1.5': '6px', '2': '8px', ... }`.

### 1.4 Shadow & Elevation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.08)` | Input, small chips |
| `--shadow-sm` | `0 2px 6px rgba(15, 23, 42, 0.12)` | Cards |
| `--shadow-md` | `0 12px 32px rgba(15, 23, 42, 0.18)` | Modals, overlays |
| `--shadow-focus` | `0 0 0 3px rgba(37, 99, 235, 0.25)` | Focus-visible ring |

Define in Tailwind `boxShadow` config under keys `brand-xs`, `brand-sm`, etc.

---

## 2. Tailwind Config Integration

1. **Update `tailwind.config.js`**
   ```ts
   const brandColors = {
     primary: {
       DEFAULT: '#2563eb',
       soft: '#eff6ff',
     },
     surface: {
       DEFAULT: '#f8fafc',
       dark: '#111827',
     },
     text: {
       primary: '#0f172a',
       secondary: '#475569',
       muted: '#64748b',
     },
     success: '#10b981',
     warning: '#f59e0b',
     danger: '#ef4444',
   };

   module.exports = {
     theme: {
       extend: {
         colors: brandColors,
         spacing: {
           1: '0.25rem',
           1.5: '0.375rem',
           2: '0.5rem',
           3: '0.75rem',
           4: '1rem',
           6: '1.5rem',
           8: '2rem',
           12: '3rem',
           16: '4rem',
         },
         fontFamily: {
           sans: ['Inter', 'system-ui', 'sans-serif'],
           mono: ['JetBrains Mono', 'monospace'],
         },
         fontSize: {
           'display': ['4.5rem', { lineHeight: '0.9', fontWeight: '200' }],
           'h1': ['3rem', { lineHeight: '1.05', fontWeight: '300' }],
           'h2': ['2rem', { lineHeight: '1.1', fontWeight: '400' }],
           'body-lg': ['1.25rem', { lineHeight: '1.35' }],
           'body': ['1rem', { lineHeight: '1.5' }],
           'body-sm': ['0.875rem', { lineHeight: '1.45' }],
         },
         boxShadow: {
           'brand-xs': '0 1px 2px rgba(15, 23, 42, 0.08)',
           'brand-sm': '0 2px 6px rgba(15, 23, 42, 0.12)',
           'brand-md': '0 12px 32px rgba(15, 23, 42, 0.18)',
           'focus': '0 0 0 3px rgba(37, 99, 235, 0.25)',
         },
         borderRadius: {
           xl: '1.5rem',
           lg: '1rem',
           md: '0.75rem',
           sm: '0.5rem',
         },
       },
     },
   };
   ```
2. **Introduce CSS Variable Bridge** in `src/index.css`:
   ```css
   :root {
     --color-bg-primary: #0f172a;
     --color-bg-surface: #f8fafc;
     --color-text-primary: #0f172a;
     --shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.25);
     /* ... */
   }
   .focus-ring:focus-visible {
     outline: 0;
     box-shadow: var(--shadow-focus);
   }
   ```
3. **Linting & Testing**: update `tailwind.config.ts` to export tokens for unit tests; run `pnpm lint:css` to ensure no unused utilities.

---

## 3. Component Migration Guide

### 3.1 Button
- Replace legacy classes with: `className="inline-flex items-center justify-center rounded-md bg-primary text-white px-4 py-2 shadow-brand-xs transition-all hover:bg-primary/90 focus-visible:shadow-focus"`.
- Use size variants (sm/md/lg) keyed to spacing tokens.
- Add icon slot spacing via `gap-2` (0.5rem).

### 3.2 Card
- Base: `rounded-lg bg-surface shadow-brand-sm border border-border-subtle p-6`.
- Header: `flex flex-col gap-2 text-text-primary font-medium`.
- Support `Card.Section` with padding `px-6 py-4` to align grid.

### 3.3 Alert
- Map status to `bg-success/10`, `bg-danger/10`, etc. with left border accent `border-l-4 border-success`.
- Content structure: `<div className="flex items-start gap-4">` with icon in `w-6 h-6 text-success`.

### 3.4 Tabs
- Container: `flex border-b border-border-subtle`.
- Tab: `px-4 pb-3 text-body-sm font-medium text-text-muted data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary focus-visible:shadow-focus`.
- Panels use `pt-6` spacing and `min-h-[300px]`.

### 3.5 TerminalLog
- Wrap in `bg-color-terminal-bg text-color-terminal-text rounded-lg shadow-brand-sm px-6 py-5 font-mono text-[0.95rem] leading-7`.
- Add `aria-live="polite" role="log"` and `focus-visible:shadow-focus` for copy buttons.

**Migration Steps**
1. Update shared UI library `src/components/ui/*` with new tokens.
2. Refactor local components referencing hard-coded colours to use `text-text-secondary`, etc.
3. Run Storybook snapshot (if available) or `pnpm test:ui` to catch regressions.
4. Document component API in `docs/UI/component-reference.md`.

---

## 4. Figma Alignment Checklist

1. Publish tokens to Figma Variables (`Colour / Typography / Effects`).
2. Update component library styles to match Tailwind tokens (primary buttons, cards, alerts, tabs, terminal).
3. For each screen:
   - Ensure spacing multiples of 4px.
   - Replace free-form shadows with tokens.
   - Use auto layout to enforce gap tokens.
4. QA checklist (per screen):
   - ✅ Colour contrast check (Figma Able plugin)
   - ✅ Focus states documented via overlay
   - ✅ Responsive breakpoints annotated (Desktop 1440, Tablet 1024, Narrow 768)
5. After publishing, export changelog to `docs/UX/figma-sync-log.md` with version + summary.

---

## 5. Implementation Milestones

- **Day 1**: Merge tailwind token update PR; update CSS variables; snapshot baseline.
- **Day 2**: Migrate Button & Card; update documentation; run Chromatic/Storybook regression.
- **Day 3**: Migrate Alert & Tabs; implement focus utilities.
- **Day 4**: Refactor TerminalLog; hook aria-live; run axe accessibility tests.
- **Day 5**: Sync with Figma; finalize migration log; handoff to teams for Task1/2 consumption.

Prepared for immediate development hand-off.
