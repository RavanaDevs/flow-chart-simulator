import { NodeId, EdgeId, InputValueType } from "../graph/types";
import { Value } from "../lang/values";
import { RunError } from "../errors/codes";

export type SystemCode =
  | "PROGRAM_FINISHED"
  | "PROGRAM_RESET"
  | "EDIT_DURING_RUN"
  | "OUTPUT_TRUNCATED";

export type TerminalLine =
  | { kind: "output"; text: string; nodeId: NodeId }
  | { kind: "prompt"; varName: string; valueType: InputValueType }
  | { kind: "echo"; text: string }
  | { kind: "error"; error: RunError }
  | { kind: "system"; code: SystemCode };

export type RunState = {
  status: "idle" | "running" | "awaiting-input" | "finished" | "error";
  currentNodeId: NodeId | null;
  lastEdgeId: EdgeId | null;
  variables: Readonly<Record<string, Value>>;
  terminal: readonly TerminalLine[];
  pendingInput: {
    nodeId: NodeId;
    /** The name being asked for right now. */
    varName: string;
    type: InputValueType;
    /** Position within this block's name list, and how many there are. */
    index: number;
    total: number;
  } | null;
  error: RunError | null;
  inputError: RunError | null;
  stepCount: number;
  recentNodeIds: readonly NodeId[];
  terminalTruncated: boolean;
};

export function initialState(): RunState {
  return {
    status: "idle",
    currentNodeId: null,
    lastEdgeId: null,
    variables: {},
    terminal: [],
    pendingInput: null,
    error: null,
    inputError: null,
    stepCount: 0,
    recentNodeIds: [],
    terminalTruncated: false,
  };
}
