import { NodeKind } from "@/lib/graph/types";

export type ShapeGeometry = {
  width: number;
  height: number;
  pathD: string;
};

export function getShapeGeometry(kind: NodeKind): ShapeGeometry {
  switch (kind) {
    case "start":
    case "stop": {
      // Stadium / Pill shape (140x50, rx=23, p=2)
      const w = 140;
      const h = 50;
      const p = 2;
      const r = 23;
      return {
        width: w,
        height: h,
        pathD: `M ${r + p} ${p} L ${w - r - p} ${p} A ${r} ${r} 0 0 1 ${w - p} ${h / 2} A ${r} ${r} 0 0 1 ${w - r - p} ${h - p} L ${r + p} ${h - p} A ${r} ${r} 0 0 1 ${p} ${h / 2} A ${r} ${r} 0 0 1 ${r + p} ${p} Z`,
      };
    }

    case "input":
    case "output": {
      // Parallelogram with horizontal skew (180x60, p=2)
      const w = 180;
      const h = 60;
      const p = 2;
      const skew = 18;
      return {
        width: w,
        height: h,
        pathD: `M ${skew + p} ${p} L ${w - p} ${p} L ${w - skew - p} ${h - p} L ${p} ${h - p} Z`,
      };
    }

    case "process": {
      // Rounded Rectangle (180x60, rx=8, p=2)
      const w = 180;
      const h = 60;
      const p = 2;
      const r = 8;
      return {
        width: w,
        height: h,
        pathD: `M ${r + p} ${p} L ${w - r - p} ${p} A ${r} ${r} 0 0 1 ${w - p} ${r + p} L ${w - p} ${h - r - p} A ${r} ${r} 0 0 1 ${w - r - p} ${h - p} L ${r + p} ${h - p} A ${r} ${r} 0 0 1 ${p} ${h - r - p} L ${p} ${r + p} A ${r} ${r} 0 0 1 ${r + p} ${p} Z`,
      };
    }

    case "if": {
      // Diamond shape (200x110, p=2)
      const w = 200;
      const h = 110;
      const p = 2;
      return {
        width: w,
        height: h,
        pathD: `M ${w / 2} ${p} L ${w - p} ${h / 2} L ${w / 2} ${h - p} L ${p} ${h / 2} Z`,
      };
    }
  }
}
