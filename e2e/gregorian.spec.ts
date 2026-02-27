import { test, expect } from '@playwright/test';

test.describe('Gregorian calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
  });

  // ── 1. February 2023 has 28 cells ──
  test('February 2023 renders 28 current-month cells (non-leap)', async ({ page }) => {
    const cells = page.locator('#feb-2023 .pardis-day:not(.other-month)');
    await expect(cells).toHaveCount(28);
  });

  // ── 2. February 2024 has 29 cells ──
  test('February 2024 renders 29 current-month cells (leap year)', async ({ page }) => {
    const cells = page.locator('#feb-2024 .pardis-day:not(.other-month)');
    await expect(cells).toHaveCount(29);
  });

  // ── 3. February 1900 has 28 cells (century non-leap) ──
  test('February 1900 renders 28 current-month cells (century rule — not leap)', async ({ page }) => {
    const cells = page.locator('#feb-1900 .pardis-day:not(.other-month)');
    await expect(cells).toHaveCount(28);
  });

  // ── 4. February 2000 has 29 cells (400-year exception) ──
  test('February 2000 renders 29 current-month cells (400-year rule — is leap)', async ({ page }) => {
    const cells = page.locator('#feb-2000 .pardis-day:not(.other-month)');
    await expect(cells).toHaveCount(29);
  });

  // ── 5. Payload has calendar:'gregorian' and gregorian.year/month/day ──
  test('select event payload has calendar:gregorian and gregorian.year/month/day', async ({ page }) => {
    const cell = page.locator('#gregorian-inline .pardis-day:not(.other-month)[data-day="15"]').first();
    await cell.click();
    const payload = await page.evaluate(() => (window as any).__lastPayload);
    expect(payload).not.toBeNull();
    expect(payload.calendar).toBe('gregorian');
    expect(typeof payload.gregorian.year).toBe('number');
    expect(typeof payload.gregorian.month).toBe('number');
    expect(payload.gregorian.day).toBe(15);
    expect(typeof payload.iso).toBe('string');
  });

  // ── 6. First weekday column is Sunday (en-US-gregorian locale) ──
  test('first weekday column header is Sunday', async ({ page }) => {
    const firstWeekday = page.locator('#gregorian-inline .pardis-weekday').first();
    await expect(firstWeekday).toHaveText('Sun');
  });

  // ── 7. Jalali and Gregorian inline instances are independent ──
  test('selecting a day in jalali-inline does not affect gregorian-inline', async ({ page }) => {
    // Click a jalali cell
    await page.locator('#jalali-inline .pardis-day:not(.other-month)[data-day="10"]').first().click();
    // The gregorian-inline should have no .selected cells
    const gregorianSelected = page.locator('#gregorian-inline .pardis-day.selected');
    await expect(gregorianSelected).toHaveCount(0);
  });

  // ── 8. prevMonth navigation works ──
  test('prevMonth navigates to the previous month', async ({ page }) => {
    await page.locator('#gregorian-input').focus();
    const popover = page.locator('.pardis-calendar-popover.open');
    await expect(popover).toBeVisible();

    const firstCell = popover.locator('.pardis-day:not(.other-month)').first();
    const initialMonth = Number(await firstCell.getAttribute('data-month'));
    const initialYear  = Number(await firstCell.getAttribute('data-year'));

    await popover.locator('[data-action="prevMonth"]').click();

    const newFirstCell = popover.locator('.pardis-day:not(.other-month)').first();
    const newMonth = Number(await newFirstCell.getAttribute('data-month'));
    const newYear  = Number(await newFirstCell.getAttribute('data-year'));

    if (initialMonth === 1) {
      expect(newMonth).toBe(12);
      expect(newYear).toBe(initialYear - 1);
    } else {
      expect(newMonth).toBe(initialMonth - 1);
      expect(newYear).toBe(initialYear);
    }
  });
});
