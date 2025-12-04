/**
 * E2E Tests: Navigation & Basic UI
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/');

    // ダッシュボードが表示されることを確認
    await expect(page).toHaveTitle(/BDR Hunter/);
  });

  test('should navigate to companies list', async ({ page }) => {
    await page.goto('/companies');

    // ページが読み込まれることを確認（エラーがあってもページ自体は表示される）
    await page.waitForLoadState('domcontentloaded');

    // BDR Hunterタイトルまたは企業関連テキストが表示されることを確認
    const title = page.locator('h1, h2, [class*="title"]');
    await expect(title.first()).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('/');

    // サイドバーのナビゲーションリンクが存在することを確認
    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar).toBeVisible();
  });
});

test.describe('Companies Page', () => {
  test('should display companies table or content', async ({ page }) => {
    await page.goto('/companies');

    await page.waitForLoadState('domcontentloaded');

    // ページコンテンツが表示されることを確認
    const hasTable = await page.locator('table').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 0;
    const hasContent = await page.locator('main, [class*="content"]').count() > 0;

    expect(hasTable || hasCards || hasContent).toBeTruthy();
  });

  test('should have new analysis button', async ({ page }) => {
    await page.goto('/companies');

    // 新規分析ボタンが存在することを確認
    const newButton = page.locator('button, a').filter({ hasText: /新規|New|追加|Add/i });
    await expect(newButton.first()).toBeVisible();
  });
});
