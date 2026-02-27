---
title: "Mobile & Touch UX"
section: 8
tags: [jalali, datepicker, mobile, touch, responsive, ux]
last_updated: 2026-02
---

# Mobile & Touch UX

Over 60% of Iranian internet usage is mobile. A Persian datepicker that works poorly on touch will be abandoned immediately.

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | Touch target minimum 44×44px | Per WCAG 2.5.5. Day cells must be at least 44px on mobile. |
| ✅ | Swipe month navigation | Touch swipe left/right changes month; use pointer events API. |
| ⚠️ | Bottom sheet on mobile | CSS structure present (`.pardis-bottom-sheet`, `.pardis-overlay`, `.pardis-sheet-handle` in `lib/pardis-jalali-datepicker.css:161-206`); JS activation not yet wired. The `mobileMode` constructor option has been removed (v2.1.0) pending proper implementation. |
| ✅ | Max 6 taps to any date | Industry standard: selecting a date should never require > 6 taps. |
| ✅ | Responsive: single month on mobile | Calendar becomes full-width at `max-width: 480px` via CSS media query (`lib/pardis-jalali-datepicker.css:570-575`). Only single-month view is implemented. |
| ✅ | No hover-only interactions | Hover effects are enhancement-only; all actions work by tap. |
| ✅ | Portrait and landscape modes | Test rotation; popup should not overflow or clip. |
| 🔲 | Native input fallback option | Not implemented. `allowNativeInput: true` — use `<input type='date'>` on mobile if preferred. |
| 🔲 | Haptic feedback hint | Dispatch a subtle vibration via `navigator.vibrate(10)` on day select (opt-in). |

---

← [Previous: SSR & Framework Compatibility](./07-ssr-compatibility.md) | [Index](./README.md) | [Next: Framework Adapters](./09-framework-adapters.md) →
