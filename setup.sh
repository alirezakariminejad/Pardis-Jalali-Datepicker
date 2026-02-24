#!/usr/bin/env bash
set -euo pipefail

mkdir -p jalali-datepicker-docs

# --- README.md ---
cat << 'EOF' > jalali-datepicker-docs/README.md
---
title: "Persian Jalali Datepicker — Documentation Index"
section: 0
tags: [jalali, datepicker, persian, shamsi, index]
last_updated: 2025-02
---

# Persian Jalali / Shamsi Datepicker — Documentation

This documentation set covers everything needed to build, publish, and maintain a high-quality Persian Jalali (Solar Hijri / Shamsi) datepicker library for npm. It addresses calendar arithmetic, accessibility (WCAG 2.2 AA), TypeScript types, SSR compatibility, mobile UX, framework adapters, and open-source release practices.

## Table of Contents

1. [Overview & Context](./01-overview.md)
2. [Core Feature Checklist](./02-core-features.md)
3. [Accessibility (WCAG 2.2 AA)](./03-accessibility.md)
4. [Localization & i18n](./04-localization.md)
5. [TypeScript & Type Definitions](./05-typescript.md)
6. [npm Package Structure & Build](./06-package-structure.md)
7. [SSR & Framework Compatibility](./07-ssr-compatibility.md)
8. [Mobile & Touch UX](./08-mobile-touch.md)
9. [Framework Adapters](./09-framework-adapters.md)
10. [Theming & Customization](./10-theming.md)
11. [Testing & Quality Gates](./11-testing.md)
12. [npm Open Source Release Checklist](./12-release-checklist.md)
13. [Existing Library Comparison](./13-library-comparison.md)
14. [Performance Targets](./14-performance.md)
15. [Recommended API Design](./15-api-design.md)

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Required — must implement before release |
| 🔲 | Recommended — strongly advised for quality libraries |
| ⚠️ | Partial / Adapter — partial support or requires extra work |
| ❌ | Not Present — missing in referenced library |

## How to Use These Docs

**New library authors:** Start with [01-overview.md](./01-overview.md) and read sequentially through [06-package-structure.md](./06-package-structure.md). Then jump to [11-testing.md](./11-testing.md) and [12-release-checklist.md](./12-release-checklist.md) before publishing.

**Contributors:** Focus on [03-accessibility.md](./03-accessibility.md), [04-localization.md](./04-localization.md), and [11-testing.md](./11-testing.md) for quality standards.

**Evaluators / adopters:** Start with [13-library-comparison.md](./13-library-comparison.md) and [15-api-design.md](./15-api-design.md) for a quick overview of capabilities and API surface.
EOF

# --- 01-overview.md ---
cat << 'EOF' > jalali-datepicker-docs/01-overview.md
---
title: "Overview & Context"
section: 1
tags: [jalali, datepicker, persian, shamsi, overview, calendar]
last_updated: 2025-02
---

# Overview & Context

The Jalali (Solar Hijri / Shamsi) calendar is used natively in Iran and Afghanistan. Building a high-quality Jalali datepicker for npm requires solving problems that don't exist in Gregorian pickers: correct month lengths (29/30/31 days per month, with year-dependent leap rules), RTL text direction, Persian numerals (۰–۹), bidirectional text in mixed Jalali/Gregorian displays, and accessibility for Persian-speaking screen-reader users.

This guide consolidates the most requested features from the Persian developer community, current WCAG 2.2 accessibility standards, modern npm packaging practices, and mobile-first UX research into one actionable reference.

> **🌐 Calendar Key Facts**
>
> - Years: currently in 1403–1404 range (2024–2025 CE)
> - First 6 months have 31 days; next 5 months have 30 days; last month has 29 (or 30 in leap years)
> - Leap year cycle: approximately every 4 years but with 5-year gaps; use algorithmic calculation
> - Week starts Saturday (شنبه) in Persian locale — not Monday or Sunday
> - New Year (Nowruz, نوروز) is March 20/21 — a major holiday to highlight

---

[Index](./README.md) | [Next: Core Feature Checklist](./02-core-features.md) →
EOF

# --- 02-core-features.md ---
cat << 'EOF' > jalali-datepicker-docs/02-core-features.md
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
EOF

# --- 03-accessibility.md ---
cat << 'EOF' > jalali-datepicker-docs/03-accessibility.md
---
title: "Accessibility (WCAG 2.2 AA)"
section: 3
tags: [jalali, datepicker, accessibility, wcag, aria, keyboard, rtl]
last_updated: 2025-02
---

# Accessibility (WCAG 2.2 AA)

Datepickers are among the **most common accessibility failures** in web applications. The W3C WAI-ARIA Authoring Practices defines two valid patterns: **Dialog (Modal) Pattern** and **Combobox Pattern**. Either is acceptable, but you must implement the full keyboard contract.

## 3.1 Required ARIA Roles & Attributes

| ✓ | ARIA Requirement | Implementation Detail |
|---|------------------|-----------------------|
| ✅ | `role='dialog'` on popup | With `aria-modal='true'` and `aria-labelledby` pointing to month/year heading. |
| ✅ | `role='grid'` on calendar table | Each week row = `role='row'`; each day cell = `role='gridcell'`. |
| ✅ | `aria-label` on day cells | Full date string in Farsi: e.g., '۱۵ فروردین ۱۴۰۳' — not just '15'. |
| ✅ | `aria-selected` on selected date | Set `aria-selected='true'` on the active day gridcell. |
| ✅ | `aria-disabled` on disabled dates | Plus `tabindex='-1'` to remove from Tab order. |
| ✅ | `aria-live='polite'` on month heading | Announce month/year change to screen reader when navigating. |
| ✅ | `aria-describedby` on input field | Point to helper text explaining expected format (YYYY/MM/DD). |
| ✅ | `aria-expanded` on trigger button | Reflect open/closed state of the popup. |
| ✅ | Focus confirmation on date select | After dialog closes, screen reader announces selected date. |

## 3.2 Keyboard Navigation Contract

| Key | Action |
|-----|--------|
| Enter / Space | Open picker when focus is on trigger; select focused date when inside grid |
| Escape | Close picker without selecting; return focus to trigger button |
| Arrow Keys (↑↓←→) | Navigate within calendar grid (up = prev week, down = next week, left/right = prev/next day — reversed in RTL) |
| Page Up | Go to previous month |
| Page Down | Go to next month |
| Shift + Page Up | Go to previous year |
| Shift + Page Down | Go to next year |
| Home | First day of current week |
| End | Last day of current week |
| T | Jump to today |
| Tab / Shift+Tab | Move between interactive elements (prev/next buttons, input, close button) |

> **⚠️ RTL Keyboard Caveat**
>
> In RTL layouts, left arrow = forward day, right arrow = back day (opposite of LTR). Arrow direction should follow the visual reading direction, not a hardcoded LTR assumption. Always test with both `dir='rtl'` and `dir='ltr'` configurations.

## 3.3 Color & Visual Accessibility

| ✓ | Requirement | Guidance |
|---|-------------|----------|
| ✅ | 4.5:1 contrast ratio for text | Use a contrast checker. Persian text at small sizes needs strong contrast. |
| ✅ | 3:1 contrast for UI components | Borders of inputs, day cells, nav buttons. |
| ✅ | Don't rely on color alone | Disabled dates: gray + strikethrough or line-through, not just lighter color. |
| ✅ | Focus visible indicator | 2px+ solid ring in high-contrast color (CSS: `outline`). |
| ✅ | Today vs Selected visual distinction | Today = outline ring; Selected = filled background. Clearly different. |
| 🔲 | High-contrast mode / forced colors | Test with Windows High Contrast Mode; use CSS `forced-colors` media query. |
| 🔲 | Dark mode support | `prefers-color-scheme: dark` CSS media query or prop-based theming. |

---

← [Previous: Core Feature Checklist](./02-core-features.md) | [Index](./README.md) | [Next: Localization & i18n](./04-localization.md) →
EOF

# --- 04-localization.md ---
cat << 'EOF' > jalali-datepicker-docs/04-localization.md
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
EOF

# --- 05-typescript.md ---
cat << 'EOF' > jalali-datepicker-docs/05-typescript.md
---
title: "TypeScript & Type Definitions"
section: 5
tags: [jalali, datepicker, typescript, types, tsconfig]
last_updated: 2025-02
---

# TypeScript & Type Definitions

First-class TypeScript support is no longer optional for npm packages targeting 2024–2025. Users expect IntelliSense, proper overloads, and strict mode compatibility.

| ✓ | Requirement | Notes |
|---|-------------|-------|
| ✅ | Library written in TypeScript | Source in `.ts`; publish compiled `.js` + `.d.ts` files. |
| ✅ | `types` field in package.json | `"types": "./dist/index.d.ts"` |
| ✅ | Strict mode compatible | tsconfig: `strict: true` — no `any` leakage. |
| ✅ | `JalaliDate` type exported | Interface with `{ year, month, day }` + ISO string helper. |
| ✅ | `DateRange` type exported | `{ start: JalaliDate \| null; end: JalaliDate \| null }` |
| ✅ | Props/Options fully typed | All config objects typed; avoid `Record<string, any>`. |
| ✅ | Event callback types | `onSelect: (date: JalaliDate) => void; onChange: (range: DateRange) => void` |
| ✅ | Generic locale type | `Locale<T extends string>` for extensible locale keys. |
| 🔲 | JSDoc + d.ts for JS users | Non-TS users get autocomplete via JSDoc `@type` annotations. |

## 5.1 Recommended tsconfig.json Settings

| Setting | Recommended Value |
|---------|-------------------|
| `"strict"` | `true` |
| `"target"` | `"ES2017"` |
| `"module"` | `"ESNext"` |
| `"moduleResolution"` | `"bundler"` |
| `"declaration"` | `true` |
| `"declarationMap"` | `true` |
| `"sourceMap"` | `true` |
| `"noUncheckedIndexedAccess"` | `true` |

---

← [Previous: Localization & i18n](./04-localization.md) | [Index](./README.md) | [Next: npm Package Structure & Build](./06-package-structure.md) →
EOF

# --- 06-package-structure.md ---
cat << 'EOF' > jalali-datepicker-docs/06-package-structure.md
---
title: "npm Package Structure & Build"
section: 6
tags: [jalali, datepicker, npm, package, build, esm, cjs, tsup]
last_updated: 2025-02
---

# npm Package Structure & Build

## 6.1 Module Formats

Modern packages must support both ESM and CJS to avoid breaking Next.js, Remix, Nuxt, and legacy toolchains simultaneously.

| ✓ | Requirement | Notes |
|---|-------------|-------|
| ✅ | ESM build (`dist/index.mjs`) | Primary format. `import { DatePicker } from 'your-lib'` |
| ✅ | CJS build (`dist/index.cjs`) | For Jest, legacy toolchains, `require()` environments. |
| ✅ | UMD/IIFE browser build | For CDN usage; expose global `window.JalaliDatepicker`. |
| ✅ | `package.json` exports map | `"exports": { ".": { "import": ..., "require": ... } }` |
| ✅ | `sideEffects: false` | Enable tree-shaking. Mark CSS imports as side effects. |
| ✅ | `tsup` as build tool | Handles ESM+CJS+`.d.ts` in one config; fastest for libraries. |

## 6.2 Recommended package.json Fields

| Field | Value |
|-------|-------|
| `"main"` | `"./dist/index.cjs"` |
| `"module"` | `"./dist/index.mjs"` |
| `"types"` | `"./dist/index.d.ts"` |
| `"exports"` | Full exports map (see above) |
| `"files"` | `["dist", "README.md", "LICENSE"]` |
| `"sideEffects"` | `["**/*.css"]` |
| `"peerDependencies"` | React (if applicable): `>=17.0.0` |
| `"engines"` | `{"node": ">=16.0.0"}` |
| `"keywords"` | `jalali, shamsi, datepicker, persian, farsi, jalaali, solar-hijri` |

---

← [Previous: TypeScript & Type Definitions](./05-typescript.md) | [Index](./README.md) | [Next: SSR & Framework Compatibility](./07-ssr-compatibility.md) →
EOF

# --- 07-ssr-compatibility.md ---
cat << 'EOF' > jalali-datepicker-docs/07-ssr-compatibility.md
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
EOF

# --- 08-mobile-touch.md ---
cat << 'EOF' > jalali-datepicker-docs/08-mobile-touch.md
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
EOF

# --- 09-framework-adapters.md ---
cat << 'EOF' > jalali-datepicker-docs/09-framework-adapters.md
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
EOF

# --- 10-theming.md ---
cat << 'EOF' > jalali-datepicker-docs/10-theming.md
---
title: "Theming & Customization"
section: 10
tags: [jalali, datepicker, theming, css, dark-mode, tailwind, headless]
last_updated: 2025-02
---

# Theming & Customization

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | CSS custom properties (variables) | `--jdp-primary`, `--jdp-bg`, `--jdp-text`, etc. Full list in docs. |
| ✅ | Zero styles by default option | `headless: true` — ship zero CSS; user provides all styles. |
| ✅ | Dark mode via CSS variable | Respond to `prefers-color-scheme` or a `data-theme` attribute. |
| ✅ | `className` / `class` prop passthrough | Add custom class to wrapper, input, popup separately. |
| ✅ | Day render prop / slot | Customize what's shown inside each day cell (holidays, dot markers, prices). |
| ✅ | Footer slot / render prop | Custom content at bottom of picker (e.g., holiday list, time picker). |
| 🔲 | Tailwind CSS preset / plugin | Optional: `tailwind.config.js` preset for quick Tailwind integration. |

---

← [Previous: Framework Adapters](./09-framework-adapters.md) | [Index](./README.md) | [Next: Testing & Quality Gates](./11-testing.md) →
EOF

# --- 11-testing.md ---
cat << 'EOF' > jalali-datepicker-docs/11-testing.md
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
EOF

# --- 12-release-checklist.md ---
cat << 'EOF' > jalali-datepicker-docs/12-release-checklist.md
---
title: "npm Open Source Release Checklist"
section: 12
tags: [jalali, datepicker, release, npm, ci-cd, changelog, semver]
last_updated: 2025-02
---

# npm Open Source Release Checklist

## 12.1 Before First Public Release

| ✓ | Item | Details |
|---|------|---------|
| 🔲 | Semantic Versioning from 1.0.0 | Use 0.x.x for beta; graduate to 1.0.0 when API is stable. |
| 🔲 | CHANGELOG.md (Keep a Changelog format) | Document every release. Use conventional commits + auto-generation. |
| 🔲 | LICENSE file (MIT recommended) | Confirm attribution requirements. MIT is most permissive. |
| 🔲 | README with: demo link, install, API table, examples | In both English and Farsi sections ideally. |
| 🔲 | CodeSandbox / StackBlitz live demo | Embed interactive demo. Dramatically increases adoption. |
| 🔲 | GitHub Discussions enabled | Better for support than Issues; keep Issues for bugs only. |
| 🔲 | CONTRIBUTING.md & CODE_OF_CONDUCT.md | Define how to submit PRs, run tests, report bugs. |
| 🔲 | npm tag: latest vs next | Publish betas with `--tag next` so they don't break installs. |

## 12.2 CI/CD & Automation

| ✓ | Item | Tool |
|---|------|------|
| 🔲 | GitHub Actions: test on push/PR | Matrix: node 18, 20, 22. OS: ubuntu, windows, macos. |
| 🔲 | Automated release via changesets | `@changesets/action`; generates CHANGELOG, bumps version, publishes. |
| 🔲 | Bundle size budget in CI | `size-limit`; fail build if bundle exceeds threshold. |
| 🔲 | Dependabot / Renovate | Auto PR for dependency updates; review weekly. |
| 🔲 | Provenance attestation (npm) | `npm publish --provenance` (requires GitHub Actions) for supply chain security. |
| 🔲 | Branch protection: require CI green | No direct push to main; require PR + passing tests. |

---

← [Previous: Testing & Quality Gates](./11-testing.md) | [Index](./README.md) | [Next: Existing Library Comparison](./13-library-comparison.md) →
EOF

# --- 13-library-comparison.md ---
cat << 'EOF' > jalali-datepicker-docs/13-library-comparison.md
---
title: "Existing Library Comparison"
section: 13
tags: [jalali, datepicker, comparison, libraries, ecosystem]
last_updated: 2025-02
---

# Existing Library Comparison

Understanding what other libraries do (and don't do) helps you differentiate your library and avoid reinventing solved problems.

| Library | TS | A11y | Range | SSR | Notes |
|---------|----|------|-------|-----|-------|
| persian.datepicker (pwt) | ❌ | ❌ | ❌ | ❌ | jQuery; oldest; widely used but outdated |
| majidh1/JalaliDatePicker | ⚠️ | ⚠️ | ❌ | ❌ | Vanilla JS; no deps; lightweight; limited a11y |
| jalali-react-datepicker | ⚠️ | ❌ | ✅ | ❌ | Unmaintained; has range picker |
| noa-jalali-datepicker | ✅ | ⚠️ | ❌ | ⚠️ | React + Tailwind; modern but early-stage |
| react-datepicker (Gregorian) | ✅ | ✅ | ✅ | ✅ | Best-in-class DX; no Jalali support |
| React Day Picker v9 | ✅ | ✅ | ✅ | ✅ | Headless; best accessibility; no Jalali locale |
| Your Library 🎯 | ✅ | ✅ | ✅ | ✅ | The gap to fill: all the above + native Jalali |

> **🎯 Differentiation Opportunity**
>
> No existing Jalali datepicker combines ALL of: full TypeScript types, WCAG 2.2 AA accessibility, date range picker, SSR safety, zero-dependency core, and modern framework adapters (React 19, Vue 3, Next.js App Router). This is the gap your library can fill.

---

← [Previous: npm Open Source Release Checklist](./12-release-checklist.md) | [Index](./README.md) | [Next: Performance Targets](./14-performance.md) →
EOF

# --- 14-performance.md ---
cat << 'EOF' > jalali-datepicker-docs/14-performance.md
---
title: "Performance Targets"
section: 14
tags: [jalali, datepicker, performance, bundle-size, benchmarks]
last_updated: 2025-02
---

# Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Bundle size (core, gzipped) | < 15 kB | bundlephobia.com / size-limit |
| Bundle size (full React adapter) | < 30 kB | size-limit --bundle |
| Jalali → Gregorian conversion | < 0.01ms | Benchmark with vitest bench() |
| Initial render (calendar popup) | < 16ms | Chrome DevTools perf trace |
| Month navigation (paint) | < 16ms (60fps) | requestAnimationFrame-bounded |
| SSR render (one calendar month) | < 5ms | Node.js benchmark |
| Zero peer dependencies (core) | 0 deps | npm ls / depcheck |

---

← [Previous: Existing Library Comparison](./13-library-comparison.md) | [Index](./README.md) | [Next: Recommended API Design](./15-api-design.md) →
EOF

# --- 15-api-design.md ---
cat << 'EOF' > jalali-datepicker-docs/15-api-design.md
---
title: "Recommended API Design (Reference)"
section: 15
tags: [jalali, datepicker, api, props, typescript, design]
last_updated: 2025-02
---

# Recommended API Design (Reference)

This is a suggested prop/option surface. Adjust to your framework's conventions.

| Prop / Option | Type | Description |
|---------------|------|-------------|
| `value` | `JalaliDate \| null` | Controlled selected date |
| `defaultValue` | `JalaliDate \| null` | Uncontrolled initial value |
| `onChange` | `(d: JalaliDate) => void` | Called on date selection |
| `range` | `boolean` | Enable date range mode |
| `rangeValue` | `DateRange` | `{ start, end }` for range mode |
| `minDate` / `maxDate` | `JalaliDate` | Constraint bounds |
| `disabledDates` | `JalaliDate[] \| Fn` | Disable specific dates |
| `highlightedDates` | `{ date, className }[]` | Custom day highlights |
| `locale` | `Locale` | i18n config object |
| `numeralType` | `'persian' \| 'latin'` | Digit display style |
| `monthsShown` | `1 \| 2 \| 3` | Number of months rendered |
| `inline` | `boolean` | Render calendar always visible |
| `readOnly` | `boolean` | Disable interaction |
| `renderDay` | `(opts) => ReactNode` | Custom day cell renderer |
| `inputFormat` | `string` | e.g., `'YYYY/MM/DD'`, `'jYYYY-jMM-jDD'` |
| `allowNativeInput` | `boolean` | Use `<input type='date'>` on mobile |
| `firstDayOfWeek` | `0–6` | `6` = Saturday (Jalali default) |

---

*Legend: ✅ Required · 🔲 Recommended · ⚠️ Partial/Adapter · ❌ Not Present*

---

← [Previous: Performance Targets](./14-performance.md) | [Index](./README.md)
EOF

chmod +x setup.sh

echo "✅ jalali-datepicker-docs/ created with 16 files."
