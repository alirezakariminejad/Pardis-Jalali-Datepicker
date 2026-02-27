---
title: "npm Open Source Release Checklist"
section: 12
tags: [jalali, datepicker, release, npm, ci-cd, changelog, semver]
last_updated: 2026-02
---

# npm Open Source Release Checklist

> **⚠️ Status updated 2026-02-26** — Items completed as of v2.0.1 are marked ✅.
> Remaining items are targets for future releases.

## 12.1 Before First Public Release

| ✓ | Item | Details |
|---|------|---------|
| ✅ | Semantic Versioning from 1.0.0 | Current version: 2.0.1. History: 1.0.0 → 1.0.1 → 1.0.2 → 1.1.0 → 1.1.1 → 1.2.0 → 2.0.0 → 2.0.1. |
| ✅ | CHANGELOG.md (Keep a Changelog format) | Maintained from v1.0.0 through v2.0.1 with correct format. |
| ✅ | LICENSE file (MIT recommended) | MIT license present at repo root. |
| ✅ | README with: demo link, install, API table, examples | Covers installation (npm + CDN), all options, all methods, events, payload format, themes. |
| ✅ | npm tag: latest | Published as `latest`. Beta releases should use `--tag next`. |
| 🔲 | CodeSandbox / StackBlitz live demo | Embed interactive demo link. Dramatically increases adoption. |
| 🔲 | GitHub Discussions enabled | Better for support than Issues; keep Issues for bugs only. |
| 🔲 | CONTRIBUTING.md & CODE_OF_CONDUCT.md | Define how to submit PRs, run tests, report bugs. |

## 12.2 CI/CD & Automation

| ✓ | Item | Tool |
|---|------|------|
| 🔲 | GitHub Actions: test on push/PR | Matrix: node 18, 20, 22. OS: ubuntu, windows, macos. |
| 🔲 | Automated release via changesets | `@changesets/action`; generates CHANGELOG, bumps version, publishes. |
| 🔲 | Bundle size budget in CI | `size-limit`; fail build if gzipped bundle exceeds 15 kB. |
| 🔲 | Dependabot / Renovate | Auto PR for dependency updates; review weekly. |
| 🔲 | Provenance attestation (npm) | `npm publish --provenance` (requires GitHub Actions) for supply chain security. |
| 🔲 | Branch protection: require CI green | No direct push to main; require PR + passing tests. |

---

← [Previous: Testing & Quality Gates](./11-testing.md) | [Index](./README.md) | [Next: Existing Library Comparison](./13-library-comparison.md) →
