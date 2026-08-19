import { create } from "zustand";
import { Program } from "@/lib/graph/program";
import { RunState, initialState } from "@/lib/run/state";
import { step } from "@/lib/run/step";
import { provideInput } from "@/lib/run/input";

const MAX_HISTORY = 1000;

export type RunStoreState = {
  program: Program | null;
  state: RunState;
  history: RunState[];

  loadProgram: (program: Program) => void;
  tick: () => void;
  tickBatch: (maxSteps: number) => void;
  submitInput: (raw: string) => void;
  stepBack: () => void;
  resetRun: () => void;
};

export const useRunStore = create<RunStoreState>((set, get) => ({
  program: null,
  state: initialState(),
  history: [],

  loadProgram: (program) => {
    set({
      program,
      state: initialState(),
      history: [],
    });
  },

  tick: () => {
    const { program, state, history } = get();
    if (!program) return;

    if (
      state.status === "finished" ||
      state.status === "error" ||
      state.status === "awaiting-input"
    ) {
      return;
    }

    const nextState = step(program, state);
    if (nextState !== state) {
      const updatedHistory = [...history.slice(-(MAX_HISTORY - 1)), state];
      set({
        state: nextState,
        history: updatedHistory,
      });
    }
  },

  /**
   * Runs up to maxSteps in one commit. At the fastest speed a step every
   * timer tick means one React render per step, so a 10,000-step program
   * took minutes to reach its own step-budget error. Stops early the moment
   * execution leaves 'running' so a pause for input is never stepped past.
   */
  tickBatch: (maxSteps) => {
    const { program, state, history } = get();
    if (!program || state.status !== "running") return;

    let current = state;
    const collected: RunState[] = [];

    for (let i = 0; i < maxSteps; i++) {
      const next = step(program, current);
      if (next === current) break;
      collected.push(current);
      current = next;
      if (current.status !== "running") break;
    }

    if (current === state) return;

    set({
      state: current,
      history: [...history, ...collected].slice(-MAX_HISTORY),
    });
  },

  submitInput: (raw) => {
    const { program, state, history } = get();
    if (!program || state.status !== "awaiting-input") return;

    const nextState = provideInput(program, state, raw);
    if (nextState !== state) {
      const updatedHistory = [...history.slice(-(MAX_HISTORY - 1)), state];
      set({
        state: nextState,
        history: updatedHistory,
      });
    }
  },

  stepBack: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    set({
      state: previousState,
      history: newHistory,
    });
  },

  resetRun: () => {
    set({
      state: initialState(),
      history: [],
    });
  },
}));
