"use client";

import React, { useMemo } from "react";
import { useGraphStore } from "@/stores/graph-store";
import { compile } from "@/lib/graph/compile";
import { useT } from "@/hooks/use-t";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReactFlow } from "@xyflow/react";

export const ProblemsPanel: React.FC = () => {
  const { t, resolveMessage } = useT();
  const { nodes, edges, setSelectedId } = useGraphStore();
  const { setCenter, getZoom } = useReactFlow();

  const cRes = useMemo(() => compile({ nodes, edges }), [nodes, edges]);

  const diagnostics = useMemo(() => {
    if (!cRes.ok) return cRes.diagnostics;
    return cRes.program.warnings;
  }, [cRes]);

  const handlePanToNode = (nodeId?: string) => {
    if (!nodeId) return;
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    setSelectedId(nodeId);
    setCenter(targetNode.position.x + 90, targetNode.position.y + 30, {
      zoom: getZoom() || 1,
      duration: 400,
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-card p-3 select-text space-y-2">
      {diagnostics.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-500 opacity-80" />
          <p className="text-xs font-semibold text-foreground">{t("panel.problems.empty")}</p>
          <p className="text-[11px] opacity-70">{t("panel.problems.emptyDesc")}</p>
        </div>
      ) : (
        diagnostics.map((diag, idx) => {
          const { message, hint } = resolveMessage(diag);
          const isError = diag.severity === "error";

          return (
            <div
              key={idx}
              onClick={() => handlePanToNode(diag.nodeId)}
              className="cursor-pointer rounded-lg border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary hover:bg-accent/40"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  {isError ? (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className={isError ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>
                    {message}
                  </span>
                </div>
                <Badge
                  variant={isError ? "destructive" : "outline"}
                  className="text-[9px] uppercase font-bold shrink-0"
                >
                  {diag.severity}
                </Badge>
              </div>

              {hint && (
                <p className="text-[11px] text-muted-foreground leading-normal pl-5">
                  💡 {hint}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
