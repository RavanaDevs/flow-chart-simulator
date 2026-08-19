import React from "react";
import { NodeKind } from "@/lib/graph/types";
import { getShapeGeometry } from "./geometry";
import { cn } from "@/lib/utils";

/** Where execution is, relative to this block. */
export type RunPhase = "active" | "finished" | "failed" | null;

type ShapeSvgProps = {
  kind: NodeKind;
  isSelected?: boolean;
  lines?: number;
  runPhase?: RunPhase;
  severity?: "error" | "warning" | null;
  className?: string;
};

export const ShapeSvg: React.FC<ShapeSvgProps> = ({
  kind,
  isSelected,
  lines = 1,
  runPhase,
  severity,
  className,
}) => {
  const { width, height, pathD } = getShapeGeometry(kind, lines);

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 transition-colors duration-150",
        className
      )}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <path
        d={pathD}
        className={cn(
          "fill-card stroke-border stroke-2 transition-all",
          // A junction is a point on the path, so it is drawn solid.
          kind === "connector" && "fill-muted-foreground stroke-muted-foreground",
          isSelected && "stroke-primary stroke-[2.5px] drop-shadow-md",
          // Running pulses; finished and failed settle. A continuous pulse on
          // a program that has ended reads as "still working".
          runPhase === "active" &&
            "fill-primary/10 stroke-primary stroke-[3px] animate-pulse",
          runPhase === "finished" &&
            "animate-node-settle fill-emerald-500/10 stroke-emerald-500 stroke-[3px]",
          runPhase === "failed" &&
            "animate-node-settle fill-destructive/10 stroke-destructive stroke-[3px]",
          severity === "error" && "stroke-destructive stroke-[2.5px] [stroke-dasharray:4_2]",
          severity === "warning" && "stroke-amber-500 stroke-[2.5px]"
        )}
      />
    </svg>
  );
};
