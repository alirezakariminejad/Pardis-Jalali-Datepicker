---
title: "SSR & Framework Compatibility"
section: 7
tags: [jalali, datepicker, ssr, nextjs, nuxt, remix, node]
last_updated: 2026-02
---

# SSR & Framework Compatibility

Persian apps increasingly use Next.js App Router, Nuxt, or Remix. Your library must not crash on the server, where there is no `window`, `document`, or DOM.

> **⚠️ Implementation Status Note (audited 2026-02-26)**
>
> `pardis-jalali-datepicker` v2.x is **not SSR-safe**. The `PardisDatepicker` constructor calls
> `document.querySelector()`, `document.createElement()`, and `document.addEventListener()`
> directly (`lib/pardis-jalali-datepicker.js:1113, 1150, 1263`). Instantiating the picker in a
> server-side environment (Next.js, Nuxt, Remix) will throw `"document is not defined"`.
>
> **What does work server-side:** `JalaaliUtil` math functions (`toJalaali`, `toGregorian`,
> `isLeapJalaaliYear`, `jalaaliMonthLength`) are pure JavaScript with no DOM dependency and
> are safe to import and run in Node.js. Similarly, `PardisEngine.buildDatePayload()` is
> safe server-side.
>
> Items marked 🔲 are design targets to achieve SSR safety in a future release.

| ✓ | Requirement | Notes |
|---|-------------|-------|
| ✅ | Date calculation works in Node.js | `JalaaliUtil` and `PardisEngine` static helpers are pure JS — no browser APIs required. Safe to use in SSR for date math. |
| ⚠️ | No `window`/`document` at module load | Module-level code does not call DOM APIs (safe at import time). However, the `PardisDatepicker` constructor calls DOM APIs immediately — it must not be instantiated during SSR. Add `if (typeof window !== 'undefined')` guard before instantiation in consuming code. |
| 🔲 | No direct event listener at import | Target state: all DOM setup inside component lifecycle (`useEffect` / `onMounted`). Currently DOM setup is in the constructor. |
| 🔲 | Hydration-safe | Not implemented. DOM is imperatively created in constructor; no controlled-state hydration pattern exists. |
| 🔲 | Next.js App Router compatible | Not yet validated. Requires a `'use client'` wrapper component and a constructor-level window guard. |
| 🔲 | Tested with Vitest (SSR mode) | Not implemented. No Vitest configuration or test files exist in the repository. |
| 🔲 | Nuxt 3 composable / plugin | Not implemented. Provide a `useJalaliDatepicker()` composable for Vue/Nuxt. |

---

← [Previous: npm Package Structure & Build](./06-package-structure.md) | [Index](./README.md) | [Next: Mobile & Touch UX](./08-mobile-touch.md) →
