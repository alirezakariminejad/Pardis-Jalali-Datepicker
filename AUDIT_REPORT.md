# Audit Report

## 2026-02-26

### Summary

Full repository audit of **pardis-jalali-datepicker** at version **2.0.0** (tag `v2.0.0`). This is a major release introducing a `tsup` build pipeline, ESM/CJS/IIFE output, hand-authored TypeScript declarations, and an `aria-labelledby` accessibility fix. All findings from the v1.1.0 audit have been resolved. The code quality and date-math correctness remain high. However, the v2.0.0 release introduced two regressions: `demo.html` now fails in-browser (loads the ES-module `lib/` file via a plain `<script>` tag), and there is a preset-name mismatch in `getPresetRange()` between the TypeScript definition/README and the JS implementation. Additionally, the TypeScript declaration file has several gaps. No Critical findings other than the broken demo.

---

### Strengths

- **All v1.1.0 / v1.2.0 bugs resolved** — `goToToday()` disabled-date guard, `_focusDayOffset()` JDN boundary clamp, `getPresetRange('thisWeek')` JDN clamp, `disabledDates` README example, range-input focus-clear listener all implemented and confirmed correct.
- **Proper ESM-first build** — Named exports (`export { PardisDatepicker, PardisEngine, JalaaliUtil }`) at the bottom of `lib/` allow tsup to generate correct named exports in all three formats. CJS and ESM both verified to return `typeof PardisDatepicker === 'function'`.
- **Clean package.json** — `"exports"` map with `"types"` condition first, `"main"` → `dist/index.cjs`, `"module"` → `dist/index.mjs`, `"types"` → `dist/index.d.ts`, `"files"` includes both `lib/` and `dist/`. `sideEffects`, `engines`, correct.
- **CSS still clean** — No global resets, no `@font-face`, no `@import`. All selectors prefixed `.pardis-*`.
- **Release hygiene** — All six version tags (`v1.0.1`–`v2.0.0`) present and annotated. CHANGELOG follows Keep a Changelog. Conventional commit messages throughout.
- **Test suite updated** — `scripts/year-boundary-test.js` correctly switched to `require('../dist/index.cjs')` after lib/ became an ES module.
- **Accessibility improvement** — `PardisDatepicker._counter` static property, `_headingId` threaded through `PardisRenderer` options, all three view heading divs stamped with `id="${headingId}"`, popover uses `aria-labelledby` instead of redundant `aria-label`.

---

### Findings

#### Critical

**C1 — `demo.html` loads ES module via plain `<script>` tag (demo is broken)**
- **Severity:** Critical
- **Evidence:** `demo.html` line 378: `<script src="lib/pardis-jalali-datepicker.js"></script>`. As of v2.0.0, `lib/pardis-jalali-datepicker.js` ends with `export { ... }`, making it an ES module. A plain `<script>` tag treats the file as a classic script and silently fails to expose any globals. `demo/demo.js` line 37 then calls `new PardisDatepicker(...)` → `ReferenceError: PardisDatepicker is not defined`.
- **Impact:** The GitHub Pages demo / local demo is completely non-functional.
- **Fix:** Replace `demo.html` line 378 with `<script src="dist/index.global.js"></script>` (IIFE build; global is `window.PardisJalaliDatepicker`). Update any inline `new PardisDatepicker(...)` calls in demo scripts to destructure: `const { PardisDatepicker } = PardisJalaliDatepicker;`.

---

#### High

**H1 — `getPresetRange()` preset names mismatch between TS definition, README, and JS implementation**
- **Severity:** High
- **Evidence:**
  - `lib/pardis-jalali-datepicker.d.ts` line 40: `getPresetRange(name: 'thisWeek' | 'thisMonth' | 'last7Days' | 'last30Days'): DateRange;`
  - `README.md` — documents `'last7Days'` and `'last30Days'`
  - `lib/pardis-jalali-datepicker.js` lines 560, 563: checks `preset === 'last7'` and `preset === 'last30'`
- **Impact:** Callers using the documented names `'last7Days'` / `'last30Days'` receive `undefined` silently (no case matched, no error thrown, method returns nothing).
- **Fix:** Rename in JS from `'last7'` → `'last7Days'` and `'last30'` → `'last30Days'` (align implementation to the public API contract already declared in TS and docs). Update `getPresetRange()` in `lib/pardis-jalali-datepicker.js` at lines 560 and 563.

**H2 — `JalaaliUtil` and `PardisEngine` exported from JS but absent from TypeScript declarations**
- **Severity:** High
- **Evidence:** `lib/pardis-jalali-datepicker.js` line 1469: `export { PardisDatepicker, PardisEngine, JalaaliUtil }`. `lib/pardis-jalali-datepicker.d.ts` declares only `PardisDatepicker` and its supporting interfaces — no `JalaaliUtil` or `PardisEngine` types.
- **Impact:** TypeScript users importing `{ JalaaliUtil }` from the package get type `any` or a compile error; no IntelliSense for `toGregorian()`, `j2d()`, etc. — despite the README recommending their use in `disabledDates` callbacks.
- **Fix:** Add minimal declarations to `lib/pardis-jalali-datepicker.d.ts`:
  ```ts
  export declare const JalaaliUtil: {
    toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number };
    j2d(jy: number, jm: number, jd: number): number;
    d2j(jdn: number): { jy: number; jm: number; jd: number };
    jalaaliMonthLength(jy: number, jm: number): number;
    isLeapJalaaliYear(jy: number): boolean;
  };
  export declare class PardisEngine {
    static readonly MIN_YEAR: number;
    static readonly MAX_YEAR: number;
    static buildDatePayload(jy: number, jm: number, jd: number, format: string): object;
    static formatNum(n: number, type: 'persian' | 'latin'): string;
  }
  ```

**H3 — `README.md` Quick Start example still loads `lib/` as a plain script**
- **Severity:** High
- **Evidence:** `README.md` lines 58–73 (Quick Start section): `<script src="lib/pardis-jalali-datepicker.js"></script>`. This contradicts the migration warning added on lines 109–126 of the same file.
- **Impact:** The very first code example a new user sees is broken. Produces a `ReferenceError` in browser.
- **Fix:** Replace the Quick Start script tag with `<script src="dist/index.global.js"></script>` and add `const { PardisDatepicker } = PardisJalaliDatepicker;` before the `new PardisDatepicker(...)` call. Ensure internal consistency with the migration note lower in the file.

---

#### Medium

**M1 — `setValue()` TypeScript signature accepts `JalaliDate` object but JS implementation takes three arguments**
- **Severity:** Medium
- **Evidence:** `lib/pardis-jalali-datepicker.d.ts` line 34: `setValue(date: JalaliDate): void`. `lib/pardis-jalali-datepicker.js` line 1409: `setValue(jy, jm, jd)`.
- **Impact:** TypeScript callers follow the type and pass an object; at runtime the method receives the object as `jy` and `jm`/`jd` are `undefined`. The call silently does nothing.
- **Fix:** Change TS definition to `setValue(jy: number, jm: number, jd: number): void`.

**M2 — `clear()` method exists in JS but missing from TypeScript declaration**
- **Severity:** Medium
- **Evidence:** `lib/pardis-jalali-datepicker.js` line 1414: `clear()` method defined and mentioned in README. Not present in `lib/pardis-jalali-datepicker.d.ts`.
- **Impact:** TypeScript users cannot call `dp.clear()` without a type error; IntelliSense doesn't surface it.
- **Fix:** Add `clear(): void;` to the `PardisDatepicker` class in `lib/pardis-jalali-datepicker.d.ts`.

**M3 — `mobileMode` in `PardisOptions` TS type has no JS implementation**
- **Severity:** Medium
- **Evidence:** `lib/pardis-jalali-datepicker.d.ts` line 16: `mobileMode?: boolean`. Searching `lib/pardis-jalali-datepicker.js` — the option is stored in `this.options` at constructor (line 1093) but never read or acted on anywhere in the source.
- **Impact:** TypeScript users can pass `mobileMode: true` expecting different behaviour; nothing happens.
- **Fix:** Either implement the option or remove it from the TS declaration (and from the constructor defaults in JS) with a note in CHANGELOG under `Removed`.

**M4 — `dist/` is not in `.gitignore` in practice; dist files are committed**
- **Severity:** Medium
- **Evidence:** `.gitignore` line 5: `dist/`. However, running `git ls-files dist/` shows the `dist/` directory IS tracked (added to git as part of v2.0.0 release). The `.gitignore` entry is being overridden by the explicit `git add`.
- **Impact:** Build artifacts (generated files) are committed to git, bloating repo history, causing merge conflicts when different developers build. The `npm publish` flow requires `dist/` to exist at publish time — it should be built fresh then, not stored in git.
- **Fix (two options):**
  - **Option A (recommended):** Remove `dist/` from git tracking (`git rm -r --cached dist/`), keep it in `.gitignore`, and add a `prepublishOnly` script: `"prepublishOnly": "npm run build"`.
  - **Option B:** Remove `dist/` from `.gitignore` and commit it intentionally — but document this decision.

---

#### Low

**L1 — CHANGELOG v2.0.0 does not document the `getPresetRange` preset-name bug**
- **Severity:** Low
- **Evidence:** The `[2.0.0]` CHANGELOG section does not mention that `'last7Days'`/`'last30Days'` are undocumented aliases for `'last7'`/`'last30'`.
- **Fix:** Add to `[2.0.0]` Known Issues or document when fixed in the patch release.

**L2 — `tsup` and `typescript` are both devDependencies but `typescript` is an undocumented peer requirement of tsup**
- **Severity:** Low
- **Evidence:** `package.json` devDependencies: `"tsup": "^8.5.1"`, `"typescript": "^5.9.3"`. tsup requires typescript as a peer (confirmed during build when it threw `Cannot find module 'typescript'`). This is not documented in contributing guidelines.
- **Fix:** Add a `CONTRIBUTING.md` note or package.json `peerDependenciesMeta` clarification. Low risk since both are listed as devDeps.

**L3 — No `prepublishOnly` build hook**
- **Severity:** Low
- **Evidence:** `package.json` `scripts` has `"build"` and `"test"` but no `"prepublishOnly"`. If a developer runs `npm publish` without first running `npm run build`, they may publish stale or missing `dist/` files.
- **Fix:** Add `"prepublishOnly": "npm run build"` to `package.json`.

**L4 — `dist/index.global.js` global structure not fully documented in README**
- **Severity:** Low
- **Evidence:** README Installation section states `const { PardisDatepicker } = PardisJalaliDatepicker` but does not document that `PardisEngine` and `JalaaliUtil` are also available as `PardisJalaliDatepicker.PardisEngine` etc. via the IIFE build.
- **Fix:** Add a note to the CDN section listing the full exported shape: `{ PardisDatepicker, PardisEngine, JalaaliUtil }`.

---

### Recommended Fix Plan

1. **[C1] Fix `demo.html`** — Change script tag to `<script src="dist/index.global.js">`, update demo scripts to destructure `PardisJalaliDatepicker`.
2. **[H3] Fix `README.md` Quick Start** — Replace `lib/` script tag with `dist/index.global.js`; add destructure line.
3. **[H1] Fix `getPresetRange()` preset names in JS** — Rename `'last7'` → `'last7Days'` and `'last30'` → `'last30Days'` in `lib/pardis-jalali-datepicker.js` lines 560 and 563.
4. **[M1] Fix `setValue()` TS signature** — Change to `setValue(jy: number, jm: number, jd: number): void` in `lib/pardis-jalali-datepicker.d.ts`.
5. **[M2] Add `clear()` to TS declaration** — `clear(): void;` in `PardisDatepicker` class.
6. **[H2] Add `JalaaliUtil` and `PardisEngine` TS declarations** — As shown in H2 fix above.
7. **[M3] Resolve `mobileMode`** — Remove from TS and JS constructor defaults, or implement.
8. **[L3] Add `prepublishOnly`** — `"prepublishOnly": "npm run build"` in `package.json`.
9. **[M4] Decide on `dist/` git tracking** — Recommended: untrack, add `prepublishOnly`.
10. **[L4] Document IIFE global shape** in README CDN section.

Release these fixes as **v2.0.1** (patch).

---

### Verification Checklist

- [ ] `demo.html` loads in browser without `ReferenceError`
- [ ] `new PardisDatepicker(...)` works from IIFE global `PardisJalaliDatepicker.PardisDatepicker`
- [ ] `getPresetRange('last7Days')` returns a valid `DateRange` (not `undefined`)
- [ ] `getPresetRange('last30Days')` returns a valid `DateRange` (not `undefined`)
- [ ] TypeScript: `import { JalaaliUtil, PardisEngine } from 'pardis-jalali-datepicker'` compiles without error under `strict: true`
- [ ] TypeScript: `dp.setValue(1402, 1, 1)` compiles (three-arg signature)
- [ ] TypeScript: `dp.clear()` compiles (method present in declaration)
- [ ] README Quick Start works copy-paste in a fresh browser tab
- [ ] `npm run build` produces all four `dist/` files cleanly
- [ ] `npm test` passes
- [ ] `git tag` shows `v2.0.1` after patch release

---

## 2026-02-24

### Summary

Full repository audit of **pardis-jalali-datepicker** at version **1.1.0** (commit `ae34ca9`, tag `v1.1.0`). The library has matured significantly since the v1.0.1 audit: all previously reported High and most Medium/Low findings have been resolved. v1.1.0 adds extensive new surface area — keyboard navigation, accessibility attributes, swipe gestures, preset ranges, `disabledDates`, `highlightedDates`, `maxRange`, and `numeralType`. Code quality remains high with correct Jalaali math, clean headless architecture, and a well-scoped published CSS. Several new findings were identified in the added surface area, all of Medium or Low severity. No Critical or new High issues found.

---

### Strengths

- **All v1.0.1 bugs resolved** — `goToToday()` now emits a full payload, `destroy()` stores and calls `_offViewChange`, input mask validates year range, landing page GitHub links fixed, `npm test` script added, `LICENSE` file present, README updated with absolute image URLs and npm install instructions.
- **CSS is clean and scoped** — `lib/pardis-jalali-datepicker.css` has no global resets, no `@font-face`, no `@import`. Variables are namespaced under `:root` and overridden per-theme via `[data-pardis-theme]`. No demo CSS leaks into the published file.
- **npm package readiness** — `package.json` has `name`, `version`, `main`, `style`, `files`, `repository`, `homepage`, `bugs`, `license`, `keywords`, `author`. The `files` array publishes only the two `lib/` artifacts. `npm test` is wired. Version `1.1.0` matches `CHANGELOG.md` and git tag `v1.1.0`.
- **Correct date math** — Jalaali ↔ Gregorian conversion uses the reference `jalaali-js` algorithm with integer-division (`~~`). Leap year detection, month-length, and day-of-week calculations are correct. Boundary clamping (`MIN_YEAR=1`, `MAX_YEAR=3177`) is consistent across navigation methods.
- **Range selection** — Start/end swap is handled correctly (JDN comparison). `maxRange` validation fires on both direct selection and preset application. Hover preview correctly uses the ordered `[lo, hi]` range.
- **Comprehensive ARIA** — `role="dialog"` + `aria-modal` on popover, `role="grid"` + `role="gridcell"` on calendar, `aria-label` with full Persian date string on each cell, `aria-selected`, `aria-disabled`, `aria-expanded` on input, `aria-describedby` to format hint, `role="columnheader"` on weekday headers. These are all present in `_renderDayView` and `_buildDOM`.
- **Keyboard navigation** — Full contract implemented: arrows ±1/±7 days with month wrap, PageUp/Down for months, Shift+PageUp/Down for years, Home/End for week row boundaries, T for today, Enter/Space for selection, Escape to close. RTL arrow-key semantics (Right=−1, Left=+1) correctly mirror the visual layout.
- **Full destroy() cleanup** — Removes `focus`, `click` (document), `keydown` (document), all 5 engine event unsubs, input mask listeners, pointer events, calendar keydown, and DOM (both inline and popover paths).
- **CHANGELOG hygiene** — Follows Keep a Changelog. All four releases (1.0.0–1.1.0) are documented in chronological order with clear Added/Fixed/Changed/Removed sections.

---

### Findings

#### Critical

*(none)*

#### High

*(none)*

---

#### Medium

**M1 — `disabledDates` predicate in README example calls `PardisEngine.buildDatePayload()` incorrectly**

- **Severity**: Medium
- **Title**: README `disabledDates` code example passes wrong destructuring to `new Date()`
- **Evidence**: `README.md` lines 243–247:
  ```js
  disabledDates: (jy, jm, jd) => {
    const { gy, gm, gd } = PardisEngine.buildDatePayload(jy, jm, jd, 'gregorian');
    return new Date(gy, gm - 1, gd).getDay() === 5;
  },
  ```
  When `outputFormat='gregorian'`, `buildDatePayload` returns `{ year, month, day, ... }` (not `{ gy, gm, gd }`). The destructuring `{ gy, gm, gd }` will produce `undefined` for all three values, so `new Date(undefined, undefined, undefined)` → `Invalid Date`, and `.getDay()` returns `NaN`, not 5. The predicate therefore never disables any Friday.
- **Impact**: Users who copy this example will have silently broken `disabledDates` logic. No error is thrown.
- **Recommended fix**: Replace the example with:
  ```js
  disabledDates: (jy, jm, jd) => {
    const { year, month, day } = PardisEngine.buildDatePayload(jy, jm, jd, 'gregorian');
    return new Date(year, month - 1, day).getDay() === 5; // Friday
  },
  ```
  Alternatively, use `JalaaliUtil.toGregorian(jy, jm, jd)` which does return `{ gy, gm, gd }` directly.

---

**M2 — `goToToday()` does not respect `minDate`/`maxDate` constraints — selects a disabled "today"**

- **Severity**: Medium
- **Title**: Today button bypasses `minDate`/`maxDate` and force-selects today
- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 261–270:
  ```js
  goToToday() {
    this.viewYear  = this.today.jy;
    this.viewMonth = this.today.jm;
    this.viewMode  = 'day';
    if (!this.rangeMode) {
      this.selectedDate = { ...this.today };
      this.emit('select', PardisEngine.buildDatePayload(...));
    }
    this.emit('viewChange', this.getViewInfo());
  }
  ```
  There is no `isDisabled(this.today.jy, this.today.jm, this.today.jd)` check before setting `selectedDate`. If today falls outside `minDate`/`maxDate` or is in the `disabledDates` array/predicate, `goToToday()` will select it anyway, bypassing the same check that `selectDate()` performs at line 300.
- **Impact**: Clicking the "امروز" button in single-date mode can force-select a date that the consumer explicitly disabled. `onChange` fires with the disabled date, which may corrupt application state.
- **Recommended fix**: Add a guard at the start of the non-range block:
  ```js
  if (!this.rangeMode && !this.isDisabled(this.today.jy, this.today.jm, this.today.jd)) {
    this.selectedDate = { ...this.today };
    this.emit('select', ...);
  }
  ```

---

**M3 — `setOption()` silently ignores most options — undocumented runtime limitation**

- **Severity**: Medium
- **Title**: `setOption()` only wires `rangeMode` and `outputFormat`; changing other options at runtime has no effect
- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 1403–1411:
  ```js
  setOption(key, value) {
    this.options[key] = value;
    if (key === 'rangeMode') { ... }
    if (key === 'outputFormat') this.engine.outputFormat = value;
  }
  ```
  Calling `setOption('minDate', {...})`, `setOption('disabledDates', [...])`, `setOption('numeralType', 'latin')`, etc. updates `this.options` but does **not** propagate to `this.engine`. The engine still uses the original values.
- **Impact**: Any consumer who attempts runtime updates to constraints or display settings via `setOption()` will get no effect without an error. Particularly problematic for dynamic forms that need to update `minDate`/`maxDate` based on other inputs.
- **Recommended fix**: Either expand `setOption()` to propagate all relevant engine properties and re-render, or document clearly in README that only `rangeMode` and `outputFormat` are supported at runtime and other changes require `destroy()` + re-instantiation.

---

**M4 — `_focusDayOffset()` does not clamp to `MIN_YEAR`/`MAX_YEAR` before calling `d2j()`**

- **Severity**: Medium
- **Title**: Keyboard navigation at year boundaries can call `d2j()` with out-of-range JDN, throwing uncaught exception
- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 1357–1370:
  ```js
  _focusDayOffset(el, jy, jm, jd, offset) {
    const targetJdn = JalaaliUtil.j2d(jy, jm, jd) + offset;
    const target    = JalaaliUtil.d2j(targetJdn);
    ...
  }
  ```
  `JalaaliUtil.d2j()` calls `JalaaliUtil.d2g()` first, then `jalCal(jy)`. If `targetJdn` maps to a Jalaali year outside `[-61, 3177)`, `jalCal()` throws `"Invalid Jalaali year"`. This happens when the user presses `ArrowUp` on the first day of year 1 (navigating 7 days back) or `ArrowDown` on the last day of year 3177.
- **Impact**: Pressing an arrow key at the calendar's absolute year boundary causes an unhandled exception visible in the console. The calendar becomes unresponsive.
- **Recommended fix**: Clamp `targetJdn` to the valid range before calling `d2j()`, or catch the exception and do nothing:
  ```js
  const minJdn = JalaaliUtil.j2d(PardisEngine.MIN_YEAR, 1, 1);
  const maxJdn = JalaaliUtil.j2d(PardisEngine.MAX_YEAR, 12, JalaaliUtil.jalaaliMonthLength(PardisEngine.MAX_YEAR, 12));
  if (targetJdn < minJdn || targetJdn > maxJdn) return;
  ```

---

**M5 — `thisWeek` preset can produce a range that starts in an invalid year when today is early in year 1**

- **Severity**: Medium (edge case)
- **Title**: `getPresetRange('thisWeek')` can return a start date before Jalaali year 1
- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 543–549:
  ```js
  const start = fromJdn(todayJdn - dow);   // dow = 0–6
  const end   = fromJdn(todayJdn - dow + 6);
  ```
  If today is 1 Farvardin year 1 (the minimum valid year) and `dow > 0`, `todayJdn - dow` produces a JDN that maps to year 0 or negative, which `jalCal()` will reject as `"Invalid Jalaali year"`. This is an extreme edge case given `MIN_YEAR = 1` corresponds to 622 CE, but it is an unguarded exception path.
- **Impact**: Clicking "هفته جاری" when today is in the first week of year 1 throws uncaught exception. Very unlikely in practice but formally a bug.
- **Recommended fix**: Clamp `start` to `MIN_YEAR/1/1` after computing the week boundaries.

---

#### Low

**L1 — `PardisRenderer` constructor calls `this.render()` before `_bindDayEvents()` — double render on init**

- **Severity**: Low
- **Title**: Calendar renders once in `PardisRenderer` constructor and again immediately in `PardisDatepicker._buildDOM()`
- **Evidence**: `lib/pardis-jalali-datepicker.js` line 690–691:
  ```js
  constructor(containerEl, engine, options = {}) {
    ...
    this.render();   // ← first render
  }
  ```
  Then `PardisDatepicker._buildDOM()` at lines 1147–1148 calls `this._renderer.render()` again immediately after construction. In popover mode `_buildDOM` at line 1188 also calls `render()`.
- **Impact**: Two identical renders happen synchronously on page load per instance. Negligible performance cost at typical scale, but wasteful and could cause flicker in slow environments.
- **Recommended fix**: Remove the `this.render()` call from `PardisRenderer` constructor, relying on the caller (`_buildDOM`) to trigger the initial render.

---

**L2 — `_onDocClick` listener fires even when picker is closed — minor extra work on every document click**

- **Severity**: Low
- **Title**: Document-level click handler checks `_isOpen` guard but is always registered
- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 1243–1247:
  ```js
  this._onDocClick = (e) => {
    if (!this._isOpen) return;   // early return but handler still fires
    ...
  };
  document.addEventListener('click', this._onDocClick);
  ```
  The handler is never removed while the picker is alive (only on `destroy()`). Every document click fires the function even when the popover is closed.
- **Impact**: Negligible in isolation; in pages with dozens of pickers or very high click rates, this accumulates. More importantly, adding/removing the listener on open/close would be more correct semantically.
- **Recommended fix**: Move `document.addEventListener('click', ...)` into `open()` and `document.removeEventListener('click', ...)` into `close()`. This also eliminates the need for the `if (!this._isOpen) return` guard.

---

**L3 — `PardisInputMask.setRangeValue()` sets raw Unicode arrow `←` in the `<input>` — disrupts mask parsing**

- **Severity**: Low
- **Title**: Range value format `"date  ←  date"` written to the input is not parseable by `_onInput`
- **Evidence**: `lib/pardis-jalali-datepicker.js` lines 1047–1051:
  ```js
  setRangeValue(start, end) {
    const s = PardisEngine.formatPersian(start.jy, start.jm, start.jd);
    const e = PardisEngine.formatPersian(end.jy,   end.jm,   end.jd);
    this.input.value = `${s}  ←  ${e}`;
  }
  ```
  If the user clicks inside the range input and presses any digit, `_onInput` tries to parse the full value (including `←` and spaces). The `←` passes through `fromPersianNum()` unchanged, then `latin.replace(/[^\d\/]/g, '')` strips it, leaving just the digits of both dates concatenated, which misparses as a single garbled date string.
- **Impact**: Editing a range input after a range is selected results in garbage being parsed or no-op. The input value is also visually confusing since it's not in the `YYYY/MM/DD` format the mask expects. Users editing the field may inadvertently trigger a wrong date selection.
- **Recommended fix**: Clear the range input when the user focuses it in range mode (or use `readOnly` / a non-editable display), and re-enable masking only for single-date mode. Alternatively, use two separate inputs for range start and end.

---

**L4 — `aria-label` on calendar grid uses `formatNum` for year but not wrapped in a `<caption>` — month/year announcement may be skipped by some screen readers**

- **Severity**: Low
- **Title**: Calendar grid `aria-label` provides month+year, but lacks a `<caption>` or `aria-labelledby` structure
- **Evidence**: `lib/pardis-jalali-datepicker.js` line 723:
  ```js
  <div class="pardis-days" role="grid" aria-label="${MONTH_NAMES[info.month-1]} ${formatNum(info.year,nt)}">
  ```
  The ARIA grid has a direct `aria-label`. However, the month/year heading is a `<div>` with `role="button"` chips, not a `<h2>` or element with an ID that can be referenced via `aria-labelledby`. Some screen readers (particularly older JAWS versions) may not announce the `aria-label` on a `div[role=grid]` reliably.
- **Impact**: Low risk — most modern screen readers handle `aria-label` on `role=grid` correctly. Potential accessibility gap for users on older assistive technology.
- **Recommended fix**: Add an ID to the month+year heading element and use `aria-labelledby` on the grid, which has broader screen reader support than `aria-label` on non-landmark elements.

---

**L5 — `package.json` missing `"module"` and `"exports"` fields — no ESM hint for bundlers**

- **Severity**: Low
- **Title**: Package only has `"main"` (CJS path), no `"module"` or `"exports"` map for bundler-native ESM
- **Evidence**: `package.json`:
  ```json
  {
    "main": "lib/pardis-jalali-datepicker.js",
    "style": "lib/pardis-jalali-datepicker.css"
  }
  ```
  The library is vanilla JS with no module format (no `import`/`export`, no `module.exports`). There is no `"exports"` field and no `"module"` field.
- **Impact**: Bundlers (Vite, Webpack, Rollup) will include the full JS file via `"main"`. There is no tree-shaking hint. The `"style"` field is non-standard and not used by most bundlers automatically. A user importing the package from npm cannot do `import { PardisDatepicker } from 'pardis-jalali-datepicker'` because the file does not export anything.
- **Recommended fix**: For the current vanilla approach (browser-only `<script>` usage), the existing `"main"` field is acceptable. However, the docs/06-package-structure.md spec calls for ESM/CJS/UMD builds and an `"exports"` map. Consider either: (a) converting the library to use `export class PardisDatepicker` and adding a build step, or (b) documenting that only `<script src="">` usage is supported and removing misleading `"main"` field.

---

**L6 — `README.md` "Internal Architecture" table lists four classes but the library has five**

- **Severity**: Low
- **Title**: Architecture table omits `PardisInputMask`
- **Evidence**: `README.md` lines 387–395:
  ```
  | Class | Role |
  | JalaaliUtil | ... |
  | PardisEngine | ... |
  | PardisRenderer | ... |
  | PardisInputMask | ... |
  | PardisDatepicker | ... |
  ```
  Actually on inspection the table does include all five. However, the introductory sentence at line 387 says "composed of **four** independent classes" — there are five.
- **Impact**: Minor documentation inaccuracy.
- **Recommended fix**: Change "four" to "five" in the sentence at `README.md:387`.

---

**L7 — Git object store has corrupted macOS `._` index sidecar file causing non-monotonic index warnings**

- **Severity**: Low (repository hygiene)
- **Title**: macOS AppleDouble resource fork `._pack-*.idx` file corrupts pack index
- **Evidence**: Running `git log` produces repeated warnings:
  ```
  error: non-monotonic index .git/objects/pack/._pack-c60b5be1d7a03d3a19bd1274feb8a41f1a0c4f8c.idx
  ```
  The file `._pack-c60b5be1d7a03d3a19bd1274feb8a41f1a0c4f8c.idx` is a macOS metadata sidecar that has been placed inside `.git/objects/pack/`, where git expects only valid pack index files.
- **Impact**: Git operations produce repeated error output on every invocation. The actual pack index (without the `._` prefix) is unaffected. No data loss risk, but noisy CI and confusing for contributors.
- **Recommended fix**: Delete the sidecar file:
  ```bash
  rm .git/objects/pack/._pack-c60b5be1d7a03d3a19bd1274feb8a41f1a0c4f8c.idx
  ```
  Add `.DS_Store` and `._*` to `.gitattributes` export-ignore. On macOS, run `dot_clean -m .git/objects/pack/` to remove all `._` files. Add to `.gitignore` (though `.git/` itself is not tracked, this prevents future sidecar files from being created in tracked directories).

---

### Recommended Fix Plan

| # | Priority | Action | File / Location |
|---|----------|--------|-----------------|
| 1 | **Medium** | Fix README `disabledDates` example — use `{ year, month, day }` destructuring, not `{ gy, gm, gd }` | `README.md:244` |
| 2 | **Medium** | Guard `goToToday()` against `isDisabled()` before selecting | `lib/pardis-jalali-datepicker.js:265` |
| 3 | **Medium** | Document `setOption()` runtime limitations or extend it to propagate all engine options | `lib/pardis-jalali-datepicker.js:1403` / `README.md:126` |
| 4 | **Medium** | Clamp `targetJdn` in `_focusDayOffset()` to valid year range before calling `d2j()` | `lib/pardis-jalali-datepicker.js:1358` |
| 5 | **Medium** | Clamp `thisWeek` preset start date to `MIN_YEAR/1/1` | `lib/pardis-jalali-datepicker.js:547` |
| 6 | **Low** | Remove `this.render()` from `PardisRenderer` constructor (double-render on init) | `lib/pardis-jalali-datepicker.js:690` |
| 7 | **Low** | Move document click listener into `open()`/`close()` instead of always-on | `lib/pardis-jalali-datepicker.js:1243` |
| 8 | **Low** | Clear range input on focus / make it read-only in range mode | `lib/pardis-jalali-datepicker.js:1047` |
| 9 | **Low** | Add `aria-labelledby` to calendar grid referencing month+year heading | `lib/pardis-jalali-datepicker.js:723` |
| 10 | **Low** | Add `"exports"` / `"module"` field or document `<script>` as the only supported usage | `package.json` |
| 11 | **Low** | Fix "four" → "five" in README architecture paragraph | `README.md:387` |
| 12 | **Low** | Remove macOS `._` pack index sidecar from `.git/objects/pack/` | `.git/objects/pack/` |

---

### Verification Checklist

- [ ] README `disabledDates` Friday-predicate example renders correctly — test: copy snippet, verify Fridays are disabled
- [ ] `goToToday()` is a no-op (or navigates without selecting) when today is outside `minDate`/`maxDate`
- [ ] `setOption('minDate', ...)` is either documented as no-op or propagates to engine — verify in browser console
- [ ] Arrow-key navigation at year 1 day 1 (`ArrowUp`) does not throw exception
- [ ] Arrow-key navigation at year 3177 last day (`ArrowDown`) does not throw exception
- [ ] "هفته جاری" preset does not throw for any today date
- [ ] `npm pack --dry-run` confirms only `lib/`, `package.json`, `README.md`, `LICENSE` are included
- [ ] `git log` produces no `non-monotonic index` warnings after cleanup
- [ ] Screen reader announces month+year when calendar grid receives focus

---

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
