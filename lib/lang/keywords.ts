import { TokenKind } from "./tokens";

export const KEYWORDS: Record<string, TokenKind> = {
  START: "KEYWORD_START",
  STOP: "KEYWORD_STOP",
  INPUT: "KEYWORD_INPUT",
  OUTPUT: "KEYWORD_OUTPUT",
  IF: "KEYWORD_IF",
  THEN: "KEYWORD_THEN",
  ELSE: "KEYWORD_ELSE",
  NOT: "KEYWORD_NOT",
  AND: "KEYWORD_AND",
  OR: "KEYWORD_OR",
  TRUE: "KEYWORD_TRUE",
  FALSE: "KEYWORD_FALSE",
};

export const RESERVED_WORDS = new Set(Object.keys(KEYWORDS));

export function getKeywordKind(text: string): TokenKind | null {
  const upper = text.toUpperCase();
  return KEYWORDS[upper] ?? null;
}

export function isKeyword(text: string): boolean {
  return RESERVED_WORDS.has(text.toUpperCase());
}
