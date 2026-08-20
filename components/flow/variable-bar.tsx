"use client";

import React from "react";
import { useRunStore } from "@/stores/run-store";
import { formatValue } from "@/lib/lang/values";
import { useT } from "@/hooks/use-t";
import { Variable } from "lucide-react";

export const VariableBar: React.FC = () => {
  const { t } = useT();
  const variables = useRunStore((s) => s.state.variables);
  const entries = Object.entries(variables);

  if (entries.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex max-w-[85vw] items-center gap-2 overflow-x-auto rounded-full border border-border/80 bg-card/90 px-4 py-1.5 shadow-lg backdrop-blur text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 font-sans font-bold text-[11px] text-muted-foreground uppercase shrink-0 border-r border-border/60 pr-2.5">
        <Variable className="h-3.5 w-3.5 text-primary" />
        <span>{t("tab.values")}:</span>
      </div>
      <div className="flex items-center gap-2.5 overflow-x-auto py-0.5">
        {entries.map(([name, val]) => (
          <div
            key={name}
            className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-0.5 text-xs border border-border/40"
          >
            <span className="font-semibold text-foreground">{name}:</span>
            <span className="font-bold text-primary">{formatValue(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
