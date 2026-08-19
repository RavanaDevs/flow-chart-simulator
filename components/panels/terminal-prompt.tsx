"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRunStore } from "@/stores/run-store";
import { useT } from "@/hooks/use-t";
import { ChevronRight } from "lucide-react";

export const TerminalPrompt: React.FC = () => {
  const { t } = useT();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, submitInput } = useRunStore();

  useEffect(() => {
    if (state.status === "awaiting-input") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [state.status, state.pendingInput?.nodeId]);

  if (state.status !== "awaiting-input" || !state.pendingInput) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === "" && state.pendingInput?.type === "number") return;
    submitInput(value);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 py-0.5 font-mono text-xs"
    >
      <ChevronRight className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary" />
      <span className="font-semibold text-foreground">
        {state.pendingInput.varName} &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode={state.pendingInput.type === "number" ? "decimal" : "text"}
        spellCheck={false}
        autoComplete="off"
        className="flex-1 border-none bg-transparent p-0 font-mono text-xs font-semibold text-foreground caret-primary outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
        placeholder={t("panel.terminal.typeInputPlaceholder", { type: state.pendingInput.type })}
      />
    </form>
  );
};
