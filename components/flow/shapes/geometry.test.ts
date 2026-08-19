import { describe, it, expect } from "vitest";
import { NodeKind } from "@/lib/graph/types";
import { GRID_SIZE } from "@/lib/graph/grid";
import { getShapeSize, SHAPE_UNIT, countLines } from "./geometry";

const KINDS: NodeKind[] = [
  "start",
  "stop",
  "input",
  "output",
  "process",
  "if",
];

describe("shape geometry", () => {
  it("keeps every dimension a whole number of shape units", () => {
    for (const kind of KINDS) {
      const { width, height } = getShapeSize(kind);
      expect(width % SHAPE_UNIT, `${kind} width`).toBe(0);
      expect(height % SHAPE_UNIT, `${kind} height`).toBe(0);
    }
  });

  it("puts centred ports on grid lines, so any two blocks can line up", () => {
    for (const kind of KINDS) {
      const { width, height } = getShapeSize(kind);
      // A port at an edge midpoint sits at position + half the dimension.
      // If that is not a whole grid step, snapping can never align it with
      // the port of a block of a different size.
      expect((width / 2) % GRID_SIZE, `${kind} horizontal centre`).toBe(0);
      expect((height / 2) % GRID_SIZE, `${kind} vertical centre`).toBe(0);
    }
  });

  it("lets differently-sized blocks share an exact centre line", () => {
    const startX = 240; // on the grid
    const start = getShapeSize("start");
    const decision = getShapeSize("if");

    // Place the decision block so their centres coincide.
    const decisionX = startX + start.width / 2 - decision.width / 2;

    expect(decisionX % GRID_SIZE).toBe(0); // reachable by snapping
    expect(startX + start.width / 2).toBe(decisionX + decision.width / 2);
  });

  it("keeps the alignment invariant as a block grows with its text", () => {
    for (const kind of KINDS) {
      for (let lines = 1; lines <= 8; lines++) {
        const { width, height } = getShapeSize(kind, lines);
        expect((width / 2) % GRID_SIZE, `${kind} @${lines} lines`).toBe(0);
        expect((height / 2) % GRID_SIZE, `${kind} @${lines} lines`).toBe(0);
      }
    }
  });

  it("grows only the blocks that hold multi-line text", () => {
    expect(getShapeSize("process", 3).height).toBeGreaterThan(
      getShapeSize("process", 1).height
    );
    expect(getShapeSize("input", 3).height).toBeGreaterThan(
      getShapeSize("input", 1).height
    );
    // A decision or a junction has nothing to grow for.
    expect(getShapeSize("if", 3)).toEqual(getShapeSize("if", 1));
    expect(getShapeSize("connector", 3)).toEqual(getShapeSize("connector", 1));
  });

  it("counts lines the way a textarea does", () => {
    expect(countLines(undefined)).toBe(1);
    expect(countLines("")).toBe(1);
    expect(countLines("x = 1")).toBe(1);
    expect(countLines("x = 1\ny = 2")).toBe(2);
    expect(countLines("a\nb\nc")).toBe(3);
  });
});
