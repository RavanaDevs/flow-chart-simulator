import { describe, it, expect } from "vitest";
import { tokenize } from "./lexer";

describe("tokenize", () => {
  it("tokenizes numbers, strings, and operators", () => {
    const res = tokenize(`x = 10 + 2.5 * "hello"`);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const kinds = res.tokens.map((t) => t.kind);
    expect(kinds).toEqual([
      "IDENTIFIER",
      "EQUALS",
      "NUMBER",
      "PLUS",
      "NUMBER",
      "STAR",
      "STRING",
      "EOF",
    ]);
    expect(res.tokens[6].text).toBe("hello");
  });

  it("tokenizes keywords case-insensitively", () => {
    const res = tokenize("IF a <= b THEN NOT true AND false OR x <> y");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const kinds = res.tokens.map((t) => t.kind);
    expect(kinds).toEqual([
      "KEYWORD_IF",
      "IDENTIFIER",
      "LESS_EQUALS",
      "IDENTIFIER",
      "KEYWORD_THEN",
      "KEYWORD_NOT",
      "KEYWORD_TRUE",
      "KEYWORD_AND",
      "KEYWORD_FALSE",
      "KEYWORD_OR",
      "IDENTIFIER",
      "NOT_EQUALS",
      "IDENTIFIER",
      "EOF",
    ]);
  });

  it("returns error for unterminated string", () => {
    const res = tokenize(`"unterminated`);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("LEX_UNTERMINATED_STRING");
    expect(res.error.span).toEqual([0, 13]);
  });

  it("returns error for unknown character", () => {
    const res = tokenize("x = 10 @ 5");
    expect(res.ok).toBe(false);
    if (!res.ok && res.error.code === "LEX_UNKNOWN_CHARACTER") {
      expect(res.error.params.char).toBe("@");
      expect(res.error.span).toEqual([7, 8]);
    }
  });
});
