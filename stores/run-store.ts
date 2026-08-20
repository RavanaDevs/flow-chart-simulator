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
  /**
   * Whether the auto-advance loop is driving execution. Deliberately separate
   * from state.status: stepping by hand also leaves the interpreter 'running',
   * so status alone cannot tell "playing" apart from "paused part-way through".
   * Treating it as the same thing made a single Step click run to the end.
   */
  isPlaying: boolean;

  loadProgram: (program: Program) => void;
  play: () => void;
  pause: () => void;
  tick: () => void;
  tickBatch: (maxSteps: number) => void;
  submitInput: (raw: string) => void;
  stepBack: () => void;
  resetRun: () => void;
};

/** Execution is over; nothing can advance it any further. */
function isTerminal(state: RunState): boolean {
  return state.status === "finished" || state.status === "error";
}

export const useRunStore = create<RunStoreState>((set, get) => ({
  program: null,
  state: initialState(),
  history: [],
  isPlaying: false,

  loadProgram: (program) => {
    set({
      program,
      state: initialState(),
      history: [],
      isPlaying: false,
    });
  },

  /**
   * Hand control to the auto-advance loop. The loop only runs while status is
   * 'running', so a fresh program needs one step here to leave 'idle'; a run
   * paused on an input prompt resumes on its own once the value arrives.
   */
  play: () => {
    const { program, state } = get();
    if (!program || isTerminal(state)) return;

    set({ isPlaying: true });
    if (state.status === "idle") {
      get().tick();
    }
  },

  pause: () => {
    if (get().isPlaying) {
      set({ isPlaying: false });
    }
  },

  tick: () => {
    const { program, state, history, isPlaying } = get();
    if (!program) return;

    if (isTerminal(state) || state.status === "awaiting-input") {
      return;
    }

    const nextState = step(program, state);
    if (nextState !== state) {
      const updatedHistory = [...history.slice(-(MAX_HISTORY - 1)), state];
      set({
        state: nextState,
        history: updatedHistory,
        isPlaying: isPlaying && !isTerminal(nextState),
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
    const { program, state, history, isPlaying } = get();
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
      isPlaying: isPlaying && !isTerminal(current),
    });
  },

  submitInput: (raw) => {
    const { program, state, history, isPlaying } = get();
    if (!program || state.status !== "awaiting-input") return;

    const nextState = provideInput(program, state, raw);
    if (nextState !== state) {
      const updatedHistory = [...history.slice(-(MAX_HISTORY - 1)), state];
      set({
        state: nextState,
        history: updatedHistory,
        isPlaying: isPlaying && !isTerminal(nextState),
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
      isPlaying: false,
    });
  },
}));
