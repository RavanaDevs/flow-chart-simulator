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
      // Stadium / Pill shape (140x50, rx=25)
      const w = 140;
      const h = 50;
      const r = 25;
      return {
        width: w,
        height: h,
        pathD: `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${h / 2} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h / 2} A ${r} ${r} 0 0 1 ${r} 0 Z`,
      };
    }

    case "input":
    case "output": {
      // Parallelogram with 14px horizontal skew (180x60)
      const w = 180;
      const h = 60;
      const skew = 16;
      return {
        width: w,
        height: h,
        pathD: `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`,
      };
    }

    case "process": {
      // Rounded Rectangle (180x60, rx=8)
      const w = 180;
      const h = 60;
      const r = 8;
      return {
        width: w,
        height: h,
        pathD: `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`,
      };
    }

    case "if": {
      // Diamond shape (200x110)
      const w = 200;
      const h = 110;
      return {
        width: w,
        height: h,
        pathD: `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`,
      };
    }
  }
}
