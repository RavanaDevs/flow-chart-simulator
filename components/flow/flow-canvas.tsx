"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ConnectionMode,
} from "@xyflow/react";
import { nodeTypes, edgeTypes } from "./node-types";
import { useGraphStore } from "@/stores/graph-store";
import { NodeKind } from "@/lib/graph/types";
import { toast } from "sonner";

export const FlowCanvas: React.FC = () => {
  const { nodes, edges, connect, moveNode, setSelectedId } = useGraphStore();
  const screenToFlowPosition = useReactFlow().screenToFlowPosition;

  // Convert graph-store FlowNode[] to ReactFlow Node[]
  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: n.kind,
        position: n.position,
        data: n.data as Record<string, unknown>,
      })),
    [nodes]
  );

  // Convert graph-store FlowEdge[] to ReactFlow Edge[]
  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        type: "smoothstep",
      })),
    [edges]
  );

  // Strict Connection Validation
  const isValidConnection = useCallback(
    (connection: Connection | Edge): boolean => {
      // 1. Reject self-loops
      if (connection.source === connection.target) return false;

      // 2. Reject occupied source handle
      const existing = edges.find(
        (e) =>
          e.source === connection.source &&
          e.sourceHandle === (connection.sourceHandle ?? null)
      );

      if (existing) {
        toast.error("That block already has an arrow coming out of it. Delete the old arrow first.");
        return false;
      }

      return true;
    },
    [edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      connect(
        connection.source,
        connection.target,
        (connection.sourceHandle as "true" | "false" | null) ?? null
      );
    },
    [connect]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent | MouseEvent | TouchEvent, node: Node) => {
      moveNode(node.id, node.position);
    },
    [moveNode]
  );

  // Drag and drop block from Palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const kind = event.dataTransfer.getData("application/reactflow-kind") as NodeKind;
      if (!kind) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      useGraphStore.getState().addNode(kind, position);
    },
    [screenToFlowPosition]
  );

  return (
    <div
      className="h-full w-full bg-background"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Strict}
        isValidConnection={isValidConnection}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={(params) => {
          const firstSelected = params.nodes[0]?.id ?? null;
          setSelectedId(firstSelected);
        }}
        fitView
      >
        <Background gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
