import { test, expect } from '@playwright/test';

test.describe('Customer Product Application', () => {
  test('customer applies for product from Browse Products', async ({ page }) => {
    // Login as Customer
    await page.goto('/auth/sign-in');
    await page.click('button:has-text("Customer")');
    await expect(page).toHaveURL(/\/dashboard\/client/);

    // Navigate to browse products
    await page.goto('/dashboard/client/products');

    // Wait for at least one product card to be visible
    // In BrowseProductsGrid: className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors flex flex-col gap-4"
    const applyButton = page.locator('button:has-text("Apply for this Product")').first();
    await expect(applyButton).toBeVisible();

    // Click first "Apply for this Product" button
    await applyButton.click();

    // Expect URL to match application details page path
    await expect(page).toHaveURL(/\/dashboard\/client\/applications\/[a-f0-9-]+/);

    // Expect "Risk Assessment" text visible
    // Let's make sure it checks for "Risk Assessment"
    await expect(page.locator('body')).toContainText('Risk Assessment');
  });
});
