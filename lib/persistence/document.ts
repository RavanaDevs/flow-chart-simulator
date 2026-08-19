import { FlowNode, FlowEdge } from "../graph/types";
import { validateImport } from "./validate-import";

export const DOCUMENT_VERSION = 2;

export type FlowDocument = {
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export function exportDocument(nodes: FlowNode[], edges: FlowEdge[]): string {
  // Clean nodes by omitting ReactFlow internal runtime properties
  const cleanNodes: FlowNode[] = nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    data: n.data,
  })) as FlowNode[];

  const cleanEdges: FlowEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
  }));

  const doc: FlowDocument = {
    version: DOCUMENT_VERSION,
    nodes: cleanNodes,
    edges: cleanEdges,
  };

  return JSON.stringify(doc, null, 2);
}

export function importDocument(
  jsonStr: string
): { ok: true; doc: FlowDocument } | { ok: false; error: string } {
  try {
    const raw = JSON.parse(jsonStr);
    return validateImport(raw);
  } catch (err) {
    return { ok: false, error: `Invalid JSON format: ${String(err)}` };
  }
}
