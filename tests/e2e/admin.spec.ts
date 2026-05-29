import { test, expect } from '@playwright/test';
import { resetDb } from './_reset';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

test.beforeEach(async () => { await resetDb(); });
test.afterAll(async () => { await resetDb(); });

async function reserveAs(page: any, name: string, nums = [0, 1, 2, 3, 4]) {
  await page.goto('/apartar');
  for (const n of nums) {
    await page.getByRole('button', { name: n.toString().padStart(2, '0') }).click();
  }
  await page.getByLabel('Tu nombre').fill(name);
  await page.getByLabel('Tu WhatsApp').fill('3001234567');
  await page.getByRole('button', { name: /Apartar mis 5 números/ }).click();
  await expect(page).toHaveURL(/\/pago\//);
}

test('admin confirms purchase and closes raffle', async ({ page }) => {
  await reserveAs(page, 'Ana Test');

  // login
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // confirm
  await page.getByRole('button', { name: 'Confirmar pago' }).click();
  await expect(page.getByText('✅ Confirmado')).toBeVisible();

  // close raffle with winning number 0
  await page.locator('input[name="winning_number"]').fill('0');
  await page.getByRole('button', { name: 'Cerrar rifa' }).click();

  // wait for the admin page to reflect the closed state before navigating away
  await expect(page.getByText(/Número ganador actual/)).toBeVisible();

  // verify winner banner on public site
  await page.goto('/');
  await expect(page.getByText(/¡Rifa cerrada!/)).toBeVisible();
  await expect(page.getByText(/Ana Test/)).toBeVisible();
});
