import { Token, TokenKind, Span } from "./tokens";
import { tokenize } from "./lexer";
import { Expr, Assignment, BinaryOp } from "./ast";
import { RunError } from "../errors/codes";
import { isKeyword } from "./keywords";

export type ParseExprResult =
  | { ok: true; expr: Expr }
  | { ok: false; error: RunError };

export type ParseProcessResult =
  | { ok: true; assignment: Assignment }
  | { ok: false; error: RunError };

export type ParseIdentResult =
  | { ok: true; name: string }
  | { ok: false; error: RunError };

export type ParseOutputListResult =
  | { ok: true; exprs: Expr[] }
  | { ok: false; error: RunError };

export type ParseIdentListResult =
  | { ok: true; names: string[]; spans: Span[] }
  | { ok: false; error: RunError };

class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] ?? this.tokens[this.tokens.length - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().kind === "EOF";
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.tokens[this.current - 1];
  }

  private check(...kinds: TokenKind[]): boolean {
    if (this.isAtEnd()) return false;
    return kinds.includes(this.peek().kind);
  }

  private match(...kinds: TokenKind[]): boolean {
    if (this.check(...kinds)) {
      this.advance();
      return true;
    }
    return false;
  }

  public parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();

    while (this.check("KEYWORD_OR")) {
      const opToken = this.advance();
      const right = this.parseAnd();
      const opSpan: Span = [opToken.start, opToken.end];
      const span: Span = [left.span[0], right.span[1]];
      left = {
        kind: "binary",
        op: "OR",
        left,
        right,
        opSpan,
        span,
      };
    }

    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();

    while (this.check("KEYWORD_AND")) {
      const opToken = this.advance();
      const right = this.parseNot();
      const opSpan: Span = [opToken.start, opToken.end];
      const span: Span = [left.span[0], right.span[1]];
      left = {
        kind: "binary",
        op: "AND",
        left,
        right,
        opSpan,
        span,
      };
    }

    return left;
  }

  private parseNot(): Expr {
    if (this.check("KEYWORD_NOT")) {
      const opToken = this.advance();
      const operand = this.parseNot();
      const span: Span = [opToken.start, operand.span[1]];
      return {
        kind: "unary",
        op: "NOT",
        operand,
        span,
      };
    }

    return this.parseComparison();
  }

  private parseComparison(): Expr {
    let left = this.parseSum();

    while (
      this.check(
        "EQUALS",
        "NOT_EQUALS",
        "LESS_THAN",
        "GREATER_THAN",
        "LESS_EQUALS",
        "GREATER_EQUALS"
      )
    ) {
      const opToken = this.advance();
      const right = this.parseSum();
      const opMap: Record<string, BinaryOp> = {
        EQUALS: "=",
        NOT_EQUALS: "<>",
        LESS_THAN: "<",
        GREATER_THAN: ">",
        LESS_EQUALS: "<=",
        GREATER_EQUALS: ">=",
      };
      const op = opMap[opToken.kind];
      const opSpan: Span = [opToken.start, opToken.end];
      const span: Span = [left.span[0], right.span[1]];
      left = {
        kind: "binary",
        op,
        left,
        right,
        opSpan,
        span,
      };
    }

    return left;
  }

  private parseSum(): Expr {
    let left = this.parseTerm();

    while (this.check("PLUS", "MINUS")) {
      const opToken = this.advance();
      const right = this.parseTerm();
      const op: BinaryOp = opToken.kind === "PLUS" ? "+" : "-";
      const opSpan: Span = [opToken.start, opToken.end];
      const span: Span = [left.span[0], right.span[1]];
      left = {
        kind: "binary",
        op,
        left,
        right,
        opSpan,
        span,
      };
    }

    return left;
  }

  private parseTerm(): Expr {
    let left = this.parseUnary();

    while (this.check("STAR", "SLASH", "PERCENT")) {
      const opToken = this.advance();
      const right = this.parseUnary();
      const opMap: Record<string, BinaryOp> = {
        STAR: "*",
        SLASH: "/",
        PERCENT: "%",
      };
      const op = opMap[opToken.kind];
      const opSpan: Span = [opToken.start, opToken.end];
      const span: Span = [left.span[0], right.span[1]];
      left = {
        kind: "binary",
        op,
        left,
        right,
        opSpan,
        span,
      };
    }

    return left;
  }

  private parseUnary(): Expr {
    if (this.check("MINUS")) {
      const opToken = this.advance();
      const operand = this.parseUnary();
      const span: Span = [opToken.start, operand.span[1]];
      return {
        kind: "unary",
        op: "-",
        operand,
        span,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const token = this.peek();

    if (this.match("NUMBER")) {
      const val = parseFloat(token.text);
      return {
        kind: "number",
        value: val,
        span: [token.start, token.end],
      };
    }

    if (this.match("STRING")) {
      return {
        kind: "string",
        value: token.text,
        span: [token.start, token.end],
      };
    }

    if (this.match("KEYWORD_TRUE")) {
      return {
        kind: "boolean",
        value: true,
        span: [token.start, token.end],
      };
    }

    if (this.match("KEYWORD_FALSE")) {
      return {
        kind: "boolean",
        value: false,
        span: [token.start, token.end],
      };
    }

    if (this.match("IDENTIFIER")) {
      return {
        kind: "variable",
        name: token.text,
        span: [token.start, token.end],
      };
    }

    if (this.match("LPAREN")) {
      const startSpan = token.start;
      const expr = this.parseExpr();
      if (!this.match("RPAREN")) {
        const next = this.peek();
        throw {
          code: "PARSE_UNEXPECTED_TOKEN",
          params: { found: next.text || "EOF", expected: ")" },
          span: [next.start, next.end],
        };
      }
      const rParen = this.tokens[this.current - 1];
      return {
        ...expr,
        span: [startSpan, rParen.end],
      };
    }

    throw {
      code: "PARSE_UNEXPECTED_TOKEN",
      params: { found: token.text || "EOF", expected: "expression" },
      span: [token.start, token.end],
    };
  }

  /** `expression ("," expression)*` — at least one item, no trailing comma. */
  public parseExprList(): Expr[] {
    const exprs: Expr[] = [this.parseExpr()];

    while (this.match("COMMA")) {
      const afterComma = this.peek();
      if (this.isAtEnd()) {
        throw {
          code: "PARSE_TRAILING_COMMA",
          params: {},
          span: [afterComma.start, afterComma.end],
        };
      }
      if (this.check("COMMA")) {
        throw {
          code: "PARSE_EMPTY_LIST_ITEM",
          params: { index: exprs.length },
          span: [afterComma.start, afterComma.end],
        };
      }
      exprs.push(this.parseExpr());
    }

    return exprs;
  }

  /** `IDENTIFIER ("," IDENTIFIER)*` — used by input blocks. */
  public parseIdentList(): { names: string[]; spans: Span[] } {
    const names: string[] = [];
    const spans: Span[] = [];

    for (;;) {
      const token = this.peek();

      if (this.isAtEnd()) {
        throw {
          code: "PARSE_EXPECTED_IDENTIFIER",
          params: { found: names.length === 0 ? "empty input" : "end of line" },
          span: [token.start, token.end],
        };
      }
      if (token.kind !== "IDENTIFIER") {
        if (isKeyword(token.text)) {
          throw {
            code: "PROCESS_ASSIGN_TO_RESERVED",
            params: { name: token.text },
            span: [token.start, token.end],
          };
        }
        throw {
          code: "PARSE_EXPECTED_IDENTIFIER",
          params: { found: token.text },
          span: [token.start, token.end],
        };
      }

      this.advance();
      names.push(token.text);
      spans.push([token.start, token.end]);

      if (!this.match("COMMA")) break;

      if (this.isAtEnd()) {
        const comma = this.tokens[this.current - 1];
        throw {
          code: "PARSE_TRAILING_COMMA",
          params: {},
          span: [comma.start, comma.end],
        };
      }
    }

    return { names, spans };
  }

  public assertEOF(): void {
    if (!this.isAtEnd()) {
      const currentToken = this.peek();
      const extraText = this.tokens
        .slice(this.current)
        .map((t) => t.text)
        .join(" ");
      throw {
        code: "PARSE_TRAILING_INPUT",
        params: { extraText },
        span: [currentToken.start, this.tokens[this.tokens.length - 1].end],
      };
    }
  }
}

export function parseExpression(src: string): ParseExprResult {
  src = typeof src === "string" ? src : "";
  const trimmed = src.trim();
  if (trimmed === "") {
    return {
      ok: false,
      error: {
        code: "PARSE_UNEXPECTED_TOKEN",
        params: { found: "empty input", expected: "expression" },
        span: [0, 0],
      },
    };
  }

  const lexRes = tokenize(src);
  if (!lexRes.ok) return lexRes;

  try {
    const parser = new Parser(lexRes.tokens);
    const expr = parser.parseExpr();
    parser.assertEOF();
    return { ok: true, expr };
  } catch (err: unknown) {
    return { ok: false, error: err as RunError };
  }
}

export function parseProcess(src: string): ParseProcessResult {
  src = typeof src === "string" ? src : "";
  const trimmed = src.trim();
  if (trimmed === "") {
    return {
      ok: false,
      error: {
        code: "PARSE_UNEXPECTED_TOKEN",
        params: { found: "empty input", expected: "assignment (e.g. x = 1)" },
        span: [0, 0],
      },
    };
  }

  const lexRes = tokenize(src);
  if (!lexRes.ok) return lexRes;

  const tokens = lexRes.tokens;
  if (tokens.length === 0 || tokens[0].kind === "EOF") {
    return {
      ok: false,
      error: {
        code: "PARSE_UNEXPECTED_TOKEN",
        params: { found: "empty input", expected: "identifier" },
        span: [0, 0],
      },
    };
  }

  const first = tokens[0];

  // Check if first token is a reserved keyword
  if (isKeyword(first.text)) {
    return {
      ok: false,
      error: {
        code: "PROCESS_ASSIGN_TO_RESERVED",
        params: { name: first.text },
        span: [first.start, first.end],
      },
    };
  }

  if (first.kind !== "IDENTIFIER") {
    return {
      ok: false,
      error: {
        code: "PARSE_EXPECTED_IDENTIFIER",
        params: { found: first.text },
        span: [first.start, first.end],
      },
    };
  }

  // Check if second token is '='
  if (tokens.length < 2 || tokens[1].kind !== "EQUALS") {
    return {
      ok: false,
      error: {
        code: "PROCESS_MISSING_EQUALS",
        params: { src },
        span: [first.start, tokens[tokens.length - 1].end],
      },
    };
  }

  try {
    const parser = new Parser(tokens);
    // skip target identifier and equals
    parser.parseExpr(); // throwaway to consume target (it will be parsed properly below)
  } catch {
    // ignore
  }

  try {
    const parser = new Parser(tokens.slice(2)); // parse RHS expression starting after '='
    const expr = parser.parseExpr();
    parser.assertEOF();
    return {
      ok: true,
      assignment: {
        target: first.text,
        targetSpan: [first.start, first.end],
        value: expr,
        span: [first.start, expr.span[1]],
      },
    };
  } catch (err: unknown) {
    return { ok: false, error: err as RunError };
  }
}

export function parseIdentifier(src: string): ParseIdentResult {
  src = typeof src === "string" ? src : "";
  const trimmed = src.trim();
  if (trimmed === "") {
    return {
      ok: false,
      error: {
        code: "PARSE_EXPECTED_IDENTIFIER",
        params: { found: "empty input" },
        span: [0, 0],
      },
    };
  }

  const lexRes = tokenize(src);
  if (!lexRes.ok) return lexRes;

  const tokens = lexRes.tokens;
  if (tokens.length === 0 || tokens[0].kind === "EOF") {
    return {
      ok: false,
      error: {
        code: "PARSE_EXPECTED_IDENTIFIER",
        params: { found: "empty input" },
        span: [0, 0],
      },
    };
  }

  const first = tokens[0];

  if (isKeyword(first.text)) {
    return {
      ok: false,
      error: {
        code: "PROCESS_ASSIGN_TO_RESERVED",
        params: { name: first.text },
        span: [first.start, first.end],
      },
    };
  }

  if (first.kind !== "IDENTIFIER") {
    return {
      ok: false,
      error: {
        code: "PARSE_EXPECTED_IDENTIFIER",
        params: { found: first.text },
        span: [first.start, first.end],
      },
    };
  }

  if (tokens.length > 2 || (tokens.length === 2 && tokens[1].kind !== "EOF")) {
    const extraText = tokens
      .slice(1)
      .map((t) => t.text)
      .join(" ");
    return {
      ok: false,
      error: {
        code: "PARSE_TRAILING_INPUT",
        params: { extraText },
        span: [tokens[1].start, tokens[tokens.length - 1].end],
      },
    };
  }

  return { ok: true, name: first.text };
}

/**
 * Output blocks take a comma-separated list of values. Each item is formatted
 * and the results are joined, so `"Total: ", total` prints `Total: 55`.
 */
export function parseOutputList(src: string): ParseOutputListResult {
  src = typeof src === "string" ? src : "";
  if (src.trim() === "") {
    return {
      ok: false,
      error: { code: "OUTPUT_EMPTY", params: {}, span: [0, 0] },
    };
  }

  const lexRes = tokenize(src);
  if (!lexRes.ok) return lexRes;

  try {
    const parser = new Parser(lexRes.tokens);
    const exprs = parser.parseExprList();
    parser.assertEOF();
    return { ok: true, exprs };
  } catch (err: unknown) {
    return { ok: false, error: err as RunError };
  }
}

/** Input blocks take one or more variable names: `age, score`. */
export function parseIdentifierList(src: string): ParseIdentListResult {
  src = typeof src === "string" ? src : "";
  if (src.trim() === "") {
    return {
      ok: false,
      error: {
        code: "PARSE_EXPECTED_IDENTIFIER",
        params: { found: "empty input" },
        span: [0, 0],
      },
    };
  }

  const lexRes = tokenize(src);
  if (!lexRes.ok) return lexRes;

  try {
    const parser = new Parser(lexRes.tokens);
    const { names, spans } = parser.parseIdentList();
    parser.assertEOF();
    return { ok: true, names, spans };
  } catch (err: unknown) {
    return { ok: false, error: err as RunError };
  }
}
