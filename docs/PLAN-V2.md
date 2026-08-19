# Flowchart Simulator — Plan v2

Six issues from testing, plus a seventh requirement added afterwards: **loops must be drawable, and port directions must be changeable to support them.** That requirement reshapes issue 3a rather than sitting beside it, so it is folded in below.

Your list numbered two items as "3", so they are split here as **3a** (port positions) and **3b** (animation after stop). Nothing in this document has been implemented.

---

## 0. Loops: what already works, and what doesn't

Worth separating, because the answer is not "loops are missing".

**Loop semantics are already implemented and tested.** There is no loop block by design — a loop is an edge from an `if` branch back to an earlier node. That path works end to end today:

- `compile()` resolves back-edges correctly (reachability is a BFS, so a cycle is just a node already in the visited set).
- The `sum1To10` fixture is a counted accumulator loop and passes.
- The `countdown` fixture is an input-driven loop that pauses *inside* the loop body and resumes; it passes.
- Runaway loops trip `STEP_BUDGET_EXCEEDED`, and `detectCycle` already names the repeating nodes.

**What doesn't work is drawing them.** Every ordinary block emits from a single handle at the bottom, and every block receives at a single handle on top. A back-edge therefore has to leave the bottom of the last block in the loop body, travel down and around, and re-enter the top of the target. `getSmoothStepPath` routes that as a long detour that crosses the forward path. The loop is correct and unreadable.

So this is not a new capability — it is the port-direction work in 3a, and the loop case is what sets its requirements. Concretely, a back-edge needs **an outlet on a side other than the bottom**, which my earlier draft of 3a did not provide: it added inbound handles on three sides but left every outbound handle pinned to the bottom. That draft would not have fixed loop routing. This version does.

---

## 1. Findings — what is actually wrong

### Issue 1 — no way to add a Start block, no way to clear the canvas

Two separate gaps.

**Clear all: genuinely missing.** `resetGraph` exists in [graph-store.ts:141](../stores/graph-store.ts#L141) and is called from **nowhere** — I grepped `components/`, `hooks/`, and `stores/`. There is no New/Clear control in the toolbar.

**Add Start: was unreachable, now reachable.** [palette.tsx](../components/editor/palette.tsx) already has a Start item that hides itself when a start node exists (`hasStart`). The problem was that a start node could never *stop* existing: [node-frame.tsx](../components/flow/nodes/node-frame.tsx) hides the delete button for `kind === "start"`, and before the drag fix there was no `onNodesChange`, so the Delete key was inert for every node. Start was permanently present, so the palette item was permanently hidden.

Adding `onNodesChange` made Delete work, so Start can now be removed and re-added from the palette. That resolves half of this issue as a side effect — but it is currently *undocumented behaviour that happens to work*, and it deserves an explicit decision (§2.9) rather than being left to chance.

### Issue 2 — nodes should snap to grid

`snapToGrid` and `snapGrid` are not set on `<ReactFlow>` in [flow-canvas.tsx](../components/flow/flow-canvas.tsx). `<Background gap={16} />` draws a 16px grid that nothing snaps to, so the visible grid is decorative.

### Issue 3a — port directions

Current handles:

| Node | Handles today |
|---|---|
| `start` | source Bottom |
| `stop` | target Top |
| `input` / `output` / `process` | target Top, source Bottom |
| `if` | target Top, source `true` Bottom, source `false` Right |

Four things block the change:

1. **`targetHandle` is not persisted at all.** [types.ts](../lib/graph/types.ts) declares `FlowEdge = { id, source, target, sourceHandle }`. Add target handles and every edge re-attaches to the default side on reload. This is a document schema change.
2. **`sourceHandle` is typed as the logical branch**, `BranchHandle = "true" | "false"`. Two physical false handles cannot both be `"false"` — React Flow handle ids must be unique per node.
3. **`compile()` matches raw handle strings.** [compile.ts](../lib/graph/compile.ts) filters `e.sourceHandle === "true"` / `=== "false"`, and the one-edge-per-handle rule keys off the raw string. With several physical handles per branch, a student could connect two of them and get a nondeterministic flowchart that compiles cleanly. That is the real hazard here.
4. **Direction is currently enforced by handle absence.** `start` has no target handle and `stop` has no source handle, so those connections are structurally impossible. I confirmed `compile()` contains **no** start-inbound or stop-outgoing check — it relies entirely on the canvas. Putting ports on every side removes that guarantee, so the checks have to be written (§3).

There is also a display bug waiting: [flow-edge.tsx](../components/flow/edges/flow-edge.tsx) renders `{sourceHandleId}` directly as the pill label, so it would print `false-left` on the canvas.

### Issue 3b — after stop, the node should animate, not the path

Reproduced, and the cause is exact. In [step.ts](../lib/run/step.ts), the `stop` case sets `status: "finished"` and `currentNodeId: null` but **never clears `lastEdgeId`**. So on finish:

- `isTravelling` in [flow-edge.tsx](../components/flow/edges/flow-edge.tsx) stays true for the last edge → the marching-ants animation runs **forever**, on a program that is no longer running.
- `currentNodeId: null` means `isActive` is false for every node → **nothing is highlighted**, so the student cannot see where the program ended.

Exactly inverted from what it should be. Reading your note as: *when the program finishes, the Stop block should be the thing that animates, and the path animation should stop.*

### Issue 4 — arrowheads

No `markerEnd`, no `MarkerType`, no `<marker>` definition anywhere in `components/` or `app/globals.css`. [flow-edge.tsx](../components/flow/edges/flow-edge.tsx) renders `<BaseEdge path={...}>` with a stroke and nothing else, so every connection is a plain line. On a flowchart — and especially on a loop, where the back-edge is the one you most need to read direction from — this is the most severe of the six visually.

### Issue 5 — one input block, several variables

Blocked at the lexer. [tokens.ts](../lib/lang/tokens.ts) has no `COMMA` kind and [lexer.ts](../lib/lang/lexer.ts) has no `,` case, so a comma raises `LEX_UNKNOWN_CHARACTER`.

Above that, the runtime is single-variable by construction: `RunState.pendingInput` is `{ nodeId, varName, type }`, and `provideInput()` assigns one variable then immediately advances to `next`. Prompting three times from one block requires the pause to survive across several submissions.

### Issue 6 — comma-separated output

Same lexer gap. `CompiledNode.output` holds a single `expr`, and [step.ts](../lib/run/step.ts) evaluates one value and formats it. Needs a list.

### Incidental finding

`KEYWORDS` in [keywords.ts](../lib/lang/keywords.ts) reserves `START`, `STOP`, `INPUT`, `OUTPUT`, `IF`, `THEN`, `ELSE` — but the language has no statement keywords at all; the graph carries control flow. So a student cannot name a variable `output` or `input` for no reason, and `THEN`/`ELSE` are unreachable tokens. Recommend reducing the reserved set to `AND`, `OR`, `NOT`, `TRUE`, `FALSE`.

---

## 2. Design

### 2.1 Four-sided ports (Issues 3a + loops)

**Every node gets a port on all four sides, and a port both sends and receives.** That is what makes a back-edge leave from the top or the side instead of diving under the whole loop body.

React Flow's `ConnectionMode.Loose` allows a connection between handles regardless of declared type, which is what lets one handle per side serve both directions. Without it you would need a source *and* a target handle stacked on every side — eight per node, visually unusable.

| Node | Ports | Notes |
|---|---|---|
| `start` | `port-top`, `port-right`, `port-bottom`, `port-left` | outbound only, enforced in validation |
| `stop` | same four | inbound only, enforced in validation |
| `input` / `output` / `process` | same four | any side in, any side out |
| `if` | `port-top` (inbound), `true-bottom`, `false-left`, `false-right` | branch outlets stay labelled; all four can also receive |

The `if` node keeps **named, visible** branch handles rather than generic ports. A 14-year-old should be able to read "true" and "false" off the diamond itself; making the branch an invisible edge property would trade that away for symmetry nobody asked for. Putting `false` on both the left and right vertices is your original 3a request, and it is what lets a false-branch loop exit toward whichever side the loop body sits on.

The one rule that keeps execution deterministic is **one outgoing edge per logical branch**, and it must survive several physical handles mapping to one branch. Same mechanism as before, now doing more work:

```ts
// lib/graph/handles.ts   (new, pure TS — no React)
export type PortId =
  | "port-top" | "port-right" | "port-bottom" | "port-left"
  | "true-bottom" | "false-left" | "false-right"

/** Which logical branch a physical port feeds. null = the node's single output. */
export function branchOf(handle: string | null): "true" | "false" | null {
  if (handle === "true-bottom") return "true"
  if (handle === "false-left" || handle === "false-right") return "false"
  return null
}

export const PORTS: Record<NodeKind, PortId[]>
```

`compile()` stops matching raw strings and groups by `branchOf()`:

```ts
const byBranch = groupBy(outgoing, (e) => branchOf(e.sourceHandle))
// byBranch.get("false") holds edges from BOTH false-left and false-right
// byBranch.get(null)    holds every outlet of an ordinary node
```

So connecting `false-left` *and* `false-right`, or two different sides of one process block, raises the existing `MULTIPLE_OUTGOING_EDGES` error instead of compiling into a coin flip. `isValidConnection` calls the same helper, so the second edge is refused at connect time with the existing toast.

**The cost, stated plainly.** Plan v1 leaned on "structurally impossible beats rejected": `start` had no target handle, so it could not receive an edge, full stop. Four-sided ports give that up — direction now lives in `isValidConnection` plus two new `compile()` checks (§3). That is a genuine downgrade in a principle I argued for, and it is the price of drawable loops. It is worth paying, but the compile-side checks are not optional: without them an imported JSON file could contain an edge into `start`, and `step()` would be handed a graph its types say cannot exist.

`flow-edge.tsx` must render `branchOf(sourceHandleId)` as the pill label and pick its colour from that, or it will print `false-left` on the canvas.

**Loop routing.** With outlets on every side, a back-edge from the last body block to the loop head leaves sideways and re-enters sideways, so `getSmoothStepPath` routes it as a clean bracket beside the loop body instead of a detour underneath it. No custom routing code — the handle positions do the work.

### 2.2 Document schema v2 (Issues 3a, 5)

```ts
export type FlowEdge = {
  id: EdgeId
  source: NodeId
  target: NodeId
  sourceHandle: PortId | null   // NEW meaning: which side it leaves from
  targetHandle: PortId | null   // NEW field entirely
}

// input node data, was { varName: string; valueType }
BaseNode<"input", { names: string; valueType: InputValueType }>
//                  ^ raw text: "age, score" — parsed at compile time
```

`FlowDocument.version` goes to `2`. `lib/persistence/migrate.ts` was specified in plan v1 but never created — this is the change that needs it:

| v1 | v2 |
|---|---|
| `sourceHandle: null` | `"port-bottom"` |
| `sourceHandle: "true"` | `"true-bottom"` |
| `sourceHandle: "false"` | `"false-right"` (where it used to render, so layouts don't move) |
| no `targetHandle` | `"port-top"` (`"if"` targets too) |
| `input.data.varName: "x"` | `input.data.names: "x"` |

A v2 reader must accept v1 documents — students have autosaved work in `localStorage["flowchart-sim:doc:v1"]` right now, and silently dropping it is the one failure mode that loses real classwork. `validateImport` gets a version switch; unknown or newer versions raise a clear error rather than half-loading.

### 2.3 Comma support (Issues 5, 6)

Lexer: add `COMMA` to `TokenKind` and a `,` case. That is the whole lexer change; the expression grammar never accepts a comma, so `if a, b` continues to fail with `PARSE_TRAILING_INPUT`.

Two new parser entry points alongside the existing three:

```ts
parseIdentifierList(src: string): Ok<{ names: string[]; spans: Span[] }> | Err<RunError>
parseOutputList(src: string):     Ok<{ exprs: Expr[] }> | Err<RunError>
```

Both are `item ("," item)*` with at least one item. Trailing comma, empty item, and duplicate names are errors carrying per-item spans, so the underline lands on the offending name rather than the whole block.

`parseIdentifier` (singular) stays until the input node moves over, then is deleted.

### 2.4 Multi-variable input (Issue 5)

```ts
// lib/graph/program.ts
{ kind: "input"; id; varNames: string[]; valueType; next; nextEdgeId }

// lib/run/state.ts
pendingInput: {
  nodeId: NodeId
  varName: string          // the one being asked for right now
  type: InputValueType
  index: number            // 0-based position in varNames
  total: number            // lets the prompt say "2 of 3"
} | null
```

`step()` on an `input` node: enter `awaiting-input` at `index: 0` and push a prompt for `varNames[0]`. It still does not advance.

`provideInput()` gains one branch:

```
parse + validate            (unchanged; a bad number still re-prompts the SAME index)
assign varNames[index]
push echo line
if (index + 1 < total)  -> stay awaiting-input, index + 1, push the next prompt
else                    -> advance to next, status "running"
```

The terminal then reads as a real console — prompt, answer, prompt — and needs no new UI.

`compile()`'s definite-assignment pass adds **all** `varNames`. Duplicates inside one block raise `DUPLICATE_INPUT_NAME`.

**Recommendation: one type selector per block, not per variable.** `input age, score` are both numbers; mixed types need two blocks. Per-variable types would mean a repeating row UI inside a fixed-height parallelogram, which undoes the seamless-field work from the last round. One prompt-type per block also reads more clearly. Flagged in §5.

### 2.5 Comma-separated output (Issue 6)

```ts
{ kind: "output"; id; exprs: Expr[]; next; nextEdgeId }
```

`step()` evaluates left to right, stops at the first error (so the span points at the offending item), formats each with the existing `formatValue`, and joins.

**Join with the empty string, not a space.** `output "Total: ", total` gives `Total: 55` — the student controls spacing through the literal, and what they type is what they get. Joining with a space makes `output "Rs.", price` print `Rs. 400` with a space they did not ask for and cannot remove. Flagged in §5.

No migration needed: an existing single-expression `source` parses as a one-item list.

### 2.6 Finish state (Issue 3b)

In `step()`'s `stop` case:

```ts
status: "finished",
currentNodeId: currNode.id,   // was null — keep it so the Stop block stays lit
lastEdgeId: null,             // was left set — this is what kept the path animating
```

`step()` already returns early for `finished`, so holding `currentNodeId` cannot restart execution. `use-follow-node` then pans to the Stop block at the end, which is the right place to leave the viewport.

`shape-svg.tsx` gets a distinct finished treatment rather than reusing the running `animate-pulse` — a settled ring reads as "arrived" where a continuous pulse reads as "still working". The `error` status has the identical defect today: the last edge keeps animating after a crash. Same fix.

### 2.7 Arrowheads (Issue 4)

`markerEnd` per edge, coloured to match its line:

```ts
markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: <branch colour> }
```

React Flow generates the `<marker>` defs, so no hand-written SVG. The colour must be a concrete value — `currentColor` and Tailwind classes do not reach a generated marker def — so branch colours move into a shared constant used by both the stroke and the marker, resolved per theme at render rather than hardcoded.

### 2.8 Snap to grid (Issue 2)

`snapToGrid` + `snapGrid={[16, 16]}` matching `<Background gap={16} />`, so the visible grid is the grid you snap to. `addNode` (palette click and drop) rounds to the same lattice, and `DEFAULT_START_NODE` moves to an on-grid position. Snapping also makes loop-back edges line up instead of running one or two pixels off parallel.

### 2.9 Clear canvas and Start (Issue 1)

- **Toolbar gets a "New" control** wired to the existing `resetGraph()`, behind a shadcn `dialog` confirm. It clears the canvas *and* the autosave slot *and* calls `resetRun()` — clearing the graph mid-run would otherwise leave a stale `Program` in the run store.
- `resetGraph()` already restores a Start node, so New gives a usable blank chart rather than one that immediately fails `NO_START`.
- **Start deletion becomes an explicit decision.** Recommend keeping it deletable — the palette entry only means anything if Start can be absent — but showing the palette item greyed out rather than vanishing, so a student can see the block exists and why it is unavailable.

---

## 3. Error catalogue additions

Each needs an `en.json` entry with `message` + `hint`; the existing parity test fails until they do.

| Code | Params | Raised by |
|---|---|---|
| `START_HAS_INBOUND` | `{}` | compile — **new requirement**, was structurally impossible before four-sided ports |
| `STOP_HAS_OUTGOING` | `{}` | compile — same reason |
| `PARSE_TRAILING_COMMA` | `{}` | list parsers |
| `PARSE_EMPTY_LIST_ITEM` | `{ index }` | list parsers |
| `DUPLICATE_INPUT_NAME` | `{ name }` | compile, input block |
| `OUTPUT_EMPTY` | `{}` | compile, empty output block |
| `UNSUPPORTED_DOCUMENT_VERSION` | `{ found, expected }` | import / migrate |

`MULTIPLE_OUTGOING_EDGES` gains a `branch` param so the message can say *"the false path already has an arrow"* instead of naming a handle the student never sees.

---

## 4. Build sequence

Ordered by risk and dependency. Each milestone is independently verifiable and leaves all gates green.

**M1 — Canvas quick wins (Issues 2, 4, 1).** Snap to grid; arrowheads with per-branch colour; New/Clear dialog wired to `resetGraph` + `resetRun` + autosave clear; palette Start greyed rather than hidden.
*Verify:* by hand — blocks land on the grid, every edge has a head, New clears to a single Start, deleting Start and re-adding it works.

**M2 — Finish state (Issue 3b).** Clear `lastEdgeId` and hold `currentNodeId` on `finished` and on `error`; distinct settled styling.
*Verify:* headless tests asserting `lastEdgeId === null` and `currentNodeId === <stop id>` after `hello` finishes, and the same after `divideByZero` errors.

**M3 — Comma lexer + output lists (Issue 6).** `COMMA` token, `parseOutputList`, `output.exprs`, concatenating `step()`.
*Verify:* lexer test for `,`; parser tests for one item, three items, trailing comma, empty item; a `greeting` fixture running `output "Hello, ", name, "!"` end to end.

**M4 — Multi-variable input (Issue 5).** `parseIdentifierList`, `varNames[]`, `pendingInput.index/total`, resume loop, definite assignment over all names, `DUPLICATE_INPUT_NAME`.
*Verify:* a `multiInput` fixture asserting three prompts, three echoes, and that a bad number re-prompts **the same** variable rather than skipping it. That last assertion is the one that matters.

**M5 — Four-sided ports, loop routing, schema v2 (Issue 3a + loops).** `lib/graph/handles.ts`; `ConnectionMode.Loose`; port layouts; `targetHandle` persisted; `compile()` grouping by `branchOf`; `START_HAS_INBOUND` / `STOP_HAS_OUTGOING`; `isValidConnection` by branch and direction; edge label via `branchOf`; document v2 + `migrate.ts`.
*Verify:*
- compile tests connecting `false-left` **and** `false-right` from one `if` → `MULTIPLE_OUTGOING_EDGES`;
- compile tests for an edge into `start` and an edge out of `stop` → the two new codes;
- a migration test loading a v1 fixture and asserting `"false"` → `"false-right"` and `targetHandle` → `"port-top"`;
- rebuild `sum1To10` by hand on the canvas with the back-edge leaving sideways, and confirm it reads cleanly and still prints 55;
- confirm a real autosaved v1 chart still opens.

M5 is last because it is the only milestone that can destroy saved work, and because the loop-routing payoff is only visible once arrowheads and snapping (M1) are in.

---

## 5. Open questions

1. **Is `ConnectionMode.Loose` acceptable?** It is what buys one port per side instead of eight handles per node, but it moves direction enforcement from "impossible" to "validated" (§2.1). The alternative is keeping Strict mode and stacking separate in/out handles per side — safer, considerably uglier. I recommend Loose plus the two new compile checks.
2. **Should the `if` node's `true` branch also get a second position?** Right now the plan gives `false` two sides (your request) and `true` only the bottom. For a `DO … WHILE`-shaped loop the *true* branch is the back-edge, so it may want a side outlet too.
3. **Join separator for comma output** — recommending `""` (§2.5). If the syllabus prints `OUTPUT a, b` with a space between items, say so; it is a one-line change that alters every worked example.
4. **One input type per block, or per variable** — recommending per block (§2.4). Does the syllabus need `input name, age` with mixed types in one block?
5. **Is my reading of Issue 3b right** — on finish, animate the Stop block and stop the path animation? The alternative reading is that you want node-based animation for *every* step, with edge animation dropped entirely.
6. **Reserved words** — shrink to `AND OR NOT TRUE FALSE` so `input`/`output` can be variable names?

---

## 6. Still open from the previous review

Not part of these issues, not addressed here, listed so they do not get lost:

- Terminal line cap is broken — 9,000 steps produce 4,499 lines with 2,249 `OUTPUT_TRUNCATED` notices. **Issues 5 and 6 both increase output volume, and loops are the thing that generates thousands of lines**, so this gets worse with this work. Fold into M3.
- `UNKNOWN_VARIABLE` with no near-match renders `Did you mean ''?`.
- User-facing English outside the resolver: four system-code strings in `terminal-line.tsx`, and eleven sentences returned as `error: string` from inside `lib/persistence/validate-import.ts`. **M5's migration work edits that same file** — fold it in there.
- "Instant" speed is 20ms/step, unbatched, so a runaway loop takes ~200s to report `STEP_BUDGET_EXCEEDED`. Loops make this the common case, not the rare one; worth pulling forward into M1.
- `EDIT_DURING_RUN` is defined and rendered but never pushed.

---

## 7. Assumptions

1. Grid is **16px**, matching the existing `<Background gap={16} />`.
2. Ports are fixed at the four side midpoints — a student picks a side by dragging from it, not by configuring the node. "Changing the port direction" therefore means "connect from a different side", with no extra UI to discover.
3. Self-loops stay rejected. A single block looping to itself is always an infinite loop, never a legitimate flowchart.
4. `false-left` / `false-right` are internal ids; the student never sees those strings — the canvas label and every message say "false".
5. `port-*` ids are written explicitly into v2 documents rather than left null, so the side a student chose survives a reload.
6. New/Clear also clears the autosave slot; otherwise a reload resurrects the chart they just cleared.
7. Arrowheads use `MarkerType.ArrowClosed` at 18px on every edge, branch edges included.
8. Snapping applies to drags, palette clicks, and palette drops — anywhere a position is produced.
9. Comma lists allow whitespace freely: `input a,b` and `input a , b` both parse.
