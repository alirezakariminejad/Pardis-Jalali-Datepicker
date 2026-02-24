---
title: "Core Feature Checklist"
section: 2
tags: [jalali, datepicker, features, calendar-engine, range, navigation]
last_updated: 2025-02
---

# Core Feature Checklist

## 2.1 Calendar Engine

The engine is the most critical part. Every other feature depends on correct Jalali arithmetic.

| ✓ | Feature | Notes / Implementation Guidance |
|---|---------|----------------------------------|
| ✅ | Correct Jalali ↔ Gregorian conversion | Use well-tested algorithm (Borkowski or jalaali-js). Never use moment-jalaali alone as engine. |
| ✅ | Correct leap year detection | Year is leap if in the set {1,5,9,13,17,22,26,30} mod 33. Test years 1399, 1403, 1408. |
| ✅ | Month length accuracy (28–31 days) | Validate programmatically: Esfand month in leap vs non-leap years. |
| ✅ | Persian numerals option (۰–۱–۲…۹) | Provide both: persian (default) and latin modes. Map via lookup array. |
| ✅ | Week starts Saturday by default | Allow override: `firstDayOfWeek`: 0-6 (0=Saturday in this context). |
| ✅ | Persian month/day names built-in | Farvardin…Esfand; Shanbeh…Jomeh. Provide as exported constants. |
| ✅ | Gregorian dual-display mode | Option to show Gregorian date below or alongside Jalali date. |
| 🔲 | Islamic (Hijri Qamari) dual display | Bonus: show hijri month name (e.g. Ramadan) on relevant days. |

## 2.2 Single Date Selection

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | Input field with manual text entry | Validate on blur; support YYYY/MM/DD and alternate formats. |
| ✅ | Calendar popup / flyout | Use `role='dialog'` with `aria-modal='true'`. |
| ✅ | Inline (embedded) mode | No popup — calendar always visible. Useful for booking pages. |
| ✅ | Today button / Go-to-today | Highlight today's date; provide keyboard shortcut (T key). |
| ✅ | Clear / reset button | Allow clearing value without re-opening the picker. |
| ✅ | minDate / maxDate constraints | Disable and visually gray out dates outside the allowed range. |
| ✅ | disabledDates array/function | Accept array of dates or predicate: `(date) => boolean`. |
| ✅ | Highlighted / marked dates | Custom CSS class per date; useful for events, holidays. |

## 2.3 Date Range Selection

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | Range picker mode (start + end) | Single component, two inputs; highlight range in calendar. |
| ✅ | Range hover preview | As user hovers days, show preview of the potential range. |
| ✅ | Preset ranges (This week, This month…) | Provide: 'هفته جاری', 'ماه جاری', '۷ روز گذشته', 'سه ماهه' etc. |
| ✅ | Max range length constraint | `maxRange: 30` — prevent selecting ranges > N days. |
| ✅ | Dual-month view for ranges | Show 2 months side-by-side on desktop; 1 month stacked on mobile. |
| 🔲 | Multi-date selection (non-contiguous) | Click multiple non-adjacent dates; emit array of dates. |

## 2.4 Navigation & Views

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | Month navigation (prev/next arrows) | Wrap-around to next/previous year automatically. |
| ✅ | Month/Year header is clickable | Click month to see month-picker view; click year to see year-picker. |
| ✅ | Year-range picker (decade view) | Display 10-year grid for fast year jumping. |
| ✅ | Month picker grid view | 12-month grid to jump directly to any month. |
| ✅ | Multi-month view (1–3 months) | `monthsShown: 1\|2\|3` prop. |
| ✅ | Swipe gestures on touch | Swipe left = next month; swipe right = prev month. |
| 🔲 | Infinite scroll / continuous months | Scroll vertically through months (mobile booking-style). |

---

← [Previous: Overview & Context](./01-overview.md) | [Index](./README.md) | [Next: Accessibility](./03-accessibility.md) →
