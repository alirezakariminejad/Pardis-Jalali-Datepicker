# Audit Report

## 2026-02-22

### Summary

Full repository audit of **pardis-jalali-datepicker** at version **1.0.1** (commit `7fac8a6`, tag `v1.0.1`). The library is a well-structured, zero-dependency Persian (Jalali) datepicker with clean separation between engine, renderer, input mask, and public API. The `lib/` directory is properly isolated for npm publishing. Several issues were found, most notably: **stale root-level files** that duplicate and diverge from the canonical `lib/` + `demo/` sources, **CSS scoping problems** in the library stylesheet, and a **missing npm `scripts` field**. No critical bugs were found in the date math or core logic.

---

### Strengths

- **Clean headless architecture** — `JalaaliUtil`, `PardisEngine`, `PardisRenderer`, `PardisInputMask`, and `PardisDatepicker` are well-separated concerns.
- **Correct Jalaali math** — Uses integer-division (`~~`) algorithm from the reference `jalaali-js`, not `Math.floor`. Leap year breaks array covers the full valid range.
- **Year boundary clamping** — `MIN_YEAR`/`MAX_YEAR` constants with `_clampView()` prevent navigation to invalid years. Decade navigation also uses engine methods with clamping in `lib/`.
- **Proper npm `files` field** — Only `lib/pardis-jalali-datepicker.js` and `lib/pardis-jalali-datepicker.css` are published. Demo assets are excluded.
- **Good CHANGELOG** — Follows Keep a Changelog format. Version aligns with `package.json` and git tag.
- **Comprehensive README** — Full API reference, usage examples, payload structure, theme instructions, architecture overview.
- **Range selection** — Correct start/end swap when user picks end before start. Hover preview with JDN-based comparison.
- **Boundary test script** — `scripts/year-boundary-test.js` covers year/month/decade clamping and JalaaliUtil range validation.

---

### Findings

#### Critical

*(none)*

#### High

**H1 — Stale root-level files diverge from canonical `lib/` + `demo/` sources**

- **Evidence**: `pardis-jalali-datepicker.js` (root, 1279 lines) and `pardis-jalali-datepicker.css` (root, 1013 lines) are older copies that **embed demo code directly** and **lack the v1.0.1 fixes** (no `MIN_YEAR`/`MAX_YEAR`, no `_clampView()`, decade navigation in renderer uses raw `viewYear +=/-= 12` without clamping, `getYears()` has no boundary guard).
- **Impact**: Anyone opening `pardis-jalali-datepicker.html` (root) gets the **unfixed** version. Confusing for contributors and could be mistakenly used as the library source. The root CSS file also contains the full global reset + demo styles mixed in.
- **Recommended fix**: Delete `pardis-jalali-datepicker.js`, `pardis-jalali-datepicker.css`, and `pardis-jalali-datepicker.html` from the repo root. They are superseded by `lib/` + `demo/` + `index.html`. If they must stay for backward compatibility, sync them with the `lib/` versions.

---

**H2 — Library CSS contains a Google Fonts `@import` and global reset**

- **Evidence**: `lib/pardis-jalali-datepicker.css` lines 5–8 in the root-level file contain `@import url('https://fonts.googleapis.com/css2?family=Vazirmatn...')` and `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`. However, the **published** `lib/pardis-jalali-datepicker.css` does **not** have the `@import` or global reset — only the root-level stale copy does.
- **Correction**: The `lib/` CSS is clean (starts with `:root` variables). This issue only affects the stale root file. However, the `lib/` CSS does reference `--pardis-font: 'Vazirmatn'` without loading the font. Consumers must load Vazirmatn themselves.
- **Impact**: Minor — consumers need to know to load the font. The README does not mention this requirement.
- **Recommended fix**: Add a note in README under "Quick Start" that consumers should load Vazirmatn (or their preferred font) themselves, or the library will fall back to `system-ui`.

---

**H3 — `demo/demo.css` contains global reset and `@import` for Google Fonts**

- **Evidence**: `demo/demo.css` lines 5–11: `@import url(...)` and `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }` plus `body { ... }` styles.
- **Impact**: This is **correct for a demo page** — the demo needs its own reset and font. However, since `demo/` is excluded from npm via `files`, this is fine. No action needed unless the demo is meant to be distributed.
- **Recommended fix**: None required. This is demo-only CSS and not published.

---

#### Medium

**M1 — `scripts/` directory is not in `.gitignore` and not in `package.json` `files`**

- **Evidence**: `scripts/year-boundary-test.js` exists in the repo and is tracked by git. It is not included in `package.json` `files` (good), but there is no npm `scripts` field to run it.
- **Impact**: No way to run tests via `npm test`. Contributors have to know to run `node scripts/year-boundary-test.js` manually.
- **Recommended fix**: Add to `package.json`:
  ```json
  "scripts": {
    "test": "node scripts/year-boundary-test.js"
  }
  ```

---

**M2 — `goToToday()` emits raw `selectedDate` object instead of payload in non-range mode**

- **Evidence**: `lib/pardis-jalali-datepicker.js` line 259: `this.emit('select', this.selectedDate)` — emits `{ jy, jm, jd }` directly, while `selectDate()` at line 319 emits `PardisEngine.buildDatePayload(...)`. The `PardisDatepicker._bindEngineEvents` handler at line 1062 tries to access `payload.jalali`, which will be `undefined` for the raw object.
- **Impact**: Calling `dp.engine.goToToday()` or clicking the "امروز" button fires `onChange` with a raw `{ jy, jm, jd }` object instead of the rich payload. The handler has a fallback (`payload.year !== undefined ? payload : null`) but this returns the raw object, which lacks `formattedPersian`, causing the input mask to receive `undefined` values.
- **Recommended fix**: Change line 259 in `lib/pardis-jalali-datepicker.js` from:
  ```js
  this.emit('select', this.selectedDate);
  ```
  to:
  ```js
  this.emit('select', PardisEngine.buildDatePayload(this.today.jy, this.today.jm, this.today.jd, this.outputFormat));
  ```

---

**M3 — `destroy()` does not unsubscribe the `viewChange` listener**

- **Evidence**: `lib/pardis-jalali-datepicker.js` line 1098: `engine.on('viewChange', () => this._renderer.render())` — the return value (unsubscribe function) is not stored. In `destroy()` (lines 1154–1168), only `_offSelect`, `_offRangeStart`, `_offRangeSelect`, and `_offClear` are called.
- **Impact**: After `destroy()`, the `viewChange` listener remains, causing the renderer to attempt re-renders on a potentially removed DOM element. Memory leak in long-lived SPAs.
- **Recommended fix**: Store the unsubscribe: `this._offViewChange = engine.on('viewChange', ...)` and call `this._offViewChange()` in `destroy()`.

---

**M4 — Input mask does not validate year range before calling `selectDate`**

- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 903–913: When the user types 8 digits, the mask validates month (1–12) and day (1–maxDay) but does **not** check if the year is within `MIN_YEAR`–`MAX_YEAR` or within the Jalaali breaks range (-61..3177).
- **Impact**: Typing a year like `0000` or `9999` will call `JalaaliUtil.toGregorian()` which throws `"Invalid Jalaali year"`, causing an uncaught exception.
- **Recommended fix**: Add a year range check before calling `selectDate`:
  ```js
  if (parsed.jy >= PardisEngine.MIN_YEAR && parsed.jy <= PardisEngine.MAX_YEAR) { ... }
  ```

---

**M5 — Landing page GitHub link points to generic `https://github.com`**

- **Evidence**: `website/pardis-jalali-datepicker-landing.html` line 930: `<a href="https://github.com" class="nav-cta" target="_blank">GitHub ←</a>`.
- **Impact**: The GitHub button in the landing page navigation does not link to the actual repository.
- **Recommended fix**: Change to `https://github.com/alirezakariminejad/Pardis-Jalali-Datepicker`.

---

**M6 — `package.json` missing `scripts` field entirely**

- **Evidence**: `package.json` has no `"scripts"` key.
- **Impact**: `npm test`, `npm start`, etc. do nothing. No standard entry point for CI or contributors.
- **Recommended fix**: Add at minimum:
  ```json
  "scripts": {
    "test": "node scripts/year-boundary-test.js"
  }
  ```

---

#### Low

**L1 — README screenshots reference `demo/images/` which won't render on npm**

- **Evidence**: `README.md` lines 11–15 use relative paths like `demo/images/image-01.png`. The `files` field only includes `lib/`, so npm won't have these images.
- **Impact**: Screenshots are broken on npmjs.com package page.
- **Recommended fix**: Use absolute GitHub URLs for images in README, e.g.:
  ```
  https://raw.githubusercontent.com/alirezakariminejad/Pardis-Jalali-Datepicker/main/demo/images/image-01.png
  ```

---

**L2 — README "Installation" section doesn't mention npm**

- **Evidence**: `README.md` line 74: "No package manager required. Copy `lib/` files..." — but the package is published on npm.
- **Impact**: Users may not realize they can `npm install pardis-jalali-datepicker`.
- **Recommended fix**: Add npm install instructions:
  ```
  npm install pardis-jalali-datepicker
  ```
  Keep the manual copy option as an alternative.

---

**L3 — `PardisInputMask._bind()` adds event listeners without storing references for cleanup**

- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 873–876: `addEventListener` calls in `_bind()` use arrow functions, making them impossible to remove later.
- **Impact**: If `destroy()` is called, the input mask's `input` and `keydown` listeners remain on the DOM element. Minor memory leak.
- **Recommended fix**: Store handler references and add a `destroy()` method to `PardisInputMask`.

---

**L4 — `setOption()` only handles `rangeMode` and `outputFormat`**

- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 1144–1152.
- **Impact**: Changing `minDate`, `maxDate`, `initialYear`, `initialMonth` at runtime via `setOption()` silently does nothing. The README documents `setOption(key, value)` as supporting `rangeMode` and `outputFormat`, so this is consistent — but could be a future API gap.
- **Recommended fix**: Document the limitation explicitly, or extend `setOption` to handle `minDate`/`maxDate`.

---

**L5 — `pardis-jalali-datepicker.html` (root) loads the stale root JS/CSS, not `lib/`**

- **Evidence**: Line 7: `<link rel="stylesheet" href="pardis-jalali-datepicker.css" />`, line 344: `<script src="pardis-jalali-datepicker.js"></script>`.
- **Impact**: This file uses the unfixed, pre-v1.0.1 code. Redundant with `index.html`.
- **Recommended fix**: Delete this file or redirect to `index.html`.

---

**L6 — No `LICENSE` file in repo root**

- **Evidence**: `package.json` declares `"license": "MIT"` and README says "MIT", but there is no `LICENSE` or `LICENSE.md` file.
- **Impact**: Technically the license is stated but not formally provided as a standalone file. Some automated tools and registries expect it.
- **Recommended fix**: Add a `LICENSE` file with the standard MIT text.

---

### Recommended Fix Plan

| # | Priority | Action | Files |
|---|----------|--------|-------|
| 1 | **High** | Delete stale root-level files (`pardis-jalali-datepicker.js`, `.css`, `.html`) or sync them with `lib/` | Root |
| 2 | **Medium** | Fix `goToToday()` to emit a proper payload via `buildDatePayload` | `lib/pardis-jalali-datepicker.js:259` |
| 3 | **Medium** | Store and call `_offViewChange` unsubscribe in `destroy()` | `lib/pardis-jalali-datepicker.js:1098,1154` |
| 4 | **Medium** | Add year range validation in input mask `_onInput` | `lib/pardis-jalali-datepicker.js:903` |
| 5 | **Medium** | Fix landing page GitHub link | `website/pardis-jalali-datepicker-landing.html:930` |
| 6 | **Medium** | Add `"scripts": { "test": "..." }` to `package.json` | `package.json` |
| 7 | **Low** | Use absolute GitHub URLs for README screenshots | `README.md` |
| 8 | **Low** | Add npm install instructions to README | `README.md` |
| 9 | **Low** | Add `PardisInputMask.destroy()` for listener cleanup | `lib/pardis-jalali-datepicker.js` |
| 10 | **Low** | Add `LICENSE` file | Root |
| 11 | **Low** | Add font-loading note to README | `README.md` |

---

### Verification Checklist

- [ ] Root-level stale files removed or synced
- [ ] `goToToday()` emits full payload — test: click "امروز" button, verify `onChange` receives `payload.jalali.formatted`
- [ ] `destroy()` cleans up all 5 engine listeners — test: call `dp.destroy()`, then `dp.engine.emit('viewChange')`, verify no error
- [ ] Input mask rejects out-of-range years — test: type `00001201` or `99991201`, verify no uncaught exception
- [ ] Landing page GitHub link goes to correct repo URL
- [ ] `npm test` runs `scripts/year-boundary-test.js` and passes
- [ ] README screenshots render on npmjs.com (after using absolute URLs)
- [ ] `LICENSE` file present at repo root
- [ ] `npm pack --dry-run` shows only `lib/` files + `package.json` + `README.md`
