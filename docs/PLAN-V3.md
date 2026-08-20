# Flowchart Simulator — Plan v3: Look and Feel

The terminal panel is being retired as the place students type and read. Input moves
onto the block that is asking; output attaches to the block that printed it; a record
panel keeps the full transcript. Both themes are rebuilt properly, with light as the
classroom default.

Nothing in this document has been implemented.

**Decisions already taken** (see the look-and-feel research for the reasoning):

- **Direction C** — the block asks, the block answers.
- **Both themes ship.** Light is introduced and becomes the default; dark stays, on a
  visible toggle rather than inherited from the OS.
- The **flowchart shapes do not change**. Stadium, parallelogram, rectangle and diamond
  are the syllabus; only their colour changes.

---

## 0. Why the terminal goes

Not because it looks dated. A console fuses stdin and stdout into one stream because a
console has nowhere else to put them. Here there *is* somewhere else: the block that is
asking is on screen, highlighted, with the camera already centred on it by
[`use-follow-node.ts`](../hooks/use-follow-node.ts). The constraint that earned the
terminal its shape does not exist in this app, so the shape goes with it.

The current code already admits this. When a program pauses for input, four things fire:

| # | What happens | Where |
|---|---|---|
| 1 | Camera pans to the waiting block | [use-follow-node.ts:19](../hooks/use-follow-node.ts#L19) |
| 2 | Right rail force-switches to the Terminal tab | [editor-shell.tsx:51-56](../components/editor/editor-shell.tsx#L51-L56) |
| 3 | A toast appears top-right | [editor-shell.tsx:58-65](../components/editor/editor-shell.tsx#L58-L65) |
| 4 | A badge bounces on the block reading **"type in terminal"** | [input-node.tsx:26-29](../components/flow/nodes/input-node.tsx#L26-L29) |
| — | *Where the caret actually is* | [terminal-prompt.tsx:42-52](../components/panels/terminal-prompt.tsx#L42-L52) |

Four signposts, none of which is the input field. Phase 3 replaces all four with the
field itself, in the place all four were pointing.

---

## 1. Findings this plan has to fix

### 1a — `font-mono` resolves to the wrong font, and breaks Sinhala

[globals.css:8-49](../app/globals.css#L8-L49) maps `--font-sans` into `@theme inline` but
**never maps `--font-mono`**. Tailwind v4 therefore resolves the `font-mono` utility to
its own default stack, so:

- `Geist_Mono` is downloaded on every page load and **never used**
  ([layout.tsx:12-15](../app/layout.tsx#L12-L15)).
- That default stack has no Sinhala coverage, and `Noto Sans Sinhala` is only reachable
  through `--font-sans`. Every Sinhala error message, prompt, and variable row renders in
  whatever the lab machine happens to supply.

Nine sites are affected: [terminal-line.tsx](../components/panels/terminal-line.tsx) (5),
[terminal-prompt.tsx](../components/panels/terminal-prompt.tsx) (2),
[terminal-panel.tsx](../components/panels/terminal-panel.tsx) (1),
[variables-panel.tsx](../components/panels/variables-panel.tsx) (1), plus two in
[expression-field.tsx](../components/flow/nodes/expression-field.tsx).

This is a shipped defect, not a style question. It is fixed first.

### 1b — Every colour in both themes is zero-chroma

[globals.css:51-118](../app/globals.css#L51-L118) declares every token as
`oklch(<L> 0 0)`. Pure neutral at every step in both themes. That is the direct cause of
the "unfinished" reading, and of `--primary` being near-black in light mode — which is
why the Run button has to hardcode `bg-emerald-600`
([toolbar.tsx:128](../components/editor/toolbar.tsx#L128)) instead of using the token.

### 1c — Block colour is defined, then discarded

[palette.tsx:20-63](../components/editor/palette.tsx#L20-L63) assigns every kind a colour.
[shape-svg.tsx:42](../components/flow/shapes/shape-svg.tsx#L42) draws every shape
`fill-card stroke-border` — identical grey. The colour exists only on 16px sidebar icons.

### 1d — Output lines do not know which block printed them

`TerminalLine`'s output variant is `{ kind: "output"; text: string }`
([state.ts:11-16](../lib/run/state.ts#L11-L16)). Direction C's output chip needs the
originating node, so this needs a field. It is the only `lib/` change in the plan that is
not optional.

### 1e — The theme hotkey is a bare `d`

[theme-provider.tsx:50](../components/theme-provider.tsx#L50) toggles the theme on an
unmodified `d` keypress. It correctly skips text fields, but a student who clicks empty
canvas and types will flip the theme with no idea why. There is no visible toggle at all.

---

## 2. Design

### 2.1 The font stack (fixes 1a)

Add one line to `@theme inline`, mirroring the `--font-sans` line that already works:

```css
--font-mono: var(--font-mono), var(--font-sinhala), ui-monospace, monospace;
```

Sinhala sits **inside** the mono stack rather than replacing it, because monospace still
earns its place in one location — `ExpressionField`, where the student is typing code.
String literals there can hold Sinhala (`"ආයුබෝවන්"`), so the fallback is required even
in blocks.

Monospace is then removed from the panels in Phase 5, where it is decorative. Keep it in
`ExpressionField`.

> **Verify after the edit**: `--font-mono` is set on `<html>` by `Geist_Mono` and
> re-declared in `@theme inline`. The `inline` keyword substitutes at the use site, which
> is why the identical `--font-sans` pattern works today — but confirm in the browser that
> block text actually renders in Geist Mono before moving on.

### 2.2 Two real palettes (fixes 1b)

Give the neutrals a slight cool bias so they read as chosen, and introduce a real primary
so `--primary` stops being near-black. Starting values, to be tuned in the browser:

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(0.985 0.003 250)` | `oklch(0.19 0.015 258)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.235 0.017 258)` |
| `--foreground` | `oklch(0.21 0.02 260)` | `oklch(0.96 0.005 250)` |
| `--muted-foreground` | `oklch(0.52 0.02 258)` | `oklch(0.72 0.02 255)` |
| `--border` | `oklch(0.91 0.006 255)` | `oklch(1 0 0 / 12%)` |
| `--primary` | `oklch(0.52 0.17 262)` | `oklch(0.72 0.14 262)` |
| `--primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.19 0.02 260)` |

Once `--primary` is a real colour, drop the hardcoded `bg-emerald-600` on the Run button
and let it use the token.

### 2.3 Block colour tokens (fixes 1c)

One hue token per kind, per theme. Fill is derived rather than declared, so fill and
stroke can never drift apart and dark mode needs no second set:

```css
:root {
  --block-start:     oklch(0.60 0.15 158);
  --block-process:   oklch(0.55 0.17 258);
  --block-input:     oklch(0.55 0.19 300);
  --block-output:    oklch(0.58 0.13 220);
  --block-if:        oklch(0.65 0.15 75);
  --block-stop:      oklch(0.58 0.20 25);
  --block-connector: oklch(0.65 0.02 255);
}
.dark {
  /* same hues, lifted and desaturated for a dark ground */
  --block-start:     oklch(0.72 0.13 158);
  /* … */
}
```

`ShapeSvg` then uses:

```
stroke: var(--block-input);
fill:   color-mix(in oklch, var(--block-input) 12%, var(--card));
```

Because `--card` differs per theme, the derived fill follows automatically.

The kind → token-name map lives in TypeScript as `Record<NodeKind, string>` so `tsc`
fails the build if a new kind forgets one — the same guarantee `SIZES` and `GROWS` in
[geometry.ts](../components/flow/shapes/geometry.ts) already give. Add it to the
"adding a node kind" checklist in `CLAUDE.md`.

`palette.tsx` reads the same map, so the sidebar icon and the canvas shape cannot
disagree.

### 2.4 Run state must not erase kind colour

This is the trap in 2.3. Today `runPhase` replaces fill *and* stroke
([shape-svg.tsx:48-53](../components/flow/shapes/shape-svg.tsx#L48-L53)). If it keeps
doing that, the block loses its identity at exactly the moment the lesson depends on it —
"the purple one is asking you".

So run state moves to a **second path drawn underneath** as a ring, and the shape keeps
its kind colour:

| State | Shape | Ring |
|---|---|---|
| Rest | kind stroke, 12% kind fill | none |
| Selected | kind stroke, heavier | `--primary`, thin |
| Active | unchanged | `--primary`, 6px, pulsing |
| Finished | unchanged | emerald, 6px, settles |
| Failed | **stroke → destructive** | destructive, 6px, settles |
| Diagnostic | dashed stroke in severity colour | none |

Failure is the one case where overriding the kind colour is right — an error should
dominate.

**Geometry note.** The ring needs room, so `PAD` in
[geometry.ts:48](../components/flow/shapes/geometry.ts#L48) goes from `2` to `4`. This
insets the drawn outline by 2px but **does not change `width` or `height`**, so every
alignment invariant and `geometry.test.ts` are untouched. Confirm the test still passes
rather than assuming.

### 2.5 The block asks (Direction C, input)

A new `components/flow/nodes/block-prompt.tsx`, rendered from `input-node.tsx` in the
position the bouncing badge occupies today.

**Content.** The variable being asked for, the expected type, the field, and — when the
block holds several names — progress. `RunState.pendingInput` already carries everything
needed (`varName`, `type`, `index`, `total`), so no lib change is required for this part.

**Four mechanics that will bite if skipped:**

1. **Zoom floor.** A 14px field inside a canvas at 0.4 zoom is unusable. `use-follow-node`
   currently passes `zoom: getZoom() || 1`; when status is `awaiting-input` it must pass
   `Math.max(getZoom(), MIN_ASK_ZOOM)` with `MIN_ASK_ZOOM = 0.75`.
2. **Focus without scroll-jacking.** Calling `.focus()` on an input inside a transformed
   container makes the browser scroll that container and fight React Flow's transform. Use
   `inputRef.current?.focus({ preventScroll: true })`. Focus immediately — do not wait out
   the 300ms pan.
3. **`nodrag nowheel`** on the callout and the field, or typing drags the node and
   scrolling zooms the canvas. `ExpressionField` already does this; copy it.
4. **Stacking.** Ports and the delete button are `z-30` in
   [node-frame.tsx](../components/flow/nodes/node-frame.tsx). The callout must sit above
   them and must not swallow port hit areas — anchor it to the side, clear of the port
   midpoints.

**Inline error on a bad number.** Today a typo appends an error line to the terminal and
re-asks ([input.ts:31-47](../lib/run/input.ts#L31-L47)). Off-canvas, the student never
sees it. Add to `RunState`:

```ts
inputError: RunError | null;
```

Set by `provideInput` when the number parse fails, cleared on a successful submit, on a
new prompt, and in `initialState()`. The error line still goes to the terminal for the
record; `inputError` is what the callout renders.

This keeps the rule that errors are structured objects the UI never infers. The
alternative — scanning `state.terminal` for a trailing error line — needs no lib change
but makes the component guess at something the state should simply say.

`provideInput` stays pure, so the `deepFreeze` guard in `step.test.ts` still holds.

**Accessibility.** The callout gets `aria-live="assertive"` and the field a real
`<label>`; a student on a screen reader currently gets nothing at all when the program
pauses.

**Deletions in this phase** — all four signposts go:

- `components/panels/terminal-prompt.tsx` — delete the file
- the toast effect, [editor-shell.tsx:58-65](../components/editor/editor-shell.tsx#L58-L65)
- the tab force-switch, [editor-shell.tsx:51-56](../components/editor/editor-shell.tsx#L51-L56)
- the badge, [input-node.tsx:26-29](../components/flow/nodes/input-node.tsx#L26-L29)

### 2.6 The block answers (Direction C, output)

The output variant of `TerminalLine` gains the originating node (fixes 1d):

```ts
| { kind: "output"; text: string; nodeId: NodeId }
```

`output-node.tsx` then renders the most recent line from its own id as an attached chip.
It persists until reset, and **updates on each pass of a loop** — which is worth keeping
rather than smoothing over, because watching the value change on each iteration is the
whole lesson.

Touches: `lib/run/state.ts`, the output emission in `lib/run/step.ts`, and any test
asserting on output lines. `RunState` is never persisted, so no migration is involved.

### 2.7 The record panel

`TerminalPanel` and `TerminalLine` keep their data and change their presentation: a page,
not a log. Proportional type, real leading, run separators. The `TerminalLine` union does
not change beyond 2.6.

Tab labels currently name the machine, not the task. Rename — and note that
`parity.test.ts` fails on orphaned keys in **both** directions, so every rename touches
four files:

| Now | Becomes | Key |
|---|---|---|
| Terminal | Output | `tab.terminal` → `tab.output` |
| Variables | Values | `tab.variables` → `tab.values` |
| Problems | Checks | `tab.problems` → `tab.checks` |

Drop `font-mono` from all four panel files. Keep it in `ExpressionField`.

### 2.8 Theme toggle (fixes 1e)

- `defaultTheme` → `"light"`, `enableSystem` → `false` in
  [theme-provider.tsx:13-14](../components/theme-provider.tsx#L13-L14). A lab machine set
  to dark should not decide this for a class.
- Add a visible `ThemeToggle` beside `LocaleToggle` in the toolbar.
- Keep the hotkey but require a modifier, or drop it. A bare `d` is a hazard once students
  are clicking around the canvas.

New keys: `toolbar.theme`, `toolbar.themeLight`, `toolbar.themeDark`.

### 2.9 Two modes

The riskiest change, and the one with the least evidence behind it, so it goes last.

Building needs the palette, the canvas and checks. Watching needs output, values, speed
and step. They share almost nothing, and all of both is on screen permanently: ten toolbar
controls, seven palette items, three tabs.

When `status !== "idle"`, collapse the palette and give the space to the record. Swap the
document controls (New / Import / Export) for the run controls. Keep it reversible and
keep it modest.

While here, wire the dead `severity` / `diagnosticMsg` path on `NodeFrame` — the badge and
outline are already written and nothing has ever passed them
([node-frame.tsx:80-95](../components/flow/nodes/node-frame.tsx#L80-L95)). Map `compile()`
diagnostics by `nodeId` and thread them down.

---

## 3. Phases

Each phase ships on its own and leaves the app working. Ordered so each one removes a
reason the next was hard.

### Phase 1 — Foundation

Nothing visible moves; everything after this depends on it.

- [ ] Map `--font-mono` in `@theme inline` with the Sinhala fallback (2.1)
- [ ] Verify in-browser that block text renders in Geist Mono and Sinhala renders in Noto
- [ ] Rebuild both palettes with non-zero chroma (2.2)
- [ ] Add the seven `--block-*` tokens for both themes (2.3)
- [ ] Drop `bg-emerald-600` from the Run button; use `--primary`
- [ ] `defaultTheme: "light"`, `enableSystem: false`, add `ThemeToggle`, fix the `d` hotkey (2.8)

**Done when** the app looks deliberately coloured in both themes, the toggle works, and
Sinhala renders correctly everywhere. `pnpm lint && pnpm typecheck && pnpm test` clean.

### Phase 2 — Colour on the canvas

- [ ] `Record<NodeKind, string>` token map; `ShapeSvg` takes fill/stroke from it (2.3)
- [ ] `PAD` 2 → 4; add the ring path; re-layer run states so kind colour survives (2.4)
- [ ] `palette.tsx` reads the same map
- [ ] Confirm `geometry.test.ts` still passes
- [ ] Add the token map to the "adding a node kind" list in `CLAUDE.md`

**Done when** a student can tell input from output from process at a glance, at rest and
while running.

### Phase 3 — The block asks

The core of Direction C, and the largest single gain.

- [ ] `block-prompt.tsx`, rendered from `input-node.tsx`
- [ ] `MIN_ASK_ZOOM` in `use-follow-node.ts`
- [ ] `focus({ preventScroll: true })`, `nodrag nowheel`, stacking above ports
- [ ] `inputError` on `RunState`; set, cleared, and in `initialState()`
- [ ] `aria-live` + `<label>`
- [ ] Delete: `terminal-prompt.tsx`, the toast, the tab force-switch, the badge
- [ ] Remove `block.typeInTerminal` and `toast.inputPaused` from `ui-keys.ts`,
      `ALL_UI_KEYS`, `en.json`, `si.json`
- [ ] Cover `inputError` in the run tests

**Done when** a student never has to look away from the block to answer it.

### Phase 4 — The block answers

- [ ] `nodeId` on the output `TerminalLine` variant; emit it in `step.ts`
- [ ] Update affected tests and fixtures
- [ ] Output chip on `output-node.tsx`, updating on each loop pass

**Done when** you can read a finished flowchart's results off the canvas alone.

### Phase 5 — The record and the two modes

- [ ] Rebuild the panel as a page; drop `font-mono` from the four panel files (2.7)
- [ ] Rename the three tabs across all four i18n locations
- [ ] Mode split (2.9)
- [ ] Wire `NodeFrame` `severity` from `compile()` diagnostics

**Done when** the right rail reads as a record of what happened, and the screen shows the
job at hand rather than every job.

---

## 4. What is deliberately not changing

| Element | Verdict | Reason |
|---|---|---|
| Stadium / parallelogram / rectangle / diamond | Untouched | Standard notation; this is what is examined |
| `SHAPE_UNIT`, `SIZES`, snapping | Untouched | Alignment invariant; breaks silently |
| Four-sided ports, `branchOf()` | Untouched | Load-bearing for loops |
| `step()` purity and signature | Untouched | Guarded by `deepFreeze` |
| The expression language | Untouched | Out of scope for a look-and-feel plan |
| Document schema / `migrate.ts` | Untouched | No persisted field changes |

---

## 5. Open questions

1. **Where does the ask callout anchor?** The mockup puts it to the right. Blocks near the
   right edge of the viewport will push it off screen. Flip to the left on collision, or
   always place it on the side with more room?
2. **Does the output chip survive a reset?** Proposed: no, cleared with the run. But a
   student comparing two runs might want the previous value held. Needs a classroom
   answer, not a design one.
3. **How much of the terminal record is still needed** once blocks show their own output?
   Possibly only errors and the run separator. Decide after Phase 4, on evidence.
4. **Does the mode split confuse more than it helps?** Phase 5 is last precisely so this
   can be answered with a working Phase 1–4 in front of students.

## 6. Assumptions

- Light default is right for a lit lab and a projector; dark remains one click away.
- `color-mix(in oklch, …)` is acceptable — it is supported in all current targets, but if
  the school lab runs older browsers, fall back to declaring fill tokens explicitly.
- No new node kinds are being added during this work.
