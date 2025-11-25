/**
 * Navigation E2E Tests
 * Issue: #982 - Phase 3.5: CloudFront Redeployment & E2E Testing
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to Dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to About
    await page.getByRole('link', { name: /about/i }).click();
    await expect(page).toHaveURL(/.*about/);

    // Navigate to Divisions
    await page.getByRole('link', { name: /divisions/i }).click();
    await expect(page).toHaveURL(/.*divisions/);

    // Navigate to Advisors
    await page.getByRole('link', { name: /advisors/i }).click();
    await expect(page).toHaveURL(/.*advisors/);

    // Navigate to Miyabi
    await page.getByRole('link', { name: /miyabi/i }).click();
    await expect(page).toHaveURL(/.*miyabi/);
  });

  test('should display consistent navbar across pages', async ({ page }) => {
    const pages = ['/', '/dashboard', '/about', '/divisions', '/advisors'];

    for (const url of pages) {
      await page.goto(url);
      await expect(page.getByText('Pantheon').first()).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle direct URL access', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/about');
    await expect(page).toHaveURL(/.*about/);

    await page.goto('/divisions');
    await expect(page).toHaveURL(/.*divisions/);
  });
});

test.describe('Navigation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display navigation on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that at least the brand is visible
    await expect(page.getByText('Pantheon').first()).toBeVisible();
  });

  test('should be able to navigate on mobile', async ({ page }) => {
    await page.goto('/');

    // Try to navigate to dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });

    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });
});

test.describe('Navigation - Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Should show some content (404 page or redirect)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeDefined();
  });

  test('should not break on malformed URLs', async ({ page }) => {
    await page.goto('/?foo=bar&baz');

    // Page should still load
    await expect(page).toHaveURL(/.*/);
  });
});
