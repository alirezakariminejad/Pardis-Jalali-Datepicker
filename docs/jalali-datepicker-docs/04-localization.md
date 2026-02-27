---
title: "Localization & i18n"
section: 4
tags: [jalali, datepicker, localization, i18n, persian, rtl, edge-cases]
last_updated: 2026-02-26
---

# Localization & i18n

`pardis-jalali-datepicker` ships with a fully pluggable, zero-dependency locale
system. Persian (`fa-IR`) remains the default; English (`en-US`) is built in,
and any custom locale can be injected at construction time or swapped at runtime.

> **Implementation Status (implemented 2026-02-26, v2.1.0)**
>
> All items marked ✅ below are fully implemented.
> Items marked 🔲 are design targets for future releases.

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | Persian (fa-IR) as default locale | Backward-compatible. Month/day names come from the `fa-IR` locale object; `direction: rtl` is applied via `dir="rtl"` on the calendar root. |
| ✅ | Persian and Latin numeral modes | `numeralType: 'persian'` (default) or `numeralType: 'latin'`. When omitted, uses the active locale's `numerals` field. |
| ✅ | Arabic numeral mode | `numeralType: 'arabic'` — Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩). Zero external dependencies. |
| ✅ | `locale` prop / config option | `locale: 'fa-IR' \| 'en-US' \| customObject`. String → built-in lookup; object → merged with `fa-IR` defaults; `null`/`undefined` → `fa-IR`. |
| ✅ | English (en-US) locale built-in | English transliterations of Jalali month names, English weekday abbreviations, `direction: ltr`, Latin numerals. |
| ✅ | RTL/LTR automatic from locale | `direction` field applied as `dir` attribute on the calendar root. Keyboard arrows and swipe gestures respect the active direction. |
| ✅ | Pluggable locale system | `PARDIS_LOCALES` registry and `resolveLocale()` exported — third parties can ship Dari, Kurdish, etc. as plain objects. |
| 🔲 | Gregorian calendar mode | `calendarType: 'jalali' \| 'gregorian'` — same API, different engine. |
| 🔲 | Hijri (Islamic) calendar mode | `calendarType: 'hijri'` for users in Saudi Arabia, UAE, etc. |

---

## 4.1 Quick Start

### Default (Persian / RTL)

```js
// No locale option needed — fa-IR is the default.
const dp = new PardisDatepicker('#input');
```

### English (LTR, Latin numerals)

```js
const dp = new PardisDatepicker('#input', {
  locale: 'en-US',
});
```

### Arabic numerals with Persian locale

```js
const dp = new PardisDatepicker('#input', {
  numeralType: 'arabic',
  // locale defaults to fa-IR — numeralType overrides the locale's numeral setting
});
```

### Custom locale (e.g. Dari / Afghan Persian)

```js
const dp = new PardisDatepicker('#input', {
  locale: {
    code: 'fa-AF',
    direction: 'rtl',
    months: ['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'],
    weekdays: ['ش','ی','د','س','چ','پ','ج'],
    weekdaysLong: ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'],
    numerals: 'persian',
    weekStart: 6,
    ui: {
      today: 'امروز',
      clear: 'پاک کردن',
    },
  },
});
```

### Runtime locale switch

```js
dp.setOption('locale', 'en-US');   // switches language, direction, and numerals instantly
dp.setOption('locale', 'fa-IR');   // switch back
```

---

## 4.2 Locale Object Shape

```ts
interface PardisLocale {
  code?: string;           // BCP 47, e.g. 'fa-IR', 'en-US', 'fa-AF'
  direction?: 'rtl' | 'ltr';
  months?: string[];       // 12 Jalali month names (index 0 = Farvardin)
  weekdays?: string[];     // 7 short weekday names (index 0 = Saturday)
  weekdaysLong?: string[]; // 7 full weekday names  (index 0 = Saturday)
  numerals?: 'persian' | 'latin' | 'arabic';
  weekStart?: number;      // 0=Sunday … 6=Saturday; Jalali default: 6
  ui?: Partial<PardisLocaleUI>; // button labels and aria strings
}
```

All fields are optional — any missing field falls back to the `fa-IR` built-in value.

### `numeralType` vs `locale.numerals`

- `locale.numerals` is the default digit style for a locale.
- Explicit `numeralType` option **overrides** the locale's default.
- Example: `locale: 'en-US'` + `numeralType: 'arabic'` → English names, Arabic digits.

---

## 4.3 Built-in Locales

### `fa-IR` (Persian — default)

```js
{
  code: 'fa-IR',
  direction: 'rtl',
  months: ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
           'مهر','آبان','آذر','دی','بهمن','اسفند'],
  weekdays: ['ش','ی','د','س','چ','پ','ج'],
  numerals: 'persian',
  weekStart: 6,
  ui: { today: 'امروز', clear: 'پاک کردن', /* … */ }
}
```

### `en-US` (English Jalali)

```js
{
  code: 'en-US',
  direction: 'ltr',
  months: ['Farvardin','Ordibehesht','Khordad','Tir','Mordad','Shahrivar',
           'Mehr','Aban','Azar','Dey','Bahman','Esfand'],
  weekdays: ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'],
  numerals: 'latin',
  weekStart: 6,
  ui: { today: 'Today', clear: 'Clear', /* … */ }
}
```

---

## 4.4 Numeral Systems

| `numeralType` | Digits | Example |
|---|---|---|
| `'persian'` (default) | ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹ | ۱۴۰۳/۰۶/۱۵ |
| `'latin'` | 0 1 2 3 4 5 6 7 8 9 | 1403/06/15 |
| `'arabic'` | ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ | ١٤٠٣/٠٦/١٥ |

Conversion is implemented internally with no external dependencies.

---

## 4.5 Direction Handling

- `direction: 'rtl'` → `dir="rtl"` on `.pardis-calendar`; keyboard `ArrowRight`/`ArrowLeft`
  are swapped to match visual layout; swipe left = next month.
- `direction: 'ltr'` → `dir="ltr"`; standard keyboard and swipe direction.
- Range-selection corner radii are automatically inverted for LTR via
  `.pardis-calendar[dir="ltr"]` CSS rules.
- The `<input>` field keeps `direction: ltr; text-align: right` regardless of locale
  (the date mask cursor behavior is always LTR-based).

---

## 4.6 Programmatic API

```js
import { PARDIS_LOCALES, resolveLocale } from 'pardis-jalali-datepicker';

// Inspect built-in locales
console.log(Object.keys(PARDIS_LOCALES)); // ['fa-IR', 'en-US']

// Build a merged locale (merges with fa-IR defaults)
const myLocale = resolveLocale({ direction: 'ltr', numerals: 'arabic' });

const dp = new PardisDatepicker('#input', { locale: myLocale });
```

---

## 4.7 Persian Date Validation Edge Cases

Known pain points reported by Persian developers:

- Year 1400 Esfand: 30 days (leap) — many libraries hard-code 29 for Esfand
- Month 6 (Shahrivar) = 31 days, not 30 — test explicitly
- Conversion around Nowruz (1 Farvardin) is where most bugs appear: verify
  the 20–21 March boundary
- Pasting mixed-numeral dates (e.g., '1402/۰۳/15') should normalize without
  crashing
- Year 1399 was a leap year; 1403 is also a leap year — test both in unit tests
- Time zones: when Gregorian date is March 20 in UTC+3:30 (Tehran), Jalali
  may be 29 Esfand

---

← [Previous: Accessibility](./03-accessibility.md) | [Index](./README.md) | [Next: TypeScript & Type Definitions](./05-typescript.md) →
