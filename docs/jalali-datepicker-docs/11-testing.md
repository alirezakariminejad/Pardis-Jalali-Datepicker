---
title: "Testing & Quality Gates"
section: 11
tags: [jalali, datepicker, testing, unit-tests, accessibility, playwright, vitest]
last_updated: 2026-02
---

# Testing & Quality Gates

> **⚠️ Implementation Status Note (audited 2026-02-26)**
>
> `pardis-jalali-datepicker` v2.x has **one test script**: `scripts/year-boundary-test.js`
> (65 lines), which verifies navigation clamping at `MIN_YEAR=1` and `MAX_YEAR=3177`.
> No test framework (Vitest, Jest, Playwright, Cypress) is installed in the repository.
> All items below except year boundary clamping are targets for Phase 3 of `Execution-Plan.md`.

## 11.1 Unit Tests

| ✓ | Test Area | Must Cover |
|---|-----------|------------|
| ✅ | Year boundary clamping | `scripts/year-boundary-test.js` — navigation clamping at `MIN_YEAR=1`, `MAX_YEAR=3177`. Spam tests for prev/next year/month/decade. |
| 🔲 | Jalali ↔ Gregorian conversion | 100+ known date pairs. Include Nowruz boundary, all 12 months, leap years (1399, 1400, 1403). |
| 🔲 | Leap year detection | Test all 8 leap years per 33-year cycle using `isLeapJalaaliYear()`. |
| 🔲 | Month length (all 12 months) | Both leap and non-leap variants for Esfand using `jalaaliMonthLength()`. |
| 🔲 | minDate / maxDate enforcement | Attempt to select disabled dates via `selectDate()`; verify rejection. |
| 🔲 | Date range validation | start > end auto-swap; `maxRange` enforcement rejection. |
| 🔲 | Input parsing & normalization | Persian digits, Latin digits, mixed input, various separators (/ - .). |
| 🔲 | Engine preset ranges | All four: `thisWeek`, `thisMonth`, `last7Days`, `last30Days`. Verify aliases `last7`/`last30` also work. |
| 🔲 | SSR (Node.js) execution | Run `JalaaliUtil` and `PardisEngine` static helper tests in Node — no browser globals. |

## 11.2 Integration & Accessibility Tests

| ✓ | Test | Tool |
|---|------|------|
| 🔲 | Keyboard navigation (full Tab/Arrow contract) | Playwright or Cypress keyboard simulation. |
| 🔲 | Automated ARIA / WCAG violations | axe-core (`jest-axe` or `@axe-core/playwright`). |
| 🔲 | Screen reader announcement test | NVDA+Firefox, VoiceOver+Safari — manual + automated. |
| 🔲 | RTL visual regression test | Screenshot comparison: `dir='rtl'` vs `dir='ltr'`. |
| 🔲 | Mobile viewport touch tests | Playwright device emulation: iPhone 14, Pixel 7. |
| 🔲 | Bundle size check in CI | `bundlesize` or `size-limit`; target < 15 kB gzipped (per `14-performance.md`). |

---

← [Previous: Theming & Customization](./10-theming.md) | [Index](./README.md) | [Next: npm Open Source Release Checklist](./12-release-checklist.md) →
