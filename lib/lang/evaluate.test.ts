import { describe, it, expect } from "vitest";
import { parseExpression } from "./parser";
import { evaluate } from "./evaluate";

describe("evaluate", () => {
  it("evaluates simple arithmetic", () => {
    const parsed = parseExpression("2 + 3 * 4");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const res = evaluate(parsed.expr, {});
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(14);
  });

  it("handles string concatenation with +", () => {
    const parsed = parseExpression(`"Total: " + 55`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const res = evaluate(parsed.expr, {});
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe("Total: 55");
  });

  it("suggests nearest variable on UNKNOWN_VARIABLE_DID_YOU_MEAN", () => {
    const parsed = parseExpression("totl + 1");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const res = evaluate(parsed.expr, { total: 10 });
    expect(res.ok).toBe(false);
    if (!res.ok && res.error.code === "UNKNOWN_VARIABLE_DID_YOU_MEAN") {
      expect(res.error.params.suggestion).toBe("total");
    }
  });

  it("raises DIVIDE_BY_ZERO on division by 0", () => {
    const parsed = parseExpression("10 / 0");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const res = evaluate(parsed.expr, {});
    expect(res.ok).toBe(false);
    if (!res.ok && res.error.code === "DIVIDE_BY_ZERO") {
      expect(res.error.params.op).toBe("/");
    }
  });

  it("raises TYPE_MISMATCH on string subtraction", () => {
    const parsed = parseExpression(`"cat" - 1`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const res = evaluate(parsed.expr, {});
    expect(res.ok).toBe(false);
    if (!res.ok && res.error.code === "TYPE_MISMATCH") {
      expect(res.error.params.op).toBe("-");
    }
  });
});
