# E2E Playwright Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install Playwright and create 25 E2E tests covering Jalali, Gregorian, range, and keyboard interaction for the v3 multi-calendar architecture.

**Architecture:** One shared `e2e/test-page.html` pre-mounts 13 picker instances (popover + inline, various months). Four spec files target ID-anchored instances via stable `data-year/month/day` attributes and CSS class assertions. No mocking — real browser DOM.

**Tech Stack:** `@playwright/test` (TS, esbuild-compiled internally), `serve` (static file server), Chromium only.

---

## Payload shapes to know before writing tests

| Engine | `outputFormat:'both'` return shape |
|---|---|
| Jalali | `{ jalali:{year,month,day,…}, gregorian:{…}, iso, timestamp }` — **no top-level `calendar` key** |
| Gregorian | `{ calendar:'gregorian', gregorian:{year,month,day,…}, jalali:{…}, iso, timestamp }` |

---

## Task 1: Install dependencies and configure Playwright browsers

**Files:**
- Modify: `package.json` (devDependencies)

**Step 1: Install `@playwright/test` and `serve`**

```bash
cd /Volumes/T7/PardisJalaliDatepicker/Pardis-Jalali-Datepicker
npm install --save-dev @playwright/test serve
```

Expected output: `added N packages`

**Step 2: Install Chromium browser binary**

```bash
npx playwright install chromium
```

Expected output: `Chromium ... downloaded to ...`

**Step 3: Verify dist is current**

```bash
ls -la dist/index.global.js
```

If the file does not exist or is older than `lib/pardis-jalali-datepicker.js`, run:

```bash
npm run build
```

**Step 4: Commit dependency changes**

```bash
git add package.json package-lock.json
git commit -m "chore: add @playwright/test and serve for E2E tests"
```

---

## Task 2: Create `playwright.config.ts`

**Files:**
- Create: `playwright.config.ts` (project root)

**Step 1: Create the config file**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve . -p 4173 --no-clipboard',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

**Step 2: Verify config is valid (no spec files yet)**

```bash
npx playwright test --list 2>&1 | head -10
```

Expected: either "No tests found" or a list header — no TypeScript/config errors.

**Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "chore: add playwright.config.ts (Chromium, serve static server)"
```

---

## Task 3: Create `e2e/test-page.html`

**Files:**
- Create: `e2e/test-page.html`

**Step 1: Create the directory and HTML file**

```bash
mkdir -p e2e
```

Create `e2e/test-page.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Pardis E2E Test Sandbox</title>
  <link rel="stylesheet" href="/lib/pardis-jalali-datepicker.css" />
  <style>
    body { font-family: sans-serif; padding: 24px; background: #f9f9f9; }
    .section { margin-bottom: 32px; }
    h2 { font-size: 12px; color: #999; margin-bottom: 8px; }
    input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px;
            font-size: 14px; width: 200px; }
    label { display: block; margin-bottom: 4px; font-size: 12px; color: #555; }
    .inline-host { display: inline-block; vertical-align: top; margin-right: 24px; }
  </style>
</head>
<body>

  <!-- ── Popover inputs ── -->
  <div class="section">
    <h2>Popover inputs</h2>
    <label for="jalali-input">Jalali (default)</label>
    <input id="jalali-input" type="text" autocomplete="off" placeholder="Jalali date" />
    <br /><br />
    <label for="gregorian-input">Gregorian</label>
    <input id="gregorian-input" type="text" autocomplete="off" placeholder="Gregorian date" />
    <br /><br />
    <label for="range-input">Range (Jalali)</label>
    <input id="range-input" type="text" autocomplete="off" placeholder="Range" />
  </div>

  <!-- ── General inline ── -->
  <div class="section">
    <h2>General inline</h2>
    <div id="jalali-inline"    class="inline-host"></div>
    <div id="gregorian-inline" class="inline-host"></div>
    <div id="range-inline"     class="inline-host"></div>
  </div>

  <!-- ── Month-length targets ── -->
  <div class="section">
    <h2>Month-length targets</h2>
    <div id="esfand-1402" class="inline-host"></div>
    <div id="esfand-1403" class="inline-host"></div>
    <div id="feb-2023"    class="inline-host"></div>
    <div id="feb-2024"    class="inline-host"></div>
    <div id="feb-1900"    class="inline-host"></div>
    <div id="feb-2000"    class="inline-host"></div>
  </div>

  <!-- ── Keyboard test target ── -->
  <div class="section">
    <h2>Keyboard test target</h2>
    <div id="keyboard-target" class="inline-host"></div>
  </div>

  <script src="/dist/index.global.js"></script>
  <script>
    const { PardisDatepicker } = PardisJalaliDatepicker;

    // ── Popover pickers ──
    window.__jalali     = new PardisDatepicker('#jalali-input');
    window.__gregorian  = new PardisDatepicker('#gregorian-input', {
      calendar: 'gregorian',
      locale:   'en-US-gregorian',
    });
    window.__range      = new PardisDatepicker('#range-input', { rangeMode: true });

    // ── General inline ──
    window.__jalaliInline = new PardisDatepicker('#jalali-inline', { inline: true });
    window.__gregorianInline = new PardisDatepicker('#gregorian-inline', {
      calendar: 'gregorian',
      locale:   'en-US-gregorian',
      inline:   true,
    });
    window.__rangeInline = new PardisDatepicker('#range-inline', {
      rangeMode: true,
      inline:    true,
    });

    // ── Month-length inline instances ──
    window.__esfand1402 = new PardisDatepicker('#esfand-1402', {
      inline: true, initialYear: 1402, initialMonth: 12,
    });
    window.__esfand1403 = new PardisDatepicker('#esfand-1403', {
      inline: true, initialYear: 1403, initialMonth: 12,
    });
    window.__feb2023 = new PardisDatepicker('#feb-2023', {
      calendar: 'gregorian', locale: 'en-US-gregorian',
      inline: true, initialYear: 2023, initialMonth: 2,
    });
    window.__feb2024 = new PardisDatepicker('#feb-2024', {
      calendar: 'gregorian', locale: 'en-US-gregorian',
      inline: true, initialYear: 2024, initialMonth: 2,
    });
    window.__feb1900 = new PardisDatepicker('#feb-1900', {
      calendar: 'gregorian', locale: 'en-US-gregorian',
      inline: true, initialYear: 1900, initialMonth: 2,
    });
    window.__feb2000 = new PardisDatepicker('#feb-2000', {
      calendar: 'gregorian', locale: 'en-US-gregorian',
      inline: true, initialYear: 2000, initialMonth: 2,
    });

    // ── Keyboard test target — Gregorian LTR, Jan 2025 ──
    window.__keyboardTarget = new PardisDatepicker('#keyboard-target', {
      calendar:     'gregorian',
      locale:       'en-US-gregorian',
      inline:       true,
      initialYear:  2025,
      initialMonth: 1,
    });

    // ── Shared payload helpers ──
    window.__lastPayload      = null;
    window.__lastRangePayload = null;

    window.__jalaliInline.engine.on('select',      p  => { window.__lastPayload      = p; });
    window.__gregorianInline.engine.on('select',   p  => { window.__lastPayload      = p; });
    window.__rangeInline.engine.on('rangeSelect',  p  => { window.__lastRangePayload = p; });
    window.__rangeInline.engine.on('rangeStart',   () => { window.__rangeStarted     = true; });
  </script>
</body>
</html>
```

**Step 2: Start the server and manually verify**

```bash
npx serve . -p 4173 --no-clipboard &
# Open http://localhost:4173/e2e/test-page.html in a browser
# Verify no JS console errors
# Verify calendars render visually
kill %1
```

**Step 3: Commit**

```bash
git add e2e/test-page.html
git commit -m "test: add E2E test-page.html with 13 picker instances"
```

---

## Task 4: Create `e2e/jalali.spec.ts`

**Files:**
- Create: `e2e/jalali.spec.ts`

**Step 1: Create the spec file**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Jalali calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
  });

  // ── 1. Opens popover on input focus ──
  test('opens popover on input focus', async ({ page }) => {
    const input = page.locator('#jalali-input');
    await input.focus();
    await expect(page.locator('.pardis-calendar-popover')).toBeVisible();
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
    const popover = page.locator('.pardis-calendar-popover');
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
    const popover = page.locator('.pardis-calendar-popover');
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
```

**Step 2: Run jalali tests**

```bash
npx playwright test e2e/jalali.spec.ts --reporter=list
```

Expected: 8 passed, 0 failed.

If a test fails, read the error message. Common issues:
- `.pardis-day:not(.other-month)` count mismatch → check if `initialYear/initialMonth` were applied correctly
- Payload is `null` → listener may not have fired; verify event name is `'select'`
- Year grid not closing after click → the year → month transition may need a month click first

**Step 3: Commit**

```bash
git add e2e/jalali.spec.ts
git commit -m "test(e2e): add jalali.spec.ts — 8 tests for Jalali calendar behavior"
```

---

## Task 5: Create `e2e/gregorian.spec.ts`

**Files:**
- Create: `e2e/gregorian.spec.ts`

**Step 1: Create the spec file**

```typescript
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
    const popover = page.locator('.pardis-calendar-popover');
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
```

**Step 2: Run gregorian tests**

```bash
npx playwright test e2e/gregorian.spec.ts --reporter=list
```

Expected: 8 passed, 0 failed.

Debugging tips:
- If test 7 fails (independence), verify `#jalali-inline` and `#gregorian-inline` are distinct DOM trees.
- If test 6 (Sunday) fails, check the en-US-gregorian weekday array in the library: should start with 'Sun'.

**Step 3: Commit**

```bash
git add e2e/gregorian.spec.ts
git commit -m "test(e2e): add gregorian.spec.ts — 8 tests including leap year edge cases"
```

---

## Task 6: Create `e2e/range.spec.ts`

**Files:**
- Create: `e2e/range.spec.ts`

**Step 1: Create the spec file**

```typescript
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
```

**Step 2: Run range tests**

```bash
npx playwright test e2e/range.spec.ts --reporter=list
```

Expected: 4 passed, 0 failed.

Debugging tips:
- If test 2 fails: verify that clicking `days.nth(11)` does land on a day after `nth(4)` chronologically. The `.pardis-day:not(.other-month)` list is in DOM order (day 1 first), so `nth(4)` = day 5 and `nth(11)` = day 12. ✓
- If "This Month" test fails: check the Jalali locale's `ui.thisMonth` string — the button uses `data-preset="thisMonth"` regardless of locale.

**Step 3: Commit**

```bash
git add e2e/range.spec.ts
git commit -m "test(e2e): add range.spec.ts — 4 tests for range selection workflow"
```

---

## Task 7: Create `e2e/keyboard.spec.ts`

**Files:**
- Create: `e2e/keyboard.spec.ts`

**Step 1: Create the spec file**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
  });

  // ── 1. ArrowRight moves focus to the next day ──
  // Uses Gregorian LTR calendar (Jan 2025) where ArrowRight = +1 day in DOM order.
  test('ArrowRight moves focus to the next calendar day (LTR Gregorian)', async ({ page }) => {
    // Click on day 14
    const day14 = page.locator('#keyboard-target .pardis-day:not(.other-month)[data-day="14"]').first();
    await day14.click();

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
    await expect(page.locator('.pardis-calendar-popover')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.pardis-calendar-popover')).not.toBeVisible();
  });

  // ── 4. Tab key cycles through calendar controls without errors ──
  test('Tab navigates through calendar focusable elements without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.locator('#gregorian-input').focus();
    await expect(page.locator('.pardis-calendar-popover')).toBeVisible();

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
    await expect(page.locator('.pardis-calendar-popover')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.pardis-calendar-popover')).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
```

**Step 2: Run keyboard tests**

```bash
npx playwright test e2e/keyboard.spec.ts --reporter=list
```

Expected: 5 passed, 0 failed.

Debugging tips:
- Test 1 (ArrowRight): if `focusedDay` is `null`, the keyboard handler may not be moving focus. Verify that the day cell has `tabindex="0"` and that the library's `_bindCalendarKeyboard` registers on the inline container. Try adding a small wait: `await page.waitForTimeout(50)` after `press('ArrowRight')` if the handler is async.
- Test 2 (Enter): if `.selected` class does not appear, check that the `Enter` key event triggers selection on the focused gridcell. The library handles `e.key === 'Enter'` at line ~1809 of the source.
- Test 3 (Escape): if popover stays visible, ensure the `_onKeydown` Escape handler is registered. The popover must be focused or the event must bubble to `document`.

**Step 3: Commit**

```bash
git add e2e/keyboard.spec.ts
git commit -m "test(e2e): add keyboard.spec.ts — 5 tests for arrow/enter/escape/tab"
```

---

## Task 8: Update `package.json` scripts

**Files:**
- Modify: `package.json`

**Step 1: Add test scripts**

In `package.json`, update the `"scripts"` section:

```json
"scripts": {
  "build":        "tsup && cp lib/pardis-jalali-datepicker.d.ts dist/index.d.ts",
  "test":         "node scripts/year-boundary-test.js && node scripts/gregorian-engine-test.js",
  "test:e2e":     "playwright test",
  "test:e2e:ui":  "playwright test --ui",
  "test:all":     "npm test && npm run test:e2e",
  "prepublishOnly": "npm run build"
}
```

**Step 2: Verify `test:all` works**

```bash
npm run test:all
```

Expected: unit tests pass, then E2E tests pass. All 25 E2E tests should be green.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add test:e2e, test:e2e:ui, test:all npm scripts"
```

---

## Task 9: Add `.gitignore` entries for Playwright artifacts

**Files:**
- Modify: `.gitignore` (or create if absent)

**Step 1: Check current .gitignore**

```bash
cat .gitignore 2>/dev/null || echo "(no .gitignore)"
```

**Step 2: Add Playwright output directories**

Append these lines if not already present:

```
# Playwright
playwright-report/
test-results/
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add playwright-report/ and test-results/ to .gitignore"
```

---

## Task 10: Update `README.md` — add Testing section

**Files:**
- Modify: `README.md`

**Step 1: Locate the correct insertion point**

Read `README.md` and find the end of the existing documentation (before the last heading or at the end of the file).

**Step 2: Add the Testing section**

Add the following block at the end of `README.md` (or before a closing "License" section if one exists):

```markdown
## Testing

The library has two levels of automated tests.

### Unit Tests

Validate the headless engine math (Jalali ↔ Gregorian conversion, leap year logic, JDN round-trips, range mode, constraint handling) using plain Node.js scripts — no test runner required.

```bash
npm test
```

Covers:
- `scripts/year-boundary-test.js` — Jalali year boundary and leap year cases
- `scripts/gregorian-engine-test.js` — Gregorian engine with all leap year rules (1900, 2000, 2024)

### E2E Tests (Playwright)

Validate real browser interaction via [Playwright](https://playwright.dev/). Tests run against Chromium in headless mode.

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Open the interactive Playwright UI
npm run test:e2e:ui

# Run unit tests + E2E in sequence
npm run test:all
```

**Prerequisites:** Build the library first (`npm run build`), then install Playwright browsers once:

```bash
npm run build
npx playwright install chromium
```

**Test coverage:**

| File | Tests | What it covers |
|---|---|---|
| `e2e/jalali.spec.ts` | 8 | Popover open, Esfand leap/non-leap cell counts, click select, payload shape, month nav, today cell, year grid |
| `e2e/gregorian.spec.ts` | 8 | February 2023/2024/1900/2000 cell counts, payload shape, Sunday-first weekday, instance independence, month nav |
| `e2e/range.spec.ts` | 4 | Range start hint, range end + in-range cells, "This Month" preset, clear |
| `e2e/keyboard.spec.ts` | 5 | ArrowRight focus, Enter select, Escape close, Tab no errors, full keyboard flow |

### CI Usage

```yaml
- run: npm run build
- run: npx playwright install --with-deps chromium
- run: npm run test:all
```

Set `CI=true` so Playwright starts a fresh server for each run.
```

**Step 3: Run full test suite one final time to confirm everything is green**

```bash
npm run test:all
```

Expected output:
- Unit tests: all passing
- E2E tests: 25 passed, 0 failed

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add Testing section — unit tests and E2E Playwright instructions"
```

---

## Done ✓

At the end of this plan:
- Playwright installed, Chromium configured
- `playwright.config.ts` at project root
- `e2e/test-page.html` with 13 picker instances
- 25 E2E tests across 4 spec files
- `npm run test:e2e` / `test:all` scripts working
- README Testing section added
- CI-ready (`CI=true` flag supported)

**Validated:**
- Jalali behavior: popover, cell counts, click select, payload shape, navigation ✓
- Gregorian behavior: leap year edge cases (1900, 2000, 2024), payload, locale weekday, independence ✓
- Multi-calendar isolation confirmed: two engines in same page, no cross-contamination ✓
- Range selection: start/end/in-range/preset/clear ✓
- Keyboard: ArrowRight, Enter, Escape, Tab, full flow ✓
