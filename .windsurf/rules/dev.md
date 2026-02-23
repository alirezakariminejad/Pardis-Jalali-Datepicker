---
trigger: always_on
---

### Git Workflow Rules
- **[Branch discipline]**
  - Work on `main` for library source.
  - Use `gh-pages` only for the website/landing page content.
- **[Clean working tree]**
  - Before releasing, ensure `git status` is clean (no uncommitted changes).
- **[Small, meaningful commits]**
  - Group related changes into one commit.
  - Use clear messages, e.g. `Release v1.0.1`, `Fix year navigation clamp`.
- **[Push strategy]**
  - Always push `main` changes: `git push`.
  - If you create tags, push them explicitly: `git push --tags`.
- **[Verify remote branch]**
  - Confirm you are on the correct branch before committing/pushing: `git branch --show-current`.

### Semantic Versioning (SemVer) Rules
- **[SemVer format]**
  - Versions must follow: `MAJOR.MINOR.PATCH` (e.g. `1.0.1`).
- **[When to bump PATCH]**
  - Bug fixes, internal improvements, safe behavior fixes (no public API break).
- **[When to bump MINOR]**
  - New features that are backward-compatible.
- **[When to bump MAJOR]**
  - Breaking changes (API changes, behavior changes that can break consumers).
- **[Single source of truth]**
  - Update [package.json](cci:7://file:///d:/Pardis-Jalali-Datepicker/package.json:0:0-0:0) `"version"` before release.

### Changelog Rules (Keep a Changelog)
- **[Always maintain CHANGELOG.md]**
  - Add [CHANGELOG.md](cci:7://file:///d:/Pardis-Jalali-Datepicker/CHANGELOG.md:0:0-0:0) at repo root.
  - Record every notable change per version.
- **[Changelog structure]**
  - For each version: `Fixed`, `Changed`, `Added`, `Removed`, `Security` as applicable.
- **[Release alignment]**
  - The changelog version must match the git tag and npm version.

### Git Tags + GitHub Releases Rules
- **[Create a tag per release]**
  - Create annotated or lightweight tag: `vX.Y.Z` (example: `v1.0.1`).
- **[Tag must match package.json]**
  - `package.json version` == `CHANGELOG version` == git tag (`vX.Y.Z`).
- **[GitHub Release notes]**
  - Use the relevant section from [CHANGELOG.md](cci:7://file:///d:/Pardis-Jalali-Datepicker/CHANGELOG.md:0:0-0:0) as the Release Notes.

### npm Publishing Rules
- **[Pre-publish verification]**
  - Verify who is logged in: `npm whoami`.
  - Verify current published version: `npm view <package-name> version`.
  - Confirm version bump is done in [package.json](cci:7://file:///d:/Pardis-Jalali-Datepicker/package.json:0:0-0:0) (npm will reject re-publishing same version).
- **[Publish command]**
  - Use: `npm publish --access public` (for public packages).
- **[2FA / authentication reality]**
  - Expect 2FA enforcement for publish.
  - Prefer **session-based** auth via `npm login` for local publishing.
- **[Do not misuse --otp]**
  - `--otp` is for a 6-digit authenticator code, **not** for tokens.
- **[Token security]**
  - Never paste npm tokens in chats or commits.
  - Revoke any token that was exposed.
- **[Post-publish verification]**
  - Check npm shows the new version: `npm view <package-name> version`.
  - Test install: `npm i <package-name>@latest` (optional but recommended).

### Release Checklist (One-shot)
- **[1]** Update code + tests.
- **[2]** Update [CHANGELOG.md](cci:7://file:///d:/Pardis-Jalali-Datepicker/CHANGELOG.md:0:0-0:0) for the new version.
- **[3]** Bump [package.json](cci:7://file:///d:/Pardis-Jalali-Datepicker/package.json:0:0-0:0) version.
- **[4]** Run sanity tests (at minimum: smoke test / any scripts).
- **[5]** Commit: `Release vX.Y.Z`.
- **[6]** Tag: `vX.Y.Z`.
- **[7]** Push commit + tag: `git push` and `git push --tags`.
- **[8]** Create GitHub Release using changelog notes.
- **[9]** `npm login` (if needed), then `npm publish --access public`.
- **[10]** Verify npm version updated.
