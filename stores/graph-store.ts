import { create } from "zustand";
import { FlowNode, FlowEdge, NodeId, EdgeId, NodeKind } from "@/lib/graph/types";
import { snapPosition } from "@/lib/graph/grid";
import { branchOf } from "@/lib/graph/handles";

export type GraphState = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedId: NodeId | null;
  revision: number;

  setSelectedId: (id: NodeId | null) => void;
  addNode: (kind: NodeKind, position: { x: number; y: number }, initialData?: Record<string, unknown>) => NodeId;
  removeNode: (id: NodeId) => void;
  moveNode: (id: NodeId, position: { x: number; y: number }) => void;
  updateNodeData: (id: NodeId, patch: Record<string, unknown>) => void;
  connect: (
    source: NodeId,
    target: NodeId,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ) => void;
  removeEdge: (id: EdgeId) => void;
  loadDocument: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  resetGraph: () => void;
};

const DEFAULT_START_NODE: FlowNode = {
  id: "start-node-1",
  kind: "start",
  position: { x: 240, y: 48 },
  data: {},
};

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [DEFAULT_START_NODE],
  edges: [],
  selectedId: null,
  revision: 1,

  setSelectedId: (id) => {
    if (get().selectedId !== id) {
      set({ selectedId: id });
    }
  },

  addNode: (kind, position, initialData = {}) => {
    const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let data: FlowNode["data"] = {} as FlowNode["data"];

    if (kind === "input") {
      data = { names: "x", valueType: "number", ...initialData };
    } else if (kind === "output") {
      data = { source: `"Hello"`, ...initialData };
    } else if (kind === "process") {
      data = { source: "x = 1", ...initialData };
    } else if (kind === "if") {
      data = { source: "x > 0", ...initialData };
    }

    const newNode: FlowNode = {
      id: newId,
      kind,
      position: snapPosition(position),
      data,
    } as FlowNode;

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedId: newId,
      revision: state.revision + 1,
    }));

    return newId;
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      revision: state.revision + 1,
    }));
  },

  moveNode: (id, position) => {
    const snapped = snapPosition(position);
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position: snapped } : n
      ),
    }));
  },

  updateNodeData: (id, patch) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              data: { ...n.data, ...patch },
            }
          : n
      ) as FlowNode[],
      revision: state.revision + 1,
    }));
  },

  connect: (source, target, sourceHandle = null, targetHandle = null) => {
    if (source === target) return; // Prevent self-loop

    const edges = get().edges;
    // At most one outgoing edge per logical branch. Checked on the branch, not
    // the port, so two different physical ports cannot feed the same branch.
    const existing = edges.find(
      (e) =>
        e.source === source &&
        branchOf(e.sourceHandle) === branchOf(sourceHandle)
    );
    if (existing) {
      return;
    }

    const newEdgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newEdge: FlowEdge = {
      id: newEdgeId,
      source,
      target,
      sourceHandle: sourceHandle ?? null,
      targetHandle: targetHandle ?? null,
    };

    set((state) => ({
      edges: [...state.edges, newEdge],
      revision: state.revision + 1,
    }));
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      revision: state.revision + 1,
    }));
  },

  loadDocument: (nodes, edges) => {
    set({
      nodes,
      edges,
      selectedId: null,
      revision: get().revision + 1,
    });
  },

  resetGraph: () => {
    set({
      nodes: [DEFAULT_START_NODE],
      edges: [],
      selectedId: null,
      revision: get().revision + 1,
    });
  },
}));
