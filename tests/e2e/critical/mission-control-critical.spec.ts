import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Mission Control critical flows', () => {
  test('filters agents by status and search', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Miyabi Mission Control' })).toBeVisible();

    await page.getByRole('button', { name: 'Working' }).click();
    await expect(page.getByRole('button', { name: 'Cycle Status' })).toHaveCount(2);

    const searchInput = page.getByPlaceholder('Search agents');
    await searchInput.fill('Kaede');
    await expect(page.getByRole('heading', { name: 'Kaede (Review)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cycle Status' })).toHaveCount(1);
  });

  test('cycles agent status and focuses matching tmux pane', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const coordinatorCard = page.locator('div').filter({
      has: page.getByRole('heading', { name: 'Coordinator Agent' }),
    });

    await expect(coordinatorCard.getByText('Working')).toBeVisible();

    await coordinatorCard.getByRole('button', { name: 'Cycle Status' }).click();
    await expect(coordinatorCard.getByText('Idle')).toBeVisible();

    await coordinatorCard.getByRole('button', { name: 'Focus Pane' }).click();
    await expect(page.getByText('Agent agent-0')).toBeVisible();
  });

  test('dispatches tmux commands from the detail panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const commandInput = page.getByPlaceholder('tmux send-keys -t pane ');
    const command = 'tmux display-message "hello mission control"';

    await commandInput.fill(command);
    await page.getByRole('button', { name: 'Dispatch' }).click();

    await expect(commandInput).toHaveValue('');
    await expect(page.getByText('hello mission control', { exact: false })).toBeVisible();
  });
});
