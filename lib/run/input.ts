import { Program } from "../graph/program";
import { RunState, TerminalLine } from "./state";
import { Value } from "../lang/values";
import { appendTerminal } from "./terminal";

/**
 * Supplies the value the student typed for the name currently being asked
 * for. An input block may hold several names; each submission fills one and
 * either asks for the next or releases execution to the following block.
 */
export function provideInput(
  program: Program,
  state: RunState,
  raw: string
): RunState {
  if (state.status !== "awaiting-input" || !state.pendingInput) {
    return state;
  }

  const { nodeId, varName, type, index, total } = state.pendingInput;

  const currNode = program.nodes[nodeId];
  if (!currNode || currNode.kind !== "input") {
    return state;
  }

  let parsedValue: Value;

  if (type === "number") {
    const trimmed = raw.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      // A typo re-asks for the same name rather than killing the program.
      const errLine: TerminalLine = {
        kind: "error",
        error: {
          code: "INPUT_NOT_A_NUMBER",
          params: { text: raw },
          nodeId,
        },
      };
      const { lines, truncated } = appendTerminal(state.terminal, errLine);
      return {
        ...state,
        terminal: lines,
        terminalTruncated: state.terminalTruncated || truncated,
      };
    }
    parsedValue = parseFloat(trimmed);
  } else {
    parsedValue = raw;
  }

  const variables = { ...state.variables, [varName]: parsedValue };
  const echoLine: TerminalLine = { kind: "echo", text: raw };

  // More names left in this block: ask for the next one, stay paused.
  if (index + 1 < total) {
    const nextName = currNode.varNames[index + 1];
    const nextPrompt: TerminalLine = {
      kind: "prompt",
      varName: nextName,
      valueType: type,
    };
    const { lines, truncated } = appendTerminal(
      state.terminal,
      echoLine,
      nextPrompt
    );
    return {
      ...state,
      variables,
      terminal: lines,
      terminalTruncated: state.terminalTruncated || truncated,
      pendingInput: { nodeId, varName: nextName, type, index: index + 1, total },
    };
  }

  const { lines, truncated } = appendTerminal(state.terminal, echoLine);
  return {
    ...state,
    status: "running",
    pendingInput: null,
    variables,
    terminal: lines,
    terminalTruncated: state.terminalTruncated || truncated,
    currentNodeId: currNode.next,
    lastEdgeId: currNode.nextEdgeId,
  };
}
