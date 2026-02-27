---
title: "Persian Jalali Datepicker — Documentation Index"
section: 0
tags: [jalali, datepicker, persian, shamsi, index]
last_updated: 2026-02
---

# Persian Jalali / Shamsi Datepicker — Documentation

> **⚠️ IMPORTANT — Design Reference, Not Current State**
>
> The documents in this directory (`docs/jalali-datepicker-docs/`) were written as a **design
> specification and reference target** for a high-quality Jalali datepicker library. They describe
> what a complete library *should* implement, not necessarily what `pardis-jalali-datepicker` v2.x
> currently implements.
>
> **For accurate information about the current library**, refer to:
> - [`README.md`](../../README.md) — authoritative API reference and feature list
> - [`CHANGELOG.md`](../../CHANGELOG.md) — history of what has actually been implemented
> - [`docs/Documentation-vs-Implementation-Audit-Report.md`](../Documentation-vs-Implementation-Audit-Report.md) — full gap analysis (alignment score: 42/100 at v2.0.1)
>
> Items marked ✅ in individual files reflect *design requirements*, not confirmed implementation.
> Items that were incorrectly marked ✅ have been corrected to 🔲 or ⚠️ as of 2026-02-26.
> See [`docs/Execution-Plan.md`](../Execution-Plan.md) for the roadmap to close the gaps.

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
