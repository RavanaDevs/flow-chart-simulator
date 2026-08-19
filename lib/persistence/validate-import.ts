import { FlowDocument, DOCUMENT_VERSION } from "./document";
import { FlowNode, FlowEdge, NodeKind } from "../graph/types";
import { migrateEdge, migrateNodeData } from "./migrate";

const VALID_KINDS: Set<NodeKind> = new Set([
  "start",
  "stop",
  "input",
  "output",
  "process",
  "if",
  "connector",
]);

export function validateImport(
  obj: unknown
): { ok: true; doc: FlowDocument } | { ok: false; error: string } {
  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "Root document must be an object." };
  }

  const record = obj as Record<string, unknown>;

  // Older documents are migrated on read; newer ones cannot be understood by
  // this build and must be refused rather than half-loaded.
  const version = typeof record.version === "number" ? record.version : 0;
  if (version < 1 || version > DOCUMENT_VERSION) {
    return {
      ok: false,
      error: `Unsupported document version ${String(record.version)}. This app understands versions 1 to ${DOCUMENT_VERSION}.`,
    };
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
    const data = migrateNodeData(
      nodeObj.kind as NodeKind,
      (nodeObj.data as Record<string, unknown>) ?? {}
    );

    nodes.push({
      id: nodeObj.id as string,
      kind: nodeObj.kind as NodeKind,
      position: {
        x: (nodeObj.position as { x: number }).x,
        y: (nodeObj.position as { y: number }).y,
      },
      data,
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
    const { sourceHandle, targetHandle } = migrateEdge(edgeObj);

    edges.push({
      id: edgeObj.id,
      source: edgeObj.source,
      target: edgeObj.target,
      sourceHandle,
      targetHandle,
    });
  }

  return {
    ok: true,
    doc: {
      version: DOCUMENT_VERSION,
      nodes,
      edges,
    },
  };
}
