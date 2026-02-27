import { test, expect } from '@playwright/test';

test.describe('Jalali calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
  });

  // ── 1. Opens popover on input focus ──
  test('opens popover on input focus', async ({ page }) => {
    const input = page.locator('#jalali-input');
    await input.focus();
    await expect(page.locator('.pardis-calendar-popover.open')).toBeVisible();
  });

  // ── 2. Esfand 1402 has 29 cells (non-leap) ──
  test('Esfand 1402 renders 29 current-month cells (non-leap year)', async ({ page }) => {
    const cells = page.locator('#esfand-1402 .pardis-day:not(.other-month)');
    await expect(cells).toHaveCount(29);
  });

  // ── 3. Esfand 1403 has 30 cells (leap) ──
  test('Esfand 1403 renders 30 current-month cells (leap year)', async ({ page }) => {
    const cells = page.locator('#esfand-1403 .pardis-day:not(.other-month)');
    await expect(cells).toHaveCount(30);
  });

  // ── 4. Clicking a day applies .selected class ──
  test('clicking a day cell applies .selected class', async ({ page }) => {
    const cell = page.locator('#jalali-inline .pardis-day:not(.other-month)[data-day="10"]').first();
    await cell.click();
    await expect(cell).toHaveClass(/\bselected\b/);
  });

  // ── 5. Select payload contains jalali.year / jalali.day ──
  test('select event payload contains jalali year and day', async ({ page }) => {
    const cell = page.locator('#jalali-inline .pardis-day:not(.other-month)[data-day="15"]').first();
    await cell.click();
    const payload = await page.evaluate(() => (window as any).__lastPayload);
    expect(payload).not.toBeNull();
    expect(typeof payload.jalali.year).toBe('number');
    expect(typeof payload.jalali.month).toBe('number');
    expect(payload.jalali.day).toBe(15);
    expect(typeof payload.iso).toBe('string');
  });

  // ── 6. prevMonth button navigates to the previous month ──
  test('prevMonth navigates to previous month', async ({ page }) => {
    await page.locator('#jalali-input').focus();
    const popover = page.locator('.pardis-calendar-popover.open');
    await expect(popover).toBeVisible();

    // Read current view from first current-month cell's data attributes
    const firstCell = popover.locator('.pardis-day:not(.other-month)').first();
    const initialMonth = Number(await firstCell.getAttribute('data-month'));
    const initialYear  = Number(await firstCell.getAttribute('data-year'));

    await popover.locator('[data-action="prevMonth"]').click();

    // Read new view
    const newFirstCell = popover.locator('.pardis-day:not(.other-month)').first();
    const newMonth = Number(await newFirstCell.getAttribute('data-month'));
    const newYear  = Number(await newFirstCell.getAttribute('data-year'));

    if (initialMonth === 1) {
      // Farvardin → Esfand of previous year
      expect(newMonth).toBe(12);
      expect(newYear).toBe(initialYear - 1);
    } else {
      expect(newMonth).toBe(initialMonth - 1);
      expect(newYear).toBe(initialYear);
    }
  });

  // ── 7. Today cell has .today class ──
  test('today cell has .today class', async ({ page }) => {
    await expect(page.locator('#jalali-inline .pardis-day.today')).toBeVisible();
  });

  // ── 8. Year grid navigation ──
  test('year grid opens, clicking a year transitions to month grid', async ({ page }) => {
    await page.locator('#jalali-input').focus();
    const popover = page.locator('.pardis-calendar-popover.open');
    await expect(popover).toBeVisible();

    // Click the year chip to open the year decade grid
    await popover.locator('[data-action="showYear"]').click();
    const gridView = popover.locator('.pardis-grid-view');
    await expect(gridView).toBeVisible();

    // Click first year cell in the decade grid
    const yearCell = popover.locator('.pardis-grid-view [role="gridcell"][data-year]').first();
    await yearCell.click();

    // Should now show the month grid (cells have data-month attributes)
    await expect(popover.locator('[role="gridcell"][data-month]').first()).toBeVisible();
  });
});
