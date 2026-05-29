import { test, expect } from '@playwright/test';
import { resetDb } from './_reset';

test.beforeEach(async () => { await resetDb(); });
test.afterAll(async () => { await resetDb(); });

test('buyer can reserve 5 numbers and reach payment page', async ({ page }) => {
  await page.goto('/apartar');

  // Select first 5 available numbers
  for (const n of [0, 1, 2, 3, 4]) {
    await page.getByRole('button', { name: n.toString().padStart(2, '0') }).click();
  }

  await page.getByLabel('Tu nombre').fill('Ana Pérez');
  await page.getByLabel('Tu WhatsApp').fill('3001234567');
  await page.getByRole('button', { name: /Apartar mis 5 números/ }).click();

  await expect(page).toHaveURL(/\/pago\//);
  await expect(page.getByText(/Tus 5 números:/)).toBeVisible();
  await expect(page.getByText('00 · 01 · 02 · 03 · 04')).toBeVisible();
  await expect(page.getByRole('link', { name: /Ya pagué/ })).toBeVisible();
});

test('random pick works', async ({ page }) => {
  await page.goto('/apartar?random=1');
  await page.getByLabel('Tu nombre').fill('Bea');
  await page.getByLabel('Tu WhatsApp').fill('3009999999');
  await page.getByRole('button', { name: /Apartar mis 5 números/ }).click();
  await expect(page).toHaveURL(/\/pago\//);
});
