import { Expr } from "./ast";
import { Value, typeOf, formatValue } from "./values";
import { RunError } from "../errors/codes";
import { suggestNearestVariable } from "../errors/suggest";

export type EvalResult =
  | { ok: true; value: Value }
  | { ok: false; error: RunError };

export function evaluate(
  expr: Expr,
  vars: Readonly<Record<string, Value>>
): EvalResult {
  switch (expr.kind) {
    case "number":
    case "string":
    case "boolean":
      return { ok: true, value: expr.value };

    case "variable": {
      if (Object.prototype.hasOwnProperty.call(vars, expr.name)) {
        return { ok: true, value: vars[expr.name] };
      }
      const suggestion = suggestNearestVariable(
        expr.name,
        Object.keys(vars)
      );
      return {
        ok: false,
        error: {
          code: "UNKNOWN_VARIABLE",
          params: { name: expr.name, suggestion },
          span: expr.span,
        },
      };
    }

    case "unary": {
      const res = evaluate(expr.operand, vars);
      if (!res.ok) return res;

      if (expr.op === "-") {
        if (typeof res.value !== "number") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: {
                op: "-",
                leftType: typeOf(res.value),
                rightType: "number",
              },
              span: expr.span,
            },
          };
        }
        return { ok: true, value: -res.value };
      }

      if (expr.op === "NOT") {
        if (typeof res.value !== "boolean") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: {
                op: "NOT",
                leftType: typeOf(res.value),
                rightType: "yes/no",
              },
              span: expr.span,
            },
          };
        }
        return { ok: true, value: !res.value };
      }

      return {
        ok: false,
        error: {
          code: "TYPE_MISMATCH",
          params: {
            op: expr.op,
            leftType: typeOf(res.value),
            rightType: "unknown",
          },
          span: expr.span,
        },
      };
    }

    case "binary": {
      // Short-circuit logical operators
      if (expr.op === "AND") {
        const leftRes = evaluate(expr.left, vars);
        if (!leftRes.ok) return leftRes;
        if (typeof leftRes.value !== "boolean") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: {
                op: "AND",
                leftType: typeOf(leftRes.value),
                rightType: "yes/no",
              },
              span: expr.opSpan,
            },
          };
        }
        if (!leftRes.value) {
          return { ok: true, value: false };
        }
        const rightRes = evaluate(expr.right, vars);
        if (!rightRes.ok) return rightRes;
        if (typeof rightRes.value !== "boolean") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: {
                op: "AND",
                leftType: "yes/no",
                rightType: typeOf(rightRes.value),
              },
              span: expr.opSpan,
            },
          };
        }
        return { ok: true, value: rightRes.value };
      }

      if (expr.op === "OR") {
        const leftRes = evaluate(expr.left, vars);
        if (!leftRes.ok) return leftRes;
        if (typeof leftRes.value !== "boolean") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: {
                op: "OR",
                leftType: typeOf(leftRes.value),
                rightType: "yes/no",
              },
              span: expr.opSpan,
            },
          };
        }
        if (leftRes.value) {
          return { ok: true, value: true };
        }
        const rightRes = evaluate(expr.right, vars);
        if (!rightRes.ok) return rightRes;
        if (typeof rightRes.value !== "boolean") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: {
                op: "OR",
                leftType: "yes/no",
                rightType: typeOf(rightRes.value),
              },
              span: expr.opSpan,
            },
          };
        }
        return { ok: true, value: rightRes.value };
      }

      const leftRes = evaluate(expr.left, vars);
      if (!leftRes.ok) return leftRes;

      const rightRes = evaluate(expr.right, vars);
      if (!rightRes.ok) return rightRes;

      const lVal = leftRes.value;
      const rVal = rightRes.value;
      const lType = typeOf(lVal);
      const rType = typeOf(rVal);

      // Overloaded '+' (String concatenation if either is string)
      if (expr.op === "+") {
        if (typeof lVal === "string" || typeof rVal === "string") {
          return {
            ok: true,
            value: formatValue(lVal) + formatValue(rVal),
          };
        }
        if (typeof lVal === "number" && typeof rVal === "number") {
          return { ok: true, value: lVal + rVal };
        }
        return {
          ok: false,
          error: {
            code: "TYPE_MISMATCH",
            params: { op: "+", leftType: lType, rightType: rType },
            span: expr.opSpan,
          },
        };
      }

      // Arithmetic: -, *, /, %
      if (["-", "*", "/", "%"].includes(expr.op)) {
        if (typeof lVal !== "number" || typeof rVal !== "number") {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: { op: expr.op, leftType: lType, rightType: rType },
              span: expr.opSpan,
            },
          };
        }

        if ((expr.op === "/" || expr.op === "%") && rVal === 0) {
          return {
            ok: false,
            error: {
              code: "DIVIDE_BY_ZERO",
              params: { op: expr.op as "/" | "%" },
              span: expr.opSpan,
            },
          };
        }

        if (expr.op === "-") return { ok: true, value: lVal - rVal };
        if (expr.op === "*") return { ok: true, value: lVal * rVal };
        if (expr.op === "/") return { ok: true, value: lVal / rVal };
        if (expr.op === "%") return { ok: true, value: lVal % rVal };
      }

      // Equality: =, <>
      if (expr.op === "=" || expr.op === "<>") {
        if (lType !== rType) {
          return {
            ok: false,
            error: {
              code: "TYPE_MISMATCH",
              params: { op: expr.op, leftType: lType, rightType: rType },
              span: expr.opSpan,
            },
          };
        }
        const equals = lVal === rVal;
        return { ok: true, value: expr.op === "=" ? equals : !equals };
      }

      // Ordering: <, >, <=, >=
      if (["<", ">", "<=", ">="].includes(expr.op)) {
        if (
          (typeof lVal === "number" && typeof rVal === "number") ||
          (typeof lVal === "string" && typeof rVal === "string")
        ) {
          let cmp = false;
          if (expr.op === "<") cmp = lVal < rVal;
          if (expr.op === ">") cmp = lVal > rVal;
          if (expr.op === "<=") cmp = lVal <= rVal;
          if (expr.op === ">=") cmp = lVal >= rVal;
          return { ok: true, value: cmp };
        }
        return {
          ok: false,
          error: {
            code: "TYPE_MISMATCH",
            params: { op: expr.op, leftType: lType, rightType: rType },
            span: expr.opSpan,
          },
        };
      }

      return {
        ok: false,
        error: {
          code: "TYPE_MISMATCH",
          params: { op: expr.op, leftType: lType, rightType: rType },
          span: expr.opSpan,
        },
      };
    }
  }
}
