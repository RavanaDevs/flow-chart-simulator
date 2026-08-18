export type NodeId = string;
export type EdgeId = string;

export type NodeKind =
  | "start"
  | "stop"
  | "input"
  | "output"
  | "process"
  | "if";

export type InputValueType = "number" | "text";

export type FlowNode =
  | BaseNode<"start", Record<string, never>>
  | BaseNode<"stop", Record<string, never>>
  | BaseNode<"input", { varName: string; valueType: InputValueType }>
  | BaseNode<"output", { source: string }>
  | BaseNode<"process", { source: string }>
  | BaseNode<"if", { source: string }>;

type BaseNode<K extends NodeKind, D> = {
  id: NodeId;
  kind: K;
  position: { x: number; y: number };
  data: D;
};

export type BranchHandle = "true" | "false";

export type FlowEdge = {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  sourceHandle: BranchHandle | null;
};

export type FlowGraph = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};
