import { test, expect } from '@playwright/test';

test.describe('Customer Product Application', () => {
  test('customer applies for product from Browse Products', async ({ page }) => {
    // Login as Customer (locale-stable selector)
    await page.goto('/auth/sign-in');
    await page.click('[data-testid="quick-login-CUSTOMER"]');
    await expect(page).toHaveURL(/\/dashboard\/client/);

    // Navigate to browse products
    await page.goto('/dashboard/client/products');

    // Wait for at least one product card to be visible. Apply button uses a
    // stable data-testid so the test doesn't break when the UI label is
    // translated to Ukrainian.
    const applyButton = page.locator('[data-testid="apply-product"]').first();
    await expect(applyButton).toBeVisible();

    await applyButton.click();

    // Expect URL to match application details page path
    await expect(page).toHaveURL(/\/dashboard\/client\/applications\/[a-f0-9-]+/);

    // Risk Assessment section header is rendered in both locales as
    // "Risk Assessment" today (detail page not translated); switch this to
    // a data-testid in the future for full safety.
    await expect(page.locator('body')).toContainText('Risk Assessment');
  });
});
