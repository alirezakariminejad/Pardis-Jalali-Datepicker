---
title: "npm Open Source Release Checklist"
section: 12
tags: [jalali, datepicker, release, npm, ci-cd, changelog, semver]
last_updated: 2025-02
---

# npm Open Source Release Checklist

## 12.1 Before First Public Release

| ✓ | Item | Details |
|---|------|---------|
| 🔲 | Semantic Versioning from 1.0.0 | Use 0.x.x for beta; graduate to 1.0.0 when API is stable. |
| 🔲 | CHANGELOG.md (Keep a Changelog format) | Document every release. Use conventional commits + auto-generation. |
| 🔲 | LICENSE file (MIT recommended) | Confirm attribution requirements. MIT is most permissive. |
| 🔲 | README with: demo link, install, API table, examples | In both English and Farsi sections ideally. |
| 🔲 | CodeSandbox / StackBlitz live demo | Embed interactive demo. Dramatically increases adoption. |
| 🔲 | GitHub Discussions enabled | Better for support than Issues; keep Issues for bugs only. |
| 🔲 | CONTRIBUTING.md & CODE_OF_CONDUCT.md | Define how to submit PRs, run tests, report bugs. |
| 🔲 | npm tag: latest vs next | Publish betas with `--tag next` so they don't break installs. |

## 12.2 CI/CD & Automation

| ✓ | Item | Tool |
|---|------|------|
| 🔲 | GitHub Actions: test on push/PR | Matrix: node 18, 20, 22. OS: ubuntu, windows, macos. |
| 🔲 | Automated release via changesets | `@changesets/action`; generates CHANGELOG, bumps version, publishes. |
| 🔲 | Bundle size budget in CI | `size-limit`; fail build if bundle exceeds threshold. |
| 🔲 | Dependabot / Renovate | Auto PR for dependency updates; review weekly. |
| 🔲 | Provenance attestation (npm) | `npm publish --provenance` (requires GitHub Actions) for supply chain security. |
| 🔲 | Branch protection: require CI green | No direct push to main; require PR + passing tests. |

---

← [Previous: Testing & Quality Gates](./11-testing.md) | [Index](./README.md) | [Next: Existing Library Comparison](./13-library-comparison.md) →
