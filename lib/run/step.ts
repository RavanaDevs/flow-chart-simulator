import { Program } from "../graph/program";
import { RunState, TerminalLine } from "./state";
import { STEP_BUDGET, detectCycle } from "./budget";
import { evaluate } from "../lang/evaluate";
import { typeOf, formatValue } from "../lang/values";

const MAX_TERMINAL_LINES = 2000;

function appendTerminal(
  terminal: readonly TerminalLine[],
  line: TerminalLine
): { lines: TerminalLine[]; truncated: boolean } {
  if (terminal.length >= MAX_TERMINAL_LINES) {
    const sliced = terminal.slice(1);
    return {
      lines: [
        ...sliced,
        { kind: "system", code: "OUTPUT_TRUNCATED" },
        line,
      ],
      truncated: true,
    };
  }
  return { lines: [...terminal, line], truncated: false };
}

export function step(program: Program, state: RunState): RunState {
  if (state.status === "idle") {
    return {
      ...state,
      status: "running",
      currentNodeId: program.entryId,
      stepCount: 0,
      recentNodeIds: [program.entryId],
    };
  }

  if (
    state.status === "awaiting-input" ||
    state.status === "finished" ||
    state.status === "error"
  ) {
    return state;
  }

  if (!state.currentNodeId) {
    return state;
  }

  const currNode = program.nodes[state.currentNodeId];
  if (!currNode) {
    return {
      ...state,
      status: "error",
      error: {
        code: "UNREACHABLE_NODE",
        params: { nodeKind: "unknown" },
        nodeId: state.currentNodeId,
      },
    };
  }

  // Check step budget
  if (state.stepCount >= STEP_BUDGET) {
    const cycle = detectCycle(state.recentNodeIds);
    const errLine: TerminalLine = {
      kind: "error",
      error: {
        code: "STEP_BUDGET_EXCEEDED",
        params: { budget: STEP_BUDGET, cycle },
        nodeId: state.currentNodeId,
      },
    };
    const { lines, truncated } = appendTerminal(state.terminal, errLine);
    return {
      ...state,
      status: "error",
      error: errLine.error,
      terminal: lines,
      terminalTruncated: state.terminalTruncated || truncated,
    };
  }

  const nextStepCount = state.stepCount + 1;
  const nextRecent = [...state.recentNodeIds.slice(-31), state.currentNodeId];

  switch (currNode.kind) {
    case "start": {
      return {
        ...state,
        stepCount: nextStepCount,
        recentNodeIds: nextRecent,
        currentNodeId: currNode.next,
        lastEdgeId: currNode.nextEdgeId,
      };
    }

    case "stop": {
      const sysLine: TerminalLine = {
        kind: "system",
        code: "PROGRAM_FINISHED",
      };
      const { lines, truncated } = appendTerminal(state.terminal, sysLine);
      return {
        ...state,
        status: "finished",
        currentNodeId: null,
        stepCount: nextStepCount,
        recentNodeIds: nextRecent,
        terminal: lines,
        terminalTruncated: state.terminalTruncated || truncated,
      };
    }

    case "process": {
      const evalRes = evaluate(currNode.expr, state.variables);
      if (!evalRes.ok) {
        const errWithNode = { ...evalRes.error, nodeId: currNode.id };
        const errLine: TerminalLine = { kind: "error", error: errWithNode };
        const { lines, truncated } = appendTerminal(state.terminal, errLine);
        return {
          ...state,
          status: "error",
          error: errWithNode,
          stepCount: nextStepCount,
          recentNodeIds: nextRecent,
          terminal: lines,
          terminalTruncated: state.terminalTruncated || truncated,
        };
      }

      return {
        ...state,
        stepCount: nextStepCount,
        recentNodeIds: nextRecent,
        variables: {
          ...state.variables,
          [currNode.target]: evalRes.value,
        },
        currentNodeId: currNode.next,
        lastEdgeId: currNode.nextEdgeId,
      };
    }

    case "output": {
      const evalRes = evaluate(currNode.expr, state.variables);
      if (!evalRes.ok) {
        const errWithNode = { ...evalRes.error, nodeId: currNode.id };
        const errLine: TerminalLine = { kind: "error", error: errWithNode };
        const { lines, truncated } = appendTerminal(state.terminal, errLine);
        return {
          ...state,
          status: "error",
          error: errWithNode,
          stepCount: nextStepCount,
          recentNodeIds: nextRecent,
          terminal: lines,
          terminalTruncated: state.terminalTruncated || truncated,
        };
      }

      const outLine: TerminalLine = {
        kind: "output",
        text: formatValue(evalRes.value),
      };
      const { lines, truncated } = appendTerminal(state.terminal, outLine);

      return {
        ...state,
        stepCount: nextStepCount,
        recentNodeIds: nextRecent,
        terminal: lines,
        terminalTruncated: state.terminalTruncated || truncated,
        currentNodeId: currNode.next,
        lastEdgeId: currNode.nextEdgeId,
      };
    }

    case "if": {
      const evalRes = evaluate(currNode.cond, state.variables);
      if (!evalRes.ok) {
        const errWithNode = { ...evalRes.error, nodeId: currNode.id };
        const errLine: TerminalLine = { kind: "error", error: errWithNode };
        const { lines, truncated } = appendTerminal(state.terminal, errLine);
        return {
          ...state,
          status: "error",
          error: errWithNode,
          stepCount: nextStepCount,
          recentNodeIds: nextRecent,
          terminal: lines,
          terminalTruncated: state.terminalTruncated || truncated,
        };
      }

      if (typeof evalRes.value !== "boolean") {
        const typeErr = {
          code: "IF_NOT_BOOLEAN" as const,
          params: { actualType: typeOf(evalRes.value) },
          nodeId: currNode.id,
          span: currNode.cond.span,
        };
        const errLine: TerminalLine = { kind: "error", error: typeErr };
        const { lines, truncated } = appendTerminal(state.terminal, errLine);
        return {
          ...state,
          status: "error",
          error: typeErr,
          stepCount: nextStepCount,
          recentNodeIds: nextRecent,
          terminal: lines,
          terminalTruncated: state.terminalTruncated || truncated,
        };
      }

      const branchTrue = evalRes.value === true;
      const nextNodeId = branchTrue ? currNode.whenTrue : currNode.whenFalse;
      const nextEdgeId = branchTrue ? currNode.trueEdgeId : currNode.falseEdgeId;

      return {
        ...state,
        stepCount: nextStepCount,
        recentNodeIds: nextRecent,
        currentNodeId: nextNodeId,
        lastEdgeId: nextEdgeId,
      };
    }

    case "input": {
      const promptLine: TerminalLine = {
        kind: "prompt",
        varName: currNode.varName,
        valueType: currNode.valueType,
      };
      const { lines, truncated } = appendTerminal(state.terminal, promptLine);
      return {
        ...state,
        status: "awaiting-input",
        pendingInput: {
          nodeId: currNode.id,
          varName: currNode.varName,
          type: currNode.valueType,
        },
        stepCount: nextStepCount,
        recentNodeIds: nextRecent,
        terminal: lines,
        terminalTruncated: state.terminalTruncated || truncated,
      };
    }
  }
}
