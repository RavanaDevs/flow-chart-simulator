**English** · [සිංහල](README.si.md)

# Flowchart Simulator

Draw a flowchart, press **Run**, and watch it execute like a console program.

Built for grade 8–9 ICT students (roughly 13–15) with no prior programming experience. Students drag blocks onto a canvas, connect them with arrows, type simple expressions, and step through execution with the current block highlighted, the travelled arrow animated, and output printing to a terminal panel.

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
messages/     en.json — every user-facing sentence
docs/         design plans and the reasoning behind them
```

Execution is a state machine rather than a loop, because Input blocks have to pause and wait for a person:

```
FlowGraph  ──compile()──▶  Program  ──step(program, state)──▶  RunState
```

`compile()` parses every block once and resolves arrows into next-pointers, so `step()` does no parsing and no edge lookups. `step()` is a pure function, which makes Run just a timer calling it repeatedly — and makes step-backwards a matter of keeping the previous states in an array.

`lib/` never imports React and never touches the DOM, so the entire language runs headless under test. That boundary is enforced by ESLint, not convention.

Errors are never strings inside `lib/`. The interpreter produces `{ code, params, span }`; a separate resolver turns that into a sentence. The prototype ships English only, with Sinhala planned — the structure is in place so that adding it is a data change.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui on **Base UI** · React Flow (`@xyflow/react`) · zustand · vitest

## Status

Prototype. Built: all seven block types, connection rules, inline multi-line editing, compile + validation surfaced in a Problems panel, Run / Step / Step Back / Reset, terminal with inline prompts, variables watch panel, active-block highlight and edge animation, snap-to-grid, autosave, JSON import/export.

Not built yet: per-block error badges on the canvas (validation currently only appears in the Problems panel), Sinhala translations (`si.json`), editor undo/redo, a worked-example library, accounts or any backend, mobile layout, and image export. See `docs/PLAN.md` and `docs/PLAN-V2.md` for the reasoning, open questions, and known issues.
