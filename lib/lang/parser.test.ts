import { describe, it, expect } from "vitest";
import {
  parseExpression,
  parseProcess,
  parseIdentifier,
  parseOutputList,
  parseIdentifierList,
} from "./parser";

describe("parseExpression", () => {
  it("parses precedence correctly (2 + 3 * 4)", () => {
    const res = parseExpression("2 + 3 * 4");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.expr.kind).toBe("binary");
    if (res.expr.kind === "binary") {
      expect(res.expr.op).toBe("+");
      expect(res.expr.right.kind).toBe("binary");
      if (res.expr.right.kind === "binary") {
        expect(res.expr.right.op).toBe("*");
      }
    }
  });

  it("parses NOT looser than comparison (NOT a = b)", () => {
    const res = parseExpression("NOT a = b");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.expr.kind).toBe("unary");
    if (res.expr.kind === "unary") {
      expect(res.expr.op).toBe("NOT");
      expect(res.expr.operand.kind).toBe("binary");
      if (res.expr.operand.kind === "binary") {
        expect(res.expr.operand.op).toBe("=");
      }
    }
  });

  it("fails on unclosed parentheses", () => {
    const res = parseExpression("(2 + 3");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("PARSE_UNEXPECTED_TOKEN");
  });
});

describe("parseProcess", () => {
  it("parses valid assignment x = x + 1", () => {
    const res = parseProcess("x = x + 1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.assignment.target).toBe("x");
    expect(res.assignment.value.kind).toBe("binary");
  });

  it("fails missing equals (count + 1)", () => {
    const res = parseProcess("count + 1");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("PROCESS_MISSING_EQUALS");
  });

  it("fails reserved word assignment (AND = 5)", () => {
    const res = parseProcess("AND = 5");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("PROCESS_ASSIGN_TO_RESERVED");
  });
});

describe("parseIdentifier", () => {
  it("parses valid identifier varName", () => {
    const res = parseIdentifier("totalAmount");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.name).toBe("totalAmount");
  });

  it("rejects trailing input", () => {
    const res = parseIdentifier("x y");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("PARSE_TRAILING_INPUT");
  });
});

describe("parseOutputList", () => {
  it("parses a single value", () => {
    const res = parseOutputList("total");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.exprs).toHaveLength(1);
  });

  it("parses text and variables mixed", () => {
    const res = parseOutputList(`"Total: ", total, "!"`);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.exprs).toHaveLength(3);
      expect(res.exprs[0].kind).toBe("string");
      expect(res.exprs[1].kind).toBe("variable");
    }
  });

  it("rejects a trailing comma", () => {
    const res = parseOutputList("a, b,");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("PARSE_TRAILING_COMMA");
  });

  it("rejects two commas in a row", () => {
    const res = parseOutputList("a,, b");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("PARSE_EMPTY_LIST_ITEM");
  });

  it("rejects an empty block", () => {
    const res = parseOutputList("   ");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("OUTPUT_EMPTY");
  });
});

describe("parseIdentifierList", () => {
  it("parses several names", () => {
    const res = parseIdentifierList("age, score , name");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.names).toEqual(["age", "score", "name"]);
  });

  it("rejects a reserved word", () => {
    const res = parseIdentifierList("age, AND");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("PROCESS_ASSIGN_TO_RESERVED");
  });

  it("rejects a trailing comma", () => {
    const res = parseIdentifierList("age,");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("PARSE_TRAILING_COMMA");
  });
});

describe("missing block text", () => {
  it("reports a parse error instead of throwing when a block has no text", () => {
    const missing = undefined as unknown as string;
    expect(() => parseExpression(missing)).not.toThrow();
    expect(() => parseProcess(missing)).not.toThrow();
    expect(() => parseOutputList(missing)).not.toThrow();
    expect(() => parseIdentifierList(missing)).not.toThrow();
    expect(parseOutputList(missing).ok).toBe(false);
  });
});
