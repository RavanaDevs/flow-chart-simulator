import { describe, it, expect } from "vitest";
import { compile } from "../graph/compile";
import { Program } from "../graph/program";
import { initialState } from "./state";
import { step } from "./step";
import { provideInput } from "./input";
import { FIXTURES } from "../testing/programs";
import { flow } from "../testing/build-flow";

function runToCompletion(program: Program, inputs: string[] = []) {
  let state = initialState();
  let inputIdx = 0;

  while (state.status !== "finished" && state.status !== "error") {
    if (state.status === "awaiting-input") {
      if (inputIdx >= inputs.length) {
        break;
      }
      const raw = inputs[inputIdx++];
      state = provideInput(program, state, raw);
    } else {
      state = step(program, state);
    }
  }

  return state;
}

describe("Interpreter & Step Engine", () => {
  it("runs 'hello' fixture to completion", () => {
    const cRes = compile(FIXTURES.hello);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("finished");
    expect(endState.terminal).toHaveLength(2); // output line + system finished line
    expect(endState.terminal[0]).toEqual({ kind: "output", text: "Hello", nodeId: "2" });
  });

  it("runs 'sum1To10' fixture to completion (sum = 55)", () => {
    const cRes = compile(FIXTURES.sum1To10);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("finished");
    expect(endState.variables.sum).toBe(55);
    expect(endState.variables.i).toBe(11);
    expect(endState.terminal.some((t) => t.kind === "output" && t.text === "55")).toBe(true);
  });

  it("runs 'countdown' fixture with input 3", () => {
    const cRes = compile(FIXTURES.countdown);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program, ["3"]);
    expect(endState.status).toBe("finished");
    const outputs = endState.terminal.filter((t) => t.kind === "output").map((t) => (t as { text: string }).text);
    expect(outputs).toEqual(["3", "2", "1"]);
  });

  it("re-prompts on invalid numeric input without leaving awaiting-input", () => {
    const cRes = compile(FIXTURES.countdown);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    let state = initialState();
    state = step(cRes.program, state); // idle -> running at start node 1
    state = step(cRes.program, state); // start node 1 -> input node 2
    state = step(cRes.program, state); // input node 2 -> awaiting-input

    expect(state.status).toBe("awaiting-input");

    // Provide invalid string "abc"
    state = provideInput(cRes.program, state, "abc");
    expect(state.status).toBe("awaiting-input");
    expect(state.terminal.some((t) => t.kind === "error" && t.error.code === "INPUT_NOT_A_NUMBER")).toBe(true);

    // Provide valid "2"
    state = provideInput(cRes.program, state, "2");
    expect(state.status).toBe("running");
  });

  it("raises DIVIDE_BY_ZERO on division by zero input", () => {
    const cRes = compile(FIXTURES.divideByZero);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program, ["0"]);
    expect(endState.status).toBe("error");
    expect(endState.error?.code).toBe("DIVIDE_BY_ZERO");
  });

  it("trips STEP_BUDGET_EXCEEDED on infinite loop and detects cycle", () => {
    const cRes = compile(FIXTURES.infiniteLoop);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("error");
    expect(endState.error?.code).toBe("STEP_BUDGET_EXCEEDED");
    if (endState.error?.code === "STEP_BUDGET_EXCEEDED") {
      expect(endState.error.params.cycle.length).toBeGreaterThan(0);
    }
  });

  it("concatenates a comma-separated Output block", () => {
    const cRes = compile(FIXTURES.greeting);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program, ["Nimal"]);
    expect(endState.status).toBe("finished");

    const outputs = endState.terminal.filter((l) => l.kind === "output");
    expect(outputs).toEqual([{ kind: "output", text: "Hello, Nimal!", nodeId: "3" }]);
  });

  it("asks for each name in a multi-variable Input block in turn", () => {
    const cRes = compile(FIXTURES.multiInput);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program, ["1", "2", "3"]);
    expect(endState.status).toBe("finished");
    expect(endState.variables).toMatchObject({ a: 1, b: 2, c: 3 });

    const prompts = endState.terminal.filter((l) => l.kind === "prompt");
    expect(prompts.map((p) => (p.kind === "prompt" ? p.varName : ""))).toEqual([
      "a",
      "b",
      "c",
    ]);

    const outputs = endState.terminal.filter((l) => l.kind === "output");
    expect(outputs).toEqual([{ kind: "output", text: "sum=6", nodeId: "3" }]);
  });

  it("re-asks for the SAME name when a value in a list is not a number", () => {
    const cRes = compile(FIXTURES.multiInput);
    if (!cRes.ok) return;

    let state = initialState();
    while (state.status !== "awaiting-input") {
      state = step(cRes.program, state);
    }
    expect(state.pendingInput?.varName).toBe("a");

    state = provideInput(cRes.program, state, "1");
    expect(state.pendingInput?.varName).toBe("b");

    // A typo must not skip ahead to "c" or assign anything.
    state = provideInput(cRes.program, state, "oops");
    expect(state.status).toBe("awaiting-input");
    expect(state.pendingInput?.varName).toBe("b");
    expect(state.pendingInput?.index).toBe(1);
    expect(state.variables.b).toBeUndefined();

    state = provideInput(cRes.program, state, "2");
    expect(state.pendingInput?.varName).toBe("c");
    expect(state.variables.b).toBe(2);
  });

  it("merges both branches through a connector into one flow", () => {
    const cRes = compile(FIXTURES.merge);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const texts = (inputs: string[]) =>
      runToCompletion(cRes.program, inputs)
        .terminal.filter((l) => l.kind === "output")
        .map((l) => (l.kind === "output" ? l.text : ""));

    // Whichever branch runs, both continue through the junction.
    expect(texts(["5"])).toEqual(["positive", "done"]);
    expect(texts(["-5"])).toEqual(["not positive", "done"]);
  });

  it("passes straight through a connector without changing anything", () => {
    const cRes = compile(FIXTURES.merge);
    if (!cRes.ok) return;

    let state = initialState();
    while (state.status !== "awaiting-input") state = step(cRes.program, state);
    state = provideInput(cRes.program, state, "5");

    // Walk until the junction is the current block.
    while (state.currentNodeId !== "6" && state.status === "running") {
      state = step(cRes.program, state);
    }
    expect(state.currentNodeId).toBe("6");

    const before = state;
    const after = step(cRes.program, before);

    // It is a waypoint, not an operation: nothing but position changes.
    expect(after.variables).toEqual(before.variables);
    expect(after.terminal).toBe(before.terminal);
    expect(after.currentNodeId).toBe("7");
  });

  it("runs a multi-line process block top to bottom in one step", () => {
    const cRes = compile(FIXTURES.multiLine);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program, ["200", "3"]);
    expect(endState.status).toBe("finished");

    // Each line saw what the line above it stored.
    expect(endState.variables).toMatchObject({
      price: 200,
      qty: 3,
      subtotal: 600,
      tax: 60,
      total: 660,
    });

    const outputs = endState.terminal.filter((l) => l.kind === "output");
    expect(outputs).toEqual([{ kind: "output", text: "total = 660", nodeId: "4" }]);
  });

  it("counts a whole multi-line process block as a single step", () => {
    const cRes = compile(FIXTURES.multiLine);
    if (!cRes.ok) return;

    let state = initialState();
    while (state.status !== "awaiting-input") state = step(cRes.program, state);
    state = provideInput(cRes.program, state, "200");
    state = provideInput(cRes.program, state, "3");

    // Now sitting on the three-line process block.
    expect(state.currentNodeId).toBe("3");
    const before = state.stepCount;

    state = step(cRes.program, state);

    expect(state.stepCount).toBe(before + 1);
    expect(state.currentNodeId).toBe("4");
    expect(state.variables.total).toBe(660);
  });

  it("treats a new line in an Input block as another name", () => {
    const cRes = compile(FIXTURES.multiLine);
    if (!cRes.ok) return;

    let state = initialState();
    while (state.status !== "awaiting-input") state = step(cRes.program, state);

    expect(state.pendingInput?.varName).toBe("price");
    expect(state.pendingInput?.total).toBe(2);

    state = provideInput(cRes.program, state, "10");
    expect(state.pendingInput?.varName).toBe("qty");
  });

  it("sets inputError on invalid number input and clears it on valid input", () => {
    const cRes = compile(FIXTURES.multiLine);
    if (!cRes.ok) return;

    let state = initialState();
    while (state.status !== "awaiting-input") state = step(cRes.program, state);

    expect(state.inputError).toBeNull();

    // Submit invalid string for number input
    state = provideInput(cRes.program, state, "abc");
    expect(state.inputError).not.toBeNull();
    expect(state.inputError?.code).toBe("INPUT_NOT_A_NUMBER");
    expect(state.status).toBe("awaiting-input");

    // Submit valid number input
    state = provideInput(cRes.program, state, "200");
    expect(state.inputError).toBeNull();
  });

  it("prints one terminal line per line of an Output block", () => {
    const cRes = compile(FIXTURES.receipt);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("finished");

    const outputs = endState.terminal
      .filter((l) => l.kind === "output")
      .map((l) => (l.kind === "output" ? l.text : ""));

    // Three source lines -> three printed lines; commas joined within each.
    expect(outputs).toEqual(["Receipt", "qty:   3", "price: 200"]);
  });

  it("counts a whole multi-line Output block as a single step", () => {
    const cRes = compile(FIXTURES.receipt);
    if (!cRes.ok) return;

    let state = initialState();
    while (
      state.currentNodeId !== "3" &&
      state.status !== "finished" &&
      state.status !== "error"
    ) {
      state = step(cRes.program, state);
    }
    expect(state.currentNodeId).toBe("3");
    const before = state.stepCount;

    state = step(cRes.program, state);

    expect(state.stepCount).toBe(before + 1);
    expect(state.terminal.filter((l) => l.kind === "output")).toHaveLength(3);
  });

  it("keeps lines already printed when a later line of an Output block fails", () => {
    const graph = flow()
      .start("1")
      .output("2", `"first"\n"second"\nmissing`)
      .stop("3")
      .connect("1", "2")
      .connect("2", "3")
      .build();

    const cRes = compile(graph);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("error");
    expect(endState.error?.code).toBe("UNKNOWN_VARIABLE");

    const outputs = endState.terminal
      .filter((l) => l.kind === "output")
      .map((l) => (l.kind === "output" ? l.text : ""));

    // How far it got is visible, rather than the whole block vanishing.
    expect(outputs).toEqual(["first", "second"]);
  });

  it("lights the Stop block and stops the path animation on finish", () => {
    const cRes = compile(FIXTURES.hello);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("finished");
    // The Stop block stays current so it can be highlighted...
    expect(endState.currentNodeId).toBe("3");
    // ...and no edge is left travelling, so nothing animates after the end.
    expect(endState.lastEdgeId).toBeNull();
  });

  it("holds the failing block and stops the path animation on error", () => {
    const cRes = compile(FIXTURES.divideByZero);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program, ["0"]);
    expect(endState.status).toBe("error");
    expect(endState.error?.code).toBe("DIVIDE_BY_ZERO");
    expect(endState.currentNodeId).toBe("3");
    expect(endState.lastEdgeId).toBeNull();
  });

  it("Property: Determinism", () => {
    const cRes = compile(FIXTURES.sum1To10);
    if (!cRes.ok) return;

    const runA = runToCompletion(cRes.program);
    const runB = runToCompletion(cRes.program);

    expect(runA).toEqual(runB);
  });

  it("Property: Absorbing terminal states", () => {
    const cRes = compile(FIXTURES.hello);
    if (!cRes.ok) return;

    const endState = runToCompletion(cRes.program);
    expect(endState.status).toBe("finished");

    const steppedAgain = step(cRes.program, endState);
    expect(steppedAgain).toBe(endState); // Exact reference equality
  });

  it("holds the terminal at its cap without flooding it with notices", () => {
    const cRes = compile(FIXTURES.printLoop);
    expect(cRes.ok).toBe(true);
    if (!cRes.ok) return;

    let state = initialState();
    for (let i = 0; i < 9000; i++) {
      state = step(cRes.program, state);
    }

    // The log is capped, not merely trimmed-and-regrown.
    expect(state.terminal.length).toBeLessThanOrEqual(2000);
    expect(state.terminalTruncated).toBe(true);

    // The truncation notice is a flag, never a line in the log.
    const notices = state.terminal.filter(
      (l) => l.kind === "system" && l.code === "OUTPUT_TRUNCATED"
    );
    expect(notices).toHaveLength(0);
  });

  it("Property: step() never mutates the state it is given", () => {
    const cRes = compile(FIXTURES.sum1To10);
    if (!cRes.ok) return;

    const deepFreeze = (value: unknown): void => {
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
      }
    };

    let state = initialState();
    // Runs in strict mode, so any in-place push/assign throws instead of
    // silently succeeding.
    for (let i = 0; i < 200 && state.status !== "finished"; i++) {
      deepFreeze(state);
      state = step(cRes.program, state);
    }

    expect(state.status).toBe("finished");
    expect(state.variables.sum).toBe(55);
  });

  it("Property: awaiting-input is a hard stop", () => {
    const cRes = compile(FIXTURES.countdown);
    if (!cRes.ok) return;

    let state = initialState();
    state = step(cRes.program, state);
    state = step(cRes.program, state);
    state = step(cRes.program, state);
    expect(state.status).toBe("awaiting-input");

    const before = state;
    for (let i = 0; i < 100; i++) {
      state = step(cRes.program, state);
    }
    expect(state).toBe(before); // Step does nothing while awaiting input
  });
});
