/**
 * Browser E2E: Admin login, superadmin login, impersonation flow. Real API.
 * Asserts: role redirects, impersonation banner, exit impersonation.
 */
const { test, expect } = require('@playwright/test');

test.describe('Admin login', () => {
  test('admin reaches dashboard after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-admin@test.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/dashboard|default cafe|e2e-admin/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Superadmin login', () => {
  test('superadmin reaches superadmin area after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-superadmin@test.com');
    await page.getByLabel(/password/i).fill('superadmin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/(superadmin|dashboard)/, { timeout: 15000 });
    await expect(page.getByText(/super admin|impersonat|cafes/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Impersonation flow', () => {
  test('superadmin can impersonate cafe and see banner, then exit', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-superadmin@test.com');
    await page.getByLabel(/password/i).fill('superadmin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/(superadmin|dashboard)/, { timeout: 15000 });

    const slugInput = page.getByPlaceholder(/cafe slug|enter cafe slug|default/i).first();
    await slugInput.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await slugInput.fill('default');
    await page.getByRole('button', { name: /login as cafe/i }).click();

    await expect(page.getByText(/you are impersonating|impersonating.*default/i)).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /exit impersonation/i }).click();
    await expect(page.getByText(/you are impersonating/i)).not.toBeVisible({ timeout: 5000 });
  });
});
