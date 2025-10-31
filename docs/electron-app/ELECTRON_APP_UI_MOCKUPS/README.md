# Miyabi Desktop - UI Mockups

**Version**: 1.0.0
**Last Updated**: 2025-10-31

---

## 📖 Overview

This directory contains detailed UI mockup descriptions for the Miyabi Desktop Electron application. These mockups serve as visual specifications for developers and designers during implementation.

---

## 📂 Mockup Files

1. **[01-main-window.md](01-main-window.md)** - Main window layout and structure
2. **[02-worktree-view.md](02-worktree-view.md)** - Worktree visualization interface
3. **[03-agent-monitor.md](03-agent-monitor.md)** - Agent execution monitoring panel
4. **[04-issue-manager.md](04-issue-manager.md)** - GitHub Issue management interface
5. **[05-task-history.md](05-task-history.md)** - Task history browser
6. **[06-system-health.md](06-system-health.md)** - System health dashboard
7. **[07-monaco-editor.md](07-monaco-editor.md)** - Monaco Editor integration (Phase 2)
8. **[08-terminal.md](08-terminal.md)** - Integrated terminal (Phase 2)
9. **[09-settings.md](09-settings.md)** - Settings panel
10. **[10-components.md](10-components.md)** - Reusable UI components

---

## 🎨 Design Principles

### Typography
- **Font Family**: Inter (UI), JetBrains Mono (code/terminal)
- **Scale**: 12px (caption) → 14px (body) → 18px (h3) → 24px (h2) → 32px (h1)
- **Weight**: 400 (regular), 600 (semibold), 700 (bold)

### Color Palette

**Dark Theme** (Default):
```css
--background: #0d1117      /* GitHub Dark background */
--foreground: #e6edf3      /* Primary text */
--foreground-muted: #8b949e /* Secondary text */
--primary: #1f6feb         /* Blue accent */
--success: #3fb950         /* Green */
--warning: #d29922         /* Yellow */
--danger: #f85149          /* Red */
--border: #30363d          /* Borders */
--surface: #161b22         /* Cards, panels */
```

**Light Theme**:
```css
--background: #ffffff
--foreground: #1f2328
--foreground-muted: #656d76
--primary: #0969da
--success: #1a7f37
--warning: #9a6700
--danger: #d1242f
--border: #d0d7de
--surface: #f6f8fa
```

### Spacing
- **Base unit**: 4px
- **Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- **Consistent padding**: 16px for cards, 24px for panels, 32px for modals

### Border Radius
- **Small**: 4px (buttons, inputs)
- **Medium**: 8px (cards)
- **Large**: 12px (modals)
- **Full**: 9999px (pills, badges)

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2)
```

---

## 🖼️ Mockup Format

Each mockup file follows this structure:

1. **Overview** - Purpose and context
2. **Layout Diagram** - ASCII art representation
3. **Component Breakdown** - Detailed description of each UI element
4. **Interactions** - User actions and responses
5. **States** - Loading, empty, error states
6. **Responsive Behavior** - How UI adapts to window size
7. **Accessibility** - Keyboard navigation, screen reader support

---

## 🎯 Implementation Notes

### For Developers

**Reading Mockups**:
1. Start with ASCII diagrams for overall layout
2. Read component descriptions for implementation details
3. Check interaction patterns for event handlers
4. Review states for conditional rendering logic

**Component Mapping**:
- Mockups → React components (1:1 mapping when possible)
- Use HeroUI components where applicable
- Custom components for unique UI patterns

**Data Flow**:
- Each mockup indicates data sources (IPC, WebSocket, local storage)
- Use Zustand stores for state management
- Use TanStack Query for server data

### For Designers

**Creating Mockups**:
1. Use Figma, Sketch, or Adobe XD for visual designs
2. Export mockups as PNG/PDF to this directory
3. Update corresponding .md file with link to visual mockup
4. Maintain design tokens (colors, spacing) in sync with specification

**Design Review Checklist**:
- [ ] Consistent with design system (colors, typography, spacing)
- [ ] Accessible (contrast ratio ≥ 4.5:1, keyboard navigation)
- [ ] Responsive (adapts to 1024px - 2560px width)
- [ ] Dark/light mode variants
- [ ] Loading, empty, error states

---

## 🚀 Usage in Development

### Sprint Planning
- Reference mockups during sprint planning
- Assign mockups to specific user stories/tasks
- Use mockups as acceptance criteria (UI matches mockup)

### Code Reviews
- Compare implemented UI with mockup
- Check for missing states (loading, empty, error)
- Verify interactions match specification

### QA Testing
- Use mockups as test cases
- Verify all states render correctly
- Test keyboard shortcuts and accessibility

---

## 📝 Contributing

### Adding New Mockups
1. Create new .md file (e.g., `11-new-feature.md`)
2. Follow mockup format (see above)
3. Add entry to this README
4. Submit PR with mockup + corresponding code (if implementing)

### Updating Existing Mockups
1. Edit .md file
2. Increment version number in header
3. Add changelog entry at bottom of file
4. Submit PR with rationale for change

---

## 🔗 Related Documents

- **[ELECTRON_APP_SPECIFICATION.md](../ELECTRON_APP_SPECIFICATION.md)** - Full app specification
- **[ELECTRON_APP_MVP_ROADMAP.md](../ELECTRON_APP_MVP_ROADMAP.md)** - Development roadmap
- **[ELECTRON_APP_TECH_STACK.md](../ELECTRON_APP_TECH_STACK.md)** - Technology stack

---

**Questions?** Open an issue or contact the design lead.
