import { Token, TokenKind } from "./tokens";
import { getKeywordKind } from "./keywords";
import { RunError } from "../errors/codes";

export type LexResult =
  | { ok: true; tokens: Token[] }
  | { ok: false; error: RunError };

export function tokenize(src: string): LexResult {
  const tokens: Token[] = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const char = src[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    const start = i;

    // Multi-char operators: <>, <=, >=
    if (char === "<") {
      if (i + 1 < len && src[i + 1] === ">") {
        tokens.push({ kind: "NOT_EQUALS", text: "<>", start, end: i + 2 });
        i += 2;
        continue;
      }
      if (i + 1 < len && src[i + 1] === "=") {
        tokens.push({ kind: "LESS_EQUALS", text: "<=", start, end: i + 2 });
        i += 2;
        continue;
      }
      tokens.push({ kind: "LESS_THAN", text: "<", start, end: i + 1 });
      i++;
      continue;
    }

    if (char === ">") {
      if (i + 1 < len && src[i + 1] === "=") {
        tokens.push({ kind: "GREATER_EQUALS", text: ">=", start, end: i + 2 });
        i += 2;
        continue;
      }
      tokens.push({ kind: "GREATER_THAN", text: ">", start, end: i + 1 });
      i++;
      continue;
    }

    // Single-char operators and punctuation
    if (char === "=") {
      tokens.push({ kind: "EQUALS", text: "=", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === "+") {
      tokens.push({ kind: "PLUS", text: "+", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === "-") {
      tokens.push({ kind: "MINUS", text: "-", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === "*") {
      tokens.push({ kind: "STAR", text: "*", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === "/") {
      tokens.push({ kind: "SLASH", text: "/", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === "%") {
      tokens.push({ kind: "PERCENT", text: "%", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "LPAREN", text: "(", start, end: i + 1 });
      i++;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "RPAREN", text: ")", start, end: i + 1 });
      i++;
      continue;
    }

    // String literal
    if (char === '"') {
      let strVal = "";
      i++; // skip opening quote
      let closed = false;
      while (i < len) {
        const c = src[i];
        if (c === '"') {
          closed = true;
          i++; // skip closing quote
          break;
        }
        strVal += c;
        i++;
      }
      if (!closed) {
        return {
          ok: false,
          error: {
            code: "LEX_UNTERMINATED_STRING",
            params: {},
            span: [start, i],
          },
        };
      }
      tokens.push({ kind: "STRING", text: strVal, start, end: i });
      continue;
    }

    // Numbers: digits with optional decimal point
    if (/[0-9]/.test(char)) {
      let numStr = "";
      while (i < len && /[0-9]/.test(src[i])) {
        numStr += src[i];
        i++;
      }
      if (i < len && src[i] === "." && i + 1 < len && /[0-9]/.test(src[i + 1])) {
        numStr += ".";
        i++;
        while (i < len && /[0-9]/.test(src[i])) {
          numStr += src[i];
          i++;
        }
      }
      tokens.push({ kind: "NUMBER", text: numStr, start, end: i });
      continue;
    }

    // Identifiers and Keywords
    if (/[A-Za-z_]/.test(char)) {
      let identStr = "";
      while (i < len && /[A-Za-z0-9_]/.test(src[i])) {
        identStr += src[i];
        i++;
      }
      const kwKind = getKeywordKind(identStr);
      const kind: TokenKind = kwKind ?? "IDENTIFIER";
      tokens.push({ kind, text: identStr, start, end: i });
      continue;
    }

    // Unknown character
    return {
      ok: false,
      error: {
        code: "LEX_UNKNOWN_CHARACTER",
        params: { char },
        span: [start, start + 1],
      },
    };
  }

  tokens.push({ kind: "EOF", text: "", start: len, end: len });
  return { ok: true, tokens };
}
