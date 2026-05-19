import { test, expect } from '@playwright/test';

test.describe('Admin ML Dashboard', () => {
  test('platform admin views ML methodology dashboard', async ({ page }) => {
    // Login as Platform Admin
    await page.goto('/auth/sign-in');
    await page.click('button:has-text("Platform")');
    await expect(page).toHaveURL(/\/dashboard\/admin/);

    // Navigate to ML models dashboard
    await page.goto('/dashboard/admin/ml-models');

    // Expect tab buttons "Risk", "Fraud", "Recommendations"
    // Since labels are "Risk Prediction", "Fraud Detection", "Recommendations"
    const riskTab = page.locator('button:has-text("Risk")');
    const fraudTab = page.locator('button:has-text("Fraud")');
    const recsTab = page.locator('button:has-text("Recommendations")');

    await expect(riskTab).toBeVisible();
    await expect(fraudTab).toBeVisible();
    await expect(recsTab).toBeVisible();

    // Click "Risk" tab
    await riskTab.click();

    // Expect text "Cross-Validation" or "Permutation" to be visible
    // In our UI, "CV Strategy" block shows "Cross-Validation", and feature importance shows "Permutation Importance"
    await expect(page.locator('text=/Cross-Validation|Permutation/').first()).toBeVisible();
  });
});
