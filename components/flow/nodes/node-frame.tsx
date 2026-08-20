import React from "react";
import { NodeKind } from "@/lib/graph/types";
import { getShapeGeometry } from "../shapes/geometry";
import { ShapeSvg, RunPhase } from "../shapes/shape-svg";
import { NodePorts } from "./node-ports";
import { useRunStore } from "@/stores/run-store";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Trash2 } from "lucide-react";
import { useGraphStore } from "@/stores/graph-store";

import { compile } from "@/lib/graph/compile";
import { useT } from "@/hooks/use-t";

type NodeFrameProps = {
  id: string;
  kind: NodeKind;
  isSelected?: boolean;
  severity?: "error" | "warning" | null;
  diagnosticMsg?: string;
  /** Accessible name for blocks that carry no visible text. */
  label?: string;
  /** Lines of text the block holds; it grows to fit them. */
  lines?: number;
  children: React.ReactNode;
};

export const NodeFrame: React.FC<NodeFrameProps> = ({
  id,
  kind,
  isSelected,
  severity: propSeverity,
  diagnosticMsg: propDiagnosticMsg,
  label,
  lines = 1,
  children,
}) => {
  const { width, height } = getShapeGeometry(kind, lines);
  const removeNode = useGraphStore((s) => s.removeNode);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const { resolveMessage } = useT();

  const diagnostic = React.useMemo(() => {
    if (propSeverity !== undefined) return null;
    const cRes = compile({ nodes, edges });
    const diags = cRes.ok ? cRes.program.warnings : cRes.diagnostics;
    return diags.find((d) => d.nodeId === id) || null;
  }, [nodes, edges, id, propSeverity]);

  const severity = propSeverity ?? diagnostic?.severity ?? null;
  const diagnosticMsg =
    propDiagnosticMsg ?? (diagnostic ? resolveMessage(diagnostic).message : undefined);

  const isCurrent = useRunStore((s) => s.state.currentNodeId === id);
  const status = useRunStore((s) => s.state.status);
  const runPhase: RunPhase = !isCurrent
    ? null
    : status === "finished"
      ? "finished"
      : status === "error"
        ? "failed"
        : status === "running" || status === "awaiting-input"
          ? "active"
          : null;

  return (
    <div
      className="group relative flex items-center justify-center select-none"
      title={label}
      style={{ width, height }}
    >
      <ShapeSvg
        kind={kind}
        isSelected={isSelected}
        lines={lines}
        runPhase={runPhase}
        severity={severity}
      />

      {/* Delete action button on selection or hover */}
      {kind !== "start" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeNode(id);
          }}
          className={cn(
            "absolute -top-3 -right-3 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm opacity-0 transition-opacity hover:scale-110 group-hover:opacity-100",
            isSelected && "opacity-100"
          )}
          title="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Diagnostic Badge Icon */}
      {severity && (
        <div
          className={cn(
            "absolute -top-2.5 left-2 z-30 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm",
            severity === "error" ? "bg-destructive" : "bg-amber-500"
          )}
          title={diagnosticMsg}
        >
          {severity === "error" ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
        </div>
      )}

      {/* Connection ports — rendered here rather than by each node so they
          share the frame's positioning context and its hover group. */}
      <NodePorts kind={kind} nodeId={id} />

      {/* Node Content Container */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-3 text-center text-xs font-medium">
        {children}
      </div>
    </div>
  );
};
