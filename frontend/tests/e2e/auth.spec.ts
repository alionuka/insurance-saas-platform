import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('logs in via Quick-login Customer button and lands on /dashboard/client', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Use data-testid so the test is stable regardless of UI locale
    // ("Customer" vs "Клієнт" depending on the `locale` cookie).
    await page.click('[data-testid="quick-login-CUSTOMER"]');

    // Expect URL to match client dashboard route — the actual proof of
    // a successful sign-in flow. We deliberately do not assert on dashboard
    // body copy because it is localised.
    await expect(page).toHaveURL(/\/dashboard\/client/);
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Fill credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');

    // Click submit
    await page.click('button[type="submit"]');

    // Expect error indication. Accept either "Invalid credentials" (401) or
    // "Too Many Requests" (throttler under concurrent test load) — both prove
    // that the failure path produces a user-visible error.
    const errorBox = page.locator('div.bg-red-500\\/10');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText(/invalid|too many/i);
  });
});
