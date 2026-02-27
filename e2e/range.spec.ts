import { test, expect } from '@playwright/test';

test.describe('Range selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
  });

  // ── 1. First click sets range start ──
  test('first click sets range start and shows "select end" hint', async ({ page }) => {
    // Click any day in the range-inline calendar
    const firstDay = page.locator('#range-inline .pardis-day:not(.other-month)').first();
    await firstDay.click();

    // range-start class applied
    await expect(page.locator('#range-inline .pardis-day.range-start')).toHaveCount(1);

    // Hint text contains something about "end" (locale fa-IR so in Farsi, but hint element exists)
    const hint = page.locator('#range-inline .pardis-range-hint');
    await expect(hint).toBeVisible();
  });

  // ── 2. Second click sets range end and creates in-range cells ──
  test('second click completes range and in-range cells appear', async ({ page }) => {
    const days = page.locator('#range-inline .pardis-day:not(.other-month)');

    // Click day 5 as start
    await days.nth(4).click(); // 0-indexed → day 5
    await expect(page.locator('#range-inline .pardis-day.range-start')).toHaveCount(1);

    // Click day 12 as end
    await days.nth(11).click(); // 0-indexed → day 12
    await expect(page.locator('#range-inline .pardis-day.range-end')).toHaveCount(1);

    // In-range cells should appear (days 6–11)
    const inRange = page.locator('#range-inline .pardis-day.in-range');
    const count = await inRange.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── 3. "This Month" preset covers the full month ──
  test('"This Month" preset selects the complete current month', async ({ page }) => {
    // Click the thisMonth preset
    await page.locator('#range-inline [data-preset="thisMonth"]').click();

    // range-start and range-end should both be set
    await expect(page.locator('#range-inline .pardis-day.range-start')).toHaveCount(1);
    await expect(page.locator('#range-inline .pardis-day.range-end')).toHaveCount(1);

    // range-start should be day 1
    const startCell = page.locator('#range-inline .pardis-day.range-start');
    expect(Number(await startCell.getAttribute('data-day'))).toBe(1);
  });

  // ── 4. Clear button resets range ──
  test('clear button removes range selection', async ({ page }) => {
    // First create a range
    const days = page.locator('#range-inline .pardis-day:not(.other-month)');
    await days.nth(4).click();
    await days.nth(9).click();
    await expect(page.locator('#range-inline .pardis-day.range-start')).toHaveCount(1);

    // Click clear
    await page.locator('#range-inline [data-action="clear"]').click();

    // All selection markers gone
    await expect(page.locator('#range-inline .pardis-day.range-start')).toHaveCount(0);
    await expect(page.locator('#range-inline .pardis-day.range-end')).toHaveCount(0);
    await expect(page.locator('#range-inline .pardis-day.in-range')).toHaveCount(0);
  });
});
