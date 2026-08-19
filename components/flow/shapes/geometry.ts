import { NodeKind } from "@/lib/graph/types";
import { GRID_SIZE } from "@/lib/graph/grid";

export type ShapeGeometry = {
  width: number;
  height: number;
  pathD: string;
};

/**
 * Every dimension must be a multiple of this.
 *
 * Snapping moves a node's top-left corner onto the grid, but ports sit at the
 * midpoints of its edges. A port therefore lands on x + width/2 (or y +
 * height/2), so a centred port only falls on a grid line when half the
 * dimension is itself a whole number of grid steps.
 *
 * Get this wrong and two blocks of different widths can never be lined up: with
 * a 140-wide Start and a 180-wide Input, the closest reachable offset is 4px,
 * which getSmoothStepPath draws as a visible dogleg no amount of dragging can
 * remove.
 */
export const SHAPE_UNIT = GRID_SIZE * 2;

const SIZES: Record<NodeKind, { width: number; height: number }> = {
  start: { width: 160, height: 64 },
  stop: { width: 160, height: 64 },
  input: { width: 192, height: 64 },
  output: { width: 192, height: 64 },
  process: { width: 192, height: 64 },
  if: { width: 224, height: 128 },
  // A junction is a point, not a box — the smallest size the lattice allows.
  connector: { width: 32, height: 32 },
};

/** Inset so the stroke is not clipped by the SVG viewBox. */
const PAD = 2;

export function getShapeSize(kind: NodeKind): { width: number; height: number } {
  return SIZES[kind];
}

export function getShapeGeometry(kind: NodeKind): ShapeGeometry {
  const { width: w, height: h } = SIZES[kind];
  const p = PAD;

  switch (kind) {
    case "start":
    case "stop": {
      // Stadium: the radius is half the height, so the ends are true semicircles.
      const r = (h - p * 2) / 2;
      return {
        width: w,
        height: h,
        pathD: `M ${r + p} ${p} L ${w - r - p} ${p} A ${r} ${r} 0 0 1 ${w - p} ${h / 2} A ${r} ${r} 0 0 1 ${w - r - p} ${h - p} L ${r + p} ${h - p} A ${r} ${r} 0 0 1 ${p} ${h / 2} A ${r} ${r} 0 0 1 ${r + p} ${p} Z`,
      };
    }

    case "input":
    case "output": {
      // Parallelogram. The skew only shifts the outline; ports stay on the
      // bounding box edges, so it does not affect alignment.
      const skew = 16;
      return {
        width: w,
        height: h,
        pathD: `M ${skew + p} ${p} L ${w - p} ${p} L ${w - skew - p} ${h - p} L ${p} ${h - p} Z`,
      };
    }

    case "process": {
      const r = 8;
      return {
        width: w,
        height: h,
        pathD: `M ${r + p} ${p} L ${w - r - p} ${p} A ${r} ${r} 0 0 1 ${w - p} ${r + p} L ${w - p} ${h - r - p} A ${r} ${r} 0 0 1 ${w - r - p} ${h - p} L ${r + p} ${h - p} A ${r} ${r} 0 0 1 ${p} ${h - r - p} L ${p} ${r + p} A ${r} ${r} 0 0 1 ${r + p} ${p} Z`,
      };
    }

    case "if": {
      return {
        width: w,
        height: h,
        pathD: `M ${w / 2} ${p} L ${w - p} ${h / 2} L ${w / 2} ${h - p} L ${p} ${h / 2} Z`,
      };
    }

    case "connector": {
      const r = (Math.min(w, h) - p * 2) / 2;
      const cx = w / 2;
      const cy = h / 2;
      return {
        width: w,
        height: h,
        pathD: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`,
      };
    }
  }
}
