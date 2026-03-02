/**
 * Browser E2E: Login flow. Real API; no mocks.
 * Asserts: UI state, network 200, token in localStorage, redirect to dashboard.
 */
const { test, expect } = require('@playwright/test');

test.describe('Login flow', () => {
  test('shows login page and accepts valid credentials', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible();

    const loginRes = page.waitForResponse((res) =>
      res.url().includes('/api/auth/login') && res.request().method() === 'POST'
    );

    await page.getByLabel(/email/i).fill('e2e-admin@test.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    const res = await loginRes;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user).toBeTruthy();

    await expect(page).toHaveURL(/\/dashboard/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(10);

    expect(consoleErrors.filter((m) => !m.includes('react-refresh'))).toEqual([]);
  });
});
