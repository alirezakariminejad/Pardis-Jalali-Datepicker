---
description: Project Audit + Markdown Report
---

# Project Audit Workflow

Use this workflow when you want the assistant to re-review the whole repository and produce (or update) a Markdown report file with findings.

## How to use

1) Open your repo root in the IDE.
2) Start a new chat and paste the **Audit Prompt** below.
3) The assistant should:
   - Review the codebase and repo setup.
   - Identify risks / bugs / inconsistencies.
   - Write findings into `AUDIT_REPORT.md` (create if missing).
   - If it applies, propose code fixes (and implement them if you confirm).

## Audit Prompt (copy/paste)

You are a senior engineer auditing this repository. Your task is to thoroughly review the project and produce a written audit report.

### Output requirements
- Create or update a Markdown file at repo root named `AUDIT_REPORT.md`.
- If the file already exists, append a new section at the top (most recent first).
- The new section title must include today’s date (YYYY-MM-DD).
- Use this structure:
  - Summary
  - Strengths
  - Findings (grouped by severity: Critical / High / Medium / Low)
  - Recommended Fix Plan (ordered steps)
  - Verification Checklist

### What to audit (minimum)
- Project structure separation (`lib/` vs `demo/`) and whether the demo imports the library correctly.
- Public API stability and breaking-change risks.
- Date math correctness and boundary handling (years/months, invalid ranges, error paths).
- Range mode and selection edge cases.
- Input mask correctness (parsing, formatting, partial input behavior).
- CSS scoping: ensure library CSS does not include global resets / font imports meant for demo.
- npm package readiness:
  - `package.json` fields (`name`, `version`, `main`, `files`, `repository`, `homepage`, `license`)
  - Only library artifacts are published (no demo assets unless intended)
  - Version aligns with `CHANGELOG.md`.
- Release hygiene:
  - `CHANGELOG.md` follows Keep a Changelog
  - git tag exists and matches version (e.g. `vX.Y.Z`)
- Documentation quality (`README.md`): accuracy, examples, missing sections.
- GitHub Pages/landing page links correctness.

### Finding format
For each finding, include:
- Severity
- Title
- Evidence (file path + what you observed)
- Impact
- Recommended fix (with specific file/function names)

### Constraints
- Do not change files automatically unless you explicitly list the changes first and ask for confirmation.
- Do not add/remove unrelated comments.
