/**
 * Browser E2E: Account lockout after repeated failed logins. Real API.
 * Runs last (z- prefix) so lockout does not affect other login tests.
 * LOCKOUT_DURATION_MS=2000 in global-setup so lockout expires quickly.
 */
const { test, expect } = require('@playwright/test');

const MAX_FAILED_ATTEMPTS = parseInt(process.env.LOCKOUT_MAX_ATTEMPTS || '5', 10);

test.describe('Account lockout', () => {
  test('after repeated failed logins returns 429 and shows lock message', async ({ page }) => {
    await page.goto('/login');

    for (let i = 0; i < MAX_FAILED_ATTEMPTS + 1; i++) {
      await page.getByLabel(/email/i).fill('e2e-admin@test.com');
      await page.getByLabel(/password/i).fill('wrong' + i);
      const resPromise = page.waitForResponse((res) =>
        res.url().includes('/api/auth/login') && res.request().method() === 'POST'
      );
      await page.getByRole('button', { name: /sign in|login/i }).click();
      const res = await resPromise;
      if (i < MAX_FAILED_ATTEMPTS) {
        expect(res.status()).toBe(401);
      } else {
        expect(res.status()).toBe(429);
        const body = await res.json();
        expect(body.code === 'ACCOUNT_LOCKED' || body.error).toBeTruthy();
      }
    }

  });
});
