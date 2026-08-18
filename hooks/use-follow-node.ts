"use client";

import { useEffect } from "react";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";
import { useReactFlow } from "@xyflow/react";

export function useFollowNode(enabled: boolean) {
  const currentNodeId = useRunStore((s) => s.state.currentNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const { setCenter, getZoom } = useReactFlow();

  useEffect(() => {
    if (!enabled || !currentNodeId) return;

    const currNode = nodes.find((n) => n.id === currentNodeId);
    if (!currNode) return;

    setCenter(currNode.position.x + 90, currNode.position.y + 30, {
      zoom: getZoom() || 1,
      duration: 300,
    });
  }, [currentNodeId, enabled, nodes, setCenter, getZoom]);
}
