---
title: "Localization & i18n"
section: 4
tags: [jalali, datepicker, localization, i18n, persian, rtl, edge-cases]
last_updated: 2025-02
---

# Localization & i18n

A great Jalali library handles Persian by default but shouldn't be a dead end for i18n. Teams may need to switch between Jalali and Gregorian, or support Afghan Dari alongside Iranian Farsi.

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | `locale` prop / config object | Provide a locale object users can override or extend. |
| ✅ | Persian (fa-IR) as default locale | All month/day names, ARIA labels in Farsi by default. |
| ✅ | English (en-US) locale built-in | For developers using the Gregorian mode fallback. |
| ✅ | Arabic numerals option | `numeralType: 'persian' \| 'latin' \| 'arabic'` |
| ✅ | RTL/LTR automatic from locale | `dir` prop auto-set based on locale; overridable. |
| ✅ | Pluggable locale system | Export `LocaleType` interface so users can add Dari, Kurdish, etc. |
| 🔲 | Gregorian calendar mode | `calendarType: 'jalali' \| 'gregorian'` — same API, different engine. |
| 🔲 | Hijri (Islamic) calendar mode | `calendarType: 'hijri'` for users in Saudi Arabia, UAE, etc. |

## 4.1 Persian Date Validation Edge Cases

> **🐛 Known Pain Points (reported by Persian devs)**
>
> - Year 1400 Esfand: 30 days (leap) — many libraries hard-code 29 for Esfand
> - Month 6 (Shahrivar) = 31 days, not 30 — test explicitly
> - Conversion around Nowruz (1 Farvardin) is where most bugs appear: verify 20–21 March boundary
> - Pasting mixed-numeral dates (e.g., '1402/۰۳/15') should normalize without crashing
> - Year 1399 was a leap year; 1403 is also a leap year — test both in unit tests
> - Time zones: when Gregorian date is March 20 in UTC+3:30 (Tehran), Jalali may be 29 Esfand

---

← [Previous: Accessibility](./03-accessibility.md) | [Index](./README.md) | [Next: TypeScript & Type Definitions](./05-typescript.md) →
