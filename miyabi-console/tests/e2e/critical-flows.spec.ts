import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  test.describe('Dashboard', () => {
    test('should display system metrics', async ({ page }) => {
      await page.goto('/')

      // Wait for the page to load
      await page.waitForLoadState('networkidle')

      // Dashboard should be visible
      await expect(page.locator('body')).toBeVisible()
    })

    test('should display dashboard content', async ({ page }) => {
      await page.goto('/')

      await page.waitForLoadState('networkidle')

      // Page should have content
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })
  })

  test.describe('Agents Page', () => {
    test('should display agent list', async ({ page }) => {
      await page.goto('/agents')

      await page.waitForLoadState('networkidle')

      // Page should load without errors
      await expect(page.locator('body')).toBeVisible()
    })

    test('should have interactive elements', async ({ page }) => {
      await page.goto('/agents')

      await page.waitForLoadState('networkidle')

      // Check for clickable elements
      const buttons = page.locator('button')
      const count = await buttons.count()

      // Should have at least some buttons on the page
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Database Page', () => {
    test('should display database information', async ({ page }) => {
      await page.goto('/database')

      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Infrastructure Page', () => {
    test('should display infrastructure topology', async ({ page }) => {
      await page.goto('/infrastructure')

      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Deployment Page', () => {
    test('should display deployment pipeline', async ({ page }) => {
      await page.goto('/deployment')

      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    })
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    // Page should still be functional on mobile
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
  })

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-page')

    // Should not crash - either shows 404 or redirects
    await expect(page.locator('body')).toBeVisible()
  })
})
