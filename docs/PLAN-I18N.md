# Sinhala Localization — Plan

The original brief said the prototype ships English but the *structure* must be there from day one, because retrofitting i18n into a parser is miserable. That call paid off for **errors**. It did not cover everything else, and this plan is mostly about the gap.

Nothing here is implemented.

---

## 1. What actually exists today

**Working, and the hard part is genuinely done.** The interpreter never produces a sentence. Every error is `{ code, params, span?, nodeId? }`, `RunError` is a discriminated union so `params` is type-checked per code, and `resolveMessage(err, locale)` in `lib/i18n/resolve.ts` turns it into `{ message, hint }`. 29 codes, each with both fields, and `lib/i18n/parity.test.ts` fails the build if a code has no entry. Placeholders are **named** (`{name}`, `{op}`), not positional — which matters more than it sounds, see §6.

**What is missing:**

| | Status |
|---|---|
| `messages/si.json` | Does not exist. `lib/i18n/resolve.ts` maps `si` → the English catalogue with a `// fallback` comment. |
| Locale switching | `Locale = "en" \| "si"` is declared and **never used**. Every `resolveMessage` call site relies on the default parameter. No store field, no UI control, no persistence. |
| UI chrome | **No mechanism at all.** The resolver covers errors only. |
| Sinhala fonts | None. `app/layout.tsx` loads Geist and Geist Mono, neither of which has Sinhala glyphs. |

## 2. The blocker: the resolver only covers errors

Roughly 60 user-facing strings live outside the catalogue, hardcoded in JSX. Translating `si.json` alone would produce an app that shows Sinhala error messages inside an otherwise English interface.

| Where | Count | Examples |
|---|---|---|
| `components/editor/toolbar.tsx` | ~14 | Run, Step, Step Back, Reset, Speed, Slow/Normal/Fast/Instant, Follow Node, New, Export, Import, the Clear dialog |
| `components/editor/palette.tsx` | ~13 | Every block name and its one-line description |
| `components/flow/nodes/*.tsx` | 8 | The labels drawn on the blocks: Start, Stop, Input, Output, Process, Decision (If), Connector |
| `components/panels/*.tsx` | ~15 | Panel headings, empty states, the input prompt sentence, column headers |
| toasts across components | 10 | Connection refusals, import/export results, the paused-for-input notice |

Two of these are worse than "untranslated" — they are **rule-2 violations that must be fixed regardless of Sinhala**:

- `components/panels/terminal-line.tsx:56-59` hardcodes all four `SystemCode` sentences in JSX, plus the prompt sentence. Terminal lines deliberately store *codes* so this could not happen.
- `lib/persistence/validate-import.ts` returns **11 English sentences** as `{ ok: false, error: string }` — generated inside `lib/`, which rule 1 and rule 2 both forbid.

## 3. Message catalogue restructure

One file per locale, handed to a translator as a single unit:

```
messages/
  en.json      { "errors": { CODE: {message, hint} }, "ui": { KEY: string } }
  si.json      same shape
```

This is a small migration of the existing `en.json` (which is currently a bare map of error codes) plus the parity test. Worth doing once, because a translator should receive **one file**, not two plus a list of files to grep.

UI keys get a typed union so a missing key is a compile error, mirroring how `ErrorCode` already works:

```ts
// lib/i18n/ui-keys.ts
export type UiKey =
  | "toolbar.run" | "toolbar.step" | "toolbar.stepBack" | "toolbar.reset"
  | "block.start" | "block.process" | "block.decision" | ...
  | "terminal.empty" | "terminal.promptFor" | ...

// lib/i18n/resolve.ts
export function t(key: UiKey, locale: Locale, params?: Record<string, string>): string
```

`t()` stays in `lib/` — it is pure and has no React dependency. Components read the locale from the store and call it.

`SystemCode` messages move into `errors` (they already have codes), which deletes the hardcoded block in `terminal-line.tsx`.

`validate-import.ts` changes its return type from `error: string` to `error: RunError`, with new codes — `IMPORT_NOT_AN_OBJECT`, `IMPORT_BAD_NODE`, `IMPORT_UNKNOWN_KIND`, `IMPORT_BAD_POSITION`, `IMPORT_BAD_EDGE`, plus the existing `UNSUPPORTED_DOCUMENT_VERSION`. Five codes replace eleven sentences, because several of the current messages differ only by an index that becomes a param.

## 4. Typography — the part that actually breaks

This is the concrete risk flagged in `docs/PLAN.md` §12(f) and never acted on.

**Geist and Geist Mono contain no Sinhala glyphs.** Every Sinhala character will fall back to whatever the OS provides, at different metrics, inside layouts sized for Latin text.

- **Add `Noto Sans Sinhala`** via `next/font/google`. Font fallback is per-glyph, so one stack serves both scripts: `--font-sans: Geist, "Noto Sans Sinhala", sans-serif`.
- **There is no widely available Sinhala monospace.** The terminal, the block editors and the variables panel are all `font-mono`. Sinhala text there will render proportionally next to monospaced ASCII. This is acceptable — and largely invisible, because *the code a student types stays ASCII* (§5). It affects error messages and hints in the terminal, which are prose anyway.
- **Vertical metrics are the real problem.** Sinhala vowel signs sit well above and below the baseline (ෙ ො ්). At the current `text-xs` / `leading-5`, they clip or collide. Line height must increase for Sinhala, and any fixed-height container has to be re-checked.
- Set `preload: false` on the Sinhala face so English users do not download it.

**Where clipping will show up:** the block labels drawn inside shapes, the palette rows, toolbar buttons, and the diagnostic badge tooltip. Node bodies are lower risk since their content is ASCII code, but the *labels* above them are not.

A concrete guard: render the full `si.json` into a scratch page at the app's real font sizes and eyeball it, before wiring the toggle. Cheaper than discovering it block by block.

## 5. What stays in English

**Keywords and variable names.** `AND`, `OR`, `NOT`, `true`, `false`, and everything the student types into a block remain ASCII.

Reasons, in order of weight:

1. The syllabus itself teaches these operators in English; a student sits an exam using them.
2. This is a programming-literacy tool. Switching the *interface* to Sinhala lowers the barrier; switching the *language* removes the thing being taught.
3. The lexer accepts `[A-Za-z_][A-Za-z0-9_]*`. Sinhala identifiers would mean reworking the lexer, the reserved-word check, and the nearest-name suggester's edit distance — which is grapheme-naive and would behave badly on combining marks.

Sinhala **variable names** (`නම = "අමල්"`) are a separate question, deliberately deferred — see §10.

## 6. Two things that make translation quality worse if not fixed first

**Conditional segments.** `UNKNOWN_VARIABLE`'s hint is `"Did you mean '{suggestion}'? Make sure you assign it before reading."` When there is no near match, the resolver strips the placeholder and prints **"Did you mean ''?"** — already a known bug in English. In Sinhala it is worse: the surrounding clause is grammatically dependent on the missing word, so the sentence collapses rather than merely reading oddly.

Fix before translating: split into two codes (`UNKNOWN_VARIABLE` and `UNKNOWN_VARIABLE_DID_YOU_MEAN`) and let `suggest.ts` decide which to raise. Two clean sentences a translator can write naturally beat one template with a hole in it.

**Plurals.** `MULTIPLE_START` reads `"Flowchart has {count} Start blocks"`. Sinhala has distinct one/other forms. Rather than adding an ICU dependency, **rewrite the messages to avoid counting** — "Your flowchart has more than one Start block." This is cheaper, reads better in both languages, and keeps `resolveMessage` a 30-line function. If real plural rules are ever needed, the signature is already compatible with dropping in `Intl.PluralRules`.

## 7. Writing for 13-year-olds in Sinhala

Register matters more here than in English, because Sinhala's written form is further from speech and the default technical register is heavily Sanskritized — exactly the vocabulary a 13-year-old will not know.

Guidance for whoever writes the strings:

- Plain written Sinhala, short sentences, one idea each. Avoid literary verb forms.
- Address the student directly with **ඔබ** (polite-neutral); avoid both the formal and the familiar extremes.
- Prefer the syllabus term over a coined one, and the everyday word over the Sanskritized one where the syllabus does not fix it.
- Keep the `message` a statement of what happened and the `hint` an instruction — the same split as English. The hint is where the teaching happens and matters most.
- Keep ASCII identifiers, operators and code fragments unquoted-in-Sinhala and left-to-right; do not translate the contents of `{name}`.

### Draft glossary — **requires review by a Sinhala-speaking ICT teacher**

Marked draft deliberately. I can produce a first pass, but I am not a reliable authority on the terms the Sri Lankan grade 8–9 ICT syllabus actually uses, and wrong terminology is worse than English for a student who will be examined on the syllabus vocabulary.

| English | Draft Sinhala | Confidence |
|---|---|---|
| flowchart | ගැලීම් සටහන | likely syllabus term |
| variable | විචල්‍යය | likely syllabus term |
| value | අගය | high |
| number | සංඛ්‍යාව | high |
| text | පෙළ | high |
| true / false | සත්‍ය / අසත්‍ය | high |
| input | ආදානය | likely syllabus term |
| output | ප්‍රතිදානය | likely syllabus term |
| process | ක්‍රියාවලිය | likely syllabus term |
| decision | තීරණය | high |
| start / stop | ආරම්භය / නැවතුම | medium — check "stop" |
| arrow | ඊතලය | high |
| loop | චක්‍රය | medium — syllabus may prefer පුනරාවර්තනය |
| program | වැඩසටහන | high |
| error | දෝෂය | high |
| run | ධාවනය | medium — may read too formal for 13-year-olds |

The right process: I generate `messages/si.json` as a complete first draft with every key filled, then a teacher edits it as prose. Reviewing and correcting a draft is far less work for them than translating 90 strings from scratch, and it keeps them focused on register and terminology rather than mechanics.

`docs/TRANSLATION.md` should accompany it: where each string appears, who reads it, and the tone guidance above.

## 8. Locale switching

- Add `locale: Locale` to a small `stores/ui-store.ts` (or the graph store's UI slice — but not the run store, which must stay execution-only).
- Persist to `localStorage["flowchart-sim:locale"]`, read after mount to avoid a hydration mismatch, defaulting to `en`.
- A toggle in the toolbar — two labelled options, not a flag icon.
- **No Next.js i18n routing.** The app is a single client-rendered page; route segments would add a build concern and buy nothing.
- Components get the locale from the store and pass it to `t()` / `resolveMessage()`. A thin `useT()` hook returning a bound `t` keeps call sites short.

**Switching locale must not touch the document or the run state.** Locale is presentation. Because terminal lines store codes rather than sentences, an already-printed error re-renders in the new language for free — which is a genuinely nice demonstration that the architecture was right.

## 9. Build sequence

**L1 — Close the structural gaps.** Move the four `SystemCode` sentences out of `terminal-line.tsx`; convert `validate-import.ts` to structured errors; split `UNKNOWN_VARIABLE`; rewrite the plural-bearing messages. *Verify:* no user-facing sentence originates in `lib/` or in JSX; parity test green. **This is worth doing on its own merits, Sinhala or not.**

**L2 — Catalogue restructure.** `messages/{locale}.json` with `errors` + `ui` namespaces; `UiKey` union; `t()`; migrate the parity test. *Verify:* a missing UI key fails `tsc`; a missing translation fails the test.

**L3 — Extract the ~60 UI strings.** Toolbar, palette, block labels, panels, toasts, dialog. Mechanical but touches many files. *Verify:* grep finds no user-facing literal left in `components/`.

**L4 — Typography.** Add Noto Sans Sinhala with `preload: false`; adjust line-height for Sinhala; audit fixed-height containers. *Verify:* a scratch page rendering every string at real font sizes, checked at both themes.

**L5 — Locale store + toggle.** *Verify:* switch mid-run and confirm already-printed terminal errors re-render in the new language and execution is untouched.

**L6 — Draft `si.json`, then teacher review.** *Verify:* parity test across both locales; a native reader reads the ten most common errors and understands them without help.

L1 → L3 are the real work. L6 is where the quality lives.

## 10. Open questions

1. **Who owns the Sinhala text?** The plan assumes I draft and a teacher edits. If no reviewer is available, this should not ship — a machine-drafted Sinhala interface for 13-year-olds is worse than an English one they can ask about.
2. **Sinhala variable names?** Deferred above. If wanted, it is a lexer change plus a grapheme-aware edit distance, and it should be decided before students build a body of saved work in one convention.
3. **Should block labels be bilingual?** Showing `ක්‍රියාවලිය` with `Process` underneath costs vertical space but bridges to the English terms students meet later. Worth asking the teacher.
4. **Which is the default locale?** English today. For the target school, Sinhala-first with an English toggle may be the correct default.
5. **Is the terminal's monospace worth keeping** once errors are Sinhala prose? A proportional face for message/hint lines and monospace for program output would read better — a small change to `terminal-line.tsx`.

## 11. Assumptions

1. Sinhala only; no Tamil in this pass. The catalogue shape supports adding it as a third file with no code change, and that is worth stating now given the audience.
2. Numbers stay Western Arabic; `formatValue()` is untouched.
3. Layout stays left-to-right. `components.json` already has `"rtl": false` and no RTL work is implied.
4. Student-typed content is never translated — only the interface around it.
5. The step budget, error codes and every semantic remain identical across locales. Only presentation changes.
6. A translated string may be substantially longer than its English source; layouts must flex rather than truncate.
