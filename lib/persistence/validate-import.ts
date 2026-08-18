import { FlowDocument } from "./document";
import { FlowNode, FlowEdge, NodeKind } from "../graph/types";

const VALID_KINDS: Set<NodeKind> = new Set([
  "start",
  "stop",
  "input",
  "output",
  "process",
  "if",
]);

export function validateImport(
  obj: unknown
): { ok: true; doc: FlowDocument } | { ok: false; error: string } {
  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "Root document must be an object." };
  }

  const record = obj as Record<string, unknown>;

  if (record.version !== 1) {
    return { ok: false, error: "Unsupported document version. Expected version 1." };
  }

  if (!Array.isArray(record.nodes)) {
    return { ok: false, error: "Document must contain a 'nodes' array." };
  }

  if (!Array.isArray(record.edges)) {
    return { ok: false, error: "Document must contain an 'edges' array." };
  }

  const nodes: FlowNode[] = [];
  for (let i = 0; i < record.nodes.length; i++) {
    const n = record.nodes[i];
    if (!n || typeof n !== "object") {
      return { ok: false, error: `Node at index ${i} is invalid.` };
    }
    const nodeObj = n as Record<string, unknown>;
    if (typeof nodeObj.id !== "string" || !nodeObj.id) {
      return { ok: false, error: `Node at index ${i} missing valid 'id'.` };
    }
    if (!VALID_KINDS.has(nodeObj.kind as NodeKind)) {
      return { ok: false, error: `Node ${nodeObj.id} has unknown kind '${nodeObj.kind}'.` };
    }
    if (
      !nodeObj.position ||
      typeof nodeObj.position !== "object" ||
      typeof (nodeObj.position as Record<string, unknown>).x !== "number" ||
      typeof (nodeObj.position as Record<string, unknown>).y !== "number"
    ) {
      return { ok: false, error: `Node ${nodeObj.id} missing valid position.` };
    }
    nodes.push({
      id: nodeObj.id as string,
      kind: nodeObj.kind as NodeKind,
      position: {
        x: (nodeObj.position as { x: number }).x,
        y: (nodeObj.position as { y: number }).y,
      },
      data: (nodeObj.data as Record<string, unknown>) ?? {},
    } as FlowNode);
  }

  const edges: FlowEdge[] = [];
  for (let i = 0; i < record.edges.length; i++) {
    const e = record.edges[i];
    if (!e || typeof e !== "object") {
      return { ok: false, error: `Edge at index ${i} is invalid.` };
    }
    const edgeObj = e as Record<string, unknown>;
    if (typeof edgeObj.id !== "string" || typeof edgeObj.source !== "string" || typeof edgeObj.target !== "string") {
      return { ok: false, error: `Edge at index ${i} missing id, source, or target.` };
    }
    const sourceHandle =
      edgeObj.sourceHandle === "true" || edgeObj.sourceHandle === "false"
        ? edgeObj.sourceHandle
        : null;

    edges.push({
      id: edgeObj.id,
      source: edgeObj.source,
      target: edgeObj.target,
      sourceHandle,
    });
  }

  return {
    ok: true,
    doc: {
      version: 1,
      nodes,
      edges,
    },
  };
}
