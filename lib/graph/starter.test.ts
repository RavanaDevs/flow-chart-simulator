import { describe, it, expect } from "vitest";
import { compile } from "./compile";
import { starterDocument } from "./starter";
import { GRID_SIZE } from "./grid";
import { Program } from "./program";
import { initialState } from "../run/state";
import { step } from "../run/step";
import { provideInput } from "../run/input";

/** Drives a program to a terminal state, answering prompts in order. */
function runWith(program: Program, inputs: string[]) {
  let state = initialState();
  let inputIdx = 0;

  while (state.status !== "finished" && state.status !== "error") {
    if (state.status === "awaiting-input") {
      if (inputIdx >= inputs.length) break;
      state = provideInput(program, state, inputs[inputIdx++]);
    } else {
      state = step(program, state);
    }
  }

  return state;
}

/**
 * The starter chart is the first thing a beginner sees. A diagnostic on it
 * would be an error they did not cause and cannot interpret, so it is held to
 * a stricter standard than a chart a student built: no errors *and* no
 * warnings.
 */
describe("starter document", () => {
  it("compiles with no errors and no warnings", () => {
    const result = compile(starterDocument());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.program.warnings).toEqual([]);
  });

  it("prints Pass for a mark above the threshold", () => {
    const result = compile(starterDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const state = runWith(result.program, ["70"]);

    expect(state.status).toBe("finished");
    expect(state.variables.marks).toBe(70);
    expect(state.terminal.filter((l) => l.kind === "output")).toEqual([
      expect.objectContaining({ text: "Pass" }),
    ]);
  });

  it("prints Fail for a mark on or below the threshold", () => {
    const result = compile(starterDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const state = runWith(result.program, ["35"]);

    expect(state.status).toBe("finished");
    expect(state.terminal.filter((l) => l.kind === "output")).toEqual([
      expect.objectContaining({ text: "Fail" }),
    ]);
  });

  it("both branches reach the same Stop through the connector", () => {
    const result = compile(starterDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const pass = runWith(result.program, ["70"]);
    const fail = runWith(result.program, ["10"]);

    expect(pass.currentNodeId).toBe(fail.currentNodeId);
  });

  it("sits on the grid, so nothing shifts on first drag", () => {
    for (const node of starterDocument().nodes) {
      expect(node.position.x % GRID_SIZE).toBe(0);
      expect(node.position.y % GRID_SIZE).toBe(0);
    }
  });
});
