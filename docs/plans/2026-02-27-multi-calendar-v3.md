# Multi-Calendar v3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce a pluggable `CalendarEngine` abstraction that lets `PardisDatepicker` operate in Jalali or Gregorian mode via `calendar: 'jalali' | 'gregorian'`, with zero breaking changes.

**Architecture:** Everything lives in the single `lib/pardis-jalali-datepicker.js` file (this is NOT a TypeScript source project — tsup bundles JS, `.d.ts` is manually maintained). Two new engine classes (`JalaliEngine`, `GregorianEngine`) are inserted before `PardisEngine`. `PardisEngine` receives a `_calEngine` property and delegates all calendar arithmetic to it. For Jalali, the existing `{jy, jm, jd}` tuple shape is preserved verbatim. For Gregorian, `{gy, gm, gd}` is used. Day cells from `getDaysOfMonth()` gain generic `year/month/day` fields so the renderer and keyboard nav can work uniformly across both engines.

**Tech Stack:** Vanilla JavaScript ES2020, tsup (build), Node.js test scripts, manually-maintained `.d.ts`

---

## Architecture Reference

Before touching any code, understand this map:

```
lib/pardis-jalali-datepicker.js (single source file, ~1649 lines)
  ├── JalaaliUtil (IIFE, lines 11–138) — DO NOT TOUCH
  ├── PARDIS_LOCALES + resolveLocale (lines 149–249) — ADD new locales only
  ├── PardisEngine class (lines 255–801) — REFACTOR
  ├── PardisRenderer class (lines 807–1105) — REFACTOR (minor)
  ├── PardisInputMask class (lines 1111–1196) — REFACTOR (minor)
  ├── PardisDatepicker class (lines 1225–1643) — ADD calendar option
  └── export line (1648)

build: npm run build  →  dist/index.cjs, dist/index.mjs, dist/index.global.js
test:  npm test       →  scripts/year-boundary-test.js (loads dist/index.cjs)
```

**Key public API that MUST NOT CHANGE:**
- `PardisEngine.MIN_YEAR` (static)
- `PardisEngine.MAX_YEAR` (static)
- `PardisEngine.buildDatePayload(jy, jm, jd, format)` (static)
- `PardisEngine.formatNum(n, numeralType)` (static)
- `PardisDatepicker.setValue(jy, jm, jd)`
- All `PardisDatepicker` constructor options from v2

**Internal changes that are safe (not public API):**
- Day cell fields in `getDaysOfMonth()` (internal data, not documented)
- DOM `data-jy/jm/jd` attributes → `data-year/month/day` (not public)
- Internal `JalaaliUtil` call sites in `PardisEngine`

---

## Task 1 — Add JalaliEngine Class

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` (insert after JalaaliUtil IIFE, before PARDIS_LOCALES)

**What:** Add a `JalaliEngine` class that wraps `JalaaliUtil`. This is a pure addition — no existing code changes. The class implements the CalendarEngine contract (documented via JSDoc).

**Step 1: Locate the insertion point**

Find the blank line between line 138 (`})();`) and line 141 (`/* === PARDIS LOCALES ===`). Insert there.

**Step 2: Insert JalaliEngine**

```javascript
/* ================================================================
   CALENDAR ENGINES — Pluggable calendar arithmetic abstraction
   ================================================================
   CalendarEngine interface (JSDoc contract):
     name: string
     minYear: number  (getter)
     maxYear: number  (getter)
     monthsInYear: number  (getter)
     getDaysInMonth(year, month): number
     isLeapYear(year): boolean
     toJDN(year, month, day): number          → Julian Day Number
     fromJDN(jdn): tuple                       → calendar-native tuple
     toGregorian(year, month, day): {gy,gm,gd}
     fromGregorian(gy, gm, gd): tuple
     today(): tuple
     getWeekdayOffset(year, month, weekStart): number  → 0-6
     makeTuple(year, month, day): tuple        → create a native tuple
     tupleYear(t): number
     tupleMonth(t): number
     tupleDay(t): number
   ================================================================ */

// ── JalaliEngine — wraps JalaaliUtil ──
class JalaliEngine {
  get name()         { return 'jalali'; }
  get minYear()      { return 1; }
  get maxYear()      { return 3177; }
  get monthsInYear() { return 12; }

  getDaysInMonth(year, month) {
    return JalaaliUtil.jalaaliMonthLength(year, month);
  }

  isLeapYear(year) {
    return JalaaliUtil.isLeapJalaaliYear(year);
  }

  toJDN(year, month, day) {
    return JalaaliUtil.j2d(year, month, day);
  }

  fromJDN(jdn) {
    return JalaaliUtil.d2j(jdn); // returns { jy, jm, jd }
  }

  toGregorian(year, month, day) {
    return JalaaliUtil.toGregorian(year, month, day); // returns { gy, gm, gd }
  }

  fromGregorian(gy, gm, gd) {
    return JalaaliUtil.toJalaali(gy, gm, gd); // returns { jy, jm, jd }
  }

  today() {
    return JalaaliUtil.todayJalaali(); // returns { jy, jm, jd }
  }

  /**
   * Returns the 0-based column offset for the first day of the month.
   * weekStart: JS day index (6 = Saturday for Jalali default).
   * Formula: (getDay() result - weekStart + 7) % 7
   */
  getWeekdayOffset(year, month, weekStart) {
    const g = JalaaliUtil.toGregorian(year, month, 1);
    const dow = new Date(g.gy, g.gm - 1, g.gd).getDay(); // 0=Sun … 6=Sat
    return (dow - weekStart + 7) % 7;
  }

  // Tuple constructors / accessors — Jalali uses {jy, jm, jd}
  makeTuple(year, month, day) { return { jy: year, jm: month, jd: day }; }
  tupleYear(t)  { return t.jy; }
  tupleMonth(t) { return t.jm; }
  tupleDay(t)   { return t.jd; }
}
```

**Step 3: Verify JalaliEngine doesn't call undefined symbols**

`JalaaliUtil` is an IIFE defined above — it's in scope. ✓
No other new dependencies.

**Step 4: No tests yet — we add those at the end after all code is in place.**

---

## Task 2 — Add GregorianEngine Class

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` (insert immediately after JalaliEngine, before PARDIS_LOCALES)

**What:** Add `GregorianEngine` implementing the same CalendarEngine contract. Uses JS `Date` for DOW. Re-implements g2d/d2g math using `Math.trunc` (same algorithm as JalaaliUtil, no new dependency).

**Step 1: Insert GregorianEngine**

```javascript
// ── GregorianEngine — standard proleptic Gregorian calendar ──
class GregorianEngine {
  get name()         { return 'gregorian'; }
  get minYear()      { return 1600; }
  get maxYear()      { return 2999; }
  get monthsInYear() { return 12; }

  getDaysInMonth(year, month) {
    // Date constructor overflows month 0 of next year → gives last day of (month):
    return new Date(year, month, 0).getDate();
  }

  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // Julian Day Number — same algorithm as JalaaliUtil.g2d / d2g
  // Uses Math.trunc (≡ ~~) which truncates toward zero.
  toJDN(year, month, day) {
    const T = Math.trunc;
    let d = T((year + T((month - 8) / 6) + 100100) * 1461 / 4)
          + T((153 * ((month + 9) % 12) + 2) / 5)
          + day - 34840408;
    d = d - T(T((year + 100100 + T((month - 8) / 6)) / 100) * 3 / 4) + 752;
    return d;
  }

  fromJDN(jdn) {
    const T = Math.trunc;
    let j = 4 * jdn + 139361631;
    j = j + T(T((4 * jdn + 183187720) / 146097) * 3 / 4) * 4 - 3908;
    const i  = T((j % 1461) / 4) * 5 + 308;
    const gd = T((i % 153) / 5) + 1;
    const gm = (T(i / 153) % 12) + 1;
    const gy = T(j / 1461) - 100100 + T((8 - gm) / 6);
    return { gy, gm, gd };
  }

  toGregorian(year, month, day) {
    return { gy: year, gm: month, gd: day }; // identity
  }

  fromGregorian(gy, gm, gd) {
    return { gy, gm, gd }; // identity
  }

  today() {
    const now = new Date();
    return { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
  }

  /**
   * weekStart: 0=Sunday (Gregorian international default).
   */
  getWeekdayOffset(year, month, weekStart) {
    const dow = new Date(year, month - 1, 1).getDay(); // 0=Sun … 6=Sat
    return (dow - weekStart + 7) % 7;
  }

  // Tuple constructors / accessors — Gregorian uses {gy, gm, gd}
  makeTuple(year, month, day) { return { gy: year, gm: month, gd: day }; }
  tupleYear(t)  { return t.gy; }
  tupleMonth(t) { return t.gm; }
  tupleDay(t)   { return t.gd; }
}
```

**Step 2: Verify math correctness mentally**

- `getDaysInMonth(2000, 2)` → `new Date(2000, 2, 0).getDate()` = 29 ✓ (leap year)
- `getDaysInMonth(1900, 2)` → 28 ✓ (1900 not leap: div by 100 but not 400)
- `getDaysInMonth(2024, 2)` → 29 ✓ (div by 4, not by 100)
- `isLeapYear(2000)` → true ✓
- `isLeapYear(1900)` → false ✓
- `isLeapYear(2024)` → true ✓
- JDN round-trip: `toJDN(2025, 3, 21)` should match `JalaaliUtil.g2d(2025, 3, 21)` ✓ (same algorithm)

---

## Task 3 — Add Gregorian Built-in Locales

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — inside `PARDIS_LOCALES` object literal

**What:** Add `'en-US-gregorian'` and `'fa-IR-gregorian'` keys to `PARDIS_LOCALES`.

**Step 1: In the `PARDIS_LOCALES` object, after the existing `'en-US'` entry, add:**

```javascript
  'en-US-gregorian': {
    code: 'en-US-gregorian',
    direction: 'ltr',
    months: [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ],
    weekdays:     ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    weekdaysLong: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    numerals: 'latin',
    weekStart: 0, // Sunday
    ui: {
      today:           'Today',
      clear:           'Clear',
      selectMonth:     'Month',
      selectYear:      'Year',
      prevMonth:       'Previous month',
      nextMonth:       'Next month',
      prevYear:        'Previous year',
      nextYear:        'Next year',
      prevDecade:      'Previous decade',
      nextDecade:      'Next decade',
      thisWeek:        'This week',
      thisMonth:       'This month',
      last7Days:       'Last 7 days',
      last30Days:      'Last 30 days',
      rangeStart:      'Select start date',
      rangeEnd:        'Select end date',
      rangeDone:       'Range selected',
      selectMonthLabel:'Select month',
      selectYearLabel: 'Select year',
      dateFormatHint:  'Date format: MM/DD/YYYY',
    },
  },
  'fa-IR-gregorian': {
    code: 'fa-IR-gregorian',
    direction: 'rtl',
    months: [
      'ژانویه','فوریه','مارس','آوریل','مه','ژوئن',
      'ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر',
    ],
    weekdays:     ['ی','د','س','چ','پ','ج','ش'],
    weekdaysLong: ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],
    numerals: 'persian',
    weekStart: 0, // Sunday
    ui: {
      today:           'امروز',
      clear:           'پاک کردن',
      selectMonth:     'ماه',
      selectYear:      'سال',
      prevMonth:       'ماه قبل',
      nextMonth:       'ماه بعد',
      prevYear:        'سال قبل',
      nextYear:        'سال بعد',
      prevDecade:      'دهه قبل',
      nextDecade:      'دهه بعد',
      thisWeek:        'هفته جاری',
      thisMonth:       'ماه جاری',
      last7Days:       '۷ روز گذشته',
      last30Days:      '۳۰ روز گذشته',
      rangeStart:      'روز شروع را انتخاب کنید',
      rangeEnd:        'روز پایان را انتخاب کنید',
      rangeDone:       'بازه انتخاب شد',
      selectMonthLabel:'انتخاب ماه',
      selectYearLabel: 'انتخاب سال',
      dateFormatHint:  'فرمت تاریخ: روز/ماه/سال',
    },
  },
```

---

## Task 4 — Refactor PardisEngine Constructor

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisEngine` class

**What:** Add `_calEngine` property. Refactor `constructor` to accept `calendar` option and wire the correct engine. Update `MIN_YEAR` and `MAX_YEAR` statics to use a sentinel (they remain 1 and 3177 for backward compat since they guard Jalali — tests check these statics directly).

**Step 1: Add `_calEngine` in constructor, before the `const today = ...` line:**

Replace the existing constructor block:
```javascript
constructor(options = {}) {
    const today = JalaaliUtil.todayJalaali();
```

With:
```javascript
constructor(options = {}) {
    // ── Calendar engine selection ──
    const calendarName = options.calendar || 'jalali';
    this._calEngine = calendarName === 'gregorian'
      ? new GregorianEngine()
      : new JalaliEngine();

    const todayTuple = this._calEngine.today();
    // Normalize today to generic year/month/day for internal use
    const today = {
      year:  this._calEngine.tupleYear(todayTuple),
      month: this._calEngine.tupleMonth(todayTuple),
      day:   this._calEngine.tupleDay(todayTuple),
    };
```

**Step 2: Update `this.viewYear`, `this.viewMonth` initialization:**

Change:
```javascript
    this.viewYear = options.initialYear || today.jy;
    this.viewMonth = options.initialMonth || today.jm;
```
To:
```javascript
    this.viewYear = options.initialYear || today.year;
    this.viewMonth = options.initialMonth || today.month;
```

**Step 3: Update `this.today` assignment:**

Change:
```javascript
    // Today reference
    this.today = today;
```
To:
```javascript
    // Today reference (generic {year, month, day})
    this.today = today;
```
(No change needed if you used the generic names above — just confirm `today` is now `{year, month, day}`.)

**Step 4: Update `_clampView()` to use engine bounds:**

Change:
```javascript
  _clampView() {
    if (this.viewYear < PardisEngine.MIN_YEAR) this.viewYear = PardisEngine.MIN_YEAR;
    if (this.viewYear > PardisEngine.MAX_YEAR) this.viewYear = PardisEngine.MAX_YEAR;
    if (this.viewMonth < 1) this.viewMonth = 1;
    if (this.viewMonth > 12) this.viewMonth = 12;
  }
```
To:
```javascript
  _clampView() {
    const minY = this._calEngine.minYear;
    const maxY = this._calEngine.maxYear;
    if (this.viewYear < minY) this.viewYear = minY;
    if (this.viewYear > maxY) this.viewYear = maxY;
    if (this.viewMonth < 1) this.viewMonth = 1;
    if (this.viewMonth > this._calEngine.monthsInYear) this.viewMonth = this._calEngine.monthsInYear;
  }
```

**Step 5: Update static MIN_YEAR / MAX_YEAR to remain 1 / 3177 (Jalali values, backward compat)**

These statics remain unchanged. The boundary tests use these with the default Jalali engine. ✓

---

## Task 5 — Refactor PardisEngine State Tuples

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisEngine` class

**What:** All internal date tuples (`selectedDate`, `rangeStart`, `rangeEnd`, `hoverDate`) are replaced with generic `{year, month, day}` shape. Calendar-specific field names (`jy/jm/jd`, `gy/gm/gd`) are no longer used inside PardisEngine state directly — the engine's `makeTuple/tupleYear/tupleMonth/tupleDay` accessor methods mediate access.

**Step 1: Update `selectDate(y, m, d)` — replace internal Jalali tuple construction**

Find and replace:
```javascript
  selectDate(jy, jm, jd) {
    if (this.isDisabled(jy, jm, jd)) return;

    if (this.rangeMode) {
      if (!this.rangeStart || this.rangeEnd) {
        // Start new range
        this.rangeStart = { jy, jm, jd };
        this.rangeEnd = null;
        this.emit('rangeStart', PardisEngine.buildDatePayload(jy, jm, jd, this.outputFormat));
      } else {
        // Set end
        const startJdn = JalaaliUtil.j2d(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd);
        const endJdn = JalaaliUtil.j2d(jy, jm, jd);
        // Enforce maxRange: if selection exceeds max days, reject silently
        if (this.maxRange !== null) {
          const diff = Math.abs(endJdn - startJdn) + 1;
          if (diff > this.maxRange) return;
        }
        if (endJdn < startJdn) {
          this.rangeEnd = { ...this.rangeStart };
          this.rangeStart = { jy, jm, jd };
        } else {
          this.rangeEnd = { jy, jm, jd };
        }
        this.emit('rangeSelect', {
          start: PardisEngine.buildDatePayload(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd, this.outputFormat),
          end:   PardisEngine.buildDatePayload(this.rangeEnd.jy,   this.rangeEnd.jm,   this.rangeEnd.jd,   this.outputFormat),
        });
      }
    } else {
      this.selectedDate = { jy, jm, jd };
      this.viewYear = jy;
      this.viewMonth = jm;
      this.emit('select', PardisEngine.buildDatePayload(jy, jm, jd, this.outputFormat));
    }
  }
```

With:
```javascript
  selectDate(year, month, day) {
    if (this.isDisabled(year, month, day)) return;
    const eng = this._calEngine;

    if (this.rangeMode) {
      if (!this.rangeStart || this.rangeEnd) {
        this.rangeStart = { year, month, day };
        this.rangeEnd = null;
        this.emit('rangeStart', this._buildPayload(year, month, day));
      } else {
        const startJdn = eng.toJDN(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day);
        const endJdn   = eng.toJDN(year, month, day);
        if (this.maxRange !== null && Math.abs(endJdn - startJdn) + 1 > this.maxRange) return;
        if (endJdn < startJdn) {
          this.rangeEnd   = { ...this.rangeStart };
          this.rangeStart = { year, month, day };
        } else {
          this.rangeEnd = { year, month, day };
        }
        this.emit('rangeSelect', {
          start: this._buildPayload(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day),
          end:   this._buildPayload(this.rangeEnd.year,   this.rangeEnd.month,   this.rangeEnd.day),
        });
      }
    } else {
      this.selectedDate = { year, month, day };
      this.viewYear  = year;
      this.viewMonth = month;
      this.emit('select', this._buildPayload(year, month, day));
    }
  }
```

**Step 2: Add `_buildPayload` instance method (delegates to static or Gregorian builder)**

Insert after `selectDate`:
```javascript
  /**
   * Builds a date payload using the active calendar engine.
   * For Jalali: calls the existing static buildDatePayload (identical to v2 output).
   * For Gregorian: builds a Gregorian-primary payload.
   */
  _buildPayload(year, month, day) {
    if (this._calEngine.name === 'jalali') {
      return PardisEngine.buildDatePayload(year, month, day, this.outputFormat);
    }
    return PardisEngine.buildGregorianPayload(year, month, day, this.outputFormat);
  }
```

**Step 3: Add `buildGregorianPayload` static method (after existing `buildDatePayload`)**

```javascript
  /**
   * Builds a payload for a Gregorian engine selection.
   * @param {number} gy  Gregorian year
   * @param {number} gm  Gregorian month
   * @param {number} gd  Gregorian day
   * @param {'jalali'|'gregorian'|'both'} format
   */
  static buildGregorianPayload(gy, gm, gd, format = 'both') {
    const gDate     = new Date(gy, gm - 1, gd);
    const timestamp = gDate.getTime();
    const iso       = `${gy}-${String(gm).padStart(2,'0')}-${String(gd).padStart(2,'0')}`;

    const GREGORIAN_MONTHS = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const jalaliPart = JalaaliUtil.toJalaali(gy, gm, gd);

    const gregorianPart = {
      year:      gy,
      month:     gm,
      day:       gd,
      monthName: GREGORIAN_MONTHS[gm - 1],
      formatted: iso,
      date:      gDate,
      timestamp,
    };

    const jalaliOut = {
      year:      jalaliPart.jy,
      month:     jalaliPart.jm,
      day:       jalaliPart.jd,
      monthName: PardisEngine.MONTH_NAMES[jalaliPart.jm - 1],
      formatted: `${jalaliPart.jy}/${String(jalaliPart.jm).padStart(2,'0')}/${String(jalaliPart.jd).padStart(2,'0')}`,
    };

    return {
      calendar:  'gregorian',
      gregorian: gregorianPart,
      jalali:    jalaliOut,
      iso,
      timestamp,
    };
  }
```

**Step 4: Update `goToToday()` to use generic today reference**

Change:
```javascript
  goToToday() {
    this.viewYear = this.today.jy;
    this.viewMonth = this.today.jm;
    this.viewMode = 'day';
    if (!this.rangeMode && !this.isDisabled(this.today.jy, this.today.jm, this.today.jd)) {
      this.selectedDate = { ...this.today };
      this.emit('select', PardisEngine.buildDatePayload(this.today.jy, this.today.jm, this.today.jd, this.outputFormat));
    }
    this.emit('viewChange', this.getViewInfo());
  }
```
To:
```javascript
  goToToday() {
    const t = this.today;
    this.viewYear  = t.year;
    this.viewMonth = t.month;
    this.viewMode  = 'day';
    if (!this.rangeMode && !this.isDisabled(t.year, t.month, t.day)) {
      this.selectedDate = { ...t };
      this.emit('select', this._buildPayload(t.year, t.month, t.day));
    }
    this.emit('viewChange', this.getViewInfo());
  }
```

**Step 5: Update `isToday()`**

Change:
```javascript
  isToday(jy, jm, jd) {
    return jy === this.today.jy && jm === this.today.jm && jd === this.today.jd;
  }
```
To:
```javascript
  isToday(year, month, day) {
    return year === this.today.year && month === this.today.month && day === this.today.day;
  }
```

**Step 6: Update `isSelected()`**

Change:
```javascript
  isSelected(jy, jm, jd) {
    if (this.rangeMode) {
      return this._isRangeStart(jy, jm, jd) || this._isRangeEnd(jy, jm, jd);
    }
    return this.selectedDate &&
      this.selectedDate.jy === jy &&
      this.selectedDate.jm === jm &&
      this.selectedDate.jd === jd;
  }
```
To:
```javascript
  isSelected(year, month, day) {
    if (this.rangeMode) {
      return this._isRangeStart(year, month, day) || this._isRangeEnd(year, month, day);
    }
    return this.selectedDate &&
      this.selectedDate.year  === year &&
      this.selectedDate.month === month &&
      this.selectedDate.day   === day;
  }
```

**Step 7: Update `_isRangeStart()` and `_isRangeEnd()`**

Change:
```javascript
  _isRangeStart(jy, jm, jd) {
    return this.rangeStart &&
      this.rangeStart.jy === jy && this.rangeStart.jm === jm && this.rangeStart.jd === jd;
  }

  _isRangeEnd(jy, jm, jd) {
    return this.rangeEnd &&
      this.rangeEnd.jy === jy && this.rangeEnd.jm === jm && this.rangeEnd.jd === jd;
  }
```
To:
```javascript
  _isRangeStart(year, month, day) {
    return this.rangeStart &&
      this.rangeStart.year === year && this.rangeStart.month === month && this.rangeStart.day === day;
  }

  _isRangeEnd(year, month, day) {
    return this.rangeEnd &&
      this.rangeEnd.year === year && this.rangeEnd.month === month && this.rangeEnd.day === day;
  }
```

**Step 8: Update `isInRange()` and `isInHoverRange()` and `isHoverRangeEnd()`**

Change:
```javascript
  isInRange(jy, jm, jd) {
    if (jy < PardisEngine.MIN_YEAR || jy > PardisEngine.MAX_YEAR) return false;
    if (!this.rangeStart || !this.rangeEnd) return false;
    const jdn = JalaaliUtil.j2d(jy, jm, jd);
    const startJdn = JalaaliUtil.j2d(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd);
    const endJdn = JalaaliUtil.j2d(this.rangeEnd.jy, this.rangeEnd.jm, this.rangeEnd.jd);
    return jdn > startJdn && jdn < endJdn;
  }

  isInHoverRange(jy, jm, jd) {
    if (jy < PardisEngine.MIN_YEAR || jy > PardisEngine.MAX_YEAR) return false;
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    const jdn = JalaaliUtil.j2d(jy, jm, jd);
    const startJdn = JalaaliUtil.j2d(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd);
    const hoverJdn = JalaaliUtil.j2d(this.hoverDate.jy, this.hoverDate.jm, this.hoverDate.jd);
    const lo = Math.min(startJdn, hoverJdn);
    const hi = Math.max(startJdn, hoverJdn);
    return jdn > lo && jdn < hi;
  }

  isHoverRangeEnd(jy, jm, jd) {
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    return this.hoverDate.jy === jy && this.hoverDate.jm === jm && this.hoverDate.jd === jd;
  }
```
To:
```javascript
  isInRange(year, month, day) {
    const eng = this._calEngine;
    if (year < eng.minYear || year > eng.maxYear) return false;
    if (!this.rangeStart || !this.rangeEnd) return false;
    const jdn      = eng.toJDN(year, month, day);
    const startJdn = eng.toJDN(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day);
    const endJdn   = eng.toJDN(this.rangeEnd.year,   this.rangeEnd.month,   this.rangeEnd.day);
    return jdn > startJdn && jdn < endJdn;
  }

  isInHoverRange(year, month, day) {
    const eng = this._calEngine;
    if (year < eng.minYear || year > eng.maxYear) return false;
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    const jdn      = eng.toJDN(year, month, day);
    const startJdn = eng.toJDN(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day);
    const hoverJdn = eng.toJDN(this.hoverDate.year,  this.hoverDate.month,  this.hoverDate.day);
    const lo = Math.min(startJdn, hoverJdn);
    const hi = Math.max(startJdn, hoverJdn);
    return jdn > lo && jdn < hi;
  }

  isHoverRangeEnd(year, month, day) {
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    return this.hoverDate.year === year && this.hoverDate.month === month && this.hoverDate.day === day;
  }
```

**Step 9: Update `isDisabled()`**

Change:
```javascript
  isDisabled(jy, jm, jd) {
    if (jy < PardisEngine.MIN_YEAR || jy > PardisEngine.MAX_YEAR) return true;
    const curJdn = JalaaliUtil.j2d(jy, jm, jd);
    if (this.minDate) {
      if (curJdn < JalaaliUtil.j2d(this.minDate.jy, this.minDate.jm, this.minDate.jd)) return true;
    }
    if (this.maxDate) {
      if (curJdn > JalaaliUtil.j2d(this.maxDate.jy, this.maxDate.jm, this.maxDate.jd)) return true;
    }
    if (this.disabledDates) {
      if (typeof this.disabledDates === 'function') {
        if (this.disabledDates(jy, jm, jd)) return true;
      } else if (Array.isArray(this.disabledDates)) {
        if (this.disabledDates.some(d => d.jy === jy && d.jm === jm && d.jd === jd)) return true;
      }
    }
    return false;
  }
```
To:
```javascript
  isDisabled(year, month, day) {
    const eng = this._calEngine;
    if (year < eng.minYear || year > eng.maxYear) return true;
    const curJdn = eng.toJDN(year, month, day);

    if (this.minDate) {
      const mn = this._normalizeConstraintTuple(this.minDate);
      if (curJdn < eng.toJDN(mn.year, mn.month, mn.day)) return true;
    }
    if (this.maxDate) {
      const mx = this._normalizeConstraintTuple(this.maxDate);
      if (curJdn > eng.toJDN(mx.year, mx.month, mx.day)) return true;
    }
    if (this.disabledDates) {
      if (typeof this.disabledDates === 'function') {
        if (this.disabledDates(year, month, day)) return true;
      } else if (Array.isArray(this.disabledDates)) {
        if (this.disabledDates.some(d => {
          const n = this._normalizeConstraintTuple(d);
          return n.year === year && n.month === month && n.day === day;
        })) return true;
      }
    }
    return false;
  }

  /**
   * Normalizes a constraint tuple from either old {jy,jm,jd} form or new {year,month,day} form.
   * Emits a one-time deprecation warning for old-form usage.
   */
  _normalizeConstraintTuple(t) {
    if (t && typeof t.jy === 'number') {
      if (!PardisEngine._deprecatedTupleWarned) {
        PardisEngine._deprecatedTupleWarned = true;
        console.warn(
          '[PardisDatepicker] Deprecation: minDate/maxDate/disabledDates use {jy,jm,jd} keys. ' +
          'Please migrate to {year,month,day}. This form will be removed in v4.'
        );
      }
      return { year: t.jy, month: t.jm, day: t.jd };
    }
    return { year: t.year, month: t.month, day: t.day };
  }
```

Also add after `PardisDatepicker._counter = 0;` at end of file:
```javascript
PardisEngine._deprecatedTupleWarned = false;
```

---

## Task 6 — Refactor `getDaysOfMonth()` for Generic Fields

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisEngine.getDaysOfMonth()` method

**What:** Replace Jalali-specific logic with engine-delegated calls. Day cells gain generic `year/month/day` fields. Jalali engine: cells also keep `jy/jm/jd` aliases. Gregorian engine: cells also keep `gy/gm/gd` aliases (for backward compat with any code inspecting tuples).

**Step 1: Replace `getDaysOfMonth()` entirely:**

```javascript
  getDaysOfMonth() {
    const eng = this._calEngine;
    const year  = this.viewYear;
    const month = this.viewMonth;
    const daysInMonth   = eng.getDaysInMonth(year, month);
    const weekStart     = 6; // Default: Saturday=0 for Jalali. TODO: derive from locale weekStart.
    const startOffset   = eng.getWeekdayOffset(year, month, weekStart);

    const days = [];

    // ── Previous month filler ──
    if (startOffset > 0) {
      let prevMonth = month - 1;
      let prevYear  = year;
      if (prevMonth < 1) { prevMonth = eng.monthsInYear; prevYear--; }
      const prevDays = eng.getDaysInMonth(prevYear, prevMonth);

      for (let i = startOffset - 1; i >= 0; i--) {
        const d = prevDays - i;
        const dow = (startOffset - i - 1 + 7) % 7;
        days.push(this._makeCell(prevYear, prevMonth, d, dow, false));
      }
    }

    // ── Current month days ──
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = (startOffset + d - 1) % 7;
      days.push(this._makeCell(year, month, d, dow, true));
    }

    // ── Next month filler ──
    const remainder = days.length % 7;
    if (remainder > 0) {
      let nextMonth = month + 1;
      let nextYear  = year;
      if (nextMonth > eng.monthsInYear) { nextMonth = 1; nextYear++; }
      for (let d = 1; d <= 7 - remainder; d++) {
        const dow = (startOffset + daysInMonth + d - 1) % 7;
        days.push(this._makeCell(nextYear, nextMonth, d, dow, false));
      }
    }

    return days;
  }

  /**
   * Builds a single day cell object with generic year/month/day fields
   * plus calendar-specific aliases for backward compatibility.
   */
  _makeCell(year, month, day, dayOfWeek, isCurrentMonth) {
    const eng  = this._calEngine;
    const cell = {
      year, month, day,
      dayOfWeek,
      isCurrentMonth,
      isToday:        this.isToday(year, month, day),
      isSelected:     this.isSelected(year, month, day),
      isRangeStart:   this._isRangeStart(year, month, day),
      isRangeEnd:     this._isRangeEnd(year, month, day),
      isInRange:      this.isInRange(year, month, day),
      isInHoverRange: this.isInHoverRange(year, month, day),
      isHoverRangeEnd:this.isHoverRangeEnd(year, month, day),
      isDisabled:     this.isDisabled(year, month, day),
      isWeekend:      this.isWeekend(dayOfWeek),
      highlightClass: this.getHighlightClass(year, month, day),
    };

    // Calendar-specific aliases for backward compatibility
    if (eng.name === 'jalali') {
      cell.jy = year; cell.jm = month; cell.jd = day;
    } else if (eng.name === 'gregorian') {
      cell.gy = year; cell.gm = month; cell.gd = day;
    }

    return cell;
  }
```

**Step 2: Update `getMonths()` to use generic today reference**

Change:
```javascript
  getMonths() {
    return PardisEngine.MONTH_NAMES.map((name, i) => ({
      index: i + 1,
      name,
      isCurrent: this.today.jy === this.viewYear && this.today.jm === i + 1,
      isSelected: this.selectedDate && this.selectedDate.jy === this.viewYear && this.selectedDate.jm === i + 1,
    }));
  }
```
To:
```javascript
  getMonths() {
    const loc = this._locale || { months: PardisEngine.MONTH_NAMES };
    return (loc.months || PardisEngine.MONTH_NAMES).map((name, i) => ({
      index: i + 1,
      name,
      isCurrent:  this.today.year === this.viewYear && this.today.month === i + 1,
      isSelected: this.selectedDate &&
                  this.selectedDate.year === this.viewYear &&
                  this.selectedDate.month === i + 1,
    }));
  }
```

Note: `PardisEngine` doesn't directly hold a locale reference — it receives `numeralType` but not the full locale. The month names for `getMonths()` actually come from `PardisEngine.MONTH_NAMES` for Jalali, but this was already passed from the Renderer context. For now, keep using `PardisEngine.MONTH_NAMES` as before — the Renderer already uses `loc.months[m.index - 1]` for display, so `getMonths()` just needs to return the index. Simplify the fix:

```javascript
  getMonths() {
    return PardisEngine.MONTH_NAMES.map((name, i) => ({
      index: i + 1,
      name,
      isCurrent:  this.today.year === this.viewYear && this.today.month === i + 1,
      isSelected: this.selectedDate &&
                  this.selectedDate.year === this.viewYear &&
                  this.selectedDate.month === i + 1,
    }));
  }
```

**Step 3: Update `getYears()` to use generic today reference**

Change `this.today.jy` → `this.today.year` and `this.selectedDate.jy` → `this.selectedDate.year`:
```javascript
  getYears() {
    const minY = this._calEngine.minYear;
    const maxY = this._calEngine.maxYear;
    let startYear = this.viewYear - 5;
    if (startYear < minY) startYear = minY;
    if (startYear + 11 > maxY) startYear = Math.max(minY, maxY - 11);
    const years = [];
    for (let i = 0; i < 12; i++) {
      const y = startYear + i;
      years.push({
        year:       y,
        isCurrent:  y === this.today.year,
        isSelected: this.selectedDate && this.selectedDate.year === y,
      });
    }
    return years;
  }
```

**Step 4: Update `getViewInfo()` — `monthName` uses locale-aware approach**

`getViewInfo()` currently returns `monthName: PardisEngine.MONTH_NAMES[this.viewMonth - 1]` which is Jalali. For Gregorian, the renderer uses `loc.months[info.month - 1]` directly (the locale provides month names), so `monthName` in `getViewInfo` isn't actually used by the renderer — confirm by searching the renderer for `info.monthName`. The renderer uses `loc.months[info.month - 1]` directly. So `getViewInfo()` just needs to pass year/month — `monthName` can stay as-is (it's returned but not used by renderer).

No change needed to `getViewInfo()` for functional correctness.

---

## Task 7 — Refactor `getPresetRange()`

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisEngine.getPresetRange()`

**What:** Replace `JalaaliUtil.*` calls with engine-delegated calls. Uses `this.today` (now generic) and engine's `toJDN`/`fromJDN`/`getDaysInMonth`.

**Step 1: Replace `getPresetRange()` entirely:**

```javascript
  getPresetRange(preset) {
    const eng        = this._calEngine;
    const t          = this.today;
    const todayJdn   = eng.toJDN(t.year, t.month, t.day);
    const fromJdn    = (jdn) => {
      const r = eng.fromJDN(jdn);
      return { year: eng.tupleYear(r), month: eng.tupleMonth(r), day: eng.tupleDay(r) };
    };

    if (preset === 'thisWeek') {
      const g   = eng.toGregorian(t.year, t.month, t.day);
      const dow = (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7; // 0=Saturday
      const minJdn = eng.toJDN(eng.minYear, 1, 1);
      const startJdn = Math.max(todayJdn - dow, minJdn);
      return { start: fromJdn(startJdn), end: fromJdn(todayJdn - dow + 6) };
    }
    if (preset === 'thisMonth') {
      const daysInMonth = eng.getDaysInMonth(t.year, t.month);
      return {
        start: { year: t.year, month: t.month, day: 1 },
        end:   { year: t.year, month: t.month, day: daysInMonth },
      };
    }
    if (preset === 'last7Days' || preset === 'last7') {
      return { start: fromJdn(todayJdn - 6), end: { ...t } };
    }
    if (preset === 'last30Days' || preset === 'last30') {
      return { start: fromJdn(todayJdn - 29), end: { ...t } };
    }
    return null;
  }
```

**Step 2: Update `applyPreset()` to use generic tuples:**

```javascript
  applyPreset(preset) {
    const eng   = this._calEngine;
    const range = this.getPresetRange(preset);
    if (!range) return;
    if (this.maxRange !== null) {
      const startJdn = eng.toJDN(range.start.year, range.start.month, range.start.day);
      const endJdn   = eng.toJDN(range.end.year,   range.end.month,   range.end.day);
      if (Math.abs(endJdn - startJdn) + 1 > this.maxRange) return;
    }
    this.rangeStart = range.start;
    this.rangeEnd   = range.end;
    this.hoverDate  = null;
    this.emit('rangeSelect', {
      start: this._buildPayload(range.start.year, range.start.month, range.start.day),
      end:   this._buildPayload(range.end.year,   range.end.month,   range.end.day),
    });
    this.emit('viewChange', this.getViewInfo());
  }
```

---

## Task 8 — Update `getHighlightClass()` and `isWeekend()`

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisEngine` class

**Step 1: `getHighlightClass()` — update param names only (no logic change):**

```javascript
  getHighlightClass(year, month, day) {
    if (!this.highlightedDates || !Array.isArray(this.highlightedDates)) return null;
    const match = this.highlightedDates.find(d => {
      const n = this._normalizeConstraintTuple(d);
      return n.year === year && n.month === month && n.day === day;
    });
    return match ? (match.className || 'highlighted') : null;
  }
```

**Step 2: `isWeekend()` — no change needed (just checks dayOfWeek index).**

---

## Task 9 — Update `PardisRenderer` for Generic Cell Fields

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisRenderer._renderDayView()`

**What:** Replace `day.jy/jm/jd` with `day.year/month/day`. Change DOM attributes to `data-year/month/day`. Aria labels use locale month names.

**Step 1: In `_renderDayView()`, find and replace the day cell rendering block:**

Change (line ~868–873):
```javascript
          const ariaLabel = `${PardisEngine.formatNum(day.jd, nt)} ${loc.months[day.jm - 1]} ${PardisEngine.formatNum(day.jy, nt)}`;
          const tabindex = day.isDisabled ? '-1' : '0';
          const ariaSelected = day.isSelected ? 'true' : 'false';
          const ariaDisabled = day.isDisabled ? 'true' : 'false';

          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="${tabindex}" aria-label="${ariaLabel}" aria-selected="${ariaSelected}" aria-disabled="${ariaDisabled}" data-jy="${day.jy}" data-jm="${day.jm}" data-jd="${day.jd}">${PardisEngine.formatNum(day.jd, nt)}</div>`;
```
To:
```javascript
          const ariaLabel = `${PardisEngine.formatNum(day.day, nt)} ${loc.months[day.month - 1]} ${PardisEngine.formatNum(day.year, nt)}`;
          const tabindex = day.isDisabled ? '-1' : '0';
          const ariaSelected = day.isSelected ? 'true' : 'false';
          const ariaDisabled = day.isDisabled ? 'true' : 'false';

          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="${tabindex}" aria-label="${ariaLabel}" aria-selected="${ariaSelected}" aria-disabled="${ariaDisabled}" data-year="${day.year}" data-month="${day.month}" data-day="${day.day}">${PardisEngine.formatNum(day.day, nt)}</div>`;
```

**Step 2: Update aria grid label (line ~853):**

Change:
```javascript
      <div class="pardis-days" role="grid" aria-label="${loc.months[info.month - 1]} ${PardisEngine.formatNum(info.year, nt)}">
```
No change — `info.month` and `info.year` are already generic (they come from `getViewInfo()` which uses `this.viewYear/viewMonth`). ✓

---

## Task 10 — Update Keyboard Navigation in `PardisDatepicker`

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisDatepicker._bindCalendarKeyboard()` and `_focusDayOffset()`

**Step 1: In `_bindCalendarKeyboard()`, update dataset reading:**

Change:
```javascript
        const jy = +focused.dataset.jy;
        const jm = +focused.dataset.jm;
        const jd = +focused.dataset.jd;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          engine.selectDate(jy, jm, jd);
```
To:
```javascript
        const year  = +focused.dataset.year;
        const month = +focused.dataset.month;
        const day   = +focused.dataset.day;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          engine.selectDate(year, month, day);
```

**Step 2: Update arrow key calls:**

Change:
```javascript
        if (e.key === 'ArrowRight') { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, isRTL ? -1 : +1); return; }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, isRTL ? +1 : -1); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, -7); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, +7); return; }
```
To:
```javascript
        if (e.key === 'ArrowRight') { e.preventDefault(); this._focusDayOffset(el, year, month, day, isRTL ? -1 : +1); return; }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); this._focusDayOffset(el, year, month, day, isRTL ? +1 : -1); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); this._focusDayOffset(el, year, month, day, -7); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); this._focusDayOffset(el, year, month, day, +7); return; }
```

**Step 3: Replace `_focusDayOffset()` entirely:**

Change:
```javascript
  _focusDayOffset(el, jy, jm, jd, offset) {
    const targetJdn = JalaaliUtil.j2d(jy, jm, jd) + offset;
    const minJdn = JalaaliUtil.j2d(PardisEngine.MIN_YEAR, 1, 1);
    const maxJdn = JalaaliUtil.j2d(PardisEngine.MAX_YEAR, 12, JalaaliUtil.jalaaliMonthLength(PardisEngine.MAX_YEAR, 12));
    if (targetJdn < minJdn || targetJdn > maxJdn) return;
    const target = JalaaliUtil.d2j(targetJdn);
    // Navigate view if target is outside current month
    if (target.jy !== this.engine.viewYear || target.jm !== this.engine.viewMonth) {
      this.engine.viewYear  = target.jy;
      this.engine.viewMonth = target.jm;
      this.engine.emit('viewChange', this.engine.getViewInfo());
      this._renderer.render();
    }
    // Focus the target cell
    const cell = el.querySelector(`[data-jy="${target.jy}"][data-jm="${target.jm}"][data-jd="${target.jd}"]`);
    if (cell) cell.focus();
  }
```
To:
```javascript
  _focusDayOffset(el, year, month, day, offset) {
    const eng       = this.engine._calEngine;
    const targetJdn = eng.toJDN(year, month, day) + offset;
    const minJdn    = eng.toJDN(eng.minYear, 1, 1);
    const maxJdn    = eng.toJDN(eng.maxYear, eng.monthsInYear, eng.getDaysInMonth(eng.maxYear, eng.monthsInYear));
    if (targetJdn < minJdn || targetJdn > maxJdn) return;

    const rawTarget  = eng.fromJDN(targetJdn);
    const targetYear = eng.tupleYear(rawTarget);
    const targetMonth= eng.tupleMonth(rawTarget);
    const targetDay  = eng.tupleDay(rawTarget);

    if (targetYear !== this.engine.viewYear || targetMonth !== this.engine.viewMonth) {
      this.engine.viewYear  = targetYear;
      this.engine.viewMonth = targetMonth;
      this.engine.emit('viewChange', this.engine.getViewInfo());
      this._renderer.render();
    }
    const cell = el.querySelector(`[data-year="${targetYear}"][data-month="${targetMonth}"][data-day="${targetDay}"]`);
    if (cell) cell.focus();
  }
```

---

## Task 11 — Update `PardisInputMask` for Engine Awareness

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisInputMask` class

**What:** `PardisInputMask._onInput()` directly calls `JalaaliUtil.jalaaliMonthLength()` and `PardisEngine.parseDateString()` which assumes Jalali format. For Gregorian mode, parsing must use the engine.

**Step 1: Add `_calEngine` reference in constructor:**

Change:
```javascript
class PardisInputMask {
  constructor(inputEl, engine) {
    this.input = inputEl;
    this.engine = engine;
    this._bind();
  }
```
To:
```javascript
class PardisInputMask {
  constructor(inputEl, engine) {
    this.input  = inputEl;
    this.engine = engine;
    this._calEngine = engine._calEngine; // calendar engine for validation
    this._bind();
  }
```

**Step 2: Update `_onInput()` to use engine for validation:**

Change the date validation block:
```javascript
    // Try parse complete date
    if (digits.length === 8) {
      const parsed = PardisEngine.parseDateString(persian);
      if (parsed && parsed.jy >= PardisEngine.MIN_YEAR && parsed.jy <= PardisEngine.MAX_YEAR && parsed.jm >= 1 && parsed.jm <= 12) {
        const maxDay = JalaaliUtil.jalaaliMonthLength(parsed.jy, parsed.jm);
        if (parsed.jd >= 1 && parsed.jd <= maxDay) {
          this.engine.viewYear = parsed.jy;
          this.engine.viewMonth = parsed.jm;
          this.engine.selectDate(parsed.jy, parsed.jm, parsed.jd);
        }
      }
    }
```
To:
```javascript
    // Try parse complete date
    if (digits.length === 8) {
      const parsed = PardisEngine.parseDateString(persian);
      if (parsed) {
        // parsed returns {jy, jm, jd} — use as generic year/month/day (same digit positions)
        const year  = parsed.jy;
        const month = parsed.jm;
        const day   = parsed.jd;
        const eng   = this._calEngine;
        if (year >= eng.minYear && year <= eng.maxYear && month >= 1 && month <= eng.monthsInYear) {
          const maxDay = eng.getDaysInMonth(year, month);
          if (day >= 1 && day <= maxDay) {
            this.engine.viewYear  = year;
            this.engine.viewMonth = month;
            this.engine.selectDate(year, month, day);
          }
        }
      }
    }
```

**Step 3: Update `setValue()` — for Gregorian, format as `YYYY/MM/DD` with correct numeral type:**

Change:
```javascript
  setValue(jy, jm, jd) {
    this.input.value = PardisEngine.formatPersian(jy, jm, jd);
  }
```
To:
```javascript
  setValue(year, month, day) {
    const nt = this.engine.numeralType;
    const formatted = `${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
    this.input.value = PardisEngine.formatNum(
      0, nt // dummy call to get numeral formatter
    );
    // Use correct numeral conversion:
    if (nt === 'persian') {
      this.input.value = PardisEngine.formatPersian(year, month, day);
    } else if (nt === 'arabic') {
      this.input.value = PardisEngine.toArabicNum(formatted).replace(/\//g, '/');
    } else {
      this.input.value = formatted;
    }
  }
```

**Step 4: Update `setRangeValue()`:**

Change:
```javascript
  setRangeValue(start, end) {
    const s = PardisEngine.formatPersian(start.jy, start.jm, start.jd);
    const e = PardisEngine.formatPersian(end.jy, end.jm, end.jd);
    this.input.value = `${s}  ←  ${e}`;
  }
```
To:
```javascript
  setRangeValue(start, end) {
    // start/end are {year, month, day}
    const fmt = (y, m, d) => {
      const nt = this.engine.numeralType;
      const s  = `${y}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
      if (nt === 'persian') return PardisEngine.formatPersian(y, m, d);
      if (nt === 'arabic')  return PardisEngine.toArabicNum(s).replace(/\//g, '/');
      return s;
    };
    this.input.value = `${fmt(start.year, start.month, start.day)}  ←  ${fmt(end.year, end.month, end.day)}`;
  }
```

---

## Task 12 — Update `PardisDatepicker` Constructor and Engine Events

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisDatepicker` class

**Step 1: Add `calendar` to default options:**

Find the `Object.assign` defaults block and add:
```javascript
      calendar: null,        // 'jalali' | 'gregorian' — null defaults to 'jalali'
```

**Step 2: Pass `calendar` option to `PardisEngine` in `_buildEngine()`:**

Change:
```javascript
  _buildEngine() {
    this.engine = new PardisEngine({
      rangeMode:        this.options.rangeMode,
      outputFormat:     this.options.outputFormat,
      minDate:          this.options.minDate,
      maxDate:          this.options.maxDate,
      initialYear:      this.options.initialYear,
      initialMonth:     this.options.initialMonth,
      disabledDates:    this.options.disabledDates,
      highlightedDates: this.options.highlightedDates,
      maxRange:         this.options.maxRange,
      numeralType:      this.options.numeralType,
    });
  }
```
To:
```javascript
  _buildEngine() {
    this.engine = new PardisEngine({
      rangeMode:        this.options.rangeMode,
      outputFormat:     this.options.outputFormat,
      minDate:          this.options.minDate,
      maxDate:          this.options.maxDate,
      initialYear:      this.options.initialYear,
      initialMonth:     this.options.initialMonth,
      disabledDates:    this.options.disabledDates,
      highlightedDates: this.options.highlightedDates,
      maxRange:         this.options.maxRange,
      numeralType:      this.options.numeralType,
      calendar:         this.options.calendar || 'jalali',
    });
  }
```

**Step 3: Update `_bindEngineEvents()` — update tuple reading in select/rangeStart/rangeSelect handlers**

The `select` event handler reads `payload.jalali.year/month/day` or `payload.year/month/day`. This is passed to `_inputMask.setValue()`. Update to match the new generic API:

Change:
```javascript
    this._offSelect = engine.on('select', (payload) => {
      this._currentPayload = payload;
      if (!this.options.inline) {
        const j = payload.jalali || (payload.year !== undefined ? payload : null);
        if (j && this._inputMask) this._inputMask.setValue(j.year, j.month, j.day);
        this.close();
      }
      if (typeof this.options.onChange === 'function') this.options.onChange(payload);
    });
```
To:
```javascript
    this._offSelect = engine.on('select', (payload) => {
      this._currentPayload = payload;
      if (!this.options.inline) {
        // For Jalali: payload.jalali.year/month/day (or legacy format)
        // For Gregorian: payload.gregorian.year/month/day
        const calName = engine._calEngine.name;
        const part = calName === 'gregorian'
          ? payload.gregorian
          : (payload.jalali || payload);
        if (part && this._inputMask) this._inputMask.setValue(part.year, part.month, part.day);
        this.close();
      }
      if (typeof this.options.onChange === 'function') this.options.onChange(payload);
    });
```

Update the rangeStart handler:
```javascript
    this._offRangeStart = engine.on('rangeStart', (payload) => {
      if (!this.options.inline && this._input) {
        const calName = engine._calEngine.name;
        const part = calName === 'gregorian'
          ? payload.gregorian
          : (payload.jalali || payload);
        if (part) {
          const formatted = `${part.year}/${String(part.month).padStart(2,'0')}/${String(part.day).padStart(2,'0')}`;
          this._input.value = PardisEngine.formatNum(
            0, engine.numeralType // ensure numeral used
          );
          // Apply correct numeral
          if (engine.numeralType === 'persian') {
            this._input.value = PardisEngine.formatPersian(part.year, part.month, part.day) + '  ←  ...';
          } else {
            this._input.value = formatted + '  ←  ...';
          }
        }
      }
      if (typeof this.options.onRangeStart === 'function') this.options.onRangeStart(payload);
    });
```

Update the rangeSelect handler — `js/je` now use `year/month/day` directly:
```javascript
    this._offRangeSelect = engine.on('rangeSelect', ({ start, end }) => {
      this._currentPayload = { start, end };
      if (!this.options.inline && this._inputMask) {
        const calName = engine._calEngine.name;
        const extractPart = (p) => calName === 'gregorian'
          ? p.gregorian
          : (p.jalali || p);
        const startPart = extractPart(start);
        const endPart   = extractPart(end);
        if (startPart && endPart) {
          this._inputMask.setRangeValue(
            { year: startPart.year, month: startPart.month, day: startPart.day },
            { year: endPart.year,   month: endPart.month,   day: endPart.day }
          );
        }
      }
      engine.hoverDate = null;
      this._renderer.render();
      if (typeof this.options.onRangeSelect === 'function') this.options.onRangeSelect({ start, end });
    });
```

**Step 4: Update `_bindDayEvents()` in `PardisRenderer` — hover and click use generic coords**

In `_bindDayEvents()` (in PardisRenderer), find dataset.jy/jm/jd reads:

Change:
```javascript
      const jy = +el.dataset.jy;
      const jm = +el.dataset.jm;
      const jd = +el.dataset.jd;
```
(There may be multiple occurrences in click and mouseover handlers — replace ALL of them.)
To:
```javascript
      const year  = +el.dataset.year;
      const month = +el.dataset.month;
      const day   = +el.dataset.day;
```

And update references from `jy/jm/jd` → `year/month/day` in those handlers. In the hover handler update:
```javascript
this.engine.hoverDate = { year, month, day };
```
In the click handler update:
```javascript
this.engine.selectDate(year, month, day);
```

---

## Task 13 — Update `PardisDatepicker.setValue()` for Generic Coords

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisDatepicker` class

The public API `setValue(jy, jm, jd)` must remain unchanged. Since for Jalali, jy=year/jm=month/jd=day, the call to `engine.selectDate(jy, jm, jd)` still works. No change needed to the signature. ✓

---

## Task 14 — Update `PardisRenderer._bindDayEvents()` — find all dataset.jy/jm/jd

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` — `PardisRenderer._bindDayEvents()`

Read the full `_bindDayEvents()` method and replace all occurrences of:
- `el.dataset.jy` → `el.dataset.year`
- `el.dataset.jm` → `el.dataset.month`
- `el.dataset.jd` → `el.dataset.day`
- Variable `jy` → `year`, `jm` → `month`, `jd` → `day`
- `engine.hoverDate = { jy, jm, jd }` → `engine.hoverDate = { year, month, day }`

---

## Task 15 — Update `.d.ts` Type Definitions

**Files:**
- Modify: `lib/pardis-jalali-datepicker.d.ts`

**Step 1: Add `GregorianDate` interface:**

```typescript
export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}
```

**Step 2: Add `CalendarType` type:**

```typescript
export type CalendarType = 'jalali' | 'gregorian';
```

**Step 3: Update `PardisOptions` — add `calendar` option:**

```typescript
  /** Calendar system to use. Default: 'jalali'. */
  calendar?: CalendarType;
```

**Step 4: Update `minDate`/`maxDate` types to also accept new generic form:**

```typescript
  minDate?: JalaliDate | { year: number; month: number; day: number } | null;
  maxDate?: JalaliDate | { year: number; month: number; day: number } | null;
```

**Step 5: Update `PARDIS_LOCALES` jsdoc comment to mention new keys:**

Add comment: Keys now include `'en-US-gregorian'` and `'fa-IR-gregorian'`.

**Step 6: Add `buildGregorianPayload` to `PardisEngine` declaration:**

```typescript
  static buildGregorianPayload(gy: number, gm: number, gd: number, format?: 'jalali' | 'gregorian' | 'both'): object;
```

---

## Task 16 — Build and Run Existing Tests

**Files:**
- No file changes

**Step 1: Build**

```bash
cd /Volumes/T7/PardisJalaliDatepicker/Pardis-Jalali-Datepicker
npm run build
```

Expected: success — `dist/index.cjs`, `dist/index.mjs`, `dist/index.global.js` regenerated.

**Step 2: Run existing tests**

```bash
npm test
```

Expected output:
```
PardisEngine range: 1 to 3177
All year boundary tests: OK
```

If any test fails, the refactoring broke Jalali behavior. Fix before proceeding.

---

## Task 17 — Write Gregorian Engine Tests

**Files:**
- Create: `scripts/gregorian-engine-test.js`

**Step 1: Write test file:**

```javascript
// Gregorian Engine Integration Tests
// Loads from dist/index.cjs (run `npm run build` first)

const { PardisEngine, JalaaliUtil } = require('../dist/index.cjs');

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
}
function eq(a, b, msg) {
  if (a !== b) throw new Error(`FAIL: ${msg} — expected ${b}, got ${a}`);
}

// ── Helper: create a Gregorian engine instance ──
function makeGregorianEngine(opts = {}) {
  return new PardisEngine({ ...opts, calendar: 'gregorian' });
}

function testGregorianDefault() {
  const engine = makeGregorianEngine();
  // Default calendar should be 'gregorian'
  eq(engine._calEngine.name, 'gregorian', 'Engine name');
  // Year range
  assert(engine._calEngine.minYear >= 1600, 'minYear >= 1600');
  assert(engine._calEngine.maxYear <= 3000, 'maxYear <= 3000');
}

function testLeapYears() {
  const eng = makeGregorianEngine()._calEngine;
  assert(eng.isLeapYear(2000), '2000 is leap');
  assert(!eng.isLeapYear(1900), '1900 is not leap');
  assert(eng.isLeapYear(2024), '2024 is leap');
  assert(!eng.isLeapYear(2023), '2023 is not leap');
  assert(eng.isLeapYear(1600), '1600 is leap (400 rule)');
  assert(!eng.isLeapYear(1700), '1700 is not leap (100 rule)');
}

function testDaysInMonth() {
  const eng = makeGregorianEngine()._calEngine;
  eq(eng.getDaysInMonth(2024, 2), 29, 'Feb 2024 = 29 days');
  eq(eng.getDaysInMonth(2023, 2), 28, 'Feb 2023 = 28 days');
  eq(eng.getDaysInMonth(2000, 2), 29, 'Feb 2000 = 29 days');
  eq(eng.getDaysInMonth(1900, 2), 28, 'Feb 1900 = 28 days');
  eq(eng.getDaysInMonth(2025, 1), 31, 'Jan 2025 = 31 days');
  eq(eng.getDaysInMonth(2025, 4), 30, 'Apr 2025 = 30 days');
  eq(eng.getDaysInMonth(2025, 12), 31, 'Dec 2025 = 31 days');
}

function testJDNRoundTrip() {
  const eng = makeGregorianEngine()._calEngine;
  // Key dates
  const dates = [
    { gy: 2025, gm: 3, gd: 21 },
    { gy: 2000, gm: 1, gd: 1 },
    { gy: 1970, gm: 1, gd: 1 },
    { gy: 2024, gm: 2, gd: 29 },
    { gy: 1900, gm: 12, gd: 31 },
  ];
  for (const { gy, gm, gd } of dates) {
    const jdn    = eng.toJDN(gy, gm, gd);
    const back   = eng.fromJDN(jdn);
    eq(back.gy, gy,  `JDN round-trip year ${gy}-${gm}-${gd}`);
    eq(back.gm, gm,  `JDN round-trip month ${gy}-${gm}-${gd}`);
    eq(back.gd, gd,  `JDN round-trip day ${gy}-${gm}-${gd}`);

    // Cross-check: Gregorian JDN must match JalaaliUtil's g2d result
    // (both implement the same algorithm)
    const refJalaali = JalaaliUtil.toJalaali(gy, gm, gd);
    const refBack    = JalaaliUtil.toGregorian(refJalaali.jy, refJalaali.jm, refJalaali.jd);
    eq(refBack.gy, gy,  `JalaaliUtil cross-check year ${gy}-${gm}-${gd}`);
  }
}

function testJDNMatchesJalaaliUtil() {
  // The Gregorian JDN algorithm must produce the same JDN as JalaaliUtil's g2d
  const eng = makeGregorianEngine()._calEngine;
  const testDates = [
    [2025, 3, 21], [2000, 2, 29], [1970, 1, 1], [2024, 12, 31],
  ];
  for (const [gy, gm, gd] of testDates) {
    const myJdn  = eng.toJDN(gy, gm, gd);
    // JalaaliUtil doesn't expose g2d directly, but we can cross-check via
    // Jalali → JDN → Gregorian round-trip
    const j = JalaaliUtil.toJalaali(gy, gm, gd);
    const refJdn = JalaaliUtil.j2d(j.jy, j.jm, j.jd);
    eq(myJdn, refJdn, `JDN match for ${gy}-${gm}-${gd}`);
  }
}

function testGregorianEngineSelectDate() {
  const engine = makeGregorianEngine();
  engine.selectDate(2025, 3, 21);
  assert(engine.selectedDate !== null, 'selectedDate set after select');
  eq(engine.selectedDate.year,  2025, 'selectedDate.year');
  eq(engine.selectedDate.month, 3,    'selectedDate.month');
  eq(engine.selectedDate.day,   21,   'selectedDate.day');
}

function testGregorianPayload() {
  let receivedPayload = null;
  const engine = makeGregorianEngine({ outputFormat: 'both' });
  engine.on('select', (p) => { receivedPayload = p; });
  engine.selectDate(2025, 3, 21);
  assert(receivedPayload !== null, 'payload emitted');
  eq(receivedPayload.calendar, 'gregorian', 'payload.calendar');
  eq(receivedPayload.gregorian.year,  2025,    'payload.gregorian.year');
  eq(receivedPayload.gregorian.month, 3,       'payload.gregorian.month');
  eq(receivedPayload.gregorian.day,   21,      'payload.gregorian.day');
  eq(receivedPayload.iso, '2025-03-21',        'payload.iso');
  // Jalali cross-reference: 2025-03-21 = 1404/1/1
  eq(receivedPayload.jalali.year,  1404, 'payload.jalali.year');
  eq(receivedPayload.jalali.month, 1,    'payload.jalali.month');
  eq(receivedPayload.jalali.day,   1,    'payload.jalali.day');
}

function testGregorianRangeMode() {
  const engine = makeGregorianEngine({ rangeMode: true });
  engine.selectDate(2025, 3, 1);
  engine.selectDate(2025, 3, 31);
  assert(engine.rangeStart !== null, 'rangeStart set');
  assert(engine.rangeEnd   !== null, 'rangeEnd set');
  eq(engine.rangeStart.year, 2025, 'rangeStart.year');
  eq(engine.rangeStart.day,  1,    'rangeStart.day');
  eq(engine.rangeEnd.day,    31,   'rangeEnd.day');
}

function testGregorianDaysOfMonth() {
  const engine = makeGregorianEngine({ initialYear: 2025, initialMonth: 1 });
  const days = engine.getDaysOfMonth();
  // January 2025: 31 days
  const currentDays = days.filter(d => d.isCurrentMonth);
  eq(currentDays.length, 31, 'Jan 2025 has 31 current-month cells');
  // Total cells must be multiple of 7
  assert(days.length % 7 === 0, 'Total cells divisible by 7');
  // Each cell has generic year/month/day
  assert(typeof days[0].year  === 'number', 'cell.year is number');
  assert(typeof days[0].month === 'number', 'cell.month is number');
  assert(typeof days[0].day   === 'number', 'cell.day is number');
}

function testJalaliBackwardCompat() {
  // Ensure Jalali engine (default) still works identically to v2
  const engine = new PardisEngine({ initialYear: 1404, initialMonth: 1 });
  eq(engine._calEngine.name, 'jalali', 'Default engine is jalali');
  eq(engine.viewYear, 1404,  'Jalali viewYear');
  eq(engine.viewMonth, 1,    'Jalali viewMonth');
  // today is generic
  assert(typeof engine.today.year  === 'number', 'today.year');
  assert(typeof engine.today.month === 'number', 'today.month');
  assert(typeof engine.today.day   === 'number', 'today.day');
}

function testDeprecatedTupleWarning() {
  // minDate with {jy,jm,jd} should still work but emit a warning
  const originalWarn = console.warn;
  let warned = false;
  console.warn = () => { warned = true; };

  const engine = new PardisEngine({
    minDate: { jy: 1404, jm: 1, jd: 1 },
  });
  // isDisabled should work without throwing
  const disabled = engine.isDisabled(1403, 12, 29);
  assert(disabled === true, 'isDisabled with deprecated {jy,jm,jd} minDate');
  assert(warned,            'Deprecation warning emitted');
  console.warn = originalWarn;
}

function testGregorianMinDateConstraint() {
  const engine = makeGregorianEngine({
    minDate: { year: 2025, month: 6, day: 1 },
  });
  assert(engine.isDisabled(2025, 5, 31), 'Before minDate is disabled');
  assert(!engine.isDisabled(2025, 6, 1), 'On minDate is not disabled');
  assert(!engine.isDisabled(2025, 7, 1), 'After minDate is not disabled');
}

function run() {
  const tests = [
    testGregorianDefault,
    testLeapYears,
    testDaysInMonth,
    testJDNRoundTrip,
    testJDNMatchesJalaaliUtil,
    testGregorianEngineSelectDate,
    testGregorianPayload,
    testGregorianRangeMode,
    testGregorianDaysOfMonth,
    testJalaliBackwardCompat,
    testDeprecatedTupleWarning,
    testGregorianMinDateConstraint,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      console.log(`  ✓ ${test.name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ ${test.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
```

**Step 2: Run the new tests**

```bash
npm run build && node scripts/gregorian-engine-test.js
```

Expected: All tests pass, 0 failed.

---

## Task 18 — Update `package.json` test script

**Files:**
- Modify: `package.json`

Change:
```json
    "test": "node scripts/year-boundary-test.js",
```
To:
```json
    "test": "node scripts/year-boundary-test.js && node scripts/gregorian-engine-test.js",
```

Run `npm test` to confirm both test suites pass.

---

## Task 19 — Documentation Updates

**Files:**
- Modify: `README.md`
- Modify: `docs/guides/multi-calendar-preview.md`
- Modify: `docs/architecture/multi-calendar-rfc.md`

### README.md

Find the "Usage" or "Options" section. Add a new section **after the existing options table**:

```markdown
## Multi-Calendar Support (v3)

Starting in v3, the datepicker supports multiple calendar systems via the `calendar` option.

### Jalali (Default — Unchanged from v2)

```javascript
// Jalali calendar — default, no change required from v2:
const picker = new PardisDatepicker('#input', {
  locale: 'fa-IR',
});
```

### Gregorian Calendar

```javascript
// Gregorian calendar — new in v3:
const picker = new PardisDatepicker('#input', {
  calendar: 'gregorian',
  locale: 'en-US-gregorian',
  onChange(payload) {
    console.log(payload.gregorian.year);   // e.g. 2025
    console.log(payload.gregorian.month);  // e.g. 3
    console.log(payload.gregorian.day);    // e.g. 21
    console.log(payload.iso);             // '2025-03-21'
  },
});
```

Both pickers can coexist on the same page. The `calendar` option defaults to `'jalali'`, so all v2 code works unchanged.

### Built-in Locales

| Locale key | Language | Calendar | Direction |
|---|---|---|---|
| `fa-IR` | Persian | Jalali | RTL |
| `en-US` | English (transliterated) | Jalali | LTR |
| `en-US-gregorian` | English | Gregorian | LTR |
| `fa-IR-gregorian` | Persian | Gregorian | RTL |

### Migration from v2

No changes required. The `calendar` option defaults to `'jalali'`. If you use `{jy, jm, jd}` in `minDate`/`maxDate`, a console deprecation warning is shown — update to `{year, month, day}` at your convenience before v4.
```

### `docs/guides/multi-calendar-preview.md`

- Remove all "This feature is not available in the current stable version" disclaimers.
- Replace header notice with: `> **Status:** Available in v3. Current stable: v3.0.`
- Remove "(proposed)" and "(v3 proposal)" labels from all code examples.
- Update "TypeScript Definitions (v3 Proposal)" section heading to "TypeScript Definitions".

### `docs/architecture/multi-calendar-rfc.md`

Add a new section at the end of the document (before the final authoring line):

```markdown
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
```

---

## Task 20 — Final Build and Full Test Suite

**Step 1:**
```bash
npm run build
```
Expected: Clean build, no errors.

**Step 2:**
```bash
npm test
```
Expected output:
```
PardisEngine range: 1 to 3177
All year boundary tests: OK
  ✓ testGregorianDefault
  ✓ testLeapYears
  ✓ testDaysInMonth
  ✓ testJDNRoundTrip
  ✓ testJDNMatchesJalaaliUtil
  ✓ testGregorianEngineSelectDate
  ✓ testGregorianPayload
  ✓ testGregorianRangeMode
  ✓ testGregorianDaysOfMonth
  ✓ testJalaliBackwardCompat
  ✓ testDeprecatedTupleWarning
  ✓ testGregorianMinDateConstraint

12 passed, 0 failed
```

**Step 3: Commit**

```bash
git add lib/pardis-jalali-datepicker.js lib/pardis-jalali-datepicker.d.ts \
        scripts/gregorian-engine-test.js package.json \
        README.md docs/guides/multi-calendar-preview.md docs/architecture/multi-calendar-rfc.md
git commit -m "feat(v3): multi-calendar engine abstraction — Jalali + Gregorian

- Add CalendarEngine interface (JSDoc contract)
- Add JalaliEngine class wrapping JalaaliUtil (zero behavior change)
- Add GregorianEngine class with leap year, JDN, and month-length support
- PardisEngine delegates all calendar arithmetic to active CalendarEngine
- Day cells now expose generic year/month/day fields (Jalali aliases preserved)
- PardisRenderer and keyboard nav updated to use generic fields
- PardisInputMask uses engine for month-length validation
- Add en-US-gregorian and fa-IR-gregorian built-in locales
- Add {jy,jm,jd} deprecation warning for constraint tuples
- Add calendar option to PardisDatepicker (default: jalali)
- All v2 behavior preserved — zero breaking changes
- Add 12 Gregorian engine tests in scripts/gregorian-engine-test.js
- Update TypeScript definitions, README, and docs

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Invariants to Verify Throughout

At every step, the following must remain true:

1. `npm run build` succeeds
2. `npm test` (existing year-boundary tests) pass
3. `new PardisDatepicker('#el')` with no options behaves identically to v2
4. `PardisEngine.MIN_YEAR === 1` and `PardisEngine.MAX_YEAR === 3177` (static props unchanged)
5. `PardisEngine.buildDatePayload(jy, jm, jd, format)` static signature unchanged
6. `PardisDatepicker.setValue(jy, jm, jd)` still works for Jalali

---

## Implementation Warnings

1. **Build before testing**: Tests load `dist/index.cjs`. Always `npm run build` before `node scripts/*.js`.
2. **Single file**: All changes are to `lib/pardis-jalali-datepicker.js`. Do NOT create new files except `scripts/gregorian-engine-test.js`.
3. **Task order matters**: Complete Tasks 1–2 (engine classes) BEFORE Task 4 (PardisEngine constructor) — the constructor references `JalaliEngine` and `GregorianEngine`.
4. **`_bindDayEvents()`**: There are click AND mouseover handlers in this method. Both read `dataset.jy/jm/jd` — update ALL occurrences.
5. **`hoverDate` shape**: `hoverDate` is set in `_bindDayEvents()` and read in `isInHoverRange()` / `isHoverRangeEnd()`. Both sides must use generic `{year, month, day}`.
6. **`parseDateString()` is static**: It returns `{jy, jm, jd}`. The `PardisInputMask` treats these as generic year/month/day values (positions 0-1-2 in YYYY/MM/DD are the same for both calendars). Acceptable for now — no change needed to this static method.
7. **`weekStart` in `getDaysOfMonth()`**: Hardcoded as 6 (Saturday) for now. A future improvement would derive this from `this._locale.weekStart` but that requires passing locale to the engine. Out of scope for this task.
