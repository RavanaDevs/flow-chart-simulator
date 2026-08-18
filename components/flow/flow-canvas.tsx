"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ConnectionMode,
  OnSelectionChangeParams,
} from "@xyflow/react";
import { nodeTypes, edgeTypes } from "./node-types";
import { useGraphStore } from "@/stores/graph-store";
import { NodeKind, FlowNode, FlowEdge } from "@/lib/graph/types";
import { toast } from "sonner";

/**
 * Reuse the existing canvas node whenever nothing semantic changed, so a
 * document update never resets a node's measured size or selection — and
 * never hands React Flow a stale position mid-drag.
 */
function mergeNodes(prev: Node[], nodes: FlowNode[]): Node[] {
  const prevById = new Map(prev.map((n) => [n.id, n]));

  return nodes.map((n) => {
    const existing = prevById.get(n.id);
    if (
      existing &&
      existing.type === n.kind &&
      existing.data === n.data &&
      existing.position.x === n.position.x &&
      existing.position.y === n.position.y
    ) {
      return existing;
    }
    return {
      ...existing,
      id: n.id,
      type: n.kind,
      position: n.position,
      data: n.data as Record<string, unknown>,
      selected: existing?.selected ?? false,
    } satisfies Node;
  });
}

function mergeEdges(prev: Edge[], edges: FlowEdge[]): Edge[] {
  const prevById = new Map(prev.map((e) => [e.id, e]));

  return edges.map((e) => {
    const existing = prevById.get(e.id);
    if (
      existing &&
      existing.source === e.source &&
      existing.target === e.target &&
      existing.sourceHandle === e.sourceHandle
    ) {
      return existing;
    }
    return {
      ...existing,
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      type: "smoothstep",
    } satisfies Edge;
  });
}

/**
 * React Flow owns transient interaction state (drag position, selection,
 * measured size) in local state. The graph store is the document: it only
 * receives committed changes — a finished drag, a deletion, a new edge.
 */
export const FlowCanvas: React.FC = () => {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const connect = useGraphStore((s) => s.connect);
  const moveNode = useGraphStore((s) => s.moveNode);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const setSelectedId = useGraphStore((s) => s.setSelectedId);

  const screenToFlowPosition = useReactFlow().screenToFlowPosition;

  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  // Sync document -> canvas during render (React's "adjust state when a prop
  // changes" pattern) rather than in an effect, so the canvas never paints a
  // frame with stale node positions.
  const [syncedNodes, setSyncedNodes] = useState(nodes);
  if (syncedNodes !== nodes) {
    setSyncedNodes(nodes);
    setRfNodes(mergeNodes(rfNodes, nodes));
  }

  const [syncedEdges, setSyncedEdges] = useState(edges);
  if (syncedEdges !== edges) {
    setSyncedEdges(edges);
    setRfEdges(mergeEdges(rfEdges, edges));
  }

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setRfNodes((nds) => applyNodeChanges(changes, nds));
      for (const change of changes) {
        if (change.type === "remove") {
          removeNode(change.id);
        }
      }
    },
    [removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setRfEdges((eds) => applyEdgeChanges(changes, eds));
      for (const change of changes) {
        if (change.type === "remove") {
          removeEdge(change.id);
        }
      }
    },
    [removeEdge]
  );

  // Commit the position once, when the drag finishes.
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent | MouseEvent | TouchEvent, node: Node) => {
      moveNode(node.id, node.position);
    },
    [moveNode]
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
        toast.error(
          "That block already has an arrow coming out of it. Delete the old arrow first."
        );
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

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const firstSelected = params.nodes[0]?.id ?? null;
      if (useGraphStore.getState().selectedId !== firstSelected) {
        setSelectedId(firstSelected);
      }
    },
    [setSelectedId]
  );

  // Drag and drop block from Palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const kind = event.dataTransfer.getData(
        "application/reactflow-kind"
      ) as NodeKind;
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        fitView
      >
        <Background gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
