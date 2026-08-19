import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import { useRunStore } from "@/stores/run-store";
import { EDGE_COLORS } from "../constants";
import { branchOf } from "@/lib/graph/handles";
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
  markerEnd,
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

  // "false-left" and "false-right" are internal port ids; a student only
  // ever sees the branch name.
  const branch = branchOf(sourceHandleId);
  const isTrueBranch = branch === "true";
  const isFalseBranch = branch === "false";

  // The stroke reads from the same constant the arrowhead marker was built
  // from, so a line and its head can never end up different colours.
  const baseColor = isTrueBranch
    ? EDGE_COLORS.true
    : isFalseBranch
      ? EDGE_COLORS.false
      : EDGE_COLORS.default;

  const stroke = isTravelling || selected ? EDGE_COLORS.active : baseColor;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: isTravelling || selected ? 3 : 2,
        }}
      />

      {/* Marching-ants execution travel path */}
      {isTravelling && (
        <path
          d={edgePath}
          fill="none"
          strokeWidth={3}
          stroke={EDGE_COLORS.active}
          className="animate-marching-ants [stroke-dasharray:6_6]"
        />
      )}

      {/* True/False Branch Pill Label */}
      {branch && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "nodrag nopan rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm ring-1",
              isTrueBranch &&
                "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
              isFalseBranch &&
                "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800"
            )}
          >
            {branch}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
