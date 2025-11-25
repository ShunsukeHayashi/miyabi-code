/**
 * Homepage E2E Tests
 * Issue: #982 - Phase 3.5: CloudFront Redeployment & E2E Testing
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Pantheon/);
  });

  test('should display navigation links', async ({ page }) => {
    // Check main navigation items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /divisions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /advisors/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /miyabi/i })).toBeVisible();
  });

  test('should display Pantheon branding', async ({ page }) => {
    await expect(page.getByText('Pantheon')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to about page', async ({ page }) => {
    await page.getByRole('link', { name: /about/i }).click();
    await expect(page).toHaveURL(/.*about/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Pantheon')).toBeVisible();
  });
});
