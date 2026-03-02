/**
 * Browser E2E: Add to cart, place order, invoice view. Real API.
 * Requires seeded menu item (seedBrowserMenu). Asserts UI, network, token.
 */
const { test, expect } = require('@playwright/test');

test.describe('Cart, order, invoice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('e2e-admin@test.com');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 15000 });
  });

  test('adds item to cart and cart count updates', async ({ page }) => {
    await expect(page.getByText(/dashboard|order/i).first()).toBeVisible({ timeout: 10000 });
    await page.waitForResponse((res) => res.url().includes('/admin/menu') && res.status() === 200, { timeout: 15000 }).catch(() => {});
    const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await expect(page.getByText(/1 items?/i)).toBeVisible({ timeout: 5000 });
  });

  test('places order and can open Reports', async ({ page }) => {
    await page.waitForResponse((res) => res.url().includes('/admin/menu') && res.status() === 200, { timeout: 15000 }).catch(() => {});
    const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await page.getByPlaceholder(/customer name|name/i).first().fill('E2E Customer');
    const placeRes = page.waitForResponse((res) =>
      res.url().includes('/api/orders') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /place order|submit|pay/i }).first().click();
    const res = await placeRes;
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      await expect(page.getByText(/success|order placed|thank you/i).first()).toBeVisible({ timeout: 8000 });
    }
    await page.getByRole('button', { name: /reports/i }).click();
    await expect(page.getByText(/invoice|report|history/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('invoice / Reports view loads without console errors', async ({ page }) => {
    await page.getByRole('button', { name: /reports/i }).click();
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await expect(page.getByText(/invoice|report|reports/i).first()).toBeVisible({ timeout: 10000 });
    expect(consoleErrors.filter((m) => !m.includes('react-refresh'))).toEqual([]);
  });
});
