import { NodeId, EdgeId, InputValueType } from "./types";
import { Expr } from "../lang/ast";
import { Diagnostic } from "../errors/diagnostic";

export type CompiledNode =
  | { kind: "start"; id: NodeId; next: NodeId; nextEdgeId: EdgeId }
  | { kind: "stop"; id: NodeId }
  | {
      kind: "input";
      id: NodeId;
      /** One or more names; the block prompts for each in turn. */
      varNames: string[];
      valueType: InputValueType;
      next: NodeId;
      nextEdgeId: EdgeId;
    }
  | {
      kind: "output";
      id: NodeId;
      /** Comma-separated values; formatted then joined. */
      exprs: Expr[];
      next: NodeId;
      nextEdgeId: EdgeId;
    }
  | {
      kind: "process";
      id: NodeId;
      target: string;
      expr: Expr;
      next: NodeId;
      nextEdgeId: EdgeId;
    }
  | {
      kind: "if";
      id: NodeId;
      cond: Expr;
      whenTrue: NodeId;
      trueEdgeId: EdgeId;
      whenFalse: NodeId;
      falseEdgeId: EdgeId;
    };

export type Program = {
  entryId: NodeId;
  nodes: Readonly<Record<NodeId, CompiledNode>>;
  order: readonly NodeId[];
  warnings: readonly Diagnostic[];
};

export type CompileResult =
  | { ok: true; program: Program }
  | { ok: false; diagnostics: Diagnostic[] };
