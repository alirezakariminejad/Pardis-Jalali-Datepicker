---
title: "Mobile & Touch UX"
section: 8
tags: [jalali, datepicker, mobile, touch, responsive, ux]
last_updated: 2025-02
---

# Mobile & Touch UX

Over 60% of Iranian internet usage is mobile. A Persian datepicker that works poorly on touch will be abandoned immediately.

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | Touch target minimum 44×44px | Per WCAG 2.5.5. Day cells must be at least 44px on mobile. |
| ✅ | Swipe month navigation | Touch swipe left/right changes month; use pointer events API. |
| ✅ | Bottom sheet on mobile | Open as bottom sheet drawer on viewport < 768px. |
| ✅ | Max 6 taps to any date | Industry standard: selecting a date should never require > 6 taps. |
| ✅ | Responsive: single month on mobile | Dual-month view collapses to single month on narrow screens. |
| ✅ | No hover-only interactions | Hover effects are enhancement-only; all actions work by tap. |
| ✅ | Portrait and landscape modes | Test rotation; popup should not overflow or clip. |
| ✅ | Native input fallback option | `allowNativeInput: true` — use `<input type='date'>` on mobile if preferred. |
| 🔲 | Haptic feedback hint | Dispatch a subtle vibration via `navigator.vibrate(10)` on day select (opt-in). |

---

← [Previous: SSR & Framework Compatibility](./07-ssr-compatibility.md) | [Index](./README.md) | [Next: Framework Adapters](./09-framework-adapters.md) →
