# Sinhala Translation Review Guide (සිංහල පරිවර්තන නිරීක්ෂණ මාර්ගෝපදේශය)

This document accompanies `messages/si.json` and is designed for Sri Lankan Grade 8–9 ICT teachers and native Sinhala reviewers fine-tuning the Sinhala language catalogue for the Flowchart Simulator.

---

## 1. Register & Tone Guidelines (ස්වරය සහ භාෂා ශෛලිය)

- **Target Audience**: 13-to-15-year-old school students studying Sri Lankan ICT syllabus (Grades 8–9).
- **Written Form**: Plain, simple written Sinhala (සරල ලේඛන සිංහල). Avoid overly formal or archaic literary verb forms.
- **Form of Address**: Address the student directly using **ඔබ** (polite-neutral). Avoid formal terms (ඔබතුමා) and familiar slang.
- **Terminology Preference**: Prefer official Sri Lankan school ICT syllabus terms over newly coined ones, and everyday plain words over complex Sanskritized vocabulary.
- **Structure**:
  - `message`: Clear statement of what happened (ස්ථානය / සිදුවූ දේ).
  - `hint`: Actionable instruction on how to fix it (විසඳුම / කළ යුතු දේ).

---

## 2. Technical Code & Placeholder Preservation (සංකේත සහ පරාමිති ආරක්ෂා කිරීම)

- **Variable & Operator Names**: Code fragments, variable names, and logical operators (`AND`, `OR`, `NOT`, `true`, `false`) stay ASCII in English as used in the syllabus.
- **Placeholders**: Keep placeholders like `{name}`, `{op}`, `{char}`, `{found}`, `{expected}` untouched inside the Sinhala strings. Do not translate the text inside curly braces `{}`.

---

## 3. Key Terminology Glossary (පාරිභාෂිත ශබ්දමාලාව)

| English Term | Sinhala Term | Context in App |
|---|---|---|
| flowchart | ගැලීම් සටහන | Overall application name and graph |
| variable | විචල්‍යය | Stored value identifiers (`x`, `total`) |
| value | අගය | Content stored in variables or input |
| number | සංඛ්‍යාව | Numeric data type |
| text | පෙළ | Text string data type |
| true / false | සත්‍ය / අසත්‍ය | Boolean condition evaluation |
| input | ආදානය | Input block & reading user values |
| output | ප්‍රතිදානය | Output block & printing to terminal |
| process | ක්‍රියාවලිය | Process block & variable assignment |
| decision | තීරණය | Decision (If) block |
| start / stop | ආරම්භය / නැවතුම | Flowchart entry and exit blocks |
| connector | සම්බන්ධකය | Flowchart path junction block |
| arrow | ඊතලය | Connecting line between blocks |
| program | වැඩසටහන | Execution state |
| terminal | ටර්මිනලය | Console output panel |
| error | දෝෂය | Problem diagnostic or runtime error |
| run | ධාවනය | Execute flowchart |
| step | පියවර | Execute one block step |

---

## 4. Message Catalogue Structure (`messages/si.json`)

The catalogue is split into two primary namespaces:

1. **`errors`**: Runtime execution errors, syntax errors, and graph compile diagnostics. Each entry contains `{ "message": "...", "hint": "..." }`.
2. **`ui`**: UI labels, button titles, panel headers, toasts, and dialogs.

When editing `messages/si.json`, please maintain valid JSON formatting (closing quotes and commas).
