import { useEffect, useRef } from "react";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";

export function useRunner(speedMs: number) {
  const status = useRunStore((s) => s.state.status);
  const tick = useRunStore((s) => s.tick);
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

    const timerId = setTimeout(() => {
      tick();
    }, speedMs);

    return () => clearTimeout(timerId);
  }, [status, speedMs, tick]);
}
