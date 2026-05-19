import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test('customer can edit profile name', async ({ page }) => {
    // Login as Customer
    await page.goto('/auth/sign-in');
    await page.click('button:has-text("Customer")');
    await expect(page).toHaveURL(/\/dashboard\/client/);

    // Navigate to profile
    await page.goto('/dashboard/profile');

    const firstNameInput = page.locator('label:has-text("First Name") + div input');
    
    // Check initial state or clear and update
    await expect(firstNameInput).toBeVisible();
    
    try {
      // Click, clear, and type TestName
      await firstNameInput.click();
      await firstNameInput.fill('');
      await firstNameInput.type('TestName');

      // Click "Save" button
      await page.click('button:has-text("Save")');

      // Expect toast or success indication
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();

      // Reload page and expect value is persisted
      await page.reload();
      await expect(firstNameInput).toHaveValue('TestName');
    } finally {
      // Cleanup: restore original by re-editing back to "Alice"
      await firstNameInput.click();
      await firstNameInput.fill('');
      await firstNameInput.type('Alice');
      await page.click('button:has-text("Save")');
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    }
  });
});
