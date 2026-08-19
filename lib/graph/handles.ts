import { NodeKind } from "./types";

/**
 * A physical port is not the same thing as a logical branch.
 *
 * Every block exposes ports on all four sides so a loop's back-edge can leave
 * sideways instead of diving under the whole loop body. A decision block's
 * false branch is reachable from either side. Several physical ports can
 * therefore feed one logical branch, and the rule that keeps execution
 * deterministic — at most one outgoing edge per branch — is enforced on the
 * branch, never on the port.
 */
export type PortId =
  | "port-top"
  | "port-right"
  | "port-bottom"
  | "port-left"
  | "true-bottom"
  | "false-left"
  | "false-right";

export type Branch = "true" | "false";

/** Ports a block can be entered through. */
export const TARGET_PORTS: Record<NodeKind, PortId[]> = {
  start: [],
  stop: ["port-top", "port-right", "port-bottom", "port-left"],
  input: ["port-top", "port-right", "port-bottom", "port-left"],
  output: ["port-top", "port-right", "port-bottom", "port-left"],
  process: ["port-top", "port-right", "port-bottom", "port-left"],
  if: ["port-top", "port-right", "port-bottom", "port-left"],
  connector: ["port-top", "port-right", "port-bottom", "port-left"],
};

/** Ports a block can be left through. */
export const SOURCE_PORTS: Record<NodeKind, PortId[]> = {
  start: ["port-top", "port-right", "port-bottom", "port-left"],
  stop: [],
  input: ["port-top", "port-right", "port-bottom", "port-left"],
  output: ["port-top", "port-right", "port-bottom", "port-left"],
  process: ["port-top", "port-right", "port-bottom", "port-left"],
  if: ["true-bottom", "false-left", "false-right"],
  connector: ["port-top", "port-right", "port-bottom", "port-left"],
};

/**
 * Which logical branch a physical source port feeds.
 * `null` means the block's single output.
 */
export function branchOf(handle: string | null | undefined): Branch | null {
  if (handle === "true-bottom") return "true";
  if (handle === "false-left" || handle === "false-right") return "false";
  return null;
}

/** True when this block chooses between two branches rather than having one exit. */
export function isBranching(kind: NodeKind): boolean {
  return kind === "if";
}

/** Blocks that may never be entered. */
export function acceptsInbound(kind: NodeKind): boolean {
  return kind !== "start";
}

/** Blocks that may never be left. */
export function allowsOutbound(kind: NodeKind): boolean {
  return kind !== "stop";
}
