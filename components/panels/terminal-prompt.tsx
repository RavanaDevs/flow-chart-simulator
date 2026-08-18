import React, { useState, useEffect, useRef } from "react";
import { useRunStore } from "@/stores/run-store";
import { ChevronRight, Send } from "lucide-react";

export const TerminalPrompt: React.FC = () => {
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
      className="my-1.5 flex items-center gap-2 rounded-md border border-primary bg-accent/40 p-2 shadow-xs"
    >
      <ChevronRight className="h-4 w-4 shrink-0 text-primary animate-pulse" />
      <span className="font-mono text-xs font-semibold text-foreground">
        {state.pendingInput.varName} &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode={state.pendingInput.type === "number" ? "decimal" : "text"}
        placeholder={`Enter ${state.pendingInput.type} value...`}
        className="flex-1 bg-transparent font-mono text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground hover:opacity-90"
        title="Submit input (Enter)"
      >
        <Send className="h-3 w-3" />
      </button>
    </form>
  );
};
