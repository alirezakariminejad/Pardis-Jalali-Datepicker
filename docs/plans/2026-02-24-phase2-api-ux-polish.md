# Phase 2 — API & UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand `setOption()` to support all runtime-relevant options, fix the range-input focus/edit bug, and correct a minor README word count.

**Architecture:** Three independent changes to `lib/pardis-jalali-datepicker.js` and `README.md`. No new classes, no new public API shape — `setOption(key, value)` signature stays identical; it simply propagates more keys to `this.engine` and re-renders. The range-input fix adds a single `focus` listener in popover+rangeMode that clears the field and engine state so the user always starts a fresh range pick.

**Tech Stack:** Vanilla JS (ES2020 class syntax), no build step. Test runner: `node scripts/year-boundary-test.js`. Manual browser smoke-test via `demo.html`.

---

### Task 1: Expand `setOption()` to propagate all runtime-relevant engine options

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js` (around line 1408 — `setOption` method)

**Background:**
`setOption(key, value)` currently only wires `rangeMode` and `outputFormat` to the engine. Calling it with `minDate`, `maxDate`, `disabledDates`, `highlightedDates`, `maxRange`, or `numeralType` updates `this.options` but silently ignores the engine, so the calendar doesn't reflect the change.

The fix is a lookup table (plain object) mapping supported key names to their engine field names, then a single generic propagation block that replaces the growing chain of `if` statements.

**Step 1: Read the current `setOption` implementation**

Open `lib/pardis-jalali-datepicker.js` and locate `setOption`. It should look like:

```js
setOption(key, value) {
  this.options[key] = value;
  if (key === 'rangeMode') {
    this.engine.rangeMode = value;
    this.engine.clearSelection();
    this._renderer.render();
  }
  if (key === 'outputFormat') this.engine.outputFormat = value;
}
```

Note that `outputFormat` does NOT call `this._renderer.render()` — that is intentional (output format only affects payload shape, not display). Keep that behaviour.

**Step 2: Replace `setOption` with the expanded version**

Replace the entire method body with:

```js
setOption(key, value) {
  this.options[key] = value;

  // Keys that map directly to an engine property and require a re-render
  const renderKeys = ['minDate', 'maxDate', 'disabledDates', 'highlightedDates', 'maxRange', 'numeralType'];
  if (renderKeys.includes(key)) {
    this.engine[key] = value;
    this._renderer.render();
    return;
  }

  if (key === 'rangeMode') {
    this.engine.rangeMode = value;
    this.engine.clearSelection();
    this._renderer.render();
    return;
  }

  if (key === 'outputFormat') {
    this.engine.outputFormat = value;
    // no re-render needed: only affects payload shape
  }
}
```

**Step 3: Verify with `npm test`**

```bash
cd /Volumes/T7/PardisJalaliDatepicker/Pardis-Jalali-Datepicker
npm test
```

Expected: all boundary tests pass (the test script does not cover `setOption` but confirms nothing broke).

**Step 4: Manual smoke-test in browser**

Open `demo.html` in a browser. Open the DevTools console and run:

```js
// Assumes dp1 is the first instance created by demo.js
dp1.setOption('minDate', { jy: 1404, jm: 3, jd: 1 });
// Calendar should immediately re-render with dates before 1404/03/01 greyed out

dp1.setOption('numeralType', 'latin');
// Calendar days should switch from Persian ۱–۳۱ to Latin 1–31

dp1.setOption('minDate', null);
dp1.setOption('numeralType', 'persian');
// Both should restore to defaults
```

**Step 5: Commit**

```bash
git add lib/pardis-jalali-datepicker.js
git commit -m "feat(setOption): propagate all runtime-relevant options to engine and re-render"
```

---

### Task 2: Fix range input focus — clear selection and restart on focus

**Files:**
- Modify: `lib/pardis-jalali-datepicker.js`
  - `_bindPopoverEvents()` — around line 1241 (add range-focus handler)
  - `destroy()` — around line 1418 (unregister the new handler)

**Background:**
When `rangeMode` is `true` and a range is already selected, the input shows `"۱۴۰۴/۰۱/۰۵  ←  ۱۴۰۴/۰۱/۱۵"`. If the user clicks into the input and types, the mask tries to parse the concatenated digits of both dates, producing garbled output. The fix: add a `focus` listener only in range mode that clears the input value and engine selection, so the user always starts a fresh pick.

**Step 1: Add the range-focus listener inside `_bindPopoverEvents()`**

Locate `_bindPopoverEvents()`. After the existing `this._onFocus` setup, add:

```js
// In range mode, clear selection on focus so user can pick a fresh range
if (this.options.rangeMode) {
  this._onRangeFocusClear = () => {
    this.engine.clearSelection();
    this._inputMask.clear();
    this._renderer.render();
  };
  this._input.addEventListener('focus', this._onRangeFocusClear);
}
```

The full updated method should look like:

```js
_bindPopoverEvents() {
  this._onFocus = () => this.open();
  this._input.addEventListener('focus', this._onFocus);

  // In range mode, clear selection on focus so user can pick a fresh range
  if (this.options.rangeMode) {
    this._onRangeFocusClear = () => {
      this.engine.clearSelection();
      this._inputMask.clear();
      this._renderer.render();
    };
    this._input.addEventListener('focus', this._onRangeFocusClear);
  }

  this._onDocClick = (e) => {
    if (!this._isOpen) return;
    if (!this._anchor.contains(e.target) && !this._popover.contains(e.target)) this.close();
  };
  document.addEventListener('click', this._onDocClick);

  this._onKeydown = (e) => { if (e.key === 'Escape') this.close(); };
  document.addEventListener('keydown', this._onKeydown);
}
```

**Step 2: Unregister the handler in `destroy()`**

Locate the `destroy()` method. After the existing `if (this._onFocus)` line, add:

```js
if (this._onRangeFocusClear) this._input.removeEventListener('focus', this._onRangeFocusClear);
```

The relevant portion of `destroy()` should now look like:

```js
if (this._onFocus)          this._input.removeEventListener('focus', this._onFocus);
if (this._onRangeFocusClear) this._input.removeEventListener('focus', this._onRangeFocusClear);
if (this._onDocClick)       document.removeEventListener('click', this._onDocClick);
if (this._onKeydown)        document.removeEventListener('keydown', this._onKeydown);
```

**Step 3: Run `npm test`**

```bash
npm test
```

Expected: all boundary tests pass.

**Step 4: Manual smoke-test in browser**

1. Open `demo.html`, use input `#input2` (or any range-mode picker).
2. Pick a range — input shows `"date  ←  date"`.
3. Click into the input — value should immediately clear to `""` and the calendar footer should show "روز شروع را انتخاب کنید".
4. Pick a new start date — input updates to `"date  ←  ..."`.
5. Pick an end date — input shows the new range.
6. Tab away and Tab back to the input — same clear behaviour repeats.

**Step 5: Commit**

```bash
git add lib/pardis-jalali-datepicker.js
git commit -m "fix(range-input): clear selection and value on focus so user can re-pick cleanly"
```

---

### Task 3: Fix README "four" → "five" and update `setOption` docs

**Files:**
- Modify: `README.md`
  - Line ~387: "four independent classes" → "five independent classes"
  - Line ~126: `setOption` method description in Methods table

**Step 1: Fix the class count**

Find this line in `README.md`:

```
The library is composed of four independent classes:
```

Change `four` to `five`.

**Step 2: Update the `setOption` method description**

Find the Methods table row for `setOption`. It currently reads:

```
| `dp.setOption(key, value)` | Update an option after construction (currently supports `rangeMode` and `outputFormat` only) |
```

Replace with:

```
| `dp.setOption(key, value)` | Update an option after construction and re-render. Supports all constructor options: `rangeMode`, `outputFormat`, `minDate`, `maxDate`, `disabledDates`, `highlightedDates`, `maxRange`, `numeralType` |
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: fix class count (four->five) and update setOption supported keys"
```

---

### Task 4: Bump version, update CHANGELOG, tag, and push

**Files:**
- Modify: `package.json` — `"version": "1.1.1"` → `"1.2.0"`
- Modify: `CHANGELOG.md` — prepend new `[1.2.0]` section

**Step 1: Update `package.json`**

Change:
```json
"version": "1.1.1",
```
to:
```json
"version": "1.2.0",
```

**Step 2: Prepend to `CHANGELOG.md`**

Add a new section immediately after the `# Changelog` header preamble (before `## [1.1.1]`):

```markdown
## [1.2.0] - 2026-02-24

### Added
- `setOption()` now propagates all runtime-relevant options to the engine and triggers a re-render: `minDate`, `maxDate`, `disabledDates`, `highlightedDates`, `maxRange`, `numeralType` (in addition to existing `rangeMode` and `outputFormat`).

### Fixed
- Fixed range-mode input: focusing the input now clears the current selection and input value so the user can immediately start picking a fresh range without typing corruption.

### Changed
- Updated README `setOption` method description to list all supported keys.
- Fixed README architecture section: "four independent classes" corrected to "five".
```

**Step 3: Commit, tag, push**

```bash
git add package.json CHANGELOG.md
git commit -m "Release v1.2.0"
git tag v1.2.0
git push origin main --follow-tags
git push origin v1.2.0
```

**Step 4: Create GitHub Release**

Go to `https://github.com/alirezakariminejad/Pardis-Jalali-Datepicker/releases/new`, select tag `v1.2.0`, and use the `[1.2.0]` CHANGELOG section as release notes.

---

## Verification Checklist

- [ ] `npm test` passes after all tasks
- [ ] `setOption('minDate', {...})` causes calendar to re-render with correct disabled days
- [ ] `setOption('numeralType', 'latin')` switches digits without page reload
- [ ] `setOption('rangeMode', true)` still clears selection (existing behaviour preserved)
- [ ] `setOption('outputFormat', 'jalali')` does NOT trigger a visual re-render (payload-only change)
- [ ] Focusing a range input with a selected range clears the input and engine state
- [ ] After focus-clear, picking a new range works normally end-to-end
- [ ] `destroy()` cleanly removes the `_onRangeFocusClear` listener (no error in console)
- [ ] README Methods table `setOption` row lists all 8 supported keys
- [ ] README architecture sentence says "five independent classes"
- [ ] `package.json` version is `1.2.0`
- [ ] `CHANGELOG.md` has `[1.2.0]` section at the top
- [ ] Tag `v1.2.0` exists: `git tag --list | grep 1.2.0`
