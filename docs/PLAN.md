# Flowchart Simulator — Implementation Plan

Status: **proposal, nothing built.** Nothing outside this file has been created or modified.

---

## 1. Repo inventory

### What is actually installed

Read from `package.json`, `pnpm-lock.yaml`, and `node_modules`.

| Package | Version | Note |
|---|---|---|
| `next` | **16.2.6** | App Router, Turbopack is the default bundler in 16 |
| `react` / `react-dom` | **19.2.4** | |
| `@base-ui/react` | **1.7.0** | see below — this is not Radix |
| `shadcn` | 4.18.0 | CLI **and** a runtime dep (`@import "shadcn/tailwind.css"` in `app/globals.css`) |
| `tailwindcss` | v4 | CSS-first config, no `tailwind.config.*` |
| `next-themes` | 0.4.6 | wired in `components/theme-provider.tsx`, `d` toggles dark mode |
| `lucide-react` | 1.32.0 | icon library per `components.json` |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` | | standard shadcn support deps |
| `eslint` 9 + `eslint-config-next` 16.2.6 | | **flat config** in `eslint.config.mjs` |
| `prettier` 3.8.3 + `prettier-plugin-tailwindcss` | | no semicolons, double quotes, 80 cols, es5 trailing commas |
| `typescript` 5 | | `strict: true`, `@/*` → `./*` |

Package manager is **pnpm** (there is a `pnpm-lock.yaml` and a `pnpm-workspace.yaml` with `packages: []`).

### The single most important finding: this is Base UI shadcn, not Radix

`components.json` sets `"style": "base-nova"`, and `components/ui/button.tsx` imports from `@base-ui/react/button`. This is the newer shadcn distribution built on **Base UI**, not `@radix-ui/react-*`.

Consequences:

- Component **props and composition differ from Radix-era shadcn**. Do not write shadcn code from memory. Before using any component, run `pnpm dlx shadcn docs <name>` or read the generated file — the CLI has a `docs` subcommand for exactly this.
- Base UI ships no `resizable` primitive. The shadcn `resizable` item still wraps `react-resizable-panels` (confirmed by fetching `https://ui.shadcn.com/r/styles/base-nova/resizable.json`).
- `AGENTS.md` already warns that this Next.js is not the one in training data, and that `node_modules/next/dist/docs/` is the source of truth. That warning applies doubly to shadcn here.

### shadcn components: installed vs. needed

**Installed:** `button` only (`components/ui/button.tsx`).

**Needed** (verified against the live `base-nova` registry; npm deps listed where non-zero):

| Component | Extra npm dep | Used for |
|---|---|---|
| `input` | — | inline block editors, terminal prompt, filename fields |
| `label` | — | block editors, panels |
| `select` | — | input-block type selector (`number` / `text`) |
| `tooltip` | — | validation badges, palette hints, toolbar |
| `dialog` | — (pulls `button`) | import/export, confirm-clear |
| `card` | — | side panels |
| `separator` | — | panel dividers |
| `badge` | — | variable types in the watch panel, error counts |
| `tabs` | — | right rail: Terminal / Variables / Problems |
| `resizable` | **`react-resizable-panels`** | canvas ↔ right rail split |
| `sonner` | **`sonner`** (+ `next-themes`, already present) | "that block already has an arrow out of it" toasts |
| `scroll-area` | — | optional; see §8 for why the terminal uses a plain div instead |
| `kbd` | — | keyboard hints in the empty state |
| `empty` | — | canvas / terminal empty states |

Install once with:

```
pnpm dlx shadcn@latest add input label select tooltip dialog card separator badge tabs resizable sonner kbd empty
```

### Things that conflict with, or are missing from, the brief

1. **No test runner at all.** No vitest, no jest, no test script. The brief's headless-`lib/` requirement is unachievable until this exists — it is milestone M0.
2. **No ESLint boundary rule.** `eslint.config.mjs` is stock `next/core-web-vitals` + `next/typescript`. Rule 1 (`lib/` has zero React) and rule 4 (no `eval`) are currently unenforced. Also M0.
3. **`tsconfig.json` `include` is `**/*.ts`**, so co-located `lib/**/*.test.ts` files will be type-checked by `pnpm typecheck` and `next build`. That is desirable; just be aware `vitest` globals need a types entry.
4. `app/page.tsx` is the shadcn template placeholder and will be replaced wholesale.
5. `.gitignore` already ignores `/coverage`. Nothing needs changing there.
6. `app/layout.tsx` already exposes `--font-mono` (Geist Mono) and `--font-sans` (Geist). The terminal gets its monospace for free. See §12(f) for a Sinhala-related caveat.

---

## 2. Proposed file tree

```
app/
  layout.tsx                          (edit) add Toaster + Sinhala-safe font stack
  page.tsx                            (replace) server component; renders <EditorShell/>
  globals.css                         (edit) node/edge design tokens + @xyflow style import

lib/                                  ← ZERO React, zero DOM, zero @xyflow. Pure TS.
  lang/
    tokens.ts                         Token type, TokenKind union, keyword table
    lexer.ts                          tokenize(src) => Token[] | LexError; tracks byte spans
    ast.ts                            Expr union, Stmt types, every node carries span
    parser.ts                         recursive-descent; parseExpression / parseProcess / parseInput
    values.ts                         Value type, typeOf(), formatValue(), coercion rules
    evaluate.ts                       evaluate(expr, vars) => Ok<Value> | Err<RunError>
    keywords.ts                       reserved word set, shared by lexer + validator
  graph/
    types.ts                          FlowNode, FlowEdge, NodeKind, BlockData (persisted shape)
    compile.ts                        compile(graph) => CompileResult (Program | Diagnostic[])
    validate.ts                       graph-shape checks; reachability; unassigned-variable pass
    program.ts                        Program, CompiledNode types + narrow accessors
  run/
    state.ts                          RunState, TerminalLine, initialState()
    step.ts                           step(program, state) => RunState   ← the pure core
    input.ts                          provideInput(program, state, raw) => RunState
    budget.ts                         STEP_BUDGET, cycle-detection ring buffer
  errors/
    codes.ts                          ErrorCode union + per-code param types (discriminated)
    diagnostic.ts                     RunError, Diagnostic, Severity, helper constructors
    suggest.ts                        Damerau-Levenshtein nearest-variable suggestion
  i18n/
    locale.ts                         Locale type, default locale
    resolve.ts                        resolveMessage(err, locale) => { message, hint }
    catalog.ts                        typed bridge from ErrorCode to message keys
  persistence/
    document.ts                       FlowDocument v1, serialize/deserialize, strip RF internals
    migrate.ts                        version ladder; today only v1 -> v1 identity
    validate-import.ts                hand-written import validator (no zod)
  testing/
    build-flow.ts                     fluent test builder: b.start().process("x = 1")...
    programs.ts                       the named fixture programs from §11

messages/
  en.json                             { CODE: { message, hint } }
  si.json                             (later — file not created in the prototype)

components/
  ui/*                                shadcn output, do not hand-edit
  editor/
    editor-shell.tsx                  "use client"; layout, resizable panels, dynamic canvas
    toolbar.tsx                       Run / Step / Step back / Reset / speed / follow toggle
    palette.tsx                       draggable block source list
  flow/
    flow-canvas.tsx                   "use client"; <ReactFlow>, nodeTypes, connection rules
    node-types.ts                     the nodeTypes/edgeTypes maps (module-scope constants)
    shapes/
      geometry.ts                     per-kind size + padding + SVG path constants
      shape-svg.tsx                   <ShapeSvg kind state/> renders the outline layer
    nodes/
      start-node.tsx  stop-node.tsx  input-node.tsx
      output-node.tsx process-node.tsx if-node.tsx
      node-frame.tsx                  shared chrome: shape layer, highlight ring, error badge
      expression-field.tsx            nodrag single-line editor + inline underline of error span
    edges/
      flow-edge.tsx                   smoothstep + true/false label + travel animation
  panels/
    terminal-panel.tsx                output log + inline prompt
    terminal-line.tsx                 one line per TerminalLine kind
    terminal-prompt.tsx               the live input that resumes execution
    variables-panel.tsx               watch table
    problems-panel.tsx                diagnostics list, click to pan-to-node
  theme-provider.tsx                  (existing, untouched)

hooks/
  use-runner.ts                       the timer that drives step(); owns rAF batching
  use-autosave.ts                     debounced localStorage write
  use-follow-node.ts                  viewport follow for the active node

stores/
  graph-store.ts                      zustand: nodes, edges, selection, revision counter
  run-store.ts                        zustand: Program + RunState + history; never sees the graph

eslint.config.mjs                     (edit) lib/ boundary rules, no-eval, no-new-func
vitest.config.ts                      (new) node environment, @/ alias, no extra deps
package.json                          (edit) add "test", "test:watch"
```

---

## 3. Core type definitions

These are the contracts. They live in the files named in §2; they are reproduced here for review, not as source files.

### Graph (the document — what gets persisted)

```ts
// lib/graph/types.ts
export type NodeId = string
export type EdgeId = string

export type NodeKind =
  | "start" | "stop" | "input" | "output" | "process" | "if"

export type InputValueType = "number" | "text"

/** Discriminated on `kind`; `data` is exactly what the student typed. */
export type FlowNode =
  | BaseNode<"start",   Record<string, never>>
  | BaseNode<"stop",    Record<string, never>>
  | BaseNode<"input",   { varName: string; valueType: InputValueType }>
  | BaseNode<"output",  { source: string }>   // raw expression text
  | BaseNode<"process", { source: string }>   // raw "IDENT = expr" text
  | BaseNode<"if",      { source: string }>   // raw condition text

type BaseNode<K extends NodeKind, D> = {
  id: NodeId
  kind: K
  position: { x: number; y: number }
  data: D
}

export type BranchHandle = "true" | "false"

export type FlowEdge = {
  id: EdgeId
  source: NodeId
  target: NodeId
  /** Only `if` nodes have a non-null sourceHandle. */
  sourceHandle: BranchHandle | null
}

export type FlowGraph = { nodes: FlowNode[]; edges: FlowEdge[] }
```

Note: `FlowNode` deliberately does **not** extend `@xyflow/react`'s `Node`. React Flow's runtime node objects carry `measured`, `selected`, `dragging`, and an `internals` field that must never reach `lib/` or localStorage. The store adapts between the two at exactly one boundary (`stores/graph-store.ts`).

### AST

```ts
// lib/lang/ast.ts
export type Span = [start: number, end: number]   // offsets into the block's raw source

export type Expr =
  | { kind: "number";  value: number;  span: Span }
  | { kind: "string";  value: string;  span: Span }
  | { kind: "boolean"; value: boolean; span: Span }
  | { kind: "variable"; name: string;  span: Span }
  | { kind: "unary";  op: UnaryOp;  operand: Expr; span: Span }
  | { kind: "binary"; op: BinaryOp; left: Expr; right: Expr; opSpan: Span; span: Span }

export type UnaryOp  = "-" | "NOT"
export type BinaryOp =
  | "OR" | "AND"
  | "=" | "<>" | "<" | ">" | "<=" | ">="
  | "+" | "-" | "*" | "/" | "%"

/** Statement forms. Only `process` and `input` are statements; the rest are bare Exprs. */
export type Assignment = { target: string; targetSpan: Span; value: Expr; span: Span }
```

`opSpan` on binary nodes is what lets `TYPE_MISMATCH` underline the `*` in `"cat" * 3` rather than the whole line.

### Program (the compile output)

```ts
// lib/graph/program.ts
export type Program = {
  entryId: NodeId
  /** Reachable nodes ONLY. Unreachable ones are dropped and reported as warnings. */
  nodes: Readonly<Record<NodeId, CompiledNode>>
  order: readonly NodeId[]      // deterministic iteration for tests and debug dumps
  warnings: readonly Diagnostic[]
}

export type CompiledNode =
  | { kind: "start";   id: NodeId; next: NodeId; nextEdgeId: EdgeId }
  | { kind: "stop";    id: NodeId }
  | { kind: "input";   id: NodeId; varName: string; valueType: InputValueType
                       next: NodeId; nextEdgeId: EdgeId }
  | { kind: "output";  id: NodeId; expr: Expr; next: NodeId; nextEdgeId: EdgeId }
  | { kind: "process"; id: NodeId; target: string; expr: Expr
                       next: NodeId; nextEdgeId: EdgeId }
  | { kind: "if";      id: NodeId; cond: Expr
                       whenTrue: NodeId;  trueEdgeId: EdgeId
                       whenFalse: NodeId; falseEdgeId: EdgeId }
```

**`next` is non-nullable, and that is load-bearing.** Compilation only succeeds if every reachable non-`stop` node has all its outgoing edges connected. So `step()` has no "what if there's nowhere to go" branch — the validator already made that state unrepresentable. Unreachable nodes never enter `program.nodes`, so they can't violate the invariant.

```ts
export type CompileResult =
  | { ok: true;  program: Program }
  | { ok: false; diagnostics: Diagnostic[] }   // contains at least one severity: "error"
```

### Errors

```ts
// lib/errors/diagnostic.ts
export type Severity = "error" | "warning"

/** Structural shape from the brief, plus the two fields the canvas needs. */
export type RunError = {
  code: ErrorCode
  params: Record<string, unknown>
  span?: Span
  nodeId?: NodeId       // which block to highlight
}

export type Diagnostic = RunError & {
  severity: Severity
  edgeId?: EdgeId
  handle?: BranchHandle // lets an UNCONNECTED_BRANCH ring the exact handle
}
```

**Proposed strengthening of the brief's shape.** Keep `{ code, params, span? }` structurally, but make it a discriminated union so params are typed per code:

```ts
// lib/errors/codes.ts
type Err<C extends string, P> = { code: C; params: P; span?: Span; nodeId?: NodeId }

export type RunError =
  | Err<"UNKNOWN_VARIABLE",     { name: string; suggestion?: string }>
  | Err<"DIVIDE_BY_ZERO",       { op: "/" | "%" }>
  | Err<"TYPE_MISMATCH",        { op: BinaryOp; leftType: ValueType; rightType: ValueType }>
  | Err<"IF_NOT_BOOLEAN",       { actualType: ValueType }>
  | Err<"STEP_BUDGET_EXCEEDED", { budget: number; cycle: NodeId[] }>
  | Err<"PARSE_UNEXPECTED_TOKEN", { found: string; expected: string }>
  // ...one arm per code
```

Cost: nothing. Benefit: it is a **compile error** to raise `UNKNOWN_VARIABLE` without a `name`, or to write an `en.json` interpolation for a param that doesn't exist. Given that "error messages are the product," the messages should be type-checked like product code. This is the one place I'd deviate from the brief's literal `Record<string, unknown>`.

### Runtime state

As specified in the brief, with two additions:

```ts
// lib/run/state.ts
export type Value = number | string | boolean
export type ValueType = "number" | "text" | "yes/no"   // student-facing type names

export type RunState = {
  status: "idle" | "running" | "awaiting-input" | "finished" | "error"
  currentNodeId: NodeId | null
  lastEdgeId: EdgeId | null
  variables: Readonly<Record<string, Value>>
  terminal: readonly TerminalLine[]
  pendingInput: { nodeId: NodeId; varName: string; type: InputValueType } | null
  error: RunError | null
  stepCount: number

  // --- additions, see §12 ---
  /** Bounded ring buffer (last 32 visited ids) used to name the cycle on budget overrun. */
  recentNodeIds: readonly NodeId[]
  /** True once the terminal hit its line cap; used to render OUTPUT_TRUNCATED once. */
  terminalTruncated: boolean
}

export type TerminalLine =
  | { kind: "output"; text: string }
  | { kind: "prompt"; varName: string; valueType: InputValueType }
  | { kind: "echo";   text: string }
  | { kind: "error";  error: RunError }
  | { kind: "system"; code: SystemCode }

export type SystemCode =
  | "PROGRAM_FINISHED" | "PROGRAM_RESET" | "EDIT_DURING_RUN" | "OUTPUT_TRUNCATED"
```

`prompt` carries `valueType` so the terminal can set `inputMode="decimal"` without reaching back into the program.

---

## 4. Interpreter design

### The compile step

`compile(graph: FlowGraph): CompileResult` runs, in order:

1. **Parse every block.** Each node's raw text goes through the right parser entry point (`parseProcess`, `parseExpression`, `parseIdentifier`). Parse failures become `Diagnostic`s with `nodeId` and a `span` into that block's text. Parsing happens **here and only here** — `step()` never sees a string.
2. **Graph shape.** Exactly one `start`; every node's required handles connected; at most one edge per source handle (also enforced at connect time, but re-checked because imported JSON can lie).
3. **Reachability.** BFS from `start` over resolved next-pointers. Nodes not reached → `UNREACHABLE_NODE` **warning**, and they are dropped from `program.nodes`.
4. **Stop reachability.** Any `stop` reachable? If not → `NO_REACHABLE_STOP` **warning** (see §12(a) for why this is not an error).
5. **Definite-assignment pass.** Walk the reachable subgraph; for each node, the set of variables that are assigned on *every* path reaching it. A read of a variable outside that set → `VARIABLE_MAYBE_UNASSIGNED` warning with the offending `span`. Loops are handled by iterating to a fixed point over the intersection lattice (converges in ≤ |nodes| passes; the graphs are tiny).
6. **Emit.** If no `severity: "error"` diagnostic, build `Program` with resolved next-pointers.

Compile is pure and synchronous. It is called on every graph change (debounced ~200ms) for annotations, and again with no debounce when Run is pressed.

### `step()` dispatch

```ts
// lib/run/step.ts
export function step(program: Program, state: RunState): RunState
```

Contract: pure, total, synchronous, returns a **new** object every time the state logically changes and the *same* object when it doesn't.

| `state.status` | behaviour |
|---|---|
| `"idle"` | → `{ status: "running", currentNodeId: program.entryId, stepCount: 0 }` |
| `"awaiting-input"` | returns `state` unchanged. Only `provideInput()` can move it. |
| `"finished"` / `"error"` | returns `state` unchanged. Terminal states are absorbing. |
| `"running"` | dispatch on `program.nodes[state.currentNodeId].kind` ↓ |

Per node kind, when running:

- **`start`** — advance to `next`, set `lastEdgeId = nextEdgeId`.
- **`process`** — `evaluate(node.expr, state.variables)`. On `Err` → `status: "error"`, `error` gets `nodeId` stamped, push an `error` terminal line. On `Ok(v)` → `variables: { ...state.variables, [node.target]: v }`, advance.
- **`output`** — evaluate; on Ok push `{ kind: "output", text: formatValue(v) }`, advance.
- **`if`** — evaluate; if the result is not a boolean → `IF_NOT_BOOLEAN` with `actualType`. Otherwise pick `whenTrue`/`whenFalse` and set `lastEdgeId` to the matching edge id. **This is what makes the true/false edge light up.**
- **`input`** — do **not** advance. Set `status: "awaiting-input"`, `pendingInput: { nodeId, varName, type }`, push `{ kind: "prompt", ... }`. `currentNodeId` stays on the input block so it keeps its highlight while the student types.
- **`stop`** — `status: "finished"`, `currentNodeId: null`, push `{ kind: "system", code: "PROGRAM_FINISHED" }`.

Every running step increments `stepCount` and pushes onto `recentNodeIds` (capped at 32). If `stepCount > STEP_BUDGET` (10_000) → `status: "error"` with `STEP_BUDGET_EXCEEDED`, and `params.cycle` is the repeating node sequence extracted from `recentNodeIds` (find the shortest suffix that repeats). See §12(g).

### How `awaiting-input` resumes

```ts
// lib/run/input.ts
export function provideInput(program: Program, state: RunState, raw: string): RunState
```

1. Guard: if `status !== "awaiting-input"` return `state` unchanged.
2. If `pendingInput.type === "number"`: strict parse — trim, then match `/^-?\d+(\.\d+)?$/`. `"12abc"`, `""`, `"1e5"`, `"1,5"` all fail.
   On failure: push `{ kind: "error", error: { code: "INPUT_NOT_A_NUMBER", params: { text: raw } } }` and **stay in `awaiting-input`**. A typo re-prompts; it does not kill the program. (Design call — see §13.)
3. On success: push `{ kind: "echo", text: raw }`, set `variables[varName]`, clear `pendingInput`, advance to `next`, `status: "running"`.

The React layer never touches `RunState` fields directly; it calls `step` / `provideInput` / `initialState` and stores the result.

### Why step-backwards is free

Because `step` is pure, `run-store` keeps `history: RunState[]`. `stepBack()` is `history.pop()`. Structural sharing means each entry shares the `terminal` and `variables` objects with its neighbours, so 1000 retained states cost roughly 1000 small objects, not 1000 copies of the log. See §12(d) for the recommendation to build the array now and the button later.

---

## 5. Parser approach

**Recommendation: hand-written recursive descent, zero dependencies.**

### Why not a Pratt parser

Pratt (precedence-climbing) earns its keep when there are many precedence levels, user-definable operators, or a grammar that grows. Here the grammar is frozen at six levels and is already *written* as recursive descent in the brief. A recursive-descent parser will be one function per grammar line — `parseOr`, `parseAnd`, `parseNot`, `parseComparison`, `parseSum`, `parseTerm`, `parseUnary`, `parsePrimary` — roughly 180 lines that a maintainer can diff against §4 of the brief by eye. For a teaching tool whose grammar is itself part of the curriculum, that legibility is worth more than the ~40 lines Pratt would save.

### Why not a dependency

`peggy`, `chevrotain`, and `nearley` all produce *generic* errors ("expected one of …") at the exact moment the brief says errors are the product. Bending a generated parser into the `{ code, params, span }` shape is more work than writing the parser, and it adds 15–50kB to a bundle that is already paying 58kB for the canvas. Rejected.

### Error spans

The lexer emits absolute offsets into the block's raw text:

```ts
// lib/lang/tokens.ts
export type Token = { kind: TokenKind; text: string; start: number; end: number }
```

- Every `Expr` gets `span = [firstToken.start, lastToken.end]`.
- Binary nodes additionally carry `opSpan` = the operator token's own span.
- A parse error's `span` is the *offending* token's span; at end-of-input it is `[src.length, src.length]` so the underline renders as a caret at the end of the line.

The UI consumes this in `expression-field.tsx`: the field renders the student's text plus an absolutely-positioned underline layer, with the wavy underline sized by measuring `src.slice(0, span[0])` and `src.slice(span[0], span[1])` in a hidden mirror span. Same offsets work identically for compile-time and runtime errors, which is why `TYPE_MISMATCH` can underline just the `*`.

### Entry points

```ts
parseExpression(src: string): Ok<Expr> | Err<RunError>          // if / output blocks
parseProcess(src: string):    Ok<Assignment> | Err<RunError>    // process blocks
parseIdentifier(src: string): Ok<string> | Err<RunError>        // input blocks
```

All three share one lexer. All three assert EOF after parsing and raise `PARSE_TRAILING_INPUT` otherwise, so `x = 1 2` and `a > b c` give a pointed error instead of silently ignoring the tail.

### Two grammar consequences worth naming now

1. **`NOT` binds looser than comparison.** Per the brief's grammar, `not := "NOT" not | comparison`, so `NOT a = b` parses as `NOT (a = b)`. That is almost certainly what a 14-year-old means, and it matches the brief. Locking it in with a test.
2. **A process RHS can legally be a comparison.** `flag = count > 10` is valid and useful. But so is `x = y = 3`, which parses as `x := (y = 3)` and assigns a boolean — almost never intended. Proposal: allow it, but emit a `SUSPICIOUS_CHAINED_EQUALS` **warning** when a process RHS's top-level operator is `=`. Costs one `if` in the validator.

---

## 6. Canvas plan

### Library and version

`@xyflow/react@^12.11.3` (latest at time of writing; peer range `react >= 17`, so React 19.2.4 is fine). It brings `zustand`, `classcat`, and `@xyflow/system` transitively — see §9.

Requires `@import "@xyflow/react/dist/style.css";` in `app/globals.css`, placed **after** the Tailwind import so our utilities win.

### Mounting under Next 16

`app/page.tsx` stays a Server Component. `components/editor/editor-shell.tsx` is `"use client"` and does:

```tsx
const FlowCanvas = dynamic(() => import("@/components/flow/flow-canvas"), {
  ssr: false,
  loading: () => <CanvasSkeleton />,
})
```

This is verified against the bundled docs: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` states `ssr: false` **errors inside a Server Component** and must live in a Client Component. Rendering the canvas client-only also sidesteps React Flow's node-measurement-on-hydration problem entirely.

### Drawing the six shapes: inline SVG, not `clip-path`

Three options were considered:

| Approach | Verdict |
|---|---|
| CSS `clip-path` on a div | **No.** Clipping removes the border, so there is no stroke to turn red for a validation error and no way to draw a dashed outline. It also clips absolutely-positioned handles. |
| `transform: rotate(45deg)` for the diamond | **No.** Text must be counter-rotated, and it fights inline editing and hit-testing. |
| **Inline SVG outline layer behind HTML content** | **Yes.** |

Each node renders a three-layer frame (`components/flow/nodes/node-frame.tsx`):

```tsx
<div className="relative" style={{ width, height }}>
  <svg className="pointer-events-none absolute inset-0" viewBox={`0 0 ${width} ${height}`}
       preserveAspectRatio="none">
    <ShapePath kind={kind} w={width} h={height} />   {/* fill + stroke from CSS vars */}
  </svg>
  <div className="relative z-10 flex h-full items-center px-…">{children}</div>
  <Handle … />                                        {/* z-20, never clipped */}
</div>
```

Shape geometry, all in `components/flow/shapes/geometry.ts`:

| Kind | Element | Notes |
|---|---|---|
| `start` / `stop` | `<rect rx={h/2}>` | Stadium, not ellipse. The brief allows either; a stadium keeps far more usable text width at the same footprint and renders crisper. |
| `input` / `output` | `<polygon>` | Parallelogram with a fixed 14px horizontal skew. |
| `process` | `<rect rx={6}>` | |
| `if` | `<polygon>` | Diamond. Needs the largest footprint (~200×110) because a diamond wastes ~50% of its bounding box. |

Stroke/fill come from CSS custom properties set on the wrapper (`--node-stroke`, `--node-fill`), so state changes are pure CSS class toggles: `data-state="active"` (thick accent stroke + a pulse ring), `data-severity="error"` (red, dashed), `data-severity="warning"` (amber). No re-render needed for hover/active styling.

`geometry.ts` deliberately lives under `components/`, **not** `lib/`. It has no React, so it would pass the boundary lint — but keeping `lib/` strictly "the language and its interpreter" is the whole point of the rule, and layout constants are not part of the language.

### Handle configuration

Availability of a handle *is* the connection rule wherever possible — a structurally impossible connection beats a rejected one.

| Kind | Handles |
|---|---|
| `start` | one `source`, `Position.Bottom`. **No target handle exists**, so it cannot receive an edge. |
| `stop` | one `target`, `Position.Top`. **No source handle exists.** |
| `input` / `output` / `process` | `target` Top, `source` Bottom |
| `if` | `target` Top; `source id="true"` at Bottom; `source id="false"` at Right |

`true` goes out the bottom because the main path of a flowchart reads downward; `false` goes out the right, which is where loop-back edges naturally want to leave. Both handles get a persistent visible **"true" / "false" label** rendered next to them and a colour (green / amber) that the edge inherits — a 14-year-old must never have to remember which side is which.

### Connection validation

On `<ReactFlow isValidConnection={…} connectionMode={ConnectionMode.Strict}>`:

1. **Reject self-loops** (`source === target`). Never correct: it is either an instant infinite loop or a mistake.
2. **Reject a second edge from an occupied source handle.** Every source handle has at most one outgoing edge. This is what makes execution deterministic, and it means `compile()` never has to resolve ambiguity. When rejected, a `sonner` toast says *"That block already has an arrow coming out of it. Delete the old arrow first."*
3. **Allow multiple edges into one target.** Required — if-branches rejoining is the single most common shape in the whole curriculum.

Dropping a new edge onto an occupied handle could alternatively *replace* the existing edge. Rejected: silent replacement destroys work a student can't see they lost.

### Palette → canvas

HTML5 drag-and-drop (`dataTransfer`) plus `useReactFlow().screenToFlowPosition(e.clientX, e.clientY)`. ~20 lines; `@dnd-kit` is not justified. Also support **click-to-add** (places the block below the current selection), because HTML5 DnD is miserable on touch-enabled school laptops and this is the cheap half of touch support.

### Edges

Custom `flow-edge.tsx` using `getSmoothStepPath` — orthogonal routing is what a textbook flowchart looks like; bezier reads as a mind-map. `BaseEdge` + `EdgeLabelRenderer` for the true/false pill.

Travel animation: when `runStore.lastEdgeId === id`, render a second `<path>` over the base with `pathLength={1}` and a `stroke-dasharray: 0.25 1` marching-ants animation. `pathLength` normalisation makes the animation take the same time on a short edge and a long loop-back, which matters because loop-back edges are the long ones.

### Viewport follow

`hooks/use-follow-node.ts`: on `currentNodeId` change, if the follow toggle is on **and** the node's rect is outside the current viewport (with a 15% margin), call `setCenter(x, y, { zoom: currentZoom, duration: 300 })`. The "only when off-screen" test matters — re-centring on every step makes the canvas swim and is genuinely unpleasant to watch.

### Performance note that shapes the components

Node components subscribe **narrowly**:

```ts
const isActive = useRunStore((s) => s.currentNodeId === id)
```

so a step re-renders exactly the two nodes whose active-ness changed, not the whole canvas. `nodeTypes` and `edgeTypes` must be module-scope constants in `node-types.ts` — defining them inline remounts every node on every render, and it is React Flow's most common performance bug.

---

## 7. State management

**Choice: `zustand@^5`, two separate stores.**

Why zustand: it is *already in the dependency tree* as a transitive dep of `@xyflow/react`, so the marginal bundle cost is ~0.5kB gzip. React Context + `useReducer` is dependency-free but forces either a whole-canvas re-render per execution step or a hand-rolled subscription layer — which is zustand. Redux Toolkit is ~13kB for ceremony we don't need. Jotai is fine but isn't already here.

### Why two stores, not two slices

The brief's rule 5 — the graph is never mutated during execution — should be **structural, not a convention**. Two stores means `run-store.ts` has no import path to a graph setter. It cannot mutate the graph because it does not know how.

```ts
// stores/graph-store.ts — owns the document
type GraphStore = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedId: NodeId | null
  revision: number              // bumped on every structural/text change
  addNode / removeNode / moveNode / updateNodeData / connect / removeEdge / loadDocument
}

// stores/run-store.ts — owns execution
type RunStore = {
  program: Program | null
  state: RunState
  history: RunState[]           // capped at 1000
  load(program: Program): void  // ← the ONLY way a program enters
  tick(): void                  // state = step(program, state)
  submit(raw: string): void
  reset(): void
}
```

`RunStore.load` takes a **finished `Program`**, not a graph. Compilation is triggered in `hooks/use-runner.ts`:

```ts
const graph = useGraphStore.getState()          // read-only snapshot, at one moment
const result = compile(toFlowGraph(graph))
if (result.ok) useRunStore.getState().load(result.program)
```

So the run store never even imports `graph-store`. The coupling is one-directional, at one call site, and reviewable in a single line.

Diagnostics live in a third, trivially small store (or a `useMemo` in the shell) derived from `revision`; they are needed by both the canvas and the problems panel but owned by neither.

### The reverse direction: editing during a run

The brief doesn't say what happens if a student drags a block mid-execution. Proposal: `use-runner` watches `graph.revision`; a change while `status` is `running`/`awaiting-input` stops the run, resets to `idle`, and pushes `{ kind: "system", code: "EDIT_DURING_RUN" }`. Silently continuing to execute a stale `Program` while the canvas shows a different flowchart would be actively confusing.

### Free discipline for future undo

All graph mutations replace whole arrays rather than mutating in place. Costs nothing today; makes a future undo stack a ~20-line addition. (Not building undo — see §12(e).)

---

## 8. Terminal design

### Structure

```
<TerminalPanel>                      overflow-y-auto, font-mono, text-sm
  <TerminalLine> × n                 one component, switch on line.kind
  <TerminalPrompt>                   rendered only when status === "awaiting-input"
```

`TerminalLine` renders by kind:

| kind | render |
|---|---|
| `output` | plain text, foreground colour |
| `prompt` | `varName ▸` in muted colour (the historical record of the ask) |
| `echo` | the typed value, dimmed + left-marked, so it reads as a real console transcript |
| `error` | `resolveMessage(error, locale)` — icon, destructive colour, and the **hint** on a second line |
| `system` | italic muted, e.g. "Program finished." |

Nothing in this component builds an English sentence. Error and system lines go through `resolveMessage`, which is the entire reason terminal lines store codes.

### Autoscroll

A plain `overflow-y-auto` div, not `ScrollArea`. shadcn's `scroll-area` wraps its content in a viewport element whose ref you have to reach through to scroll programmatically; for a log that scrolls itself, the plain div is less fragile.

```ts
useEffect(() => {
  const el = ref.current
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  if (atBottom) el.scrollTop = el.scrollHeight
}, [lines.length])
```

The `atBottom` guard matters: a student who scrolls up to re-read an error must not be yanked back down by the next output line.

### Line cap

Terminal is capped at **2000 lines**. Past that, `step()` drops the oldest line and sets `terminalTruncated`, which renders one `OUTPUT_TRUNCATED` system line at the top. This protects the DOM (and the pure-append copying cost) from a runaway loop printing 10,000 lines before the step budget trips.

### The inline prompt

When `status === "awaiting-input"`, an `<input>` renders **in the flow of the log**, not in a modal:

- autofocused; `inputMode="decimal"` when `pendingInput.type === "number"`
- `Enter` → `runStore.submit(value)` → `provideInput()` → execution resumes on the next tick
- `Escape` → stop the run
- clicking anywhere in the terminal refocuses it
- on submit the live input is replaced by an `echo` line, so history reads like a real console

**A `Dialog` is explicitly the wrong choice here.** A modal covers the canvas at the exact moment the student should be seeing which block is highlighted and waiting, and it breaks the "this is a console program" illusion the whole tool is built on.

### Right rail layout

`resizable` split: canvas on the left, right rail on the right. The rail is a `tabs` group — **Terminal / Variables / Problems** — with the Terminal tab active by default and a badge on Problems showing the error count. The variables watch panel is a two-column table (name, value) with a `badge` for the type and a subtle flash on the row whose value changed on the last step; that flash is the cheapest thing in this whole plan and probably the highest teaching value per line of code.

---

## 9. Dependency list

### Runtime additions (4)

| Package | gzip | Justification |
|---|---|---|
| `@xyflow/react@^12.11.3` | **58.4 kB** | The canvas. Pan/zoom, handles, edge routing, connection interaction, viewport control. Hand-rolling this is the single largest chunk of work in the project and would be worse. Pulls `@xyflow/system` (33.6kB, counted inside that figure), `classcat` (0.3kB), `zustand`. |
| `zustand@^5` | **0.5 kB** | Store for graph + runtime. Already present transitively via `@xyflow/react`, so effectively free. Declared explicitly so we don't depend on a transitive. |
| `react-resizable-panels@^4` | **10.9 kB** | Required by shadcn `resizable`. Justified by the target hardware: 1366×768 school laptops need to trade canvas for terminal. This is the one entry I'd cut first if the budget mattered. |
| `sonner@^2` | **9.2 kB** | Required by shadcn `sonner`. Carries the "why was that connection rejected" feedback and import/export results. Borderline; could be replaced by an inline canvas hint if we want the 9kB back. |

### Dev additions (1)

| Package | Justification |
|---|---|
| `vitest@^4` | Headless test runner for `lib/`. Bundles its own `vite`, so no separate `vite`/`ts-node`/`@swc` entries. Zero runtime bundle cost. Needs a 6-line `vitest.config.ts` (`environment: "node"`, `resolve.alias` for `@/`). |

`vite-tsconfig-paths` is **not** needed — three lines of `resolve.alias` in `vitest.config.ts` do the same job with no dependency.

### Explicitly rejected

| Rejected | Reason |
|---|---|
| `zod` | **60.3 kB gzip.** We have exactly one schema (the import file). ~40 lines of hand validation gives better student-facing errors, in our own `Diagnostic` shape, for free. |
| `nanoid` | `crypto.randomUUID()` exists in every target browser and in Node 20+. Node ids are generated only in the graph store; `lib/` never mints an id, which also keeps it deterministic under test. |
| `immer` | All state updates here are shallow spreads. Rule 3's purity is easier to *verify by reading* without a proxy layer in between. |
| `peggy` / `chevrotain` / `nearley` | Worse errors, extra bundle, and the grammar is six rules. See §5. |
| `intl-messageformat` | Not needed until Sinhala plurals. `resolveMessage`'s signature keeps the door open to swapping it in without touching `lib/`. |
| `dagre` / `elkjs` | Auto-layout defeats the exercise. Placing the blocks *is* part of learning the notation. |
| `@dnd-kit` | Palette drag is HTML5 DnD + `screenToFlowPosition`, ~20 lines. |
| `fastest-levenshtein` | The nearest-match suggestion runs over ≤ 20 variable names. 30 lines of Damerau-Levenshtein in `lib/errors/suggest.ts`. |

Total added runtime weight: **~79 kB gzip**, of which 58 kB is the canvas and is unavoidable.

---

## 10. Build sequence

Ordered by dependency. Every milestone ends in something you can actually check.

**M0 — Tooling and boundaries.**
Add `vitest` + `vitest.config.ts`; add `test` / `test:watch` scripts; extend `eslint.config.mjs` with the `lib/` boundary rules and `no-eval` / `no-new-func` (see below).
*Verify:* `pnpm test` runs green with zero tests; temporarily add `import React from "react"` to a scratch file in `lib/` and confirm `pnpm lint` **fails**, then delete it.

**M1 — Lexer.** Tokens, keywords, spans, string literals, numbers.
*Verify:* token-table tests, including `LEX_UNKNOWN_CHARACTER` and `LEX_UNTERMINATED_STRING` spans.

**M2 — Parser + AST.** All three entry points.
*Verify:* precedence tests (`2 + 3 * 4 === 14`; `NOT a = b` → `NOT (a = b)`), and span tests asserting the caret lands on the right character.

**M3 — Evaluator.** `evaluate`, `typeOf`, `formatValue`, coercion rules.
*Verify:* arithmetic, string concatenation, short-circuit `AND`/`OR`, every `TYPE_MISMATCH` path, `DIVIDE_BY_ZERO`.

**M4 — Graph types, `compile()`, validator.**
*Verify:* one test per graph diagnostic code; assert unreachable nodes are dropped from `program.nodes`.

**M5 — Interpreter.** `initialState`, `step`, `provideInput`, budget, cycle detection.
*Verify:* the full fixture-program suite in §11, including the purity and determinism tests.
**← The entire language is finished and tested here, with no UI, no DOM, and no React.** This is the milestone that proves the architecture.

**M6 — i18n.** Error catalogue, `en.json`, `resolveMessage`, parity test.
*Verify:* the parity test fails if you add an `ErrorCode` without a message.

**M7 — Shell.** Layout, resizable split, tabs, toolbar (buttons wired to nothing yet). Install the shadcn components.
*Verify:* `pnpm dev`, panels resize, dark mode still works.

**M8 — Canvas.** React Flow mount, six node components, SVG shapes, handles, connection rules, palette.
*Verify:* by hand, build the sum-1-to-10 flowchart on screen; confirm `start` refuses inbound edges and a second edge off one handle is rejected with a toast.

**M9 — Diagnostics on canvas.** Debounced compile → node/handle annotations + problems panel with pan-to-node.
*Verify:* delete the false branch of an `if` and watch that specific handle ring red.

**M10 — Runner + terminal + variables.** `use-runner`, terminal panel, inline prompt, watch table.
*Verify:* run sum-1-to-10 to `55`; run countdown and type a value at the prompt.

**M11 — Motion.** Active-node highlight, edge travel animation, viewport follow, speed control, step-back button.
*Verify:* watch a loop execute at 400ms/step and confirm the loop-back edge animates.

**M12 — Persistence.** Debounced autosave, JSON export, import with validation.
*Verify:* reload the page and the flowchart is still there; export, clear, re-import.

**M13 — Copy pass.** Review every `en.json` message and hint against a real grade-8 reader. This is not polish; per the brief it is the product.

---

## 11. Test plan for the headless phase

Runner: `vitest`, `environment: "node"`. Tests co-located as `lib/**/*.test.ts`.

Fixtures are built with a fluent builder (`lib/testing/build-flow.ts`) so a test reads as a program rather than as node/edge JSON:

```ts
const g = flow()
  .start()
  .process("sum = 0")
  .process("i = 1")
  .label("top")
  .if("i <= 10")
    .whenTrue(b => b.process("sum = sum + i").process("i = i + 1").goto("top"))
    .whenFalse(b => b.output("sum").stop())
  .build()
```

A tiny `runToCompletion(program, inputs: string[]): RunState` helper drives `step`/`provideInput` and asserts the budget.

### Named programs

| # | Program | Asserts |
|---|---|---|
| 1 | **hello** — start → output `"Hello"` → stop | smoke: `status === "finished"`, terminal is one `output` line |
| 2 | **sum-1-to-10** — accumulator + counter + if loop-back | terminal `["55"]`, `variables.sum === 55`, `variables.i === 11`, `stepCount` is exactly the expected number |
| 3 | **countdown** — input `n`, loop printing `n…1` | resume-from-`awaiting-input` works *inside a loop*; with input `"3"` → `["3","2","1"]` |
| 4 | **fizzbuzz-1-to-15** | `%`, chained ifs, `AND`/`OR`, string output. Exactly 15 output lines, exact contents |
| 5 | **divide-by-zero** — input `n`, `x = 10 / n`, input `"0"` | `status === "error"`, `code === "DIVIDE_BY_ZERO"`, `error.nodeId` is the process block, `error.span` covers the `/` |
| 6 | **infinite-loop** — process → `if true` → back to the process | `STEP_BUDGET_EXCEEDED` at exactly `budget + 1`, and `params.cycle` names the two-node cycle |
| 7 | **unassigned-variable** — output `x` with no prior assignment | compile emits `VARIABLE_MAYBE_UNASSIGNED` warning; runtime raises `UNKNOWN_VARIABLE` |
| 8 | **near-miss-name** — assign `total`, read `totl` | `UNKNOWN_VARIABLE` with `params.suggestion === "total"` |
| 9 | **type-mismatch** — `x = "cat" - 1` | `TYPE_MISMATCH`, `params.op === "-"`, span is the operator only |
| 10 | **if-not-boolean** — `if 5` | `IF_NOT_BOOLEAN`, `params.actualType === "number"` |
| 11 | **missing-false-branch** | compile fails with `UNCONNECTED_BRANCH`, `params.branch === "false"`, `handle === "false"` |
| 12 | **no-start / two-starts** | `NO_START` / `MULTIPLE_START` with `params.count === 2` |
| 13 | **unreachable-orphan** | compile **succeeds**, `UNREACHABLE_NODE` warning, orphan absent from `program.nodes` |
| 14 | **input-retry** — number input, student types `"abc"` then `"5"` | after `"abc"`: still `awaiting-input`, one `error` line, `stepCount` unchanged; after `"5"`: proceeds |
| 15 | **grade-checker** — nested if chain + string concatenation | realistic classroom program; exact output for inputs 95 / 72 / 41 |
| 16 | **string-compare** — `name = "Amal"`, `if name = "Amal"` | equality across strings; and `if age = "12"` with a numeric `age` raises `TYPE_MISMATCH`, not silent `false` |

### Property / invariant tests — these are the ones enforcing the architecture

| Test | What it protects |
|---|---|
| **Determinism** — run sum-1-to-10 twice from `initialState`, `expect(a).toEqual(b)` | `step()` has no hidden state |
| **No mutation** — `deepFreeze(state)`, then `step(program, state)` | **directly enforces rule 3.** Any accidental `state.terminal.push()` throws in strict mode |
| **Absorbing terminal states** — `step()` on `finished`/`error` returns the *same object reference* | no zombie execution |
| **`awaiting-input` is a hard stop** — `step()` 100× on an awaiting state changes nothing | the runner can't skip the prompt |
| **History reconstruction** — replaying every retained `RunState` through `step` reproduces the next one | step-backwards is genuinely free |
| **i18n parity** — every `ErrorCode` has an `en.json` entry, every `en.json` key is a live code, every `{param}` in every message exists in that code's param type | you cannot ship an error with no message |
| **`lib/` is headless** — a test that imports every module in `lib/` under `environment: "node"` | catches an accidental `document.` reference that lint missed |

### The ESLint boundary rule (zero dependencies)

Added to `eslint.config.mjs` as an extra flat-config block. `eslint-plugin-boundaries` is not needed for a single one-way rule:

```js
{
  files: ["lib/**/*.ts"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["react", "react-dom", "react/*", "next", "next/*",
                "@xyflow/*", "@base-ui/*", "zustand", "zustand/*",
                "@/components/*", "@/hooks/*", "@/stores/*"],
        message: "lib/ must stay pure TypeScript — no React, no DOM, no canvas.",
      }],
    }],
    "no-restricted-globals": ["error",
      "window", "document", "localStorage", "sessionStorage", "navigator", "alert"],
  },
},
{
  files: ["**/*.{ts,tsx}"],
  rules: { "no-eval": "error", "no-new-func": "error", "no-implied-eval": "error" },
}
```

The second block enforces the brief's rule 4 across the whole codebase, not just `lib/`.

---

## 12. Risks, open questions, and where I disagree with the brief

The brief asked for disagreement. Here it is, most important first.

### (a) "At least one reachable `stop`" should be a **warning**, not an error

As written, a flowchart with no `stop` fails to compile, so Run does nothing. But *every* flowchart is in that state while it's being built — the student adds `start`, adds a process, presses Run to see what happens, and gets scolded for not having finished. That's the worst possible moment to be pedantic.

**Recommendation:** `NO_REACHABLE_STOP` is a warning. Programs without a `stop` run until the step budget stops them, which is itself a decent lesson. What stays a hard **error** is `DANGLING_OUTPUT` — a reachable non-`stop` node with nothing connected to its output — because that's what preserves the non-nullable `next` invariant in §3 that keeps `step()` total.

The same argument applies to the brief's "no unconnected inputs or outputs" generally: these should render as **quiet amber annotations while editing** and only escalate to red blocking errors when Run is pressed. One `severity` field, two presentations.

### (b) Step-backwards is cheaper now than later — I'd build the array in M5

The brief puts step-backwards out of scope while simultaneously observing it's free. It is free — but only if the `history: RunState[]` array exists from the start. The reason to actually do it:

1. It's ~15 lines total (a capped array in the run store, a `pop`, a button).
2. It is the single most valuable debugging affordance for a student who blinked and missed *why* a branch went false.
3. Keeping and replaying the array is what makes rule 3 self-enforcing. If `step()` ever quietly becomes impure, the history-reconstruction test in §11 fails immediately; without the array, that regression is invisible until something weird happens in the UI.

**Recommendation:** build `history` in M5 (free, in `lib`), add the button in M11 (5 lines). Cap at 1000 entries; structural sharing means that's cheap.

### (c) Report *which* cycle blew the step budget

The brief's message — "your flowchart is still running — is there a loop that never ends?" — is a good sentence but a dead end. The student's next question is "where?", and they have no way to answer it.

Since there is no loop block, an if-branch pointing at the wrong node is going to be *the* dominant student error in this tool. **Recommendation:** keep a 32-entry ring buffer of visited node ids in `RunState`, and on budget overrun extract the repeating suffix and pass it as `params.cycle`. The canvas then highlights exactly those blocks and that edge. Cost: one bounded array and ~20 lines of suffix detection. Given "error messages are the product," this is the highest-leverage message in the whole catalogue.

### (d) `RunError.params: Record<string, unknown>` is weaker than it needs to be

See §3. Same structural shape, discriminated on `code`, so params are type-checked per code and `en.json` can't drift. Costs nothing.

### (e) Editor undo/redo: agree, leave it out

But the "whole-array replacement" discipline in §7 costs nothing today and makes it a ~20-line addition later. No code now.

### (f) One Sinhala thing that really is cheaper now: the font stack

Geist Mono has no Sinhala glyphs. When `si.json` lands, every error message and every terminal line will silently fall back to a system font at a different metric — inside fixed-size SVG-outlined nodes, that means clipped and overflowing text, and the fix at that point is a shape-sizing redesign.

**Recommendation:** define the fallback chain now (`--font-mono: var(--font-geist-mono), "Noto Sans Sinhala", monospace` and similar for sans) and make node heights `min-height` rather than fixed. Do **not** load the Sinhala font yet. One CSS line and one layout habit; saves a redesign.

### (g) Don't design for mobile, but don't *break* on touch

Agreeing that mobile layout is out of scope. But school hardware is frequently touch-enabled, React Flow already handles pointer events for pan/zoom, and the only thing that would actually break is hover-only affordances. **Recommendation:** the node delete control and any tooltip-only information stay reachable via selection/click, not hover alone. Zero extra work; just don't paint ourselves into a hover corner.

### (h) `start` should be pre-placed and undeletable

Not mentioned in the brief. Without it, every student's first action produces `NO_START`. **Recommendation:** new documents ship with a `start` node already on the canvas, and the palette hides `start` once one exists — which also makes `MULTIPLE_START` nearly unreachable through the UI (it stays in the catalogue for imported JSON).

### (i) `process` blocks: the missing-`=` message is the one to get right

Students will type `x + 1` and `count + 1` constantly, forgetting to store the result. `PROCESS_MISSING_EQUALS` needs a hint that shows the fix by example, not a grammar description: *"A process block has to save its answer into a variable. Try `x = x + 1`."*

### Open questions I could not resolve from the brief

1. **String concatenation.** Is `+` overloaded for text, or is there a separate `&`? Many O-Level/IGCSE pseudocode conventions use `&`, and the brief's grammar has no `&`. I've assumed `+` (see §13, assumption 3) because `output "Total: " + total` is needed constantly, but **you know the curriculum and I don't** — this is the one answer that changes the lexer, evaluator, and error catalogue together. It's still a small, isolated change.
2. **Identifier case sensitivity.** I've assumed case-sensitive with a case-insensitive nearest-match suggestion, so `Total` vs `total` becomes a teachable moment rather than a wall. Case-insensitive identifiers are the alternative if the curriculum's pseudocode is.
3. **Should `<` `>` work on text?** Assumed yes for same-type strings (lexicographic). If Sinhala text ever gets compared this way the ordering will be locale-nonsense, but it won't crash.
4. **Integer vs real division.** Assumed `/` is real division (`5 / 2 = 2.5`) with `%` for remainder. If the curriculum teaches integer division as the default, that's a one-line change and a different `formatValue`.
5. **Step budget as a *time* budget too?** 10,000 steps at 400ms/step is over an hour of wall clock. The budget is really a "runaway" detector for the fast/instant speed; at slow speeds the student will just press Reset. Assuming step-count only is fine, but worth knowing there's a second failure mode (a slow loop that never ends and never trips the budget).

### Risks

| Risk | Mitigation |
|---|---|
| **Base UI shadcn is unfamiliar territory.** Component APIs differ from every Radix-era shadcn example, including my own priors. | Read `pnpm dlx shadcn docs <name>` or the generated file before using each component. Never write shadcn from memory here. `AGENTS.md` already flags the same hazard for Next itself. |
| **Base UI `select` inside a React Flow node.** Portalled popovers inside a transformed/zoomed canvas can position incorrectly, and React Flow will drag the node unless the trigger has `nodrag`. | Test early, in M8. Fallback is shadcn `native-select` (zero extra deps, no portal, and arguably better on school hardware anyway). |
| **Pure-append `terminal` copying** is O(n²) across a long run. | Line cap of 2000 (§8) bounds it. If it ever measures badly, switch to a chunked append — contained inside `lib/run/`. |
| **Inline editing inside canvas nodes** is the fiddliest UI in the project: `nodrag`/`nowheel`, focus-vs-selection, Delete-key stealing keystrokes from a text field. | Budget real attention in M8. `theme-provider.tsx` already has an `isTypingTarget` helper for exactly this class of problem — reuse that pattern for the canvas Delete key. |
| **The error-span underline** requires text measurement that has to stay aligned with the input's font/padding under zoom. | Keep the field non-zooming (React Flow zoom scales the whole node; measure in local coordinates, which is unaffected). Fall back to underlining the whole field if it proves flaky — the code and hint still carry the meaning. |
| **`ssr: false` + hydration + localStorage.** Reading `localStorage` during render breaks hydration. | Canvas is client-only via `dynamic`; the document loads in a `useEffect` after mount, with an empty canvas as the first paint. |
| **React Compiler is available in Next 16 but off by default.** | Leave it off. React Flow does careful manual memoisation; adding auto-memoisation to that is a debugging risk for no prototype benefit. |

---

## 13. Assumptions

Everything below is a choice I made because the brief didn't say. Each is cheap to reverse; each is worth a glance.

1. **Package manager is pnpm**, per the lockfile. All install commands use `pnpm dlx shadcn@latest add …`.
2. **Prototype is a single route** (`app/page.tsx`). One flowchart open at a time, one localStorage slot. No multi-document manager.
3. **`+` is overloaded for text.** `number + number` → number. If *either* operand is text, `+` concatenates, formatting the other side with `formatValue`. Explainable in one sentence to a 14-year-old ("if either side is text, `+` joins them into text"), and required for `output "Total: " + total`. Every other arithmetic operator is numbers-only. **Flagged as open question 1.**
4. **No truthiness anywhere.** `AND`, `OR`, `NOT`, and `if` require actual booleans. `if 5` is `IF_NOT_BOOLEAN`, not "5 is truthy". `AND`/`OR` short-circuit.
5. **Comparisons require matching types.** `=` and `<>` on a number and a string is `TYPE_MISMATCH`, not silently `false` — that catches `age = "12"`, which is a mistake worth catching loudly. Booleans are not orderable with `<` / `>`.
6. **`/` is real division; `%` is remainder.** Both raise `DIVIDE_BY_ZERO` on a zero right operand (distinguished by `params.op`).
7. **Numbers are JS doubles, but display is rounded to 10 significant digits** before trailing zeros are trimmed. Otherwise the first student to compute `0.1 + 0.2` sees `0.30000000000000004` and loses all faith in the tool. `formatValue` is the single place this happens, shared by the terminal and the watch panel.
8. **Keywords are case-insensitive** (`AND`, `and`, `And` all lex as `AND`; `true`/`TRUE` likewise), and the block editor pretty-prints them canonically on blur. **Identifiers are case-sensitive**, with the nearest-match suggester weighting a case-only difference as the top suggestion. **Flagged as open question 2.**
9. **Keywords are reserved.** `AND = 5` is `PROCESS_ASSIGN_TO_RESERVED`, not a variable named `AND`.
10. **String literals are double-quoted**, with no escape sequences in the prototype. `\n` in student text would need explaining and isn't needed; `LEX_UNTERMINATED_STRING` covers the missing closing quote.
11. **Variable names are `[A-Za-z_][A-Za-z0-9_]*`.** ASCII only for now. Sinhala identifiers are a separate decision that shouldn't be made accidentally by the lexer.
12. **A bad value at an input prompt re-prompts rather than aborting.** `INPUT_NOT_A_NUMBER` is recoverable and leaves `status` at `awaiting-input`. Killing a program over a typo would be cruel.
13. **Locale is a runtime value threaded through `resolveMessage(err, locale)`**, defaulting to `"en"`, not a Next.js i18n route segment. No routing changes; `si.json` later is a data change plus a toggle.
14. **`en.json` entries are `{ message, hint }`**, not bare strings. The hint is where the teaching happens and it's the half that most needs a Sinhala translation.
15. **The step budget is 10,000** as suggested, defined once in `lib/run/budget.ts`, and overridable in tests.
16. **Autosave is debounced 500ms** to `localStorage["flowchart-sim:doc:v1"]`, and the persisted `FlowDocument` carries `version: 1` with a `migrate()` ladder in place from day one — cheap insurance against a schema change that eats a class's saved work.
17. **Serialization strips React Flow internals** (`measured`, `selected`, `dragging`, `internals`). Only `id`, `kind`, `position`, `data` are persisted.
18. **Node ids are `crypto.randomUUID()`**, minted only in `graph-store.ts`. `lib/` never generates an id, which keeps compile output deterministic under test.
19. **Run speeds** are Slow (800ms), Normal (400ms), Fast (150ms), Instant (batched, ~200 steps per animation frame). The runner uses recursive `setTimeout`, not `setInterval`, so a slow tick can't stack.
20. **The `if` node's `true` branch exits the bottom and `false` exits the right**, both permanently labelled and colour-coded. See §6.
21. **Diagnostics are shown continuously while editing** (quiet amber) and escalate to blocking red on Run. See §12(a).
22. **No accounts, no backend, no analytics.** Everything is local to the browser.

---

## Summary of what I'd change in the brief

Four things, in order of how much they'd cost to retrofit:

1. **`NO_REACHABLE_STOP` should be a warning, not an error** — otherwise every half-built flowchart refuses to run. (§12(a))
2. **Build the `history: RunState[]` array in the headless phase**, even if the step-back button waits — it's free, and it's what makes the purity rule self-enforcing under test. (§12(b))
3. **Name the cycle when the step budget trips.** With no loop block, mis-aimed loop-back edges are the dominant error; "is there a loop that never ends?" without a "here" is a dead end. (§12(c))
4. **Type `RunError.params` per code** via a discriminated union — same shape, zero cost, and it makes the message catalogue impossible to drift. (§12(d))

Everything else in the brief I'd build as written.

Awaiting approval before touching anything else.
