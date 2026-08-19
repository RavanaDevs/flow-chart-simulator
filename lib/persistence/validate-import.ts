import { FlowDocument, DOCUMENT_VERSION } from "./document";
import { FlowNode, FlowEdge, NodeKind } from "../graph/types";
import { migrateEdge, migrateNodeData } from "./migrate";
import { RunError } from "../errors/codes";

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
): { ok: true; doc: FlowDocument } | { ok: false; error: RunError } {
  if (!obj || typeof obj !== "object") {
    return { ok: false, error: { code: "IMPORT_NOT_AN_OBJECT", params: {} } };
  }

  const record = obj as Record<string, unknown>;

  // Older documents are migrated on read; newer ones cannot be understood by
  // this build and must be refused rather than half-loaded.
  const version = typeof record.version === "number" ? record.version : 0;
  if (version < 1 || version > DOCUMENT_VERSION) {
    return {
      ok: false,
      error: {
        code: "IMPORT_UNSUPPORTED_VERSION",
        params: {
          version: String(record.version),
          maxVersion: DOCUMENT_VERSION,
        },
      },
    };
  }

  if (!Array.isArray(record.nodes)) {
    return { ok: false, error: { code: "IMPORT_BAD_NODES_ARRAY", params: {} } };
  }

  if (!Array.isArray(record.edges)) {
    return { ok: false, error: { code: "IMPORT_BAD_EDGES_ARRAY", params: {} } };
  }

  const nodes: FlowNode[] = [];
  for (let i = 0; i < record.nodes.length; i++) {
    const n = record.nodes[i];
    if (!n || typeof n !== "object") {
      return { ok: false, error: { code: "IMPORT_BAD_NODE", params: { index: i } } };
    }
    const nodeObj = n as Record<string, unknown>;
    if (typeof nodeObj.id !== "string" || !nodeObj.id) {
      return { ok: false, error: { code: "IMPORT_BAD_NODE_ID", params: { index: i } } };
    }
    if (!VALID_KINDS.has(nodeObj.kind as NodeKind)) {
      return {
        ok: false,
        error: {
          code: "IMPORT_UNKNOWN_KIND",
          params: { id: nodeObj.id, kind: String(nodeObj.kind) },
        },
      };
    }
    if (
      !nodeObj.position ||
      typeof nodeObj.position !== "object" ||
      typeof (nodeObj.position as Record<string, unknown>).x !== "number" ||
      typeof (nodeObj.position as Record<string, unknown>).y !== "number"
    ) {
      return { ok: false, error: { code: "IMPORT_BAD_POSITION", params: { id: nodeObj.id } } };
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
      return { ok: false, error: { code: "IMPORT_BAD_EDGE", params: { index: i } } };
    }
    const edgeObj = e as Record<string, unknown>;
    if (typeof edgeObj.id !== "string" || typeof edgeObj.source !== "string" || typeof edgeObj.target !== "string") {
      return { ok: false, error: { code: "IMPORT_BAD_EDGE_IDS", params: { index: i } } };
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
