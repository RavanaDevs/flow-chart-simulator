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
