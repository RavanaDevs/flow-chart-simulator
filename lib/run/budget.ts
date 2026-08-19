import { NodeId } from "../graph/types";

export const STEP_BUDGET = 10000;

export function detectCycle(recentNodeIds: readonly NodeId[]): NodeId[] {
  if (recentNodeIds.length < 2) return [];

  // Look for repeating suffix of length L (1 to floor(len/2))
  const len = recentNodeIds.length;
  for (let L = 1; L <= Math.floor(len / 2); L++) {
    let matches = true;
    for (let i = 0; i < L; i++) {
      if (recentNodeIds[len - 1 - i] !== recentNodeIds[len - 1 - i - L]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return recentNodeIds.slice(len - L);
    }
  }

  return recentNodeIds.slice(-5);
}
