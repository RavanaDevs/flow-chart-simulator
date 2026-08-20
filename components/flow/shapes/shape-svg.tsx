import React from "react";
import { NodeKind } from "@/lib/graph/types";
import { getShapeGeometry, KIND_COLOR_TOKENS } from "./geometry";
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
  const tokenVar = KIND_COLOR_TOKENS[kind];
  const showRing = isSelected || Boolean(runPhase);

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
      {/* Outer Ring Path (drawn underneath) */}
      {showRing && (
        <path
          d={pathD}
          className={cn(
            "fill-none transition-all pointer-events-none",
            runPhase === "active" && "stroke-primary stroke-[6px] animate-pulse opacity-80",
            runPhase === "finished" && "stroke-emerald-500 stroke-[6px] animate-node-settle opacity-80",
            runPhase === "failed" && "stroke-destructive stroke-[6px] animate-node-settle opacity-80",
            !runPhase && isSelected && "stroke-primary stroke-[1.5px]"
          )}
        />
      )}

      {/* Main Shape Path */}
      <path
        d={pathD}
        className={cn(
          "stroke-2 transition-all",
          isSelected && "stroke-[2.5px] drop-shadow-md",
          runPhase === "failed" && "stroke-destructive stroke-[3px]",
          severity === "error" && "stroke-destructive stroke-[2.5px] [stroke-dasharray:4_2]",
          severity === "warning" && "stroke-amber-500 stroke-[2.5px]"
        )}
        style={{
          stroke:
            runPhase === "failed" || severity === "error" || severity === "warning"
              ? undefined
              : `var(${tokenVar})`,
          fill: `color-mix(in oklch, var(${tokenVar}) 12%, var(--card))`,
        }}
      />
    </svg>
  );
};
