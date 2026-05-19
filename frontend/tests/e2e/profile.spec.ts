import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test('customer can edit profile name', async ({ page }) => {
    // Login as Customer (locale-stable)
    await page.goto('/auth/sign-in');
    await page.click('[data-testid="quick-login-CUSTOMER"]');
    await expect(page).toHaveURL(/\/dashboard\/client/);

    // Navigate to profile
    await page.goto('/dashboard/profile');

    // Select first-name input by its `name` attribute — stable across locales
    // (the visible label "First Name" / "Ім'я" is translated).
    const firstNameInput = page.locator('input[name="firstName"]');
    await expect(firstNameInput).toBeVisible();

    // Toast message "Profile updated successfully" is still English in the
    // EditProfileForm (this surface is not yet translated). We assert on it
    // here; switch to a data-testid on the toast if/when this is localised.
    try {
      await firstNameInput.click();
      await firstNameInput.fill('TestName');

      // Form has exactly one submit button; click that rather than a
      // text-matched "Save" which would break in Ukrainian.
      await page.locator('form button[type="submit"]').first().click();

      await expect(page.locator('text=Profile updated successfully')).toBeVisible();

      // Reload page and expect value is persisted
      await page.reload();
      await expect(firstNameInput).toHaveValue('TestName');
    } finally {
      // Cleanup: restore original by re-editing back to "Alice"
      await firstNameInput.click();
      await firstNameInput.fill('Alice');
      await page.locator('form button[type="submit"]').first().click();
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    }
  });
});
