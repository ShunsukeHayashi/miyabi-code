# Storybook Usage Guide - Mission Control Dashboard

**Quick Start** | **Component Development** | **Testing** | **Best Practices**

---

## 🚀 Quick Start

### Installation

Storybook is already configured! Dependencies installed:
- Storybook 10.0.4
- Vitest 4.0.7
- Playwright 1.56.1
- Accessibility addon
- Vitest addon

### Run Storybook

```bash
cd miyabi-dashboard

# Start Storybook development server
npm run storybook

# Opens at: http://localhost:6006
```

### Build Storybook

```bash
# Build static Storybook for deployment
npm run build-storybook

# Output: storybook-static/
```

---

## 📁 Project Structure

```
miyabi-dashboard/
├── .storybook/
│   ├── main.ts              # Storybook configuration
│   ├── preview.ts           # Global settings
│   └── vitest.setup.ts      # Vitest configuration
├── components/
│   └── mission-control/
│       ├── AgentBoard.tsx
│       ├── AgentBoard.stories.tsx     ✨
│       ├── TmaxlView.tsx
│       ├── TmaxlView.stories.tsx      ✨
│       ├── Timeline.tsx
│       ├── Timeline.stories.tsx       ✨
│       ├── ReferenceHub.tsx
│       └── ReferenceHub.stories.tsx   ✨
├── lib/
│   ├── mockData.ts                    # Static mock data
│   └── testDataGenerators.ts         # Dynamic test data
├── TESTING_STRATEGY.md                # Full testing docs
└── STORYBOOK_GUIDE.md                 # This file
```

---

## ✍️ Writing Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

// Component metadata
const meta = {
  title: 'Mission Control/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'padded', // 'centered' | 'fullscreen' | 'padded'
  },
  tags: ['autodocs'], // Auto-generate docs
  argTypes: {
    propName: {
      description: 'What this prop does',
      control: 'text', // Control type
    },
  },
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    propName: 'value',
  },
};

// Additional variations
export const VariationName: Story = {
  args: {
    propName: 'different value',
  },
};
```

### Using Test Data Generators

```typescript
import { generateAgents } from '@/lib/testDataGenerators';

export const ManyAgents: Story = {
  args: {
    agents: generateAgents({
      count: 20,
      type: 'mixed',
      status: 'mixed',
    }),
  },
};

export const OnlyActiveAgents: Story = {
  args: {
    agents: generateAgents({
      count: 10,
      status: 'active',
    }),
  },
};
```

### Story Best Practices

1. **Name Stories Clearly**: `ActiveOnly`, `EmptyState`, `ManyItems`
2. **Cover Edge Cases**: Empty, single item, many items
3. **Use Realistic Data**: Leverage test data generators
4. **Document Props**: Use `argTypes` for prop descriptions
5. **Add Controls**: Enable interactive prop editing

---

## 🎨 Component Development Workflow

### 1. Create Component

```typescript
// components/mission-control/NewComponent.tsx
'use client';

import React from 'react';

interface NewComponentProps {
  data: string[];
}

const NewComponent: React.FC<NewComponentProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">New Component</h2>
      <ul>
        {data.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default NewComponent;
```

### 2. Create Stories

```typescript
// components/mission-control/NewComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import NewComponent from './NewComponent';

const meta = {
  title: 'Mission Control/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NewComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: ['Item 1', 'Item 2', 'Item 3'],
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};
```

### 3. Develop in Storybook

```bash
# Start Storybook
npm run storybook

# Navigate to: Mission Control > NewComponent
# Iterate on component while seeing live updates
```

### 4. Test Accessibility

- Open **Accessibility** panel in Storybook
- Check for violations (should be 0)
- Fix any issues before committing

### 5. Add Interaction Tests (Optional)

```typescript
import { expect, userEvent, within } from '@storybook/test';

export const Clickable: Story = {
  args: {
    data: ['Click me'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};
```

---

## 🧪 Testing with Storybook

### Accessibility Testing

Every story automatically runs a11y checks.

**To view results:**
1. Open Storybook (`npm run storybook`)
2. Navigate to any story
3. Click **Accessibility** tab in addons panel
4. Review violations (target: 0)

**Common violations:**
- Missing `alt` text on images
- Insufficient color contrast
- Missing ARIA labels
- Improper heading hierarchy

### Visual Testing

**Manual review:**
1. Navigate through all stories
2. Check visual consistency
3. Test responsive behavior
4. Verify dark mode (if applicable)

**Automated (future):**
- Chromatic integration for visual regression testing
- Percy for screenshot comparisons

### Component Testing

Test components directly in Storybook using the Vitest addon:

```typescript
// .storybook/vitest.setup.ts
import { setProjectAnnotations } from '@storybook/react';
import * as projectAnnotations from './preview';

setProjectAnnotations(projectAnnotations);
```

```typescript
// component.test.ts
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './component.stories';

const { Default, Empty } = composeStories(stories);

test('renders default state', () => {
  const { getByText } = render(<Default />);
  expect(getByText('Some text')).toBeInTheDocument();
});

test('renders empty state', () => {
  const { getByText } = render(<Empty />);
  expect(getByText('No data')).toBeInTheDocument();
});
```

---

## 📊 Available Stories

### Current Coverage

| Component | Stories | Variations | File |
|-----------|---------|------------|------|
| **AgentBoard** | 9 | Default, ActiveOnly, CodingOnly, BusinessOnly, Empty, Single, Many, AllIdle, AllOffline | `AgentBoard.stories.tsx` |
| **TmaxlView** | 9 | Default, AttachedOnly, DetachedOnly, Empty, Single, Many, Large, MultipleAttached, Recent | `TmaxlView.stories.tsx` |
| **Timeline** | 12 | Default, SuccessOnly, ErrorsOnly, WarningsOnly, InfoOnly, Empty, Single, Many, Critical, CoordinatorOnly, Recent, Mixed | `Timeline.stories.tsx` |
| **ReferenceHub** | 11 | Default, DocsOnly, GuidesOnly, APIOnly, Empty, Single, Many, Technical, UserGuides, External, Miyabi | `ReferenceHub.stories.tsx` |

**Total**: 41 story variations

### Exploring Stories

```bash
npm run storybook
```

Navigate to:
- **Mission Control > AgentBoard** - Agent status visualization
- **Mission Control > TmaxlView** - Tmux session management
- **Mission Control > Timeline** - Event timeline and alerts
- **Mission Control > ReferenceHub** - Documentation links

---

## 🔧 Storybook Configuration

### Main Configuration

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",       // Accessibility testing
    "@storybook/addon-vitest"      // Component testing
  ],
  framework: {
    name: "@storybook/nextjs-vite", // Next.js + Vite
    options: {}
  },
  staticDirs: ["../public"]
};
```

### Adding Global Decorators

```typescript
// .storybook/preview.ts
import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

---

## 🎯 Best Practices

### Story Naming

✅ **Good**:
```typescript
export const Default: Story = { ... };
export const ActiveOnly: Story = { ... };
export const EmptyState: Story = { ... };
```

❌ **Bad**:
```typescript
export const Story1: Story = { ... };
export const Test: Story = { ... };
export const Component: Story = { ... };
```

### Prop Configuration

✅ **Good**:
```typescript
argTypes: {
  status: {
    description: 'Agent status indicator',
    control: { type: 'select' },
    options: ['active', 'idle', 'offline'],
  },
}
```

❌ **Bad**:
```typescript
argTypes: {
  status: {}, // No description or controls
}
```

### Data Generation

✅ **Good**:
```typescript
import { generateAgents } from '@/lib/testDataGenerators';

export const ManyAgents: Story = {
  args: {
    agents: generateAgents({ count: 50 }),
  },
};
```

❌ **Bad**:
```typescript
export const ManyAgents: Story = {
  args: {
    agents: [ /* 50 manually typed objects */ ],
  },
};
```

---

## 🚨 Troubleshooting

### Issue: Storybook Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules .next storybook-static
npm install
npm run storybook
```

### Issue: Stories Not Appearing

Check `.storybook/main.ts` stories pattern:
```typescript
stories: [
  "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
]
```

Ensure file name ends with `.stories.tsx`

### Issue: Import Errors

```typescript
// Use path alias
import { Component } from '@/components/Component';

// NOT relative path
import { Component } from '../../../components/Component';
```

### Issue: Accessibility Violations

1. Open Accessibility panel
2. Click on violation for details
3. Review suggested fix
4. Update component
5. Re-check (should auto-refresh)

---

## 📚 Additional Resources

### Official Documentation

- [Storybook Docs](https://storybook.js.org/docs)
- [Storybook + Next.js](https://storybook.js.org/docs/get-started/nextjs)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Vitest Addon](https://storybook.js.org/addons/@storybook/addon-vitest)

### Internal Documentation

- **Testing Strategy**: `TESTING_STRATEGY.md`
- **Mock Data**: `lib/mockData.ts`
- **Test Generators**: `lib/testDataGenerators.ts`

### Learning Resources

- [Component Story Format (CSF)](https://storybook.js.org/docs/api/csf)
- [Interactive Stories](https://storybook.js.org/docs/writing-stories/play-function)
- [Args and Controls](https://storybook.js.org/docs/writing-stories/args)

---

## 🎓 Examples

### Example 1: Simple Component Story

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from './StatusBadge';

const meta = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { status: 'active', label: 'Active' },
};

export const Idle: Story = {
  args: { status: 'idle', label: 'Idle' },
};

export const Offline: Story = {
  args: { status: 'offline', label: 'Offline' },
};
```

### Example 2: Complex Component with Interactions

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import SearchBar from './SearchBar';

const meta = {
  title: 'Forms/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Search agents...',
  },
};

export const WithInteraction: Story = {
  args: {
    placeholder: 'Search agents...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox');

    await userEvent.type(input, 'CoordinatorAgent');
    await expect(input).toHaveValue('CoordinatorAgent');
  },
};
```

### Example 3: Using Mock Data Generator

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { generateTimelineEvents } from '@/lib/testDataGenerators';
import EventLog from './EventLog';

const meta = {
  title: 'Dashboard/EventLog',
  component: EventLog,
  tags: ['autodocs'],
} satisfies Meta<typeof EventLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecentEvents: Story = {
  args: {
    events: generateTimelineEvents({
      count: 10,
      timeRange: 600000, // Last 10 minutes
    }),
  },
};

export const ErrorsOnly: Story = {
  args: {
    events: generateTimelineEvents({
      count: 20,
      type: 'error',
    }),
  },
};

export const ManyEvents: Story = {
  args: {
    events: generateTimelineEvents({
      count: 100,
    }),
  },
};
```

---

## ✅ Checklist: Creating a New Component Story

- [ ] Create component file (`Component.tsx`)
- [ ] Create story file (`Component.stories.tsx`)
- [ ] Add component metadata (`Meta` object)
- [ ] Export default story (`Default`)
- [ ] Add edge case stories (Empty, Many, etc.)
- [ ] Configure argTypes for interactive controls
- [ ] Use test data generators for realistic data
- [ ] Run Storybook (`npm run storybook`)
- [ ] Check Accessibility panel (0 violations)
- [ ] Review all story variations
- [ ] Document any special behavior
- [ ] Commit both files together

---

**Created by**: Analytics Agent (Kei)
**Last Updated**: 2025-11-05
**For**: Issue #758 - Mission Control Dashboard
**Questions?**: Open an issue or check `TESTING_STRATEGY.md`
