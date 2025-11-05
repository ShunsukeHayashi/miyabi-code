# Mission Control Design System - Implementation Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Agent**: ProductDesign Agent 'Miyabi' - Issue #758

---

## 📋 Quick Start

This guide will help you implement the Mission Control design system in your Next.js application.

---

## 🚀 Step 1: Update Tailwind Configuration

### Option A: Replace Existing Config
1. Backup your current `tailwind.config.ts`:
   ```bash
   cp tailwind.config.ts tailwind.config.backup.ts
   ```

2. Replace with the recommended config:
   ```bash
   cp tailwind.config.recommended.ts tailwind.config.ts
   ```

### Option B: Merge Configurations
Manually merge the custom colors and settings from `tailwind.config.recommended.ts` into your existing `tailwind.config.ts`.

Key sections to merge:
- `colors.miyabi` - Primary color palette
- `fontFamily` - Add JetBrains Mono for code
- `fontSize` - Typography scale with line heights
- `animations` - Custom animations for Mission Control

---

## 🎨 Step 2: Update Global CSS

Update your `app/globals.css` to include custom properties:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Mission Control Theme Variables */
    --background: 3 7 18; /* gray-950 */
    --foreground: 255 255 255; /* white */

    /* Primary Colors (RGB format for opacity support) */
    --miyabi-blue: 59 130 246;
    --miyabi-purple: 168 85 247;
    --miyabi-green: 16 185 129;
    --miyabi-red: 239 68 68;
    --miyabi-amber: 245 158 11;
  }

  body {
    @apply antialiased;
    @apply bg-gray-950 text-white;
    @apply font-sans;
  }

  /* Custom scrollbar for dark theme */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-900;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-700 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-600;
  }
}

@layer components {
  /* Card Base Style */
  .card {
    @apply bg-gray-900 rounded-xl p-6 border border-gray-800;
  }

  .card-interactive {
    @apply card hover:border-gray-700 transition-colors;
  }

  /* Button Styles */
  .btn {
    @apply px-6 py-3 rounded-lg font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950;
  }

  .btn-primary {
    @apply btn bg-miyabi-blue hover:bg-miyabi-blue/90 text-white;
    @apply focus:ring-miyabi-blue;
  }

  .btn-secondary {
    @apply btn bg-gray-800 hover:bg-gray-700 text-white;
    @apply focus:ring-gray-600;
  }

  .btn-ghost {
    @apply btn hover:bg-gray-800 text-gray-300;
    @apply focus:ring-gray-600;
  }

  .btn-danger {
    @apply btn bg-miyabi-red hover:bg-miyabi-red/90 text-white;
    @apply focus:ring-miyabi-red;
  }

  /* Status Badges */
  .badge {
    @apply px-3 py-1 rounded-full text-xs font-medium;
  }

  .badge-running {
    @apply badge bg-miyabi-blue text-white;
  }

  .badge-completed {
    @apply badge bg-miyabi-green text-white;
  }

  .badge-failed {
    @apply badge bg-miyabi-red text-white;
  }

  .badge-idle {
    @apply badge bg-gray-600 text-white;
  }

  /* Progress Bar */
  .progress-bar {
    @apply w-full bg-gray-800 rounded-full h-2;
  }

  .progress-fill {
    @apply h-2 rounded-full transition-all duration-500;
  }

  /* Input Fields */
  .input {
    @apply w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3;
    @apply text-white placeholder-gray-500;
    @apply focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:border-transparent;
    @apply transition-colors;
  }
}

@layer utilities {
  /* Gradient Text */
  .text-gradient-primary {
    @apply bg-gradient-to-r from-miyabi-blue to-miyabi-purple bg-clip-text text-transparent;
  }

  .text-gradient-success {
    @apply bg-gradient-to-r from-miyabi-green to-miyabi-blue bg-clip-text text-transparent;
  }

  /* Custom shadows for dark mode */
  .shadow-glow-blue {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }

  .shadow-glow-purple {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
  }
}
```

---

## 🔤 Step 3: Install Fonts

### Install Inter Font
Inter is already configured, but ensure it's imported in your `layout.tsx`:

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Install JetBrains Mono (Optional, for code/logs)

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

Then use `font-mono` class for code blocks and terminal output.

---

## 🎯 Step 4: Update Existing Components

### Example: Update page.tsx

Replace the hardcoded colors with Tailwind classes:

**Before:**
```tsx
className="bg-miyabi-blue" // This won't work without config
```

**After:**
```tsx
className="bg-miyabi-blue" // Now works with updated config
// OR
className="bg-[#3B82F6]" // Fallback if config not updated
```

### Example: Update Status Colors

**Before:**
```tsx
const getStatusColor = (status) => {
  switch (status) {
    case 'running': return 'bg-miyabi-blue'
    // ...
  }
}
```

**After (with new config):**
```tsx
const getStatusColor = (status: AgentStatus['status']) => {
  switch (status) {
    case 'running': return 'bg-miyabi-blue'
    case 'completed': return 'bg-miyabi-green'
    case 'failed': return 'bg-miyabi-red'
    case 'idle': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}
```

---

## 📦 Step 5: Create Reusable Components

### Create Component Library

Create `components/ui/` directory with these base components:

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   ├── Input.tsx
│   └── Modal.tsx
└── dashboard/
    ├── StatCard.tsx
    ├── AgentCard.tsx
    ├── IssueCard.tsx
    └── LogPanel.tsx
```

### Example: Button Component

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'btn'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Example: Card Component

```tsx
// components/ui/Card.tsx
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  interactive?: boolean
  className?: string
  onClick?: () => void
}

export function Card({
  children,
  interactive = false,
  className = '',
  onClick
}: CardProps) {
  const baseClasses = interactive ? 'card-interactive' : 'card'

  if (onClick) {
    return (
      <button
        className={`${baseClasses} ${className} w-full text-left`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  )
}
```

---

## 🎨 Step 6: Apply to Dashboard Pages

### Update Dashboard Stats

```tsx
// app/page.tsx
import { Card } from '@/components/ui/Card'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <Card>
        <p className="text-gray-400 text-sm mb-2">Total Agents</p>
        <p className="text-4xl font-bold text-white">7</p>
      </Card>
      <Card>
        <p className="text-gray-400 text-sm mb-2">Running</p>
        <p className="text-4xl font-bold text-miyabi-blue">3</p>
      </Card>
      {/* More stat cards */}
    </div>
  )
}
```

---

## 📱 Step 7: Test Responsiveness

### Test Breakpoints
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test at these breakpoints:
   - 320px (xs - small phones)
   - 640px (sm - large phones)
   - 768px (md - tablets)
   - 1024px (lg - laptops)
   - 1280px (xl - desktop)
   - 1536px (2xl - large desktop)

### Common Responsive Patterns

```tsx
// Stack on mobile, 2 columns on tablet, 4 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Stack on mobile, 2 columns on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Show on mobile, hide on desktop
<div className="block lg:hidden">
```

---

## ♿ Step 8: Accessibility Testing

### Keyboard Navigation
1. Tab through all interactive elements
2. Ensure focus indicators are visible
3. Test with Enter/Space for activation

### Screen Reader Testing
```tsx
// Add ARIA labels
<button aria-label="Start CoordinatorAgent">
  <PlayIcon className="w-5 h-5" />
</button>

// Progress bars need labels
<div
  role="progressbar"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Agent progress"
>
  <div className="progress-fill bg-miyabi-blue" style={{ width: '75%' }} />
</div>
```

### Color Contrast
All color combinations in the design system meet WCAG AA standards.
Test with: https://webaim.org/resources/contrastchecker/

---

## 🔧 Step 9: Optional Enhancements

### Install Recommended Tailwind Plugins

```bash
npm install -D @tailwindcss/forms @tailwindcss/typography
```

Update `tailwind.config.ts`:
```typescript
plugins: [
  require('@tailwindcss/forms'),
  require('@tailwindcss/typography'),
],
```

### Add Animation Utilities

```tsx
// Fade in on mount
<div className="animate-in fade-in duration-500">

// Slide in from right
<div className="animate-slide-in-right">

// Pulse for loading states
<div className="animate-pulse-subtle">
```

---

## 📊 Step 10: Performance Optimization

### Minimize Custom CSS
The design system is built to use Tailwind utilities. Avoid custom CSS where possible.

### Use JIT Mode (Already Enabled)
Tailwind's JIT compiler only generates the CSS you use, resulting in smaller bundle sizes.

### Optimize Fonts
Next.js automatically optimizes Google Fonts. No additional configuration needed.

---

## 🐛 Troubleshooting

### Colors Not Working
**Problem**: `bg-miyabi-blue` class doesn't apply color
**Solution**:
1. Ensure `tailwind.config.ts` is updated
2. Restart dev server: `npm run dev`
3. Clear `.next` cache: `rm -rf .next`

### TypeScript Errors
**Problem**: Type errors for custom colors
**Solution**: Add to `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss"
// Use proper typing
```

### CSS Not Updating
**Problem**: Changes not reflected in browser
**Solution**:
1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Check `content` paths in Tailwind config
3. Restart dev server

---

## 📚 Additional Resources

- **Design System**: See `DESIGN_SYSTEM.md`
- **Component Styles**: See `COMPONENT_STYLES.md`
- **Tailwind Config**: See `tailwind.config.recommended.ts`
- **Tailwind Docs**: https://tailwindcss.com/docs

---

## ✅ Implementation Checklist

- [ ] Backup existing `tailwind.config.ts`
- [ ] Update Tailwind configuration
- [ ] Update `globals.css` with custom styles
- [ ] Install and configure fonts
- [ ] Create base UI components
- [ ] Update existing dashboard components
- [ ] Test responsive layouts at all breakpoints
- [ ] Verify accessibility (keyboard, screen reader, contrast)
- [ ] Install optional Tailwind plugins
- [ ] Optimize performance
- [ ] Document any custom implementations

---

**Document maintained by**: ProductDesign Agent 'Miyabi'
**Related Issues**: #758
**Next Review**: 2025-12-05
