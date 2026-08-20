**English** · [සිංහල](README.si.md)

# Flowchart Simulator

Draw a flowchart, press **Run**, and watch it execute one block at a time.

Built for grade 8–9 ICT students (roughly 13–15) with no prior programming experience. Students drag blocks onto a canvas, connect them with arrows, type simple expressions, and step through execution with the current block highlighted and the travelled arrow animated.

**Input and output happen on the blocks themselves.** The block that asks for a value shows the field to type it into; the block that prints shows what it printed. A console fuses the two into one stream because a console has nowhere else to put them — here there is somewhere else, so the student never has to look away from the flowchart to use it. A record panel keeps the full transcript for when it is wanted.

The teaching point is that **a flowchart *is* a program**. Error messages are treated as the product, not an afterthought — every error is a structured code resolved to a sentence plus a "what to do" hint.

## Blocks

| Block | Shape | What it does |
|---|---|---|
| Start | stadium | Entry point. Exactly one per flowchart. |
| Stop | stadium | Ends the program. Several allowed. |
| Input | parallelogram | Pauses and reads typed values into variables. |
| Output | parallelogram | Evaluates values and prints them. |
| Process | rectangle | Assignments, one per line. |
| Decision | diamond | Boolean condition with `true` and `false` exits. |
| Connector | circle | Merge junction — several paths in, one path out. |

**There is no loop block.** A loop is an arrow from a decision branch back to an earlier block, which is part of what's being taught. Every block has ports on all four sides so a back-edge can leave sideways instead of doubling back under the loop body.

## The expression language

Deliberately tiny. The graph carries control flow, so there are no `if`/`while`/`then` keywords to learn.

```
expression := or
or         := and ( "OR" and )*
and        := not ( "AND" not )*
not        := "NOT" not | comparison
comparison := sum ( ( "=" | "<>" | "<" | ">" | "<=" | ">=" ) sum )?
sum        := term ( ( "+" | "-" ) term )*
term       := unary ( ( "*" | "/" | "%" ) unary )*
unary      := "-" unary | primary
primary    := NUMBER | STRING | "true" | "false" | IDENT | "(" expression ")"
```

- Values are numbers, text, and true/false. Nothing else.
- **No truthiness.** `if 5` is an error, not "5 is true".
- `=` means *assignment* in a Process block and *equality* in a Decision block. Position tells them apart, which is how pseudocode is taught at this level and avoids explaining `==`.
- `+` joins text when either side is text; other arithmetic is numbers only.

### Blocks hold several lines

Press Enter inside a block and it grows. A block is always **one step**, whatever it holds.

```
Process                 Input              Output
─────────────────       ────────────       ──────────────────────
subtotal = qty * price  price              "Receipt"
tax = subtotal / 10     qty                "qty:   ", qty
total = subtotal + tax                     "total: ", total
```

Process lines run top to bottom, each seeing what the lines above stored. Input takes commas *or* new lines as separators and prompts for each name in turn. In Output, a new line starts a new printed line and a comma joins values within one line.

## Watching it run

**Run** plays; pressing it again pauses. **Step** advances one block by hand, and **Step Back** undoes it — possible only because `step()` is pure, so the previous states are just an array.

While a program runs:

- The current block is ringed and the travelled arrow animates. The ring is drawn *underneath* the block, so a block keeps its own colour while it is executing.
- Each block kind has a colour that is the same in the palette and on the canvas — purple asks, cyan prints, blue assigns, amber decides.
- An **Input** block shows a field attached to it, with the variable name, the expected type, and `n/total` when it holds several names. A typed word where a number was expected reports at the field.
- An **Output** block shows what it last printed, and updates on every pass of a loop.
- Live values sit in a bar over the canvas. Speed runs from slow to instant, and the camera follows the current block unless you turn that off.

Validation appears on the block as a badge, and in full in the **Checks** tab. The record panel on the right — **Output**, **Values**, **Checks** — is collapsed by default and opens when it is wanted.

Both a light and a dark theme ship, light by default, with a toggle in the toolbar.

## Running it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000. Everything runs in the browser — no backend, no accounts. Work autosaves to `localStorage`, and can be exported and imported as JSON.

## Scripts

| | |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm test` | Test suite (headless, no DOM) |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier |

## How it's put together

```
lib/          the language and interpreter — pure TypeScript, zero React
  lang/       lexer, parser, AST, evaluator
  graph/      document types, ports, compile + validation
  run/        RunState, step(), input handling, step budget
  errors/     error codes and nearest-name suggestions
  i18n/       code + params -> sentence
components/   canvas, nodes, panels, shadcn UI
stores/       graph store (the document) and run store (execution)
messages/     en.json + si.json — every user-facing sentence
docs/         design plans and the reasoning behind them
```

Execution is a state machine rather than a loop, because Input blocks have to pause and wait for a person:

```
FlowGraph  ──compile()──▶  Program  ──step(program, state)──▶  RunState
```

`compile()` parses every block once and resolves arrows into next-pointers, so `step()` does no parsing and no edge lookups. `step()` is a pure function, which makes Run just a timer calling it repeatedly — and makes step-backwards a matter of keeping the previous states in an array.

`lib/` never imports React and never touches the DOM, so the entire language runs headless under test. That boundary is enforced by ESLint, not convention.

Errors are never strings inside `lib/`. The interpreter produces `{ code, params, span }`; a separate resolver turns that into a sentence. English and Sinhala both ship, and because the resolution happens at render time, switching language re-renders errors that are already on screen. A test fails the build if either catalogue gains or loses a key the other does not have.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui on **Base UI** · React Flow (`@xyflow/react`) · zustand · vitest

## Status

Prototype, and usable end to end.

Built: all seven block types, connection rules, four-sided ports and loops as back-edges, inline multi-line editing, compile + validation shown both on the block and in the Checks panel, Run / Pause / Step / Step Back / Reset, on-block input prompts and output, per-kind block colour, a live variable bar, light and dark themes, English and Sinhala, snap-to-grid, autosave, JSON import/export.

Not built yet: editor undo/redo, a worked-example library, accounts or any backend, a mobile layout, and image export.

`CHANGELOG.md` records what changed and when. `docs/PLAN.md`, `docs/PLAN-V2.md` and `docs/PLAN-V3.md` record *why* — the reasoning, the open questions, and the known issues. Read them before relitigating a design decision.
