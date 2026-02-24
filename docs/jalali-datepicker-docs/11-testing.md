---
title: "Testing & Quality Gates"
section: 11
tags: [jalali, datepicker, testing, unit-tests, accessibility, playwright, vitest]
last_updated: 2025-02
---

# Testing & Quality Gates

## 11.1 Unit Tests

| ✓ | Test Area | Must Cover |
|---|-----------|------------|
| ✅ | Jalali ↔ Gregorian conversion | 100+ known date pairs. Include Nowruz boundary, leap years. |
| ✅ | Leap year detection | Test all 8 leap years per 33-year cycle. |
| ✅ | Month length (all 12 months) | Both leap and non-leap variants for Esfand. |
| ✅ | minDate / maxDate enforcement | Attempt to select disabled dates; verify rejection. |
| ✅ | Date range validation | start > end protection; max range enforcement. |
| ✅ | Input parsing & normalization | Arabic digits, mixed numerals, various separators (/ - .). |
| ✅ | SSR (Node.js) execution | Run calendar engine tests in Node — no browser globals. |

## 11.2 Integration & Accessibility Tests

| ✓ | Test | Tool |
|---|------|------|
| ✅ | Keyboard navigation (full Tab/Arrow contract) | Playwright or Cypress keyboard simulation tests. |
| ✅ | Automated ARIA / WCAG violations | axe-core (`jest-axe` or `@axe-core/playwright`). |
| ✅ | Screen reader announcement test | NVDA+Firefox, VoiceOver+Safari — manual + automated. |
| ✅ | RTL visual regression test | Screenshot comparison: `dir='rtl'` vs `dir='ltr'`. |
| ✅ | Mobile viewport touch tests | Playwright device emulation: iPhone 14, Pixel 7. |
| 🔲 | Bundle size check in CI | `bundlesize` or `size-limit`; set limit e.g. < 25 kB gzipped. |

---

← [Previous: Theming & Customization](./10-theming.md) | [Index](./README.md) | [Next: npm Open Source Release Checklist](./12-release-checklist.md) →
