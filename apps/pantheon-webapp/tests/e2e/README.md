# E2E Testing with Playwright

Issue: #982 - Phase 3.5: CloudFront Redeployment & E2E Testing

## Overview

This directory contains end-to-end tests for the Pantheon webapp using Playwright.

## Test Categories

### 1. Homepage Tests (`homepage.spec.ts`)
- Page title and branding
- Navigation links visibility
- Mobile responsiveness

### 2. Dashboard Tests (`dashboard.spec.ts`)
- Dashboard loading and data display
- Real-time updates
- Error handling
- Responsive design

### 3. Authentication Tests (`auth.spec.ts`)
- Login page display
- GitHub OAuth flow
- Protected routes
- Session persistence
- Logout functionality

### 4. Navigation Tests (`navigation.spec.ts`)
- Page navigation
- Browser back/forward
- Direct URL access
- Mobile navigation

### 5. Accessibility Tests (`accessibility.spec.ts`)
- Document structure
- Heading hierarchy
- Image alt text
- Keyboard navigation
- Screen reader compatibility

## Running Tests

```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallelization**: Enabled for faster execution
- **Retries**: 2 on CI, 0 locally
- **Artifacts**: Screenshots and videos on failure

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pantheon/);
});
```

## CI Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

Results are reported in GitHub Actions.

## Performance Budget

- First Load JS: <150 KB
- Total Bundle: <500 KB
- LCP: <2.5 seconds
- FID: <100 milliseconds
- CLS: <0.1
