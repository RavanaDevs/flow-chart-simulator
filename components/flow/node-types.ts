import { StartNode } from "./nodes/start-node";
import { StopNode } from "./nodes/stop-node";
import { InputNode } from "./nodes/input-node";
import { OutputNode } from "./nodes/output-node";
import { ProcessNode } from "./nodes/process-node";
import { IfNode } from "./nodes/if-node";
import { ConnectorNode } from "./nodes/connector-node";
import { FlowEdge } from "./edges/flow-edge";

export const nodeTypes = {
  start: StartNode,
  stop: StopNode,
  input: InputNode,
  output: OutputNode,
  process: ProcessNode,
  if: IfNode,
  connector: ConnectorNode,
};

export const edgeTypes = {
  default: FlowEdge,
  smoothstep: FlowEdge,
};
