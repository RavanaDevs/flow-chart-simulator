import { describe, it, expect } from "vitest";
import { importDocument } from "./document";

/** A document exactly as an older build wrote it. */
const V1_DOCUMENT = JSON.stringify({
  version: 1,
  nodes: [
    { id: "s", kind: "start", position: { x: 0, y: 0 }, data: {} },
    {
      id: "i",
      kind: "input",
      position: { x: 0, y: 100 },
      data: { varName: "age", valueType: "number" },
    },
    {
      id: "d",
      kind: "if",
      position: { x: 0, y: 200 },
      data: { source: "age > 17" },
    },
    { id: "e", kind: "stop", position: { x: 0, y: 300 }, data: {} },
  ],
  edges: [
    { id: "e1", source: "s", target: "i", sourceHandle: null },
    { id: "e2", source: "i", target: "d", sourceHandle: null },
    { id: "e3", source: "d", target: "e", sourceHandle: "true" },
    { id: "e4", source: "d", target: "i", sourceHandle: "false" },
  ],
});

describe("document migration", () => {
  it("opens a v1 document without losing work", () => {
    const res = importDocument(V1_DOCUMENT);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.doc.nodes).toHaveLength(4);
    expect(res.doc.edges).toHaveLength(4);
  });

  it("carries a v1 input block's single varName over to the names list", () => {
    const res = importDocument(V1_DOCUMENT);
    if (!res.ok) return;

    const input = res.doc.nodes.find((n) => n.id === "i");
    expect(input?.data).toMatchObject({ names: "age", valueType: "number" });
    expect(input?.data).not.toHaveProperty("varName");
  });

  it("maps v1 branch names onto the ports they used to render at", () => {
    const res = importDocument(V1_DOCUMENT);
    if (!res.ok) return;

    const byId = Object.fromEntries(res.doc.edges.map((e) => [e.id, e]));
    expect(byId.e3.sourceHandle).toBe("true-bottom");
    // false used to sit on the right vertex, so the layout does not move.
    expect(byId.e4.sourceHandle).toBe("false-right");
    expect(byId.e1.sourceHandle).toBe("port-bottom");
  });

  it("gives every v1 edge the inlet blocks used to have", () => {
    const res = importDocument(V1_DOCUMENT);
    if (!res.ok) return;

    for (const edge of res.doc.edges) {
      expect(edge.targetHandle).toBe("port-top");
    }
  });

  it("refuses a document from a newer build rather than half-loading it", () => {
    const res = importDocument(JSON.stringify({ version: 99, nodes: [], edges: [] }));
    expect(res.ok).toBe(false);
  });
});
