/**
 * Browser E2E: Registration (admin invite) flow. Real API.
 * Admin register page is protected; requires login first.
 */
const { test, expect } = require('@playwright/test');

test.describe('Admin registration page', () => {
  test('after login admin can open register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-admin@test.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.goto('/admin/register');
    await expect(page.getByText(/register|invite|add (user|admin)/i).first()).toBeVisible({ timeout: 10000 });
  });
});
