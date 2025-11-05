# Miyabi Mission Control - Design System

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Agent**: ProductDesign Agent 'Miyabi' - Issue #758

---

## Overview

The Miyabi Mission Control design system creates a command center aesthetic inspired by aerospace operations, military command centers, and modern developer tools. The system emphasizes clarity, hierarchy, and real-time data visualization in a sophisticated dark theme.

---

## 🎨 Color Palette

### Primary Colors

#### Command Center Blue
- **miyabi-blue**: `#3B82F6` (rgb: 59, 130, 246)
- **Use cases**: Primary actions, running status, active states, links
- **Accessibility**: WCAG AA compliant on dark backgrounds

#### Miyabi Purple
- **miyabi-purple**: `#A855F7` (rgb: 168, 85, 247)
- **Use cases**: Secondary actions, highlights, gradient accents
- **Accessibility**: WCAG AA compliant on dark backgrounds

#### Success Green
- **miyabi-green**: `#10B981` (rgb: 16, 185, 129)
- **Use cases**: Success states, completed status, positive metrics
- **Accessibility**: WCAG AA compliant on dark backgrounds

#### Alert Red
- **miyabi-red**: `#EF4444` (rgb: 239, 68, 68)
- **Use cases**: Error states, failed status, critical alerts
- **Accessibility**: WCAG AA compliant on dark backgrounds

#### Warning Amber
- **miyabi-amber**: `#F59E0B` (rgb: 245, 158, 11)
- **Use cases**: Warning states, pending actions, caution indicators
- **Accessibility**: WCAG AA compliant on dark backgrounds

### Neutral Palette

#### Backgrounds
- **bg-primary**: `#030712` (gray-950) - Main background
- **bg-secondary**: `#111827` (gray-900) - Card backgrounds
- **bg-tertiary**: `#1F2937` (gray-800) - Elevated surfaces
- **bg-hover**: `#374151` (gray-700) - Hover states

#### Borders
- **border-default**: `#1F2937` (gray-800) - Default borders
- **border-hover**: `#374151` (gray-700) - Interactive borders
- **border-focus**: `#4B5563` (gray-600) - Focus states

#### Text
- **text-primary**: `#FFFFFF` (white) - Primary text
- **text-secondary**: `#9CA3AF` (gray-400) - Secondary text
- **text-tertiary**: `#6B7280` (gray-500) - Tertiary text, timestamps
- **text-disabled**: `#4B5563` (gray-600) - Disabled states

### Semantic Colors

#### Status Colors
- **status-idle**: `#4B5563` (gray-600)
- **status-running**: `#3B82F6` (miyabi-blue)
- **status-completed**: `#10B981` (miyabi-green)
- **status-failed**: `#EF4444` (miyabi-red)
- **status-warning**: `#F59E0B` (miyabi-amber)

#### Gradient Combinations
- **gradient-primary**: `from-miyabi-blue to-miyabi-purple`
- **gradient-success**: `from-miyabi-green to-miyabi-blue`
- **gradient-alert**: `from-miyabi-red to-miyabi-amber`

---

## 📝 Typography System

### Font Family

#### Primary Font: Inter
- **Rationale**: Modern, highly legible sans-serif optimized for UI
- **Fallback**: System UI fonts for performance
- **Implementation**: `font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

#### Monospace Font: JetBrains Mono
- **Use cases**: Code snippets, logs, terminal output, numeric data
- **Fallback**: `font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Courier New', monospace`

### Type Scale

#### Display Headings
```css
h1 - text-5xl (48px / 3rem)
  font-weight: 700 (bold)
  line-height: 1.2
  letter-spacing: -0.02em
  Use: Page titles, dashboard headers
```

#### Section Headings
```css
h2 - text-3xl (30px / 1.875rem)
  font-weight: 700 (bold)
  line-height: 1.3
  Use: Major section titles

h3 - text-xl (20px / 1.25rem)
  font-weight: 600 (semibold)
  line-height: 1.4
  Use: Card titles, component headers
```

#### Body Text
```css
body-large - text-lg (18px / 1.125rem)
  font-weight: 400 (regular)
  line-height: 1.6
  Use: Introductory text, descriptions

body - text-base (16px / 1rem)
  font-weight: 400 (regular)
  line-height: 1.5
  Use: Default body text

body-small - text-sm (14px / 0.875rem)
  font-weight: 400 (regular)
  line-height: 1.5
  Use: Secondary information, metadata
```

#### UI Elements
```css
caption - text-xs (12px / 0.75rem)
  font-weight: 500 (medium)
  line-height: 1.4
  letter-spacing: 0.02em
  Use: Labels, badges, timestamps, progress indicators
```

### Font Weight Scale
- **400** (regular): Body text, descriptions
- **500** (medium): UI labels, badges, subtle emphasis
- **600** (semibold): Subheadings, card titles
- **700** (bold): Major headings, primary emphasis

---

## 📐 Spacing System

Based on Tailwind's 4px base unit:

### Spacing Scale
- **xs**: `0.5rem` (8px) - Tight spacing, inline elements
- **sm**: `1rem` (16px) - Component padding, small gaps
- **md**: `1.5rem` (24px) - Default card padding, section spacing
- **lg**: `2rem` (32px) - Section margins, large gaps
- **xl**: `3rem` (48px) - Page margins, major section breaks
- **2xl**: `4rem` (64px) - Hero sections, major layout breaks

### Component-Specific Spacing

#### Cards
- **Padding**: `p-6` (24px) - Standard card padding
- **Gap**: `gap-6` (24px) - Grid gap between cards

#### Sections
- **Margin Bottom**: `mb-12` (48px) - Section separation

#### Grid Layouts
- **Column Gap**: `gap-6` (24px) - Standard grid gap
- **Row Gap**: `gap-4` (16px) - Vertical spacing in lists

---

## 🖼️ Layout System

### Grid Patterns

#### Dashboard Stats (4-Column)
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```
- **Mobile**: 1 column (stacked)
- **Tablet**: 2 columns
- **Desktop**: 4 columns

#### Agent Cards (3-Column)
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns

#### Content + Sidebar (2-Column)
```css
grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8
```
- **Mobile**: Stacked
- **Desktop**: 2:1 ratio (content:sidebar)

#### Full-Width Panel
```css
grid grid-cols-1 gap-4
```
- Used for issue lists, logs, terminal output

### Responsive Breakpoints

```javascript
screens: {
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
}
```

### Container Constraints

#### Max Width Container
```css
max-w-7xl mx-auto
```
- **Max width**: 1280px (80rem)
- **Centered**: `mx-auto`

---

## 🎯 Component Patterns

### Cards

#### Base Card Style
```css
bg-gray-900 rounded-xl p-6 border border-gray-800
hover:border-gray-700 transition-colors
```

#### Card Variants
- **Default**: Standard card for most content
- **Interactive**: Adds hover effect for clickable cards
- **Elevated**: `shadow-xl shadow-black/50` for modals, popovers

### Buttons

#### Primary Button
```css
bg-miyabi-blue hover:bg-miyabi-blue/90 text-white
px-6 py-3 rounded-lg font-medium transition-colors
```

#### Secondary Button
```css
bg-gray-800 hover:bg-gray-700 text-white
px-6 py-3 rounded-lg font-medium transition-colors
```

#### Ghost Button
```css
hover:bg-gray-800 text-gray-300
px-6 py-3 rounded-lg font-medium transition-colors
```

### Badges

#### Status Badges
```css
px-3 py-1 rounded-full text-xs font-medium
```

**Variants**:
- **Running**: `bg-miyabi-blue text-white`
- **Completed**: `bg-miyabi-green text-white`
- **Failed**: `bg-miyabi-red text-white`
- **Idle**: `bg-gray-600 text-white`

#### Label Badges
```css
px-2 py-1 bg-gray-800 rounded text-xs text-gray-300
```

### Progress Bars

#### Standard Progress Bar
```css
<div className="w-full bg-gray-800 rounded-full h-2">
  <div className="h-2 rounded-full bg-miyabi-blue transition-all duration-500"
       style={{ width: `${progress}%` }} />
</div>
```

---

## 🎭 Motion & Animation

### Transition Standards

#### Default Transitions
```css
transition-colors duration-200
```
- Use for: Color changes, hover states, theme toggles

#### Progress Animations
```css
transition-all duration-500
```
- Use for: Progress bars, expanding panels, metric updates

#### Page Transitions
```css
transition-opacity duration-300
```
- Use for: Page loads, modal appearances

### Animation Easing
- **Default**: `ease-in-out` - Smooth, natural motion
- **Enter**: `ease-out` - Elements entering the screen
- **Exit**: `ease-in` - Elements leaving the screen

---

## 🌐 Accessibility Guidelines

### Color Contrast
- All text must meet WCAG AA contrast ratios (4.5:1 minimum)
- Primary colors tested on `bg-gray-950` and `bg-gray-900` backgrounds
- Use `text-white` for critical information

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2
focus:ring-offset-gray-900
```

### Interactive Elements
- Minimum touch target size: 44x44px
- Clear hover states for all interactive elements
- Visible focus indicators for keyboard navigation

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for icon-only buttons
- `alt` text for all images and icons

---

## 📱 Mobile Optimization

### Touch Targets
- Minimum size: 44x44px
- Adequate spacing between interactive elements (8px minimum)

### Responsive Typography
- Reduce heading sizes by 20-30% on mobile
- Maintain readability with appropriate line heights

### Mobile Navigation
- Hamburger menu for navigation on small screens
- Bottom navigation bar for frequent actions
- Swipe gestures for panel navigation

---

## 🔧 Developer Guidelines

### CSS Class Naming
- Use Tailwind utility classes
- Create component classes for repeated patterns
- Avoid arbitrary values when possible

### Component Composition
- Keep components small and focused
- Use composition over inheritance
- Extract reusable patterns into shared components

### Performance Considerations
- Use CSS Grid and Flexbox for layouts
- Minimize custom CSS
- Leverage Tailwind's JIT compilation
- Optimize images and icons

---

## 📚 Icon System Requirements

### Icon Library: Heroicons
- **Style**: Outline for default, Solid for filled states
- **Size Scale**:
  - `w-4 h-4` (16px): Inline icons, small buttons
  - `w-5 h-5` (20px): Standard UI icons
  - `w-6 h-6` (24px): Section headers, large buttons
  - `w-8 h-8` (32px): Feature icons, empty states

### Icon Usage
- **Navigation**: ChevronRight, ChevronLeft, ChevronDown, ChevronUp
- **Actions**: Play, Pause, Stop, Refresh, Settings
- **Status**: CheckCircle, XCircle, ExclamationTriangle, InformationCircle
- **Data**: ChartBar, ChartLine, ArrowTrending, Clock
- **Content**: Document, Folder, Code, Terminal

### Custom Icons
For Miyabi-specific icons (agents, worktrees, etc.):
- Create as React components
- Use consistent stroke width (1.5 - 2px)
- Follow 24x24px viewBox
- Maintain visual weight with Heroicons

---

## 🎨 Theme Customization

### CSS Variables Approach
Consider implementing CSS variables for easy theme switching:

```css
:root {
  --color-primary: 59 130 246;  /* miyabi-blue */
  --color-success: 16 185 129;  /* miyabi-green */
  --color-error: 239 68 68;     /* miyabi-red */
  --bg-primary: 3 7 18;         /* gray-950 */
  --bg-secondary: 17 24 39;     /* gray-900 */
}
```

Usage: `bg-[rgb(var(--bg-primary))]`

---

## 📦 Design Tokens Export

For integration with design tools (Figma, Sketch):

```json
{
  "colors": {
    "miyabi-blue": "#3B82F6",
    "miyabi-purple": "#A855F7",
    "miyabi-green": "#10B981",
    "miyabi-red": "#EF4444"
  },
  "spacing": {
    "xs": "8px",
    "sm": "16px",
    "md": "24px",
    "lg": "32px",
    "xl": "48px"
  },
  "typography": {
    "fontFamily": "Inter",
    "fontSize": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "3xl": "30px",
      "5xl": "48px"
    }
  }
}
```

---

## 🚀 Implementation Priority

### Phase 1 (Immediate)
1. Update Tailwind config with custom colors
2. Implement base typography system
3. Create card component variants
4. Define responsive grid patterns

### Phase 2 (Short-term)
1. Build status badge components
2. Create progress bar components
3. Implement focus states and accessibility
4. Add animation utilities

### Phase 3 (Long-term)
1. Create comprehensive icon set
2. Build design token export
3. Implement theme switching
4. Create Storybook documentation

---

**Document maintained by**: ProductDesign Agent 'Miyabi'
**Related Issues**: #758
**Next Review**: 2025-12-05
