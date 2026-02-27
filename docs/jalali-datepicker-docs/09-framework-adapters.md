---
title: "Framework Adapters"
section: 9
tags: [jalali, datepicker, react, vue, angular, nextjs, svelte, vanilla]
last_updated: 2026-02
---

# Framework Adapters

Provide a framework-agnostic core and thin adapters for React, Vue, and Angular. Vanilla JS should work as a first-class citizen.

> **⚠️ Implementation Status Note (audited 2026-02-26)**
>
> `pardis-jalali-datepicker` v2.x is a **Vanilla JavaScript library only**. No framework adapters,
> Web Component wrapper, or React/Vue/Angular packages exist in the repository. All entries below
> except "Vanilla JS" are design targets for future releases (see Track C in `Execution-Plan.md`).

| Framework | Status | Key Considerations |
|-----------|--------|---------------------|
| Vanilla JS | ✅ Implemented | Zero dependencies; instantiate with `new PardisDatepicker(selector, options)`. |
| Web Component (`<jalali-datepicker>`) | 🔲 Planned | No `customElements.define()` exists yet. Wrap core in an HTMLElement class. |
| React (17, 18, 19) | 🔲 Planned | Controlled & uncontrolled patterns; `forwardRef`; React.StrictMode safe. |
| Vue 3 (Composition API) | 🔲 Planned | `v-model` support; `provide`/`inject` for global config. |
| Angular (14+) | 🔲 Planned | `DateAdapter` pattern; works with Angular Material or standalone. |
| Next.js 13–15 (App Router) | 🔲 Planned | Requires `'use client'` wrapper and window guard; see `07-ssr-compatibility.md`. |
| Nuxt 3 | 🔲 Planned | Client-only component or plugin registration. |
| Svelte 4/5 | 🔲 Optional | Reactive store integration; `bind:value` directive. |

---

← [Previous: Mobile & Touch UX](./08-mobile-touch.md) | [Index](./README.md) | [Next: Theming & Customization](./10-theming.md) →
