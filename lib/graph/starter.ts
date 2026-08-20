import { FlowGraph } from "./types";

/**
 * The flowchart a student meets on first load.
 *
 * A pass/fail grade check: read a mark, branch on it, print one of two words,
 * merge the branches back together and stop. It is the smallest chart that
 * still shows a decision with both exits used and a connector doing its job,
 * so the first thing on screen already demonstrates what the blocks are for.
 *
 * This is *not* what New produces — `resetGraph()` in the graph store clears to
 * a bare Start block, because clearing the canvas is a request for an empty
 * canvas. This document seeds the store's initial state only, and a returning
 * student's autosaved work replaces it on mount.
 *
 * Every position is a multiple of GRID_SIZE, so nothing shifts on first drag.
 * `starter.test.ts` compiles it on every run — a starter chart that does not
 * compile would greet a beginner with an error they did not cause.
 */
export function starterDocument(): FlowGraph {
  return {
    nodes: [
      {
        id: "starter-start",
        kind: "start",
        position: { x: 240, y: 48 },
        data: {},
      },
      {
        id: "starter-input",
        kind: "input",
        position: { x: 224, y: 176 },
        data: { names: "marks", valueType: "number" },
      },
      {
        id: "starter-if",
        kind: "if",
        position: { x: 208, y: 336 },
        data: { source: "marks > 35" },
      },
      {
        id: "starter-pass",
        kind: "output",
        position: { x: 224, y: 544 },
        data: { source: `"Pass"` },
      },
      {
        id: "starter-fail",
        kind: "output",
        position: { x: 544, y: 368 },
        data: { source: `"Fail"` },
      },
      {
        id: "starter-merge",
        kind: "connector",
        position: { x: 624, y: 560 },
        data: {},
      },
      {
        id: "starter-stop",
        kind: "stop",
        position: { x: 560, y: 672 },
        data: {},
      },
    ],
    edges: [
      {
        id: "starter-e1",
        source: "starter-start",
        target: "starter-input",
        sourceHandle: "port-bottom",
        targetHandle: "port-top",
      },
      {
        id: "starter-e2",
        source: "starter-input",
        target: "starter-if",
        sourceHandle: "port-bottom",
        targetHandle: "port-top",
      },
      {
        id: "starter-e3",
        source: "starter-if",
        target: "starter-pass",
        sourceHandle: "true-bottom",
        targetHandle: "port-top",
      },
      {
        id: "starter-e4",
        source: "starter-if",
        target: "starter-fail",
        sourceHandle: "false-right",
        targetHandle: "port-left",
      },
      {
        id: "starter-e5",
        source: "starter-pass",
        target: "starter-merge",
        sourceHandle: "port-right",
        targetHandle: "port-left",
      },
      {
        id: "starter-e6",
        source: "starter-fail",
        target: "starter-merge",
        sourceHandle: "port-bottom",
        targetHandle: "port-top",
      },
      {
        id: "starter-e7",
        source: "starter-merge",
        target: "starter-stop",
        sourceHandle: "port-bottom",
        targetHandle: "port-top",
      },
    ],
  };
}
