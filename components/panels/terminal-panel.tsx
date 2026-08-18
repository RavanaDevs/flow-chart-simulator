"use client";

import React, { useRef, useEffect } from "react";
import { useRunStore } from "@/stores/run-store";
import { TerminalLine } from "./terminal-line";
import { TerminalPrompt } from "./terminal-prompt";
import { Terminal as TerminalIcon } from "lucide-react";

export const TerminalPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminal = useRunStore((s) => s.state.terminal);

  // Autoscroll to bottom when lines change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (isAtBottom || true) {
      el.scrollTop = el.scrollHeight;
    }
  }, [terminal.length]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto bg-card p-3 space-y-2 select-text"
    >
      {terminal.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
          <TerminalIcon className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs font-medium">Terminal log is empty</p>
          <p className="text-[11px] opacity-70">Click Run or Step to execute your flowchart</p>
        </div>
      ) : (
        terminal.map((line, idx) => <TerminalLine key={idx} line={line} />)
      )}

      <TerminalPrompt />
    </div>
  );
};
