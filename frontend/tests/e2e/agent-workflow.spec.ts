import { test, expect } from '@playwright/test';

test.describe('Agent Workflow', () => {
  test('agent sees applications queue with risk scores', async ({ page }) => {
    // Login as Agent (locale-stable)
    await page.goto('/auth/sign-in');
    await page.click('[data-testid="quick-login-AGENT"]');
    await expect(page).toHaveURL(/\/dashboard\/agent/);

    // Navigate to applications queue
    await page.goto('/dashboard/agent/applications');

    // At least one table row should render. We do not assert on column
    // headers — those are locale-dependent.
    const tableRow = page.locator('tbody tr').first();
    await expect(tableRow).toBeVisible();

    // Risk badges render as enum literals (LOW / MEDIUM / HIGH) — same in
    // both locales, so this text assertion is stable.
    const riskBadge = page.locator('tbody tr').locator('text=/LOW|MEDIUM|HIGH/').first();
    await expect(riskBadge).toBeVisible();
  });
});
