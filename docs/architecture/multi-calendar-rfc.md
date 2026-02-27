# RFC: Multi-Calendar Engine Architecture

> **Status:** Proposed — Planned for v3
> **Not Implemented.** This document describes a planned architectural change.
> No code in the current stable release (v2.x) implements any of the interfaces or APIs described here.

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Proposed Engine Abstraction](#3-proposed-engine-abstraction)
4. [Internal Data Model Strategy](#4-internal-data-model-strategy)
5. [Public API Design](#5-public-api-design-v3-proposal)
6. [Migration Strategy](#6-migration-strategy)
7. [Implementation Phases](#7-implementation-phases)
8. [Risk and Complexity Assessment](#8-risk-and-complexity-assessment)
9. [Decision Summary](#9-decision-summary)

---

## 1. Motivation

Pardis Jalali Datepicker was built with a clear, singular purpose: provide a first-class Jalali calendar experience for Persian-language applications. That foundation remains sound. However, several real-world usage patterns make a multi-calendar architecture desirable:

- **Dual-calendar forms**: Government and enterprise applications commonly display both Jalali and Gregorian dates and require a datepicker that can be configured per-field.
- **International deployments**: Applications serving both Persian-speaking and global users need a single, consistent datepicker component that adapts to context.
- **Gregorian-only integrations**: Downstream APIs often expect ISO-8601 dates. Providing a Gregorian calendar mode eliminates the need for consumers to perform conversion in userland.
- **Future extensibility**: Islamic Hijri, Hebrew, and other calendars share structural similarities with Jalali. A well-designed abstraction opens the door without requiring rewrites.

This RFC proposes a `CalendarEngine` interface that abstracts calendar arithmetic from state management, rendering, and public API, allowing v3 to support multiple calendar systems while preserving full backward compatibility with v2.

---

## 2. Current Architecture Analysis

### 2.1 Module Inventory

```
pardis-jalali-datepicker.js
├── JalaaliUtil (IIFE, ~138 lines)
│   ├── jalCal()          — Jalaali epoch math
│   ├── isLeapJalaaliYear()
│   ├── jalaaliMonthLength()
│   ├── j2d() / d2j()     — Jalali ↔ Julian Day Number
│   ├── g2d() / d2g()     — Gregorian ↔ Julian Day Number
│   ├── toJalaali() / toGregorian()
│   └── todayJalaali()
│
├── PARDIS_LOCALES (object literal)
│   ├── 'fa-IR'           — Jalali month/weekday names, RTL, Persian numerals
│   └── 'en-US'           — Jalali month transliterations, LTR, Latin numerals
│
├── resolveLocale()       — Locale resolver (string|object|null → PardisLocale)
│
├── PardisEngine (class, ~550 lines)
│   ├── State: viewYear, viewMonth (Jalali year/month integers)
│   ├── State: selectedDate, rangeStart, rangeEnd { jy, jm, jd }
│   ├── State: today { jy, jm, jd }
│   ├── static MONTH_NAMES[]    ← HARDCODED JALALI (duplicates locale)
│   ├── static WEEKDAY_NAMES[]  ← HARDCODED JALALI (duplicates locale)
│   ├── static MIN_YEAR = 1     ← JALALI EPOCH
│   ├── static MAX_YEAR = 3177  ← JALALI EPOCH
│   ├── getDaysOfMonth()         — calls JalaaliUtil directly
│   ├── isDisabled()             — uses JalaaliUtil.j2d() for JDN ordering
│   ├── isInRange()              — uses JalaaliUtil.j2d() for JDN ordering
│   ├── getPresetRange()         — Jalali-specific preset computations
│   ├── getMonths()              — uses static MONTH_NAMES (Jalali hardcoded)
│   ├── buildDatePayload()       — receives (jy,jm,jd), calls toGregorian()
│   └── parseDateString()        — Jalali format assumed
│
├── PardisRenderer (class, ~300 lines)
│   ├── Reads day cells as { jy, jm, jd, ... }
│   ├── Passes (jy,jm,jd) to engine.selectDate()
│   └── data-jy / data-jm / data-jd attributes on DOM nodes
│
├── PardisInputMask (class)
│   └── Persian/Latin digit normalization, Jalali format assumed
│
└── PardisDatepicker (class)
    └── Orchestrates engine + renderer + input mask + popover
```

### 2.2 Tight Coupling Points

The following specific coupling points must be addressed to support multiple calendars:

| Location | Coupling | Risk |
|---|---|---|
| `PardisEngine.MIN_YEAR = 1` | Jalali epoch | Medium — guards must be engine-delegated |
| `PardisEngine.MAX_YEAR = 3177` | Jalali epoch | Medium — same |
| `PardisEngine.MONTH_NAMES[]` | Jalali month names (hardcoded, duplicates locale) | Low — locale already owns this |
| `PardisEngine.WEEKDAY_NAMES[]` | Jalali weekday names (hardcoded) | Low — locale already owns this |
| `PardisEngine` state `{jy, jm, jd}` | Jalali field names in internal tuples | High — pervasive |
| `getDaysOfMonth()` → `JalaaliUtil.jalaaliMonthLength()` | Calls JalaaliUtil directly | High — must delegate to engine |
| `getDaysOfMonth()` → `JalaaliUtil.toGregorian()` for DOW | JDN pivot via Gregorian | Medium — engine should expose toJDN |
| `isDisabled()` / `isInRange()` → `JalaaliUtil.j2d()` | JDN ordering | Medium — engine should expose toJDN |
| `getPresetRange()` — thisWeek, thisMonth | Jalali week/month boundaries | Medium — engine should own preset logic |
| `buildDatePayload()` receives `(jy, jm, jd)` | Jalali parameter names | High — signature must change |
| `PardisRenderer` data attributes `data-jy data-jm data-jd` | DOM attribute names | Low — can be abstracted |
| `parseDateString()` — Jalali format assumed | Input format | Medium — engine should own parsing |
| `PardisInputMask` — mask pattern `9999/99/99` | Jalali digit width (4-2-2) | Medium — Gregorian is same width |

### 2.3 What Is Already Well-Isolated

The following are already calendar-agnostic or easily reused:

- **JDN as internal ordering primitive**: `isInRange()` and `isDisabled()` already convert to Julian Day Number for comparison. JDN is a calendar-neutral integer — this pivot point is reusable.
- **Locale system**: `PARDIS_LOCALES` and `resolveLocale()` already separate display strings from calendar logic. The locale system does not need to know the calendar system.
- **Event system**: `emit()` / `on()` in `PardisEngine` is calendar-neutral.
- **CSS**: Direction, theming, and layout are already locale/direction-driven, not calendar-driven.

---

## 3. Proposed Engine Abstraction

### 3.1 Design Goals

1. `PardisEngine` should orchestrate state but **not contain calendar arithmetic**.
2. Calendar arithmetic is delegated to a `CalendarEngine` implementation.
3. Internal state tuples are **calendar-agnostic** (`{year, month, day}`).
4. JDN remains the canonical comparison primitive (calendar-neutral integers).
5. Adding a new calendar system requires only implementing the `CalendarEngine` interface — no changes to `PardisEngine`, `PardisRenderer`, or `PardisDatepicker`.

### 3.2 CalendarEngine Interface

```typescript
/**
 * CalendarEngine — the interface that any calendar system must implement.
 *
 * All (year, month, day) parameters and return values are in the
 * engine's NATIVE coordinate system (e.g., Jalali or Gregorian integers).
 *
 * Planned for v3. Not yet implemented.
 */
interface CalendarEngine {
  /** Unique identifier string. */
  readonly id: 'jalali' | 'gregorian' | string;

  /** Earliest representable year in this calendar system. */
  readonly minYear: number;

  /** Latest representable year in this calendar system. */
  readonly maxYear: number;

  /** Number of months in a standard year (12 for both Jalali and Gregorian). */
  readonly monthsInYear: number;

  /**
   * Returns the number of days in a given month of a given year.
   * Accounts for leap years.
   */
  getDaysInMonth(year: number, month: number): number;

  /**
   * Returns true if the given year is a leap year in this calendar system.
   */
  isLeapYear(year: number): boolean;

  /**
   * Converts a native (year, month, day) tuple to a Julian Day Number.
   * JDN is the canonical calendar-neutral ordering primitive.
   */
  toJDN(year: number, month: number, day: number): number;

  /**
   * Converts a Julian Day Number back to a native (year, month, day) tuple.
   */
  fromJDN(jdn: number): { year: number; month: number; day: number };

  /**
   * Converts a native date to Gregorian coordinates.
   * Used for: ISO string generation, Date object construction, timestamps.
   */
  toGregorian(year: number, month: number, day: number): {
    gy: number; gm: number; gd: number;
  };

  /**
   * Converts a Gregorian date to this calendar's native coordinates.
   * Used for: "today" calculation, initial value parsing.
   */
  fromGregorian(gy: number, gm: number, gd: number): {
    year: number; month: number; day: number;
  };

  /**
   * Returns today's date in this calendar's native coordinates.
   */
  today(): { year: number; month: number; day: number };

  /**
   * Computes the day-of-week offset for the first day of a given month,
   * anchored to weekStart (0 = Sunday, 1 = Monday, 6 = Saturday, etc.).
   *
   * Returns a value in [0, 6] representing how many blank cells
   * should precede the first day in a calendar grid.
   */
  getWeekdayOffset(year: number, month: number, weekStart: number): number;

  /**
   * Parses a formatted date string in this calendar's native format.
   * Returns null if the string is not a valid date in this system.
   */
  parseString(value: string): { year: number; month: number; day: number } | null;

  /**
   * Clamps and validates a native (year, month, day) tuple.
   * Returns a valid tuple, or null if the input cannot be normalized.
   */
  normalize(
    year: number,
    month: number,
    day: number
  ): { year: number; month: number; day: number } | null;

  /**
   * Builds a rich payload object for the onChange callback.
   * Receives native coordinates; returns the calendar-appropriate payload.
   *
   * For Jalali: includes jalali + gregorian sub-objects.
   * For Gregorian: includes gregorian sub-object + iso.
   */
  buildPayload(year: number, month: number, day: number): CalendarPayload;
}
```

### 3.3 Separation of Concerns (After Abstraction)

```
┌─────────────────────────────────────────────────────────────┐
│                      PardisDatepicker                       │
│  Public API, lifecycle, popover, input binding              │
└──────────────────────────────┬──────────────────────────────┘
                               │ owns
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ PardisEngine  │   │  PardisRenderer  │   │ PardisInputMask  │
│               │   │                  │   │                  │
│ State mgmt    │   │ DOM construction │   │ Input format     │
│ Event system  │   │ Event delegation │   │ Digit mapping    │
│ Range logic   │   │ ARIA attrs       │   │                  │
└───────┬───────┘   └────────┬─────────┘   └────────┬─────────┘
        │ delegates          │ reads                 │ delegates
        ▼                    ▼                       ▼
┌───────────────────────────────────────────────────────────────┐
│                       CalendarEngine                          │
│  (interface, two built-in implementations planned for v3)     │
│                                                               │
│  JalaliEngine                   GregorianEngine               │
│  ─────────────────────          ──────────────────────────    │
│  id: 'jalali'                   id: 'gregorian'               │
│  minYear: 1                     minYear: 1                    │
│  maxYear: 3177                  maxYear: 9999                 │
│  getDaysInMonth() — jalaali     getDaysInMonth() — Gregorian  │
│  isLeapYear() — jalaali algo    isLeapYear() — Gregorian algo │
│  toJDN() — j2d()                toJDN() — g2d()              │
│  fromJDN() — d2j()              fromJDN() — d2g()            │
│  toGregorian() — conversion     toGregorian() — identity      │
│  fromGregorian() — toJalaali()  fromGregorian() — identity    │
│  today() — todayJalaali()       today() — new Date()         │
└───────────────────────────────────────────────────────────────┘
        │ unchanged
        ▼
┌───────────────┐
│  JalaaliUtil  │
│  (IIFE math)  │
│  Unchanged    │
└───────────────┘
```

`JalaaliUtil` remains unchanged. `JalaliEngine` is a thin adapter over it. `GregorianEngine` uses JavaScript's built-in `Date` for arithmetic.

---

## 4. Internal Data Model Strategy

### 4.1 Options Evaluated

**Option A — Always Gregorian internally**

Store all dates as `{gy, gm, gd}` (Gregorian) and convert to native calendar coordinates only for display.

- Pros: ISO and timestamp operations are trivial; no conversion for output.
- Cons: Jalali year/month navigation requires conversions on every UI interaction. Jalali month lengths and leap years cannot be computed without round-tripping through Gregorian. This approach conceptually inverts the calendar — Jalali becomes a display format rather than the primary system.

**Option B — Engine-native tuples**

Store all dates in the current engine's native coordinates (`{year, month, day}` where the values are interpreted by the active engine). JDN is used only for cross-date ordering and range comparison.

- Pros: Matches the existing design (`{jy, jm, jd}` renamed to `{year, month, day}`). Navigation and month-length queries operate directly in the native system. No conceptual mismatch.
- Cons: Multi-engine external APIs (e.g., a parent form mixing Jalali and Gregorian inputs) must be aware of which engine a datepicker instance is using. This is manageable because the payload always includes the ISO date.

**Option C — ISO-based canonical internal structure**

Store dates as ISO strings (`"2025-03-21"`) or as `Date` objects internally.

- Pros: Universal, interoperable.
- Cons: Floating-point and timezone edge cases with `Date`. Every arithmetic operation (month length, leap detection, navigation) requires round-trips. ISO is an output format, not a computation primitive.

### 4.2 Decision: Engine-Native Tuples with JDN for Ordering

**Chosen: Option B** — engine-native `{year, month, day}` tuples as primary state, with JDN as the calendar-neutral ordering primitive for range and constraint comparisons.

**Rationale:**

1. This is already the architecture in v2. The only change is renaming `{jy, jm, jd}` to `{year, month, day}` and delegating arithmetic to the engine.
2. JDN already serves as the comparison bridge in `isInRange()` and `isDisabled()`. It is provably calendar-neutral — any calendar system can convert its native dates to JDN integers for ordering.
3. The engine exposes `toGregorian()` for ISO, timestamps, and `Date` object construction, which covers all output requirements.
4. A `buildPayload()` method on the engine provides rich output in the appropriate shape for each calendar system, without imposing a Gregorian-first mental model.

### 4.3 Internal State Shape (v3 Planned)

```
PardisEngine internal state (v3):
  viewYear:     number  ← in active engine's native coordinates
  viewMonth:    number  ← in active engine's native coordinates
  selectedDate: { year, month, day } | null   ← native
  rangeStart:   { year, month, day } | null   ← native
  rangeEnd:     { year, month, day } | null   ← native
  hoverDate:    { year, month, day } | null   ← native
  today:        { year, month, day }          ← native, set at init
  engine:       CalendarEngine                ← the active engine instance
```

---

## 5. Public API Design (v3 Proposal)

> All examples in this section are proposed API for v3. They do not reflect the current stable API.

### 5.1 New Option: `calendar`

```javascript
new PardisDatepicker('#input', {
  // NEW in v3 — selects the calendar system
  // Default: 'jalali' (preserves v2 behavior)
  calendar: 'jalali' | 'gregorian',

  // All v2 options remain unchanged:
  locale: 'fa-IR',
  rangeMode: false,
  minDate: { year: 1402, month: 1, day: 1 },
  maxDate: { year: 1402, month: 12, day: 29 },
  // ...
});
```

### 5.2 Calendar and Locale Interaction

`calendar` and `locale` are **independent dimensions**:

| `calendar` | `locale` | Result |
|---|---|---|
| `'jalali'` | `'fa-IR'` | Jalali calendar, Persian UI, RTL, Persian numerals (v2 default) |
| `'jalali'` | `'en-US'` | Jalali calendar, transliterated English UI, LTR, Latin numerals |
| `'gregorian'` | `'en-US'` | Gregorian calendar, English UI, LTR, Latin numerals |
| `'gregorian'` | custom | Gregorian calendar, custom locale strings |

The `locale` option controls **display language, direction, and numeral system**. The `calendar` option controls **which calendar system is used for date arithmetic**.

New built-in locales planned for v3:

```javascript
// New in v3 (planned):
PARDIS_LOCALES['en-US-gregorian']  // English, Gregorian month names
PARDIS_LOCALES['fa-IR-gregorian']  // Persian UI strings, Gregorian calendar
```

### 5.3 onChange Payload Structure (v3)

The `onChange`/`onSelect` callback will receive a unified payload. The exact shape depends on the active calendar engine:

**Jalali engine payload (calendar: 'jalali'):**

```javascript
// Same as v2 with outputFormat: 'both', plus calendar field:
{
  calendar: 'jalali',
  jalali: {
    year: 1404,
    month: 1,
    day: 1,
    monthName: 'فروردین',
    formatted: '1404/01/01',
    formattedPersian: '۱۴۰۴/۰۱/۰۱',
  },
  gregorian: {
    year: 2025,
    month: 3,
    day: 21,
    monthName: 'March',
    formatted: '2025-03-21',
    date: Date,
  },
  iso: '2025-03-21',
  timestamp: 1742515200000,
}
```

**Gregorian engine payload (calendar: 'gregorian'):**

```javascript
{
  calendar: 'gregorian',
  gregorian: {
    year: 2025,
    month: 3,
    day: 21,
    monthName: 'March',
    formatted: '2025-03-21',
    date: Date,
  },
  jalali: {
    // Always included for cross-system convenience:
    year: 1404,
    month: 1,
    day: 1,
    monthName: 'Farvardin',
    formatted: '1404/01/01',
  },
  iso: '2025-03-21',
  timestamp: 1742515200000,
}
```

Both payloads always include `iso` and `timestamp` for lossless downstream integration.

### 5.4 Constraint Options Migration

In v2, `minDate`, `maxDate`, and `disabledDates` accept Jalali-coordinate objects:

```javascript
// v2:
minDate: { jy: 1402, jm: 1, jd: 1 }
```

In v3, these accept generic native coordinates, interpreted by the active engine:

```javascript
// v3 (proposed):
minDate: { year: 1402, month: 1, day: 1 }   // Jalali if calendar: 'jalali'
minDate: { year: 2023, month: 3, day: 21 }   // Gregorian if calendar: 'gregorian'

// v3 also accepts ISO strings (engine-independent):
minDate: '2023-03-21'   // Always Gregorian ISO
```

---

## 6. Migration Strategy

### 6.1 v2 Compatibility Layer

The v3 `PardisDatepicker` will implement the following compatibility guarantees:

**Zero-configuration upgrade:**

```javascript
// v2 code — works identically in v3:
new PardisDatepicker('#input')
// calendar defaults to 'jalali', locale defaults to 'fa-IR'
// All behavior is identical to v2.
```

**Old constraint object shapes:**

v3 will accept `{jy, jm, jd}` shaped objects in `minDate`, `maxDate`, and `disabledDates` and treat them as Jalali coordinates with a deprecation warning:

```
[PardisDatepicker] Deprecation: minDate uses { jy, jm, jd } keys.
Please migrate to { year, month, day }.
This form will be removed in v4.
```

**outputFormat option:**

The `outputFormat: 'jalali' | 'gregorian' | 'both'` option from v2 will be honored in v3 but deprecated. The v3 payload always includes both calendar representations and `iso`.

### 6.2 Breaking Change Classification

| Change | Classification | Mitigation |
|---|---|---|
| Internal state renamed `{jy,jm,jd}` → `{year,month,day}` | **Internal only** — not public API | No user impact |
| `minDate`/`maxDate` key names (`jy→year`) | **Soft breaking** — old keys accepted with warning | Deprecation warning |
| `PardisEngine.MIN_YEAR` / `MAX_YEAR` type change | **Internal only** | No user impact |
| `buildDatePayload()` signature change | **Internal only** | No user impact |
| `outputFormat` option deprecation | **Non-breaking deprecation** | Warning in console |
| `PardisEngine.MONTH_NAMES` static removal | **Internal only** | No user impact |

There are **no hard breaking changes** at the public API level in the v3 initial release. All breaking changes are scheduled for v4.

### 6.3 Recommended Upgrade Path

```
v2.x → v3.0 (drop-in upgrade, no code changes required)
v3.0 → v3.x (resolve deprecation warnings at own pace)
v3.x → v4.0 (remove deprecated {jy,jm,jd} usage; breaking cleanup)
```

---

## 7. Implementation Phases

### Phase 1 — Engine Abstraction Layer

**Scope:** Define the `CalendarEngine` interface. Create the internal scaffolding in `PardisEngine` that accepts an engine instance. Rename internal state from `{jy, jm, jd}` to `{year, month, day}` throughout. No behavior change; `PardisEngine` hardwires to `JalaliEngine`.

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — internal refactor
- `lib/pardis-jalali-datepicker.d.ts` — add `CalendarEngine` interface

**Risk:** Medium — pervasive renaming of internal fields. Requires comprehensive test coverage before merging.

---

### Phase 2 — JalaliEngine Adapter

**Scope:** Extract all `JalaaliUtil` call sites in `PardisEngine` into a concrete `JalaliEngine` class that implements `CalendarEngine`. `JalaaliUtil` itself is unchanged. `PardisEngine` delegates all calendar arithmetic to `this._engine`.

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — new `JalaliEngine` class

**Risk:** Low — this is a pure refactor. Behavior must be identical to v2.

---

### Phase 3 — GregorianEngine Implementation

**Scope:** Implement `GregorianEngine` using JavaScript's built-in `Date` for arithmetic. Support `calendar: 'gregorian'` option in `PardisDatepicker`. Add `en-US-gregorian` built-in locale.

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — new `GregorianEngine` class, option handling
- `lib/pardis-jalali-datepicker.d.ts` — update option types
- `lib/pardis-jalali-datepicker.css` — verify no Jalali assumptions in CSS

**Risk:** Medium — first non-Jalali code path. Requires validation of Gregorian-specific edge cases (Gregorian leap years, month 2 length, year 1900 etc.).

---

### Phase 4 — Renderer Synchronization

**Scope:** Update `PardisRenderer` to read generic `{year, month, day}` from day cell objects. Replace `data-jy / data-jm / data-jd` DOM attributes with `data-year / data-month / data-day`. Update event handlers accordingly.

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — `PardisRenderer` class

**Risk:** Low — purely internal. DOM attribute names are not documented as public API.

---

### Phase 5 — Input Mask Refactor

**Scope:** `PardisInputMask` currently assumes a fixed `YYYY/MM/DD` format. For Gregorian, the format may differ (`MM/DD/YYYY` for `en-US-gregorian`). The mask pattern must be engine-provided.

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — `PardisInputMask` class
- `lib/pardis-jalali-datepicker.d.ts` — input mask options

**Risk:** Medium — input mask behavior is user-facing. Regression testing is critical.

---

### Phase 6 — Documentation and Tests

**Scope:** Update all documentation. Write unit tests for both `JalaliEngine` and `GregorianEngine`. Write integration tests for the `calendar: 'gregorian'` path. Update TypeScript definitions. Publish `v3.0.0-beta`.

**Files affected:**
- All `docs/` files
- New `test/` files (engine unit tests)
- `lib/pardis-jalali-datepicker.d.ts`
- `README.md`, `CHANGELOG.md`

**Risk:** Low for documentation. Medium for test infrastructure (no test framework currently exists).

---

## 8. Risk and Complexity Assessment

### 8.1 Technical Risk

| Area | Risk Level | Notes |
|---|---|---|
| JalaliEngine extraction (Phase 2) | Low | Pure refactor, arithmetic unchanged |
| GregorianEngine correctness | Medium | Gregorian edge cases (Feb 29, year 100, etc.) |
| State renaming ({jy,jm,jd}) | Medium | Pervasive but mechanical |
| Input mask format abstraction | Medium | User-visible behavior |
| Backward compatibility | Low | Defaults preserve v2 behavior |
| CSS impact | Low | No calendar-specific CSS identified |
| Bundle size | Low — see below | GregorianEngine is small |

### 8.2 Refactor Scope

| Metric | Estimate |
|---|---|
| Lines of code affected | ~400–600 of ~1650 total |
| New code added | ~200–300 lines (engines + tests) |
| Public API changes | Additive only (one new option) |
| DOM API changes | Internal attributes only |

### 8.3 Bundle Size Impact

- `JalaliEngine`: ~0 bytes additional (extraction of existing `JalaaliUtil` calls)
- `GregorianEngine`: Estimated +1.5–2 kB minified (uses native `Date`, needs no math library)
- `CalendarEngine` interface: ~0 bytes at runtime (TypeScript types only)
- Total bundle size increase: **< 3 kB minified, < 1.5 kB gzip**

---

## 9. Decision Summary

| Question | Decision |
|---|---|
| Internal data model | Engine-native tuples + JDN for ordering |
| v2 backward compatibility | Full — calendar defaults to 'jalali' |
| New public option | `calendar: 'jalali' \| 'gregorian'` |
| Breaking changes in v3 | None (soft deprecations only) |
| Breaking changes in v4 | Remove `{jy,jm,jd}` key form in constraints |
| Estimated code impact | Medium (400–600 lines refactored) |
| Bundle size impact | Negligible (< 3 kB) |
| Recommended target version | **v3.0.0** |
| Complexity classification | **Moderate** — well-scoped refactor with low external risk |

---

*RFC authored 2026-02-27. Review and feedback welcome via GitHub Issues.*
*This document will be updated as the design evolves toward implementation.*

---

## 10. Implementation Status

| Component | Status | Notes |
|---|---|---|
| `CalendarEngine` interface | Completed | JSDoc contract in `lib/pardis-jalali-datepicker.js` |
| `JalaliEngine` class | Completed | Wraps `JalaaliUtil`, zero behavior change |
| `GregorianEngine` class | Completed | Pure JS, uses `Date` for DOW, custom JDN math |
| Gregorian built-in locales | Completed | `en-US-gregorian`, `fa-IR-gregorian` |
| `PardisEngine` engine delegation | Completed | All JalaaliUtil call sites replaced |
| `getDaysOfMonth()` generic cells | Completed | `year/month/day` canonical fields added |
| Renderer generic fields | Completed | `data-year/month/day` DOM attributes |
| Keyboard nav engine delegation | Completed | `_focusDayOffset` uses engine JDN |
| `PardisInputMask` engine-aware | Completed | Uses engine for month length validation |
| Deprecation warnings | Completed | `{jy,jm,jd}` constraint tuples warn once |
| TypeScript definitions | Completed | `CalendarType`, `calendar` option added |
| Tests | Completed | `scripts/gregorian-engine-test.js` (12 tests) |

**Implementation shipped in: v3.0.0**
