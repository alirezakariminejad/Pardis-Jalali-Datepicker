---
title: "Recommended API Design (Reference)"
section: 15
tags: [jalali, datepicker, api, props, typescript, design]
last_updated: 2025-02
---

# Recommended API Design (Reference)

This is a suggested prop/option surface. Adjust to your framework's conventions.

| Prop / Option | Type | Description |
|---------------|------|-------------|
| `value` | `JalaliDate \| null` | Controlled selected date |
| `defaultValue` | `JalaliDate \| null` | Uncontrolled initial value |
| `onChange` | `(d: JalaliDate) => void` | Called on date selection |
| `range` | `boolean` | Enable date range mode |
| `rangeValue` | `DateRange` | `{ start, end }` for range mode |
| `minDate` / `maxDate` | `JalaliDate` | Constraint bounds |
| `disabledDates` | `JalaliDate[] \| Fn` | Disable specific dates |
| `highlightedDates` | `{ date, className }[]` | Custom day highlights |
| `locale` | `Locale` | i18n config object |
| `numeralType` | `'persian' \| 'latin'` | Digit display style |
| `monthsShown` | `1 \| 2 \| 3` | Number of months rendered |
| `inline` | `boolean` | Render calendar always visible |
| `readOnly` | `boolean` | Disable interaction |
| `renderDay` | `(opts) => ReactNode` | Custom day cell renderer |
| `inputFormat` | `string` | e.g., `'YYYY/MM/DD'`, `'jYYYY-jMM-jDD'` |
| `allowNativeInput` | `boolean` | Use `<input type='date'>` on mobile |
| `firstDayOfWeek` | `0–6` | `6` = Saturday (Jalali default) |

---

*Legend: ✅ Required · 🔲 Recommended · ⚠️ Partial/Adapter · ❌ Not Present*

---

← [Previous: Performance Targets](./14-performance.md) | [Index](./README.md)
