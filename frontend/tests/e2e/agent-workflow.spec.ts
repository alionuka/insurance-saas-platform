import { test, expect } from '@playwright/test';

test.describe('Agent Workflow', () => {
  test('agent sees applications queue with risk scores', async ({ page }) => {
    // Login as Agent
    await page.goto('/auth/sign-in');
    await page.click('button:has-text("Agent")');
    await expect(page).toHaveURL(/\/dashboard\/agent/);

    // Navigate to applications queue
    await page.goto('/dashboard/agent/applications');

    // Expect at least one table row to be visible
    // The table body rows have element tr
    const tableRow = page.locator('tbody tr').first();
    await expect(tableRow).toBeVisible();

    // Expect element with text matching LOW, MEDIUM, or HIGH risk levels
    // Since RiskBadge displays the risk level text
    const riskBadge = page.locator('tbody tr').locator('text=/LOW|MEDIUM|HIGH/').first();
    await expect(riskBadge).toBeVisible();
  });
});
