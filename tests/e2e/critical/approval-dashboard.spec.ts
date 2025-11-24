import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Approval dashboard critical flow', () => {
  test('loads pending approvals and submits an approval response', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('miyabi_user', 'alice');
    });

    const approvals = [
      {
        approval_id: 'approval-1',
        workflow_id: 'wf-deploy-001',
        gate_id: 'deploy-prod',
        required_approvers: ['alice', 'bob'],
        responses: [
          {
            approver: 'bob',
            approved: false,
            comment: 'Waiting for validation',
            responded_at: new Date().toISOString(),
          },
        ],
        status: 'Pending',
        timeout_seconds: 3600,
        created_at: new Date().toISOString(),
      },
    ];

    const approveCalls: Array<{ url: string; body: any }> = [];

    await page.route('**/api/approvals?status=pending', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(approvals),
      });
    });

    await page.route('**/api/approval/*/approve', (route) => {
      approveCalls.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/approval/*/reject', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`${BASE_URL}/approval`, { waitUntil: 'networkidle' });

    const card = page.locator('div').filter({
      has: page.getByRole('heading', { name: 'wf-deploy-001' }),
    });

    await expect(page.getByRole('heading', { name: 'Approval Dashboard' })).toBeVisible();
    await expect(card.getByText('Gate: deploy-prod')).toBeVisible();
    await expect(card.getByText('1/2 approvals')).toBeVisible();

    const comment = 'Ship it once integration passes';
    await card.getByPlaceholder('Add comment or reason...').fill(comment);
    await card.getByRole('button', { name: '✓ Approve' }).click();

    await expect.poll(() => approveCalls.length).toBe(1);
    expect(approveCalls[0].body).toMatchObject({ approver: 'alice', comment });
  });
});
