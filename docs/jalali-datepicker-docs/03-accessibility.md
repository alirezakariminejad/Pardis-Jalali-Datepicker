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
