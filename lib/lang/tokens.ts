export type Span = [start: number, end: number];

export type TokenKind =
  | "KEYWORD_START"
  | "KEYWORD_STOP"
  | "KEYWORD_INPUT"
  | "KEYWORD_OUTPUT"
  | "KEYWORD_IF"
  | "KEYWORD_THEN"
  | "KEYWORD_ELSE"
  | "KEYWORD_NOT"
  | "KEYWORD_AND"
  | "KEYWORD_OR"
  | "KEYWORD_TRUE"
  | "KEYWORD_FALSE"
  | "NUMBER"
  | "STRING"
  | "IDENTIFIER"
  | "EQUALS"
  | "NOT_EQUALS"
  | "LESS_THAN"
  | "GREATER_THAN"
  | "LESS_EQUALS"
  | "GREATER_EQUALS"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "PERCENT"
  | "LPAREN"
  | "RPAREN"
  | "EOF";

export type Token = {
  kind: TokenKind;
  text: string;
  start: number;
  end: number;
};
