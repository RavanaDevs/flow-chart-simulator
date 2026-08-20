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

/** Blocks whose text can run to several lines, and which grow to fit. */
const GROWS: Record<NodeKind, boolean> = {
  start: false,
  stop: false,
  input: true,
  output: true,
  process: true,
  if: false,
  connector: false,
};

/** Maps each node kind to its theme block color token name. */
export const KIND_COLOR_TOKENS: Record<NodeKind, string> = {
  start: "--block-start",
  process: "--block-process",
  input: "--block-input",
  output: "--block-output",
  if: "--block-if",
  stop: "--block-stop",
  connector: "--block-connector",
};

/** Inset so the stroke and outer ring are not clipped by the SVG viewBox. */
const PAD = 4;

/**
 * Extra height per line beyond the first. A whole SHAPE_UNIT, because a block
 * that grows by anything less would break the centre-line alignment that
 * lets ports on different blocks line up.
 */
const LINE_HEIGHT = SHAPE_UNIT;

/** How many lines a block's text occupies. Blocks are sized from this. */
export function countLines(text: string | undefined): number {
  if (!text) return 1;
  return Math.max(1, text.split("\n").length);
}

export function getShapeSize(
  kind: NodeKind,
  lines = 1
): { width: number; height: number } {
  const base = SIZES[kind];
  if (!GROWS[kind] || lines <= 1) return base;
  return { width: base.width, height: base.height + (lines - 1) * LINE_HEIGHT };
}

export function getShapeGeometry(kind: NodeKind, lines = 1): ShapeGeometry {
  const { width: w, height: h } = getShapeSize(kind, lines);
  const p = PAD;

  switch (kind) {
    case "start":
    case "stop": {
      // Stadium: the radius is half the height, so the ends are true semicircles.
      const r = Math.min((h - p * 2) / 2, (w - p * 2) / 2);
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
