# Mission Control Dashboard - Testing Strategy

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Owner**: Analytics Agent (Kei)
**Project**: Issue #758 - Mission Control Dashboard

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Test Coverage Strategy](#test-coverage-strategy)
4. [Storybook Testing](#storybook-testing)
5. [Component Testing](#component-testing)
6. [Integration Testing](#integration-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Visual Regression Testing](#visual-regression-testing)
9. [Performance Testing](#performance-testing)
10. [Test Data Management](#test-data-management)
11. [CI/CD Integration](#cicd-integration)
12. [Testing Checklist](#testing-checklist)

---

## Overview

This document outlines the comprehensive testing strategy for the Mission Control Dashboard. Our approach emphasizes developer experience, visual testing, accessibility, and maintainability.

### Goals

- ✅ Ensure component reliability and consistency
- ✅ Prevent visual regressions
- ✅ Validate accessibility standards (WCAG 2.1 AA)
- ✅ Provide excellent developer documentation
- ✅ Enable rapid iteration with confidence

### Tech Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Storybook** | Component development & visual testing | 10.0.4 |
| **Vitest** | Unit & component testing | 4.0.7 |
| **Playwright** | Browser automation & testing | 1.56.1 |
| **@storybook/addon-a11y** | Accessibility testing | 10.0.4 |
| **@storybook/addon-vitest** | Component testing in Storybook | 10.0.4 |
| **@vitest/coverage-v8** | Code coverage reporting | 4.0.7 |

---

## Testing Philosophy

### Pyramid Approach

```
       /\
      /  \
     / E2E\          <- Few, critical user flows
    /------\
   /  Integ \        <- Key integration points
  /----------\
 / Component  \      <- Majority of tests
/--------------\
/   Storybook   \    <- Visual documentation
/----------------\
```

### Principles

1. **Test Behavior, Not Implementation**: Focus on user interactions and outcomes
2. **Visual First**: Use Storybook as the primary development and testing tool
3. **Accessibility by Default**: Every component must meet WCAG 2.1 AA standards
4. **Fast Feedback**: Tests should run quickly (<30s for component tests)
5. **Maintainable**: Tests should be easy to read, update, and debug

---

## Test Coverage Strategy

### Coverage Targets

| Category | Target | Current | Priority |
|----------|--------|---------|----------|
| **Component Coverage** | 90% | TBD | ⭐⭐⭐⭐⭐ |
| **Integration Coverage** | 70% | TBD | ⭐⭐⭐⭐ |
| **E2E Coverage** | 50% | TBD | ⭐⭐⭐ |
| **Accessibility** | 100% | TBD | ⭐⭐⭐⭐⭐ |

### What to Test

#### ✅ DO Test

- Component rendering with various props
- User interactions (clicks, form submissions)
- Conditional rendering logic
- Accessibility features (ARIA labels, keyboard navigation)
- Error states and edge cases
- Loading and empty states
- Responsive behavior

#### ❌ DON'T Test

- External library internals (React, Next.js)
- CSS-in-JS implementation details
- Mocked API responses (test at integration level)
- Static content (unless dynamic)

---

## Storybook Testing

### Purpose

Storybook serves as:
1. **Component Playground**: Develop components in isolation
2. **Visual Documentation**: Living documentation for developers
3. **Visual Testing**: Catch UI regressions
4. **Accessibility Audit**: Automated a11y checks
5. **Interaction Testing**: Test component behavior

### Story Organization

```
stories/
└── Mission Control/
    ├── AgentBoard/
    │   ├── Default
    │   ├── ActiveOnly
    │   ├── CodingAgentsOnly
    │   ├── BusinessAgentsOnly
    │   ├── Empty
    │   └── ... (9 variations)
    ├── TmaxlView/
    │   ├── Default
    │   ├── AttachedOnly
    │   ├── ManySessions
    │   └── ... (9 variations)
    ├── Timeline/
    │   ├── Default
    │   ├── ErrorsOnly
    │   ├── ManyEvents
    │   └── ... (12 variations)
    └── ReferenceHub/
        ├── Default
        ├── DocsOnly
        ├── ManyReferences
        └── ... (11 variations)
```

**Total**: 41 story variations across 4 components

### Story Structure

Each story should include:

```typescript
export const StoryName: Story = {
  args: {
    // Component props
  },
  parameters: {
    // Storybook configuration
  },
  play: async ({ canvasElement }) => {
    // Interaction tests (optional)
  },
};
```

### Running Storybook

```bash
# Development mode
npm run storybook

# Build static Storybook
npm run build-storybook
```

---

## Component Testing

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentBoard } from './AgentBoard';
import { generateAgents } from '@/lib/testDataGenerators';

describe('AgentBoard', () => {
  it('renders all agents', () => {
    const agents = generateAgents({ count: 3 });
    render(<AgentBoard agents={agents} />);

    expect(screen.getByText('Agent Board')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('shows empty state when no agents', () => {
    render(<AgentBoard agents={[]} />);
    expect(screen.getByText(/no agents/i)).toBeInTheDocument();
  });

  // More tests...
});
```

### Key Testing Patterns

#### 1. Render Testing
```typescript
it('renders with default props', () => {
  render(<Component {...defaultProps} />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

#### 2. State Testing
```typescript
it('updates state on user interaction', async () => {
  render(<Component />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

#### 3. Edge Case Testing
```typescript
it('handles empty data gracefully', () => {
  render(<Component data={[]} />);
  expect(screen.getByText('No data')).toBeInTheDocument();
});
```

---

## Integration Testing

### Scope

Integration tests verify:
- Component composition (parent + children)
- Data flow between components
- API integration (mocked)
- Routing behavior
- Context providers

### Example

```typescript
describe('Mission Control Page Integration', () => {
  it('displays all four panels', () => {
    render(<MissionControlPage />);

    expect(screen.getByText('Agent Board')).toBeInTheDocument();
    expect(screen.getByText('TMAXL Sessions')).toBeInTheDocument();
    expect(screen.getByText('Timeline & Alerts')).toBeInTheDocument();
    expect(screen.getByText('Reference Hub')).toBeInTheDocument();
  });

  it('updates timeline when agent completes task', async () => {
    // Test inter-component communication
  });
});
```

---

## Accessibility Testing

### Standards

All components must meet:
- **WCAG 2.1 Level AA**: Minimum accessibility standard
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text

### Automated Testing

Storybook's a11y addon automatically checks:
- ✅ ARIA attributes
- ✅ Color contrast
- ✅ Form labels
- ✅ Heading hierarchy
- ✅ Image alt text

### Manual Testing

- [ ] Keyboard-only navigation
- [ ] Screen reader testing (VoiceOver on macOS)
- [ ] High contrast mode
- [ ] Text scaling (up to 200%)
- [ ] Focus indicators

### Tools

```bash
# Run a11y audit in Storybook
npm run storybook
# Navigate to story → Open a11y panel
```

---

## Visual Regression Testing

### Strategy

Visual regression testing catches unintended UI changes.

### Tools (Future)

- **Chromatic**: Automated visual testing
- **Percy**: Visual diff comparison
- **Manual Review**: Design team sign-off

### Implementation

```typescript
// .storybook/preview.ts
export const parameters = {
  chromatic: {
    viewports: [320, 768, 1024, 1440],
    diffThreshold: 0.3,
  },
};
```

### Baseline Process

1. Create baseline screenshots
2. Run visual diff on PRs
3. Review changes
4. Approve or reject

---

## Performance Testing

### Metrics

| Metric | Target | Tool |
|--------|--------|------|
| **Component Render Time** | <16ms | React DevTools |
| **First Contentful Paint** | <1s | Lighthouse |
| **Time to Interactive** | <3s | Lighthouse |
| **Bundle Size** | <200KB | webpack-bundle-analyzer |

### Testing Approach

1. **Large Dataset Testing**: Use `generateAgents({ count: 100 })` in stories
2. **Render Performance**: Monitor React DevTools profiler
3. **Memory Leaks**: Check for unmounted component cleanup
4. **Bundle Analysis**: Regular bundle size audits

---

## Test Data Management

### Data Generators

Located in `/lib/testDataGenerators.ts`, providing:

#### 1. Agent Generator
```typescript
generateAgents({
  count: 10,
  type: 'coding' | 'business' | 'mixed',
  status: 'active' | 'idle' | 'offline' | 'mixed',
  withTasks: true,
});
```

#### 2. Tmux Session Generator
```typescript
generateTmuxSessions({
  count: 5,
  attached: true | false | 'mixed',
  minPanes: 1,
  maxPanes: 20,
});
```

#### 3. Timeline Event Generator
```typescript
generateTimelineEvents({
  count: 50,
  type: 'success' | 'info' | 'warning' | 'error' | 'mixed',
  timeRange: 3600000, // 1 hour
});
```

#### 4. Reference Generator
```typescript
generateReferences({
  count: 10,
  category: 'docs' | 'guide' | 'api' | 'mixed',
  external: false,
});
```

#### 5. Bulk Generator
```typescript
const allData = generateAllMockData({
  agents: { count: 10 },
  sessions: { count: 5 },
  events: { count: 20 },
  references: { count: 8 },
});
```

### Mock Data Principles

- **Realistic**: Data should resemble production
- **Configurable**: Easy to adjust via options
- **Deterministic**: Same inputs → same outputs (for snapshot tests)
- **Varied**: Include edge cases (empty, large datasets)

---

## CI/CD Integration

### GitHub Actions Workflow (Future)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:a11y
      - run: npm run build-storybook
      - run: npm run test:visual # Chromatic
```

### Quality Gates

- ✅ All unit tests pass
- ✅ Coverage ≥ 80%
- ✅ No accessibility violations
- ✅ No visual regressions (approved)
- ✅ Build succeeds

---

## Testing Checklist

### Component Development

- [ ] Component renders with default props
- [ ] Component handles all prop variations
- [ ] Conditional rendering works correctly
- [ ] Event handlers fire properly
- [ ] Error boundaries catch errors
- [ ] Loading states display
- [ ] Empty states display
- [ ] Accessibility checks pass
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] ARIA labels present
- [ ] Color contrast sufficient

### Storybook

- [ ] All component variations documented
- [ ] Interactive props configured
- [ ] Edge cases covered (empty, large data)
- [ ] Accessibility panel shows no violations
- [ ] Controls work as expected
- [ ] Documentation clear and helpful

### Pre-Commit

- [ ] All tests pass locally
- [ ] No console errors/warnings
- [ ] Coverage threshold met
- [ ] Storybook builds successfully
- [ ] Visual review completed

### Pre-Deploy

- [ ] E2E tests pass
- [ ] Performance benchmarks acceptable
- [ ] Visual regression approved
- [ ] Accessibility audit complete
- [ ] Cross-browser testing done

---

## Future Enhancements

### Phase 2: Advanced Testing

1. **E2E Testing**: Full user flow testing with Playwright
2. **Visual Regression**: Chromatic integration
3. **Performance Monitoring**: Real User Monitoring (RUM)
4. **API Contract Testing**: GraphQL schema validation
5. **Load Testing**: Stress testing with large datasets

### Phase 3: Automation

1. **Auto-generate tests**: From Storybook stories
2. **Mutation testing**: Detect test quality issues
3. **Snapshot testing**: Component structure validation
4. **Coverage reporting**: Integrated with PR comments

---

## Resources

### Documentation

- [Storybook Docs](https://storybook.js.org/docs)
- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Internal References

- **Test Data Generators**: `lib/testDataGenerators.ts`
- **Mock Data**: `lib/mockData.ts`
- **Component Stories**: `components/mission-control/*.stories.tsx`
- **Storybook Config**: `.storybook/main.ts`

---

**Document Maintained by**: Analytics Agent (Kei)
**Next Review**: After Phase 2 implementation
**Contact**: GitHub Issues for questions/suggestions
