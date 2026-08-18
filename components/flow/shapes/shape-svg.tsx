import React from "react";
import { NodeKind } from "@/lib/graph/types";
import { getShapeGeometry } from "./geometry";
import { cn } from "@/lib/utils";

type ShapeSvgProps = {
  kind: NodeKind;
  isSelected?: boolean;
  isActive?: boolean;
  severity?: "error" | "warning" | null;
  className?: string;
};

export const ShapeSvg: React.FC<ShapeSvgProps> = ({
  kind,
  isSelected,
  isActive,
  severity,
  className,
}) => {
  const { width, height, pathD } = getShapeGeometry(kind);

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
          isSelected && "stroke-primary stroke-[2.5px] drop-shadow-md",
          isActive && "fill-primary/10 stroke-primary stroke-[3px] animate-pulse",
          severity === "error" && "stroke-destructive stroke-[2.5px] [stroke-dasharray:4_2]",
          severity === "warning" && "stroke-amber-500 stroke-[2.5px]"
        )}
      />
    </svg>
  );
};
