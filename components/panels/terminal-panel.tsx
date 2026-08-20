"use client";

import React, { useRef, useEffect } from "react";
import { useRunStore } from "@/stores/run-store";
import { TerminalLine } from "./terminal-line";
import { useT } from "@/hooks/use-t";
import { Terminal as TerminalIcon, ChevronsUp } from "lucide-react";

export const TerminalPanel: React.FC = () => {
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const terminal = useRunStore((s) => s.state.terminal);
  const truncated = useRunStore((s) => s.state.terminalTruncated);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [terminal.length]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full space-y-2 overflow-y-auto bg-card p-3 select-text"
    >
      {truncated && (
        <div className="flex items-center gap-1.5 rounded border border-border bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground italic">
          <ChevronsUp className="h-3 w-3 shrink-0" />
          <span>
            {t("panel.terminal.olderTruncated")}
          </span>
        </div>
      )}

      {terminal.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
          <TerminalIcon className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-xs font-medium">{t("panel.terminal.empty")}</p>
          <p className="text-[11px] opacity-70">
            {t("panel.terminal.emptyDesc")}
          </p>
        </div>
      ) : (
        terminal.map((line, idx) => <TerminalLine key={idx} line={line} />)
      )}
    </div>
  );
};
