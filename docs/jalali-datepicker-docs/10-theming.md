---
title: "Theming & Customization"
section: 10
tags: [jalali, datepicker, theming, css, dark-mode, tailwind, headless]
last_updated: 2026-02
---

# Theming & Customization

> **⚠️ Implementation Status Note (audited 2026-02-26)**
>
> `pardis-jalali-datepicker` v2.x supports three built-in themes via CSS custom properties
> prefixed `--pardis-*`. The CSS variable prefix in this library is `--pardis-*`, **not** `--jdp-*`.
> Advanced customization (headless mode, render hooks, automatic dark mode, class passthrough)
> are design targets marked 🔲 below.

| ✓ | Feature | Notes |
|---|---------|-------|
| ✅ | CSS custom properties (variables) | Prefix: `--pardis-*`. Three built-in themes: Modern (default), Glass (`data-pardis-theme="glass"`), Classic (`data-pardis-theme="classic"`). Override any variable on `:root` or a scoped selector. |
| 🔲 | Zero styles by default option | Not implemented. `headless: true` — ship zero CSS; user provides all styles. |
| 🔲 | Dark mode via CSS variable | Not implemented. No `prefers-color-scheme: dark` media query in `lib/pardis-jalali-datepicker.css`. Manually override `--pardis-*` variables for a dark theme. |
| 🔲 | `className` / `class` prop passthrough | Not implemented. No option to add custom class to wrapper, input, or popup separately. |
| 🔲 | Day render prop / slot | Not implemented. Renderer is hardcoded in `PardisRenderer._renderDayView()`. Customize what's shown inside each day cell (holidays, dot markers, prices). |
| 🔲 | Footer slot / render prop | Not implemented. Footer buttons (Today, Clear, presets) are hardcoded. |
| 🔲 | Tailwind CSS preset / plugin | Not implemented. Optional: `tailwind.config.js` preset for quick Tailwind integration. |

## Current CSS Custom Properties (`--pardis-*`)

The following variables are defined in `lib/pardis-jalali-datepicker.css:5-32` and can be
overridden on any ancestor element:

| Variable | Purpose | Default (Modern theme) |
|----------|---------|------------------------|
| `--pardis-font` | Font family | Vazirmatn |
| `--pardis-bg` | Main background | `#ffffff` |
| `--pardis-bg-secondary` | Secondary background | `#f8f8f8` |
| `--pardis-text` | Primary text color | `#1a1a2e` |
| `--pardis-text-secondary` | Secondary text | `#6b7280` |
| `--pardis-text-disabled` | Disabled text | `#c4c4c4` |
| `--pardis-primary` | Accent / selection color | `#4f46e5` |
| `--pardis-primary-light` | Light accent (hover backgrounds) | `#eef2ff` |
| `--pardis-primary-hover` | Hover state | `#4338ca` |
| `--pardis-range-bg` | Range selection background | `#eef2ff` |
| `--pardis-border` | Border color | `#e5e7eb` |
| `--pardis-shadow` | Box shadow | `0 20px 60px rgba(0,0,0,0.12)` |
| `--pardis-radius` | Main border radius | `16px` |
| `--pardis-radius-sm` | Small border radius | `10px` |
| `--pardis-radius-day` | Day cell border radius | `12px` |
| `--pardis-cell-size` | Day cell size | `42px` |
| `--pardis-weekend-color` | Weekend (Friday) text color | `#ef4444` |

## Applying Themes

```html
<!-- Modern (default) — no attribute needed -->
<div id="picker"></div>

<!-- Glassmorphism -->
<body data-pardis-theme="glass">

<!-- Classic / Dark -->
<body data-pardis-theme="classic">
```

---

← [Previous: Framework Adapters](./09-framework-adapters.md) | [Index](./README.md) | [Next: Testing & Quality Gates](./11-testing.md) →
