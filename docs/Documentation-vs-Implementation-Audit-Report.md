Documentation-vs-Implementation Audit Report
============================================

**Project:** Pardis Jalali Datepicker (`pardis-jalali-datepicker`) **Version Audited:** 2.0.1 **Audit Date:** 2026-02-26 **Evidence Sources:** `lib/` source (1,482-line JS), `lib/*.css` (622 lines), `lib/*.d.ts`, `dist/`, `package.json`, `tsup.config.mjs`, `README.md`, `CHANGELOG.md`, `AUDIT_REPORT.md`, `docs/jalali-datepicker-docs/` (15 files), `docs/plans/` (3 files), `scripts/`, `demo/`

* * * * *

1\. Executive Summary
---------------------

### Overall Maturity: **Medium** (core is solid; ecosystem is largely vaporware)

The calendar engine, date arithmetic, and selection UX are production-quality. However, **`docs/jalali-datepicker-docs/` is a design specification document written in the future tense, not a description of the current library.** It claims 96+ features as ✅ implemented; cross-referencing with actual source reveals that fewer than half those claims are true.

### Alignment Score: **42 / 100**

The `README.md` is accurate and well-aligned (~85%). The `docs/jalali-datepicker-docs/` subdirectory is severely misaligned (~20%). CHANGELOG and AUDIT_REPORT are accurate.

### Main Risks

| Risk | Severity |
| --- | --- |
| `docs/jalali-datepicker-docs/` presents planned features as implemented (SSR, framework adapters, locale system, testing, headless mode, Web Component) | **Critical** |
| CSS variable prefix is `--pardis-*` in code but `--jdp-*` in theming docs | **High** |
| IIFE global is `window.PardisJalaliDatepicker` in code but `window.JalaliDatepicker` in package-structure doc | **High** |
| `mobileMode` option is accepted by constructor, does absolutely nothing, yet sits in TypeScript declarations | **Medium** |
| Library is vanilla JS but `05-typescript.md` claims "Library written in TypeScript" | **Medium** |
| Only 1 test script exists (year boundaries); docs claim 12+ categories of test coverage | **High** |

* * * * *

2\. Feature Matrix
------------------

| Feature | Category | Maturity | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Jalali ↔ Gregorian conversion | Core | **1 --- Stable** | `lib/pardis-jalali-datepicker.js:11-138` (`JalaaliUtil`) | Algorithm-correct, no external deps |
| Leap year detection | Core | **1 --- Stable** | `lib/...js:58-60` (`isLeapJalaaliYear`) | Based on jalCal breaks array |
| Month length calculation (incl. Esfand 29/30) | Core | **1 --- Stable** | `lib/...js:62-66` | All 12 months correct |
| Year range MIN=1, MAX=3177 | Core | **1 --- Stable** | `lib/...js:152-153`, `scripts/year-boundary-test.js` | Clamped + tested |
| Single date selection | Core | **1 --- Stable** | `lib/...js:299-334` | `onChange` callback, `getValue()` |
| Date range selection + hover preview | Core | **1 --- Stable** | `lib/...js:299-334`, `lib/...css:376-450` | hover-range CSS wired to JS |
| Preset ranges (thisWeek, thisMonth, last7Days, last30Days) | Core | **1 --- Stable** | `lib/...js:541-589` | Aliases `last7`/`last30` also work (v2.0.1) |
| `maxRange` enforcement | Core | **1 --- Stable** | `lib/...js:313-315` | Silently rejects oversized selections |
| `minDate` / `maxDate` | Core | **1 --- Stable** | `lib/...js:344-361` | Julian Day Number comparison |
| `disabledDates` (array or predicate) | Core | **1 --- Stable** | `lib/...js:350-361` | Both function and array forms work |
| `highlightedDates` with custom `className` | Core | **1 --- Stable** | `lib/...js:364-368`, `lib/...css:591-594` | Defaults to `.highlighted` |
| Popover mode | UX | **1 --- Stable** | `lib/...js:1091-1260` | Full open/close lifecycle |
| Inline mode | UX | **1 --- Stable** | `lib/...js:1096`, `lib/...css:560-567` | `inline: true` |
| Input masking (Persian digits + auto-slash) | UX | **1 --- Stable** | `lib/...js:976-1061` (`PardisInputMask`) | Handles Persian+Latin input |
| Today/Clear buttons | UX | **1 --- Stable** | `lib/...js:417-425` renderer buttons | Wired to engine |
| Month/Year grid view toggle | UX | **1 --- Stable** | `lib/...js:286-295` (`setViewMode`, `toggleViewMode`) | Three views: day/month/year |
| Keyboard navigation (day view) | A11y | **1 --- Stable** | `lib/...js:1300-1390` | All 11 keys per WCAG 2.1 |
| Keyboard navigation (month/year grids) | A11y | **1 --- Stable** | `lib/...js:1350-1370` | Arrow + Enter/Space |
| `role="dialog"` + `aria-modal` + `aria-labelledby` | A11y | **1 --- Stable** | `lib/...js` (v2.0.0 fix, confirmed in CHANGELOG) | Instance-scoped `pardis-heading-N` ID |
| `role="grid"` / `role="gridcell"` | A11y | **1 --- Stable** | renderer DOM structure | Confirmed in AUDIT_REPORT |
| `aria-selected` / `aria-disabled` | A11y | **1 --- Stable** | renderer day attributes | Per README claim |
| Swipe gesture (horizontal, 40px threshold) | Mobile | **1 --- Stable** | `lib/...js:1270-1297` (`_bindSwipe`) | `pointerdown`/`pointerup`, RTL-aware |
| Persian numerals (`numeralType: 'persian'`) | i18n | **1 --- Stable** | `lib/...js:663-665` (`toPersianNum`) | Default |
| Latin numerals (`numeralType: 'latin'`) | i18n | **1 --- Stable** | `lib/...js:668-670` (`formatNum`) | Documented in README |
| Three CSS themes (Modern, Glass, Classic) | Theming | **1 --- Stable** | `lib/...css:5-83` | `data-pardis-theme` attribute |
| `--pardis-*` CSS custom properties | Theming | **1 --- Stable** | `lib/...css:5-32` | 22 variables defined |
| ESM / CJS / IIFE build outputs | Build | **1 --- Stable** | `dist/index.mjs`, `.cjs`, `.global.js` | All verified |
| `package.json` exports map | Build | **1 --- Stable** | `package.json` `"exports"` field | `types`/`import`/`require` |
| `dist/index.d.ts` TypeScript declarations | Build | **1 --- Stable** | `dist/index.d.ts` = `lib/pardis-jalali-datepicker.d.ts` | Hand-authored, copied by build script |
| `outputFormat: 'both' | 'jalali' | 'gregorian'` | Core | **1 --- Stable** |
| `PardisEngine.buildDatePayload()` static helper | Core | **1 --- Stable** | `lib/...js:617-651` | Documented in README |
| Multi-instance support | Core | **1 --- Stable** | `lib/...js:1091` constructor | Stateless instances |
| `open()` / `close()` / `destroy()` | API | **1 --- Stable** | `lib/...js:1392-1475` | Confirmed public |
| `getValue()` / `setValue(jy,jm,jd)` / `clear()` | API | **1 --- Stable** | `lib/...js:1408-1420` | v2.0.1 fixed TS signature |
| `setOption(key, value)` | API | **1 --- Stable** | `lib/...js:1431-1453` | Runtime option update + re-render |
| `goToToday()` / `getPresetRange()` wrappers | API | **1 --- Stable** | `lib/...js:1422-1429` | Added v2.0.1 |
| `dp.engine` direct access | API | **2 --- Hidden** | `lib/...js:1131` | Documented in README as "low-level" footnote |
| `JalaaliUtil` export | API | **2 --- Hidden** | `lib/...js:1481` | Exported but not fully documented in README API section |
| `PardisEngine` export | API | **2 --- Hidden** | `lib/...js:1481` | Same as above |
| `mobileMode` option | Mobile | **2 --- Hidden** | `lib/...js:1096` (defined, never read) | Accepted by constructor, does nothing |
| Bottom-sheet CSS skeleton | Mobile | **2 --- Hidden** | `lib/...css:161-206` (`.pardis-overlay`, `.pardis-bottom-sheet`, `.pardis-sheet-handle`) | CSS present, no JS activation logic |
| `@media (max-width: 480px)` responsive CSS | Mobile | **2 --- Hidden** | `lib/...css:570-575` | Calendar goes 100% width; not in README |
| `PardisInputMask.setRangeValue()` | API | **2 --- Hidden** | `lib/...js:1052-1056` | Sets `YYYY/MM/DD ← YYYY/MM/DD` format |
| SSR compatibility | SSR | **3 --- Partial** | `lib/...js` --- no window/document guards | Date math works in Node; DOM instantiation fails |
| Bottom sheet on mobile viewport | Mobile | **3 --- Partial** | CSS structure exists; no JS responsive trigger | Marked ✅ in `08-mobile-touch.md` --- **false** |
| Arabic numeral type | i18n | **4 --- Doc Only** | No code found | `04-localization.md` claims ✅ `numeralType: 'arabic'` |
| `locale` / pluggable locale system | i18n | **4 --- Doc Only** | No code found | `04-localization.md` claims ✅ |
| English (en-US) locale | i18n | **4 --- Doc Only** | No code found | `04-localization.md` claims ✅ |
| RTL/LTR automatic from locale | i18n | **4 --- Doc Only** | RTL is hardcoded in CSS; no toggle | `04-localization.md` claims ✅ |
| `calendarType: 'gregorian'` | i18n | **5 --- Roadmap** | No code | `04-localization.md` marks 🔲 |
| `calendarType: 'hijri'` | i18n | **5 --- Roadmap** | No code | `04-localization.md` marks 🔲 |
| `allowNativeInput: true` | Mobile | **4 --- Doc Only** | No code found | `08-mobile-touch.md` claims ✅ |
| Haptic feedback (`navigator.vibrate`) | Mobile | **5 --- Roadmap** | No code | `08-mobile-touch.md` marks 🔲 |
| `headless: true` (zero-CSS mode) | Theming | **4 --- Doc Only** | No code found | `10-theming.md` claims ✅ |
| `renderDay` / day render prop | Theming | **4 --- Doc Only** | No code found | `10-theming.md` claims ✅ |
| Footer slot / render prop | Theming | **4 --- Doc Only** | No code found | `10-theming.md` claims ✅ |
| `className` / class prop passthrough | Theming | **4 --- Doc Only** | No code found | `10-theming.md` claims ✅ |
| Dark mode (`prefers-color-scheme`) | Theming | **4 --- Doc Only** | No code or CSS media query found | `10-theming.md` claims ✅ |
| Tailwind CSS preset/plugin | Theming | **5 --- Roadmap** | No code | `10-theming.md` marks 🔲 |
| Dual-month view for range | UX | **4 --- Doc Only** | No code found | `02-core-features.md` claims ✅ |
| Multi-month view (`monthsShown: 1|2|3`) | UX | **4 --- Doc Only** | No code or option found | `02-core-features.md` claims ✅ |
| Multi-date (non-range) selection | UX | **5 --- Roadmap** | No code | `02-core-features.md` marks 🔲 |
| Infinite scroll / continuous months | UX | **5 --- Roadmap** | No code | `02-core-features.md` marks 🔲 |
| Web Component (`<jalali-datepicker>`) | Framework | **4 --- Doc Only** | No `customElements.define()` found | `09-framework-adapters.md` claims ✅ |
| React adapter | Framework | **4 --- Doc Only** | No React code found | `09-framework-adapters.md` claims ✅ |
| Vue 3 adapter | Framework | **4 --- Doc Only** | No Vue code found | `09-framework-adapters.md` claims ✅ |
| Next.js adapter | Framework | **4 --- Doc Only** | No Next.js code found | `09-framework-adapters.md` claims ✅ |
| Angular adapter | Framework | **5 --- Roadmap** | No code | `09-framework-adapters.md` marks ⚠️ |
| Svelte adapter | Framework | **5 --- Roadmap** | No code | `09-framework-adapters.md` marks 🔲 |
| Nuxt 3 plugin/composable | Framework | **5 --- Roadmap** | No code | Conflicting ⚠️/🔲 across docs |
| 100+ Jalali conversion test pairs | Testing | **4 --- Doc Only** | Only year-boundary-test.js (65 lines) | `11-testing.md` claims ✅ |
| Keyboard navigation tests | Testing | **4 --- Doc Only** | No test framework found | `11-testing.md` claims ✅ |
| ARIA/WCAG automated tests (axe-core) | Testing | **4 --- Doc Only** | No test framework found | `11-testing.md` claims ✅ |
| Mobile/touch viewport tests | Testing | **4 --- Doc Only** | No Playwright/Cypress found | `11-testing.md` claims ✅ |
| RTL visual regression tests | Testing | **4 --- Doc Only** | No test infrastructure found | `11-testing.md` claims ✅ |
| Bundle size CI budget | Testing | **5 --- Roadmap** | No CI found | `11-testing.md` marks 🔲 |
| GitHub Actions CI | Testing | **5 --- Roadmap** | No `.github/workflows/` found | `12-release-checklist.md` marks 🔲 |
| High-contrast / forced-color mode | A11y | **5 --- Roadmap** | No CSS `forced-colors` query | `03-accessibility.md` marks 🔲 |
| `aria-live="polite"` on month heading | A11y | **4 --- Doc Only** | Not confirmed in source scan | `03-accessibility.md` claims ✅ |
| `aria-describedby` on input | A11y | **4 --- Doc Only** | Not confirmed in source scan | `03-accessibility.md` claims ✅ |
| `aria-expanded` on trigger button | A11y | **4 --- Doc Only** | Not confirmed in source scan | `03-accessibility.md` claims ✅ |

* * * * *

3\. Documented But Not Implemented
----------------------------------

These features are explicitly marked ✅ in `docs/jalali-datepicker-docs/` --- meaning "required, implemented" per the legend --- but have **zero implementation evidence** in the source code.

### 3.1 i18n / Locale System

**Claimed in:** `docs/jalali-datepicker-docs/04-localization.md`

-   `locale` prop/config object --- **no code**
-   Persian (fa-IR) locale object --- month/day names are hardcoded strings, not a locale object
-   English (en-US) locale built-in --- **no code**
-   `numeralType: 'arabic'` --- only `'persian'` and `'latin'` exist in source (`lib/...js:1104`)
-   RTL/LTR automatic from locale --- RTL is hardcoded via CSS `direction: rtl` (`lib/...css:221`), no toggle
-   Pluggable locale system --- **no code**

### 3.2 Mobile Bottom Sheet

**Claimed in:** `docs/jalali-datepicker-docs/08-mobile-touch.md`

-   Bottom sheet activation on viewport < 768px --- CSS exists (`lib/...css:161-206`), but no JS code watches viewport size or activates sheet mode. The `mobileMode` option is defined but never read.
-   `allowNativeInput: true` option --- **no code**

### 3.3 Dual-Month and Multi-Month Views

**Claimed in:** `docs/jalali-datepicker-docs/02-core-features.md`

-   Dual-month view for ranges --- single-month renderer only (`lib/...js:710-774`)
-   `monthsShown: 1|2|3` --- option does not exist

### 3.4 Theming / Headless / Render Hooks

**Claimed in:** `docs/jalali-datepicker-docs/10-theming.md`

-   `headless: true` (zero-CSS) --- no such option; renderer always generates full DOM
-   `renderDay` render prop --- renderer is fully hardcoded (`lib/...js:710-774`)
-   Footer slot / render prop --- hardcoded footer buttons only
-   `className` / class prop passthrough --- no such option
-   Dark mode via `prefers-color-scheme` --- no CSS media query found in `lib/...css`

### 3.5 Framework Adapters

**Claimed in:** `docs/jalali-datepicker-docs/09-framework-adapters.md`

-   React adapter (✅ for v17/18/19) --- **no React code exists anywhere in repo**
-   Vue 3 adapter (✅) --- **no Vue code exists**
-   Next.js adapter (✅) --- **no Next.js code exists**
-   Web Component `<jalali-datepicker>` (✅) --- no `customElements.define()` call

### 3.6 SSR Safety

**Claimed in:** `docs/jalali-datepicker-docs/07-ssr-compatibility.md`

-   "No `window`/`document` at module load" --- FALSE. `document.querySelector()`, `document.createElement()`, `document.addEventListener()` are called directly in the constructor (`lib/...js:1113, 1150, 1263`)
-   "Hydration-safe" --- FALSE. DOM is imperatively created on instantiation
-   "Tested with Vitest (SSR mode)" --- no Vitest configuration or tests exist

### 3.7 Extended Accessibility Attributes

**Claimed in:** `docs/jalali-datepicker-docs/03-accessibility.md`

-   `aria-live="polite"` on month heading --- not confirmed in source scan
-   `aria-describedby` on input field --- not confirmed in source scan
-   `aria-expanded` on trigger button --- not confirmed in source scan

### 3.8 Test Coverage

**Claimed in:** `docs/jalali-datepicker-docs/11-testing.md`

-   100+ Jalali↔Gregorian test pairs --- one 65-line boundary test script exists
-   Keyboard navigation tests --- no test framework
-   Automated ARIA/WCAG tests (axe-core) --- no test framework
-   Screen reader announcement tests --- no test framework
-   RTL visual regression tests --- no Playwright or Cypress
-   Mobile viewport touch tests --- no test framework

* * * * *

4\. Implemented But Undocumented
--------------------------------

These features exist in code but are absent from (or underemphasized in) `README.md`.

### 4.1 `mobileMode` Constructor Option

-   Defined with default `false` (`lib/...js:1096`) and present in TypeScript declarations, but never read anywhere in the implementation. It silently accepts a value that has no effect.

### 4.2 Bottom-Sheet CSS Skeleton

-   `lib/pardis-jalali-datepicker.css:161-206` contains a complete bottom-sheet component: `.pardis-overlay` (fixed backdrop), `.pardis-bottom-sheet` (slide-up panel), `.pardis-sheet-handle` (drag handle). No documentation mentions these classes or how to trigger them.