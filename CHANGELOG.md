# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

### Removed
- `mobileMode` option removed from `PardisOptions` TypeScript interface and from the constructor defaults object. The option was silently accepted but never read or acted on. It will be re-added when the bottom-sheet mobile UI is properly implemented (see `docs/Execution-Plan.md` Track B, Task B.1).

### Added
- `aria-live="polite"` live region on month/year heading (WCAG 2.1 SC 4.1.3). A persistent `.pardis-sr-only` element with `aria-live="polite"` and `aria-atomic="true"` is created in `PardisRenderer` constructor and re-attached after every `innerHTML` replacement. Announces: month+year in day view, year in month view, year range in year view. Confirmed by screen-reader inspection.

### Fixed
- `aria-describedby` and `aria-expanded` confirmed implemented in source and re-marked ✅ in `docs/jalali-datepicker-docs/03-accessibility.md`.

### Documentation
- Corrected 30+ false ✅ claims across `docs/jalali-datepicker-docs/` (Phase 0 of `docs/Execution-Plan.md`). Unimplemented features (locale system, SSR safety, framework adapters, headless mode, test suite, dual-month view) now correctly marked 🔲 or ⚠️.
- Fixed CSS variable prefix in `10-theming.md`: `--jdp-*` → `--pardis-*`.
- Fixed IIFE global name in `06-package-structure.md`: `window.JalaliDatepicker` → `window.PardisJalaliDatepicker`.
- Fixed TypeScript source claim in `05-typescript.md`: library is vanilla JS with hand-authored declarations.
- Fixed `sideEffects` field in `06-package-structure.md`: `false` → `["**/*.css"]`.
- Updated `12-release-checklist.md` to mark completed v2.x items as ✅.
- Added design-reference status notice to `docs/jalali-datepicker-docs/README.md`.

## [2.0.1] - 2026-02-26

### Added
- `prepublishOnly` script to ensure `dist/` is built before `npm publish`.

### Fixed
- Fixed a crash at the absolute year boundary (`MAX_YEAR`) where `getDaysOfMonth()` could call `isDisabled()` with an out-of-range year while generating filler days.
- Fixed `demo.html` loading the ESM `lib/` file via a plain `<script>` tag; the demo now loads the IIFE build (`dist/index.global.js`).
- Fixed README Quick Start browser example to use the IIFE build (`dist/index.global.js`).
- Fixed preset range name mismatch by supporting `'last7Days'`/`'last30Days'` (with backward-compatible aliases for `'last7'`/`'last30'`).

### Changed
- TypeScript declarations now match runtime API: `setValue(jy, jm, jd)`, `clear()`, plus exported `JalaaliUtil` and `PardisEngine` typings.
- `PardisDatepicker` now exposes `goToToday()` and `getPresetRange()` wrappers (delegating to the engine).

## [2.0.0] - 2026-02-26

### Added
- ESM (`dist/index.mjs`), CJS (`dist/index.cjs`), and IIFE (`dist/index.global.js`) build output via `tsup`.
- `package.json` `"exports"` map, `"module"` field, and `"types"` field pointing to `dist/`.
- Full TypeScript declaration file (`lib/pardis-jalali-datepicker.d.ts`) exporting `JalaliDate`, `DateRange`, `PardisOptions`, and `PardisDatepicker`.

### Fixed
- `aria-labelledby` added to `role="dialog"` popover, pointing to the month/year heading with an instance-scoped ID (`pardis-heading-N`). Removes the previous redundant `aria-label`.

### Changed
- `lib/pardis-jalali-datepicker.js` is now an ES module (has `export` statements). Plain `<script src="lib/...">` (non-module) no longer works — use `<script src="dist/index.global.js">` for CDN/browser-global usage.
- `package.json` `"main"` entry moved from `lib/pardis-jalali-datepicker.js` to `./dist/index.cjs`.
- `"files"` in `package.json` now publishes the entire `lib/` directory and `dist/`.
- `npm test` now runs against `dist/index.cjs` instead of eval-loading `lib/` directly.

### BREAKING CHANGES
- **CDN `<script>` users:** Replace `<script src="lib/pardis-jalali-datepicker.js">` with `<script src="dist/index.global.js">`. The global is now `PardisJalaliDatepicker.PardisDatepicker` (or destructure: `const { PardisDatepicker } = PardisJalaliDatepicker`).
- **Bundler users:** `require('pardis-jalali-datepicker')` now resolves to `dist/index.cjs`. Named imports work: `import { PardisDatepicker } from 'pardis-jalali-datepicker'`.
- The `"exports"` field blocks deep imports (e.g. `require('pardis-jalali-datepicker/lib/...')`).

## [1.2.0] - 2026-02-24

### Added
- `setOption()` now propagates all runtime-relevant options to the engine and triggers a re-render: `minDate`, `maxDate`, `disabledDates`, `highlightedDates`, `maxRange`, `numeralType` (in addition to existing `rangeMode` and `outputFormat`).

### Fixed
- Fixed range-mode input: focusing the input now clears the current selection and input value so the user can immediately start picking a fresh range without typing corruption.

### Changed
- Updated README `setOption` method description to list all supported keys.
- Fixed README architecture section: "four independent classes" corrected to "five".

## [1.1.1] - 2026-02-24

### Fixed
- Fixed `goToToday()` selecting today even when it is outside `minDate`/`maxDate` or in `disabledDates`; the view still navigates to today but no selection occurs if today is disabled.
- Fixed keyboard arrow-key navigation throwing an uncaught exception when the focused day is at the absolute year boundary (year 1 or year 3177); navigation now stops silently at the boundary.
- Fixed `getPresetRange('thisWeek')` throwing an uncaught exception when today falls in the first week of year 1; the week start is now clamped to `1/1/1`.
- Fixed README `disabledDates` predicate example using incorrect destructuring (`{ gy, gm, gd }`) from `buildDatePayload`; replaced with `JalaaliUtil.toGregorian()` which returns those field names correctly.

## [1.1.0] - 2026-02-24

### Added
- `disabledDates` option: accepts an array of `{jy,jm,jd}` objects or a predicate function `(jy,jm,jd) => boolean` to disable specific dates.
- `highlightedDates` option: accepts an array of `{jy,jm,jd,className?}` objects to mark dates with a custom CSS class (defaults to `highlighted`).
- `maxRange` option: enforces a maximum number of days selectable in range mode; oversized selections are silently rejected.
- `numeralType` option: `'persian'` (default) renders all numbers in Persian digits (۰–۹); `'latin'` renders Latin digits throughout the calendar.
- Preset range buttons in range mode footer: هفته جاری, ماه جاری, ۷ روز گذشته, ۳۰ روز گذشته.
- Swipe gesture support: `pointerdown`/`pointerup` on the calendar element triggers prev/next month navigation on horizontal swipes > 40px.
- Full keyboard navigation in day view: Arrow keys (day/week), PageUp/PageDown (month), Shift+PageUp/PageDown (year), Home/End (week boundaries), T (today), Enter/Space (select).
- Keyboard navigation in month/year grid views: Arrow keys to move focus, Enter/Space to select.
- ARIA roles and attributes: `role=dialog`/`aria-modal` on popover, `role=grid`/`role=gridcell` on calendar days, `aria-selected`, `aria-disabled`, `aria-label` (full Persian date string) on every day cell, `aria-label` on nav buttons, `aria-expanded` on trigger input, `aria-describedby` pointing to format hint, `role=columnheader` on weekday headers.
- `.pardis-sr-only` CSS utility class for screen-reader-only content.
- CSS styles for `.highlighted` days and `.pardis-preset-btn` preset range buttons.

## [1.0.2] - 2026-02-23

### Fixed
- Fixed `goToToday()` emitting raw `{jy,jm,jd}` instead of full payload via `buildDatePayload`.
- Fixed `destroy()` not unsubscribing the `viewChange` listener (memory leak).
- Fixed input mask accepting out-of-range years (e.g. `0000`, `9999`) causing uncaught exceptions.
- Fixed landing page GitHub links pointing to generic `https://github.com`.
- Fixed `PardisInputMask` event listeners not being removable on `destroy()`.

### Changed
- Improved demo page title to be more descriptive and attractive.
- Updated README screenshots to use absolute GitHub URLs (renders on npmjs.com).
- Clarified `setOption()` supported keys in README documentation.

### Added
- Added `npm test` script to `package.json`.
- Added `npm install` instructions and font-loading note to README.
- Added `LICENSE` (MIT) file.
- Added `PardisInputMask.destroy()` method for proper listener cleanup.

### Removed
- Removed stale root-level files (`pardis-jalali-datepicker.js`, `.css`, `.html`) that diverged from `lib/`.

## [1.0.1] - 2026-02-22

### Fixed
- Prevented navigating to invalid years by clamping year/month navigation.
- Updated decade navigation to use engine methods so clamping is applied consistently.

### Changed
- Set the minimum navigable year to 1.

### Added
- Added a boundary test script to verify year navigation never goes below the minimum year.

## [1.0.0] - 2026-02-21

### Added
- Initial release.
