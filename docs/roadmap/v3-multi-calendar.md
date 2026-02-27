# v3 Roadmap: Multi-Calendar Support

> **Status:** Planned — Not Implemented
> This document describes planned features for a future major version.
> The current stable release is **v2.x**. Nothing described here is available today.

---

## Overview

Pardis Jalali Datepicker v3 will introduce a pluggable calendar engine architecture, enabling the library to support multiple calendar systems within a single, unified API. The first new calendar system shipped alongside this architecture will be Gregorian.

This document explains the motivation, scope of change, and upgrade path for existing v2 users.

---

## Why Multi-Calendar?

### The Problem

The current architecture assumes exactly one calendar system: Jalali. Jalali logic is embedded throughout the state manager, renderer, and input mask — not as a first-class module, but as an implicit assumption woven into data structures, arithmetic calls, and field names.

This creates a hard constraint: any consumer who needs Gregorian support (for international forms, API compatibility, or mixed-calendar UIs) must perform all date conversions themselves. There is no way to configure the library to operate in Gregorian mode.

### What v3 Solves

v3 extracts calendar arithmetic into a `CalendarEngine` interface, making Jalali one concrete implementation among several. The `PardisDatepicker` class accepts a `calendar` option that selects the active engine at instantiation time. All state management, rendering, and input handling then operate through that engine, with no knowledge of whether dates are Jalali, Gregorian, or any other system.

For Jalali users: nothing changes. The default remains Jalali. Existing code continues to work without modification.

For Gregorian users: a first-class `calendar: 'gregorian'` mode becomes available for the first time.

For integrators building custom calendar systems: a documented interface and adapter pattern makes adding new calendar engines possible without forking the library.

---

## What Will Change

### New Option: `calendar`

A single new top-level option will be added to `PardisDatepicker`:

```javascript
new PardisDatepicker('#input', {
  calendar: 'jalali'     // default — unchanged from v2
  // or:
  calendar: 'gregorian'  // new in v3
});
```

This is the only new required concept. All other options remain unchanged and continue to work as documented.

### New Built-in Engine: GregorianEngine

A `GregorianEngine` class will be shipped alongside the existing Jalali implementation. It handles:

- Gregorian month lengths (including leap year handling for February)
- Gregorian year range (1–9999)
- Gregorian ↔ Julian Day Number conversion (for calendar-neutral range comparisons)
- Date formatting in `YYYY-MM-DD` style

### New Built-in Locales

Two new built-in locale definitions will be added:

| Locale key | Language | Calendar | Direction | Numerals |
|---|---|---|---|---|
| `en-US-gregorian` | English | Gregorian | LTR | Latin |
| `fa-IR-gregorian` | Persian | Gregorian | RTL | Persian |

Existing `fa-IR` and `en-US` locales are unchanged and continue to target Jalali month/weekday names.

### Internal State Field Naming

The internal state fields `{jy, jm, jd}` will be renamed to the engine-agnostic `{year, month, day}`. This is an **internal change only** — it is not visible to consumers through the public API.

### onChange Payload Enhancement

The `onChange` (and `onRangeSelect`) callback payload will include a new `calendar` field identifying which calendar system produced the event:

```javascript
// v3 payload (planned):
{
  calendar: 'jalali',   // or 'gregorian'
  jalali: { ... },
  gregorian: { ... },
  iso: '2025-03-21',
  timestamp: 1742515200000
}
```

Both `jalali` and `gregorian` sub-objects are always present in the payload regardless of which engine is active, ensuring lossless cross-system integration.

---

## What Will Not Change

The following aspects of the library are explicitly out of scope for v3 and will remain unchanged:

- **Default calendar**: Jalali. Any code using `new PardisDatepicker('#input')` without a `calendar` option will behave identically to v2.
- **Default locale**: `fa-IR`. RTL, Persian numerals, Jalali month names.
- **All existing options**: `rangeMode`, `minDate`, `maxDate`, `disabledDates`, `highlightedDates`, `maxRange`, `numeralType`, `locale`, `outputFormat`, `inline`, and all others continue to work exactly as in v2.
- **CSS custom properties**: The `--pardis-*` variable system is unchanged.
- **Theming system**: `data-pardis-theme` attribute and all built-in themes are unchanged.
- **Bundle format**: ESM, CJS, and IIFE builds continue to be published.
- **Zero dependencies**: The library remains dependency-free.
- **JalaaliUtil**: The core Jalali math implementation is not modified.

---

## Breaking Changes Summary

### v3.0 — No Breaking Changes

The v3.0 release is designed as a **drop-in upgrade** for all v2 users. There are no breaking changes in the public API.

The one potential friction point is the soft deprecation of `{jy, jm, jd}` key names in `minDate`, `maxDate`, and `disabledDates`. These will continue to work in v3 and will produce a console deprecation warning directing users to migrate to `{year, month, day}`. The old form will not be removed until v4.

### v4.0 — Planned Breaking Changes (Future)

The following breaking changes are planned for v4, not v3:

- `minDate`, `maxDate`, `disabledDates` will no longer accept `{jy, jm, jd}` key names. Only `{year, month, day}` will be accepted.
- `outputFormat` option will be removed. The v3 payload always includes both calendar representations.
- `PardisEngine.MONTH_NAMES` static property will be removed (it has always been internal, but is technically accessible).

---

## Timeline Estimate

> Timeline estimates are approximate and subject to change based on community feedback and available capacity.

| Milestone | Estimated Target |
|---|---|
| RFC review period | Q1 2026 |
| Phase 1–2 (engine abstraction + JalaliEngine) | Q2 2026 |
| Phase 3 (GregorianEngine) | Q2 2026 |
| Phase 4–5 (renderer + input mask) | Q3 2026 |
| v3.0.0-beta | Q3 2026 |
| v3.0.0 stable | Q4 2026 |

---

## How to Follow Progress

- The full architectural design is documented in [docs/architecture/multi-calendar-rfc.md](../architecture/multi-calendar-rfc.md).
- Implementation progress will be tracked in the GitHub milestones for v3.
- API preview documentation is available in [docs/guides/multi-calendar-preview.md](../guides/multi-calendar-preview.md).

---

## Frequently Asked Questions

**Will my v2 code break when I upgrade to v3?**

No. The default calendar is Jalali. All existing options and behavior are preserved. You can upgrade without changing any code.

**Can I use Gregorian and Jalali pickers on the same page in v3?**

Yes. Each `PardisDatepicker` instance is independent. You can instantiate one with `calendar: 'jalali'` and another with `calendar: 'gregorian'` on the same page.

**Will v3 support Hijri, Hebrew, or other calendar systems?**

v3 ships Jalali and Gregorian as built-in engines. The `CalendarEngine` interface is designed to be implementable by third parties, so custom engines are possible. Official support for additional calendar systems is not currently planned but may be considered in v4 or later.

**Does the Gregorian engine require a different locale?**

The `locale` option and the `calendar` option are independent. You can use `calendar: 'gregorian'` with any locale. For a conventional Gregorian/English experience, use `locale: 'en-US-gregorian'` (a new built-in locale planned for v3). For a Gregorian calendar with Persian UI strings, use `locale: 'fa-IR-gregorian'`.

**Will the bundle size increase significantly?**

No. The `GregorianEngine` implementation relies on JavaScript's built-in `Date` object for arithmetic and requires no external dependencies. The estimated bundle size increase is under 3 kB minified (under 1.5 kB gzip).
