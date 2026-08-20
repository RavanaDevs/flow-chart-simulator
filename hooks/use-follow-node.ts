"use client";

import { useEffect, useRef } from "react";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";
import { useReactFlow } from "@xyflow/react";

const MIN_ASK_ZOOM = 0.75;

export function useFollowNode(enabled: boolean) {
  const currentNodeId = useRunStore((s) => s.state.currentNodeId);
  const status = useRunStore((s) => s.state.status);
  const nodes = useGraphStore((s) => s.nodes);
  const { setCenter, getZoom, fitView } = useReactFlow();

  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status === "idle" && prevStatusRef.current !== "idle") {
      fitView({ duration: 400, padding: 0.2 });
    }
    prevStatusRef.current = status;
  }, [status, fitView]);

  useEffect(() => {
    if (!enabled || !currentNodeId) return;

    const currNode = nodes.find((n) => n.id === currentNodeId);
    if (!currNode) return;

    const currentZoom = getZoom() || 1;
    const targetZoom =
      status === "awaiting-input"
        ? Math.max(currentZoom, MIN_ASK_ZOOM)
        : currentZoom;

    setCenter(currNode.position.x + 90, currNode.position.y + 30, {
      zoom: targetZoom,
      duration: 300,
    });
  }, [currentNodeId, status, enabled, nodes, setCenter, getZoom]);
}
