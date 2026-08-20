import { describe, it, expect, beforeEach } from "vitest";
import { useRunStore } from "./run-store";
import { compile } from "@/lib/graph/compile";
import { FIXTURES } from "@/lib/testing/programs";
import { Program } from "@/lib/graph/program";

function programOf(name: keyof typeof FIXTURES): Program {
  const res = compile(FIXTURES[name]);
  if (!res.ok) throw new Error(`fixture "${name}" failed to compile`);
  return res.program;
}

/** Advance until execution stops, so a broken loop guard cannot hang the suite. */
function runToEnd(maxTicks = 200): void {
  for (let i = 0; i < maxTicks; i++) {
    const { state } = useRunStore.getState();
    if (state.status === "finished" || state.status === "error") return;
    if (state.status === "awaiting-input") return;
    useRunStore.getState().tick();
  }
  throw new Error("program did not stop within the tick budget");
}

describe("run-store isPlaying", () => {
  beforeEach(() => {
    useRunStore.setState({
      program: null,
      state: useRunStore.getState().state,
      history: [],
      isPlaying: false,
    });
    useRunStore.getState().resetRun();
  });

  /**
   * The regression: stepping by hand leaves the interpreter 'running', and the
   * runner loop used to read that as "auto-play", so one Step click ran the
   * whole program.
   */
  it("stays paused when stepping by hand", () => {
    useRunStore.getState().loadProgram(programOf("hello"));

    useRunStore.getState().tick();

    expect(useRunStore.getState().state.status).toBe("running");
    expect(useRunStore.getState().isPlaying).toBe(false);
  });

  // The loop only advances while status is 'running', so play() has to make
  // that entry transition itself or nothing would ever start.
  it("play() starts the loop and leaves idle", () => {
    const program = programOf("hello");
    useRunStore.getState().loadProgram(program);

    useRunStore.getState().play();

    expect(useRunStore.getState().isPlaying).toBe(true);
    expect(useRunStore.getState().state.status).toBe("running");
    expect(useRunStore.getState().state.currentNodeId).toBe(program.entryId);
  });

  it("play() resumes a run that was stepped by hand without restarting it", () => {
    useRunStore.getState().loadProgram(programOf("sum1To10"));

    useRunStore.getState().tick();
    useRunStore.getState().tick();
    const steppedTo = useRunStore.getState().state.currentNodeId;
    const stepCount = useRunStore.getState().state.stepCount;

    useRunStore.getState().play();

    expect(useRunStore.getState().isPlaying).toBe(true);
    expect(useRunStore.getState().state.currentNodeId).toBe(steppedTo);
    expect(useRunStore.getState().state.stepCount).toBe(stepCount);
  });

  it("pause() stops the loop but keeps the run where it is", () => {
    useRunStore.getState().loadProgram(programOf("sum1To10"));
    useRunStore.getState().play();
    const pausedAt = useRunStore.getState().state.currentNodeId;

    useRunStore.getState().pause();

    expect(useRunStore.getState().isPlaying).toBe(false);
    expect(useRunStore.getState().state.status).toBe("running");
    expect(useRunStore.getState().state.currentNodeId).toBe(pausedAt);
  });

  it("clears isPlaying once execution finishes", () => {
    useRunStore.getState().loadProgram(programOf("hello"));
    useRunStore.getState().play();

    runToEnd();

    expect(useRunStore.getState().state.status).toBe("finished");
    expect(useRunStore.getState().isPlaying).toBe(false);
  });

  it("clears isPlaying when a batch reaches the end", () => {
    useRunStore.getState().loadProgram(programOf("hello"));
    useRunStore.getState().play();

    useRunStore.getState().tickBatch(200);

    expect(useRunStore.getState().state.status).toBe("finished");
    expect(useRunStore.getState().isPlaying).toBe(false);
  });

  it("keeps playing across an input pause so the run resumes on its own", () => {
    useRunStore.getState().loadProgram(programOf("countdown"));
    useRunStore.getState().play();
    runToEnd();

    expect(useRunStore.getState().state.status).toBe("awaiting-input");
    expect(useRunStore.getState().isPlaying).toBe(true);

    useRunStore.getState().submitInput("2");

    expect(useRunStore.getState().state.status).toBe("running");
    expect(useRunStore.getState().isPlaying).toBe(true);
  });

  it("does not resume auto-play after input when the run was stepped by hand", () => {
    useRunStore.getState().loadProgram(programOf("countdown"));
    runToEnd();

    expect(useRunStore.getState().state.status).toBe("awaiting-input");

    useRunStore.getState().submitInput("2");

    expect(useRunStore.getState().state.status).toBe("running");
    expect(useRunStore.getState().isPlaying).toBe(false);
  });

  it("resetRun() and loadProgram() both stop the loop", () => {
    useRunStore.getState().loadProgram(programOf("hello"));
    useRunStore.getState().play();
    useRunStore.getState().resetRun();
    expect(useRunStore.getState().isPlaying).toBe(false);

    useRunStore.getState().play();
    useRunStore.getState().loadProgram(programOf("hello"));
    expect(useRunStore.getState().isPlaying).toBe(false);
  });

  it("play() is a no-op once execution is over", () => {
    useRunStore.getState().loadProgram(programOf("hello"));
    useRunStore.getState().play();
    runToEnd();

    useRunStore.getState().play();

    expect(useRunStore.getState().isPlaying).toBe(false);
  });
});
