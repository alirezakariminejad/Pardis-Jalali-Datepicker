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
