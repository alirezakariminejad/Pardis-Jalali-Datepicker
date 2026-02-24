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
