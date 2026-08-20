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
  MarkerType,
  OnSelectionChangeParams,
} from "@xyflow/react";
import { nodeTypes, edgeTypes } from "./node-types";
import { useGraphStore } from "@/stores/graph-store";
import { NodeKind, FlowNode, FlowEdge } from "@/lib/graph/types";
import { GRID_SIZE } from "@/lib/graph/grid";
import {
  branchOf,
  acceptsInbound,
  allowsOutbound,
} from "@/lib/graph/handles";
import { EDGE_COLORS } from "./constants";
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

function edgeColor(sourceHandle: string | null): string {
  const branch = branchOf(sourceHandle);
  if (branch === "true") return EDGE_COLORS.true;
  if (branch === "false") return EDGE_COLORS.false;
  return EDGE_COLORS.default;
}

function mergeEdges(prev: Edge[], edges: FlowEdge[]): Edge[] {
  const prevById = new Map(prev.map((e) => [e.id, e]));

  return edges.map((e) => {
    const existing = prevById.get(e.id);
    if (
      existing &&
      existing.source === e.source &&
      existing.target === e.target &&
      existing.sourceHandle === e.sourceHandle &&
      existing.targetHandle === e.targetHandle
    ) {
      return existing;
    }
    return {
      ...existing,
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: edgeColor(e.sourceHandle),
      },
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

  // Seed the mirrors from the document rather than from an empty array. The
  // sync below only fires when the store's identity *changes*, so a canvas that
  // mounts when the document already exists — after a page refresh, or on the
  // remount that collapsing the right rail causes — would otherwise render
  // nothing at all until the next edit happened to change that identity.
  const [rfNodes, setRfNodes] = useState<Node[]>(() => mergeNodes([], nodes));
  const [rfEdges, setRfEdges] = useState<Edge[]>(() => mergeEdges([], edges));

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

  /**
   * Ports exist on all four sides and each one both sends and receives, so
   * direction is no longer guaranteed by a handle simply not existing. It is
   * enforced here, and again in compile() for anything arriving by import.
   */
  const isValidConnection = useCallback(
    (connection: Connection | Edge): boolean => {
      // A block looping straight back to itself is always an infinite loop.
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      if (!allowsOutbound(sourceNode.kind)) {
        toast.error("Stop ends the program, so nothing can come after it.");
        return false;
      }

      if (!acceptsInbound(targetNode.kind)) {
        toast.error("Start is where the flowchart begins — nothing leads into it.");
        return false;
      }

      // One outgoing edge per logical branch. Checked on the branch so the
      // two false ports on a decision block count as one exit, not two.
      const branch = branchOf(connection.sourceHandle ?? null);
      const occupied = edges.find(
        (e) =>
          e.source === connection.source &&
          branchOf(e.sourceHandle) === branch
      );

      if (occupied) {
        toast.error(
          branch
            ? `The ${branch} path of that block already has an arrow. Delete the old one first.`
            : "That block already has an arrow coming out of it. Delete the old arrow first."
        );
        return false;
      }

      return true;
    },
    [edges, nodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      connect(
        connection.source,
        connection.target,
        connection.sourceHandle ?? null,
        connection.targetHandle ?? null
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
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        snapToGrid
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        fitView
      >
        <Background gap={GRID_SIZE} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
