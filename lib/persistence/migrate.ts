import { FlowEdge, FlowNode } from "../graph/types";

/**
 * Brings older saved documents up to the current shape.
 *
 * Students have autosaved work sitting in localStorage from every earlier
 * version, so a document that cannot be migrated must fail loudly rather than
 * load half-populated.
 *
 * v1 -> v2
 *   - edges gained `targetHandle`; blocks used to have a single inlet on top
 *   - `sourceHandle` moved from a logical branch name to a physical port id
 *   - input blocks moved from a single `varName` to a `names` list
 */
export function migrateEdge(raw: Record<string, unknown>): Pick<
  FlowEdge,
  "sourceHandle" | "targetHandle"
> {
  const source = raw.sourceHandle;

  let sourceHandle: string | null;
  if (source === "true") {
    sourceHandle = "true-bottom";
  } else if (source === "false") {
    // Where the false branch used to render, so existing layouts do not move.
    sourceHandle = "false-right";
  } else if (typeof source === "string" && source.length > 0) {
    sourceHandle = source;
  } else {
    sourceHandle = "port-bottom";
  }

  const target = raw.targetHandle;
  const targetHandle =
    typeof target === "string" && target.length > 0 ? target : "port-top";

  return { sourceHandle, targetHandle };
}

export function migrateNodeData(
  kind: FlowNode["kind"],
  data: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...data };

  // Input blocks now hold a comma-separated list of names.
  if (kind === "input" && next.names === undefined) {
    next.names = typeof next.varName === "string" ? next.varName : "x";
    delete next.varName;
  }

  return next;
}
