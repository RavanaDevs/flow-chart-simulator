# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] — 2026-08-20

**Input and output moved out of the terminal panel and onto the blocks themselves.**

A console fuses input and output into one stream because a console has nowhere else to
put them. This app has somewhere else — the block that is asking is already on screen,
already highlighted, with the camera already centred on it. Everything below follows from
removing that borrowed constraint. See `docs/PLAN-V3.md` for the full reasoning.

### Added

- **Input prompts on the block.** A new `BlockPrompt` attaches to the Input block that is
  asking, showing the variable name, the expected type, and `n/total` progress when a
  block holds several names. The student never looks away from the block to answer it.
- **Output on the block.** Output blocks show what they last printed in an attached
  popover, scrollable when the block printed several lines, and updating on every pass of
  a loop.
- **Inline input errors.** `RunState` gained `inputError`, so typing a word where a number
  was expected reports at the field instead of silently clearing it.
- **Play / Pause.** The Run button now toggles. `isPlaying` is tracked separately from
  `state.status` in the run store, because stepping by hand also leaves the interpreter
  `running` — see *Fixed*.
- **Variable bar on the canvas.** Live variable values sit in a pill bar over the canvas,
  so watching a value change no longer means watching a different panel.
- **Run again from the Stop block.** When a program finishes, a reset button appears on
  the Stop block it finished at.
- **Light and dark themes, both deliberate.** Every token in both themes had zero chroma;
  both palettes were rebuilt with a cool neutral bias and a real `--primary`. Light is now
  the default — a lab machine set to dark should not decide this for a class — and a
  visible `ThemeToggle` sits in the toolbar.
- **Per-kind block colour.** Seven `--block-*` tokens, one hue per block kind in each
  theme, with fill derived from stroke through `color-mix` so the two can never drift.
  `KIND_COLOR_TOKENS` is a `Record<NodeKind, …>`, so `tsc` fails the build if a new kind
  forgets one.
- **Error badges on the canvas.** `NodeFrame`'s `severity` and `diagnosticMsg` props were
  rendered but never passed by anything. They now resolve from `compile()` diagnostics, so
  validation is visible on the block instead of only in a panel.
- **Collapsible record panel**, collapsed by default, with an error-count button in the
  collapsed rail that opens straight to Checks.
- **The palette collapses while a program runs**, giving the space to the canvas.
- `stores/run-store.test.ts` — coverage for play/pause, stepping, and input handling.

### Changed

- **Tabs renamed** to name the task rather than the machine:
  Terminal → **Output**, Variables → **Values**, Problems → **Checks**.
- **Monospace removed from the panels**, where it was decorative. It stays in
  `ExpressionField`, where the student is typing code.
- **Run states no longer erase block colour.** Active, finished and failed now draw as a
  ring underneath the shape, so a block keeps its identity at the moment the lesson
  depends on it. Failure is the one exception — an error should dominate.
- `PAD` in `geometry.ts` went from `2` to `4` to make room for that ring. Block `width` and
  `height` are unchanged, so every alignment invariant holds.
- **The camera zooms in to at least 0.75** when a program pauses for input, so the field is
  never too small to use.
- The theme hotkey now requires **Alt**; a bare `d` used to flip the theme for any student
  who clicked empty canvas and typed.
- The Run button uses `--primary` instead of a hardcoded `bg-emerald-600`, now that
  `--primary` is a real colour rather than near-black.

### Fixed

- **`font-mono` resolved to the wrong font, and broke Sinhala.** `--font-mono` was never
  mapped in the `@theme inline` block, so Tailwind fell back to its own stack: `Geist_Mono`
  was downloaded on every page load and never used, and every Sinhala string inside a
  `font-mono` element rendered in whatever the machine happened to supply rather than in
  the `Noto Sans Sinhala` that was loaded for it. The mapping now also carries Sinhala
  inside the mono stack, because a string literal in an Output block can hold Sinhala text.
- **A single Step click ran the whole program.** The auto-advance loop was gated on
  `status === "running"`, but stepping by hand leaves the interpreter in exactly that
  state. It is now gated on `isPlaying`.
- **The canvas rendered empty on mount when a document already existed** — after a page
  refresh, or on the remount that collapsing the right rail causes. The React Flow mirrors
  are now seeded from the document instead of from an empty array.
- The viewport now fits the whole flowchart when a run is reset, instead of staying wherever
  the last executed block left it.

### Removed

- `components/panels/terminal-prompt.tsx` — the input field lives on the block now.
- The three signposts that existed only to send the student somewhere else when a program
  paused for input: the "type in terminal" badge on the block, the toast, and the forced
  tab switch. All four signals pointed at the input field; none of them was the input field.

### i18n

Both catalogues stay in parity — `lib/i18n/parity.test.ts` fails on an orphan in either
direction, so each of these touched `ui-keys.ts`, the test's key list, `en.json` and
`si.json` together.

| Change | Keys |
|---|---|
| Added | `toolbar.pause`, `toolbar.theme`, `toolbar.themeLight`, `toolbar.themeDark` |
| Renamed | `tab.terminal` → `tab.output`, `tab.variables` → `tab.values`, `tab.problems` → `tab.checks` |
| Removed | `block.typeInTerminal`, `toast.inputPaused` |

### Unchanged by design

The flowchart itself does not move. The stadium, parallelogram, rectangle and diamond are
the syllabus and are what gets examined; `SHAPE_UNIT`, `SIZES` and grid snapping are
alignment invariants that break silently; `step()` keeps its purity and its signature; the
expression language and the document schema are untouched, so no migration is involved.

---

## [0.1.0] — 2026-08-19

The prototype this release builds on.

### Added

- All seven block types with connection rules, four-sided ports, and loops drawn as a
  back-edge from a Decision branch rather than a loop block.
- The expression language — lexer, parser, evaluator — with no truthiness, position-
  disambiguated `=`, and multi-line blocks that stay one step.
- `compile()` with validation surfaced in a Problems panel, and `step()` as a pure
  function, which is what makes Step Back a matter of keeping previous states in an array.
- Run / Step / Step Back / Reset, active-block highlight, edge animation, and a step
  budget that catches runaway loops.
- Terminal panel with inline prompts, and a variables watch panel.
- Snap-to-grid, autosave to `localStorage`, and JSON import/export with a versioned
  document schema.
- Structured errors throughout: `lib/` produces `{ code, params, span }` and a separate
  resolver turns it into a sentence plus a "what to do" hint.
- Sinhala localisation alongside English.
- Vercel Analytics and Speed Insights.

[0.2.0]: https://github.com/RavanaDevs/flow-chart/releases/tag/v0.2.0
[0.1.0]: https://github.com/RavanaDevs/flow-chart/releases/tag/v0.1.0
