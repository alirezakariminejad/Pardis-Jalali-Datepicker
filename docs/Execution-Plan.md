# Pardis Jalali Datepicker — Execution Plan
## Based on Documentation-vs-Implementation Audit Report (2026-02-26)

> **Source of truth:** `docs/Documentation-vs-Implementation-Audit-Report.md`
> **Library version at audit:** 2.0.1
> **Alignment score at audit:** 42 / 100

---

# 1. Strategic Summary

## Current Maturity Level

**Medium** — The calendar engine, date arithmetic, range selection, keyboard navigation, theming, and build pipeline are production-quality (Maturity Level 1). However, `docs/jalali-datepicker-docs/` functions as a design specification written in future tense, not an accurate description of the current library. It claims ~96 features as ✅ implemented; code evidence confirms approximately 40 of those claims.

## Core Misalignment Themes

| Theme | Severity |
|---|---|
| `docs/jalali-datepicker-docs/` claims unimplemented features as ✅ | **Critical** |
| CSS variable prefix mismatch: `--pardis-*` (code) vs `--jdp-*` (theming docs) | **High** |
| IIFE global name mismatch: `window.PardisJalaliDatepicker` (code) vs `window.JalaliDatepicker` (package-structure docs) | **High** |
| Test coverage: 1 script (65 lines) vs docs claiming 12+ test categories as ✅ | **High** |
| `mobileMode` option is accepted by the constructor and declared in TypeScript but does nothing | **Medium** |
| `05-typescript.md` states "Library written in TypeScript" — library is vanilla JS with hand-authored `.d.ts` | **Medium** |
| `docs/jalali-datepicker-docs/07-ssr-compatibility.md` claims SSR safety — library directly calls `document.*` in constructor | **Medium** |

## Estimated Effort Level

| Work Area | Effort |
|---|---|
| Phase 0 — Critical doc corrections | **Low** (no code changes) |
| Phase 1 — TypeScript / API minor fixes | **Low** |
| Phase 2 — ARIA attribute code audit | **Low–Medium** |
| Phase 3 — Real test suite | **Medium** |
| Phase 4 — CI/automation | **Low–Medium** |
| Track B — Feature completion (bottom sheet, dark mode) | **Medium–High** |
| Track C — Ecosystem (adapters, headless, Web Component) | **High** |

---

# 2. Phase-Based Execution Plan

---

## Phase 0 — Critical Documentation Corrections

**Objective:** Remove all false ✅ claims from `docs/jalali-datepicker-docs/`. This is the highest-priority action because false documentation actively misleads adopters.

**Risk Level:** Low (documentation-only changes; no code touched)
**Estimated Complexity:** Low
**Impact Level:** Critical

---

### Task 0.1 — Reclassify unimplemented features in `docs/jalali-datepicker-docs/`

**What:** Replace every ✅ marker on an unimplemented feature with the appropriate 🔲 (roadmap) or remove the claim entirely. The legend in `docs/jalali-datepicker-docs/README.md` defines ✅ as "Required — must implement before release." Every ✅ item below is falsely declared.

**Why:** Audit section 3 identifies 8 groups of features claimed as ✅ with zero implementation evidence. Using these docs as consumer-facing documentation would cause direct failures for adopters.

**Type:** Documentation Update

**Files affected:**

| File | False ✅ claims to correct |
|---|---|
| `docs/jalali-datepicker-docs/04-localization.md` | `locale` prop, en-US locale, `numeralType: 'arabic'`, RTL/LTR auto, pluggable locale system |
| `docs/jalali-datepicker-docs/07-ssr-compatibility.md` | "No `window`/`document` at module load", "Hydration-safe", "Tested with Vitest (SSR mode)" |
| `docs/jalali-datepicker-docs/08-mobile-touch.md` | Bottom sheet on viewport < 768px, `allowNativeInput: true` |
| `docs/jalali-datepicker-docs/09-framework-adapters.md` | React adapter (v17/18/19), Vue 3 adapter, Next.js adapter, Web Component `<jalali-datepicker>` |
| `docs/jalali-datepicker-docs/10-theming.md` | `headless: true`, `renderDay` prop, footer slot, `className` passthrough, dark mode via `prefers-color-scheme` |
| `docs/jalali-datepicker-docs/02-core-features.md` | Dual-month view for ranges, `monthsShown: 1\|2\|3` |
| `docs/jalali-datepicker-docs/11-testing.md` | 100+ conversion test pairs, keyboard nav tests, axe-core ARIA tests, screen-reader tests, RTL visual regression, mobile viewport tests |
| `docs/jalali-datepicker-docs/03-accessibility.md` | `aria-live="polite"` on month heading, `aria-describedby` on input, `aria-expanded` on trigger button |

---

### Task 0.2 — Fix CSS variable prefix in theming docs

**What:** Replace every instance of `--jdp-*` with `--pardis-*` in `10-theming.md`.

**Why:** Audit finding (Main Risks, Severity High): `10-theming.md` documents `--jdp-primary`, `--jdp-bg`, `--jdp-text`, etc. The actual CSS file (`lib/pardis-jalali-datepicker.css:5-32`) defines `--pardis-*` variables exclusively. A developer reading the theming docs and trying to override variables will get no result.

**Type:** Documentation Update

**Files affected:**
- `docs/jalali-datepicker-docs/10-theming.md` — replace all `--jdp-*` occurrences with the correct `--pardis-*` equivalents

---

### Task 0.3 — Fix IIFE global name in package-structure docs

**What:** Replace `window.JalaliDatepicker` with `window.PardisJalaliDatepicker` in `06-package-structure.md`.

**Why:** Audit finding (Main Risks, Severity High): `06-package-structure.md` states the UMD/IIFE global is `window.JalaliDatepicker`. The actual `tsup.config.mjs` sets `globalName: 'PardisJalaliDatepicker'`, confirmed by `dist/index.global.js` and README.

**Type:** Documentation Update

**Files affected:**
- `docs/jalali-datepicker-docs/06-package-structure.md` — update global name and all usage examples

---

### Task 0.4 — Correct the TypeScript language claim

**What:** Replace "Library written in TypeScript" in `05-typescript.md` with accurate wording such as: "Library source is vanilla JavaScript with hand-authored TypeScript declarations (`.d.ts`), providing full IntelliSense without requiring TypeScript to be installed."

**Why:** Audit finding (Main Risks, Severity Medium): `05-typescript.md` line 14 claims "Library written in TypeScript." The source (`lib/pardis-jalali-datepicker.js`) is pure JavaScript. The build script (`package.json`) copies `lib/pardis-jalali-datepicker.d.ts` to `dist/index.d.ts` manually; `tsup.config.mjs` sets `dts: false`. This claim could mislead TypeScript developers expecting source-level types or tree-shakeable typed exports.

**Type:** Documentation Update

**Files affected:**
- `docs/jalali-datepicker-docs/05-typescript.md` — rewrite language claim; keep type interface documentation accurate

---

### Task 0.5 — Add a "Document Status Notice" to `docs/jalali-datepicker-docs/README.md`

**What:** Add a prominent notice at the top of `docs/jalali-datepicker-docs/README.md` clarifying that files in this directory are a **design reference / roadmap specification**, not a complete description of the current v2.x library state. Reference `README.md` and `CHANGELOG.md` as the authoritative current-state documentation.

**Why:** The docs directory was written as a design target (as confirmed by Phase 4 plans within `docs/plans/`), but contains no framing that distinguishes aspirational from implemented. Without this notice, all 15 files risk being treated as ground truth.

**Type:** Documentation Update

**Files affected:**
- `docs/jalali-datepicker-docs/README.md`

---

## Phase 1 — TypeScript Declaration & Constructor API Alignment

**Objective:** Ensure type definitions precisely match the implemented JavaScript API — no phantom options, no missing methods.

**Risk Level:** Low (TypeScript-only changes; no runtime behavior affected)
**Estimated Complexity:** Low
**Impact Level:** High (TypeScript consumers get correct IntelliSense)

---

### Task 1.1 — Remove or implement `mobileMode` option

**What:** Decide: (A) Remove `mobileMode` from `lib/pardis-jalali-datepicker.d.ts` and the constructor defaults, or (B) implement it (see Track B, Task B.1). Until Track B is executed, the correct action is removal.

**Why:** Audit finding (Main Risks, Severity Medium): `mobileMode` is defined in the constructor at `lib/pardis-jalali-datepicker.js:1096` and declared in `lib/pardis-jalali-datepicker.d.ts`, but is **never read anywhere in the implementation**. TypeScript users will pass `mobileMode: true` expecting behavior that does not exist, silently.

**Type:** API Adjustment + Type Definition Sync

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — remove from options destructuring and defaults object (line ~1096–1109)
- `lib/pardis-jalali-datepicker.d.ts` — remove `mobileMode?: boolean` from `PardisOptions`
- After build: `dist/index.d.ts` is auto-generated from lib; re-run `npm run build`
- `CHANGELOG.md` — document as a removal in next patch

---

### Task 1.2 — Verify unconfirmed ARIA attributes in source code

**What:** Audit the actual rendered DOM output and `lib/pardis-jalali-datepicker.js` renderer code to confirm the presence or absence of three attributes: `aria-live="polite"` on the month heading, `aria-describedby` on the input element, and `aria-expanded` on the trigger button.

**Why:** Audit section 3.7 marks these three as "not confirmed in source scan." If absent, the `03-accessibility.md` doc (even after reclassification from Task 0.1) must also note them as 🔲. More importantly, if absent, they should be implemented as they are standard WCAG 2.1 requirements for a dialog-based picker (Task 2.1 below handles implementation).

**Type:** Code Refactor (investigation only at this stage)

**Files affected (read-only investigation):**
- `lib/pardis-jalali-datepicker.js` — search renderer for `aria-live`, `aria-describedby`, `aria-expanded`

---

### Task 1.3 — Sync `dist/index.d.ts` after all `.d.ts` changes

**What:** After Tasks 1.1 (and any other declaration changes), run `npm run build` to regenerate `dist/index.d.ts` from the updated `lib/pardis-jalali-datepicker.d.ts`.

**Why:** The build script (`package.json: "build": "tsup && cp lib/pardis-jalali-datepicker.d.ts dist/index.d.ts"`) copies declarations manually. `dist/index.d.ts` will be stale until rebuilt.

**Type:** Build Configuration Fix

**Files affected:**
- `dist/index.d.ts` — output of build, not hand-edited

---

## Phase 2 — ARIA Attribute Implementation

**Objective:** Implement the three unconfirmed ARIA attributes if the investigation in Task 1.2 confirms they are absent.

**Risk Level:** Low (non-breaking DOM attribute additions)
**Estimated Complexity:** Low
**Impact Level:** Medium (accessibility compliance)

> **Dependency:** Task 1.2 must complete first. If all three attributes are already present, this entire phase is skipped.

---

### Task 2.1 — Add `aria-live="polite"` to month/year heading

**What:** In `PardisRenderer`, add `aria-live="polite"` to the element that displays the current month and year name (the heading that changes on month navigation).

**Why:** Screen readers must announce navigation changes without stealing focus. This is required for WCAG 2.1 success criterion 4.1.3 (Status Messages) in the context of live region updates.

**Type:** Code Refactor

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — renderer heading element construction

---

### Task 2.2 — Add `aria-describedby` to input element

**What:** In the popover setup, link the input element to a hidden description element (e.g., "Click to open date picker, press Escape to close") via `aria-describedby`.

**Why:** `03-accessibility.md` (design spec) requires this for screen-reader context on the input. Without it, the input's purpose is not announced beyond its visible label.

**Type:** Code Refactor

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — input/wrapper construction code (~line 1150–1175)

---

### Task 2.3 — Add `aria-expanded` to trigger button / input wrapper

**What:** Toggle `aria-expanded="true"/"false"` on the input or its associated trigger element when the popover opens/closes.

**Why:** `03-accessibility.md` requires `aria-expanded` on the trigger element. Without it, screen readers cannot announce the open/closed state of the picker.

**Type:** Code Refactor

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — `open()` and `close()` methods (~lines 1392–1406)

---

## Phase 3 — Real Test Suite

**Objective:** Build a genuine test suite that matches the coverage categories described in `docs/jalali-datepicker-docs/11-testing.md`, replacing aspirational ✅ markers with actual test execution.

**Risk Level:** Medium (new tooling; no existing test infrastructure)
**Estimated Complexity:** Medium
**Impact Level:** High (prevents regressions, validates documented behavior)

---

### Task 3.1 — Choose and install a test framework

**What:** Add a test framework as a devDependency. Recommended: **Vitest** (compatible with ESM, zero config for this project, runs in Node; also runs in browser-mode for DOM tests via `@vitest/browser` or jsdom). Alternative: Jest with `--experimental-vm-modules`.

**Why:** Audit finding: `11-testing.md` claims testing with Vitest but no `vitest` package exists in `package.json`, no `vitest.config.*` file, and no `*.test.*` files are present.

**Type:** Build Configuration Fix

**Files affected:**
- `package.json` — add `"test:unit": "vitest run"` script; add vitest to devDependencies
- `vitest.config.js` — new file (minimal config)

---

### Task 3.2 — Add Jalali conversion unit tests (100+ date pairs)

**What:** Create `scripts/conversion.test.js` (or `src/` if restructured). Test `JalaaliUtil.toJalaali()` and `JalaaliUtil.toGregorian()` against known date pairs covering:
- All 12 months
- Leap year boundaries (e.g., Esfand 1399: 30 days; 1400: 29 days)
- Year boundary (Farvardin 1, year 1; Esfand 30, year 3177)
- Nowruz boundary dates (March 20/21 crossover years)
- Historic dates and modern dates

**Why:** Audit finding: `11-testing.md` claims ✅ "100+ Jalali↔Gregorian conversion test pairs." Only `scripts/year-boundary-test.js` (65 lines, navigation clamping only) exists.

**Type:** Test Coverage Addition

**Files affected:**
- `scripts/conversion.test.js` — new file

---

### Task 3.3 — Add engine unit tests (selection, range, constraints)

**What:** Create `scripts/engine.test.js`. Test:
- `PardisEngine.selectDate()` with `minDate`/`maxDate` enforcement
- `maxRange` rejection
- Range auto-swap (backward selection)
- `disabledDates` array and function forms
- `getPresetRange()` for all four named ranges
- `applyPreset()` validation against `maxRange`
- `clearSelection()` state reset

**Why:** Core business logic has no automated tests. Manual testing (demo page) is not reproducible verification.

**Type:** Test Coverage Addition

**Files affected:**
- `scripts/engine.test.js` — new file

---

### Task 3.4 — Add input mask unit tests

**What:** Create `scripts/inputmask.test.js`. Test:
- Auto-slash insertion at positions 4 and 6
- Persian digit input conversion
- Mixed Persian/Latin input normalization
- Rejection of non-digit, non-slash input
- `setRangeValue()` format output
- `clear()` state

**Why:** Input masking is a complex stateful component with multiple edge cases; no tests exist.

**Type:** Test Coverage Addition

**Files affected:**
- `scripts/inputmask.test.js` — new file

---

### Task 3.5 — Add DOM/keyboard integration tests

**What:** Add browser-mode tests (via `@vitest/browser` with Playwright provider, or standalone Playwright). Test:
- Arrow key navigation across month boundary
- PageUp/PageDown month navigation
- Shift+PageUp/PageDown year navigation
- Home/End within week row
- T key jumps to today
- Enter/Space selects focused date
- Escape closes popover

**Why:** Audit finding: `11-testing.md` claims ✅ keyboard navigation tests. No test infrastructure exists. The keyboard handler is 90 lines of complex logic (`lib/...js:1300-1390`) with multiple edge cases (RTL reversal, year boundary clamping, month crossover).

**Type:** Test Coverage Addition

**Files affected:**
- `scripts/keyboard.test.js` — new file (or `tests/` directory)
- `package.json` — add `"test:e2e": "playwright test"` script

---

### Task 3.6 — Update `npm test` script

**What:** Update `package.json` `"test"` script to run all test suites, not just `node scripts/year-boundary-test.js`.

**Why:** The current `"test"` script only runs the boundary test. New test scripts from Tasks 3.2–3.5 will not run without this update.

**Type:** Build Configuration Fix

**Files affected:**
- `package.json` — `"test"` script

---

## Phase 4 — CI / Release Hardening

**Objective:** Add GitHub Actions workflow so every push and PR is verified before merge. Establish bundle size awareness.

**Risk Level:** Low
**Estimated Complexity:** Low–Medium
**Impact Level:** Medium

---

### Task 4.1 — Add GitHub Actions CI workflow

**What:** Create `.github/workflows/ci.yml` with:
- Trigger: push to `main`, all pull requests
- Steps: `npm ci`, `npm run build`, `npm test`
- Node.js matrix: 18.x, 20.x, 22.x

**Why:** Audit finding: `12-release-checklist.md` lists GitHub Actions CI as 🔲. No `.github/` directory exists. Without CI, regressions cannot be caught before merging.

**Type:** CI/Automation Setup

**Files affected:**
- `.github/workflows/ci.yml` — new file

---

### Task 4.2 — Add bundle size tracking

**What:** After build, add a size-check step that reports `dist/index.mjs` (ESM) and `dist/index.cjs` gzipped sizes against a budget (e.g., ≤ 15 kB gzipped per `14-performance.md` target). Tool options: `bundlesize`, `size-limit`, or a simple `stat` + `gzip` shell check in CI.

**Why:** Audit finding: `11-testing.md` lists bundle size CI budget as 🔲. `14-performance.md` documents a `< 15 kB gzipped` target but it is aspirational with no enforcement.

**Type:** CI/Automation Setup

**Files affected:**
- `.github/workflows/ci.yml` — add build size step
- `package.json` — optionally add `size-limit` config

---

### Task 4.3 — Document `CONTRIBUTING.md`

**What:** Create `CONTRIBUTING.md` covering: how to run tests, build steps, PR requirements, commit message format, and the branch model.

**Why:** Audit finding: `12-release-checklist.md` marks CONTRIBUTING.md as 🔲. Without it, external contributors have no guidance.

**Type:** Documentation Update

**Files affected:**
- `CONTRIBUTING.md` — new file

---

---

# 3. Mandatory Ordering Rules (Summary)

```
Phase 0 — Documentation corrections         (no dependencies; start immediately)
    ↓
Phase 1 — TypeScript / API alignment        (depends on Phase 0 decisions)
    ↓
Phase 2 — ARIA implementation               (depends on Task 1.2 investigation result)
    ↓
Phase 3 — Test suite                        (depends on Phase 1 stabilization)
    ↓
Phase 4 — CI / Release hardening            (depends on Phase 3 having runnable tests)
    ↓
Track B — Feature completion                (independent; parallelizable after Phase 1)
    ↓
Track C — Ecosystem expansion               (depends on Track B for stable API contract)
```

Do **not** merge Track B or C work before Phases 0–2 are complete. Adding new features on top of false documentation compounds the mismatch problem.

---

# 4. Mismatch Correction Plan

## Documentation Correction Matrix

| # | Mismatch Item | Current State (Docs) | Required Correction | Files to Update | Risk if Ignored |
|---|---|---|---|---|---|
| M1 | CSS variable prefix | `--jdp-*` in `10-theming.md` | Replace all with `--pardis-*` | `docs/jalali-datepicker-docs/10-theming.md` | Developers cannot override theme variables; silent failure |
| M2 | IIFE global name | `window.JalaliDatepicker` in `06-package-structure.md` | Replace with `window.PardisJalaliDatepicker` | `docs/jalali-datepicker-docs/06-package-structure.md` | CDN/browser users cannot find the global; ReferenceError at runtime |
| M3 | TypeScript source claim | "Library written in TypeScript" in `05-typescript.md` | "Vanilla JS source with hand-authored TypeScript declarations" | `docs/jalali-datepicker-docs/05-typescript.md` | TypeScript developers expect `.ts` source; confusion when debugging |
| M4 | SSR safety claim | "No window/document at module load" + "Hydration-safe" + "Tested with Vitest (SSR)" in `07-ssr-compatibility.md` | Mark all three as 🔲; add truthful note that DOM instantiation is not SSR-safe | `docs/jalali-datepicker-docs/07-ssr-compatibility.md` | SSR/Next.js users will get "document is not defined" errors trusting these claims |
| M5 | Arabic numerals | `numeralType: 'arabic'` marked ✅ in `04-localization.md` | Change to 🔲; document only `'persian'` and `'latin'` as implemented | `docs/jalali-datepicker-docs/04-localization.md` | Passing `numeralType: 'arabic'` silently falls back to default; undocumented behavior |
| M6 | Locale / i18n system | Locale prop, en-US, pluggable locales, RTL/LTR auto all marked ✅ in `04-localization.md` | Change all to 🔲; note that month names and RTL are currently hardcoded | `docs/jalali-datepicker-docs/04-localization.md` | Developers expecting locale API will find nothing |
| M7 | Bottom sheet | "Bottom sheet on mobile (viewport < 768px)" marked ✅ in `08-mobile-touch.md` | Change to ⚠️ (CSS skeleton present, JS activation absent) | `docs/jalali-datepicker-docs/08-mobile-touch.md` | Mobile-first adopters will find no automatic sheet behavior |
| M8 | `allowNativeInput` | Marked ✅ in `08-mobile-touch.md` | Change to 🔲 | `docs/jalali-datepicker-docs/08-mobile-touch.md` | Option does not exist; passing it has no effect |
| M9 | Framework adapters | React, Vue, Next.js, Web Component all marked ✅ in `09-framework-adapters.md` | Change all to 🔲; Angular to 🔲 (not ⚠️) | `docs/jalali-datepicker-docs/09-framework-adapters.md` | Adopters expecting npm adapter packages will find none |
| M10 | Headless mode | `headless: true` marked ✅ in `10-theming.md` | Change to 🔲 | `docs/jalali-datepicker-docs/10-theming.md` | Option does not exist; library always renders full DOM |
| M11 | Render hooks | `renderDay`, footer slot, `className` passthrough all marked ✅ in `10-theming.md` | Change all to 🔲 | `docs/jalali-datepicker-docs/10-theming.md` | Developers expecting React-style render props will find none |
| M12 | Dark mode | `prefers-color-scheme` support marked ✅ in `10-theming.md` | Change to 🔲; note that CSS variables allow manual dark theme via `data-pardis-theme` | `docs/jalali-datepicker-docs/10-theming.md` | System dark mode will not be respected automatically |
| M13 | Dual-month / multi-month | Both marked ✅ in `02-core-features.md` | Change to 🔲 | `docs/jalali-datepicker-docs/02-core-features.md` | `monthsShown` option does not exist; range users see single calendar only |
| M14 | Test coverage | 12 test categories marked ✅ in `11-testing.md` | Change all to 🔲 until Phase 3 is complete | `docs/jalali-datepicker-docs/11-testing.md` | CI vendors and adopters evaluating quality will find no evidence of claimed coverage |
| M15 | ARIA live/describedby/expanded | Three attributes marked ✅ in `03-accessibility.md` | Mark as ⚠️ (unconfirmed) pending Task 1.2 investigation | `docs/jalali-datepicker-docs/03-accessibility.md` | A11y audits may fail if attributes are absent despite claims |
| M16 | `mobileMode` TS declaration | Declared in `lib/pardis-jalali-datepicker.d.ts` | Remove until implemented | `lib/pardis-jalali-datepicker.d.ts`, then rebuild `dist/index.d.ts` | TypeScript users pass option expecting behavior that never occurs |
| M17 | Release checklist baseline | All items 🔲 in `12-release-checklist.md` despite v2.0.1 existing | Update completed items (CHANGELOG, LICENSE, README, Semantic Versioning, npm latest tag) to ✅ | `docs/jalali-datepicker-docs/12-release-checklist.md` | Checklist is useless for tracking actual remaining gaps |

---

# 5. API Stabilization Checklist

Use this checklist before each release to verify the public contract is internally consistent.

## Constructor Options

- [ ] Every option in `PardisOptions` TypeScript interface has a corresponding implementation in `lib/pardis-jalali-datepicker.js`
- [ ] Every option in `lib/pardis-jalali-datepicker.js` defaults object is present in `PardisOptions` interface
- [ ] `mobileMode` is either fully implemented or removed from both files (Task 1.1)
- [ ] `numeralType` accepts exactly `'persian' | 'latin'` (not `'arabic'`) in both TS and JS
- [ ] README constructor options table matches TypeScript interface exactly

## Public Methods

- [ ] `open()`, `close()`, `getValue()`, `setValue(jy, jm, jd)`, `clear()`, `destroy()`, `setOption(key, value)`, `goToToday()`, `getPresetRange(name)` are all declared in TS and implemented in JS
- [ ] `setValue` TS signature is `(jy: number, jm: number, jd: number): void` — **not** `(date: JalaliDate)` (this was a v2.0.0 bug fixed in v2.0.1; verify it stays correct)
- [ ] README methods table matches TS declarations exactly
- [ ] `dp.engine` is documented as low-level access (already partially in README)

## Event System

- [ ] All four callback options (`onChange`, `onRangeStart`, `onRangeSelect`, `onClear`) are in TS interface, JS implementation, and README
- [ ] Engine events (`select`, `rangeStart`, `rangeSelect`, `clear`, `viewChange`) are documented for `dp.engine.on()` usage
- [ ] Payload shape for each event is documented in README (currently documented only for `onChange` and `onRangeSelect`)

## Global Exposure

- [ ] IIFE global is `PardisJalaliDatepicker` in: `tsup.config.mjs` globalName, `README.md` CDN example, `docs/jalali-datepicker-docs/06-package-structure.md` (Task 0.3)
- [ ] All three exports (`PardisDatepicker`, `PardisEngine`, `JalaaliUtil`) are accessible via IIFE: `PardisJalaliDatepicker.PardisDatepicker` etc.
- [ ] AUDIT_REPORT.md finding L4 ("IIFE global shape not fully documented") addressed: README should note that `PardisEngine` and `JalaaliUtil` are also available via IIFE global

## ESM / CJS / IIFE Consistency

- [ ] `dist/index.mjs` exports `{ PardisDatepicker, PardisEngine, JalaaliUtil }` (named ESM)
- [ ] `dist/index.cjs` exports same three names via CommonJS
- [ ] `dist/index.global.js` exposes `PardisJalaliDatepicker` with all three as properties
- [ ] `package.json` exports map points to correct files for `import`, `require`, and `types`
- [ ] No deep-import paths are accidentally exposed (exports map blocks them)

## Type Definition Sync

- [ ] `lib/pardis-jalali-datepicker.d.ts` is the single source of truth
- [ ] `dist/index.d.ts` is identical (produced by `npm run build`)
- [ ] `JalaliDate`, `DateRange`, `PardisOptions`, `PardisDatepicker`, `PardisEngine`, `JalaaliUtil` are all exported from `.d.ts`
- [ ] After every `.d.ts` change, `npm run build` is run to sync `dist/index.d.ts`

---

# 6. Release Readiness Plan

## Pre-v2.1.0 Checklist

The following must be complete before tagging v2.1.0:

**Critical (blocking):**
- [ ] Phase 0 — All false ✅ claims corrected in `docs/jalali-datepicker-docs/`
- [ ] Task 1.1 — `mobileMode` removed from TS declarations and constructor defaults (or implemented)
- [ ] Task 1.2 — ARIA attribute presence verified in code
- [ ] Phase 2 — Any absent ARIA attributes implemented

**High (strongly recommended):**
- [ ] Task 3.1–3.4 — Unit tests for conversion, engine, and input mask are passing
- [ ] Task 4.1 — GitHub Actions CI passes on push

**Medium (nice to have):**
- [ ] Task 3.5 — Keyboard integration tests passing
- [ ] Task 4.2 — Bundle size tracking in CI
- [ ] Task 4.3 — `CONTRIBUTING.md` present

## Version Bump Recommendation

| Scenario | Version |
|---|---|
| Phase 0 + Task 1.1 only (doc corrections + mobileMode removal) | **2.1.0** (minor: removes a declared option) |
| Phase 0 + Tasks 1.1 + Phase 2 ARIA additions | **2.1.0** |
| Phase 0 + 1 + 2 + 3 + 4 (full stabilization) | **2.1.0** |
| Track B feature additions (bottom sheet wired up, dark mode) | **2.2.0** |
| Track C ecosystem additions (adapters, headless) | **3.0.0** (breaking API surface expansion) |

## Backward Compatibility Concerns

| Change | Compatibility Impact |
|---|---|
| Removing `mobileMode` from TS declarations | **Non-breaking** at runtime (option was silently ignored). TypeScript projects passing `mobileMode: true` will get a compile error — this is the desired behavior. |
| Adding ARIA attributes to DOM | **Non-breaking** — additive DOM attribute changes |
| Adding test files | **Non-breaking** |
| Correcting docs | **Non-breaking** |

## Deprecation Strategy

No deprecations are required for Phases 0–4. The `mobileMode` removal is a clean cut since the option had no observable effect.

---

# 7. Strategic Tracks

---

## Track A — Stabilization (Short-Term, Phases 0–4)

*This is the recommended immediate focus. All tasks above.*

**Goal:** Make documentation match implementation. Make the public API contract trustworthy. Establish a test suite.

**Duration estimate:** Phases 0–2 in 1–2 days; Phase 3 in 3–5 days; Phase 4 in 1–2 days.

**Entry criteria:** Current v2.0.1 codebase
**Exit criteria:** v2.1.0 release with accurate docs, no phantom API options, ARIA verified, tests running in CI

---

## Track B — Feature Completion (Mid-Term)

*Start only after Track A is complete or in parallel from Phase 1 onward.*

**Goal:** Implement the Level 3 partial features that have CSS/structural scaffolding but no JS activation.

---

### Task B.1 — Wire up bottom-sheet mobile mode

**What:** Implement `mobileMode` option logic: when `mobileMode: true` (or automatically when viewport width < 768px via `matchMedia`), render the datepicker using the existing `.pardis-bottom-sheet` CSS structure instead of the popover. Add JS to:
- Detect viewport size (or respect `mobileMode: true` option)
- Switch rendering to sheet layout
- Handle open/close animations (`.pardis-overlay` + `.pardis-bottom-sheet.open`)

**Why:** Audit finding: CSS skeleton is fully built (`lib/...css:161-206`). JS activation is the only missing piece. This converts a Level 3 (Partial) feature to Level 1 (Stable).

**Files affected:**
- `lib/pardis-jalali-datepicker.js` — constructor, open(), close(), renderer initialization
- `lib/pardis-jalali-datepicker.d.ts` — re-add `mobileMode?: boolean` (now implemented)
- `README.md` — document `mobileMode` option
- `docs/jalali-datepicker-docs/08-mobile-touch.md` — update ⚠️ to ✅ after implementation

---

### Task B.2 — Add `prefers-color-scheme: dark` CSS media query

**What:** Add a `@media (prefers-color-scheme: dark)` block to `lib/pardis-jalali-datepicker.css` that overrides the default Modern theme variables with darker values. (The Glass and Classic themes already use dark-adjacent palettes; the Modern theme defaults to light.)

**Why:** Audit finding: `10-theming.md` claims ✅ for dark mode. No `prefers-color-scheme` media query exists in the CSS file. Users on dark OS themes get a white calendar injected into dark UIs.

**Files affected:**
- `lib/pardis-jalali-datepicker.css` — add `@media (prefers-color-scheme: dark)` block
- `docs/jalali-datepicker-docs/10-theming.md` — update 🔲 to ✅ after implementation

---

### Task B.3 — Document `@media (max-width: 480px)` responsive CSS

**What:** Add a note to `README.md` and `docs/jalali-datepicker-docs/08-mobile-touch.md` that the calendar automatically becomes full-width on viewports ≤ 480px via an existing CSS media query.

**Why:** Audit finding (Section 4, Implemented but Undocumented): `lib/pardis-jalali-datepicker.css:570-575` sets `width: 100%` on mobile. This responsive behavior is undocumented.

**Files affected:**
- `README.md` — add note under theming/responsive section
- `docs/jalali-datepicker-docs/08-mobile-touch.md`

---

### Task B.4 — Document `JalaaliUtil` and `PardisEngine` as secondary public exports

**What:** Add a "Low-Level API" section to `README.md` documenting:
- `JalaaliUtil` — available as `import { JalaaliUtil } from 'pardis-jalali-datepicker'` — functions: `toJalaali`, `toGregorian`, `isLeapJalaaliYear`, `jalaaliMonthLength`, `todayJalaali`
- `PardisEngine` — static helper: `PardisEngine.buildDatePayload(jy, jm, jd, format)` and `PardisEngine.formatDate()`
- `dp.engine` direct access pattern

**Why:** Audit finding (Section 4.2/4.3, Implemented but Undocumented): Both classes are exported from `lib/...js:1481` and present in TS declarations but not prominently documented. `buildDatePayload()` is mentioned in one README line but no API table row.

**Files affected:**
- `README.md` — new "Low-Level API" or "Utilities" section

---

### Task B.5 — Document `PardisInputMask.setRangeValue()`

**What:** Add documentation for the `setRangeValue(start, end)` method which sets the input to `YYYY/MM/DD  ←  YYYY/MM/DD` format.

**Why:** Audit finding (Section 4, Hidden): `lib/...js:1052-1056` implements this method, which is part of the public range UX but undocumented.

**Files affected:**
- `README.md` (or internal API note)

---

## Track C — Ecosystem Expansion (Long-Term)

*Start only after Track B is complete. These are Level 5 Roadmap items from the audit.*

**Goal:** Add framework adapters, headless mode, and multi-calendar support.

> **Prerequisite:** The public API must be fully stable and tested (Tracks A + B) before wrapping it in framework adapters. Building React/Vue adapters on an unstable core creates double maintenance debt.

---

### Task C.1 — `headless: true` mode

**What:** Implement a mode where the library exposes only the engine and event system without rendering any DOM. Consumer provides their own rendering.

**Audit Reference:** `10-theming.md` marks ✅; no implementation found (Section 3.4).

**Files affected:** `lib/pardis-jalali-datepicker.js` (renderer bypass), `.d.ts`, `README.md`

---

### Task C.2 — React wrapper package

**What:** Create `packages/react/` (or a separate repo) with a `<JalaliDatepicker />` React component wrapping `PardisDatepicker`.

**Audit Reference:** `09-framework-adapters.md` marks ✅ for React v17/18/19; no code exists (Section 3.5).

---

### Task C.3 — Vue 3 wrapper package

**What:** Create `packages/vue/` with a `<JalaliDatepicker />` Vue 3 component.

**Audit Reference:** `09-framework-adapters.md` marks ✅ for Vue 3; no code exists (Section 3.5).

---

### Task C.4 — Web Component wrapper

**What:** Create `customElements.define('jalali-datepicker', ...)` wrapping `PardisDatepicker`.

**Audit Reference:** `09-framework-adapters.md` marks ✅ for Web Component; no `customElements.define()` found (Section 3.5).

---

### Task C.5 — `numeralType: 'arabic'` support

**What:** Add Arabic-Indic numeral conversion alongside existing Persian and Latin.

**Audit Reference:** `04-localization.md` marks ✅; only `'persian'` and `'latin'` exist in code (Section 3.1, line `lib/...js:1104`).

---

### Task C.6 — Pluggable locale system

**What:** Design and implement a `locale` option accepting a config object with month names, weekday names, and numeral mappings.

**Audit Reference:** `04-localization.md` marks ✅; month names are currently hardcoded static strings (Section 3.1).

---

### Task C.7 — Multi-month / Dual-month view

**What:** Implement `monthsShown: 1 | 2 | 3` option, with dual-month layout optimized for range selection.

**Audit Reference:** `02-core-features.md` marks ✅ for both; no implementation found (Section 3.3).

---

---

# 8. Final Recommendation

## The next release must focus on: **Stabilization**

### Justification

1. **The documentation gap is a trust risk.** An alignment score of 42/100 means that a developer evaluating this library from `docs/jalali-datepicker-docs/` will believe they are getting SSR safety, framework adapters, a locale system, headless mode, and comprehensive test coverage — none of which exist. Publishing this gap to npm makes the library appear fraudulent on discovery.

2. **The core is genuinely strong.** The Jalali engine, range selection, keyboard navigation, theming, and build pipeline are production-quality. The library does not need more features — it needs accurate representation of its existing quality.

3. **Tests are pre-requisite for everything else.** Any feature added in Track B or C without tests will compound the fragility. A test suite built in Phase 3 creates the safety net for all future development.

4. **Removing `mobileMode` is a small, necessary cleanup.** It is the only phantom option in the TypeScript declarations and sets a precedent that declared options must function.

**Recommended release sequence:**
- `v2.1.0` — Phases 0–4 (stabilization + accurate docs + tests + CI)
- `v2.2.0` — Track B (bottom sheet activation, dark mode, documented utilities)
- `v3.0.0` — Track C (adapters, headless, locale system, multi-month)

Ecosystem growth in Track C should only begin once the core library has an alignment score ≥ 85% and a CI-enforced test suite.
