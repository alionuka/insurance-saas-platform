import { test, expect } from '@playwright/test';

test.describe('Admin ML Dashboard', () => {
  test('platform admin views ML methodology dashboard', async ({ page }) => {
    // Login as Platform Admin (locale-stable)
    await page.goto('/auth/sign-in');
    await page.click('[data-testid="quick-login-PLATFORM_ADMIN"]');
    await expect(page).toHaveURL(/\/dashboard\/admin/);

    // Navigate to ML models dashboard
    await page.goto('/dashboard/admin/ml-models');

    // Tab buttons "Risk Prediction", "Fraud Detection", "Recommendations"
    // are not localised — these surfaces remain English by design.
    const riskTab = page.locator('button:has-text("Risk")');
    const fraudTab = page.locator('button:has-text("Fraud")');
    const recsTab = page.locator('button:has-text("Recommendations")');

    await expect(riskTab).toBeVisible();
    await expect(fraudTab).toBeVisible();
    await expect(recsTab).toBeVisible();

    await riskTab.click();

    // "Cross-Validation" block + "Permutation Importance" caption — both
    // English ML methodology terms.
    await expect(page.locator('text=/Cross-Validation|Permutation/').first()).toBeVisible();
  });
});
