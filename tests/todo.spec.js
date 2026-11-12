const { test, expect } = require('@playwright/test');

test('добавление, выполнение, обновление и удаление', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Новая задача' });
  await input.fill('  Проверить тестовое  ');
  await page.getByRole('button', { name: 'Добавить' }).click();
  await expect(page.locator('.task-text')).toHaveText(['Проверить тестовое']);
  await expect(input).toBeFocused();
  await input.fill('Отправить ссылку');
  await input.press('Enter');
  await page.getByRole('checkbox', { name: 'Проверить тестовое' }).check();
  await expect(page.locator('#progress')).toHaveText('Выполнено 1 из 2');
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Проверить тестовое' })).toBeChecked();
  await expect(page.locator('.task-text')).toHaveText(['Проверить тестовое', 'Отправить ссылку']);
  await page.getByRole('checkbox', { name: 'Проверить тестовое' }).uncheck();
  await page.getByRole('button', { name: 'Удалить задачу: Проверить тестовое', exact: true }).click();
  await page.reload();
  await expect(page.locator('.task-text')).toHaveText(['Отправить ссылку']);
  await page.getByRole('button', { name: 'Удалить задачу: Отправить ссылку', exact: true }).click();
  await expect(page.locator('#empty')).toBeVisible();
  expect(errors).toEqual([]);
});

test('пустой ввод и безопасный вывод текста на мобильном экране', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Новая задача' });
  await input.fill('   '); await input.press('Enter');
  await expect(page.locator('#tasks li')).toHaveCount(0);
  const text = '<img src=x onerror=alert(1)> ' + 'ДлиннаяЗадача'.repeat(25);
  await input.fill(text); await input.press('Enter');
  await expect(page.locator('.task-text')).toHaveText(text);
  await expect(page.locator('#tasks img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('повреждённые данные и недоступное хранилище', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('po-poryadku.tasks.v1', '{broken'));
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Не удалось прочитать');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Blocked'); }; });
  await page.getByRole('textbox').fill('Не потерять ввод');
  await page.getByRole('textbox').press('Enter');
  await expect(page.locator('.task-text')).toHaveText('Не потерять ввод');
  await expect(page.getByRole('status')).toContainText('Хранилище недоступно');
});
