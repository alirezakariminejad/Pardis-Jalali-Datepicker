# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

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
