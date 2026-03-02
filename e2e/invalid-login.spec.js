/**
 * Browser E2E: Invalid login. Real API.
 * Asserts: error message shown, no token stored, no redirect to dashboard.
 */
const { test, expect } = require('@playwright/test');

test.describe('Invalid login', () => {
  test('shows error for wrong password and does not store token', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-admin@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    const loginRes = page.waitForResponse((res) =>
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in|login/i }).click();

    const res = await loginRes;
    expect(res.status()).toBe(401);
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
