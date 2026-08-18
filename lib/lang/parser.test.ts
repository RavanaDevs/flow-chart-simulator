import { describe, it, expect } from "vitest";
import { parseExpression, parseProcess, parseIdentifier } from "./parser";

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
