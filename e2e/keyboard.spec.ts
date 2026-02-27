import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
  });

  // ── 1. ArrowRight moves focus to the next day ──
  // Uses Gregorian LTR calendar (Jan 2025) where ArrowRight = +1 day in DOM order.
  test('ArrowRight moves focus to the next calendar day (LTR Gregorian)', async ({ page }) => {
    // Focus day 14 (click re-renders DOM and loses focus; direct .focus() keeps it)
    const day14 = page.locator('#keyboard-target .pardis-day:not(.other-month)[data-day="14"]').first();
    await day14.focus();

    // Press ArrowRight
    await page.keyboard.press('ArrowRight');

    // Active element should now be day 15
    const focusedDay = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? (el as HTMLElement).getAttribute('data-day') : null;
    });
    expect(focusedDay).toBe('15');
  });

  // ── 2. Enter key selects the focused day ──
  test('Enter key selects the focused day cell', async ({ page }) => {
    // Focus a specific cell and press Enter
    const day10 = page.locator('#keyboard-target .pardis-day:not(.other-month)[data-day="10"]').first();
    await day10.focus();
    await page.keyboard.press('Enter');
    await expect(day10).toHaveClass(/\bselected\b/);
  });

  // ── 3. Escape closes the popover ──
  test('Escape key closes the open popover', async ({ page }) => {
    await page.locator('#jalali-input').focus();
    await expect(page.locator('.pardis-calendar-popover.open')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.pardis-calendar-popover.open')).not.toBeVisible();
  });

  // ── 4. Tab key cycles through calendar controls without errors ──
  test('Tab navigates through calendar focusable elements without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.locator('#gregorian-input').focus();
    await expect(page.locator('.pardis-calendar-popover.open')).toBeVisible();

    // Tab through several focusable elements
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
    }

    expect(errors).toHaveLength(0);
  });

  // ── 5. Full keyboard flow produces no console errors ──
  test('full keyboard flow: open → arrow navigate → Enter select → no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Focus the keyboard-target inline calendar — click day 10
    const day10 = page.locator('#keyboard-target .pardis-day:not(.other-month)[data-day="10"]').first();
    await day10.click();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // Select with Enter
    await page.keyboard.press('Enter');

    // Open the jalali popover and close with Escape
    await page.locator('#jalali-input').focus();
    await expect(page.locator('.pardis-calendar-popover.open')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.pardis-calendar-popover.open')).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
