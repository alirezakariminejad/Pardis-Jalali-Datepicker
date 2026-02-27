---
description: Project documentation-vs-implementation audit for a JavaScript npm library project
---
You are performing a full documentation-vs-implementation audit for a JavaScript npm library project.

# OBJECTIVE

Analyze the entire repository and generate a structured report identifying:

1. Features that are clearly implemented and stable.
2. Features that are partially implemented or implicitly present.
3. Features that are documented but NOT implemented.
4. Features implemented in code but NOT documented.
5. Documentation mismatches or outdated claims.
6. Roadmap/specification items that are incorrectly presented as completed.

The goal is to determine the REAL feature maturity of the project based strictly on repository evidence.

---

# SCOPE

You MUST analyze:

- README.md
- CHANGELOG.md
- AUDIT_REPORT.md (if exists)
- All Markdown files under:
  - docs/
  - docs/**/*
- All source files under:
  - src/
  - lib/
  - dist/ (only to confirm build outputs, not as source of truth)
- package.json (exports, types, build outputs)
- Type definitions (.d.ts files)
- CSS files (for theme and feature confirmation)

Ignore:
- node_modules/
- external dependencies documentation

---

# RULES

1. DO NOT assume a feature exists unless it is confirmed in code.
2. If a feature is only described in docs but has no code/API evidence, classify it as "Documented but Not Implemented".
3. If a feature exists in code but is not mentioned in README/API docs, classify it as "Implemented but Undocumented".
4. If documentation claims something stronger than the implementation supports, classify it as "Documentation Mismatch".
5. Distinguish clearly between:
   - Public API features
   - Internal capabilities
   - Planned / roadmap features

6. Provide file-level evidence for every major claim (reference file paths).

---

# CLASSIFICATION FRAMEWORK

Use the following maturity levels:

## Level 1 — Stable & Public
Clearly implemented + exposed in public API + documented in README.

## Level 2 — Implemented but Hidden
Present in code or CSS but not officially documented or exposed.

## Level 3 — Partial / Incomplete
Some structural code exists but feature is not fully functional.

## Level 4 — Documented Only
Appears in docs or plans but no implementation found.

## Level 5 — Roadmap / Vision
Appears only in planning docs or architecture specs.

---

# REQUIRED OUTPUT STRUCTURE

Produce a structured report with these sections:

# 1. Executive Summary
- Overall maturity assessment (Low / Medium / High)
- Alignment score between docs and implementation (0–100)
- Main risks

# 2. Feature Matrix Table

Table columns:
- Feature Name
- Category (Core / UX / A11y / i18n / Theming / Build / Framework / Testing / Mobile / etc.)
- Maturity Level (1–5)
- Evidence (file references)
- Notes

# 3. Documented But Not Implemented

List all features claimed in docs but missing in implementation.

# 4. Implemented But Undocumented

List hidden capabilities found in code.

# 5. Documentation Mismatches

List incorrect or outdated claims.
Explain why they are mismatched.

# 6. API Surface Analysis

- Public constructor options
- Public methods
- Event hooks
- Global exposure (if any)
- ESM/CJS/IIFE verification

Confirm consistency between:
- README examples
- Type definitions
- Actual implementation

# 7. Architecture Consistency Check

- Engine separation
- SSR safety
- Dependency status
- Build integrity
- Export map correctness

# 8. Risk Assessment

Classify risks into:
- Technical Risk
- Adoption Risk
- Maintenance Risk
- Reputation Risk

# 9. Recommended Next Actions (Prioritized)

Provide a prioritized list:
- Critical fixes
- Medium improvements
- Optional enhancements

---

# IMPORTANT

Be strict.
Be evidence-driven.
Avoid assumptions.
Do not rewrite documentation.
This is an audit, not a redesign.

End the report with a clear maturity verdict:
- Prototype
- Early-stage library
- Stable production-ready
- Mature ecosystem-ready