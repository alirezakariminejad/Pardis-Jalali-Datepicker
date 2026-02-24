---
title: "SSR & Framework Compatibility"
section: 7
tags: [jalali, datepicker, ssr, nextjs, nuxt, remix, node]
last_updated: 2025-02
---

# SSR & Framework Compatibility

Persian apps increasingly use Next.js App Router, Nuxt, or Remix. Your library must not crash on the server, where there is no `window`, `document`, or DOM.

| ✓ | Requirement | Notes |
|---|-------------|-------|
| ✅ | No `window`/`document` at module load | Guard: `if (typeof window !== 'undefined')`. Never top-level DOM access. |
| ✅ | No direct event listener at import | All DOM setup inside component lifecycle (`useEffect` / `onMounted`). |
| ✅ | Date calculation works in Node.js | Jalali ↔ Gregorian math must work without browser APIs. |
| ✅ | Hydration-safe | Avoid server/client mismatch; use controlled state for selected date. |
| ✅ | Next.js App Router compatible | `'use client'` directive in React component wrappers. |
| ✅ | Tested with Vitest (SSR mode) | Run tests in `jsdom` AND in `node` environment. |
| 🔲 | Nuxt 3 composable / plugin | Provide a `useJalaliDatepicker()` composable for Vue/Nuxt. |

---

← [Previous: npm Package Structure & Build](./06-package-structure.md) | [Index](./README.md) | [Next: Mobile & Touch UX](./08-mobile-touch.md) →
