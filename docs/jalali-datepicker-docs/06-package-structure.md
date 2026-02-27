---
title: "npm Package Structure & Build"
section: 6
tags: [jalali, datepicker, npm, package, build, esm, cjs, tsup]
last_updated: 2026-02
---

# npm Package Structure & Build

## 6.1 Module Formats

Modern packages must support both ESM and CJS to avoid breaking Next.js, Remix, Nuxt, and legacy toolchains simultaneously.

| ✓ | Requirement | Notes |
|---|-------------|-------|
| ✅ | ESM build (`dist/index.mjs`) | Primary format. `import { DatePicker } from 'your-lib'` |
| ✅ | CJS build (`dist/index.cjs`) | For Jest, legacy toolchains, `require()` environments. |
| ✅ | UMD/IIFE browser build | For CDN usage; expose global `window.PardisJalaliDatepicker`. Destructure: `const { PardisDatepicker } = PardisJalaliDatepicker`. |
| ✅ | `package.json` exports map | `"exports": { ".": { "import": ..., "require": ... } }` |
| ✅ | `sideEffects: ["**/*.css"]` | Enables tree-shaking for JS; marks CSS imports as side-effect-bearing (correct — prevents bundlers from dropping CSS). |
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
