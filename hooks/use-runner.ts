"use client";

import { useEffect, useRef } from "react";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";

const MAX_STEPS_PER_FRAME = 200;
const INSTANT_THRESHOLD_MS = 20;

export function useRunner(speedMs: number) {
  const status = useRunStore((s) => s.state.status);
  const stepCount = useRunStore((s) => s.state.stepCount);
  const tick = useRunStore((s) => s.tick);
  const tickBatch = useRunStore((s) => s.tickBatch);
  const resetRun = useRunStore((s) => s.resetRun);
  const revision = useGraphStore((s) => s.revision);
  const prevRevisionRef = useRef(revision);

  // Watch for graph edits mid-run
  useEffect(() => {
    if (prevRevisionRef.current !== revision) {
      prevRevisionRef.current = revision;
      if (status === "running" || status === "awaiting-input") {
        resetRun();
      }
    }
  }, [revision, status, resetRun]);

  // Execute runner step tick loop
  useEffect(() => {
    if (status !== "running") return;

    // "Instant" batches many steps per animation frame instead of paying a
    // React render per step.
    if (speedMs <= INSTANT_THRESHOLD_MS) {
      const frameId = requestAnimationFrame(() => {
        tickBatch(MAX_STEPS_PER_FRAME);
      });
      return () => cancelAnimationFrame(frameId);
    }

    const timerId = setTimeout(() => {
      tick();
    }, speedMs);

    return () => clearTimeout(timerId);
  }, [status, stepCount, speedMs, tick, tickBatch]);
}
