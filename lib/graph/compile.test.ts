import { describe, it, expect } from "vitest";
import { compile } from "./compile";
import { FlowGraph } from "./types";

describe("compile", () => {
  it("compiles a valid simple start -> process -> output -> stop graph", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "1", kind: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "2",
          kind: "process",
          position: { x: 0, y: 100 },
          data: { source: "x = 10" },
        },
        {
          id: "3",
          kind: "output",
          position: { x: 0, y: 200 },
          data: { source: "x + 1" },
        },
        { id: "4", kind: "stop", position: { x: 0, y: 300 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "1", target: "2", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e2", source: "2", target: "3", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e3", source: "3", target: "4", sourceHandle: "port-bottom", targetHandle: null },
      ],
    };

    const res = compile(graph);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.program.entryId).toBe("1");
    expect(Object.keys(res.program.nodes)).toEqual(["1", "2", "3", "4"]);
  });

  it("emits NO_START error when start node is missing", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "1", kind: "stop", position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [],
    };
    const res = compile(graph);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.diagnostics[0].code).toBe("NO_START");
  });

  it("emits DANGLING_OUTPUT error when non-stop node has no outgoing edge", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "1", kind: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "2",
          kind: "process",
          position: { x: 0, y: 100 },
          data: { source: "x = 5" },
        },
      ],
      edges: [{ id: "e1", source: "1", target: "2", sourceHandle: "port-bottom", targetHandle: null }],
    };
    const res = compile(graph);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    const err = res.diagnostics.find((d) => d.code === "DANGLING_OUTPUT");
    expect(err).toBeDefined();
    expect(err?.nodeId).toBe("2");
  });

  it("emits UNCONNECTED_BRANCH when if node misses true/false handle edge", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "1", kind: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "2",
          kind: "if",
          position: { x: 0, y: 100 },
          data: { source: "x > 0" },
        },
        { id: "3", kind: "stop", position: { x: 0, y: 200 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "1", target: "2", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e2", source: "2", target: "3", sourceHandle: "true-bottom", targetHandle: null },
      ],
    };
    const res = compile(graph);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    const err = res.diagnostics.find((d) => d.code === "UNCONNECTED_BRANCH");
    expect(err).toBeDefined();
    expect(err?.handle).toBe("false");
  });

  it("emits UNREACHABLE_NODE warning for orphan nodes", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "1", kind: "start", position: { x: 0, y: 0 }, data: {} },
        { id: "2", kind: "stop", position: { x: 0, y: 100 }, data: {} },
        {
          id: "orphan",
          kind: "process",
          position: { x: 500, y: 500 },
          data: { source: "y = 99" },
        },
      ],
      edges: [{ id: "e1", source: "1", target: "2", sourceHandle: "port-bottom", targetHandle: null }],
    };
    const res = compile(graph);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const warn = res.program.warnings.find(
      (w) => w.code === "UNREACHABLE_NODE"
    );
    expect(warn).toBeDefined();
    expect(warn?.nodeId).toBe("orphan");
    expect(res.program.nodes["orphan"]).toBeUndefined();
  });

  it("treats both false ports as one branch, not two exits", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "s", kind: "start", position: { x: 0, y: 0 }, data: {} },
        {
          id: "d",
          kind: "if",
          position: { x: 0, y: 1 },
          data: { source: "true" },
        },
        { id: "a", kind: "stop", position: { x: 0, y: 2 }, data: {} },
        { id: "b", kind: "stop", position: { x: 1, y: 2 }, data: {} },
        { id: "c", kind: "stop", position: { x: 2, y: 2 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "s", target: "d", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e2", source: "d", target: "a", sourceHandle: "true-bottom", targetHandle: null },
        { id: "e3", source: "d", target: "b", sourceHandle: "false-left", targetHandle: null },
        { id: "e4", source: "d", target: "c", sourceHandle: "false-right", targetHandle: null },
      ],
    };

    const res = compile(graph);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(
      res.diagnostics.some((d) => d.code === "MULTIPLE_OUTGOING_EDGES")
    ).toBe(true);
  });

  it("rejects an arrow pointing into Start", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "s", kind: "start", position: { x: 0, y: 0 }, data: {} },
        { id: "p", kind: "process", position: { x: 0, y: 1 }, data: { source: "x = 1" } },
        { id: "e", kind: "stop", position: { x: 0, y: 2 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "s", target: "p", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e2", source: "p", target: "e", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e3", source: "p", target: "s", sourceHandle: "port-left", targetHandle: null },
      ],
    };

    const res = compile(graph);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.diagnostics.some((d) => d.code === "START_HAS_INBOUND")).toBe(true);
  });

  it("rejects an arrow leading out of Stop", () => {
    const graph: FlowGraph = {
      nodes: [
        { id: "s", kind: "start", position: { x: 0, y: 0 }, data: {} },
        { id: "e", kind: "stop", position: { x: 0, y: 1 }, data: {} },
        { id: "p", kind: "process", position: { x: 0, y: 2 }, data: { source: "x = 1" } },
      ],
      edges: [
        { id: "e1", source: "s", target: "e", sourceHandle: "port-bottom", targetHandle: null },
        { id: "e2", source: "e", target: "p", sourceHandle: "port-bottom", targetHandle: null },
      ],
    };

    const res = compile(graph);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.diagnostics.some((d) => d.code === "STOP_HAS_OUTGOING")).toBe(true);
  });
});
