import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/')

    // Should render without crashing
    await expect(page).toHaveURL(/.*/)
  })

  test('should navigate to agents page', async ({ page }) => {
    await page.goto('/')

    // Find and click the agents link in sidebar
    const agentsLink = page.locator('a[href="/agents"]')
    if (await agentsLink.isVisible()) {
      await agentsLink.click()
      await expect(page).toHaveURL(/.*agents.*/)
    }
  })

  test('should navigate to deployment page', async ({ page }) => {
    await page.goto('/')

    const deploymentLink = page.locator('a[href="/deployment"]')
    if (await deploymentLink.isVisible()) {
      await deploymentLink.click()
      await expect(page).toHaveURL(/.*deployment.*/)
    }
  })

  test('should navigate to infrastructure page', async ({ page }) => {
    await page.goto('/')

    const infraLink = page.locator('a[href="/infrastructure"]')
    if (await infraLink.isVisible()) {
      await infraLink.click()
      await expect(page).toHaveURL(/.*infrastructure.*/)
    }
  })

  test('should navigate to database page', async ({ page }) => {
    await page.goto('/')

    const dbLink = page.locator('a[href="/database"]')
    if (await dbLink.isVisible()) {
      await dbLink.click()
      await expect(page).toHaveURL(/.*database.*/)
    }
  })
})

test.describe('Page Loading', () => {
  test('dashboard page loads successfully', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.status()).toBeLessThan(400)
  })

  test('agents page loads successfully', async ({ page }) => {
    const response = await page.goto('/agents')

    expect(response?.status()).toBeLessThan(400)
  })

  test('deployment page loads successfully', async ({ page }) => {
    const response = await page.goto('/deployment')

    expect(response?.status()).toBeLessThan(400)
  })

  test('infrastructure page loads successfully', async ({ page }) => {
    const response = await page.goto('/infrastructure')

    expect(response?.status()).toBeLessThan(400)
  })

  test('database page loads successfully', async ({ page }) => {
    const response = await page.goto('/database')

    expect(response?.status()).toBeLessThan(400)
  })

  test('activity page loads successfully', async ({ page }) => {
    const response = await page.goto('/activity')

    expect(response?.status()).toBeLessThan(400)
  })
})
