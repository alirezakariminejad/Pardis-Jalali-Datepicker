# E2E Test Suite Design — Pardis Jalali Datepicker v3

**Date:** 2026-02-27
**Status:** Approved
**Scope:** Full Playwright E2E coverage for multi-calendar (v3) architecture

---

## Goals

1. Validate real browser interaction for both calendar engines.
2. Prevent regressions from the engine abstraction refactor.
3. Provide CI-compatible test infrastructure.
4. Cover Jalali, Gregorian, range selection, and keyboard navigation.

---

## Architecture Decision

**Approach chosen:** One shared `e2e/test-page.html` with all pickers pre-mounted; 4 spec files targeting ID-anchored instances.

**Rejected alternatives:**
- Separate HTML per domain (unnecessary duplication).
- `page.setContent()` injection (harder to debug visually).

---

## File Structure

```
e2e/
  test-page.html         # Test sandbox — 5 picker instances
  jalali.spec.ts         # Jalali calendar behavior (8 tests)
  gregorian.spec.ts      # Gregorian calendar behavior (8 tests)
  range.spec.ts          # Range selection (4 tests)
  keyboard.spec.ts       # Keyboard navigation (5 tests)
playwright.config.ts     # Root-level Playwright configuration
```

---

## Test Page Pickers

| Window global | Target ID | Type | Options |
|---|---|---|---|
| `__jalali` | `#jalali-input` | popover input | default (fa-IR, jalali) |
| `__gregorian` | `#gregorian-input` | popover input | `calendar:'gregorian'`, `locale:'en-US-gregorian'` |
| `__range` | `#range-input` | popover input | `rangeMode:true` |
| `__jalali_inline` | `#jalali-inline` | inline div | jalali, inline:true |
| `__gregorian_inline` | `#gregorian-inline` | inline div | gregorian, inline:true |

Inline instances are used for month-cell-count tests to avoid popover open/close timing issues.

---

## DOM Anchors (no new data-testid needed)

| What | Selector |
|---|---|
| Calendar container | `.pardis-calendar` |
| Day cell (any) | `[role="gridcell"][data-year][data-day]` |
| Today cell | `.pardis-day.today` |
| Selected cell | `.pardis-day.selected` |
| Range start | `.pardis-day.range-start` |
| Range end | `.pardis-day.range-end` |
| In-range cell | `.pardis-day.in-range` |
| Prev month button | `[data-action="prevMonth"]` |
| Next month button | `[data-action="nextMonth"]` |
| Month title chip | `[data-action="showMonth"]` |
| Year title chip | `[data-action="showYear"]` |
| Today button (footer) | `[data-action="goToday"]` |
| Clear button | `[data-action="clear"]` |
| Weekday headers | `.pardis-weekday` |

---

## Payload Capture Pattern

The test page exposes datepicker instances as `window.__jalali`, `window.__gregorian`, `window.__range`.

```typescript
// Attach listener before triggering action, resolve via Promise
const payload = await page.evaluate(() =>
  new Promise(resolve => window.__jalali.engine.on('select', resolve))
);
// Then trigger click
await page.locator('#jalali-inline [data-day="15"]').first().click();
// Await the Promise
```

For simpler assertions, the test page also writes the last payload to `window.__lastPayload`.

---

## Test Coverage

### jalali.spec.ts (8 tests)

1. Opens popover on input focus
2. Esfand 1402 has 29 current-month day cells (non-leap)
3. Esfand 1403 has 30 current-month day cells (leap)
4. Click on a day cell selects it (`.selected` class appears)
5. Select event payload contains `jalali.year`, `jalali.month`, `jalali.day`
6. `[data-action="prevMonth"]` navigates to previous month
7. Today cell has `.today` class
8. Year grid navigation: open year picker, click a year, view updates

### gregorian.spec.ts (8 tests)

1. February 2023 inline: 28 current-month day cells
2. February 2024 inline: 29 current-month day cells
3. February 1900 (nav to it): 28 day cells (century non-leap)
4. February 2000 (nav to it): 29 day cells (400-year leap)
5. Select event payload has `calendar === 'gregorian'` and `gregorian.year/month/day`
6. First weekday column header text is "Sun" (en-US-gregorian locale)
7. Jalali and Gregorian inline instances render independently (no conflicts)
8. prevMonth / nextMonth navigation works correctly

### range.spec.ts (4 tests)

1. First click sets range start — hint text changes to "select end date"
2. Second click sets range end — `.in-range` cells appear between start and end
3. "This Month" preset button selects the full current month range
4. Clear button resets range — `.selected`, `.range-start`, `.range-end` gone

### keyboard.spec.ts (5 tests)

1. ArrowRight moves focus to next calendar day
2. Enter on a focused day cell selects it
3. Escape closes the popover
4. Tab through the calendar produces no console errors
5. Full keyboard flow (open → navigate → select → close) produces no errors

---

## Infrastructure

### playwright.config.ts

- Project: Chromium only, headless
- `webServer`: `npx serve . -p 4173 --no-clipboard`, `reuseExistingServer: !process.env.CI`
- `baseURL`: `http://localhost:4173`
- `testMatch`: `e2e/**/*.spec.ts`
- `screenshot`: `only-on-failure`
- `video`: `off`

### package.json additions

```json
"test:e2e":    "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:all":    "npm test && npm run test:e2e"
```

### New devDependencies

```
@playwright/test   (installs test runner + types)
serve              (static file server for webServer)
```

Browser binaries installed via `npx playwright install chromium`.

---

## CI Notes

- `npm run test:e2e` runs fully headless.
- `PLAYWRIGHT_BROWSERS_PATH=0` can be set to use pre-installed browsers.
- On CI set `CI=true` so `reuseExistingServer` is false (fresh server each run).
- Test results output to `playwright-report/` (gitignored).
