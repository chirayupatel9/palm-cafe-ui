/**
 * Browser E2E: Menu browsing. Customer flow at /cafe/default. Real API.
 */
const { test, expect } = require('@playwright/test');

test.describe('Menu browsing', () => {
  test('landing page links to customer menu and cafe menu loads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /start ordering|i'm a customer/i }).click();
    await expect(page).toHaveURL(/\/cafe\/default/);
    await expect(page.getByText(/menu|order|default/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('admin can see dashboard and menu after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-admin@test.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/order|menu|dashboard/i).first()).toBeVisible({ timeout: 10000 });
  });
});
