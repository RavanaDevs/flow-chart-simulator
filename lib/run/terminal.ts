import { TerminalLine } from "./state";

export const MAX_TERMINAL_LINES = 2000;

/**
 * Appends one line, holding the log at MAX_TERMINAL_LINES by dropping the
 * oldest. The truncation notice is a flag on RunState, not a line in the log —
 * emitting it per append made the array grow without bound and filled the
 * terminal with thousands of copies of its own warning.
 */
export function appendTerminal(
  terminal: readonly TerminalLine[],
  ...lines: TerminalLine[]
): { lines: TerminalLine[]; truncated: boolean } {
  const next = [...terminal, ...lines];
  if (next.length <= MAX_TERMINAL_LINES) {
    return { lines: next, truncated: false };
  }
  return {
    lines: next.slice(next.length - MAX_TERMINAL_LINES),
    truncated: true,
  };
}
