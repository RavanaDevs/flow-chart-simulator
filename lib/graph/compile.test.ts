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
        { id: "e1", source: "1", target: "2", sourceHandle: null },
        { id: "e2", source: "2", target: "3", sourceHandle: null },
        { id: "e3", source: "3", target: "4", sourceHandle: null },
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
      edges: [{ id: "e1", source: "1", target: "2", sourceHandle: null }],
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
        { id: "e1", source: "1", target: "2", sourceHandle: null },
        { id: "e2", source: "2", target: "3", sourceHandle: "true" },
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
      edges: [{ id: "e1", source: "1", target: "2", sourceHandle: null }],
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
});
