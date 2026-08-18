import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import { useRunStore } from "@/stores/run-store";
import { cn } from "@/lib/utils";

export const FlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const lastEdgeId = useRunStore((s) => s.state.lastEdgeId);
  const isTravelling = lastEdgeId === id;

  const isTrueBranch = sourceHandleId === "true";
  const isFalseBranch = sourceHandleId === "false";

  return (
    <>
      <BaseEdge
        path={edgePath}
        className={cn(
          "stroke-[2px] transition-colors",
          selected ? "stroke-primary stroke-[3px]" : "stroke-border",
          isTrueBranch && "stroke-emerald-500/70",
          isFalseBranch && "stroke-amber-500/70",
          isTravelling && "stroke-primary stroke-[3px]"
        )}
      />

      {/* Marching-ants execution travel path */}
      {isTravelling && (
        <path
          d={edgePath}
          fill="none"
          className="animate-marching-ants stroke-primary stroke-[3px] [stroke-dasharray:6_6]"
        />
      )}

      {/* True/False Branch Pill Label */}
      {sourceHandleId && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "nodrag nopan rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm ring-1",
              isTrueBranch && "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
              isFalseBranch && "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800"
            )}
          >
            {sourceHandleId}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
