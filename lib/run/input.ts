import { Program } from "../graph/program";
import { RunState, TerminalLine } from "./state";
import { Value } from "../lang/values";

export function provideInput(
  program: Program,
  state: RunState,
  raw: string
): RunState {
  if (state.status !== "awaiting-input" || !state.pendingInput) {
    return state;
  }

  const { nodeId, varName, type } = state.pendingInput;
  let parsedValue: Value;

  if (type === "number") {
    const trimmed = raw.trim();
    const isNum = /^-?\d+(\.\d+)?$/.test(trimmed);
    if (!isNum) {
      const errLine: TerminalLine = {
        kind: "error",
        error: {
          code: "INPUT_NOT_A_NUMBER",
          params: { text: raw },
          nodeId,
        },
      };
      return {
        ...state,
        terminal: [...state.terminal, errLine],
      };
    }
    parsedValue = parseFloat(trimmed);
  } else {
    parsedValue = raw;
  }

  const currNode = program.nodes[nodeId];
  if (!currNode || currNode.kind !== "input") {
    return state;
  }

  const echoLine: TerminalLine = { kind: "echo", text: raw };

  return {
    ...state,
    status: "running",
    pendingInput: null,
    variables: {
      ...state.variables,
      [varName]: parsedValue,
    },
    terminal: [...state.terminal, echoLine],
    currentNodeId: currNode.next,
    lastEdgeId: currNode.nextEdgeId,
  };
}
