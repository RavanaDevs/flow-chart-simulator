import { Span } from "./tokens";

export type UnaryOp = "-" | "NOT";

export type BinaryOp =
  | "OR"
  | "AND"
  | "="
  | "<>"
  | "<"
  | ">"
  | "<="
  | ">="
  | "+"
  | "-"
  | "*"
  | "/"
  | "%";

export type Expr =
  | { kind: "number"; value: number; span: Span }
  | { kind: "string"; value: string; span: Span }
  | { kind: "boolean"; value: boolean; span: Span }
  | { kind: "variable"; name: string; span: Span }
  | { kind: "unary"; op: UnaryOp; operand: Expr; span: Span }
  | {
      kind: "binary";
      op: BinaryOp;
      left: Expr;
      right: Expr;
      opSpan: Span;
      span: Span;
    };

export type Assignment = {
  target: string;
  targetSpan: Span;
  value: Expr;
  span: Span;
};
