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
