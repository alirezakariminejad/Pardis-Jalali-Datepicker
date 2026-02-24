---
title: "Framework Adapters"
section: 9
tags: [jalali, datepicker, react, vue, angular, nextjs, svelte, vanilla]
last_updated: 2025-02
---

# Framework Adapters

Provide a framework-agnostic core and thin adapters for React, Vue, and Angular. Vanilla JS should work as a first-class citizen.

| Framework | Status Target | Key Considerations |
|-----------|---------------|---------------------|
| Vanilla JS / Web Component | ✅ Primary | Zero dependencies; custom element `<jalali-datepicker>` |
| React (17, 18, 19) | ✅ Primary | Controlled & uncontrolled patterns; `forwardRef`; React.StrictMode safe |
| Vue 3 (Composition API) | ✅ Primary | `v-model` support; `provide`/`inject` for global config |
| Angular (14+) | ⚠️ Adapter | `DateAdapter` pattern; works with Angular Material or standalone |
| Next.js 13–15 (App Router) | ✅ Must Pass | `'use client'` wrapper; dynamic import for SSR safety |
| Nuxt 3 | ⚠️ Adapter | Client-only component or plugin registration |
| Svelte 4/5 | 🔲 Optional | Reactive store integration; `bind:value` directive |

---

← [Previous: Mobile & Touch UX](./08-mobile-touch.md) | [Index](./README.md) | [Next: Theming & Customization](./10-theming.md) →
