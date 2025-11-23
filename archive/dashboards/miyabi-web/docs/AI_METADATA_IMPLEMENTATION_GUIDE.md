# AI Metadata Implementation Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-23
**Status**: Complete ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [22 Metadata Attributes](#22-metadata-attributes)
5. [CommonMetadata Presets](#commonmetadata-presets)
6. [Implementation Examples](#implementation-examples)
7. [Best Practices](#best-practices)
8. [Testing & Validation](#testing--validation)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is AI Metadata?

AI Metadata is a system that enables AI agents (ChatGPT, Web Agents, Voice Assistants) to autonomously operate web UIs without human intervention. By embedding structured metadata into HTML elements via `data-ai-*` attributes, AI agents can:

- **Understand** the purpose of each UI element
- **Execute** complex multi-step workflows
- **Validate** success criteria
- **Handle** errors and retry logic

### Why AI Metadata?

**Problem**: Users abandon websites when they don't understand how to use them.

**Solution**: AI agents can guide users through complex workflows by reading AI Metadata and autonomously executing actions.

**Result**: Zero learning curve - users simply describe what they want in natural language.

---

## Architecture

### System Components

```
User Input (Natural Language)
         ↓
    AI Agent (GPT-4, Claude, etc.)
         ↓
AI Metadata Parser (reads data-ai-* attributes)
         ↓
    Action Executor (clicks, fills forms, navigates)
         ↓
Success Validator (checks data-ai-success-criteria)
         ↓
    Result Display
```

### File Structure

```
miyabi-web/
├── src/
│   ├── lib/
│   │   └── ai-metadata.ts          # Core system (22 attributes + presets)
│   ├── app/
│   │   ├── login/page.tsx          # ✅ AI Metadata applied
│   │   └── dashboard/
│   │       ├── page.tsx            # ✅ AI Metadata applied
│   │       ├── repositories/
│   │       │   ├── page.tsx        # ✅ AI Metadata applied
│   │       │   └── [id]/issues/
│   │       │       ├── page.tsx    # ✅ AI Metadata applied
│   │       │       └── [issueNumber]/page.tsx  # ✅ AI Metadata applied
│   │       ├── workflows/
│   │       │   └── page.tsx        # ✅ AI Metadata applied
│   │       └── analytics/
│   │           └── page.tsx        # ✅ AI Metadata applied
│   └── components/
│       └── header.tsx              # ✅ AI Metadata applied
└── docs/
    └── AI_METADATA_IMPLEMENTATION_GUIDE.md  # This file
```

---

## Getting Started

### Step 1: Import the System

```typescript
import { toDataAttributes, CommonMetadata, type AIMetadata } from '@/lib/ai-metadata';
```

### Step 2: Apply to UI Elements

```typescript
// Example: Button with AI Metadata
<Button
  onClick={handleClick}
  {...toDataAttributes({
    role: 'button',
    action: 'click',
    target: 'submit-form-button',
    description: 'Submit the registration form',
    context: 'registration-page',
    expectedResult: 'navigate-to-page',
    navigationTarget: '/dashboard',
  })}
>
  Submit
</Button>
```

### Step 3: Verify in DevTools

Open Chrome DevTools → Elements → Inspect button:

```html
<button
  data-ai-role="button"
  data-ai-action="click"
  data-ai-target="submit-form-button"
  data-ai-description="Submit the registration form"
  data-ai-context="registration-page"
  data-ai-expected-result="navigate-to-page"
  data-ai-navigation-target="/dashboard"
>
  Submit
</button>
```

---

## 22 Metadata Attributes

### Core Attributes (Required)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `role` | `AIRole` | Element role | `'button'`, `'input'`, `'link'`, `'card'` |
| `target` | `string` | Unique identifier | `'github-login-button'` |
| `description` | `string` | Human-readable description | `'Initiate GitHub OAuth'` |
| `context` | `string` | Page/section context | `'login-page'`, `'dashboard'` |

### Action Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `action` | `AIAction` | Expected action | `'click'`, `'fill'`, `'submit'`, `'navigate'` |
| `expectedResult` | `AIExpectedResult` | Expected outcome | `'navigate-to-page'`, `'show-modal'`, `'trigger-api'` |
| `navigationTarget` | `string` | Destination URL | `'/dashboard'`, `'/api/v1/auth/github'` |
| `apiEndpoint` | `string` | API endpoint path | `'/repositories'`, `'/agents/execute'` |

### Workflow Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `instructions` | `string` | Step-by-step guide | `'STEP 1: Click button. STEP 2: Wait...'` |
| `prerequisites` | `string` | Required conditions | `'User must be logged in'` |
| `nextActions` | `string` | Subsequent actions | `'Navigate to repositories page'` |
| `dependencies` | `string` | Dependent elements | `'github-token-input'` |

### Validation Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `waitCondition` | `string` | Wait condition | `'wait-for-redirect'`, `'wait-for-element'` |
| `successCriteria` | `string` | Success validation | `'URL changes to /dashboard'` |
| `errorHandling` | `string` | Error recovery | `'Retry 3 times, show error toast'` |
| `retryPolicy` | `string` | Retry logic | `'retry-3-times-with-2s-delay'` |

### Technical Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `selector` | `string` | CSS selector | `'[data-ai-target="login-button"]'` |
| `priority` | `number` | Execution priority | `1` (highest), `10` (lowest) |
| `workflowId` | `string` | Workflow identifier | `'github-oauth-login'` |
| `workflowStep` | `number` | Step number | `1`, `2`, `3` |

### Optional Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `relatedElements` | `string` | Related elements | `'search-input,filter-dropdown'` |
| `state` | `string` | Element state | `'active'`, `'inactive'`, `'loading'` |

---

## CommonMetadata Presets

### Available Presets (14 total)

#### 1. `githubLoginButton()`

Complete GitHub OAuth workflow:

```typescript
<Button {...toDataAttributes(CommonMetadata.githubLoginButton())}>
  Sign in with GitHub
</Button>
```

**Generated attributes**:
- Full STEP 1-4 workflow instructions
- Token storage logic
- Error handling (3 retries)
- Success criteria (URL change)

#### 2. `searchInput(contextId, placeholder)`

Search input with AI-friendly metadata:

```typescript
<Input
  type="text"
  placeholder="Search issues..."
  {...toDataAttributes(CommonMetadata.searchInput('issues-list', 'Search issues...'))}
/>
```

#### 3. `issueFilterButton(state)`

Issue filter buttons (open/closed/all):

```typescript
<Button
  variant={stateFilter === 'open' ? 'default' : 'outline'}
  {...toDataAttributes(CommonMetadata.issueFilterButton('open'))}
>
  Open
</Button>
```

#### 4. `issueTitleLink(issueNumber, repositoryId)`

Clickable issue title:

```typescript
<button
  onClick={() => router.push(`/repositories/${repoId}/issues/${issue.number}`)}
  {...toDataAttributes(CommonMetadata.issueTitleLink(issue.number, repoId))}
>
  #{issue.number} {issue.title}
</button>
```

#### 5. `agentExecuteButton(issueNumber)`

Agent execution button:

```typescript
<Button {...toDataAttributes(CommonMetadata.agentExecuteButton(270))}>
  <Bot className="h-4 w-4 mr-2" />
  Execute Agent
</Button>
```

#### 6. `agentExecuteConfirmButton(issueNumber)`

Confirmation dialog button:

```typescript
<AlertDialogAction
  onClick={handleExecute}
  {...toDataAttributes(CommonMetadata.agentExecuteConfirmButton(270))}
>
  Execute
</AlertDialogAction>
```

#### 7. `breadcrumbLink(label, href)`

Navigation breadcrumbs:

```typescript
<button
  onClick={() => router.push('/dashboard/repositories')}
  {...toDataAttributes(CommonMetadata.breadcrumbLink('Repositories', '/dashboard/repositories'))}
>
  Repositories
</button>
```

#### 8. `summaryCard(title, context)`

Dashboard summary cards:

```typescript
<Card {...toDataAttributes(CommonMetadata.summaryCard('Active Executions', 'dashboard-statistics'))}>
  <CardContent>
    <p>0</p>
  </CardContent>
</Card>
```

#### 9. `connectRepositoryButton()`

Repository connection button:

```typescript
<Button {...toDataAttributes(CommonMetadata.connectRepositoryButton())}>
  Connect Repository
</Button>
```

#### Other Presets

- `dashboardNavItem(page)` - Dashboard navigation
- `logoutButton()` - Logout functionality
- `notificationBell()` - Notification indicator
- `profileMenu()` - User profile dropdown
- `themeToggle()` - Dark/light mode toggle

---

## Implementation Examples

### Example 1: Complete Login Page

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toDataAttributes, CommonMetadata } from '@/lib/ai-metadata';

export default function LoginPage() {
  const router = useRouter();

  const handleGitHubLogin = () => {
    window.location.href = '/api/v1/auth/github';
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-6">Miyabi</h1>
        <p className="text-gray-600 mb-8">
          AI-Powered Development Automation
        </p>

        {/* GitHub Login Button with AI Metadata */}
        <Button
          onClick={handleGitHubLogin}
          size="lg"
          className="w-full"
          {...toDataAttributes(CommonMetadata.githubLoginButton())}
        >
          Sign in with GitHub
        </Button>

        <p className="mt-4 text-sm text-gray-500">
          By signing in, you agree to our Terms of Service
        </p>
      </Card>
    </div>
  );
}
```

### Example 2: Custom Workflow Metadata

```typescript
// Complex multi-step workflow
<Button
  onClick={handleComplexWorkflow}
  {...toDataAttributes({
    role: 'button',
    action: 'click',
    target: 'deploy-to-production-button',
    description: 'Deploy the current branch to production environment',
    context: 'deployment-page',
    expectedResult: 'trigger-api',
    apiEndpoint: '/api/v1/deployments',
    instructions:
      'STEP 1: Click this button to start deployment. ' +
      'STEP 2: Wait for build process (30-60 seconds). ' +
      'STEP 3: Automated tests will run. ' +
      'STEP 4: If tests pass, deployment to production begins. ' +
      'STEP 5: Health check runs automatically. ' +
      'STEP 6: If health check fails, automatic rollback occurs.',
    prerequisites:
      'User must have admin role. ' +
      'All tests must pass on staging. ' +
      'No active deployments in progress.',
    nextActions:
      'After deployment completes, navigate to /deployments/history ' +
      'to view deployment logs and metrics.',
    dependencies: 'staging-tests-passed-badge,admin-role-indicator',
    waitCondition: 'wait-for-api-response',
    successCriteria:
      'API returns 200 status. ' +
      'Toast notification shows "Deployment successful". ' +
      'Deployment badge changes to "Live".',
    errorHandling:
      'If deployment fails, show error modal with logs. ' +
      'Automatic rollback to previous version. ' +
      'Notify team via Slack webhook.',
    retryPolicy: 'no-retry-for-production-deployments',
    selector: '[data-ai-target="deploy-to-production-button"]',
    priority: 1,
    workflowId: 'production-deployment',
    workflowStep: 1,
  })}
>
  Deploy to Production
</Button>
```

### Example 3: Form with Complete Metadata

```typescript
<form onSubmit={handleSubmit}>
  {/* Text Input */}
  <Input
    type="text"
    placeholder="Repository name"
    {...toDataAttributes({
      role: 'input',
      action: 'fill',
      target: 'repository-name-input',
      description: 'Enter the GitHub repository name (owner/repo format)',
      context: 'create-repository-form',
      expectedResult: 'update-state',
      instructions: 'STEP 1: Type repository name in format "owner/repo". STEP 2: Press Tab to move to next field.',
      successCriteria: 'Input value matches pattern: [a-zA-Z0-9-]+/[a-zA-Z0-9-]+',
      errorHandling: 'Show validation error if format is incorrect',
      selector: '[data-ai-target="repository-name-input"]',
      priority: 1,
    })}
  />

  {/* Select Dropdown */}
  <Select
    {...toDataAttributes({
      role: 'select',
      action: 'select',
      target: 'visibility-dropdown',
      description: 'Choose repository visibility (public or private)',
      context: 'create-repository-form',
      expectedResult: 'update-state',
      instructions: 'STEP 1: Click dropdown. STEP 2: Select "Public" or "Private".',
      nextActions: 'After selection, submit button becomes enabled',
    })}
  >
    <option value="public">Public</option>
    <option value="private">Private</option>
  </Select>

  {/* Submit Button */}
  <Button
    type="submit"
    {...toDataAttributes({
      role: 'button',
      action: 'submit',
      target: 'create-repository-submit',
      description: 'Submit the create repository form',
      context: 'create-repository-form',
      expectedResult: 'trigger-api',
      apiEndpoint: '/api/v1/repositories',
      instructions: 'STEP 1: Ensure all fields are filled. STEP 2: Click submit. STEP 3: Wait for API response.',
      prerequisites: 'Repository name must be valid. Visibility must be selected.',
      waitCondition: 'wait-for-api-response',
      successCriteria: 'API returns 201 status. Navigate to /dashboard/repositories.',
      errorHandling: 'Show error toast if API fails. Keep form data intact.',
      retryPolicy: 'retry-3-times-with-2s-delay',
    })}
  >
    Create Repository
  </Button>
</form>
```

---

## Best Practices

### 1. Always Use `toDataAttributes()`

✅ **Good**:
```typescript
<Button {...toDataAttributes({ role: 'button', target: 'submit' })}>
  Submit
</Button>
```

❌ **Bad**:
```typescript
<Button data-ai-role="button" data-ai-target="submit">
  Submit
</Button>
```

**Why**: `toDataAttributes()` ensures type safety and proper attribute naming.

### 2. Provide Complete Workflows

✅ **Good**:
```typescript
instructions:
  'STEP 1: Click this button. ' +
  'STEP 2: Wait for modal to appear. ' +
  'STEP 3: Fill in the form. ' +
  'STEP 4: Click Confirm.',
```

❌ **Bad**:
```typescript
instructions: 'Click to execute agent',
```

**Why**: AI agents need step-by-step guidance for complex workflows.

### 3. Define Success Criteria

✅ **Good**:
```typescript
successCriteria:
  'URL changes from /login to /dashboard. ' +
  'Header shows user avatar. ' +
  'Toast notification says "Login successful".',
```

❌ **Bad**:
```typescript
successCriteria: 'Login works',
```

**Why**: Clear validation criteria prevent false positives.

### 4. Handle Errors Gracefully

✅ **Good**:
```typescript
errorHandling:
  'If API returns 401, show "Invalid credentials" toast. ' +
  'If API returns 500, show "Server error, please try again" toast. ' +
  'If network error, show "Check your connection" toast.',
retryPolicy: 'retry-3-times-with-exponential-backoff',
```

❌ **Bad**:
```typescript
errorHandling: 'Show error',
```

**Why**: Specific error handling improves user experience.

### 5. Use CommonMetadata Presets When Available

✅ **Good**:
```typescript
<Button {...toDataAttributes(CommonMetadata.githubLoginButton())}>
  Sign in
</Button>
```

❌ **Bad** (Reinventing the wheel):
```typescript
<Button {...toDataAttributes({
  role: 'button',
  action: 'click',
  target: 'github-login',
  // ... 18 more attributes manually defined
})}>
  Sign in
</Button>
```

**Why**: Presets are tested, complete, and maintainable.

### 6. Keep `target` IDs Unique and Descriptive

✅ **Good**:
- `'github-login-button'`
- `'issue-filter-open-button'`
- `'repository-connect-button-123'`

❌ **Bad**:
- `'button1'`
- `'btn'`
- `'temp'`

**Why**: Unique IDs prevent conflicts and improve debuggability.

### 7. Maintain Consistency Across Pages

Use the same patterns for similar elements:

```typescript
// All filter buttons follow the same pattern
<Button {...toDataAttributes(CommonMetadata.issueFilterButton('open'))}>Open</Button>
<Button {...toDataAttributes(CommonMetadata.issueFilterButton('closed'))}>Closed</Button>
<Button {...toDataAttributes(CommonMetadata.issueFilterButton('all'))}>All</Button>
```

---

## Testing & Validation

### Manual Testing

#### 1. DevTools Inspection

Open Chrome DevTools → Elements → Inspect element:

```html
<button
  data-ai-role="button"
  data-ai-action="click"
  data-ai-target="submit-button"
  ...
>
  Submit
</button>
```

**Checklist**:
- ✅ All required attributes present (`role`, `target`, `description`, `context`)
- ✅ Attribute values are not empty
- ✅ `target` is unique on the page
- ✅ `instructions` follow STEP 1-N format

#### 2. Console Query

Run in browser console:

```javascript
// Find all elements with AI Metadata
const aiElements = document.querySelectorAll('[data-ai-role]');
console.log(`Found ${aiElements.length} elements with AI Metadata`);

// Validate specific element
const button = document.querySelector('[data-ai-target="github-login-button"]');
console.log('AI Metadata:', {
  role: button.dataset.aiRole,
  action: button.dataset.aiAction,
  target: button.dataset.aiTarget,
  description: button.dataset.aiDescription,
  // ... all attributes
});
```

#### 3. Automated Validation Script

```typescript
// validation.test.ts
import { render } from '@testing-library/react';
import LoginPage from '@/app/login/page';

test('All buttons have complete AI Metadata', () => {
  const { container } = render(<LoginPage />);
  const buttons = container.querySelectorAll('button[data-ai-role="button"]');

  buttons.forEach(button => {
    // Required attributes
    expect(button).toHaveAttribute('data-ai-role');
    expect(button).toHaveAttribute('data-ai-target');
    expect(button).toHaveAttribute('data-ai-description');
    expect(button).toHaveAttribute('data-ai-context');

    // Action attributes for clickable elements
    expect(button).toHaveAttribute('data-ai-action');
    expect(button).toHaveAttribute('data-ai-expected-result');
  });
});
```

### AI Agent Testing

Use ChatGPT or similar to test autonomous operation:

**Prompt**:
```
I have a web page with AI Metadata. Please:
1. Identify all interactive elements
2. Execute the login workflow
3. Validate success criteria
4. Report any errors

Page HTML: [paste HTML with data-ai-* attributes]
```

---

## Troubleshooting

### Issue 1: Attributes Not Appearing

**Symptom**: `data-ai-*` attributes missing in DevTools

**Solution**:
1. Check import: `import { toDataAttributes } from '@/lib/ai-metadata'`
2. Ensure spread operator: `{...toDataAttributes(...)}`
3. Verify component is client-side: `'use client'` at top of file

### Issue 2: TypeScript Errors

**Symptom**: Type errors when using `toDataAttributes()`

**Solution**:
```typescript
import type { AIMetadata } from '@/lib/ai-metadata';

const metadata: AIMetadata = {
  role: 'button', // Must be exact type
  target: 'my-button',
  description: 'Click me',
  context: 'my-page',
};

<Button {...toDataAttributes(metadata)}>Click</Button>
```

### Issue 3: Duplicate `target` IDs

**Symptom**: Multiple elements have same `data-ai-target`

**Solution**:
Use unique suffixes:
```typescript
// List of items
items.map(item => (
  <Button
    key={item.id}
    {...toDataAttributes({
      ...commonMetadata,
      target: `item-action-${item.id}`, // Unique per item
    })}
  >
    Action
  </Button>
))
```

### Issue 4: Missing Instructions

**Symptom**: AI agent can't complete workflow

**Solution**:
Add complete step-by-step instructions:
```typescript
instructions:
  'STEP 1: Click button. ' +
  'STEP 2: Wait for modal (5 seconds max). ' +
  'STEP 3: Fill "name" field. ' +
  'STEP 4: Click "Confirm" button in modal.',
```

---

## Appendix

### Full AIMetadata Interface

```typescript
export interface AIMetadata {
  // Core (required)
  role: AIRole;
  target: string;
  description: string;
  context: string;

  // Action
  action?: AIAction;
  expectedResult?: AIExpectedResult;
  navigationTarget?: string;
  apiEndpoint?: string;

  // Workflow
  instructions?: string;
  prerequisites?: string;
  nextActions?: string;
  dependencies?: string;

  // Validation
  waitCondition?: string;
  successCriteria?: string;
  errorHandling?: string;
  retryPolicy?: string;

  // Technical
  selector?: string;
  priority?: number;
  workflowId?: string;
  workflowStep?: number;

  // Optional
  relatedElements?: string;
  state?: string;
}
```

### Type Definitions

```typescript
export type AIRole =
  | 'button' | 'input' | 'select' | 'link' | 'card'
  | 'modal' | 'form' | 'list-item' | 'badge' | 'header'
  | 'container' | 'section' | 'navigation';

export type AIAction =
  | 'click' | 'fill' | 'select' | 'submit' | 'navigate'
  | 'toggle' | 'drag' | 'drop' | 'scroll';

export type AIExpectedResult =
  | 'navigate-to-page' | 'show-modal' | 'close-modal'
  | 'trigger-api' | 'update-state' | 'redirect'
  | 'show-toast' | 'open-external';
```

---

## License

This implementation guide is part of the Miyabi Web Platform project.

**Contact**: For questions or issues, please open a GitHub issue.

**Last Updated**: 2025-10-23
