import { expect, test } from '@playwright/test';

test('homepage renders title and source attribution', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('კარგი ამბები');
  await expect(page.getByText('ambebi.ge')).toBeVisible();
});

test('strict-mode toggle is reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /რეჟიმი/u })).toBeVisible();
});
