import { NodeId, EdgeId, InputValueType } from "./types";
import { Expr, Assignment } from "../lang/ast";
import { Diagnostic } from "../errors/diagnostic";

export type CompiledNode =
  | { kind: "start"; id: NodeId; next: NodeId; nextEdgeId: EdgeId }
  | { kind: "stop"; id: NodeId }
  /** Merge junction: several paths in, one path out. Carries no logic. */
  | { kind: "connector"; id: NodeId; next: NodeId; nextEdgeId: EdgeId }
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
      /** One printed line per entry; values within a line are joined. */
      lines: Expr[][];
      next: NodeId;
      nextEdgeId: EdgeId;
    }
  | {
      kind: "process";
      id: NodeId;
      /** One assignment per line, executed top to bottom. */
      assignments: Assignment[];
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
