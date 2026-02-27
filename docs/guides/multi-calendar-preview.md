# Multi-Calendar Support — Feature Preview

> **This feature is not available in the current stable version.**
> All API examples on this page are proposals for **v3**, which is under design.
> The current stable release is **v2.x**.
> Do not use these examples in production code targeting v2.

---

## Introduction

Starting with v3, Pardis Jalali Datepicker will support multiple calendar systems through a pluggable engine architecture. The first release will ship two built-in calendar engines:

- **Jalali** — the existing calendar system, unchanged and still the default
- **Gregorian** — a new first-class calendar mode

This document gives you an early look at how the API will work so you can plan your migration before v3 is released.

---

## How Jalali Remains the Default

The Jalali calendar is the foundation of this library and will remain the default calendar in v3 and beyond. If you instantiate `PardisDatepicker` without specifying a `calendar` option, behavior is identical to v2:

```javascript
// v3: same as v2 — Jalali calendar, fa-IR locale, RTL, Persian numerals
const picker = new PardisDatepicker('#my-input');
```

There is nothing you need to change in your v2 code to upgrade to v3.

---

## The New `calendar` Option (v3 Proposal)

v3 introduces a single new top-level option: `calendar`. It accepts either `'jalali'` (the default) or `'gregorian'`.

```javascript
// v3 (proposed — not available in v2):

// Jalali calendar — default, explicit:
const jalaliPicker = new PardisDatepicker('#jalali-input', {
  calendar: 'jalali',
  locale: 'fa-IR',
});

// Gregorian calendar — new in v3:
const gregorianPicker = new PardisDatepicker('#gregorian-input', {
  calendar: 'gregorian',
  locale: 'en-US-gregorian',
});
```

### Calendar and Locale Are Independent

The `calendar` option determines which calendar system is used for date arithmetic, navigation, and display. The `locale` option determines the language of labels, the text direction, and the numeral system.

They are independent. You can combine them freely:

```javascript
// v3 (proposed):

// Gregorian calendar with Persian language UI:
const picker = new PardisDatepicker('#input', {
  calendar: 'gregorian',
  locale: 'fa-IR-gregorian', // new built-in locale in v3
});

// Jalali calendar with Latin numerals and English labels:
const picker = new PardisDatepicker('#input', {
  calendar: 'jalali',
  locale: 'en-US',
});
```

---

## Gregorian Calendar Mode (v3 Proposal)

When `calendar: 'gregorian'` is set, the datepicker operates entirely in the Gregorian system:

- Navigation is by Gregorian months and years
- Month names display in the active locale's Gregorian month list
- The input field accepts and displays Gregorian dates
- Constraint options (`minDate`, `maxDate`, `disabledDates`) use Gregorian coordinates
- The `onChange` payload returns Gregorian year, month, and day as the primary values

```javascript
// v3 (proposed — not available in v2):
const picker = new PardisDatepicker('#date-input', {
  calendar: 'gregorian',
  locale: 'en-US-gregorian',
  minDate: { year: 2020, month: 1, day: 1 },
  maxDate: { year: 2030, month: 12, day: 31 },
  onChange(payload) {
    console.log(payload.gregorian.year);   // e.g. 2025
    console.log(payload.gregorian.month);  // e.g. 3
    console.log(payload.gregorian.day);    // e.g. 21
    console.log(payload.iso);              // '2025-03-21'
  },
});
```

---

## onChange Payload in v3 (Proposal)

The `onChange` callback payload will be enhanced in v3 to always include both Jalali and Gregorian representations, plus the active `calendar` field. This makes cross-system forms straightforward without any conversion code in userland.

### Jalali engine payload (calendar: 'jalali')

```javascript
// v3 (proposed):
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
    date: Date,       // native JS Date object
  },
  iso: '2025-03-21',
  timestamp: 1742515200000,
}
```

The `jalali` and `gregorian` sub-objects are always both present, regardless of which engine is active. The `calendar` field tells you which one was the user's primary selection.

### Gregorian engine payload (calendar: 'gregorian')

```javascript
// v3 (proposed):
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

---

## Range Mode with Multiple Calendars (v3 Proposal)

Range mode works identically across both calendar systems:

```javascript
// v3 (proposed):
const rangePicker = new PardisDatepicker('#range-input', {
  calendar: 'gregorian',
  locale: 'en-US-gregorian',
  rangeMode: true,
  onRangeSelect(payload) {
    console.log(payload.start.iso);  // e.g. '2025-03-01'
    console.log(payload.end.iso);    // e.g. '2025-03-31'
  },
});
```

---

## Multiple Pickers on the Same Page (v3 Proposal)

Different calendar systems can coexist on the same page. Each `PardisDatepicker` instance is fully independent:

```javascript
// v3 (proposed):

// Jalali picker for Persian-calendar form field:
new PardisDatepicker('#birth-date-jalali', {
  calendar: 'jalali',
  locale: 'fa-IR',
});

// Gregorian picker for international travel date:
new PardisDatepicker('#travel-date-gregorian', {
  calendar: 'gregorian',
  locale: 'en-US-gregorian',
});
```

---

## Upgrading from v2 (Migration Preview)

### Zero-Change Upgrade

For the majority of v2 users, upgrading to v3 requires no code changes. The defaults are preserved:

```javascript
// v2 code — works without modification in v3:
new PardisDatepicker('#input', {
  locale: 'fa-IR',
  rangeMode: true,
  minDate: { jy: 1402, jm: 1, jd: 1 },  // accepted with deprecation warning
});
```

### Recommended Migration Steps (After Upgrading to v3)

1. **Resolve deprecation warnings**: If you use `{jy, jm, jd}` keys in `minDate`, `maxDate`, or `disabledDates`, rename them to `{year, month, day}`. The old form continues to work in v3 but will be removed in v4.

   ```javascript
   // v2 (deprecated in v3):
   minDate: { jy: 1402, jm: 1, jd: 1 }

   // v3 preferred:
   minDate: { year: 1402, month: 1, day: 1 }
   ```

2. **Update outputFormat usage**: If you use `outputFormat: 'jalali'` or `outputFormat: 'gregorian'`, be aware this option is deprecated in v3. The v3 payload always includes both calendar representations. You can access `payload.jalali` or `payload.gregorian` directly.

3. **No rush**: Both of the above are non-breaking in v3. You can upgrade to v3 first and clean up the warnings at your own pace before v4.

---

## Built-in Locales in v3 (Planned)

| Locale key | Language | Calendar target | Direction | Numerals |
|---|---|---|---|---|
| `fa-IR` | Persian | Jalali | RTL | Persian |
| `en-US` | English | Jalali (transliterated) | LTR | Latin |
| `en-US-gregorian` *(new)* | English | Gregorian | LTR | Latin |
| `fa-IR-gregorian` *(new)* | Persian | Gregorian | RTL | Persian |

---

## TypeScript Definitions (v3 Proposal)

The TypeScript types will be updated in v3 to reflect the new option and payload shapes:

```typescript
// v3 types (proposed — not in current .d.ts):

type CalendarType = 'jalali' | 'gregorian';

interface PardisOptions {
  // Existing options — unchanged:
  locale?: string | PardisLocale;
  rangeMode?: boolean;
  minDate?: { year: number; month: number; day: number } | string;
  maxDate?: { year: number; month: number; day: number } | string;
  // ...all other v2 options...

  // New in v3:
  calendar?: CalendarType;
}

interface CalendarDatePart {
  year: number;
  month: number;
  day: number;
  monthName: string;
  formatted: string;
}

interface JalaliDatePart extends CalendarDatePart {
  formattedPersian: string;
}

interface GregorianDatePart extends CalendarDatePart {
  date: Date;
}

interface DatePayloadV3 {
  calendar: CalendarType;
  jalali: JalaliDatePart;
  gregorian: GregorianDatePart;
  iso: string;
  timestamp: number;
}
```

---

## Staying Informed

This document will be updated as v3 design progresses toward implementation. To track progress:

- Watch the [GitHub repository](https://github.com/your-repo/pardis-jalali-datepicker) for v3 milestone updates.
- Review the technical RFC at [docs/architecture/multi-calendar-rfc.md](../architecture/multi-calendar-rfc.md).
- Review the roadmap at [docs/roadmap/v3-multi-calendar.md](../roadmap/v3-multi-calendar.md).

---

> **Reminder:** Everything on this page is a design proposal for v3.
> **This feature is not available in the current stable version (v2.x).**
> Do not use these API shapes in production code today.
