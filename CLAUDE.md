# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                              # dev server (Turbopack)
pnpm test                             # vitest, headless, node environment
pnpm test:watch
pnpm vitest run lib/run/step.test.ts  # one file
pnpm vitest run -t "step budget"      # one test by name
pnpm lint                             # eslint flat config; must be clean
pnpm typecheck                        # tsc --noEmit
pnpm build                            # next build
```

Package manager is **pnpm**. Add shadcn components with `pnpm dlx shadcn@latest add <name>`.

`pnpm build` does not type-check test files; `pnpm typecheck` does. Run both.

## Two stack facts that will mislead you

1. **shadcn here is Base UI, not Radix.** `components.json` sets `"style": "base-nova"` and components import from `@base-ui/react/*`. Props and composition differ from every Radix-era shadcn example — Base UI uses a `render` prop for composition (`<DialogTrigger render={<Button />}>`). Read the generated file in `components/ui/` or run `pnpm dlx shadcn docs <name>` before using a component. Do not write shadcn from memory.
2. **Next.js 16.** See `AGENTS.md`: read `node_modules/next/dist/docs/` rather than relying on training data. Relevant here: `next/dynamic` with `ssr: false` errors inside a Server Component and must live in a Client Component — which is how the canvas is mounted.

## Architecture

A visual flowchart simulator for grade 8–9 ICT students: draw a flowchart, press Run, watch it execute with a highlighted block and an animated edge. Input is typed on the block that asks for it and output appears on the block that printed it; a collapsible record panel keeps the full transcript.

The pipeline is one direction:

```
FlowGraph (document)  ──compile()──▶  Program (parsed ASTs, resolved next-pointers)
                                          │
                                          ▼
                              step(program, state) → RunState        (pure, synchronous)
                                          │
                          provideInput(program, state, raw)          (resumes a paused input)
```

### Non-negotiable rules

These are load-bearing; several are enforced mechanically.

1. **`lib/` is pure TypeScript — no React, no DOM, no `@xyflow`.** The whole language and interpreter run headless under vitest. Enforced by `no-restricted-imports` and `no-restricted-globals` scoped to `lib/**` in `eslint.config.mjs`.
2. **Errors are structured objects, never strings.** `RunError` is a discriminated union over `ErrorCode` in `lib/errors/codes.ts`, so `params` is type-checked per code. User-facing text lives only in `messages/en.json` and `messages/si.json`, and is produced by `resolveMessage()` in `lib/i18n/resolve.ts`. Both catalogues ship. `lib/i18n/parity.test.ts` fails on a missing *or* orphaned key in either direction, so adding, renaming or removing a key touches four places together: `ui-keys.ts`, the test's `ALL_UI_KEYS` list, `en.json` and `si.json`.
3. **`step()` is pure** — `(program, state) => state`. No mutation, no async, no side effects. Guarded by a deepFreeze test in `lib/run/step.test.ts`.
4. **No `eval()` / `new Function()`.** Enforced repo-wide by lint.
5. **The graph is never mutated during execution.** `stores/run-store.ts` imports only zustand and `lib/` — it has no path to a graph setter. Compilation is triggered in `hooks/use-runner.ts` / the toolbar, which hand `load(program)` a finished `Program`.

### State

Two separate zustand stores, deliberately not slices of one:

- `stores/graph-store.ts` — the document (nodes, edges, selection, `revision`).
- `stores/run-store.ts` — execution (`Program`, `RunState`, `history` for step-back).

Coupling is one-way and only at compile time. Node components subscribe narrowly (`useRunStore(s => s.state.currentNodeId === id)`) so a step re-renders two nodes, not the canvas.

## Invariants that break silently

Each of these has already caused a real bug.

**Node dimensions must be multiples of `SHAPE_UNIT` (32 = 2 × grid).** Snapping moves a node's top-left corner onto the 16px grid, but ports sit at edge midpoints — at `x + width/2`. If half a dimension is not a whole grid step, two blocks of different sizes can *never* be aligned, and `getSmoothStepPath` renders the leftover offset as a permanent dogleg. `components/flow/shapes/geometry.test.ts` guards this across 1–8 lines of growth.

**A physical port is not a logical branch.** `lib/graph/handles.ts` maps `false-left` and `false-right` → `"false"` via `branchOf()`. The determinism rule is *one outgoing edge per logical branch*, checked with `branchOf()` in both `compile()` and `isValidConnection`. Comparing raw handle strings lets a student connect two ports of the same branch and get a nondeterministic flowchart that compiles cleanly.

**Ports exist on all four sides and each both sends and receives** (`ConnectionMode.Loose`), so direction is no longer guaranteed by a handle not existing. `START_HAS_INBOUND` / `STOP_HAS_OUTGOING` in `compile()` are the only backstop for imported files.

**`CompiledNode.next` is non-nullable.** Compilation only succeeds when every reachable non-`stop` node has its exits connected, and unreachable nodes are dropped from `program.nodes` entirely. That is why `step()` has no "nowhere to go" branch — do not add one, keep the guarantee in `compile()`.

**`compile()` skips any node missing from `parsedData`.** A new node kind that forgets to register there vanishes from the compiled program with no error.

**Block text is multi-line and each line is tokenized separately.** `tokenize(src, offset)` takes the line's offset so every span stays an absolute position inside the whole block; otherwise error underlines land on the wrong line. A consequence: a string literal must close on the line it opens.

**`appendTerminal()` holds the log at 2000 lines and reports truncation as a *flag* on `RunState`, never as a line in the log.** Emitting a notice per append made the array grow without bound and filled the terminal with copies of its own warning.

**The canvas owns transient interaction state.** `flow-canvas.tsx` keeps React Flow nodes in local state and commits to the store only on drag stop / removal. `mergeNodes` reuses the existing node object when nothing semantic changed — rebuilding it mid-drag hands React Flow a stale position and the node snaps back to where the drag started. Document→canvas sync is a render-phase adjustment, not a `useEffect` (the `react-hooks/set-state-in-effect` rule rejects the effect form, and an effect would paint one stale frame).

### Adding a node kind

Touches more places than expected; `tsc` catches some but not all:

`lib/graph/types.ts` (kind + data) → `lib/graph/handles.ts` (`TARGET_PORTS`, `SOURCE_PORTS`) → `components/flow/shapes/geometry.ts` (`SIZES`, `GROWS`, `KIND_COLOR_TOKENS`, path) → `lib/graph/program.ts` (`CompiledNode`) → `lib/graph/compile.ts` (**`parsedData` registration** + emission) → `lib/run/step.ts` (switch case; exhaustiveness fails the build) → `components/flow/node-types.ts` → `components/editor/palette.tsx` → `lib/persistence/validate-import.ts` (`VALID_KINDS`).

## Language

Deliberately minimal; the graph carries control flow, so there are no statement keywords.

- Values are `number | string | boolean` only. **No truthiness** — `AND`/`OR`/`NOT` and `if` require actual booleans.
- `=` is assignment in a process block and equality in an `if` block; position disambiguates.
- `+` concatenates when either side is text; every other arithmetic operator is numbers-only. Comparisons require matching types.
- Blocks are **multi-line**. A block is always **one step**, whatever it holds:
  - `process` — one assignment per line, run top to bottom, each seeing the lines above it.
  - `input` — comma *and* newline both separate names; prompts for each in turn.
  - `output` — newline starts a new printed line, comma joins values within a line.
- `formatValue()` rounds to 10 significant digits so `0.1 + 0.2` does not print `0.30000000000000004`.

## Testing

Headless `lib/` work is tested first and carries most of the suite.

- Graphs are built with the fluent `flow()` builder in `lib/testing/build-flow.ts`; shared programs live in `lib/testing/programs.ts` as `FIXTURES`.
- Invariant tests matter more than case coverage here: determinism, absorbing terminal states, `awaiting-input` as a hard stop, `step()` non-mutation under deepFreeze, geometry alignment, and i18n parity.
- `lib/i18n/parity.test.ts` has a hand-maintained `ALL_ERROR_CODES` list — adding an `ErrorCode` fails the suite until `messages/en.json` and that list both have it.
- `lib/persistence/migrate.test.ts` loads a real v1 document. Saved work lives in `localStorage["flowchart-sim:doc:v1"]`; migrations must never drop it.

## Known dead ends

**`NodeFrame` compiles the whole graph once per node.** On-canvas diagnostics are wired now, but `NodeFrame` resolves them by calling `compile({ nodes, edges })` inside its own `useMemo` rather than receiving them from a parent. `nodes` changes identity on every edit, so a canvas of N blocks runs N full compiles per keystroke, plus one more in `editor-shell.tsx`. Fine at classroom sizes; the fix if it ever bites is to compile once at the shell and pass a `Map<NodeId, Diagnostic>` down, not to memoise harder inside the node.

`NO_STOP` is declared in `codes.ts` and has an `en.json` entry but is never emitted (`NO_REACHABLE_STOP` is used instead).

## Design docs

`docs/PLAN.md` (original architecture and reasoning) and `docs/PLAN-V2.md` (ports, loops, multi-value blocks) record why decisions were made, open questions, and known outstanding issues. Read them before relitigating a design choice.
