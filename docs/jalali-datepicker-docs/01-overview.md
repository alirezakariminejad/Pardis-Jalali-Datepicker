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
